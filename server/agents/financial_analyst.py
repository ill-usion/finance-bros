from __future__ import annotations

import os
import sys
import asyncio
import agents.statement_extractor
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage
from langchain.chat_models import init_chat_model, BaseChatModel
from pydantic import BaseModel, Field, ValidationError


sys.path.append("..")
from server.utils import load_options, disable_thinking
from agents import statement_extractor, forecaster

load_dotenv()
options= load_options("options.yml")


class Transaction(BaseModel):
    datetime: str
    total_amount: str


class SpendingForecast(BaseModel):
    datetime: str
    predicted_amount: float


class SpendingReview(BaseModel):
    score: int = Field(ge=0, le=100)
    score_reasoning: str


class FinanceAnalysis(BaseModel):
    score: int
    score_reasoning: str
    suggested_weekly_budget: float

    bank_statement: list[Transaction]
    forecast: list[SpendingForecast]


ANALYST_PROMPT = """
You are a university student's personal financial advisor.

You will receive

- monthly income
- current weekly budget
- desired saving percentage
- bank statement
- predicted spending for the next seven days

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

Return ONLY

{
    "score": ...,
    "score_reasoning": "..."
}
"""

class FinanceAnalysisAgent:

    def __init__(
        self,
        parser: statement_extractor.BankStatementParser,
        llm: BaseChatModel,
    ):
        self.parser = parser

        self.analysis_chain = (
            llm.with_structured_output(SpendingReview)
        )

    def accumulate_day_spendings(self, transactions: list[Transaction]) -> dict[str, float]:
        """
        Accumulate spendings for each day.
        """

        daily_spendings: dict[str, float] = {}

        for transaction in transactions:
            date = transaction["datetime"]
            amount = float(transaction["net_amount"])

            # only count spendings 
            if amount > 0:
                continue

            amount = abs(amount)
            if date in daily_spendings:
                daily_spendings[date] += amount
            else:
                daily_spendings[date] = amount

        return daily_spendings

    def make_review_prompt(self,
        monthly_income: float,
        weekly_budget: float,
        saving_percentage: float, 
        transactions: list[Transaction], 
        forecast: list[SpendingForecast]
    ) -> list[HumanMessage]:
        return [
                SystemMessage(
                    content=ANALYSIS_PROMPT
                ),
                HumanMessage(
                    content=f"""
                    User financial information:

                    Monthly income:
                    {monthly_income}

                    Current weekly budget:
                    {weekly_budget}

                    Saving percentage:
                    {saving_percentage}

                    Bank transactions:
                    {transactions}

                    Next 7 day spending forecast:
                    {forecast}

                    Evaluate this student's financial behavior.
                    """
                )
            ]

    async def invoke(
        self,
        *,
        monthly_income: float,
        weekly_budget: float,
        saving_percentage: float,
        statement: BinaryIO | bytes | str | Path,
    ) -> FinanceAnalysis:

        # Step 1
        transactions = self.parser.invoke([statement])

        # Step 2
        daily_spendings = self.accumulate_day_spendings(transactions)
        forecast_task = asyncio.to_thread(
            forecaster.predict_week_spendings, [v for k, v in daily_spendings.items()]
        )

        # Step 3
        review_task = asyncio.to_thread(
            self.analysis_chain.invoke,
            self.make_review_prompt(
                monthly_income=monthly_income,
                weekly_budget=weekly_budget,
                saving_percentage=saving_percentage,
                transactions=daily_spendings,
            )
        )

        predicted, review = await asyncio.gather(forecast_task, review_task)

        # Step 4
        suggested_budget = (
            monthly_income
            * (1 - saving_percentage / 100)
            / 4
        )

        return FinanceAnalysis(
            score=review.score,
            score_reasoning=review.score_reasoning,
            suggested_weekly_budget=round(
                suggested_budget,
                2,
            ),
            bank_statement=transactions,
            forecast=predicted,
        )

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