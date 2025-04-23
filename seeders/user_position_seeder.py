import uuid
from sqlalchemy.exc import NoResultFound
from models.user_positions import UserPosition
from models.user import User
from models.position import Position
from seeders.base_seeder import BaseSeeder
from lib.logger import get_logger
from config.database import get_db
import traceback

logger = get_logger("user_position_seeder")

class UserPositionSeeder(BaseSeeder):
    """Seeder for user_positions table"""

    def __init__(self):
        super().__init__(UserPosition, "user_positions", "user_positions")

    def seed(self):
        """Seed the user_positions data"""
        try:
            logger.info("=== Starting UserPositionSeeder ===")
            self.db = next(get_db())

            # ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
            try:
                record_count = self.db.query(UserPosition).count()
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
                
                if "user_positions" not in seed_data:
                    logger.warning("No 'user_positions' key in seed data")
                    logger.warning(f"Available keys: {list(seed_data.keys())}")
                    return False

                # สร้าง dictionary สำหรับ users และ positions
                # สร้าง dictionaries เพื่อ lookup
                users = {user.citizen_id: user for user in self.db.query(User).all()}
                
                # สร้าง dict เพื่อค้นหา position ตามชื่อและระดับ
                positions_dict = {}
                for position in self.db.query(Position).all():
                    # เก็บโดยใช้ชื่อและระดับเป็น key
                    key = f"{position.name}_{position.level}"
                    positions_dict[key] = position
                    # เก็บแบบไม่มีระดับด้วยเผื่อในกรณีที่ seed ไม่มีระดับ
                    positions_dict[position.name] = position
                
                logger.info(f"Found {len(users)} users in DB")
                logger.info(f"Found {len(positions_dict)} positions in DB")
                
                # ถ้าไม่มี users หรือ positions ให้แจ้งเตือน
                if not users:
                    logger.warning("No users found in database. Please seed users first.")
                    return False
                    
                if not positions_dict:
                    logger.warning("No positions found in database. Please seed positions first.")
                    return False

                # สร้าง user_positions
                count = 0
                
                for user_position_data in seed_data["user_positions"]:
                    user_citizen_id = user_position_data.get("user_citizen_id")
                    position_name = user_position_data.get("position_name")
                    position_level = user_position_data.get("position_level")
                    is_primary = user_position_data.get("is_primary", True)
                    
                    logger.info(f"Processing user_position: {user_citizen_id} -> {position_name} ({position_level})")
                    
                    # ตรวจสอบว่ามี user_citizen_id หรือไม่
                    if not user_citizen_id or user_citizen_id not in users:
                        logger.warning(f"User with citizen_id '{user_citizen_id}' not found, skipping user_position")
                        continue
                    
                    # ตรวจสอบว่ามี position หรือไม่
                    position_key = f"{position_name}_{position_level}" if position_level else position_name
                    if position_key not in positions_dict:
                        logger.warning(f"Position '{position_key}' not found, skipping user_position")
                        continue
                    
                    # ดึง user และ position objects
                    user = users[user_citizen_id]
                    position = positions_dict[position_key]
                    
                    # ตรวจสอบว่าผู้ใช้มีตำแหน่งนี้แล้วหรือไม่
                    try:
                        existing = self.db.query(UserPosition).filter(
                            UserPosition.user_id == user.id,
                            UserPosition.position_id == position.id
                        ).first()
                        
                        if existing:
                            logger.info(f"User '{user_citizen_id}' already has position '{position_key}', skipping")
                            continue
                    except Exception as e:
                        logger.error(f"Error checking existing user_position: {str(e)}")
                        continue
                    
                    # ถ้าเป็นตำแหน่งหลัก ตรวจสอบและยกเลิกตำแหน่งหลักเดิม
                    if is_primary:
                        try:
                            existing_primary = self.db.query(UserPosition).filter(
                                UserPosition.user_id == user.id,
                                UserPosition.is_primary == True
                            ).all()
                            
                            for pos in existing_primary:
                                pos.is_primary = False
                                logger.info(f"Removing primary flag from existing position for user '{user_citizen_id}'")
                        except Exception as e:
                            logger.error(f"Error handling primary position: {str(e)}")
                    
                    # สร้าง user_position
                    try:
                        user_position = UserPosition(
                            id=uuid.uuid4(),
                            user_id=user.id,
                            position_id=position.id,
                            start_date=user_position_data.get("start_date"),
                            end_date=user_position_data.get("end_date"),
                            is_primary=is_primary
                        )
                        
                        self.db.add(user_position)
                        count += 1
                        logger.info(f"Added user_position: {user_citizen_id} -> {position_key}")
                    except Exception as e:
                        logger.error(f"Error creating user_position: {str(e)}")
                        continue
                
                # บันทึกการเปลี่ยนแปลง
                try:
                    self.db.commit()
                    logger.info(f"Seeded {count} {self.table_name} successfully")
                    return True
                except Exception as e:
                    logger.error(f"Error committing user_positions: {str(e)}")
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