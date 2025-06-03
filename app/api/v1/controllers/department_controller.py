from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case
from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from fastapi import HTTPException
from lib.logger import get_logger

from models.departments import Department
from models.venues import Venue
from models.department_groups import DepartmentGroup
from app.api.v1.schemas.department import Department as DepartmentSchema
from app.api.v1.schemas.venues import Venue as VenueSchema

logger = get_logger("department_controller")

class DuplicateKeyError(Exception):
    pass

def get_departments(db: Session, skip: int = 0, limit: int = 100):
    """Get all departments with department_group data"""
    departments = db.query(Department).filter(
        Department.is_active == True
    ).options(
        joinedload(Department.group)
    ).order_by(Department.order_index).offset(skip).limit(limit).all()
    
    # แปลง SQLAlchemy objects เป็น Pydantic models และแปลงเป็น dictionaries
    return [DepartmentSchema.model_validate(department).model_dump() for department in departments]

def get_department_by_id(db: Session, department_id: UUID):
    """Get department by ID with department_group data"""
    department = db.query(Department).filter(
        Department.id == department_id,
        Department.is_active == True
    ).options(
        joinedload(Department.group),
        joinedload(Department.parent),
        joinedload(Department.children)
    ).first()
    
    if department:
        return DepartmentSchema.model_validate(department).model_dump()
    return None

