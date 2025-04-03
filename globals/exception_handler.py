from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from lib.logger import get_logger
from lib.format_data import format_response, FormatResponseModel

logger = get_logger("exceptions", console_output=False)

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Extract error details from the validation error
    error_details = []
    for error in exc.errors():
        error_details.append({
            "loc": error.get("loc", []),
            "msg": error.get("msg", ""),
            "type": error.get("type", "")
        })
    
    # Log the validation errors
    logger.warning(
        f"Validation error in {request.method} {request.url.path}: {error_details}"
    )
    
    # Return a formatted validation error response
    formatted_response = format_response("4001", {"errors": error_details})
    return JSONResponse(
        status_code=422,
        content=formatted_response.dict()
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    # Map HTTP status codes to your response codes
    status_code_mapping = {
        400: "4000",  # Bad Request
        401: "4010",  # Unauthorized
        403: "4030",  # Forbidden
        404: "4040",  # Not Found
        429: "4290",  # Too Many Requests
        # Add more mappings as needed
    }
    
    res_code = status_code_mapping.get(exc.status_code, "5000")
    
    # Log the HTTP exception
    logger.warning(
        f"HTTP exception in {request.method} {request.url.path}: {exc.detail} (Status: {exc.status_code})"
    )
    
    # Return a formatted HTTP error response
    formatted_response = format_response(res_code, {"detail": exc.detail})
    return JSONResponse(
        status_code=exc.status_code,
        content=formatted_response.dict()
    )

async def global_exception_handler(request: Request, exc: Exception):
    # Log the exception
    logger.error(
        f"Unhandled exception in {request.method} {request.url.path}: {str(exc)}",
        exc_info=True
    )
    
    # Return a formatted error response
    formatted_response = format_response("5000", {"detail": "An internal server error occurred."})
    return JSONResponse(
        status_code=500,
        content=formatted_response.dict()
    )

def setup_exception_handlers(app: FastAPI):
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)