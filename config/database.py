import os
import urllib.parse

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from lib.logger import get_logger

from config.dotenv import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

logger = get_logger("database", console_output=False)

# Get database connection details from environment variables
DB_PASSWORD_ENCODE = urllib.parse.quote_plus(DB_PASSWORD)

# Create the SQLAlchemy engine - Updated to use ODBC Driver 18
SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD_ENCODE}@{DB_HOST}:{DB_PORT}/{DB_NAME}?driver=ODBC+Driver+18+for+SQL+Server&charset=UTF8"

# ล็อกข้อมูลการเชื่อมต่อ (ไม่มีรหัสผ่าน)
connection_info = f"Connecting to database: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
logger.info(connection_info)

try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,  # Check connection before using it
        pool_recycle=3600,   # Recycle connections after 1 hour
        echo=False,          # Set to True for SQL query logging
        pool_size=20,        # Set the pool size to 5 connections
        max_overflow=20,    # Allow up to 10 additional connections beyond the pool size
        pool_timeout=60,        # เพิ่มเวลา timeout จาก 30 วินาที เป็น 60 วินาที
        connect_args={
            "TrustServerCertificate": "yes",
            "Encrypt": "yes",
            "charset": "utf8"
        }
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}")
    raise

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for declarative models
Base = declarative_base()

# Function to get a database session (for FastAPI dependencies)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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