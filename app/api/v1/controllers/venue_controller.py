from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from fastapi import HTTPException

from models.venues import Venue
from models.departments import Department

class DuplicateKeyError(Exception):
    pass

def get_venues(db: Session, skip: int = 0, limit: int = 100):
    """Get all venues with department data"""
    return db.query(Venue).filter(
        Venue.is_active == True
    ).options(
        joinedload(Venue.department)
    ).order_by(Venue.group_name, Venue.order_index).offset(skip).limit(limit).all()

def get_venue_by_id(db: Session, venue_id: UUID):
    """Get venue by ID with department data"""
    return db.query(Venue).filter(
        Venue.id == venue_id,
        Venue.is_active == True
    ).options(
        joinedload(Venue.department)
    ).first()

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
            group_data = {
                "group_name": group_name,
                "venues": venues
            }
            result.append(group_data)
    
    return result

def search_venues_by_department(db: Session, department_id: UUID, skip: int = 0, limit: int = 100):
    """Search venues by department_id"""
    return db.query(Venue).filter(
        Venue.department_id == department_id,
        Venue.is_active == True
    ).options(
        joinedload(Venue.department)
    ).order_by(Venue.group_name, Venue.order_index).offset(skip).limit(limit).all()

def search_venues_by_name(db: Session, search_term: str, skip: int = 0, limit: int = 100):
    """Search venues by name"""
    search_pattern = f"%{search_term}%"
    return db.query(Venue).filter(
        Venue.name.like(search_pattern) | 
        Venue.short_name.like(search_pattern) | 
        Venue.code.like(search_pattern) | 
        Venue.abbreviation.like(search_pattern),
        Venue.is_active == True
    ).options(
        joinedload(Venue.department)
    ).order_by(Venue.name).offset(skip).limit(limit).all()

def create_venue(db: Session, venue_data: dict) -> Venue:
    """Create new venue"""
    # Check if venue with same name already exists
    existing = db.query(Venue).filter(
        Venue.name == venue_data["name"],
        Venue.is_active == True
    ).first()
    
    if existing:
        raise DuplicateKeyError(f"Venue with name '{venue_data['name']}' already exists")
    
    # Check if department exists if department_id is provided
    if venue_data.get("department_id"):
        department = db.query(Department).filter(
            Department.id == venue_data["department_id"],
            Department.is_active == True
        ).first()
        
        if not department:
            raise HTTPException(status_code=404, detail=f"Department with ID {venue_data['department_id']} not found")
    
    # Create venue
    db_venue = Venue(**venue_data)
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    return db_venue

def update_venue(db: Session, venue_id: UUID, venue_data: dict) -> Optional[Venue]:
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
    db.refresh(db_venue)
    return db_venue

def delete_venue(db: Session, venue_id: UUID) -> bool:
    """Delete venue (soft delete)"""
    db_venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not db_venue:
        return False
    
    db_venue.is_active = False
    db.commit()
    return True

def get_venues_stats(db: Session) -> Dict[str, Any]:
    """Get venues statistics"""
    # จำนวนสถานที่ทั้งหมด
    total_count = db.query(Venue).filter(Venue.is_active == True).count()
    
    # จำนวนสถานที่แยกตามกลุ่ม
    group_stats = db.query(
        Venue.group_name,
        db.func.count(Venue.id).label('count')
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
        db.func.count(Venue.id).label('count')
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