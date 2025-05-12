import uuid
import json
from datetime import datetime
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any, Optional, Tuple

from models.comp_complaint import Complaint, ComplaintStatus, ComplaintStatusHistory
from models.comp_provinces import Province
from models.comp_amphures import Amphure
from models.comp_districts import District
from app.api.v1.schemas.complaint import ComplaintListItem

# ฟังก์ชันช่วยจัดการข้อมูลที่อยู่
def process_location_fields(data_dict: Dict, db: Session) -> Dict:
    """
    แปลงข้อมูลที่อยู่จากรูปแบบ {value, label} เป็นค่าที่จะบันทึกลงฐานข้อมูล
    พร้อมดึงข้อมูลเพิ่มเติมจากฐานข้อมูล Geography ถ้าจำเป็น
    """
    if not data_dict:
        return data_dict
        
    # Transform location fields if they're in the new format
    for field in ['province', 'districts', 'subdistricts', 'zipcode']:
        if field in data_dict and isinstance(data_dict[field], dict):
            # Store both the value and label for reference
            if 'value' in data_dict[field] and 'label' in data_dict[field]:
                field_value = data_dict[field]['value']
                field_label = data_dict[field]['label']
                
                # Store the ID for associations
                data_dict[f"{field}_id"] = field_value
                data_dict[field] = field_label
                
                # For subdistricts, fetch zipcode if available or get from database
                if field == 'subdistricts':
                    if 'zip_code' in data_dict[field]:
                        data_dict['zipcode'] = data_dict[field]['zip_code']
                    else:
                        # Try to fetch zipcode from database
                        district = db.query(District).filter(District.id == field_value).first()
                        if district and district.zip_code:
                            data_dict['zipcode'] = district.zip_code
    
    return data_dict

# ฟังก์ชันช่วยจัดการข้อมูลผู้ร้องเรียน
def process_complainant_data(complainant_data: Dict, db: Session) -> Tuple[str, Dict]:
    """
    แยกข้อมูลผู้ร้องเรียนและตรวจสอบประเภท (บุคคลธรรมดาหรือนิติบุคคล)
    """
    # ตรวจสอบประเภทผู้ร้องเรียน
    complainant_type = complainant_data.get("complainant_type", "general")
    
    # Extract the actual complainant data based on type
    if complainant_type == "corporate":
        actual_complainant_data = complainant_data.get("corporate", {})
        # If we have a signer, include it in the corporate data
        if "signer" in complainant_data and complainant_data.get("signer"):
            actual_complainant_data["signer"] = complainant_data.get("signer")
    else:
        actual_complainant_data = complainant_data.get("general", {})
    
    # จัดการข้อมูลที่อยู่
    actual_complainant_data = process_location_fields(actual_complainant_data, db)
    
    # จัดการข้อมูลผู้รับมอบอำนาจ (ถ้ามี)
    delegate_data = complainant_data.get("delegate")
    if delegate_data:
        delegate_data = process_location_fields(delegate_data, db)
        
    return complainant_type, actual_complainant_data, delegate_data

# ฟังก์ชันช่วยจัดการข้อมูลผู้ถูกร้องเรียน
def process_respondent_data(respondent_data: Dict, step2_data: Dict, db: Session) -> Tuple[str, Dict]:
    """
    จัดการข้อมูลผู้ถูกร้องเรียน และตรวจสอบประเภท
    """
    # ตรวจสอบประเภทผู้ถูกร้องเรียน
    respondent_type = ""
    # Extract respondent type from keys
    for key in respondent_data:
        respondent_type = key
        break
        
    # If respondent_type is still empty, check step2 for activeType
    if not respondent_type and step2_data:
        respondent_type = step2_data.get("general", {}).get("activeType", "")
        
        # Get the corresponding data based on activeType
        if respondent_type and respondent_type in step2_data.get("general", {}):
            respondent_data = {respondent_type: step2_data["general"][respondent_type]}
    
    # จัดการข้อมูลที่อยู่ของผู้ถูกร้องเรียน
    for resp_type, resp_data in respondent_data.items():
        resp_data = process_location_fields(resp_data, db)
    
    return respondent_type, respondent_data.get(respondent_type, {})

