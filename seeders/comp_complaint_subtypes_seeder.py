import uuid
from sqlalchemy.exc import NoResultFound
from models.comp_complaint_types import ComplaintSubType, ComplaintType
from seeders.base_seeder import BaseSeeder
from lib.logger import get_logger
from config.database import get_db
import traceback

logger = get_logger("subtypes_seeder")

class ComplaintSubTypeSeeder(BaseSeeder):
    """Seeder for comp_complaint_subtypes table"""

    def __init__(self):
        super().__init__(ComplaintSubType, "comp_complaint_subtypes", "comp_complaint_subtypes")

    def seed(self):
        """Seed the complaint subtypes data"""
        try:
            logger.info("=== Starting ComplaintSubTypeSeeder ===")
            self.db = next(get_db())

            # ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
            record_count = self.db.query(ComplaintSubType).count()
            logger.info(f"Checking {self.table_name} table for existing records: {record_count} found")
            
            if record_count == 0:
                logger.info(f"{self.table_name} table is empty. Seeding data...")

                # โหลดข้อมูล seed
                seed_data = self.load_seed_data()
                
                if not seed_data:
                    logger.warning("No seed data found")
                    return False
                
                if "comp_complaint_subtypes" not in seed_data:
                    logger.warning("No 'comp_complaint_subtypes' key in seed data")
                    return False

                # ดึงข้อมูลประเภทเรื่องร้องเรียนทั้งหมดเก็บไว้ในรูปแบบ dictionary
                complaint_types = {
                    ctype.name: ctype for ctype in self.db.query(ComplaintType).all()
                }
                
                logger.info(f"Found {len(complaint_types)} complaint types: {list(complaint_types.keys())}")
                
                # ตรวจสอบว่ามีประเภทเรื่องร้องเรียนอยู่ในระบบหรือไม่
                if not complaint_types:
                    logger.warning("No complaint types found in database. Please seed complaint types first.")
                    return False

                # สร้าง complaint subtypes
                count = 0
                subtypes = []
                
                for subtype_data in seed_data["comp_complaint_subtypes"]:
                    # ตรวจสอบว่ามี parent_type_name หรือไม่
                    if "parent_type_name" not in subtype_data:
                        logger.warning(f"Subtype missing parent_type_name, skipping: {subtype_data.get('name', 'unknown')}")
                        continue
                    
                    parent_type_name = subtype_data["parent_type_name"]
                    
                    # หาข้อมูล parent type จากชื่อ
                    if parent_type_name not in complaint_types:
                        logger.warning(f"Parent complaint type '{parent_type_name}' not found, skipping: {subtype_data.get('name', 'unknown')}")
                        continue
                    
                    parent_type_id = complaint_types[parent_type_name].id
                    
                    # สร้าง subtype
                    subtype = ComplaintSubType(
                        id=uuid.uuid4(),
                        parent_type_id=parent_type_id,
                        name=subtype_data.get("name"),
                        description=subtype_data.get("description"),
                        is_active=subtype_data.get("is_active", True)
                    )
                    
                    subtypes.append(subtype)
                    count += 1
                
                # บันทึกข้อมูล
                try:
                    self.db.add_all(subtypes)
                    self.db.commit()
                    logger.info(f"Seeded {count} complaint subtypes successfully")
                    return True
                except Exception as e:
                    logger.error(f"Error committing complaint subtypes: {str(e)}")
                    self.db.rollback()
                    return False
            else:
                logger.info(f"{self.table_name} table already has {record_count} records. Skipping seeding.")
                return False

        except Exception as e:
            logger.error(f"Error seeding {self.table_name}: {str(e)}")
            logger.error(traceback.format_exc())
            if hasattr(self, 'db') and self.db:
                self.db.rollback()
            return False