import uuid
from sqlalchemy.exc import NoResultFound
from models.departments import Department
from models.department_groups import DepartmentGroup
from seeders.base_seeder import BaseSeeder
from lib.logger import get_logger
from config.database import get_db
import traceback

logger = get_logger("department_seeder")

class DepartmentSeeder(BaseSeeder):
    """Seeder for departments table"""

    def __init__(self):
        super().__init__(Department, "departments", "departments")

    def seed(self):
        """Seed the departments data with hierarchy"""
        try:
            logger.info("=== Starting DepartmentSeeder ===")
            self.db = next(get_db())

            # ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
            try:
                record_count = self.db.query(Department).count()
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
                
                if "departments" not in seed_data:
                    logger.warning("No 'departments' key in seed data")
                    logger.warning(f"Available keys: {list(seed_data.keys())}")
                    return False

                # สร้าง dictionary สำหรับ department groups
                groups = {group.name: group for group in self.db.query(DepartmentGroup).all()}
                
                logger.info(f"Found {len(groups)} department groups in DB: {list(groups.keys())}")
                
                # ถ้าไม่มี department groups แต่มีการอ้างอิงใน seed ให้แจ้งเตือน
                if not groups and any("group_name" in dept for dept in seed_data["departments"]):
                    logger.warning("No department groups found in database. Please seed department groups first.")
                    # ไม่ออกจากฟังก์ชันเพราะอาจมีหน่วยงานที่ไม่มี group ก็ได้

                # รอบแรก: สร้างหน่วยงานที่ไม่มี parent ก่อน และเก็บไว้ใช้อ้างอิง
                departments_dict = {}
                count = 0
                
                logger.info("Creating top-level departments...")
                for dept_data in seed_data["departments"]:
                    if "parent_name" not in dept_data or not dept_data["parent_name"]:
                        dept_name = dept_data.get("name")
                        
                        # ตรวจสอบว่ามีข้อมูลครบหรือไม่
                        if not dept_name:
                            logger.warning("Department data missing name, skipping")
                            continue
                            
                        # ตรวจสอบว่ามีหน่วยงานนี้อยู่แล้วหรือไม่
                        try:
                            existing = self.db.query(Department).filter(Department.name == dept_name).first()
                            
                            if existing:
                                logger.info(f"Department '{dept_name}' already exists, using existing")
                                departments_dict[dept_name] = existing
                                continue
                        except Exception as e:
                            logger.error(f"Error checking existing department: {str(e)}")
                            continue
                            
                        # ดึงข้อมูลกลุ่มหน่วยงาน (ถ้ามี)
                        group_id = None
                        group_name = dept_data.get("group_name")
                        if group_name:
                            if group_name in groups:
                                group_id = groups[group_name].id
                            else:
                                logger.warning(f"Department group '{group_name}' not found for department '{dept_name}'")
                        
                        # สร้าง department
                        try:
                            department = Department(
                                id=uuid.uuid4(),
                                name=dept_name,
                                short_name=dept_data.get("short_name"),
                                code=dept_data.get("code"),
                                group_id=group_id,
                                order_index=dept_data.get("order_index", 0),
                                is_active=dept_data.get("is_active", True)
                            )
                            
                            self.db.add(department)
                            departments_dict[dept_name] = department
                            count += 1
                            logger.info(f"Added top-level department: {dept_name}")
                        except Exception as e:
                            logger.error(f"Error creating department: {str(e)}")
                            continue
                
                # บันทึกการเปลี่ยนแปลงรอบแรก
                try:
                    self.db.commit()
                    logger.info(f"Seeded {count} top-level departments successfully")
                except Exception as e:
                    logger.error(f"Error committing top-level departments: {str(e)}")
                    self.db.rollback()
                    return False
                
                # รอบสอง: สร้าง department ที่มี parent
                logger.info("Creating child departments...")
                child_count = 0
                
                for dept_data in seed_data["departments"]:
                    if "parent_name" in dept_data and dept_data["parent_name"]:
                        dept_name = dept_data.get("name")
                        parent_name = dept_data.get("parent_name")
                        
                        # ตรวจสอบว่ามีข้อมูลครบหรือไม่
                        if not dept_name:
                            logger.warning("Department data missing name, skipping")
                            continue
                            
                        # ตรวจสอบว่ามีหน่วยงานนี้อยู่แล้วหรือไม่
                        try:
                            existing = self.db.query(Department).filter(Department.name == dept_name).first()
                            
                            if existing:
                                logger.info(f"Department '{dept_name}' already exists, skipping")
                                continue
                        except Exception as e:
                            logger.error(f"Error checking existing department: {str(e)}")
                            continue
                        
                        # ตรวจสอบว่า parent มีอยู่หรือไม่
                        if parent_name not in departments_dict:
                            logger.warning(f"Parent department '{parent_name}' not found for '{dept_name}', skipping")
                            continue
                        
                        # ดึงข้อมูลกลุ่มหน่วยงาน (ถ้ามี)
                        group_id = None
                        group_name = dept_data.get("group_name")
                        if group_name:
                            if group_name in groups:
                                group_id = groups[group_name].id
                            else:
                                logger.warning(f"Department group '{group_name}' not found for department '{dept_name}'")
                        
                        # สร้าง department
                        try:
                            department = Department(
                                id=uuid.uuid4(),
                                name=dept_name,
                                short_name=dept_data.get("short_name"),
                                code=dept_data.get("code"),
                                parent_id=departments_dict[parent_name].id,
                                group_id=group_id,
                                order_index=dept_data.get("order_index", 0),
                                is_active=dept_data.get("is_active", True)
                            )
                            
                            self.db.add(department)
                            departments_dict[dept_name] = department
                            child_count += 1
                            logger.info(f"Added child department: {dept_name} under {parent_name}")
                        except Exception as e:
                            logger.error(f"Error creating child department: {str(e)}")
                            continue
                
                # บันทึกการเปลี่ยนแปลงรอบสอง
                try:
                    self.db.commit()
                    logger.info(f"Seeded {child_count} child departments successfully")
                    logger.info(f"Total departments seeded: {count + child_count}")
                    return True
                except Exception as e:
                    logger.error(f"Error committing child departments: {str(e)}")
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