# ฟังก์ชันหลักสำหรับสร้างข้อร้องเรียน
def create_complaint(db: Session, complaint_data: Dict[str, Any], user_id: Optional[UUID] = None) -> Complaint:
    """
    สร้างข้อร้องเรียนใหม่จากข้อมูลที่ได้รับ
    """
    # สร้างเลขที่ข้อร้องเรียน
    complaint_number = generate_complaint_number(db)
    
    # แยกข้อมูลหลักจากข้อมูลที่ได้รับ
    subject = complaint_data.get("subject", "")
    description = complaint_data.get("description", "")
    complainant_data = complaint_data.get("complainant_data", {})
    respondent_data = complaint_data.get("respondent_data", {})
    incident_data = complaint_data.get("incident_data", {})
    accepted = complaint_data.get("accepted", True)
    
    # แปลงและตรวจสอบข้อมูลผู้ร้องเรียน
    complainant_type = complaint_data.get("complainant_type", "general")
    
    # If complainant_type is not explicitly provided, try to detect it from structure
    if "complainant_type" not in complaint_data:
        if step1_data := complaint_data.get("step1", {}):
            if "corporate" in step1_data.get("general", {}) and any(step1_data.get("general", {}).get("corporate", {}).values()):
                complainant_type = "corporate"
        elif "corporate" in complainant_data and any(complainant_data.get("corporate", {}).values()):
            complainant_type = "corporate"
            
    # จัดการข้อมูลผู้ร้องเรียน
    complainant_type, actual_complainant_data, delegate_data = process_complainant_data(complainant_data, db)
    
    # จัดการข้อมูลผู้ถูกร้องเรียน
    respondent_type, processed_respondent_data = process_respondent_data(
        respondent_data, 
        complaint_data.get("step2", {}), 
        db
    )
    
    # จัดการข้อมูลเหตุการณ์
    incident_date = parse_incident_date(incident_data)
    complaint_type = incident_data.get("complaintType", "")
    
    # สร้างข้อร้องเรียนใหม่
    new_complaint = Complaint(
        complaint_number=complaint_number,
        subject=subject,
        description=description,
        status=ComplaintStatus.SUBMITTED,
        complainant_data=actual_complainant_data,
        delegate_data=delegate_data,
        complainant_type=complainant_type,
        respondent_data=processed_respondent_data,
        respondent_type=respondent_type,
        incident_date=incident_date,
        complaint_type=complaint_type,
        terms_accepted=accepted,
        created_by=user_id
    )
    
    # บันทึกข้อมูลลงฐานข้อมูล
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    # เพิ่มประวัติสถานะเริ่มต้น
    create_status_history(
        db, 
        new_complaint.id, 
        ComplaintStatus.SUBMITTED, 
        "Complaint submitted", 
        user_id
    )
    
    return new_complaint

def parse_incident_date(incident_data: Dict) -> Optional[datetime]:
    """แปลงข้อมูลวันที่เกิดเหตุ"""
    if "incidentDate" in incident_data:
        try:
            return datetime.fromisoformat(incident_data["incidentDate"].replace('Z', '+00:00'))
        except:
            return datetime.now()
    return None

def create_status_history(db: Session, complaint_id: UUID, status: ComplaintStatus, notes: str, user_id: Optional[UUID] = None):
    """สร้างประวัติสถานะใหม่"""
    status_history = ComplaintStatusHistory(
        complaint_id=complaint_id,
        status=status,
        notes=notes,
        changed_by=user_id
    )
    
    db.add(status_history)
    db.commit()

def generate_complaint_number(db: Session) -> str:
    """สร้างเลขที่ข้อร้องเรียนแบบอัตโนมัติ"""
    today = datetime.now()
    date_part = today.strftime("%Y%m%d")
    
    # นับจำนวนข้อร้องเรียนที่สร้างในวันนี้เพื่อสร้างลำดับ
    today_start = datetime.combine(today.date(), datetime.min.time())
    today_end = datetime.combine(today.date(), datetime.max.time())
    
    today_count = db.query(Complaint).filter(
        Complaint.created_at.between(today_start, today_end)
    ).count()
    
    sequence = str(today_count + 1).zfill(5)
    return f"CMPL-{date_part}-{sequence}"

