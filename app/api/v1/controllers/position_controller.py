from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import HTTPException
from lib.logger import get_logger

from models.position import Position
from models.user_positions import UserPosition
from models.user import User

logger = get_logger("position_controller")

class DuplicateKeyError(Exception):
    pass

def position_to_dict(position) -> Dict[str, Any]:
    """แปลง Position object เป็น dictionary"""
    if position is None:
        return None
        
    return {
        "id": str(position.id),
        "name": position.name,
        "description": position.description,
        "level": position.level,
        "is_active": position.is_active,
        "created_at": position.created_at.isoformat() if position.created_at else None,
        "updated_at": position.updated_at.isoformat() if position.updated_at else None
    }

def user_position_to_dict(user_position) -> Dict[str, Any]:
    """แปลง UserPosition object เป็น dictionary"""
    if user_position is None:
        return None
        
    result = {
        "id": str(user_position.id),
        "user_id": str(user_position.user_id),
        "position_id": str(user_position.position_id),
        "is_primary": user_position.is_primary,
        "start_date": user_position.start_date.isoformat() if user_position.start_date else None,
        "end_date": user_position.end_date.isoformat() if user_position.end_date else None,
        "created_at": user_position.created_at.isoformat() if user_position.created_at else None,
        "updated_at": user_position.updated_at.isoformat() if user_position.updated_at else None
    }
    
    # เพิ่มข้อมูลตำแหน่ง (ถ้ามี)
    if hasattr(user_position, "position") and user_position.position:
        result["position"] = position_to_dict(user_position.position)
    
    # เพิ่มข้อมูลผู้ใช้ (ถ้ามี)
    if hasattr(user_position, "user") and user_position.user:
        result["user"] = {
            "id": str(user_position.user.id),
            "email": user_position.user.email,
            "first_name": user_position.user.first_name,
            "last_name": user_position.user.last_name,
            "full_name": f"{user_position.user.first_name} {user_position.user.last_name}"
        }
    
    return result

# ฟังก์ชันจัดการข้อมูลตำแหน่ง (Position)
def get_positions(db: Session, skip: int = 0, limit: int = 100, is_active: bool = None, level: str = None) -> List[Dict[str, Any]]:
    """ดึงข้อมูลตำแหน่งทั้งหมด"""
    query = db.query(Position)
    
    # กรองตาม is_active ถ้ามีการระบุ
    if is_active is not None:
        query = query.filter(Position.is_active == is_active)
    else:
        # ถ้าไม่ระบุ ให้แสดงเฉพาะ active (default behavior)
        query = query.filter(Position.is_active == True)
    
    # กรองตาม level ถ้ามีการระบุ
    if level:
        query = query.filter(Position.level == level)
    
    positions = query.order_by(Position.name).offset(skip).limit(limit).all()
    
    logger.info(f"Retrieved {len(positions)} positions")
    
    return [position_to_dict(position) for position in positions]

def get_position_by_id(db: Session, position_id: UUID) -> Dict[str, Any]:
    """ดึงข้อมูลตำแหน่งตาม ID"""
    position = db.query(Position).filter(Position.id == position_id, Position.is_active == True).first()
    
    if position:
        logger.info(f"Retrieved position with ID {position_id}")
        return position_to_dict(position)
    
    logger.warning(f"Position with ID {position_id} not found")
    return None

def search_positions_by_name(db: Session, search_term: str, skip: int = 0, limit: int = 100, is_active: bool = None, level: str = None) -> List[Dict[str, Any]]:
    """ค้นหาตำแหน่งตามชื่อ"""
    search_pattern = f"%{search_term}%"
    query = db.query(Position).filter(
        Position.name.like(search_pattern) | Position.description.like(search_pattern)
    )
    
    # กรองตาม is_active ถ้ามีการระบุ
    if is_active is not None:
        query = query.filter(Position.is_active == is_active)
    else:
        # ถ้าไม่ระบุ ให้แสดงเฉพาะ active (default behavior)
        query = query.filter(Position.is_active == True)
    
    # กรองตาม level ถ้ามีการระบุ
    if level:
        query = query.filter(Position.level == level)
    
    positions = query.order_by(Position.name).offset(skip).limit(limit).all()
    
    logger.info(f"Found {len(positions)} positions matching search term '{search_term}'")
    
    return [position_to_dict(position) for position in positions]

