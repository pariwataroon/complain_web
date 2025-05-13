import secrets
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from app.api.common.middlewares.logger_middleware import setup_logging_middleware
from globals.exception_handler import setup_exception_handlers
from lib.logger import get_logger, HourlyRotatingFileHandler
from .database_init import init_database
from config.dotenv import PROJECT_NAME, ENVIRONMENT, SWAGGER_USERNAME, SWAGGER_PASSWORD

# Create a logger for application startup
logger = get_logger("app", console_output=False)

# เพิ่มตรงนี้เพื่อกำหนด credentials สำหรับ swagger
security = HTTPBasic()

def swagger_auth(credentials: HTTPBasicCredentials = Depends(security)):
    """Authenticate access to Swagger UI"""
    correct_username = SWAGGER_USERNAME
    correct_password = SWAGGER_PASSWORD
    
    # ตรวจสอบ credentials
    is_username_correct = secrets.compare_digest(credentials.username, correct_username)
    is_password_correct = secrets.compare_digest(credentials.password, correct_password)
    
    if not (is_username_correct and is_password_correct):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    return credentials.username

def create_application() -> FastAPI:
    # กำหนด dependencies สำหรับ docs เฉพาะเมื่ออยู่ใน production mode
    docs_kwargs = {}
    if ENVIRONMENT == "production":
        docs_kwargs = {
            "docs_url": "/docs",
            "redoc_url": "/redoc",
            "openapi_url": "/openapi.json",
            "swagger_ui_oauth2_redirect_url": "/docs/oauth2-redirect",
            "swagger_ui_parameters": {"defaultModelsExpandDepth": -1},
            "dependencies": [Depends(swagger_auth)]
        }
    else:
        docs_kwargs = {
            "docs_url": "/docs",
            "redoc_url": "/redoc",
            "openapi_url": "/openapi.json"
        }
    
    app = FastAPI(
        title=PROJECT_NAME,
        description=f"{PROJECT_NAME} Documentation",
        version="1.0.0",
        **docs_kwargs
    )
    
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