def get_complaints(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    """ดึงรายการข้อร้องเรียนพร้อมการแบ่งหน้า"""
    query = db.query(Complaint)
    
    if status:
        query = query.filter(Complaint.status == status)
    
    # เรียงลำดับตามวันที่สร้าง ล่าสุดขึ้นก่อน
    query = query.order_by(Complaint.created_at.desc())

    complaints = query.offset(skip).limit(limit).all()
    
    result = []
    for complaint in complaints:
        # แยกข้อมูลสำหรับแสดงในรายการ
        list_item = create_complaint_list_item(complaint)
        result.append(list_item)
    
    return result

def create_complaint_list_item(complaint: Complaint) -> ComplaintListItem:
    """สร้างข้อมูลแบบย่อสำหรับแสดงในรายการ"""
    # ดึงชื่อผู้ร้องเรียนตามประเภท
    complainant_name = ""
    if complaint.complainant_type == "general":
        complainant_name = complaint.complainant_data.get("name", "")
    else:
        complainant_name = complaint.complainant_data.get("name", "")
    
    # ดึงชื่อผู้ถูกร้องเรียนตามประเภท
    respondent_name = ""
    if complaint.respondent_type == "individual":
        respondent_name = complaint.respondent_data.get("name", "")
    elif complaint.respondent_type == "corporate":
        respondent_name = complaint.respondent_data.get("companyName", "")
    elif complaint.respondent_type == "government":
        respondent_name = complaint.respondent_data.get("agencyName", "")
    
    return ComplaintListItem(
        id=complaint.id,
        complaint_number=complaint.complaint_number,
        subject=complaint.subject,
        complaint_type=complaint.complaint_type,
        status=complaint.status,
        created_at=complaint.created_at,
        complainant_name=complainant_name,
        respondent_name=respondent_name
    )

def get_complaint(db: Session, complaint_id: uuid.UUID):
    """ดึงข้อมูลข้อร้องเรียนแบบละเอียดจาก ID"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return None
    
    # ดึงข้อมูลไฟล์แนบ
    attachment_list = get_complaint_attachments(complaint)
    
    # ดึงประวัติสถานะ
    status_history = get_complaint_status_history(db, complaint_id)
    
    # สร้างโครงสร้างข้อมูลตามที่ schema ต้องการ
    response_data = format_complaint_response(complaint, attachment_list, status_history)
    
    return response_data

def get_complaint_attachments(complaint: Complaint) -> List[Dict]:
    """ดึงรายการไฟล์แนบของข้อร้องเรียน"""
    attachment_list = []
    for attachment in complaint.attachments:
        attachment_list.append({
            "fileName": attachment.file_name,
            "fileSize": attachment.file_size,
            "fileUrl": attachment.file_url,
            "fileType": attachment.file_type
        })
    return attachment_list

def get_complaint_status_history(db: Session, complaint_id: UUID) -> List[Dict]:
    """ดึงประวัติสถานะของข้อร้องเรียน"""
    status_history = []
    for history in db.query(ComplaintStatusHistory).filter(
        ComplaintStatusHistory.complaint_id == complaint_id
    ).order_by(ComplaintStatusHistory.changed_at).all():
        status_history.append({
            "status": history.status,
            "notes": history.notes,
            "changed_at": history.changed_at,
            "changed_by": history.changed_by
        })
    return status_history

def format_complaint_response(complaint: Complaint, attachment_list: List, status_history: List) -> Dict:
    """จัดรูปแบบข้อมูลข้อร้องเรียนตาม schema ที่กำหนด"""
    # สร้างโครงสร้างข้อมูลพื้นฐาน
    step1_data = {"general": {}, "delegate": None, "corporate": {}, "signer": None}
    step2_data = {"individual": None, "corporate": None, "government": None}
    
    # จัดการข้อมูลผู้ร้องเรียน
    if complaint.complainant_type == "general":
        step1_data["general"] = complaint.complainant_data
        if "signer" in complaint.complainant_data:
            step1_data["signer"] = complaint.complainant_data.pop("signer")
    else:
        step1_data["corporate"] = complaint.complainant_data
        if "signer" in complaint.complainant_data:
            step1_data["signer"] = complaint.complainant_data.pop("signer")
    
    # จัดการข้อมูลผู้รับมอบอำนาจ
    if complaint.delegate_data:
        step1_data["delegate"] = complaint.delegate_data
    
    # จัดการข้อมูลผู้ถูกร้องเรียน
    if complaint.respondent_type == "individual":
        step2_data["individual"] = complaint.respondent_data
    elif complaint.respondent_type == "corporate":
        step2_data["corporate"] = complaint.respondent_data
    elif complaint.respondent_type == "government":
        step2_data["government"] = complaint.respondent_data
    
    # สร้างข้อมูลผลลัพธ์
    return {
        "id": complaint.id,
        "complaint_number": complaint.complaint_number,
        "step1": step1_data,
        "step2": step2_data,
        "step3": {
            "incidentDate": complaint.incident_date,
            "complaintType": complaint.complaint_type,
            "subject": complaint.subject,
            "description": complaint.description,
            "attachment": attachment_list
        },
        "step4": {
            "accepted": complaint.terms_accepted
        },
        "status": complaint.status,
        "status_history": status_history,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "assigned_to": complaint.assigned_to,
        "assigned_date": complaint.assigned_date,
        "resolution_summary": complaint.resolution_summary,
        "resolved_date": complaint.resolved_date
    }

def update_complaint_status(db: Session, complaint_id: uuid.UUID, new_status: ComplaintStatus, notes: Optional[str] = None, user_id: Optional[UUID] = None):
    """อัพเดทสถานะของข้อร้องเรียน"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return None
    
    # อัพเดทข้อมูลสถานะ
    complaint.status = new_status
    complaint.updated_at = datetime.now()
    
    # ถ้าสถานะเป็น "เสร็จสิ้น" ให้บันทึกวันที่ดำเนินการเสร็จ
    if new_status == ComplaintStatus.COMPLETED:
        complaint.resolved_date = datetime.now()
    
    # เพิ่มประวัติสถานะ
    create_status_history(db, complaint_id, new_status, notes, user_id)
    
    db.refresh(complaint)
    return complaint

def delete_complaint(db: Session, complaint_id: uuid.UUID):
    """ลบข้อร้องเรียน"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return False
    
    db.delete(complaint)
    db.commit()
    
    return True