import json
import os
import uuid
import traceback
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from models.resource import Resource
from models.resource_groups import ResourceGroup
from seeders.base_seeder import BaseSeeder
from lib.logger import get_logger
from config.database import get_db

logger = get_logger("resource_seeder")

class ResourceSeeder(BaseSeeder):
    """Seeder for resources table"""

    def __init__(self):
        super().__init__(Resource, "resources", "resources")

    def seed(self):
        """Seed resources data with group relationships"""
        try:
            logger.info("=== Starting ResourceSeeder ===")
            db = next(get_db())
            
            try:
                # ตรวจสอบว่ามีข้อมูลในตารางหรือไม่
                record_count = db.query(Resource).count()
                logger.info(f"Checking {self.table_name} table for existing records: {record_count} found")
            
            except Exception as e:
                logger.error(f"Error counting records: {str(e)}")
                record_count = 0
            
            if record_count == 0:
                logger.info(f"{self.table_name} table is empty. Seeding data...")

                # โหลดข้อมูล seed
                seed_data = self.load_seed_data()
                
                if not seed_data or "resources" not in seed_data:
                    logger.warning("No resource seed data found")
                    return False

                # ดึงข้อมูล resource groups มาเพื่ออ้างอิง
                resource_groups = {}
                try:
                    for group in db.query(ResourceGroup).all():
                        resource_groups[group.name] = group
                    logger.info(f"Found {len(resource_groups)} resource groups")
                    
                    if not resource_groups:
                        logger.warning("No resource groups found. Make sure ResourceGroupSeeder ran first.")
                except Exception as e:
                    logger.error(f"Error fetching resource groups: {str(e)}")
                    resource_groups = {}

                # สร้าง resources
                count = 0
                errors = 0
                for resource_data in seed_data["resources"]:
                    try:
                        resource_name = resource_data.get("name")
                        
                        if not resource_name:
                            logger.warning("Resource data missing name, skipping")
                            errors += 1
                            continue
                            
                        # ตรวจสอบว่ามี resource นี้อยู่แล้วหรือไม่
                        existing = db.query(Resource).filter(Resource.name == resource_name).first()
                        
                        if existing:
                            logger.info(f"Resource '{resource_name}' already exists, skipping")
                            continue
                        
                        # หา group_id จาก group_name
                        group_id = None
                        group_name = resource_data.get("group_name")
                        
                        if group_name and group_name in resource_groups:
                            group_id = resource_groups[group_name].id
                            logger.info(f"Found group ID for '{group_name}': {group_id}")
                        
                        # สร้าง resource
                        resource = Resource(
                            id=uuid.uuid4(),
                            name=resource_name,
                            path=resource_data.get("path"),
                            description=resource_data.get("description"),
                            group_id=group_id,  # เชื่อมโยงกับกลุ่มทรัพยากร
                            order_index=resource_data.get("order_index", 0),  # เพิ่มค่าลำดับ
                            is_active=resource_data.get("is_active", True)
                        )
                        
                        db.add(resource)
                        count += 1
                        logger.info(f"Added resource: {resource_name}, group: {group_name}")
                        
                        # Commit ทุก 20 resources เพื่อไม่ให้ transaction ใหญ่เกินไป
                        if count % 20 == 0:
                            db.commit()
                            logger.info(f"Committed batch of 20 resources, total so far: {count}")
                            
                    except Exception as e:
                        logger.error(f"Error creating resource '{resource_data.get('name')}': {str(e)}")
                        errors += 1
                        continue
                
                try:
                    # Commit ข้อมูลที่เหลือ
                    db.commit()
                    logger.info(f"Seeded {count} {self.table_name} successfully. Errors: {errors}")
                    return True
                except Exception as e:
                    logger.error(f"Error committing resources: {str(e)}")
                    db.rollback()
                    return False
            else:
                logger.info(f"{self.table_name} table already has {record_count} records. Skipping seeding.")
                
                # ตรวจสอบว่ามีข้อมูลที่ยังไม่ได้เชื่อมกับกลุ่มหรือไม่
                resources_without_group = db.query(Resource).filter(Resource.group_id == None).count()
                if resources_without_group > 0:
                    logger.info(f"Found {resources_without_group} resources without group. Trying to update them...")
                    self.update_resource_groups(db)
                
                return False

        except Exception as e:
            logger.error(f"Error seeding {self.table_name}: {str(e)}")
            logger.error(traceback.format_exc())
            if 'db' in locals():
                db.rollback()
            return False

    def update_resource_groups(self, db: Session):
        """อัปเดตความสัมพันธ์ระหว่าง Resource กับ ResourceGroup"""
        try:
            # โหลดข้อมูลจากไฟล์ seed
            seed_data = self.load_seed_data()
            if not seed_data or "resources" not in seed_data:
                logger.warning("No resource seed data found for updating groups")
                return False
            
            # สร้าง map ระหว่าง resource_name และ group_name
            resource_group_map = {}
            for resource_data in seed_data["resources"]:
                name = resource_data.get("name")
                group_name = resource_data.get("group_name")
                if name and group_name:
                    resource_group_map[name] = group_name
            
            # ดึงข้อมูล resource groups
            groups = {group.name: group for group in db.query(ResourceGroup).all()}
            if not groups:
                logger.warning("No resource groups found for updating relationships")
                return False
            
            # อัปเดต resources ที่ยังไม่มี group
            resources = db.query(Resource).filter(Resource.group_id == None).all()
            updated_count = 0
            
            for resource in resources:
                if resource.name in resource_group_map:
                    group_name = resource_group_map[resource.name]
                    if group_name in groups:
                        resource.group_id = groups[group_name].id
                        resource.order_index = self.get_resource_order_index(resource.name, seed_data)
                        updated_count += 1
                        logger.info(f"Updated resource '{resource.name}' with group '{group_name}'")
            
            if updated_count > 0:
                db.commit()
                logger.info(f"Updated {updated_count} resources with group relationships")
                return True
            else:
                logger.info(f"No resources updated with group relationships")
                return False
        
        except Exception as e:
            logger.error(f"Error updating resource groups: {str(e)}")
            logger.error(traceback.format_exc())
            db.rollback()
            return False
    
    def get_resource_order_index(self, resource_name: str, seed_data: Dict[str, Any]) -> int:
        """ดึงค่า order_index ของ resource จากข้อมูล seed"""
        if not seed_data or "resources" not in seed_data:
            return 0
        
        for resource_data in seed_data["resources"]:
            if resource_data.get("name") == resource_name:
                return resource_data.get("order_index", 0)
        
        return 0