import json
import asyncio
from uuid import uuid4
from collections.abc import Generator
from agents import financial_analyst, receipt_extractor, statement_extractor, forecaster

from flask import Flask, request, session, g, make_response, render_template, Response


receipt_ext = receipt_extractor.make_extractor()
statement_ext = statement_extractor.make_extractor()
financial_analyst = financial_analyst.make_agent()

app = Flask(__name__)
app.secret_key = "<CHANGE THIS>"
app.template_folder = 'static'

def __iter_over_async(async_generator) -> Generator[dict, None, None]:
    """
    Iterates over the async iterable and yields formatted chunks.
    
    Yields:
        dict: Generation and chunk status 
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    iterator = async_generator.__aiter__()

    async def get_next() -> tuple[bool, Any]:
        """
        Retrieves the next chunk from the iterator.

        Returns:
            tuple[bool, Any]: A tuple with a boolean indicating if the iteration is done and the chunk.
        """
        try:
            obj = await iterator.__anext__()
            return False, obj
        except StopAsyncIteration:
            return True, None
        except Exception as e:
            print(f"Error in get_next: {e}")
            # Handle exceptions from callable_fn or chunk_fnc
            return True, None

    try:
        while True:
            done, obj = loop.run_until_complete(get_next())
            if done:
                break
            yield obj
    finally:
        loop.close()


def generate_stream(callable_fn, chunk_fnc) -> Generator[dict, None, None]:
    """
    Generates a stream from `callable_fn` and processes it using `chunk_fnc`

    Returns:
        `Generator[dict, None, None]`
    """

    async def run_inference():
        async for chunk in callable_fn():
            yield chunk

    async def collect_chunks():
        chunks = []
        async for chunk in run_inference():
            yield chunk_fnc(chunk) 

    return __iter_over_async(collect_chunks())


def send_chunk(chunk):
    """
    Process chunk
    """
    # Convert dict to json string
    return json.dumps(chunk)


@app.route('/extract-receipt', methods=['POST'])
def extract_receipt():
    """
    Endpoint to extract receipt information from an uploaded file.
    """
    if 'file' not in request.files:
        return {"error": "No file part in the request"}, 400

    file = request.files['file']
    if file.filename == '':
        return {"error": "No selected file"}, 400

    try:
        receipt_data = receipt_ext.invoke(file)
        return receipt_data.model_dump(), 200
    except Exception as e:
        return {"error": str(e)}, 500


@app.route("/extract-statement", methods=['POST'])
def extract_statement():
    """
    Endpoint to extract bank statement information from an uploaded file.
    """
    print(request.files)
    if 'files' not in request.files:
        return {"error": "No files part in the request"}, 400

    files = request.files.getlist('files')
    if not files:
        return {"error": "No selected file(s)"}, 400
        
    try:
        statement_data = statement_ext.invoke(files)
        return statement_data, 200
    except Exception as e:
        return {"error": str(e)}, 500

@app.route("/forecast-spending", methods=['POST'])
async def forecast_spending():
    """
    Endpoint to forecast spending based on the provided daily spendings.
    """
    data = request.json
    if not data or 'daily_spendings' not in data:
        return {"error": "Missing required field: daily_spendings"}, 400

    daily_spendings = data['daily_spendings']

    try:
        forecast_result = forecaster.predict_week_spendings(daily_spendings)
        return {"forecast": forecast_result}, 200
    except Exception as e:
        return {"error": str(e)}, 500


@app.route("/spending-analysis", methods=['POST'])
async def spending_analysis():
    """
    Endpoint to perform spending analysis based on the provided financial data.
    """
    data = request.form
    required_fields = ["monthly_income", "weekly_budget", "saving_percentage"]

    for field in required_fields:
        if field not in data:
            return {"error": f"Missing required field: {field}"}, 400
    
    if 'file' not in request.files:
        return {"error": "No file part in the request"}, 400

    statement_file = request.files['file']
    print(statement_file)
    try:
        analysis_result = await financial_analyst.invoke(
            monthly_income=data["monthly_income"],
            weekly_budget=data["weekly_budget"],
            saving_percentage=data["saving_percentage"],
            statement=statement_file
        )
        return analysis_result.model_dump(), 200
    except Exception as e:
        return {"error": str(e)}, 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)