def create_position(db: Session, position_data: dict) -> Dict[str, Any]:
    """สร้างตำแหน่งใหม่"""
    # ตรวจสอบว่ามีตำแหน่งซ้ำหรือไม่
    existing = db.query(Position).filter(
        Position.name == position_data["name"],
        Position.is_active == True
    ).first()
    
    if existing:
        logger.warning(f"Duplicate position name: {position_data['name']}")
        raise DuplicateKeyError(f"Position with name '{position_data['name']}' already exists")
    
    # สร้างตำแหน่งใหม่
    db_position = Position(**position_data)
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    
    logger.info(f"Created new position: {db_position.name} with ID {db_position.id}")
    
    return position_to_dict(db_position)

def update_position(db: Session, position_id: UUID, position_data: dict) -> Optional[Dict[str, Any]]:
    """อัปเดตข้อมูลตำแหน่ง"""
    db_position = db.query(Position).filter(Position.id == position_id).first()
    if not db_position:
        logger.warning(f"Position not found for update: {position_id}")
        return None
    
    # ตรวจสอบว่ามีตำแหน่งซ้ำหรือไม่
    if "name" in position_data and position_data["name"] != db_position.name:
        existing = db.query(Position).filter(
            Position.name == position_data["name"],
            Position.id != position_id,
            Position.is_active == True
        ).first()
        
        if existing:
            logger.warning(f"Duplicate position name for update: {position_data['name']}")
            raise DuplicateKeyError(f"Position with name '{position_data['name']}' already exists")
    
    # อัปเดตฟิลด์ต่างๆ
    for key, value in position_data.items():
        setattr(db_position, key, value)
    
    db.commit()
    logger.info(f"Updated position: {db_position.name} with ID {position_id}")
    
    return position_to_dict(db_position)

def delete_position(db: Session, position_id: UUID) -> bool:
    """ลบตำแหน่ง (soft delete)"""
    db_position = db.query(Position).filter(Position.id == position_id).first()
    if not db_position:
        logger.warning(f"Position not found for deletion: {position_id}")
        return False
    
    db_position.is_active = False
    db.commit()
    
    logger.info(f"Soft deleted position with ID {position_id}")
    
    return True

# ฟังก์ชันจัดการตำแหน่งของผู้ใช้ (UserPosition)
def get_user_positions(db: Session, user_id: UUID) -> List[Dict[str, Any]]:
    """ดึงข้อมูลตำแหน่งทั้งหมดของผู้ใช้"""
    from sqlalchemy.orm import joinedload
    
    user_positions = db.query(UserPosition).filter(
        UserPosition.user_id == user_id
    ).options(
        joinedload(UserPosition.position)
    ).order_by(UserPosition.is_primary.desc()).all()
    
    logger.info(f"Retrieved {len(user_positions)} positions for user {user_id}")
    
    return [user_position_to_dict(up) for up in user_positions]

def get_primary_position(db: Session, user_id: UUID) -> Dict[str, Any]:
    """ดึงข้อมูลตำแหน่งหลักของผู้ใช้"""
    from sqlalchemy.orm import joinedload
    
    user_position = db.query(UserPosition).filter(
        UserPosition.user_id == user_id,
        UserPosition.is_primary == True
    ).options(
        joinedload(UserPosition.position)
    ).first()
    
    if user_position:
        logger.info(f"Retrieved primary position for user {user_id}")
        return user_position_to_dict(user_position)
        
    logger.warning(f"No primary position found for user {user_id}")
    return None

