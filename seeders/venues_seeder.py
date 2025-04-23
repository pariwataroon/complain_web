import uuid
from sqlalchemy.exc import NoResultFound
from models.venues import Venue
from models.departments import Department
from seeders.base_seeder import BaseSeeder
from lib.logger import get_logger
from config.database import get_db
import traceback

logger = get_logger("venue_seeder")

class VenueSeeder(BaseSeeder):
    """Seeder for venues table"""

    def __init__(self):
        super().__init__(Venue, "venues", "venues")

    def seed(self):
        """Seed the venues data"""
        try:
            logger.info("=== Starting VenueSeeder ===")
            db = next(get_db())
            
            try:
                # ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
                record_count = db.query(Venue).count()
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
                
                if "venues" not in seed_data:
                    logger.warning("No 'venues' key in seed data")
                    logger.warning(f"Available keys: {list(seed_data.keys()) if seed_data else 'None'}")
                    return False

                # ดึงข้อมูล departments จาก DB ไว้เพื่ออ้างอิง
                departments = {dept.name: dept for dept in db.query(Department).all()}
                logger.info(f"Found {len(departments)} departments in DB")
                logger.info(f"Available departments: {list(departments.keys())}")

                # สร้าง venues
                count = 0
                for venue_data in seed_data["venues"]:
                    venue_name = venue_data.get("name")
                    
                    # ตรวจสอบว่ามีข้อมูลครบหรือไม่
                    if not venue_name:
                        logger.warning("Venue data missing name, skipping")
                        continue
                        
                    # ตรวจสอบว่ามีสถานที่นี้อยู่แล้วหรือไม่
                    try:
                        existing = db.query(Venue).filter(Venue.name == venue_name).first()
                        
                        if existing:
                            logger.info(f"Venue '{venue_name}' already exists, skipping")
                            continue
                    except Exception as e:
                        logger.error(f"Error checking existing venue: {str(e)}")
                        continue
                    
                    # เตรียมข้อมูล department_id
                    department_id = None
                    dept_name = venue_data.get("department_name")
                    
                    if not dept_name or dept_name not in departments:
                        logger.warning(f"Required department '{dept_name}' not found for venue '{venue_name}', skipping")
                        continue
                    
                    department_id = departments[dept_name].id
                    logger.info(f"Found department ID for '{dept_name}': {department_id}")
                    
                    # สร้าง venue
                    try:
                        venue = Venue(
                            id=uuid.uuid4(),
                            name=venue_name,
                            short_name=venue_data.get("short_name"),
                            code=venue_data.get("code"),
                            abbreviation=venue_data.get("abbreviation"),
                            color_code=venue_data.get("color_code"),
                            department_id=department_id,  # ใช้ department_id จากที่หาได้
                            group_name=venue_data.get("group_name"),
                            order_index=venue_data.get("order_index", 0),
                            is_active=venue_data.get("is_active", True)
                        )
                        
                        db.add(venue)
                        count += 1
                        logger.info(f"Added venue: {venue_name}")
                    except Exception as e:
                        logger.error(f"Error creating venue: {str(e)}")
                        continue
                
                # บันทึกการเปลี่ยนแปลง
                try:
                    db.commit()
                    logger.info(f"Seeded {count} {self.table_name} successfully")
                    return True
                except Exception as e:
                    logger.error(f"Error committing venues: {str(e)}")
                    db.rollback()
                    return False
            else:
                logger.info(f"{self.table_name} table already has {record_count} records. Skipping seeding.")
                return False

        except Exception as e:
            logger.error(f"Error seeding {self.table_name}: {str(e)}")
            logger.error(traceback.format_exc())  # แสดง stack trace เต็มรูปแบบ
            if 'db' in locals():
                db.rollback()
            return False