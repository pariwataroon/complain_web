from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from fastapi import HTTPException
from lib.logger import get_logger

from models.department_groups import DepartmentGroup
from models.departments import Department
from app.api.v1.schemas.department_groups import DepartmentGroup as DepartmentGroupSchema
from app.api.v1.schemas.department import Department as DepartmentSchema

logger = get_logger("department_group_controller")

class DuplicateKeyError(Exception):
    pass

def get_department_groups(db: Session, skip: int = 0, limit: int = 100):
    """Get all department groups"""
    groups = db.query(DepartmentGroup).filter(
        DepartmentGroup.is_active == True
    ).order_by(DepartmentGroup.order_index).offset(skip).limit(limit).all()
    
    return [DepartmentGroupSchema.model_validate(group).model_dump() for group in groups]

def get_department_group_by_id(db: Session, group_id: UUID):
    """Get department group by ID"""
    group = db.query(DepartmentGroup).filter(
        DepartmentGroup.id == group_id,
        DepartmentGroup.is_active == True
    ).first()
    
    if group:
        return DepartmentGroupSchema.model_validate(group).model_dump()
    return None

def get_department_groups_with_departments(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Get department groups with their departments"""
    # ดึงข้อมูลกลุ่มหน่วยงานทั้งหมด
    groups = db.query(DepartmentGroup).filter(
        DepartmentGroup.is_active == True
    ).order_by(DepartmentGroup.order_index).offset(skip).limit(limit).all()
    
    result = []
    for group in groups:
        # ดึงรายการหน่วยงานในแต่ละกลุ่ม
        departments = db.query(Department).filter(
            Department.group_id == group.id,
            Department.is_active == True
        ).order_by(Department.order_index).all()
        
        group_dict = DepartmentGroupSchema.model_validate(group).model_dump()
        
        # เพิ่มข้อมูลหน่วยงาน
        dept_dicts = []
        if departments:
            dept_dicts = [DepartmentSchema.model_validate(dept).model_dump() for dept in departments]
        
        group_dict["departments"] = dept_dicts
        group_dict["total_departments"] = len(dept_dicts)
        
        result.append(group_dict)
    
    return result

def create_department_group(db: Session, group_data: dict) -> Dict[str, Any]:
    """Create new department group"""
    # Check if group with same name already exists
    existing = db.query(DepartmentGroup).filter(
        DepartmentGroup.name == group_data["name"],
        DepartmentGroup.is_active == True
    ).first()
    
    if existing:
        logger.warning(f"Duplicate department group name: {group_data['name']}")
        raise DuplicateKeyError(f"Department group with name '{group_data['name']}' already exists")
    
    # ค้นหาค่า order_index ที่มากที่สุด
    max_order = db.query(func.max(DepartmentGroup.order_index)).scalar() or 0
    
    # กำหนดค่า order_index อัตโนมัติถ้าไม่ได้ระบุ
    if "order_index" not in group_data or group_data["order_index"] is None:
        group_data["order_index"] = max_order + 10
    
    # Create department group
    db_group = DepartmentGroup(**group_data)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    logger.info(f"Created department group: {db_group.name} with ID {db_group.id}")
    
    return DepartmentGroupSchema.model_validate(db_group).model_dump()

def update_department_group(db: Session, group_id: UUID, group_data: dict) -> Optional[Dict[str, Any]]:
    """Update department group"""
    db_group = db.query(DepartmentGroup).filter(DepartmentGroup.id == group_id).first()
    if not db_group:
        return None
    
    # Check for duplicate name if name is being updated
    if "name" in group_data and group_data["name"] != db_group.name:
        existing = db.query(DepartmentGroup).filter(
            DepartmentGroup.name == group_data["name"],
            DepartmentGroup.id != group_id,
            DepartmentGroup.is_active == True
        ).first()
        
        if existing:
            raise DuplicateKeyError(f"Department group with name '{group_data['name']}' already exists")
    
    # Update department group fields
    for key, value in group_data.items():
        setattr(db_group, key, value)
    
    db.commit()
    db.refresh(db_group)
    
    logger.info(f"Updated department group: {db_group.name} with ID {group_id}")
    
    return DepartmentGroupSchema.model_validate(db_group).model_dump()

def delete_department_group(db: Session, group_id: UUID) -> bool:
    """Delete department group (soft delete)"""
    db_group = db.query(DepartmentGroup).filter(DepartmentGroup.id == group_id).first()
    if not db_group:
        return False
    
    # Check if department group has departments
    departments = db.query(Department).filter(
        Department.group_id == group_id,
        Department.is_active == True
    ).all()
    
    if departments:
        logger.warning(f"Cannot delete department group with ID {group_id}: has {len(departments)} departments")
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete department group with active departments. Please reassign departments first."
        )
    
    db_group.is_active = False
    db.commit()
    
    logger.info(f"Soft deleted department group with ID {group_id}")
    
    return True