from __future__ import annotations

import os
import sys
import base64
import json
from pathlib import Path
from typing import BinaryIO
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage
from langchain.chat_models import init_chat_model, BaseChatModel
from pydantic import BaseModel, Field, ValidationError

sys.path.append("..")
from server.utils import load_options, disable_thinking

load_dotenv()
options= load_options("options.yml")

class Receipt(BaseModel):
    total_amount: float | None = Field(
        description="Total amount in Omani Rials (OMR, O.R.)"
    )
    product: str | None = Field(
        description="Product name in detail including store"
    )
    datetime: str | None = Field(
        description="Date and time in the format DD/MM/YYYY HH:mm"
    )
    category: str | None = Field(
        description="Category of the spending: Food, Transportation, Leisure, Subscriptions, Groceries, Other"
    )


SYSTEM_PROMPT = """
You are a receipt information extraction agent.

Analyze the provided receipt image and extract the following fields:

1. total_amount:
   - Find the final amount paid in Omani Rials (OMR).
   - Look for labels such as:
     TOTAL, TOTAL AMOUNT, TOTAL COST, TOTAL R.O., TOTAL O.R., NET TOTAL, NET AMOUNT, SUB TOTAL, GRAND TOTAL.
   - Extract only the numeric value.
   - Ignore taxes, discounts, item prices, and intermediate totals unless they represent the final amount paid.

2. product:
   - Extract the main purchase description.
   - Include the store/merchant name if visible.
   - Include important item details when available.
   - Keep it concise.

3. datetime:
   - Extract the receipt date and time.
   - Convert to format: DD/MM/YYYY HH:mm.
   - If only date or only time is visible, extract the available information in the same field.
   - If conversion is impossible, return null.

4. category:
   Choose exactly one category:
   - Food: restaurants, cafes, meals, drinks
   - Transportation: fuel, taxis, public transport, vehicle services
   - Leisure: entertainment, games, activities, hobbies
   - Subscriptions: recurring digital or physical services
   - Groceries: supermarkets, household food purchases
   - Other: anything that does not fit above

Rules:
- Only extract information visible in the image.
- Never guess or infer missing information.
- If a field cannot be confidently identified, set it to null.
- Return valid JSON only.
- Do not include explanations, markdown, or extra text.

Output format:
{
  "total_amount": number | null,
  "product": string | null,
  "datetime": string | null,
  "category": string | null
}

Return ONLY valid JSON.
"""


class ReceiptExtractor:
    def __init__(self, llm: BaseChatModel):
        self.llm = disable_thinking(llm)
        self.llm = llm.with_structured_output(Receipt)

    @staticmethod
    def _encode_image(
        image: str | Path | bytes | BinaryIO,
    ) -> str:
        """
        Accepts:
            - Flask FileStorage
            - bytes
            - file object
            - path
        """

        if isinstance(image, bytes):
            data = image

        elif isinstance(image, (str, Path)):
            data = Path(image).read_bytes()

        else:
            data = image.read()

        return base64.b64encode(data).decode()

    def invoke(
        self,
        image: str | Path | bytes | BinaryIO,
    ) -> Receipt:

        image_b64 = self._encode_image(image)

        msg = HumanMessage(
            content=[
                {
                    "type": "system",
                    "text": SYSTEM_PROMPT,
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_b64}"
                    },
                },
            ]
        )

        result = self.llm.invoke([msg])

        return result


def make_extractor(
    temperature: float = 0.0,
) -> ReceiptExtractor:
    llm = init_chat_model(
        model=options.get("model"),
        model_provider=os.getenv("LLM_PROVIDER"),
        base_url=options.get("base_url"),
        api_key=os.getenv("LLM_API_KEY"),
        temperature=temperature,
    )

    return ReceiptExtractor(llm)