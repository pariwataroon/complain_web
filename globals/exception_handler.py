from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from lib.logger import get_logger

logger = get_logger("exceptions", console_output=False)

async def global_exception_handler(request: Request, exc: Exception):
    # Log the exception
    logger.error(
        f"Unhandled exception in {request.method} {request.url.path}: {str(exc)}",
        exc_info=True
    )
    
    # Return a generic error response
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."}
    )

def setup_exception_handlers(app: FastAPI):
    app.add_exception_handler(Exception, global_exception_handler)