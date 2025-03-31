from pydantic import BaseModel
from typing import Any

class FormatResponseModel(BaseModel):
    res_code: str | None = None
    res_message: str
    res_data: Any


RESPONSE_MESSAGES = {
    "0000": "GET_DATA_SUCCESSFULLY",
    "4001": "VALIDATE_ERROR",
}

def format_response(res_code: str, res_data: Any) -> FormatResponseModel:
    message = RESPONSE_MESSAGES.get(res_code, "UNKNOWN_ERROR")
    return FormatResponseModel(
        res_code=res_code,
        res_message=message,
        res_data=res_data
    )