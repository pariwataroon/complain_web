import enum
from datetime import datetime
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any, Optional

from models.comp_complaint_types import ComplaintType, ComplaintSubType, ComplaintChannel

# === ComplaintType Controllers ===
from models.comp_complaint import ComplainantType, RespondentType

def get_complaint_types(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False):
    """ดึงรายการประเภทเรื่องร้องเรียนหลัก"""
    query = db.query(ComplaintType)
    
    if active_only:
        query = query.filter(ComplaintType.is_active == True)
    
    query = query.order_by(ComplaintType.name)
    types = query.offset(skip).limit(limit).all()

    return types

def get_complaint_types_dict(db: Session, skip: int = 0, limit: int = 100, active_only: bool = False):
    """ดึงรายการประเภทเรื่องร้องเรียนหลักในรูปแบบ dictionary (สำหรับ internal use)"""
    query = db.query(ComplaintType)
    
    if active_only:
        query = query.filter(ComplaintType.is_active == True)
    
    query = query.order_by(ComplaintType.name)
    types = query.offset(skip).limit(limit).all()
    
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

def get_complaint_types_for_form(db: Session, active_only: bool = True):
    """ดึงรายการประเภทเรื่องร้องเรียนสำหรับ form (รูปแบบ value, label)"""
    return get_complaint_types_dict(db, skip=0, limit=1000, active_only=active_only)

def search_complaint_types_by_name(db: Session, search: str = None, active_only: bool = True):
    """ค้นหาประเภทเรื่องร้องเรียนตามชื่อ"""
    query = db.query(ComplaintType)
    
    if active_only:
        query = query.filter(ComplaintType.is_active == True)
        
    if search:
        query = query.filter(ComplaintType.name.ilike(f"%{search}%"))
        
    query = query.order_by(ComplaintType.name)
    complaint_types = query.all()
    
    result = []
    for complaint_type in complaint_types:
        result.append({
            "value": str(complaint_type.id),
            "label": complaint_type.name,
            "description": complaint_type.description
        })
    
    return result

def validate_complaint_type_name(db: Session, complaint_type_name: str) -> Optional[str]:
    """ตรวจสอบว่าประเภทเรื่องร้องเรียนที่ระบุมีอยู่ในระบบหรือไม่"""
    complaint_type = db.query(ComplaintType).filter(
        ComplaintType.name == complaint_type_name,
        ComplaintType.is_active == True
    ).first()
    
    if complaint_type:
        return {
            "valid": True,
            "type_id": str(complaint_type.id),
            "type_name": complaint_type.name,
            "description": complaint_type.description
        }
    else:
        return {
            "valid": False,
            "message": f"ไม่พบประเภทเรื่องร้องเรียน '{complaint_type_name}' ในระบบ"
        }

def get_popular_complaint_types(db: Session, limit: int = 10):
    """ดึงรายการประเภทเรื่องร้องเรียนที่ได้รับความนิยมสูงสุด"""
    from models.comp_complaint import Complaint
    from sqlalchemy import func
    
    popular_types = db.query(
        ComplaintType.id,
        ComplaintType.name,
        ComplaintType.description,
        func.count(Complaint.id).label('usage_count')
    ).outerjoin(
        Complaint, Complaint.complaint_type_id == ComplaintType.id
    ).filter(
        ComplaintType.is_active == True
    ).group_by(
        ComplaintType.id, ComplaintType.name, ComplaintType.description
    ).order_by(
        func.count(Complaint.id).desc()
    ).limit(limit).all()
    
    result = []
    for ptype in popular_types:
        result.append({
            "value": str(ptype.id),
            "label": ptype.name,
            "description": ptype.description,
            "usage_count": ptype.usage_count
        })
    
    return result

