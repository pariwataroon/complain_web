import os
import sys
import urllib.parse

from sqlalchemy import create_engine, inspect, text, MetaData, Table, Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.sql import func

from config.database import Base, engine, get_db
from config.dotenv import DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER
from lib.logger import get_logger
from seeders.title_seeder import TitleSeeder
from seeders.comp_verification_tokens_seeder import VerificationTokenSeeder
from seeders.user_seeder import UserSeeder
from seeders.role_seeder import RoleSeeder
from seeders.resource_groups_seeder import ResourceGroupSeeder
from seeders.resource_seeder import ResourceSeeder
from seeders.permission_seeder import PermissionSeeder
from seeders.user_role_seeder import UserRoleSeeder
from seeders.time_setting_seeder import TimeSettingSeeder
from seeders.positions_seeder import PositionSeeder
from seeders.user_position_seeder import UserPositionSeeder
from seeders.department_groups_seeder import DepartmentGroupSeeder
from seeders.department_seeder import DepartmentSeeder
from seeders.venues_seeder import VenueSeeder
from seeders.notification_seeder import NotificationSeeder
from seeders.comp_geographies_seeder import GeographySeeder
from seeders.comp_provinces_seeder import ProvinceSeeder
from seeders.comp_amphures_seeder import AmphureSeeder
from seeders.comp_districts_seeder import DistrictSeeder
from seeders.comp_complaint_types_seeder import ComplaintTypeSeeder
from seeders.comp_complaint_subtypes_seeder import ComplaintSubTypeSeeder
from seeders.comp_complaint_channels_seeder import ComplaintChannelSeeder

# Import the ApiLog model (you'll need to create this)
from models.api_log import ApiLog

# เพิ่ม path เพื่อป้องกัน import error
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = get_logger("db_init")


