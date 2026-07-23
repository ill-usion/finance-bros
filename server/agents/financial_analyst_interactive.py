from __future__ import annotations

import os
import sys
from typing import AsyncGenerator, Literal, TypedDict
from dotenv import load_dotenv

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain.chat_models import init_chat_model, BaseChatModel


sys.path.append("..")
from server.utils import load_options

load_dotenv()
options = load_options("options.yml")


class ChatMessage(TypedDict):
    role: Literal["user", "assistant"]
    content: str


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
        self.llm = llm

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

    async def astream(
        self,
        *,
        history: list[ChatMessage],
        context: dict,
        language: str = "English",
    ) -> AsyncGenerator[str, None]:
        """
        Streams the assistant's reply token-by-token given the chat history
        and the user's current financial context.
        """
        messages = self._build_messages(history=history, context=context, language=language)

        async for chunk in self.llm.astream(messages):
            text = self._extract_text(chunk.content)
            if text:
                yield text


def make_agent(temperature: float = 0.6) -> FinancialAnalystInteractive:
    llm = init_chat_model(
        model=options.get("model"),
        model_provider=os.getenv("LLM_PROVIDER"),
        base_url=options.get("base_url"),
        api_key=os.getenv("LLM_API_KEY"),
        temperature=temperature,
    )

    return FinancialAnalystInteractive(llm=llm)