def assign_position_to_user(db: Session, user_id: UUID, position_id: UUID, is_primary: bool = False, start_date = None) -> Dict[str, Any]:
    """กำหนดตำแหน่งให้กับผู้ใช้"""
    # ตรวจสอบว่าผู้ใช้มีอยู่จริง
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    
    # ตรวจสอบว่าตำแหน่งมีอยู่จริง
    position = db.query(Position).filter(Position.id == position_id, Position.is_active == True).first()
    if not position:
        logger.warning(f"Position not found: {position_id}")
        raise HTTPException(status_code=404, detail=f"Position with ID {position_id} not found")
    
    # ตรวจสอบว่าผู้ใช้มีตำแหน่งนี้อยู่แล้วหรือไม่
    existing = db.query(UserPosition).filter(
        UserPosition.user_id == user_id,
        UserPosition.position_id == position_id,
        UserPosition.end_date == None  # ยังไม่สิ้นสุด
    ).first()
    
    if existing:
        logger.warning(f"User {user_id} already has position {position_id}")
        raise DuplicateKeyError(f"User already has this position assigned")
    
    # ถ้าเป็นตำแหน่งหลัก ให้อัปเดตตำแหน่งหลักเดิม (ถ้ามี) ให้ไม่เป็นตำแหน่งหลักอีกต่อไป
    if is_primary:
        existing_primary = db.query(UserPosition).filter(
            UserPosition.user_id == user_id,
            UserPosition.is_primary == True
        ).first()
        
        if existing_primary:
            existing_primary.is_primary = False
            db.flush()
    
    # สร้างการกำหนดตำแหน่งใหม่
    new_user_position = UserPosition(
        user_id=user_id,
        position_id=position_id,
        is_primary=is_primary,
        start_date=start_date
    )
    
    db.add(new_user_position)
    db.commit()
    db.refresh(new_user_position)
    
    # โหลดข้อมูลตำแหน่งและผู้ใช้
    db.refresh(new_user_position, ['position', 'user'])
    
    logger.info(f"Assigned position {position_id} to user {user_id}")
    
    return user_position_to_dict(new_user_position)

def update_user_position(db: Session, user_position_id: UUID, data: dict) -> Optional[Dict[str, Any]]:
    """อัปเดตข้อมูลตำแหน่งของผู้ใช้"""
    from sqlalchemy.orm import joinedload
    
    user_position = db.query(UserPosition).filter(
        UserPosition.id == user_position_id
    ).options(
        joinedload(UserPosition.position),
        joinedload(UserPosition.user)
    ).first()
    
    if not user_position:
        logger.warning(f"User position not found: {user_position_id}")
        return None
    
    # ถ้าตั้งเป็นตำแหน่งหลัก ให้อัปเดตตำแหน่งหลักเดิม (ถ้ามี)
    if "is_primary" in data and data["is_primary"] == True and not user_position.is_primary:
        existing_primary = db.query(UserPosition).filter(
            UserPosition.user_id == user_position.user_id,
            UserPosition.is_primary == True,
            UserPosition.id != user_position_id
        ).first()
        
        if existing_primary:
            existing_primary.is_primary = False
            db.flush()
    
    # อัปเดตฟิลด์ต่างๆ
    for key, value in data.items():
        setattr(user_position, key, value)
    
    db.commit()
    
    logger.info(f"Updated user position {user_position_id}")
    
    return user_position_to_dict(user_position)

def remove_position_from_user(db: Session, user_position_id: UUID) -> bool:
    """ลบตำแหน่งออกจากผู้ใช้ (ไม่ลบข้อมูล แต่กำหนดวันสิ้นสุด)"""
    from datetime import datetime
    
    user_position = db.query(UserPosition).filter(
        UserPosition.id == user_position_id
    ).first()
    
    if not user_position:
        logger.warning(f"User position not found: {user_position_id}")
        return False
    
    # กำหนดวันสิ้นสุด
    user_position.end_date = datetime.now()
    
    # ถ้าเป็นตำแหน่งหลัก ให้ยกเลิกการเป็นตำแหน่งหลัก
    if user_position.is_primary:
        user_position.is_primary = False
    
    db.commit()
    
    logger.info(f"Removed position from user (user_position_id: {user_position_id})")
    
    return True