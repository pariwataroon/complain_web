import os
import urllib.parse

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from lib.logger import get_logger

logger = get_logger("database", console_output=False)

# Get database connection details from environment variables
DB_USER = os.getenv("DB_USER", "admin_comp_mof")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Password@1234")  # แก้ไขรหัสผ่าน default ตรงนี้
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "1433")
DB_NAME = os.getenv("DB_NAME", "comp_mof")
DB_PASSWORD_ENCODE = urllib.parse.quote_plus(DB_PASSWORD)

# Create the SQLAlchemy engine
SQLALCHEMY_DATABASE_URL = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD_ENCODE}@{DB_HOST}:{DB_PORT}/{DB_NAME}?driver=ODBC+Driver+17+for+SQL+Server"

# ล็อกข้อมูลการเชื่อมต่อ (ไม่มีรหัสผ่าน)
connection_info = f"Connecting to database: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
logger.info(connection_info)

try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,  # Check connection before using it
        pool_recycle=3600,   # Recycle connections after 1 hour
        echo=False           # Set to True for SQL query logging
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {str(e)}")
    raise

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for declarative models
Base = declarative_base()

# Function to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()