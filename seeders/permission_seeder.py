import uuid
from models.permission import Permission
from models.role import Role
from models.resource import Resource
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
                
                # เพิ่ม debug เพื่อตรวจสอบข้อมูล roles และ resources
                logger.info(f"Found {len(roles)} roles: {list(roles.keys())}")
                logger.info(f"Found {len(resources)} resources: {list(resources.keys())}")
                
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
                    
                    # ตรวจสอบว่ามี role_name และ resource_name ที่กำหนดหรือไม่
                    if role_name not in roles:
                        logger.warning(f"Role '{role_name}' not found, skipping permission")
                        continue
                        
                    if resource_name not in resources:
                        logger.warning(f"Resource '{resource_name}' not found, skipping permission")
                        continue
                    
                    # สร้าง permission
                    permission = Permission(
                        id=uuid.uuid4(),
                        role_id=roles[role_name].id,
                        resource_id=resources[resource_name].id,
                        can_create=perm_data.get("can_create", False),
                        can_read=perm_data.get("can_read", False),
                        can_update=perm_data.get("can_update", False),
                        can_delete=perm_data.get("can_delete", False)
                    )
                    
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