def get_departments_by_group(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Get departments grouped by group_id"""
    # ดึงข้อมูลกลุ่มหน่วยงานทั้งหมด
    groups = db.query(DepartmentGroup).filter(
        DepartmentGroup.is_active == True
    ).order_by(DepartmentGroup.order_index).all()
    
    result = []
    for group in groups:
        # ดึงรายการหน่วยงานในแต่ละกลุ่ม
        departments = db.query(Department).filter(
            Department.group_id == group.id,
            Department.is_active == True
        ).order_by(Department.order_index).all()
        
        # แม้จะไม่มีหน่วยงานในกลุ่ม ก็ยังคงแสดงข้อมูลกลุ่ม
        dept_dicts = []
        if departments:
            # แปลงข้อมูลหน่วยงาน
            for dept in departments:
                dept_dict = DepartmentSchema.model_validate(dept).model_dump()
                # ลบข้อมูล group เพื่อลดความซ้ำซ้อน
                if "group" in dept_dict:
                    del dept_dict["group"]
                dept_dicts.append(dept_dict)
        
        group_data = {
            "group_id": str(group.id),
            "group_name": group.name,
            "description": group.description,
            "order_index": group.order_index,
            "departments": dept_dicts,
            "total_departments": len(dept_dicts)
        }
        result.append(group_data)
    
    return result

def get_departments_with_venues(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Get departments with their venues"""
    # ดึงข้อมูลหน่วยงานทั้งหมดที่ active
    departments = db.query(Department).filter(
        Department.is_active == True
    ).options(
        joinedload(Department.group)
    ).order_by(Department.order_index).offset(skip).limit(limit).all()
    
    result = []
    for department in departments:
        # ดึงรายการสถานที่ในแต่ละหน่วยงาน
        venues = db.query(Venue).filter(
            Venue.department_id == department.id,
            Venue.is_active == True
        ).order_by(Venue.order_index).all()
        
        # แปลงข้อมูลหน่วยงาน
        dept_dict = DepartmentSchema.model_validate(department).model_dump()
        
        # เพิ่มข้อมูลสถานที่
        venue_dicts = []
        if venues:
            for venue in venues:
                venue_dict = VenueSchema.model_validate(venue).model_dump()
                # ลบข้อมูล department เพื่อลดความซ้ำซ้อน
                if "department" in venue_dict:
                    del venue_dict["department"]
                venue_dicts.append(venue_dict)
        
        dept_dict["venues"] = venue_dicts
        dept_dict["total_venues"] = len(venue_dicts)
        
        result.append(dept_dict)
    
    return result

def search_departments_by_name(db: Session, search_term: str, skip: int = 0, limit: int = 100):
    """Search departments by name"""
    search_pattern = f"%{search_term}%"
    departments = db.query(Department).filter(
        Department.name.like(search_pattern) | 
        Department.short_name.like(search_pattern) | 
        Department.code.like(search_pattern),
        Department.is_active == True
    ).options(
        joinedload(Department.group)
    ).order_by(Department.name).offset(skip).limit(limit).all()
    
    return [DepartmentSchema.model_validate(department).model_dump() for department in departments]

def create_department(db: Session, department_data: dict) -> Dict[str, Any]:
    """Create new department"""
    # Check if department with same name already exists
    existing = db.query(Department).filter(
        Department.name == department_data["name"],
        Department.is_active == True
    ).first()
    
    if existing:
        logger.warning(f"Duplicate department name: {department_data['name']}")
        raise DuplicateKeyError(f"Department with name '{department_data['name']}' already exists")
    
    # Check if department_group exists if group_id is provided
    if department_data.get("group_id"):
        group = db.query(DepartmentGroup).filter(
            DepartmentGroup.id == department_data["group_id"],
            DepartmentGroup.is_active == True
        ).first()
        
        if not group:
            logger.warning(f"Department group not found: {department_data['group_id']}")
            raise HTTPException(status_code=404, detail=f"Department group with ID {department_data['group_id']} not found")
    
    # Check if parent department exists if parent_id is provided
    if department_data.get("parent_id"):
        parent = db.query(Department).filter(
            Department.id == department_data["parent_id"],
            Department.is_active == True
        ).first()
        
        if not parent:
            logger.warning(f"Parent department not found: {department_data['parent_id']}")
            raise HTTPException(status_code=404, detail=f"Parent department with ID {department_data['parent_id']} not found")
      # ค้นหาค่า order_index ที่มากที่สุด
    max_order = db.query(func.max(Department.order_index)).scalar() or 0
    
    # กำหนดค่า order_index อัตโนมัติถ้าไม่ได้ระบุ
    if "order_index" not in department_data or department_data["order_index"] is None:
        department_data["order_index"] = max_order + 10
    
    # Create department
    db_department = Department(**department_data)
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    
    # Load related data
    db.refresh(db_department, ['group', 'parent', 'children'])
    
    logger.info(f"Created department: {db_department.name} with ID {db_department.id}")
    
    return DepartmentSchema.model_validate(db_department).model_dump()

def update_department(db: Session, department_id: UUID, department_data: dict) -> Optional[Dict[str, Any]]:
    """Update department"""
    db_department = db.query(Department).filter(Department.id == department_id).first()
    if not db_department:
        return None
    
    # Check for duplicate name if name is being updated
    if "name" in department_data and department_data["name"] != db_department.name:
        existing = db.query(Department).filter(
            Department.name == department_data["name"],
            Department.id != department_id,
            Department.is_active == True
        ).first()
        
        if existing:
            raise DuplicateKeyError(f"Department with name '{department_data['name']}' already exists")
    
    # Check if department_group exists if group_id is provided
    if "group_id" in department_data and department_data["group_id"]:
        group = db.query(DepartmentGroup).filter(
            DepartmentGroup.id == department_data["group_id"],
            DepartmentGroup.is_active == True
        ).first()
        
        if not group:
            raise HTTPException(status_code=404, detail=f"Department group with ID {department_data['group_id']} not found")
    
    # Check if parent department exists if parent_id is provided
    if "parent_id" in department_data and department_data["parent_id"]:
        # ตรวจสอบว่ามีการวนลูป (circular reference)
        if department_data["parent_id"] == department_id:
            raise HTTPException(status_code=400, detail="Department cannot be its own parent")
        
        parent = db.query(Department).filter(
            Department.id == department_data["parent_id"],
            Department.is_active == True
        ).first()
        
        if not parent:
            raise HTTPException(status_code=404, detail=f"Parent department with ID {department_data['parent_id']} not found")
    
    # Update department fields
    for key, value in department_data.items():
        setattr(db_department, key, value)
    
    db.commit()
    db.refresh(db_department, ['group', 'parent', 'children'])
    
    logger.info(f"Updated department: {db_department.name} with ID {department_id}")
    
    return DepartmentSchema.model_validate(db_department).model_dump()

def delete_department(db: Session, department_id: UUID) -> bool:
    """Delete department (soft delete)"""
    db_department = db.query(Department).filter(Department.id == department_id).first()
    if not db_department:
        return False
    
    # Check if department has active children
    children = db.query(Department).filter(
        Department.parent_id == department_id,
        Department.is_active == True
    ).all()
    
    if children:
        logger.warning(f"Cannot delete department with ID {department_id}: has {len(children)} active children")
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete department with active child departments. Please delete or reassign child departments first."
        )
    
    # Check if department has active venues
    venues = db.query(Venue).filter(
        Venue.department_id == department_id,
        Venue.is_active == True
    ).all()
    
    if venues:
        logger.warning(f"Cannot delete department with ID {department_id}: has {len(venues)} active venues")
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete department with active venues. Please delete or reassign venues first."
        )
    
    db_department.is_active = False
    db.commit()
    
    logger.info(f"Soft deleted department with ID {department_id}")
    
    return True

