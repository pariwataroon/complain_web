import os
import urllib.parse

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from lib.logger import get_logger

from config.dotenv import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

logger = get_logger("database", console_output=False)

# Get database connection details from environment variables
DB_PASSWORD_ENCODE = urllib.parse.quote_plus(DB_PASSWORD)

# Create the SQLAlchemy engine - Optimized with connection pooling
SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD_ENCODE}@{DB_HOST}:{DB_PORT}/{DB_NAME}?driver=ODBC+Driver+18+for+SQL+Server&charset=UTF8"

# ล็อกข้อมูลการเชื่อมต่อ (ไม่มีรหัสผ่าน)
connection_info = f"Connecting to database: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
logger.info(connection_info)

try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        poolclass=QueuePool,
        pool_size=20,
        max_overflow=30,
        pool_pre_ping=False,
        pool_recycle=7200,
        pool_timeout=30,
        echo=False,
        connect_args={
            "TrustServerCertificate": "yes",
            "Encrypt": "yes",
            "charset": "utf8",
            "timeout": 20
        }
    )
    logger.info("Database engine created successfully with optimized connection pool and indexing support")
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}")
    raise

# Create a session factory with optimized settings
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    expire_on_commit=False  # ป้องกัน lazy loading issues
)

# Create a base class for declarative models
Base = declarative_base()

# Function to get a database session (for FastAPI dependencies)
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        try:
            db.close()
        except Exception as e:
            logger.error(f"Error closing database session: {e}")

# Function to get a database session (for workers and scripts)
def get_db_session():
    """สร้าง database session สำหรับ worker และ scripts (generator)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to get a direct database session (without generator)
def create_db_session():
    """สร้าง database session โดยตรง (ไม่ใช่ generator) สำหรับ worker"""
    return SessionLocal()

# Function to create all indexes (เรียกใช้หลัง create_all)
def create_indexes():
    """สร้าง indexes หลังจากสร้างตารางแล้ว"""
    try:
        # SQLAlchemy จะสร้าง indexes ที่กำหนดใน models อัตโนมัติ
        # เมื่อเรียก Base.metadata.create_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        logger.info("All indexes created successfully")
    except Exception as e:
        logger.error(f"Failed to create indexes: {str(e)}")
        raise