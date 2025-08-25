from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from lib.logger import get_logger

from models.outside_departments import OutsideDepartment
from app.api.v1.schemas.outside_departments import OutsideDepartment as OutsideDeptSchema

logger = get_logger("outside_department_controller")

class DuplicateKeyError(Exception):
    pass

def get_outside_departments(db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    rows = db.query(OutsideDepartment).filter(
        OutsideDepartment.is_active == True
    ).order_by(OutsideDepartment.order_index, OutsideDepartment.name).offset(skip).limit(limit).all()
    return [OutsideDeptSchema.model_validate(r).model_dump() for r in rows]

def get_outside_department_by_id(db: Session, outside_department_id: UUID) -> Optional[Dict[str, Any]]:
    row = db.query(OutsideDepartment).filter(
        OutsideDepartment.id == outside_department_id,
        OutsideDepartment.is_active == True
    ).first()
    if row:
        return OutsideDeptSchema.model_validate(row).model_dump()
    return None

def search_outside_departments_by_name(db: Session, search_term: str, skip: int = 0, limit: int = 100):
    pattern = f"%{search_term}%"
    rows = db.query(OutsideDepartment).filter(
        OutsideDepartment.is_active == True,
        OutsideDepartment.name.like(pattern)
    ).order_by(OutsideDepartment.name).offset(skip).limit(limit).all()
    return [OutsideDeptSchema.model_validate(r).model_dump() for r in rows]

def create_outside_department(db: Session, data: dict) -> Dict[str, Any]:
    # กันชื่อซ้ำ (เฉพาะ record ที่ active)
    existing = db.query(OutsideDepartment).filter(
        OutsideDepartment.is_active == True,
        OutsideDepartment.name == data["name"]
    ).first()
    if existing:
        logger.warning(f"Duplicate outside_department name: {data['name']}")
        raise DuplicateKeyError(f"OutsideDepartment with name '{data['name']}' already exists")

    # กำหนด order_index อัตโนมัติถ้าไม่ส่งมา (max + 10)
    max_order = db.query(func.max(OutsideDepartment.order_index)).scalar() or 0
    if "order_index" not in data or data["order_index"] is None:
        data["order_index"] = max_order + 10

    row = OutsideDepartment(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    logger.info(f"Created outside_department: {row.name} ({row.id})")
    return OutsideDeptSchema.model_validate(row).model_dump()

def update_outside_department(db: Session, outside_department_id: UUID, data: dict) -> Optional[Dict[str, Any]]:
    row = db.query(OutsideDepartment).filter(OutsideDepartment.id == outside_department_id).first()
    if not row:
        return None

    # ถ้ามีการเปลี่ยนชื่อ ตรวจสอบซ้ำ
    if "name" in data and data["name"] and data["name"] != row.name:
        dup = db.query(OutsideDepartment).filter(
            OutsideDepartment.is_active == True,
            OutsideDepartment.name == data["name"],
            OutsideDepartment.id != outside_department_id
        ).first()
        if dup:
            raise DuplicateKeyError(f"OutsideDepartment with name '{data['name']}' already exists")

    for k, v in data.items():
        setattr(row, k, v)

    db.commit()
    db.refresh(row)
    logger.info(f"Updated outside_department: {row.name} ({outside_department_id})")
    return OutsideDeptSchema.model_validate(row).model_dump()

def delete_outside_department(db: Session, outside_department_id: UUID) -> bool:
    row = db.query(OutsideDepartment).filter(OutsideDepartment.id == outside_department_id).first()
    if not row:
        return False

    row.is_active = False
    db.commit()
    logger.info(f"Soft deleted outside_department: {outside_department_id}")
    return True

def get_outside_departments_dropdown(db: Session) -> List[Dict[str, Any]]:
    # คืนค่าเฉพาะ id & name สำหรับ dropdown
    rows = db.query(OutsideDepartment).filter(
        OutsideDepartment.is_active == True
    ).order_by(OutsideDepartment.order_index, OutsideDepartment.name).all()
    return [{"id": str(r.id), "name": r.name} for r in rows]
