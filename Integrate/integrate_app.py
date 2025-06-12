import secrets
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from app.api.common.middlewares.logger_middleware import setup_logging_middleware
from globals.exception_handler import setup_exception_handlers
from lib.logger import get_logger, HourlyRotatingFileHandler
from .database_init import init_database
from config.dotenv import PROJECT_NAME, ENVIRONMENT, SWAGGER_USERNAME, SWAGGER_PASSWORD
from sqlalchemy.orm import Session
from sqlalchemy import text

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
    # ในโหมด production เราไม่กำหนด docs_url, redoc_url, และ openapi_url โดยตรง
    # แต่จะกำหนดหลังจากสร้าง app และผูกกับ route ที่มี authentication
    if ENVIRONMENT == "production":
        app = FastAPI(
            title=PROJECT_NAME,
            description=f"{PROJECT_NAME} Documentation",
            version="1.0.0",
            # ปิดการแสดง documentation โดยตรง
            docs_url=None,
            redoc_url=None,
            openapi_url=None
        )
    else:
        app = FastAPI(
            title=PROJECT_NAME,
            description=f"{PROJECT_NAME} Documentation",
            version="1.0.0",
            docs_url="/docs",
            redoc_url="/redoc",
            openapi_url="/openapi.json"
        )
    
    # Setup logging middleware
    setup_logging_middleware(app)
    
    # Setup exception handlers
    setup_exception_handlers(app)
    
    # Clean old logs on application startup
    HourlyRotatingFileHandler().clean_old_logs()
    
    # ในโหมด production เราจะกำหนด route สำหรับ documentation ที่มีการป้องกัน
    if ENVIRONMENT == "production":
        from fastapi.openapi.docs import (
            get_swagger_ui_html,
            get_redoc_html
        )
        from fastapi.openapi.utils import get_openapi
        
        @app.get("/docs", include_in_schema=False)
        async def get_swagger_ui(credentials: HTTPBasicCredentials = Depends(swagger_auth)):
            return get_swagger_ui_html(
                openapi_url="/openapi.json",
                title=f"{PROJECT_NAME} - Swagger UI",
                oauth2_redirect_url="/docs/oauth2-redirect",
                swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
                swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
            )
        
        @app.get("/redoc", include_in_schema=False)
        async def get_redoc(credentials: HTTPBasicCredentials = Depends(swagger_auth)):
            return get_redoc_html(
                openapi_url="/openapi.json",
                title=f"{PROJECT_NAME} - ReDoc",
                redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
            )
        
        @app.get("/openapi.json", include_in_schema=False)
        async def get_openapi_json(credentials: HTTPBasicCredentials = Depends(swagger_auth)):
            return get_openapi(
                title=app.title,
                version=app.version,
                description=app.description,
                routes=app.routes
            )
        
        @app.get("/docs/oauth2-redirect", include_in_schema=False)
        async def get_oauth2_redirect(credentials: HTTPBasicCredentials = Depends(swagger_auth)):
            from fastapi.openapi.docs import get_swagger_ui_oauth2_redirect_html
            return get_swagger_ui_oauth2_redirect_html()
    
    logger.info("Application initialized with logging system")
    
    # เพิ่ม event handler เพื่อเริ่มต้นฐานข้อมูลเมื่อแอพเริ่มทำงาน
    @app.on_event("startup")
    async def startup_db_client():
        """Initialize database on application startup with proper health check"""
        import asyncio
        
        max_retries = 10  # เพิ่มจำนวน retry
        initial_delay = 1
        max_delay = 30
        
        for i in range(max_retries):
            try:
                # ✅ ตรวจสอบ connection ก่อน
                from config.database import engine
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                
                # ✅ ถ้า connection สำเร็จ ค่อย init database
                db_initialized = init_database()
                if db_initialized:
                    logger.info("Database connection established and tables initialized")
                    
                    # ✅ รอให้ระบบพร้อมสมบูรณ์
                    await asyncio.sleep(2)
                    return
                    
            except Exception as e:
                delay = min(initial_delay * (2 ** i), max_delay)  # Exponential backoff
                logger.warning(f"Database init attempt {i+1}/{max_retries} failed: {e}")
                
                if i < max_retries - 1:
                    logger.info(f"Retrying in {delay} seconds...")
                    await asyncio.sleep(delay)
        
        logger.error("Failed to initialize database after all retries - API may be unstable")

    def check_database_health(db: Session) -> bool:
        """ตรวจสอบสถานะการเชื่อมต่อฐานข้อมูล"""
        try:
            db.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    return app