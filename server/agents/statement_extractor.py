from __future__ import annotations

import os
import sys
import base64
from io import BytesIO
from pathlib import Path
from typing import BinaryIO

import fitz

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langchain.chat_models import init_chat_model, BaseChatModel
from pydantic import BaseModel, Field

sys.path.append("..")
from server.utils import load_options, disable_thinking

load_dotenv()
options = load_options("options.yml")

class Transaction(BaseModel):
    datetime: str = Field(
        description="Transaction date formatted DD/MM/YYYY"
    )
    net_amount: str = Field(
        description="Net transaction amount with sign preserved and decimal places"
    )



class Statement(BaseModel):
    transactions: list[Transaction]



PROMPT = """
You are an expert bank statement parser.

Extract EVERY transaction visible.

Rules:

- Return ONLY structured data.
- Ignore headers, balances, page numbers and summaries.
- One object per transaction.
- datetime MUST be DD/MM/YYYY.
- net_amount should preserve the sign if shown.
- Preserve decimal places.
- Do not invent missing transactions.
"""


class BankStatementExtractor:

    def __init__(self, llm: BaseChatModel):
        self.chain = llm.with_structured_output(Statement)

    @staticmethod
    def _encode_image(data: bytes):
        return base64.b64encode(data).decode()

    @staticmethod
    def _pdf_to_images(pdf_bytes: bytes):
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        pages = []

        for page in doc:
            pix = page.get_pixmap(dpi=250)

            pages.append(pix.tobytes("png"))

        return pages

    def _extract_page(self, image_bytes: bytes) -> Statement:

        image = self._encode_image(image_bytes)

        message = HumanMessage(
            content=[
                {
                    "type": "text",
                    "text": PROMPT,
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{image}"
                    },
                },
            ]
        )

        return [t.model_dump() for t in self.chain.invoke([message]).transactions]

    def invoke(
        self,
        documents: list[BinaryIO | bytes | str | Path],
    ) -> list[Transaction]:

        transactions = []

        for document in documents:

            if isinstance(document, (str, Path)):
                suffix = Path(document).suffix.lower()
                data = Path(document).read_bytes()

            elif isinstance(document, bytes):
                suffix = ""
                data = document

            else:
                suffix = ""
                data = document.read()

            # PDF
            if suffix == ".pdf" or data.startswith(b"%PDF"):

                pages = self._pdf_to_images(data)

                for page in pages:
                    result = self._extract_page(page)
                    transactions.extend(result)

            # image
            else:

                result = self._extract_page(data)
                transactions.extend(result)

        return transactions


def make_extractor(
    temperature: float = 0.0,
) -> BankStatementExtractor:
    llm = init_chat_model(
        model=options.get("model"),
        model_provider=os.getenv("LLM_PROVIDER"),
        base_url=options.get("base_url"),
        api_key=os.getenv("LLM_API_KEY"),
        temperature=temperature,
    )

    return BankStatementExtractor(llm)