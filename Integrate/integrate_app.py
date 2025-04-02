from fastapi import FastAPI
from app.api.v1.middlewares.logger_middleware import setup_logging_middleware
from globals.exception_handler import setup_exception_handlers
from lib.logger import get_logger, HourlyRotatingFileHandler

from config.dotenv import project_name

# Create a logger for application startup
logger = get_logger("app", console_output=False)

def create_application() -> FastAPI:
    app = FastAPI(title=project_name)
    
    # Setup logging middleware
    setup_logging_middleware(app)
    
    # Setup exception handlers
    setup_exception_handlers(app)
    
    # Clean old logs on application startup
    HourlyRotatingFileHandler().clean_old_logs()
    
    logger.info("Application initialized with logging system")
    
    return app