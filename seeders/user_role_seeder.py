import uuid
from sqlalchemy.exc import NoResultFound
from models.user_role import UserRole
from models.user import User
from models.role import Role
from seeders.base_seeder import BaseSeeder
from lib.logger import get_logger
from config.database import get_db
import traceback

logger = get_logger("user_role_seeder")

class UserRoleSeeder(BaseSeeder):
    """Seeder for user_roles table"""

    def __init__(self):
        super().__init__(UserRole, "user_roles", "user_roles")

    def seed(self):
        """Seed the user_roles data with relationship mapping"""
        try:
            logger.info("=== Starting UserRoleSeeder ===")
            self.db = next(get_db())

            # ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
            try:
                record_count = self.db.query(UserRole).count()
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
                
                if "user_roles" not in seed_data:
                    logger.warning("No 'user_roles' key in seed data")
                    logger.warning(f"Available keys: {list(seed_data.keys())}")
                    return False

                # สร้าง dictionaries เพื่อ lookup user และ role จากชื่อ
                users = {user.email: user for user in self.db.query(User).all()}
                roles = {role.name: role for role in self.db.query(Role).all()}
                
                logger.info(f"Found {len(users)} users in DB: {list(users.keys())}")
                logger.info(f"Found {len(roles)} roles in DB: {list(roles.keys())}")
                
                # ถ้าไม่มี users หรือ roles ให้แจ้งเตือนและออกจากฟังก์ชัน
                if not users:
                    logger.warning("No users found in database. Please seed users first.")
                    return False
                    
                if not roles:
                    logger.warning("No roles found in database. Please seed roles first.")
                    return False

                # สร้าง user_roles
                count = 0
                for user_role_data in seed_data["user_roles"]:
                    user_email = user_role_data.get("user_email")
                    role_name = user_role_data.get("role_name")
                    
                    logger.info(f"Processing user_role: {user_email} -> {role_name}")
                    
                    # ตรวจสอบว่ามี user_email และ role_name ที่กำหนดหรือไม่
                    if user_email not in users:
                        logger.warning(f"User with email '{user_email}' not found, skipping user_role")
                        continue
                        
                    if role_name not in roles:
                        logger.warning(f"Role '{role_name}' not found, skipping user_role")
                        continue
                    
                    # ตรวจสอบว่ามี user_role นี้อยู่แล้วหรือไม่
                    try:
                        existing = self.db.query(UserRole).filter(
                            UserRole.user_id == users[user_email].id,
                            UserRole.role_id == roles[role_name].id
                        ).first()
                        
                        if existing:
                            logger.info(f"User '{user_email}' already has role '{role_name}', skipping")
                            continue
                    except Exception as e:
                        logger.error(f"Error checking existing user_role: {str(e)}")
                        continue
                    
                    # สร้าง user_role
                    try:
                        user_role = UserRole(
                            id=uuid.uuid4(),
                            user_id=users[user_email].id,
                            role_id=roles[role_name].id
                        )
                        
                        self.db.add(user_role)
                        count += 1
                        logger.info(f"Added user_role: {user_email} -> {role_name}")
                    except Exception as e:
                        logger.error(f"Error creating user_role: {str(e)}")
                        continue
                
                # บันทึกการเปลี่ยนแปลง
                try:
                    self.db.commit()
                    logger.info(f"Seeded {count} {self.table_name} successfully")
                    return True
                except Exception as e:
                    logger.error(f"Error committing user_roles: {str(e)}")
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
