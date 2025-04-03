from pydantic import BaseModel
from typing import Optional, Union, Any, Dict, List

class FormatResponseModel(BaseModel):
    res_code: Optional[str] = None
    res_message: str
    res_data: Any


RESPONSE_MESSAGES = {
    # Success codes
    "0000": "GET_DATA_SUCCESSFULLY",
    "0001": "CREATE_DATA_SUCCESSFULLY",
    "0002": "UPDATE_DATA_SUCCESSFULLY",
    "0003": "DELETE_DATA_SUCCESSFULLY",
    
    # Client error codes (4xxx)
    "4000": "BAD_REQUEST",
    "4001": "VALIDATION_ERROR",
    "4010": "UNAUTHORIZED",
    "4030": "FORBIDDEN",
    "4040": "NOT_FOUND",
    "4090": "CONFLICT",
    "4290": "TOO_MANY_REQUESTS",
    
    # Server error codes (5xxx)
    "5000": "INTERNAL_SERVER_ERROR",
    "5030": "SERVICE_UNAVAILABLE",
    "5040": "GATEWAY_TIMEOUT",
}

def format_response(res_code: str, res_data: Any) -> FormatResponseModel:
    message = RESPONSE_MESSAGES.get(res_code, "UNKNOWN_ERROR")
    return FormatResponseModel(
        res_code=res_code,
        res_message=message,
        res_data=res_data
    )