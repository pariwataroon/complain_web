from fastapi import FastAPI
from app.api.v1.middlewares.logger_middleware import setup_logging_middleware
from globals.exception_handler import setup_exception_handlers
from lib.logger import get_logger, HourlyRotatingFileHandler
from .database_init import init_database  # เพิ่มการนำเข้าฟังก์ชัน init_database

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
    
    # เพิ่ม event handler เพื่อเริ่มต้นฐานข้อมูลเมื่อแอพเริ่มทำงาน
    @app.on_event("startup")
    async def startup_db_client():
        """Initialize database on application startup"""
        db_initialized = init_database()
        if db_initialized:
            logger.info("Database connection established and tables initialized")
        else:
            logger.warning("Failed to initialize database - check connection settings")
    
    return app