import sys
import os

# เพิ่ม path เพื่อป้องกัน import error
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import Base, engine
from models.user import User  # นำเข้าโมเดลทั้งหมดที่ต้องการสร้างตาราง
from lib.logger import get_logger
import os
import urllib.parse
from sqlalchemy import create_engine, text

logger = get_logger("db_init")

def init_database():
    """Initialize database tables based on SQLAlchemy models"""
    logger.info("Initializing database...")
    
    # ดึงข้อมูลการเชื่อมต่อจาก environment variables หรือใช้ค่า default
    DB_USER = os.getenv("DB_USER", "sa")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "Password@1234")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "1433")
    DB_NAME = os.getenv("DB_NAME", "comp_mof")
    
    # Encode password
    DB_PASSWORD_ENCODE = urllib.parse.quote_plus(DB_PASSWORD)

    # Add this to config/database.py to show more detailed connection information
    conn_string = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD_ENCODE}@{DB_HOST}:{DB_PORT}/{DB_NAME}?driver=ODBC+Driver+17+for+SQL+Server"
    logger.info(f"Connection string (without password): {conn_string.replace(DB_PASSWORD_ENCODE, '****')}")
    
    try:
        # 1. เชื่อมต่อกับฐานข้อมูล master เพื่อตรวจสอบว่าฐานข้อมูลของเรามีอยู่หรือไม่
        master_url = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD_ENCODE}@{DB_HOST}:{DB_PORT}/master?driver=ODBC+Driver+17+for+SQL+Server"
        engine_master = create_engine(master_url)
        
        logger.info(f"Checking if database '{DB_NAME}' exists...")
        
        with engine_master.connect() as conn:
            # ตรวจสอบว่าฐานข้อมูลมีอยู่หรือไม่
            result = conn.execute(text(f"SELECT name FROM sys.databases WHERE name = '{DB_NAME}'"))
            db_exists = result.fetchone() is not None
            
            if not db_exists:
                logger.info(f"Database '{DB_NAME}' does not exist. Creating...")
                # สร้างฐานข้อมูลใหม่
                conn.execute(text(f"CREATE DATABASE {DB_NAME}"))
                logger.info(f"Database '{DB_NAME}' created successfully.")
            else:
                logger.info(f"Database '{DB_NAME}' already exists.")
        
        # 2. สร้างตารางในฐานข้อมูล
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        logger.warning("Application may not function properly without database connection")
        
        # กรณี error ให้รีเทิร์น False แทนที่จะโยน exception เพื่อให้แอพยังทำงานต่อได้
        return False

if __name__ == "__main__":
    init_database()