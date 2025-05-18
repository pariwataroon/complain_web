from datetime import datetime
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, Optional

from models.comp_complaint import Complaint

def register_complaint(db: Session, complaint_id: UUID, registration_data: Dict[str, Any], user_id: Optional[UUID] = None):
    """บันทึกข้อมูลลงทะเบียนเรื่องร้องเรียนโดยเจ้าหน้าที่"""
    # ตรวจสอบว่าเรื่องร้องเรียนมีอยู่จริง
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        return None
    
    # อัพเดทข้อมูลลงทะเบียน
    complaint.complaint_type_id = registration_data.get("complaint_type_id")
    complaint.complaint_subtype_id = registration_data.get("complaint_subtype_id")
    complaint.complaint_channel_id = registration_data.get("complaint_channel_id")
    
    complaint.reference_number = registration_data.get("reference_number")
    complaint.reference_number2 = registration_data.get("reference_number2")
    complaint.reference_number3 = registration_data.get("reference_number3")
    
    complaint.registration_date = registration_data.get("registration_date")
    
    complaint.confidentiality_level = registration_data.get("confidentiality_level")
    complaint.urgency_level = registration_data.get("urgency_level")
    
    complaint.agency_sender = registration_data.get("agency_sender")
    
    # อัพเดทเวลา
    complaint.updated_at = datetime.now()
    
    # บันทึกข้อมูล
    db.commit()
    db.refresh(complaint)
    
    return complaint

def get_complaint_registration_data(db: Session, complaint_id: UUID):
    """ดึงข้อมูลลงทะเบียนเรื่องร้องเรียน"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        return None
        
    # สร้างข้อมูลการลงทะเบียนเพื่อส่งกลับ
    registration_data = {
        "id": complaint.id,
        "complaint_number": complaint.complaint_number,
        "complaint_type_id": complaint.complaint_type_id,
        "complaint_subtype_id": complaint.complaint_subtype_id,
        "complaint_channel_id": complaint.complaint_channel_id,
        "reference_number": complaint.reference_number,
        "reference_number2": complaint.reference_number2,
        "reference_number3": complaint.reference_number3,
        "registration_date": complaint.registration_date,
        "confidentiality_level": complaint.confidentiality_level,
        "urgency_level": complaint.urgency_level,
        "agency_sender": complaint.agency_sender,
        "updated_at": complaint.updated_at
    }
    
    return registration_data