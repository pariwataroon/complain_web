import json
import os

import bcrypt
from sqlalchemy import inspect

from config.database import get_db
from lib.logger import get_logger

logger = get_logger("seeder")

class BaseSeeder:
    """Base class for all database seeders"""

    def __init__(self, model_class, table_name, seed_file_name=None):
        self.model_class = model_class
        self.table_name = table_name
        self.seed_file_name = seed_file_name or table_name
        self.db = None

    def load_seed_data(self):
        """Load seed data from JSON file"""
        try:
            # กำหนด path ของไฟล์ seed
            seed_path = os.path.join(os.path.dirname(os.path.dirname(
                os.path.abspath(__file__))), "seed", f"{self.seed_file_name}_seed.json")
            if not os.path.exists(seed_path):
                logger.warning(f"Seed file for {self.table_name} not found at: {seed_path}")
                return None

            # อ่านข้อมูลจากไฟล์ JSON โดยระบุ encoding เป็น utf-8 ให้ชัดเจน
            with open(seed_path, 'r', encoding='utf-8') as file:
                seed_data = json.load(file)
                logger.info(f"Loaded seed data for {self.table_name} successfully")
                return seed_data

        except Exception as e:
            logger.error(f"Error loading seed data for {self.table_name}: {str(e)}")
            return None

    def hash_password(self, password):
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    def get_model_attributes(self):
        """Get model attributes excluding auto-generated fields"""
        return {c.name for c in inspect(self.model_class).columns
                if c.name not in [f'{self.table_name[:-1]}_id', 'created_at', 'updated_at']}

    def seed(self):
        """Seed data if table is empty"""
        """Override seed method to handle password hashing if needed"""
        try:
            self.db = next(get_db())

            # ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
            record_count = self.db.query(self.model_class).count()
            logger.info(f"Checking {self.table_name} table for existing records: {record_count} found")
            if record_count == 0:
                logger.info(f"{self.table_name} table is empty. Seeding data...")

                # โหลดข้อมูล seed
                seed_data = self.load_seed_data()

                # ตรวจสอบว่า key ของข้อมูลมีชื่อเดียวกับตารางหรือไม่
                data_key = next((k for k in seed_data.keys()
                                if k.lower() == self.table_name.lower()), None)

                if seed_data and data_key:
                    # ดึง attributes ของ model
                    model_attrs = self.get_model_attributes()
                    logger.info(f"Model attributes available for seeding: {model_attrs}")

                    # สร้าง objects และเพิ่มลงในฐานข้อมูล
                    for item_data in seed_data[data_key]:
                        # สร้าง dict เก็บค่าที่จะใส่ใน model
                        model_data = {}

                        # ตรวจสอบแต่ละ field ใน seed data ว่าตรงกับ model หรือไม่
                        for key, value in item_data.items():
                            # ถ้าเป็น password และไม่ได้เป็น hashed_password อยู่แล้ว ให้แฮช
                            if key == 'password' and 'hashed_password' in model_attrs:
                                model_data['hashed_password'] = self.hash_password(
                                    value)
                            # ถ้าเป็น field ปกติและมีใน model
                            elif key in model_attrs:
                                model_data[key] = value

                        # เพิ่มค่า default สำหรับ is_active ถ้ามีในโมเดล
                        if 'is_active' in model_attrs and 'is_active' not in model_data:
                            model_data['is_active'] = True

                        # สร้าง instance ของ model ด้วย **model_data (unpacking dict)
                        item = self.model_class(**model_data)
                        self.db.add(item)

                    # บันทึกการเปลี่ยนแปลง
                    self.db.commit()
                    logger.info(f"Seeded {len(seed_data[data_key])} {self.table_name} successfully")
                    return True
                else:
                    logger.warning(f"No {self.table_name} data found in seed file or invalid format")
            else:
                logger.info(f"{self.table_name} table already has {record_count} records. Skipping seeding.")

            return False

        except Exception as e:
            logger.error(f"Error seeding {self.table_name}: {str(e)}")
            if hasattr(self, 'db') and self.db:
                self.db.rollback()
            return False