def check_and_seed_tables():
    """Check if tables exist and have data, seed if necessary"""
    try:
        # ตรวจสอบว่าตารางต่างๆ มีอยู่หรือไม่
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        # รายการ seeders ที่ต้องการใช้งาน
        # กำหนดลำดับที่ชัดเจน
        seeders = [
            {"name": "titles", "seeder": TitleSeeder(), "table_prefix": "comp_"},
            {"name": "verification_tokens", "seeder": VerificationTokenSeeder(), "table_prefix": ""},
            {"name": "users", "seeder": UserSeeder(), "table_prefix": "comp_"},
            {"name": "roles", "seeder": RoleSeeder(), "table_prefix": ""},
            {"name": "resource_groups", "seeder": ResourceGroupSeeder(), "table_prefix": ""},
            {"name": "resources", "seeder": ResourceSeeder(), "table_prefix": ""},
            # ต้อง seed roles และ resources ก่อน permissions
            {"name": "permissions", "seeder": PermissionSeeder(), "table_prefix": ""},
            # ต้อง seed users และ roles ก่อน user_roles
            {"name": "user_roles", "seeder": UserRoleSeeder(), "table_prefix": ""},
            {"name": "time_settings", "seeder": TimeSettingSeeder(), "table_prefix": ""},
            {"name": "positions", "seeder": PositionSeeder(), "table_prefix": ""},
            {"name": "user_positions", "seeder": UserPositionSeeder(), "table_prefix": ""},
            {"name": "department_groups", "seeder": DepartmentGroupSeeder(), "table_prefix": ""},
            {"name": "departments", "seeder": DepartmentSeeder(), "table_prefix": ""},
            {"name": "venues", "seeder": VenueSeeder(), "table_prefix": ""},
            {"name": "notifications", "seeder": NotificationSeeder(), "table_prefix": ""},
            {"name": "geographies", "seeder": GeographySeeder(), "table_prefix": "comp_"},
            {"name": "provinces", "seeder": ProvinceSeeder(), "table_prefix": "comp_"},
            {"name": "amphures", "seeder": AmphureSeeder(), "table_prefix": "comp_"},
            {"name": "districts", "seeder": DistrictSeeder(), "table_prefix": "comp_"},
            {"name": "complaint_types", "seeder": ComplaintTypeSeeder(), "table_prefix": "comp_"},
            {"name": "complaint_subtypes", "seeder": ComplaintSubTypeSeeder(), "table_prefix": "comp_"},
            {"name": "complaint_channels", "seeder": ComplaintChannelSeeder(), "table_prefix": "comp_"},
        ]

        # วนลูปตรวจสอบแต่ละตาราง โดยเรียกตามลำดับที่กำหนดไว้ในลิสต์
        for seeder_info in seeders:
            table_name = seeder_info["table_prefix"] + seeder_info["name"]
            seeder = seeder_info["seeder"]

            # ตรวจสอบว่าตารางมีอยู่ในฐานข้อมูลหรือยัง
            if table_name in tables:
                logger.info(f"Table '{table_name}' exists. Running seeder...")
                # เพิ่ม debug เพื่อตรวจสอบการทำงาน
                success = seeder.seed()
                logger.info(f"Seeder for '{table_name}' completed with success: {success}")
            else:
                logger.info(f"Table '{table_name}' does not exist yet. Will be created on next app start.")
                
        # Check if api_logs table exists, create it if not
        if "api_logs" not in tables:
            logger.info("Creating api_logs table...")
            ensure_api_logs_table_exists()

    except Exception as e:
        logger.error(f"Error checking and seeding tables: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())  # เพิ่ม stack trace เพื่อ debug


def ensure_api_logs_table_exists():
    """Ensure the api_logs table exists in the database"""
    try:
        # Define the api_logs table using SQLAlchemy Core
        metadata = MetaData()
        api_logs = Table(
            "api_logs", metadata,
            Column("id", UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4),
            Column("request_id", String(100), index=True),
            Column("method", String(10)),
            Column("path", String(255)),
            Column("query_params", Text, nullable=True),
            Column("client_ip", String(50)),
            Column("status_code", Integer),
            Column("process_time_ms", Float),
            Column("request_body", Text, nullable=True),
            Column("request_headers", Text, nullable=True),
            Column("user_id", UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=True),
            Column("created_at", DateTime, default=func.now())
        )
        
        # Create the table if it doesn't exist
        metadata.create_all(engine, tables=[api_logs])
        logger.info("API logs table created successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error creating API logs table: {str(e)}")
        return False


def init_database():
    """Initialize database tables based on SQLAlchemy models"""
    logger.info("Initializing database...")

    DB_PASSWORD_ENCODE = urllib.parse.quote_plus(DB_PASSWORD)

    # เพิ่ม charset=UTF8 ใน connection string
    conn_string = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD_ENCODE}@{DB_HOST}:{DB_PORT}/{DB_NAME}?driver=ODBC+Driver+18+for+SQL+Server&charset=UTF8"
    
    logger.info(
        f"Connection string (without password): {conn_string.replace(DB_PASSWORD_ENCODE, '****')}")

    try:
        # 1. เชื่อมต่อกับฐานข้อมูล master
        master_url = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD_ENCODE}@{DB_HOST}:{DB_PORT}/master?driver=ODBC+Driver+18+for+SQL+Server&charset=UTF8"
        engine_master = create_engine(
            master_url,
            connect_args={
                "TrustServerCertificate": "yes",
                "Encrypt": "yes",
                "charset": "utf8"
            }
        )

        logger.info(f"Checking if database '{DB_NAME}' exists...")

        with engine_master.connect() as conn:
            # ตรวจสอบว่าฐานข้อมูลมีอยู่หรือไม่
            result = conn.execute(
                text(f"SELECT name FROM sys.databases WHERE name = '{DB_NAME}'"))
            db_exists = result.fetchone() is not None

            if not db_exists:
                logger.info(
                    f"Database '{DB_NAME}' does not exist. Creating...")
                # สร้างฐานข้อมูลใหม่ด้วย collation ที่รองรับ Unicode
                conn.execute(text(f"CREATE DATABASE {DB_NAME} COLLATE Thai_CI_AS"))
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
        
        # Make sure the API logs table exists (in case it wasn't created by SQLAlchemy models)
        ensure_api_logs_table_exists()
        
        # เพิ่มการเรียก UserRoleSeeder โดยตรง
        from seeders.user_role_seeder import UserRoleSeeder
        logger.info("Running UserRoleSeeder directly...")
        user_role_seeder = UserRoleSeeder()
        user_role_seeder.seed()

        from seeders.user_position_seeder import UserPositionSeeder
        logger.info("Running UserPositionSeeder directly...")
        user_position_seeder = UserPositionSeeder()
        user_position_seeder.seed()
        
        from seeders.department_seeder import DepartmentSeeder
        logger.info("Running DepartmentSeeder directly...")
        department_seeder = DepartmentSeeder()
        department_seeder.seed()

        from seeders.venues_seeder import VenueSeeder
        logger.info("Running VenueSeeder directly...")
        venue_seeder = VenueSeeder()
        venue_seeder.seed()

        return True

    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        logger.warning(
            "Application may not function properly without database connection")

        # กรณี error ให้รีเทิร์น False แทนที่จะโยน exception เพื่อให้แอพยังทำงานต่อได้
        return False


if __name__ == "__main__":
    init_database()
