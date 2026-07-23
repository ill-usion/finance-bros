from __future__ import annotations

import os
import sys
from typing import Any, AsyncGenerator, Literal, TypedDict
from dotenv import load_dotenv

from langchain_core.messages import (
    AIMessage,
    AIMessageChunk,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.tools import StructuredTool
from langchain.chat_models import init_chat_model, BaseChatModel
from pydantic import BaseModel, Field


sys.path.append("..")
from server.utils import load_options

load_dotenv()
options = load_options("options.yml")


class ChatMessage(TypedDict):
    role: Literal["user", "assistant"]
    content: str


SpendingCategory = Literal[
    "Food", "Transportation", "Leisure", "Subscription", "Groceries", "Other"
]


class LogSpendingArgs(BaseModel):
    amount: float = Field(description="Amount spent, in OMR, as a positive number.")
    category: SpendingCategory = Field(description="Spending category.")
    product: str = Field(description="Short description of what it was for, e.g. 'Lunch' or 'Taxi'.")


def _log_spending_noop(**kwargs: Any) -> str:
    # Never actually invoked: the tool call is intercepted in astream() and
    # handed to the frontend, which performs the real write (spending data
    # lives in the client's own storage, not on the server).
    return "logged"


LOG_SPENDING_TOOL_NAME = "log_spending"

log_spending_tool = StructuredTool.from_function(
    func=_log_spending_noop,
    name=LOG_SPENDING_TOOL_NAME,
    description=(
        "Log a single spending entry to the user's budget tracker. Only call "
        "this after the user has explicitly approved logging that specific "
        'spending in this conversation (e.g. they replied "yes", "log it", '
        '"go ahead").'
    ),
    args_schema=LogSpendingArgs,
)


SYSTEM_PROMPT = """
You are MEEZAN's financial analyst — a friendly, direct advisor helping a user manage their budget through chat.

On every turn you are given the user's current financial context:

- monthly income
- weekly budget
- saving percentage goal that is taken from the weekly budget
- today's spending so far
- this week's spending so far
- last week's spending
- a category breakdown, if available

Use this context to answer the user's questions and proactively steer them
toward staying aligned with their weekly budget and saving goal. Be concise,
warm, and practical — a short chat reply, not an essay. Reference concrete
numbers (in OMR) when it helps. If they're overspending or on pace to blow
their budget, say so plainly and suggest a specific, actionable adjustment.
If they're on track, be encouraging rather than repetitive. Never invent
figures you were not given. Do not infer user decisions, if you are unsure, ask for clarification.
Only use the data provided in the context. Do not make assumptions about the
user's financial situation or spending habits beyond what is explicitly stated in the context.

You also have a `log_spending` tool that records a spending entry directly
to the user's budget tracker. Rules for using it:

- When the user mentions a purchase they're making or considering (e.g. "can
  I buy a meal for 3 OMR?"), answer their question against their remaining
  budget first, then ask if they'd like you to log it. Do NOT call the tool
  on this turn.
- Only call `log_spending` after the user has clearly approved logging that
  specific spending (e.g. "yes", "log it", "go ahead", "please do") in their
  most recent message. Never call it speculatively, for hypothetical
  purchases, or without an explicit approval message from the user.
- You'll be told once the log succeeds — when that happens, reply with a
  short, natural confirmation (e.g. "Done — logged 3 OMR for that meal under
  Food."). You don't need to say anything else on the turn where you call
  the tool itself.
- Only log what the user approved. If the amount, category, or what it was
  for is unclear, ask before calling the tool.

Respond in {language}.
"""

CONTEXT_TEMPLATE = """
Current financial context:

Monthly income: {monthly_income}
Weekly budget: {weekly_budget}
Saving percentage goal: {saving_percentage}%
Today's spending: {today_spending}
This week's spending: {week_spending}
Last week's spending: {last_week_spending}
Category breakdown this week: {category_breakdown}
"""


class FinancialAnalystInteractive:

    def __init__(self, llm: BaseChatModel):
        self.llm = llm.bind_tools([log_spending_tool])

    def _build_messages(
        self,
        *,
        history: list[ChatMessage],
        context: dict,
        language: str,
    ) -> list[BaseMessage]:
        context_block = CONTEXT_TEMPLATE.format(
            monthly_income=context.get("monthly_income", "N/A"),
            weekly_budget=context.get("weekly_budget", "N/A"),
            saving_percentage=context.get("saving_percentage", "N/A"),
            today_spending=context.get("today_spending", "N/A"),
            week_spending=context.get("week_spending", "N/A"),
            last_week_spending=context.get("last_week_spending", "N/A"),
            category_breakdown=context.get("category_breakdown") or "N/A",
        )

        messages: list[BaseMessage] = [
            SystemMessage(
                content=SYSTEM_PROMPT.format(language=language) + "\n" + context_block
            )
        ]

        for m in history:
            if m.get("role") == "user":
                messages.append(HumanMessage(content=m.get("content", "")))
            else:
                messages.append(AIMessage(content=m.get("content", "")))

        return messages

    @staticmethod
    def _extract_text(content) -> str:
        """
        Normalizes a chat chunk's content into plain text. Depending on the
        provider/langchain version, `chunk.content` may be a plain string or
        a list of content blocks (e.g. Gemini/Anthropic-style
        `[{"type": "text", "text": "..."}]`), so both shapes are handled.
        """
        if isinstance(content, str):
            return content

        if isinstance(content, list):
            parts = []
            for block in content:
                if isinstance(block, str):
                    parts.append(block)
                elif isinstance(block, dict) and block.get("type") == "text":
                    parts.append(block.get("text", ""))
            return "".join(parts)

        return ""

    async def _stream_completion(self, messages: list[BaseMessage]) -> AsyncGenerator[dict[str, Any], None]:
        """
        Streams one completion's text as {"type": "text", ...} events and
        yields a final {"type": "_done", "message": AIMessage} event carrying
        the fully-accumulated assistant message (including any tool calls).
        """
        full: AIMessageChunk | None = None
        async for chunk in self.llm.astream(messages):
            text = self._extract_text(chunk.content)
            if text:
                yield {"type": "text", "text": text}
            full = chunk if full is None else full + chunk

        message = AIMessage(
            content=self._extract_text(full.content) if full else "",
            tool_calls=full.tool_calls if full else [],
        )
        yield {"type": "_done", "message": message}

    async def astream(
        self,
        *,
        history: list[ChatMessage],
        context: dict,
        language: str = "English",
    ) -> AsyncGenerator[dict[str, Any], None]:
        """
        Streams the assistant's reply given the chat history and the user's
        current financial context. Yields:

          {"type": "text", "text": "..."} — a token of reply text
          {"type": "tool_call", "name": "log_spending", "args": {...}} — the
              model asking to log a spending, emitted once it has decided to
              (only after the user approved it, per the system prompt)

        The tool call is never executed here — spending data lives in the
        client's own storage, so the frontend is responsible for actually
        logging it. Once a tool call is emitted, this immediately continues
        the conversation server-side (telling the model the log succeeded —
        local writes are effectively always successful, so it's safe not to
        wait on the client) and streams the model's natural confirmation as
        more "text" events, so the agent always replies after logging.
        """
        messages = self._build_messages(history=history, context=context, language=language)

        assistant_message: AIMessage | None = None
        async for event in self._stream_completion(messages):
            if event["type"] == "_done":
                assistant_message = event["message"]
            else:
                yield event

        if assistant_message is None:
            return

        log_calls = [
            call for call in assistant_message.tool_calls if call.get("name") == LOG_SPENDING_TOOL_NAME
        ]
        if not log_calls:
            return

        for call in log_calls:
            yield {"type": "tool_call", "name": LOG_SPENDING_TOOL_NAME, "args": call["args"]}

        messages.append(assistant_message)
        for call in log_calls:
            args = call["args"]
            messages.append(
                ToolMessage(
                    tool_call_id=call["id"],
                    content=(
                        f"Logged {args.get('amount')} OMR for "
                        f"\"{args.get('product')}\" under {args.get('category')}."
                    ),
                )
            )

        async for event in self._stream_completion(messages):
            if event["type"] != "_done":
                yield event


def make_agent(temperature: float = 0.6) -> FinancialAnalystInteractive:
    llm = init_chat_model(
        model=options.get("model"),
        model_provider=os.getenv("LLM_PROVIDER"),
        base_url=options.get("base_url"),
        api_key=os.getenv("LLM_API_KEY"),
        temperature=temperature,
    )

    return FinancialAnalystInteractive(llm=llm)
