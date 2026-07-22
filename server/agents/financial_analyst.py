from __future__ import annotations

import os
import sys
import asyncio
from pathlib import Path
from typing import Any, BinaryIO, AsyncGenerator
from datetime import datetime, timedelta
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage, SystemMessage
from langchain.chat_models import init_chat_model, BaseChatModel
from pydantic import BaseModel, Field, ValidationError


sys.path.append("..")
from server.utils import load_options, disable_thinking
from agents import statement_extractor, forecaster

load_dotenv()
options= load_options("options.yml")


class SpendingReview(BaseModel):
    score: int = Field(ge=0, le=100)
    score_reasoning: str


class FinanceAnalysis(BaseModel):
    score: int
    score_reasoning: str
    suggested_weekly_budget: float

    bank_statement: list[dict]
    forecast: list[float] = []


ANALYSIS_PROMPT = """
You are a university student's personal financial advisor.

You will receive

- monthly income
- current weekly budget
- desired saving percentage
- bank statement

Rate the student's spending behaviour.

Scoring:

100 = excellent financial discipline
80 = responsible spending
60 = acceptable
40 = concerning
20 = poor
0 = extremely irresponsible

Take into account

- overspending
- unnecessary spending
- consistency
- spending spikes
- whether the forecast indicates future problems

The "score_reasoning" MUST be a single short sentence written in the
language specified by the user (e.g. if the language is Arabic, write the
reasoning in Arabic).

Return ONLY

{
    "score": ...,
    "score_reasoning": "..."
}
"""

class FinanceAnalysisAgent:

    def __init__(
        self,
        parser: statement_extractor.BankStatementExtractor,
        llm: BaseChatModel,
    ):
        self.parser = parser

        self.analysis_chain = (
            llm.with_structured_output(SpendingReview)
        )

    def accumulate_day_spendings(self, transactions: list[statement_extractor.Transaction]) -> dict[str, float]:
        """
        Accumulate spendings for each day.
        """

        daily_spendings: dict[str, float] = {}

        for transaction in transactions:
            date = transaction["datetime"]

            # net_amount is a signed string; guard against unparseable values
            try:
                amount = float(str(transaction["net_amount"]).replace(",", ""))
            except (TypeError, ValueError):
                continue

            # only count spendings (negative net amounts)
            if amount > 0:
                continue

            amount = abs(amount)
            if date in daily_spendings:
                daily_spendings[date] += amount
            else:
                daily_spendings[date] = amount

        return daily_spendings

    def build_daily_series(self, daily_spendings: dict[str, float]) -> list[float]:
        """
        Turn the per-day spending map into a chronologically ordered series,
        inserting 0.0 for any calendar days with no spending so the forecaster
        receives a continuous daily signal.
        """

        parsed: list[tuple[datetime, float]] = []
        for date_str, amount in daily_spendings.items():
            try:
                parsed.append((datetime.strptime(date_str, "%d/%m/%Y"), amount))
            except (TypeError, ValueError):
                # skip days whose date could not be parsed
                continue

        if not parsed:
            return []

        parsed.sort(key=lambda p: p[0])

        series: list[float] = []
        cursor = parsed[0][0]
        by_day = {d.date(): a for d, a in parsed}

        while cursor.date() <= parsed[-1][0].date():
            series.append(float(by_day.get(cursor.date(), 0.0)))
            cursor += timedelta(days=1)

        return series

    def make_review_prompt(self,
        monthly_income: float,
        weekly_budget: float,
        saving_percentage: float, 
        transactions: list[statement_extractor.Transaction], 
        forecast: list[float] | None = None,
        language: str = "English",
    ) -> list[HumanMessage]:
        return [
                SystemMessage(
                    content=ANALYSIS_PROMPT
                ),
                HumanMessage(
                    content=f"""
                    Language for score_reasoning: {language}

                    User financial information:

                    Monthly income:
                    {monthly_income}

                    Current weekly budget:
                    {weekly_budget}

                    Saving percentage:
                    {saving_percentage}

                    Bank transactions:
                    {transactions}

                    Forecasted next-week daily spendings (empty if not enough history):
                    {forecast if forecast else "N/A"}

                    Evaluate this student's financial behavior.
                    Write the score_reasoning in {language}.
                    """
                )
            ]

    def _run_forecast(self, daily_spendings: dict[str, float]) -> list[float]:
        """
        Build the ordered, zero-padded daily series and forecast the next week.
        Per spec: only forecast when there are at least MIN_FORECAST_DAYS
        (28) days of history; otherwise missing days are already zero-filled
        by build_daily_series, and if there is still not enough history the
        forecast is skipped and an empty list is returned.
        """
        series = self.build_daily_series(daily_spendings)

        if len(series) < forecaster.MIN_FORECAST_DAYS:
            return []

        return forecaster.predict_spendings(series)

    async def invoke(
        self,
        *,
        monthly_income: float,
        weekly_budget: float,
        saving_percentage: float,
        statement: BinaryIO | bytes | str | Path,
        language: str = "English",
    ) -> FinanceAnalysis:
        result: FinanceAnalysis | None = None
        async for update in self.astream(
            monthly_income=monthly_income,
            weekly_budget=weekly_budget,
            saving_percentage=saving_percentage,
            statement=statement,
            language=language,
        ):
            if update.get("status") == "done":
                result = update["result"]
        return result

    async def astream(
        self,
        *,
        monthly_income: float,
        weekly_budget: float,
        saving_percentage: float,
        statement: BinaryIO | bytes | str | Path,
        language: str = "English",
    ) -> AsyncGenerator[dict, None]:
        """
        Runs the analysis in the order required by the spec while emitting
        status updates for the frontend:
          parsing -> forecasting -> reviewing -> done
        """

        # Step 1: parse the bank statement
        yield {"status": "parsing"}
        transactions = await asyncio.to_thread(self.parser.invoke, [statement])

        # Step 2: filter negatives + accumulate same-day spendings
        daily_spendings = self.accumulate_day_spendings(transactions)

        # Step 3: forecast (only if enough history, else zero-padded/skipped)
        yield {"status": "forecasting"}
        predicted = await asyncio.to_thread(self._run_forecast, daily_spendings)

        # Step 4: rate the spending, informed by the forecast, in the user language
        yield {"status": "reviewing"}
        review = await asyncio.to_thread(
            self.analysis_chain.invoke,
            self.make_review_prompt(
                monthly_income=monthly_income,
                weekly_budget=weekly_budget,
                saving_percentage=saving_percentage,
                transactions=transactions,
                forecast=predicted,
                language=language,
            ),
        )

        suggested_budget = (
            monthly_income
            * (1 - saving_percentage / 100)
            / 4
        )

        result = FinanceAnalysis(
            score=review.score,
            score_reasoning=review.score_reasoning,
            suggested_weekly_budget=round(suggested_budget, 2),
            bank_statement=transactions,
            forecast=predicted,
        )

        yield {"status": "done", "result": result}

def make_agent(temperature: float = 0.5) -> FinanceAnalysisAgent:
    parser = statement_extractor.make_extractor()

    llm = init_chat_model(
        model=options.get("model"),
        model_provider=os.getenv("LLM_PROVIDER"),
        base_url=options.get("base_url"),
        api_key=os.getenv("LLM_API_KEY"),
        temperature=temperature,
    )

    return FinanceAnalysisAgent(
        parser=parser,
        llm=llm,
    )