def get_departments_stats(db: Session) -> Dict[str, Any]:
    """Get departments statistics - FIXED for SQL Server compatibility"""
    try:
        # จำนวนหน่วยงานทั้งหมด
        total_count = db.query(Department).filter(Department.is_active == True).count()
        
        # จำนวนหน่วยงานแยกตามกลุ่ม
        group_stats = db.query(
            DepartmentGroup.name,
            func.count(Department.id).label('count')
        ).join(
            Department,
            Department.group_id == DepartmentGroup.id
        ).filter(
            Department.is_active == True,
            DepartmentGroup.is_active == True
        ).group_by(
            DepartmentGroup.name
        ).all()
        
        group_counts = {group: count for group, count in group_stats}
        
        # 🔧 FIX: จำนวนหน่วยงานที่มี parent กับไม่มี parent - ใช้ CASE WHEN แทน FILTER
        parent_stats = db.query(
            func.sum(case((Department.parent_id.isnot(None), 1), else_=0)).label('with_parent'),
            func.sum(case((Department.parent_id.is_(None), 1), else_=0)).label('without_parent')
        ).filter(
            Department.is_active == True
        ).first()
        
        hierarchy_counts = {
            "with_parent": parent_stats.with_parent if parent_stats else 0,
            "without_parent": parent_stats.without_parent if parent_stats else 0
        }
        
        # จำนวนสถานที่ในแต่ละหน่วยงาน
        venue_stats = db.query(
            Department.name,
            func.count(Venue.id).label('venue_count')
        ).outerjoin(
            Venue,
            Venue.department_id == Department.id
        ).filter(
            Department.is_active == True,
            (Venue.id == None) | (Venue.is_active == True)
        ).group_by(
            Department.name
        ).all()
        
        venue_counts = {dept: count for dept, count in venue_stats}
        
        return {
            "total": total_count,
            "by_group": group_counts,
            "hierarchy": hierarchy_counts,
            "venues_by_department": venue_counts
        }
        
    except Exception as e:
        logger.error(f"Error in get_departments_stats: {str(e)}")
        # Return safe default values if query fails
        return {
            "total": 0,
            "by_group": {},
            "hierarchy": {"with_parent": 0, "without_parent": 0},
            "venues_by_department": {}
        }

def update_department_order_batch(db: Session, order_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Update order_index for multiple departments in batch"""
    results = []
    
    for item in order_data:
        department_id = item.get("id")
        order_index = item.get("order_index")
        
        if not department_id or order_index is None:
            continue
            
        department = db.query(Department).filter(Department.id == department_id).first()
        if not department:
            continue
            
        department.order_index = order_index
        results.append({
            "id": str(department.id),
            "name": department.name,
            "order_index": order_index
        })
    
    db.commit()
    logger.info(f"Updated order for {len(results)} departments")
    
    return results