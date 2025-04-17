import uuid
from models.permission import Permission
from models.role import Role
from models.resource import Resource
from models.user import User
from seeders.base_seeder import BaseSeeder
from lib.logger import get_logger
from config.database import get_db

logger = get_logger("permission_seeder")

class PermissionSeeder(BaseSeeder):
    """Seeder for permissions table"""

    def __init__(self):
        super().__init__(Permission, "permissions", "permissions")

    def seed(self):
        """Seed the permissions data with relationship mapping"""
        try:
            self.db = next(get_db())

            # เพิ่ม debug เพื่อตรวจสอบว่าเข้ามาในฟังก์ชันหรือไม่
            logger.info(f"Starting permission seeder...")

            # ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
            record_count = self.db.query(Permission).count()
            logger.info(f"Checking {self.table_name} table for existing records: {record_count} found")
            
            if record_count == 0:
                logger.info(f"{self.table_name} table is empty. Seeding data...")

                # โหลดข้อมูล seed
                seed_data = self.load_seed_data()
                
                # เพิ่ม debug เพื่อตรวจสอบข้อมูล seed
                logger.info(f"Seed data keys: {seed_data.keys() if seed_data else 'None'}")
                
                if not seed_data or "permissions" not in seed_data:
                    logger.warning(f"No {self.table_name} data found in seed file or invalid format")
                    return False

                # สร้าง dictionaries เพื่อ lookup role และ resource จากชื่อ
                roles = {role.name: role for role in self.db.query(Role).all()}
                resources = {resource.name: resource for resource in self.db.query(Resource).all()}
                
                # สร้าง dictionary เพื่อ lookup user จาก citizen_id
                users_by_citizen_id = {user.citizen_id: user for user in self.db.query(User).all()}
                
                # เพิ่ม debug เพื่อตรวจสอบข้อมูล
                logger.info(f"Found {len(roles)} roles: {list(roles.keys())}")
                logger.info(f"Found {len(resources)} resources: {list(resources.keys())}")
                logger.info(f"Found {len(users_by_citizen_id)} users")
                
                # ถ้าไม่มี roles หรือ resources ให้แจ้งเตือนและออกจากฟังก์ชัน
                if not roles:
                    logger.warning("No roles found in database. Please seed roles first.")
                    return False
                    
                if not resources:
                    logger.warning("No resources found in database. Please seed resources first.")
                    return False

                # สร้าง permissions
                count = 0
                for perm_data in seed_data["permissions"]:
                    role_name = perm_data.get("role_name")
                    resource_name = perm_data.get("resource_name")
                    user_citizen_id = perm_data.get("user_citizen_id")
                    
                    # ตรวจสอบว่ามี resource_name ที่กำหนดหรือไม่
                    if resource_name not in resources:
                        logger.warning(f"Resource '{resource_name}' not found, skipping permission")
                        continue
                    
                    # เตรียมข้อมูลพื้นฐานสำหรับ permission
                    perm_dict = {
                        "id": uuid.uuid4(),
                        "resource_id": resources[resource_name].id,
                        "can_create": perm_data.get("can_create", False),
                        "can_read": perm_data.get("can_read", False),
                        "can_update": perm_data.get("can_update", False),
                        "can_delete": perm_data.get("can_delete", False)
                    }
                    
                    # กรณีที่เป็น role-based permission
                    if role_name is not None:
                        if role_name not in roles:
                            logger.warning(f"Role '{role_name}' not found, skipping permission")
                            continue
                        
                        perm_dict["role_id"] = roles[role_name].id
                    else:
                        perm_dict["role_id"] = None
                    
                    # กรณีที่เป็น user-based permission
                    if user_citizen_id is not None:
                        # ตรวจสอบว่ามี user ที่มี citizen_id ตามที่กำหนดหรือไม่
                        if user_citizen_id not in users_by_citizen_id:
                            logger.warning(f"User with citizen_id '{user_citizen_id}' not found, skipping permission")
                            continue
                        
                        # เก็บ user_id แทน user_citizen_id
                        perm_dict["user_id"] = users_by_citizen_id[user_citizen_id].id
                    else:
                        perm_dict["user_id"] = None
                    
                    # ตรวจสอบว่าต้องมีอย่างน้อย role หรือ user
                    if perm_dict["role_id"] is None and perm_dict["user_id"] is None:
                        logger.warning("Permission must be associated with either a role or a user. Skipping.")
                        continue
                    
                    # สร้าง permission
                    permission = Permission(**perm_dict)
                    self.db.add(permission)
                    count += 1
                
                # บันทึกการเปลี่ยนแปลง
                self.db.commit()
                logger.info(f"Seeded {count} {self.table_name} successfully")
                return True
            else:
                logger.info(f"{self.table_name} table already has {record_count} records. Skipping seeding.")
                return False

        except Exception as e:
            logger.error(f"Error seeding {self.table_name}: {str(e)}")
            # เพิ่ม stack trace เพื่อ debug
            import traceback
            logger.error(traceback.format_exc())
            
            if hasattr(self, 'db') and self.db:
                self.db.rollback()
            return False