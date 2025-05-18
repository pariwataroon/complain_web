from datetime import datetime
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any, Optional

from models.comp_complaint_types import ComplaintType, ComplaintSubType, ComplaintChannel

# === ComplaintType Controllers ===

def get_complaint_types(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False):
    """ดึงรายการประเภทเรื่องร้องเรียนหลัก"""
    query = db.query(ComplaintType)
    
    if active_only:
        query = query.filter(ComplaintType.is_active == True)
    
    # Add this line to fix the SQL Server pagination error
    query = query.order_by(ComplaintType.name)
    
    types = query.offset(skip).limit(limit).all()
    
    # แปลง SQLAlchemy models เป็น dictionary
    result = []
    for type_item in types:
        result.append({
            "id": str(type_item.id),
            "name": type_item.name,
            "description": type_item.description,
            "is_active": type_item.is_active,
            "created_at": type_item.created_at,
            "updated_at": type_item.updated_at
        })
    
    return result

def create_complaint_type(db: Session, data: Dict[str, Any]):
    """สร้างประเภทเรื่องร้องเรียนหลัก"""
    new_complaint_type = ComplaintType(**data)
    db.add(new_complaint_type)
    db.commit()
    db.refresh(new_complaint_type)
    return new_complaint_type

def get_complaint_type(db: Session, type_id: UUID):
    """ดึงข้อมูลประเภทเรื่องร้องเรียนหลัก"""
    return db.query(ComplaintType).filter(ComplaintType.id == type_id).first()

def update_complaint_type(db: Session, type_id: UUID, data: Dict[str, Any]):
    """อัพเดทข้อมูลประเภทเรื่องร้องเรียนหลัก"""
    complaint_type = db.query(ComplaintType).filter(ComplaintType.id == type_id).first()
    if not complaint_type:
        return None
    
    for key, value in data.items():
        if hasattr(complaint_type, key):
            setattr(complaint_type, key, value)
    
    complaint_type.updated_at = datetime.now()
    db.commit()
    db.refresh(complaint_type)
    return complaint_type

def delete_complaint_type(db: Session, type_id: UUID):
    """ลบประเภทเรื่องร้องเรียนหลัก"""
    complaint_type = db.query(ComplaintType).filter(ComplaintType.id == type_id).first()
    if not complaint_type:
        return False
    
    db.delete(complaint_type)
    db.commit()
    return True

# === ComplaintSubType Controllers ===

def get_complaint_subtypes(db: Session, skip: int = 0, limit: int = 100, parent_type_id: Optional[UUID] = None, active_only: bool = False):
    """ดึงรายการประเภทเรื่องร้องเรียนย่อย"""
    query = db.query(ComplaintSubType)
    
    if parent_type_id:
        query = query.filter(ComplaintSubType.parent_type_id == parent_type_id)
    
    if active_only:
        query = query.filter(ComplaintSubType.is_active == True)
    
    # Add this line for SQL Server pagination
    query = query.order_by(ComplaintSubType.name)
    
    total_count = query.count()
    complaint_subtypes = query.offset(skip).limit(limit).all()
    
    # แปลง SQLAlchemy models เป็น dictionary
    items = []
    for subtype in complaint_subtypes:
        items.append({
            "id": str(subtype.id),
            "parent_type_id": str(subtype.parent_type_id),
            "name": subtype.name,
            "description": subtype.description,
            "is_active": subtype.is_active,
            "created_at": subtype.created_at,
            "updated_at": subtype.updated_at
        })
    
    return {
        "items": items,
        "pagination": {
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": total_count > (skip + limit)
        }
    }

def create_complaint_subtype(db: Session, data: Dict[str, Any]):
    """สร้างประเภทเรื่องร้องเรียนย่อย"""
    new_complaint_subtype = ComplaintSubType(**data)
    db.add(new_complaint_subtype)
    db.commit()
    db.refresh(new_complaint_subtype)
    return new_complaint_subtype

def get_complaint_subtype(db: Session, subtype_id: UUID):
    """ดึงข้อมูลประเภทเรื่องร้องเรียนย่อย"""
    return db.query(ComplaintSubType).filter(ComplaintSubType.id == subtype_id).first()

def update_complaint_subtype(db: Session, subtype_id: UUID, data: Dict[str, Any]):
    """อัพเดทข้อมูลประเภทเรื่องร้องเรียนย่อย"""
    complaint_subtype = db.query(ComplaintSubType).filter(ComplaintSubType.id == subtype_id).first()
    if not complaint_subtype:
        return None
    
    for key, value in data.items():
        if hasattr(complaint_subtype, key):
            setattr(complaint_subtype, key, value)
    
    complaint_subtype.updated_at = datetime.now()
    db.commit()
    db.refresh(complaint_subtype)
    return complaint_subtype

def delete_complaint_subtype(db: Session, subtype_id: UUID):
    """ลบประเภทเรื่องร้องเรียนย่อย"""
    complaint_subtype = db.query(ComplaintSubType).filter(ComplaintSubType.id == subtype_id).first()
    if not complaint_subtype:
        return False
    
    db.delete(complaint_subtype)
    db.commit()
    return True

# === ComplaintChannel Controllers ===

def get_complaint_channels(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False):
    """ดึงรายการช่องทางการร้องเรียน"""
    query = db.query(ComplaintChannel)
    
    if active_only:
        query = query.filter(ComplaintChannel.is_active == True)
    
    # Add this line for SQL Server pagination
    query = query.order_by(ComplaintChannel.name)
    
    total_count = query.count()
    channels = query.offset(skip).limit(limit).all()
    
    # แปลง SQLAlchemy models เป็น dictionary
    items = []
    for channel in channels:
        items.append({
            "id": str(channel.id),
            "name": channel.name,
            "description": channel.description,
            "is_active": channel.is_active,
            "created_at": channel.created_at,
            "updated_at": channel.updated_at
        })
    
    return {
        "items": items,
        "pagination": {
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": total_count > (skip + limit)
        }
    }

def create_complaint_channel(db: Session, data: Dict[str, Any]):
    """สร้างช่องทางการร้องเรียน"""
    new_channel = ComplaintChannel(**data)
    db.add(new_channel)
    db.commit()
    db.refresh(new_channel)
    return new_channel

def get_complaint_channel(db: Session, channel_id: UUID):
    """ดึงข้อมูลช่องทางการร้องเรียน"""
    return db.query(ComplaintChannel).filter(ComplaintChannel.id == channel_id).first()

def update_complaint_channel(db: Session, channel_id: UUID, data: Dict[str, Any]):
    """อัพเดทข้อมูลช่องทางการร้องเรียน"""
    channel = db.query(ComplaintChannel).filter(ComplaintChannel.id == channel_id).first()
    if not channel:
        return None
    
    for key, value in data.items():
        if hasattr(channel, key):
            setattr(channel, key, value)
    
    channel.updated_at = datetime.now()
    db.commit()
    db.refresh(channel)
    return channel

def delete_complaint_channel(db: Session, channel_id: UUID):
    """ลบช่องทางการร้องเรียน"""
    channel = db.query(ComplaintChannel).filter(ComplaintChannel.id == channel_id).first()
    if not channel:
        return False
    
    db.delete(channel)
    db.commit()
    return True