import uuid
import traceback
from sqlalchemy.exc import NoResultFound
from models.outside_departments import OutsideDepartment
from seeders.base_seeder import BaseSeeder
from lib.logger import get_logger
from config.database import get_db

logger = get_logger("outside_department_seeder")

class OutsideDepartmentSeeder(BaseSeeder):
    """Seeder for outside_departments table"""

    def __init__(self):
        super().__init__(OutsideDepartment, "outside_departments", "outside_departments")

    def seed(self):
        """Seed the outside_departments data"""
        try:
            logger.info("=== Starting OutsideDepartmentSeeder ===")
            self.db = next(get_db())

            # ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
            try:
                record_count = self.db.query(OutsideDepartment).count()
                logger.info(f"Checking {self.table_name} table for existing records: {record_count} found")
            except Exception as e:
                logger.error(f"Error counting records: {str(e)}")
                record_count = 0  # ถ้านับไม่ได้ให้ถือว่าไม่มีข้อมูล
            
            if record_count == 0:
                logger.info(f"{self.table_name} table is empty. Seeding data...")

                # โหลดข้อมูล seed
                seed_data = self.load_seed_data()
                logger.info(f"Seed data loaded: {seed_data is not None}")
                
                if not seed_data:
                    logger.warning("No seed data found")
                    return False
                
                if "outside_departments" not in seed_data:
                    logger.warning("No 'outside_departments' key in seed data")
                    logger.warning(f"Available keys: {list(seed_data.keys())}")
                    return False

                count = 0
                
                logger.info("Creating outside departments...")
                for dept_data in seed_data["outside_departments"]:
                    dept_name = dept_data.get("name")
                    
                    # ตรวจสอบว่ามีข้อมูลครบหรือไม่
                    if not dept_name:
                        logger.warning("Outside department data missing name, skipping")
                        continue
                        
                    # ตรวจสอบว่ามีหน่วยงานนี้อยู่แล้วหรือไม่
                    try:
                        existing = self.db.query(OutsideDepartment).filter(
                            OutsideDepartment.name == dept_name
                        ).first()
                        
                        if existing:
                            logger.info(f"Outside department '{dept_name}' already exists, skipping")
                            continue

                    except Exception as e:
                        logger.error(f"Error checking existing outside department: {str(e)}")
                        continue
                    
                    # สร้าง outside department
                    try:
                        outside_department = OutsideDepartment(
                            id=uuid.uuid4(),
                            name=dept_name,
                            description=dept_data.get("description"),
                            order_index=dept_data.get("order_index", 0),
                            is_active=dept_data.get("is_active", True)
                        )
                        
                        self.db.add(outside_department)
                        count += 1
                        logger.info(f"Added outside department: {dept_name}")
                    except Exception as e:
                        logger.error(f"Error creating outside department: {str(e)}")
                        continue
                
                # บันทึกการเปลี่ยนแปลง
                try:
                    self.db.commit()
                    logger.info(f"Seeded {count} outside departments successfully")
                    return True
                except Exception as e:
                    logger.error(f"Error committing outside departments: {str(e)}")
                    self.db.rollback()
                    return False
            else:
                logger.info(f"{self.table_name} table already has {record_count} records. Skipping seeding.")
                return False

        except Exception as e:
            logger.error(f"Error seeding {self.table_name}: {str(e)}")
            logger.error(traceback.format_exc())  # แสดง stack trace เต็มรูปแบบ
            if hasattr(self, 'db') and self.db:
                self.db.rollback()
            return False
