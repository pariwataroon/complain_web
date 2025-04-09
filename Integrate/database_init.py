import os
import sys
import urllib.parse

from sqlalchemy import create_engine, inspect, text

from config.database import Base, engine, get_db
from config.dotenv import DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER
from lib.logger import get_logger
from seeders.title_seeder import TitleSeeder
from seeders.user_seeder import UserSeeder

# เพิ่ม path เพื่อป้องกัน import error
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# นำเข้า seeders

logger = get_logger("db_init")


def check_and_seed_tables():
    """Check if tables exist and have data, seed if necessary"""
    try:
        # ตรวจสอบว่าตารางต่างๆ มีอยู่หรือไม่
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        # รายการ seeders ที่ต้องการใช้งาน
        seeders = [
            {"name": "titles", "seeder": TitleSeeder()},
            {"name": "users", "seeder": UserSeeder()},
        ]

        # วนลูปตรวจสอบแต่ละตาราง
        for seeder_info in seeders:
            table_name = 'comp_'+seeder_info["name"]
            seeder = seeder_info["seeder"]

            if table_name in tables:
                logger.info(
                    f"Table '{table_name}' exists. Checking for data...")
                # เรียกใช้ seeder เพื่อตรวจสอบข้อมูลและเพิ่มถ้าจำเป็น
                seeder.seed()
            else:
                logger.info(
                    f"Table '{table_name}' does not exist yet. It will be created and seeded.")
                # หมายเหตุ: ตารางจะถูกสร้างโดย Base.metadata.create_all และข้อมูลจะถูกเพิ่มโดย seeder

    except Exception as e:
        logger.error(f"Error checking and seeding tables: {str(e)}")


def init_database():
    """Initialize database tables based on SQLAlchemy models"""
    logger.info("Initializing database...")

    # ใช้ค่าจาก dotenv โดยตรง ไม่ต้องเรียก os.getenv อีกรอบ
    DB_PASSWORD_ENCODE = urllib.parse.quote_plus(DB_PASSWORD)

    # Connection string สำหรับแสดงข้อมูล
    conn_string = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD_ENCODE}@{DB_HOST}:{DB_PORT}/{DB_NAME}?driver=ODBC+Driver+17+for+SQL+Server"
    logger.info(
        f"Connection string (without password): {conn_string.replace(DB_PASSWORD_ENCODE, '****')}")

    try:
        # 1. เชื่อมต่อกับฐานข้อมูล master เพื่อตรวจสอบว่าฐานข้อมูลของเรามีอยู่หรือไม่
        master_url = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD_ENCODE}@{DB_HOST}:{DB_PORT}/master?driver=ODBC+Driver+17+for+SQL+Server"
        engine_master = create_engine(master_url)

        logger.info(f"Checking if database '{DB_NAME}' exists...")

        with engine_master.connect() as conn:
            # ตรวจสอบว่าฐานข้อมูลมีอยู่หรือไม่
            result = conn.execute(
                text(f"SELECT name FROM sys.databases WHERE name = '{DB_NAME}'"))
            db_exists = result.fetchone() is not None

            if not db_exists:
                logger.info(
                    f"Database '{DB_NAME}' does not exist. Creating...")
                # สร้างฐานข้อมูลใหม่
                conn.execute(text(f"CREATE DATABASE {DB_NAME}"))
                logger.info(f"Database '{DB_NAME}' created successfully.")
            else:
                logger.info(f"Database '{DB_NAME}' already exists.")

        # 2. สร้างตารางในฐานข้อมูล
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")

        # 3. ตรวจสอบและนำข้อมูล seed เข้าระบบถ้าจำเป็น
        logger.info("Checking tables for data...")
        check_and_seed_tables()

        return True

    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        logger.warning(
            "Application may not function properly without database connection")

        # กรณี error ให้รีเทิร์น False แทนที่จะโยน exception เพื่อให้แอพยังทำงานต่อได้
        return False


if __name__ == "__main__":
    init_database()