def get_complaint_subtypes_for_form(db: Session, parent_type_id: Optional[UUID] = None, active_only: bool = True):
    """ดึงรายการประเภทเรื่องร้องเรียนย่อยสำหรับ form"""
    query = db.query(ComplaintSubType)
    
    if parent_type_id:
        query = query.filter(ComplaintSubType.parent_type_id == parent_type_id)
    
    if active_only:
        query = query.filter(ComplaintSubType.is_active == True)
    
    query = query.order_by(ComplaintSubType.name)
    subtypes = query.all()
    
    result = []
    for subtype in subtypes:
        result.append({
            "value": str(subtype.id),
            "label": subtype.name,
            "description": subtype.description,
            "parent_type_id": str(subtype.parent_type_id)
        })
    
    return result

def get_complaint_channels_for_form(db: Session, active_only: bool = True):
    """ดึงรายการช่องทางการร้องเรียนสำหรับ form"""
    query = db.query(ComplaintChannel)
    
    if active_only:
        query = query.filter(ComplaintChannel.is_active == True)
    
    query = query.order_by(ComplaintChannel.name)
    channels = query.all()
    
    result = []
    for channel in channels:
        result.append({
            "value": str(channel.id),
            "label": channel.name,
            "description": channel.description
        })
    
    return result

def extract_complaint_data(complaint_data: Dict, root_complaint_type: str) -> Dict:
    """สกัดข้อมูลที่จำเป็นจาก complaint_data"""
    step1 = complaint_data.get("step1", {})
    step2 = complaint_data.get("step2", {})
    step3 = complaint_data.get("step3", {})
    step4 = complaint_data.get("step4", {})
    
    # สกัดข้อมูลเรื่องร้องเรียน
    subject = ""
    description = ""
    complaint_type = ""
    incident_date = None
    
    if "complaintType" in complaint_data and complaint_data["complaintType"]:
        complaint_type = complaint_data["complaintType"]
    
    if "general" in step3:
        general_step3 = step3["general"]
        subject = general_step3.get("subject", "")
        description = general_step3.get("description", "")
        if not complaint_type:
            complaint_type = general_step3.get("complaintType", "")
        
        incident_date_str = general_step3.get("incidentDate")
        if incident_date_str:
            try:
                incident_date = datetime.fromisoformat(incident_date_str.replace('Z', '+00:00'))
            except:
                incident_date = None
    
    if not complaint_type and root_complaint_type:
        complaint_type = root_complaint_type
    
    accepted = True
    if "general" in step4:
        accepted = step4["general"].get("accepted", True)
    
    # ประมวลผลข้อมูลผู้ร้องเรียนและผู้ถูกร้องเรียน
    complainant_result = process_complainant_data(step1)
    respondent_result = process_respondent_data(step2)
    
    return {
        "subject": subject,
        "description": description,
        "complaint_type": complaint_type,
        "incident_date": incident_date,
        "accepted": accepted,
        "complainant_data": complainant_result.get("data", {}),
        "complainant_type": complainant_result.get("type", ComplainantType.INDIVIDUAL),
        "delegate_data": complainant_result.get("delegate_data"),
        "respondent_data": respondent_result.get("data", {}),
        "respondent_type": respondent_result.get("type", RespondentType.INDIVIDUAL)
    }

def process_complainant_data(step1: Dict) -> Dict:
    """ประมวลผลข้อมูลผู้ร้องเรียน"""
    # Implementation จาก complaint_controller.py
    general = step1.get("general", {})
    general_data = general.get("general", {})
    
    return {
        "data": general_data,
        "type": ComplainantType.INDIVIDUAL,  # default
        "delegate_data": None
    }

def process_respondent_data(step2: Dict) -> Dict:
    """ประมวลผลข้อมูลผู้ถูกร้องเรียน"""
    # Implementation จาก complaint_controller.py
    general = step2.get("general", {})
    active_type = general.get("activeType", "individual")
    
    if active_type == "individual":
        data = general.get("individual", {})
        respondent_type = RespondentType.INDIVIDUAL
    elif active_type == "corporate":
        data = general.get("corporate", {})
        respondent_type = RespondentType.CORPORATE
    else:
        data = {}
        respondent_type = RespondentType.INDIVIDUAL
    
    return {
        "data": data,
        "type": respondent_type
    }