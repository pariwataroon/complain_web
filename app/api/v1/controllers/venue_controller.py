from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func 
from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from fastapi import HTTPException
from lib.logger import get_logger

from models.venues import Venue
from models.departments import Department
from app.api.v1.schemas.venues import Venue as VenueSchema

logger = get_logger("venue_controller")

class DuplicateKeyError(Exception):
    pass

def get_venues(db: Session, skip: int = 0, limit: int = 100):
    """Get all venues with department data"""
    venues = db.query(Venue).filter(
        Venue.is_active == True
    ).options(
        joinedload(Venue.department)
    ).order_by(Venue.group_name, Venue.order_index).offset(skip).limit(limit).all()
    
    # แปลง SQLAlchemy objects เป็น Pydantic models และแปลงเป็น dictionaries
    return [VenueSchema.model_validate(venue).model_dump() for venue in venues]

def get_venue_by_id(db: Session, venue_id: UUID):
    """Get venue by ID with department data"""
    venue = db.query(Venue).filter(
        Venue.id == venue_id,
        Venue.is_active == True
    ).options(
        joinedload(Venue.department)
    ).first()
    
    if venue:
        return VenueSchema.model_validate(venue).model_dump()
    return None

def get_venues_by_group(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Get venues grouped by group_name"""
    # ดึงข้อมูล group_name ที่มีอยู่ทั้งหมด (distinct)
    groups = db.query(Venue.group_name).filter(
        Venue.is_active == True,
        Venue.group_name != None  # กรองเฉพาะที่มี group_name
    ).distinct().all()
    
    result = []
    for (group_name,) in groups:
        # ดึงรายการสถานที่ในแต่ละกลุ่ม
        venues = db.query(Venue).filter(
            Venue.group_name == group_name,
            Venue.is_active == True
        ).options(
            joinedload(Venue.department)
        ).order_by(Venue.order_index).all()
        
        if venues:
            venue_dicts = [VenueSchema.model_validate(venue).model_dump() for venue in venues]
            group_data = {
                "group_name": group_name,
                "venues": venue_dicts,
                "total_venues": len(venue_dicts)
            }
            result.append(group_data)
    
    return result

def get_venues_grouped_by_department(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Get venues grouped by department"""
    # ดึงข้อมูลหน่วยงานทั้งหมดที่ active (ไม่ต้อง join กับ venues)
    departments = db.query(Department).filter(
        Department.is_active == True
    ).order_by(Department.order_index).all()
    
    result = []
    for department in departments:
        # ดึงรายการสถานที่ในแต่ละ department (ถ้ามี)
        venues = db.query(Venue).filter(
            Venue.department_id == department.id,
            Venue.is_active == True
        ).order_by(Venue.group_name, Venue.order_index).all()
        
        # สร้าง department_data สำหรับทุก department แม้ไม่มี venues
        venue_dicts = []
        groups_list = []
        
        # ถ้ามี venues ก็จัดกลุ่มตาม group_name
        if venues:
            # แปลง venues เป็น dict และตัด department ออก
            venue_dicts = []
            for venue in venues:
                venue_dict = VenueSchema.model_validate(venue).model_dump()
                # ลบข้อมูล department เพื่อลดความซ้ำซ้อน
                if "department" in venue_dict:
                    del venue_dict["department"]
                venue_dicts.append(venue_dict)
            
            # จัดกลุ่มสถานที่ตาม group_name ภายใน department
            venue_groups = {}
            for venue in venue_dicts:
                group_name = venue.get('group_name') or 'ไม่ระบุกลุ่ม'
                if group_name not in venue_groups:
                    venue_groups[group_name] = []
                venue_groups[group_name].append(venue)
            
            for group_name, venues_in_group in venue_groups.items():
                groups_list.append({
                    "group_name": group_name,
                    "venues": venues_in_group,
                    "total_venues": len(venues_in_group)
                })
        
        department_data = {
            "department_id": str(department.id),
            "department_name": department.name,
            "department_code": department.code,
            "venue_groups": groups_list,
            "total_venues": len(venue_dicts)
        }
        result.append(department_data)
    
    return result

def search_venues_by_department(db: Session, department_id: UUID, skip: int = 0, limit: int = 100):
    """Search venues by department_id"""
    venues = db.query(Venue).filter(
        Venue.department_id == department_id,
        Venue.is_active == True
    ).options(
        joinedload(Venue.department)
    ).order_by(Venue.group_name, Venue.order_index).offset(skip).limit(limit).all()
    
    return [VenueSchema.model_validate(venue).model_dump() for venue in venues]

def search_venues_by_name(db: Session, search_term: str, skip: int = 0, limit: int = 100):
    """Search venues by name"""
    search_pattern = f"%{search_term}%"
    venues = db.query(Venue).filter(
        Venue.name.like(search_pattern) | 
        Venue.short_name.like(search_pattern) | 
        Venue.code.like(search_pattern) | 
        Venue.abbreviation.like(search_pattern),
        Venue.is_active == True
    ).options(
        joinedload(Venue.department)
    ).order_by(Venue.name).offset(skip).limit(limit).all()
    
    return [VenueSchema.model_validate(venue).model_dump() for venue in venues]

def create_venue(db: Session, venue_data: dict) -> Dict[str, Any]:
    """Create new venue - FIXED for NULL department_id issue"""
    try:
        # Check if venue with same name already exists
        existing = db.query(Venue).filter(
            Venue.name == venue_data["name"],
            Venue.is_active == True
        ).first()
        
        if existing:
            logger.warning(f"Duplicate venue name: {venue_data['name']}")
            raise DuplicateKeyError(f"Venue with name '{venue_data['name']}' already exists")
        
        # 🔧 FIX: Handle department_id - ensure it's not NULL
        department_id = venue_data.get("department_id")
        
        if department_id:
            # Check if provided department exists
            department = db.query(Department).filter(
                Department.id == department_id,
                Department.is_active == True
            ).first()
            
            if not department:
                logger.warning(f"Department not found: {department_id}")
                raise HTTPException(status_code=404, detail=f"Department with ID {department_id} not found")
        else:
            # 🔧 FIX: Get a default department if not provided
            default_department = db.query(Department).filter(
                Department.is_active == True
            ).order_by(Department.order_index).first()
            
            if not default_department:
                logger.error("No active departments found for venue creation")
                raise HTTPException(status_code=400, detail="No active departments available. Please create a department first.")
            
            department_id = default_department.id
            logger.info(f"Using default department {default_department.name} for venue {venue_data['name']}")
        
        # 🔧 FIX: Ensure department_id is set in venue_data
        venue_data["department_id"] = department_id
        
        # ค้นหาค่า order_index ที่มากที่สุดในกลุ่มเดียวกัน
        group_filter = {}
        if "group_name" in venue_data and venue_data["group_name"]:
            group_filter["group_name"] = venue_data["group_name"]

        max_order = db.query(func.max(Venue.order_index)).filter_by(**group_filter).scalar() or 0
        logger.debug(f"Max order index for group {group_filter}: {max_order}")
        
        # กำหนดค่า order_index อัตโนมัติถ้าไม่ได้ระบุ
        if "order_index" not in venue_data or venue_data["order_index"] is None:
            venue_data["order_index"] = max_order + 10
        
        # 🔧 FIX: Create venue with proper field assignment
        db_venue = Venue(
            name=venue_data.get("name"),
            short_name=venue_data.get("short_name"),
            code=venue_data.get("code"),
            abbreviation=venue_data.get("abbreviation"),
            color_code=venue_data.get("color_code"),
            department_id=department_id,  # ✅ Ensure this is not NULL
            group_name=venue_data.get("group_name"),
            order_index=venue_data["order_index"],
            is_active=True
        )
        
        logger.debug(f"Creating venue: {db_venue.name} with department_id: {db_venue.department_id}")
        
        db.add(db_venue)
        db.commit()
        db.refresh(db_venue)
        
        # Load department data
        db.refresh(db_venue, ['department'])
        
        logger.info(f"Successfully created venue: {db_venue.name} with ID {db_venue.id}")
        
        return VenueSchema.model_validate(db_venue).model_dump()
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating venue: {str(e)}")
        
        if isinstance(e, (DuplicateKeyError, HTTPException)):
            raise e
        else:
            raise HTTPException(status_code=500, detail=f"Error creating venue: {str(e)}")

def update_venue(db: Session, venue_id: UUID, venue_data: dict) -> Optional[Dict[str, Any]]:
    """Update venue"""
    db_venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not db_venue:
        return None
    
    # Check for duplicate name if name is being updated
    if "name" in venue_data and venue_data["name"] != db_venue.name:
        existing = db.query(Venue).filter(
            Venue.name == venue_data["name"],
            Venue.id != venue_id,
            Venue.is_active == True
        ).first()
        
        if existing:
            raise DuplicateKeyError(f"Venue with name '{venue_data['name']}' already exists")
    
    # Check if department exists if department_id is provided
    if "department_id" in venue_data and venue_data["department_id"]:
        department = db.query(Department).filter(
            Department.id == venue_data["department_id"],
            Department.is_active == True
        ).first()
        
        if not department:
            raise HTTPException(status_code=404, detail=f"Department with ID {venue_data['department_id']} not found")
    
    # Update venue fields
    for key, value in venue_data.items():
        setattr(db_venue, key, value)
    
    db.commit()
    db.refresh(db_venue, ['department'])
    
    logger.info(f"Updated venue: {db_venue.name} with ID {venue_id}")
    
    return VenueSchema.model_validate(db_venue).model_dump()

def delete_venue(db: Session, venue_id: UUID) -> bool:
    """Delete venue (soft delete)"""
    db_venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not db_venue:
        return False
    
    db_venue.is_active = False
    db.commit()
    
    logger.info(f"Soft deleted venue with ID {venue_id}")
    
    return True

def get_venues_stats(db: Session) -> Dict[str, Any]:
    """Get venues statistics"""
    # จำนวนสถานที่ทั้งหมด
    total_count = db.query(Venue).filter(Venue.is_active == True).count()
    
    # จำนวนสถานที่แยกตามกลุ่ม
    group_stats = db.query(
        Venue.group_name,
        func.count(Venue.id).label('count')
    ).filter(
        Venue.is_active == True,
        Venue.group_name != None
    ).group_by(
        Venue.group_name
    ).all()
    
    group_counts = {group: count for group, count in group_stats}
    
    # จำนวนสถานที่แยกตามหน่วยงานหลัก
    dept_stats = db.query(
        Department.name,
        func.count(Venue.id).label('count')
    ).join(
        Department,
        Department.id == Venue.department_id
    ).filter(
        Venue.is_active == True
    ).group_by(
        Department.name
    ).all()
    
    department_counts = {dept: count for dept, count in dept_stats}
    
    return {
        "total": total_count,
        "by_group": group_counts,
        "by_department": department_counts
    }

def update_venue_order_batch(db: Session, order_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Update order_index for multiple venues in batch"""
    results = []
    
    for item in order_data:
        venue_id = item.get("id")
        order_index = item.get("order_index")
        
        if not venue_id or order_index is None:
            continue
            
        venue = db.query(Venue).filter(Venue.id == venue_id).first()
        if not venue:
            continue
            
        venue.order_index = order_index
        results.append({"id": str(venue.id), "order_index": venue.order_index})
    
    db.commit()
    logger.info(f"Updated order index for {len(results)} venues")
    
    return results