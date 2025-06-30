from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
from typing import List, Dict, Any, Optional
import logging
import traceback
import copy
import json
import uuid
import threading

from models.comp_complaint import (
    Complaint, ComplaintStatus, ComplainantType, RespondentType, 
    ComplaintStatusHistory, ConfidentialityLevel, UrgencyLevel, 
    ComplaintFilingType, SeverityLevel
)
from models.comp_provinces import Province
from models.comp_amphures import Amphure
from models.comp_districts import District
from app.api.v1.schemas.complaint import ComplaintListItem
from app.api.v1.schemas.notification import NotificationCreate
from models.comp_complaint_types import ComplaintType, ComplaintSubType, ComplaintChannel
from app.api.v1.controllers.geography_controller import model_to_dict
from models.user import User
from app.api.v1.controllers.complaint_assignment_controller import get_assignment_form_data
import app.api.v1.controllers.notification_controller as notification_controller

logger = logging.getLogger(__name__)

# Global flag สำหรับควบคุม debug logs
DEBUG_MODE = False

def get_or_set_default_complaint_channel(db: Session, channel_id: Optional[UUID] = None) -> Optional[UUID]:
    """ดึงหรือกำหนดช่องทางการร้องเรียนเริ่มต้น"""
    from models.comp_complaint_types import ComplaintChannel
    
    if channel_id:
        # ตรวจสอบว่า channel_id ที่ส่งมาถูกต้องหรือไม่
        channel = db.query(ComplaintChannel).filter(
            ComplaintChannel.id == channel_id,
            ComplaintChannel.is_active == True
        ).first()
        
        if channel:
            return channel_id
    
    # หาช่องทาง "เว็บไซต์" เป็นค่าเริ่มต้น
    website_channel = db.query(ComplaintChannel).filter(
        ComplaintChannel.name == "เว็บไซต์",
        ComplaintChannel.is_active == True
    ).first()
    
    if website_channel:
        return website_channel.id
    
    # ถ้าไม่พบ "เว็บไซต์" ให้หาช่องทางแรกที่เปิดใช้งาน
    default_channel = db.query(ComplaintChannel).filter(
        ComplaintChannel.is_active == True
    ).first()
    
    if default_channel:
        return default_channel.id
    else:
        return None

def validate_complaint_channel(db: Session, channel_id: UUID) -> bool:
    """ตรวจสอบความถูกต้องของช่องทางการร้องเรียน"""
    from models.comp_complaint_types import ComplaintChannel
    
    try:
        channel = db.query(ComplaintChannel).filter(
            ComplaintChannel.id == channel_id,
            ComplaintChannel.is_active == True
        ).first()
        return channel is not None
    except Exception:
        return False

def create_complaint(db: Session, complaint_data: Dict[str, Any], user_id: Optional[UUID] = None) -> Complaint:
    """สร้างข้อร้องเรียนใหม่"""
    try:
        complaint_channel_id = None
        if "complaint_channel_id" in complaint_data:
            channel_id_str = complaint_data["complaint_channel_id"]

            if channel_id_str and channel_id_str != 'None' and channel_id_str != 'null':
                try:
                    complaint_channel_id = UUID(channel_id_str)
                    
                    # ตรวจสอบว่าช่องทางนี้มีอยู่จริงหรือไม่
                    from models.comp_complaint_types import ComplaintChannel
                    channel = db.query(ComplaintChannel).filter(
                        ComplaintChannel.id == complaint_channel_id,
                        ComplaintChannel.is_active == True
                    ).first()
                    
                    if not channel:
                        complaint_channel_id = get_or_set_default_complaint_channel(db)
                except (ValueError, TypeError) as e:
                    complaint_channel_id = get_or_set_default_complaint_channel(db)
            else:
                complaint_channel_id = get_or_set_default_complaint_channel(db)
        else:
            complaint_channel_id = get_or_set_default_complaint_channel(db)
        
        # ถ้าไม่พบช่องทางใดๆ ให้ error
        if not complaint_channel_id:
            raise ValueError("ไม่พบช่องทางการร้องเรียนที่เปิดใช้งาน")
        
        # บันทึกข้อมูลต้นฉบับ
        original_data = save_original_complaint(complaint_data)
        
        # สกัดข้อมูลหลัก
        root_complaint_type = complaint_data.get("complaintType", "")
        
        # ประมวลผลข้อมูล
        extracted_data = extract_complaint_data(complaint_data, root_complaint_type)
        
        # เตรียมข้อมูลสำหรับ model
        model_data = prepare_complaint_model_data(
            db, complaint_data, original_data, extracted_data, root_complaint_type, user_id
        )
        
        # ✅ เพิ่ม complaint_channel_id เข้าไปใน model data
        if complaint_channel_id:
            model_data["complaint_channel_id"] = complaint_channel_id
        
        # สร้าง Complaint object
        new_complaint = Complaint(**model_data)
        
        # บันทึกลงฐานข้อมูล
        db.add(new_complaint)
        db.commit()
        db.refresh(new_complaint)
        
        # สร้างประวัติสถานะ
        create_status_history(
            db, new_complaint.id, ComplaintStatus.SUBMITTED, 
            "เรื่องร้องเรียนได้รับการสร้างขึ้นใหม่", user_id
        )
        
        # ✅ เพิ่มส่วนนี้หลัง create_status_history
        # สร้าง notification เมื่อมีเรื่องร้องเรียนใหม่
        try:
            # ดึงข้อมูลผู้ร้องเรียน
            complainant_data = ensure_dict(extracted_data.get("complainant_data", {}))
            delegate_data = ensure_dict(extracted_data.get("delegate_data")) if extracted_data.get("delegate_data") else None
            complainant_name = get_complainant_display_name_for_notification(complainant_data, delegate_data)
            
            # ดึงชื่อช่องทาง
            channel_name = get_channel_name_for_notification(db, complaint_channel_id)
            
            # สร้าง notification message
            notification_message = create_complaint_notification_message(
                new_complaint, complainant_name, channel_name, extracted_data.get("complaint_type", "")
            )

            # สร้าง notification
            notification_data = NotificationCreate(
                title="เรื่องร้องเรียนใหม่",
                message=notification_message,
                role_seeking_group="admin,staff,supervisor",
                redirect_url=f"/complaints/{new_complaint.id}"
            )
            
            notification_controller.create_notification(db, notification_data)
            logger.info(f"Notification created for new complaint: {new_complaint.complaint_number}")
            
        except Exception as e:
            # ถ้าสร้าง notification ไม่สำเร็จ ให้บันทึก error แต่ไม่ทำให้การสร้างเรื่องร้องเรียนล้มเหลว
            logger.error(f"Error creating notification for complaint {new_complaint.complaint_number}: {str(e)}")
        
        return new_complaint
        
    except Exception as e:
        traceback.print_exc()
        logger.error(f"Error creating complaint: {str(e)}")
        raise e

def update_complaint_details(db: Session, complaint_id: UUID, update_data: Dict[str, Any], user_id: Optional[UUID] = None) -> Complaint:
    """อัพเดทรายละเอียดข้อร้องเรียน"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise ValueError(f"Complaint with ID {complaint_id} not found")
        
        # อัพเดทข้อมูลพื้นฐาน
        if "subject" in update_data:
            complaint.subject = update_data["subject"]
        
        if "description" in update_data:
            complaint.description = update_data["description"]
        
        if "complaint_type" in update_data:
            complaint.complaint_type = update_data["complaint_type"]
        
        if "incident_date" in update_data:
            complaint.incident_date = update_data["incident_date"]
        
        # อัพเดทข้อมูลผู้ร้องเรียน
        if "complainant_data" in update_data:
            complaint.complainant_data = json.dumps(update_data["complainant_data"], ensure_ascii=False)
        
        # อัพเดทข้อมูลผู้ถูกร้องเรียน
        if "respondent_data" in update_data:
            complaint.respondent_data = json.dumps(update_data["respondent_data"], ensure_ascii=False)
        
        # อัพเดทข้อมูลที่อยู่
        if "incident_province_id" in update_data:
            complaint.incident_province_id = update_data["incident_province_id"]
        
        if "incident_district_id" in update_data:
            complaint.incident_district_id = update_data["incident_district_id"]
        
        if "incident_subdistrict_id" in update_data:
            complaint.incident_subdistrict_id = update_data["incident_subdistrict_id"]
        
        # อัพเดทระดับความเร่งด่วนและความลับ
        if "urgency_level" in update_data:
            complaint.urgency_level = update_data["urgency_level"]
        
        if "confidentiality_level" in update_data:
            complaint.confidentiality_level = update_data["confidentiality_level"]
        
        # อัพเดทเวลา
        complaint.updated_at = datetime.now()
        
        # บันทึกประวัติการแก้ไข
        create_status_history(
            db, 
            complaint_id, 
            complaint.status, 
            "อัพเดทรายละเอียดข้อร้องเรียน", 
            user_id
        )
        
        db.commit()
        db.refresh(complaint)
        
        logger.info(f"Complaint {complaint.complaint_number} updated successfully")
        return complaint
        
    except Exception as e:
        logger.error(f"Failed to update complaint {complaint_id}: {str(e)}")
        db.rollback()
        raise

# ✅ เติมฟังก์ชันที่ขาดหายไป
def get_respondent_data_by_type(step2_general: Dict, data_type: str) -> Dict:
    """ดึงข้อมูลผู้ถูกร้องตามประเภทที่ระบุ"""
    respondent_data = {}
    
    if data_type in step2_general and step2_general[data_type]:
        respondent_data = process_nested_fields(step2_general[data_type])
        
        # ✅ แก้ไขชื่อให้ถูกต้อง
        if data_type == "corporate":
            if "companyName" in respondent_data and "name" not in respondent_data:
                respondent_data["name"] = respondent_data["companyName"]
        elif data_type == "government":
            if "agencyName" in respondent_data and "name" not in respondent_data:
                respondent_data["name"] = respondent_data["agencyName"]
    
    elif "individual" in step2_general and isinstance(step2_general["individual"], dict):
        # ลองหาจาก nested structure
        individual_data = step2_general["individual"]
        if data_type in individual_data and individual_data[data_type]:
            respondent_data = process_nested_fields(individual_data[data_type])
            
            # ✅ แก้ไขชื่อให้ถูกต้อง
            if data_type == "corporate":
                if "companyName" in respondent_data and "name" not in respondent_data:
                    respondent_data["name"] = respondent_data["companyName"]
            elif data_type == "government":
                if "agencyName" in respondent_data and "name" not in respondent_data:
                    respondent_data["name"] = respondent_data["agencyName"]
    
    return respondent_data

# ✅ เติมฟังก์ชันอื่นๆ ที่ขาดหายไป
def process_nested_fields(data: Dict) -> Dict:
    """ประมวลผลฟิลด์ที่มี nested structure"""
    if not isinstance(data, dict):
        return {}
    
    processed = {}
    for key, value in data.items():
        if isinstance(value, dict) and "value" in value:
            # ดึงค่าจาก object ที่มี value property
            processed[key] = value.get("value", value.get("label", ""))
        else:
            processed[key] = value
    
    return processed

def prepare_complaint_model_data(
    db: Session, 
    complaint_data: Dict, 
    original_data: Dict, 
    extracted_data: Dict, 
    root_complaint_type: str, 
    user_id: Optional[UUID]
) -> Dict:
    """เตรียมข้อมูลสำหรับสร้าง Complaint model"""
    
    # สร้างเลขที่เรื่องร้องเรียน
    complaint_number = generate_complaint_number(db)
    
    # ประมวลผลข้อมูลที่อยู่
    location_data = extract_location_data(complaint_data)
    
    return {
        "id": uuid.uuid4(),
        "complaint_number": complaint_number,
        "subject": extracted_data["subject"],
        "description": extracted_data["description"],
        "status": ComplaintStatus.SUBMITTED,
        "complainant_data": json.dumps(extracted_data["complainant_data"], ensure_ascii=False),
        "complainant_type": extracted_data["complainant_type"],
        "delegate_data": json.dumps(extracted_data["delegate_data"], ensure_ascii=False) if extracted_data["delegate_data"] else None,
        "respondent_data": json.dumps(extracted_data["respondent_data"], ensure_ascii=False),
        "respondent_type": extracted_data["respondent_type"],
        "full_complaint_data": json.dumps(original_data, ensure_ascii=False),
        "incident_date": extracted_data["incident_date"],
        "complaint_type": extracted_data["complaint_type"],
        "terms_accepted": extracted_data["accepted"],
        "created_by": user_id,
        "incident_province_id": location_data.get("province_id"),
        "incident_province": location_data.get("province_name"),
        "incident_district_id": location_data.get("district_id"),
        "incident_district": location_data.get("district_name"),
        "incident_subdistrict_id": location_data.get("subdistrict_id"),
        "incident_subdistrict": location_data.get("subdistrict_name"),
        "confidentiality_level": ConfidentialityLevel.NORMAL,
        "urgency_level": UrgencyLevel.LOW,
        "severity_level": SeverityLevel.LOW,
        "complaint_filing_type": ComplaintFilingType.NEW,
        "progress_percentage": 0
    }

def extract_location_data(complaint_data: Dict) -> Dict:
    """สกัดข้อมูลที่อยู่จากข้อมูลเรื่องร้องเรียน"""
    location_data = {}
    
    # ลองดึงจาก step1 (ที่อยู่ผู้ร้องเรียน)
    step1 = complaint_data.get("step1", {}).get("general", {})
    
    if "general" in step1:
        general_data = step1["general"]
        if "province" in general_data and isinstance(general_data["province"], dict):
            location_data["province_id"] = general_data["province"].get("value")
            location_data["province_name"] = general_data["province"].get("label")
        
        if "districts" in general_data and isinstance(general_data["districts"], dict):
            location_data["district_id"] = general_data["districts"].get("value")
            location_data["district_name"] = general_data["districts"].get("label")
        
        if "subdistricts" in general_data and isinstance(general_data["subdistricts"], dict):
            location_data["subdistrict_id"] = general_data["subdistricts"].get("value")
            location_data["subdistrict_name"] = general_data["subdistricts"].get("label")
    
    return location_data

def convert_form_data_to_structured(form_data: Dict) -> Dict:
    """แปลง formData เป็นโครงสร้าง step1-step4"""
    return {
        "step1": {"general": form_data.get("step1", {})},
        "step2": {"general": form_data.get("step2", {})},
        "step3": {"general": form_data.get("step3", {})},
        "step4": {"general": form_data.get("step4", {})}
    }

def save_original_complaint(complaint_data: Dict[str, Any]) -> Dict[str, Any]:
    """บันทึกข้อมูลตามโครงสร้าง step1-step4 ตามที่ได้รับจากหน้าบ้าน"""
    result = {
        "step1": copy.deepcopy(complaint_data.get("step1", {})),
        "step2": copy.deepcopy(complaint_data.get("step2", {})),
        "step3": copy.deepcopy(complaint_data.get("step3", {})),
        "step4": copy.deepcopy(complaint_data.get("step4", {}))
    }
    
    if "complaintType" in complaint_data and complaint_data["complaintType"]:
        if "step3" not in result:
            result["step3"] = {"general": {}}
        elif "general" not in result["step3"]:
            result["step3"]["general"] = {}
            
        result["step3"]["general"]["complaintType"] = complaint_data["complaintType"]
    
    return result

def ensure_complaint_type_consistency(data: Dict, complaint_type: str):
    """ตรวจสอบความสอดคล้องของ complaintType ในทุกระดับ"""
    if not complaint_type:
        return
        
    data["complaintType"] = complaint_type
    
    if "step3" in data and isinstance(data["step3"], dict):
        if "general" in data["step3"] and isinstance(data["step3"]["general"], dict):
            data["step3"]["general"]["complaintType"] = complaint_type

def get_respondent_data_by_type(step2_general: Dict, data_type: str) -> Dict:
    """ดึงข้อมูลผู้ถูกร้องตามประเภทที่ระบุ"""
    respondent_data = {}
    
    if data_type in step2_general and step2_general[data_type]:
        respondent_data = process_nested_fields(step2_general[data_type])
        
        # แก้ไขชื่อให้ถูกต้อง
        if data_type == "corporate":
            if "companyName" in respondent_data and "name" not in respondent_data:
                respondent_data["name"] = respondent_data["companyName"]
        elif data_type == "government":
            if "agencyName" in respondent_data and "name" not in respondent_data:
                respondent_data["name"] = respondent_data["agencyName"]
    
    elif "individual" in step2_general and isinstance(step2_general["individual"], dict):
        # ลองหาจาก nested structure
        individual_data = step2_general["individual"]
        if data_type in individual_data and individual_data[data_type]:
            respondent_data = process_nested_fields(individual_data[data_type])
            
            # แก้ไขชื่อให้ถูกต้อง
            if data_type == "corporate":
                if "companyName" in respondent_data and "name" not in respondent_data:
                    respondent_data["name"] = respondent_data["companyName"]
            elif data_type == "government":
                if "agencyName" in respondent_data and "name" not in respondent_data:
                    respondent_data["name"] = respondent_data["agencyName"]
    
    return respondent_data

def check_nested_respondent_type(individual_data: Dict) -> Dict:
    """ตรวจสอบประเภทผู้ถูกร้องจากข้อมูล individual ที่อาจมี nested structure"""
    respondent_data = {}
    respondent_type = RespondentType.INDIVIDUAL
    
    if not isinstance(individual_data, dict):
        return {"data": respondent_data, "type": respondent_type}
    
    # ตรวจสอบ nested structure ตามลำดับความสำคัญ
    if "government" in individual_data and isinstance(individual_data["government"], dict) and individual_data["government"]:
        respondent_type = RespondentType.GOVERNMENT
        respondent_data = process_nested_fields(individual_data["government"])
        if "agencyName" in respondent_data and "name" not in respondent_data:
            respondent_data["name"] = respondent_data["agencyName"]
    
    elif "corporate" in individual_data and isinstance(individual_data["corporate"], dict) and individual_data["corporate"]:
        respondent_type = RespondentType.CORPORATE
        respondent_data = process_nested_fields(individual_data["corporate"])
        if "companyName" in respondent_data and "name" not in respondent_data:
            respondent_data["name"] = respondent_data["companyName"]
    
    else:
        # ใช้ข้อมูลทั้งหมดเป็น individual
        respondent_type = RespondentType.INDIVIDUAL
        respondent_data = process_nested_fields(individual_data)
    
    return {
        "data": respondent_data,
        "type": respondent_type
    }

def convert_flat_to_structured(flat_data: Dict[str, Any], root_complaint_type: str) -> Dict[str, Any]:
    """แปลงข้อมูลจากรูปแบบ flat เป็น structured - ปรับปรุงการกำหนดประเภท"""
    structured_data = {
        "step1": {"general": {}},
        "step2": {"general": {}},
        "step3": {
            "general": {
                "subject": flat_data.get("subject", ""),
                "description": flat_data.get("description", ""),
                "complaintType": flat_data.get("complaintType", flat_data.get("complaint_type", "")),
                "incidentDate": flat_data.get("incident_date", None),
                "attachment": flat_data.get("attachments", [])
            }
        },
        "step4": {
            "general": {"accepted": flat_data.get("accepted", True)}
        }
    }
    
    # ✅ ปรับปรุงการจัดการข้อมูลผู้ร้องและผู้ถูกร้อง
    handle_complainant_data_structured(structured_data, flat_data)
    handle_respondent_data_structured(structured_data, flat_data)
    
    if root_complaint_type:
        structured_data["complaintType"] = root_complaint_type
        structured_data["step3"]["general"]["complaintType"] = root_complaint_type
        
    return structured_data

def handle_complainant_data_structured(structured_data: Dict, flat_data: Dict):
    """จัดการข้อมูลผู้ร้องเรียน สำหรับ flat data - ปรับปรุงแล้ว"""
    complainant_type = flat_data.get("complainant_type", "individual")
    complainant_data_raw = flat_data.get("complainant_data", {})
    
    if complainant_type.lower() == "corporate":
        structured_data["step1"]["general"]["corporate"] = complainant_data_raw
        
        # ตรวจสอบผู้ลงนาม
        if "signer" in flat_data:
            structured_data["step1"]["general"]["signer"] = flat_data["signer"]
        elif "signer" in complainant_data_raw:
            structured_data["step1"]["general"]["signer"] = complainant_data_raw["signer"]
    
    else:  # individual หรือ general
        structured_data["step1"]["general"]["general"] = complainant_data_raw
    
    # ตรวจสอบผู้รับมอบอำนาจ
    if "delegate_data" in flat_data and flat_data["delegate_data"]:
        structured_data["step1"]["general"]["delegate"] = flat_data["delegate_data"]
    elif "delegate" in complainant_data_raw:
        structured_data["step1"]["general"]["delegate"] = complainant_data_raw["delegate"]

def handle_respondent_data_structured(structured_data: Dict, flat_data: Dict):
    """จัดการข้อมูลผู้ถูกร้องเรียน สำหรับ flat data - ปรับปรุงแล้ว"""
    respondent_type = flat_data.get("respondent_type", "individual")
    respondent_data_raw = flat_data.get("respondent_data", {})
    
    # ✅ กำหนด activeType ให้ถูกต้อง
    if respondent_type.lower() == "corporate":
        structured_data["step2"]["general"]["activeType"] = "corporate"
        structured_data["step2"]["general"]["corporate"] = respondent_data_raw
    
    elif respondent_type.lower() == "government":
        structured_data["step2"]["general"]["activeType"] = "government"
        structured_data["step2"]["general"]["government"] = respondent_data_raw
    
    else:  # individual
        structured_data["step2"]["general"]["activeType"] = "individual"
        structured_data["step2"]["general"]["individual"] = respondent_data_raw

def handle_complainant_data(structured_data: Dict, flat_data: Dict):
    """จัดการข้อมูลผู้ร้องเรียน"""
    complainant_type = flat_data.get("complainant_type", "individual")
    
    if complainant_type.lower() in ["individual", "general"]:
        structured_data["step1"]["general"]["activeType"] = "general" 
        structured_data["step1"]["general"]["general"] = flat_data.get("complainant_data", {}).get("general", {})
        
        if not structured_data["step1"]["general"]["general"] and isinstance(flat_data.get("complainant_data", {}), dict):
            structured_data["step1"]["general"]["general"] = flat_data.get("complainant_data", {})
        
    elif complainant_type.lower() == "corporate":
        structured_data["step1"]["general"]["activeType"] = "corporate"
        structured_data["step1"]["general"]["corporate"] = flat_data.get("complainant_data", {}).get("corporate", {})
        
        if not structured_data["step1"]["general"]["corporate"] and isinstance(flat_data.get("complainant_data", {}), dict):
            structured_data["step1"]["general"]["corporate"] = flat_data.get("complainant_data", {})
        
        if "signer" in flat_data:
            structured_data["step1"]["general"]["signer"] = flat_data.get("signer", {})
        elif "signer" in flat_data.get("complainant_data", {}):
            structured_data["step1"]["general"]["signer"] = flat_data.get("complainant_data", {}).get("signer", {})
    
    if "delegate_data" in flat_data:
        structured_data["step1"]["general"]["delegate"] = flat_data.get("delegate_data", {})
    elif "delegate" in flat_data.get("complainant_data", {}):
        structured_data["step1"]["general"]["delegate"] = flat_data.get("complainant_data", {}).get("delegate", {})

def handle_respondent_data(structured_data: Dict, flat_data: Dict):
    """จัดการข้อมูลผู้ถูกร้องเรียน"""
    respondent_type = flat_data.get("respondent_type", "individual")
    respondent_type_lower = respondent_type.lower() if isinstance(respondent_type, str) else "individual"
    respondent_data = flat_data.get("respondent_data", {})
    
    if "corporate" in respondent_data:
        structured_data["step2"]["general"]["activeType"] = "corporate"
        structured_data["step2"]["general"]["corporate"] = respondent_data
    elif "government" in respondent_data:
        structured_data["step2"]["general"]["activeType"] = "government"
        structured_data["step2"]["general"]["government"] = respondent_data
    else:
        structured_data["step2"]["general"]["activeType"] = respondent_type_lower
        structured_data["step2"]["general"][respondent_type_lower] = respondent_data

def extract_complaint_data(complaint_data: Dict, root_complaint_type: str) -> Dict:
    """สกัดข้อมูลที่จำเป็นจาก complaint_data - เพิ่ม debug"""
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
        step3_general = step3["general"]
        subject = step3_general.get("subject", "")
        description = step3_general.get("description", "")
        if not complaint_type:
            complaint_type = step3_general.get("complaintType", "")
        
        # ประมวลผลวันที่เกิดเหตุ
        incident_date_str = step3_general.get("incidentDate")
        if incident_date_str:
            try:
                incident_date = datetime.fromisoformat(incident_date_str.replace("Z", "+00:00"))
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

    # ✅ ตรวจสอบข้อมูลที่จำเป็น
    if not complainant_result.get("data"):
        raise ValueError("Complainant data is required")
    
    if not respondent_result.get("data"):
        raise ValueError("Respondent data is required")
    
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
    """ประมวลผลข้อมูลผู้ร้องเรียน - แก้ไขแล้ว"""
    complainant_data = {}
    complainant_type = ComplainantType.INDIVIDUAL
    delegate_data = None
    
    if "general" in step1:
        step1_general = step1["general"]
        
        # ✅ ตรวจสอบข้อมูลที่มีอยู่จริงก่อน แทนการพึ่ง activeType
        if "corporate" in step1_general and step1_general["corporate"]:
            complainant_type = ComplainantType.CORPORATE
            complainant_data = process_nested_fields(step1_general["corporate"])
            
            # ✅ ตรวจสอบ signer (ผู้ลงนาม) แยกต่างหาก
            if "signer" in step1_general and step1_general["signer"]:
                complainant_data["signer"] = process_nested_fields(step1_general["signer"])
        
        # ถ้าไม่มี corporate ลองดู general
        elif "general" in step1_general and step1_general["general"]:
            complainant_type = ComplainantType.INDIVIDUAL
            complainant_data = process_nested_fields(step1_general["general"])
        
        # ถ้าไม่มีทั้งคู่ ลองใช้ activeType
        else:
            active_type = step1_general.get("activeType", "general")
            
            if active_type == "corporate" and "corporate" in step1_general:
                complainant_type = ComplainantType.CORPORATE
                complainant_data = process_nested_fields(step1_general["corporate"])
            else:
                # ใช้ข้อมูลทั้งหมดใน step1_general เป็น individual data
                complainant_type = ComplainantType.INDIVIDUAL
                # ✅ ลบ activeType ออกก่อนประมวลผล
                filtered_data = {k: v for k, v in step1_general.items() if k not in ["activeType", "corporate", "general", "signer", "delegate"]}
                complainant_data = process_nested_fields(filtered_data)
        
        # ตรวจสอบข้อมูลผู้รับมอบอำนาจ
        if "delegate" in step1_general and step1_general["delegate"]:
            delegate_data = process_nested_fields(step1_general["delegate"])
    
    return {
        "data": complainant_data,
        "type": complainant_type,
        "delegate_data": delegate_data
    }

def process_respondent_data(step2: Dict) -> Dict:
    """ประมวลผลข้อมูลผู้ถูกร้องเรียน - แก้ไขแล้ว"""
    respondent_data = {}
    respondent_type = RespondentType.INDIVIDUAL
    
    if "general" not in step2:
        return {"data": respondent_data, "type": respondent_type}
        
    step2_general = step2["general"]
    
    # ✅ ตรวจสอบข้อมูลที่มีอยู่จริงก่อน
    if "government" in step2_general and step2_general["government"]:
        respondent_type = RespondentType.GOVERNMENT
        respondent_data = process_nested_fields(step2_general["government"])
        
        # ✅ แก้ไขชื่อให้ถูกต้อง
        if "agencyName" in respondent_data and "name" not in respondent_data:
            respondent_data["name"] = respondent_data["agencyName"]
    
    # ตรวจสอบ corporate
    elif "corporate" in step2_general and step2_general["corporate"]:
        respondent_type = RespondentType.CORPORATE
        respondent_data = process_nested_fields(step2_general["corporate"])
        
        if "companyName" in respondent_data and "name" not in respondent_data:
            respondent_data["name"] = respondent_data["companyName"]
    
    # ตรวจสอบ individual
    elif "individual" in step2_general and step2_general["individual"]:
        respondent_type = RespondentType.INDIVIDUAL
        respondent_data = process_nested_fields(step2_general["individual"])
    
    # ใช้ activeType เป็นตัวกำหนด (fallback)
    else:
        active_type = step2_general.get("activeType", "individual")
        
        if active_type == "government" and "government" in step2_general:
            respondent_type = RespondentType.GOVERNMENT
            respondent_data = process_nested_fields(step2_general["government"])
            if "agencyName" in respondent_data and "name" not in respondent_data:
                respondent_data["name"] = respondent_data["agencyName"]
        
        elif active_type == "corporate" and "corporate" in step2_general:
            respondent_type = RespondentType.CORPORATE
            respondent_data = process_nested_fields(step2_general["corporate"])
            if "companyName" in respondent_data and "name" not in respondent_data:
                respondent_data["name"] = respondent_data["companyName"]
        
        elif active_type == "individual" and "individual" in step2_general:
            respondent_type = RespondentType.INDIVIDUAL
            respondent_data = process_nested_fields(step2_general["individual"])
        
        # ถ้าไม่มี nested structure ลองใช้ข้อมูลจาก step2_general โดยตรง
        else:
            if active_type == "government":
                respondent_type = RespondentType.GOVERNMENT
            elif active_type == "corporate":
                respondent_type = RespondentType.CORPORATE
            else:
                respondent_type = RespondentType.INDIVIDUAL
            
            # ใช้ข้อมูลที่เหลือใน step2_general (ลบ activeType ออก)
            filtered_data = {k: v for k, v in step2_general.items() if k not in ["activeType"]}
            respondent_data = process_nested_fields(filtered_data)

    return {
        "data": respondent_data,
        "type": respondent_type
    }

def is_unknown_respondent(individual_data: Dict) -> bool:
    """ตรวจสอบว่าเป็นกรณีไม่ทราบผู้ถูกร้องเรียนที่แท้จริงหรือไม่"""
    if not isinstance(individual_data, dict):
        return False
    
    name = individual_data.get("name", "").lower()
    description = individual_data.get("description", "").lower()
    
    # ✅ คำสำคัญที่บ่งบอกว่าไม่ทราบผู้ถูกร้องเรียนที่แท้จริง
    unknown_keywords = [
        "ไม่ทราบ", "ไม่รู้", "ไม่แน่ใจ", "บุคคลไม่ทราบชื่อ",
        "ร้านค้าออนไลน์", "เฟซบุ๊ก", "facebook", "fb",
        "ไลน์", "line", "instagram", "ig", "shopee", "lazada",
        "เพจ", "page", "แฟนเพจ", "ร้านออนไลน์",
        "ไม่ทราบที่อยู่", "ไม่ทราบเจ้าของ", "ไม่ทราบตัวตน"
    ]
    
    # ตรวจสอบในชื่อ
    for keyword in unknown_keywords:
        if keyword in name:
            return True
    
    # ตรวจสอบในคำอธิบาย
    for keyword in unknown_keywords:
        if keyword in description:
            return True
    
    # ✅ ตรวจสอบกรณีที่มีข้อมูลแต่ไม่มี ID Card หรือข้อมูลระบุตัวตนชัดเจน
    has_id_card = bool(individual_data.get("idCard", "").strip())
    has_address = bool(individual_data.get("address", "").strip())
    
    # ถ้าไม่มี ID Card และไม่มีที่อยู่ชัดเจน = น่าจะเป็นกรณีไม่ทราบตัวตน
    if not has_id_card and not has_address:
        return True
    
    return False

def process_unknown_respondent(individual_data: Dict) -> Dict:
    """ประมวลผลข้อมูลผู้ถูกร้องเรียนที่ไม่ทราบตัวตน"""
    processed_data = process_nested_fields(individual_data)
    
   #flag พิเศษ
    processed_data["respondent_category"] = "UNKNOWN_IDENTITY"
    
    # ✅ ปรับปรุงชื่อให้ชัดเจนขึ้น
    if "name" in processed_data:
        original_name = processed_data["name"]
        if not any(keyword in original_name.lower() for keyword in ["ไม่ทราบ", "บุคคลไม่ทราบชื่อ"]):
            processed_data["name"] = f"{original_name} (ไม่ทราบตัวตนที่แท้จริง)"
    
  #ข้อมูลที่เป็นประโยชน์
    if "other" in processed_data or "description" in processed_data:
        additional_info = processed_data.get("other", "") or processed_data.get("description", "")
        if additional_info:
            processed_data["additional_contact_info"] = additional_info
    
    return processed_data

def convert_to_db_json(data):
    """Convert Python dictionary to proper JSON format for database storage."""
    if data is None:
        return None
    
    if isinstance(data, str):
        return data
        
    return json.dumps(data)

# Simple in-memory cache สำหรับ sequence
import threading
_complaint_sequence_cache = {}
_cache_lock = threading.Lock()

def get_cache_info() -> dict:
    """ดูข้อมูล cache - ง่ายๆ"""
    with _cache_lock:
        return dict(_complaint_sequence_cache)

def sync_cache_with_database(db: Session, year: Optional[int] = None) -> dict:
    """Sync cache กับ database - สำหรับกรณีฉุกเฉิน"""
    global _complaint_sequence_cache
    
    from datetime import timezone, timedelta
    
    bangkok_tz = timezone(timedelta(hours=7))
    current_year = year if year else datetime.now(bangkok_tz).year
    
    with _cache_lock:
        year_start = datetime(current_year, 1, 1, 0, 0, 0)
        year_end = datetime(current_year, 12, 31, 23, 59, 59)
        
        actual_count = db.query(Complaint).filter(
            Complaint.created_at.between(year_start, year_end)
        ).count()
        
        old_count = _complaint_sequence_cache.get(current_year, 0)
        _complaint_sequence_cache[current_year] = actual_count
        
        logger.info(f"Cache synced for year {current_year}: {old_count} -> {actual_count}")
        
        return {
            "year": current_year,
            "old_count": old_count,
            "new_count": actual_count,
            "synced_at": datetime.now().isoformat()
        }

def clear_cache() -> dict:
    """เคลียร์ cache ทั้งหมด - สำหรับกรณีฉุกเฉิน"""
    global _complaint_sequence_cache
    
    with _cache_lock:
        old_cache = dict(_complaint_sequence_cache)
        _complaint_sequence_cache.clear()
        
        logger.warning("All cache cleared!")
        
        return {
            "message": "Cache cleared successfully",
            "old_cache": old_cache,
            "cleared_at": datetime.now().isoformat()
        }

def test_complaint_number_generation(db: Session, count: int = 10) -> dict:
    """ทดสอบการสร้างเลขที่ข้อร้องเรียน - สำหรับ testing"""
    results = []
    errors = []
    
    for i in range(count):
        try:
            complaint_number = generate_complaint_number(db)
            results.append({
                "iteration": i + 1,
                "complaint_number": complaint_number,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            errors.append({
                "iteration": i + 1,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
    
    return {
        "total_attempts": count,
        "successful": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
        "cache_status": get_cache_info()
    }

def generate_complaint_number(db: Session) -> str:
    """สร้างเลขที่ข้อร้องเรียนแบบอัตโนมัติ - ใช้ cache เพื่อประสิทธิภาพ"""
    global _complaint_sequence_cache
    
    from datetime import timezone, timedelta
    from sqlalchemy.exc import IntegrityError
    import time
    
    # สร้าง timezone สำหรับไทย (UTC+7)
    bangkok_tz = timezone(timedelta(hours=7))
    
    # ใช้เวลาไทย
    now_bangkok = datetime.now(bangkok_tz)
    current_year = now_bangkok.year
    
    # แปลงเป็นปีพุทธศักราช (ค.ศ. + 543)
    buddhist_year = current_year + 543
    
    # สร้าง date_part ในรูปแบบ พศ-เดือน-วัน
    date_part = f"{buddhist_year}{now_bangkok.strftime('%m%d')}"
    
    max_attempts = 5  # ลองสูงสุด 5 ครั้ง
    attempt = 0
    
    while attempt < max_attempts:
        try:
            # Thread-safe cache handling
            with _cache_lock:
                # ตรวจสอบ cache สำหรับปีนี้
                if current_year not in _complaint_sequence_cache:
                    # ถ้าไม่มีใน cache ให้นับจาก database
                    year_start = datetime(current_year, 1, 1, 0, 0, 0)
                    year_end = datetime(current_year, 12, 31, 23, 59, 59)
                    
                    year_count = db.query(Complaint).filter(
                        Complaint.created_at.between(year_start, year_end)
                    ).count()
                    
                    _complaint_sequence_cache[current_year] = year_count
                    logger.info(f"Cache initialized for year {current_year}: {year_count}")
                
                # เพิ่ม sequence
                _complaint_sequence_cache[current_year] += 1
                sequence_number = _complaint_sequence_cache[current_year]
            
            sequence = str(sequence_number).zfill(5)
            complaint_number = f"MOF-{date_part}-{sequence}"
            
            # ตรวจสอบว่าเลขนี้มีในระบบหรือไม่ (double check)
            existing = db.query(Complaint).filter(
                Complaint.complaint_number == complaint_number
            ).first()
            
            if existing:
                # ถ้าเลขซ้ำ ให้ sync cache ใหม่และลองอีกครั้ง
                logger.warning(f"Duplicate complaint number detected: {complaint_number}, re-syncing cache (attempt {attempt + 1})")
                with _cache_lock:
                    # Re-sync cache จาก database
                    year_start = datetime(current_year, 1, 1, 0, 0, 0)
                    year_end = datetime(current_year, 12, 31, 23, 59, 59)
                    
                    actual_count = db.query(Complaint).filter(
                        Complaint.created_at.between(year_start, year_end)
                    ).count()
                    
                    _complaint_sequence_cache[current_year] = actual_count
                    logger.info(f"Cache re-synced for year {current_year}: {actual_count}")
                
                attempt += 1
                time.sleep(0.1 * attempt)  # รอนานขึ้นเรื่อยๆ
                continue
            
            # ถ้าไม่ซ้ำ return เลย
            logger.info(f"Generated complaint number: {complaint_number}")
            return complaint_number
            
        except IntegrityError as e:
            # ถ้าเกิด database constraint error (เลขซ้ำที่ database level)
            logger.warning(f"Database integrity error on attempt {attempt + 1}: {str(e)}")
            db.rollback()
            
            # Sync cache ใหม่
            with _cache_lock:
                year_start = datetime(current_year, 1, 1, 0, 0, 0)
                year_end = datetime(current_year, 12, 31, 23, 59, 59)
                
                actual_count = db.query(Complaint).filter(
                    Complaint.created_at.between(year_start, year_end)
                ).count()
                
                _complaint_sequence_cache[current_year] = actual_count
                logger.info(f"Cache re-synced after integrity error for year {current_year}: {actual_count}")
            
            attempt += 1
            time.sleep(0.1 * attempt)  # Exponential backoff
            continue
            
        except Exception as e:
            logger.error(f"Unexpected error generating complaint number: {str(e)}")
            attempt += 1
            time.sleep(0.1 * attempt)
            continue
    
    # ถ้าลองหมดแล้วยังไม่ได้ ใช้ timestamp + random เป็น fallback
    logger.error("Failed to generate unique complaint number after max attempts, using fallback method")
    
    # ใช้ microsecond + random เป็น fallback เพื่อป้องกันเลขซ้ำ
    import random
    timestamp_ms = int(time.time() * 1000000) % 100000  # เอา 5 หลักสุดท้าย
    random_suffix = random.randint(10, 99)  # random 2 หลัก
    fallback_sequence = f"{timestamp_ms:05d}{random_suffix:02d}"[-5:]  # เอาแค่ 5 หลักสุดท้าย
    
    fallback_number = f"MOF-{date_part}-{fallback_sequence}"
    logger.warning(f"Using fallback complaint number: {fallback_number}")
    
    return fallback_number

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

def get_complaints(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    complaint_type: Optional[str] = None,
    complaint_subtype: Optional[str] = None,  # เพิ่ม filter
    assignee: Optional[str] = None,
    location: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    complainant_name: Optional[str] = None,   # เพิ่ม filter
):
    query = db.query(Complaint)
    
    # Filter by status
    if status:
        query = query.filter(Complaint.status == status)
    
    # Filter by complaint type
    if complaint_type:
        query = query.filter(Complaint.complaint_type.ilike(f"%{complaint_type}%"))
    if complaint_subtype:
        query = query.filter(Complaint.complaint_subtype_id.isnot(None))
        # join กับ ComplaintSubType เพื่อค้นหาด้วยชื่อ
        from models.comp_complaint_types import ComplaintSubType
        query = query.join(ComplaintSubType, Complaint.complaint_subtype_id == ComplaintSubType.id)
        query = query.filter(ComplaintSubType.name.ilike(f"%{complaint_subtype}%"))
    if assignee:
        query = query.filter(
            (Complaint.assigned_to.ilike(f"%{assignee}%")) |
            (Complaint.assigned_officer_id.isnot(None))
        )
    if location:
        query = query.filter(
            (Complaint.incident_province.ilike(f"%{location}%")) |
            (Complaint.incident_district.ilike(f"%{location}%")) |
            (Complaint.incident_subdistrict.ilike(f"%{location}%"))
        )
    if urgency:
        query = query.filter(Complaint.urgency_level == urgency)

    # ปรับ search ให้ค้นหา complainant_name, complaint_type, complaint_subtype
    if search:
        from models.comp_complaint_types import ComplaintSubType
        # join กับ ComplaintSubType เพื่อค้นหาด้วยชื่อ
        query = query.outerjoin(ComplaintSubType, Complaint.complaint_subtype_id == ComplaintSubType.id)
        query = query.filter(
            or_(
                Complaint.complaint_number.ilike(f"%{search}%"),
                Complaint.subject.ilike(f"%{search}%"),
                Complaint.description.ilike(f"%{search}%"),
                Complaint.complaint_type.ilike(f"%{search}%"),
                ComplaintSubType.name.ilike(f"%{search}%"),
                Complaint.complainant_data.ilike(f"%{search}%")  # ค้นหาใน JSON string
            )
        )
    # filter ด้วย complainant_name (LIKE ใน JSON)
    if complainant_name:
        query = query.filter(Complaint.complainant_data.ilike(f"%{complainant_name}%"))

    total_count = query.count()
    query = query.order_by(Complaint.created_at.desc())
    complaints = query.offset(skip).limit(limit).all()

    result = []
    for complaint in complaints:
        try:
            list_item = create_complaint_list_item(complaint, db)
            # เพิ่ม complaint_subtype ใน response
            complaint_subtype_name = ""
            if db and hasattr(complaint, "complaint_subtype_id") and complaint.complaint_subtype_id:
                from models.comp_complaint_types import ComplaintSubType
                subtype = db.query(ComplaintSubType).filter(ComplaintSubType.id == complaint.complaint_subtype_id).first()
                if subtype:
                    complaint_subtype_name = subtype.name
            
            list_item_dict = list_item.__dict__
            list_item_dict["complaint_subtype"] = complaint_subtype_name
            
            # ✅ เพิ่ม is_master key เพื่อบอกสถานะ parent/child (คำนวณง่ายๆ)
            list_item_dict["is_master"] = complaint.parent_complaint_id is None
            
            result.append(list_item_dict)
        except Exception as e:
            if DEBUG_MODE:
                print(f"Error creating list item: {str(e)}")
            continue

    filters = get_filter_options(db)
    return {
        "items": result,
        "pagination": {
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": total_count > (skip + limit)
        },
        "filters": filters
    }

def get_filter_options(db: Session) -> Dict:
    """ดึงตัวเลือกสำหรับ filter"""
    try:
        # ดึงสถานะที่มีอยู่
        available_statuses = [
            {"value": "SUBMITTED", "label": "รับเรื่อง"},
            {"value": "SENT_TO_AGENCY", "label": "ส่งหน่วยงาน"},
            {"value": "IN_PROCESS", "label": "กำลังดำเนินการ"},
            {"value": "IN_REVIEW", "label": "อยู่ระหว่างพิจารณา"},
            {"value": "TRACKING", "label": "ติดตามผล"},
            {"value": "REVIEWED", "label": "แจ้งผลการพิจารณา"},
            {"value": "COMPLETED", "label": "เสร็จสิ้น"}
        ]
        
        # ดึงประเภทเรื่องร้องเรียนที่มีอยู่
        complaint_types = db.query(ComplaintType).filter(ComplaintType.is_active == True).all()
        available_types = [
            {"value": ctype.name, "label": ctype.name} 
            for ctype in complaint_types
        ]
        
        # ตัวเลือกความเร่งด่วน
        available_urgency = [
            {"value": "LOW", "label": "ต่ำ"},
            {"value": "MEDIUM", "label": "กลาง"},
            {"value": "HIGH", "label": "สูง"},
            {"value": "CRITICAL", "label": "วิกฤต"}
        ]
        
        # ตัวเลือกความรุนแรง
        available_severity = [
            {"value": "LOW", "label": "ต่ำ"},
            {"value": "MEDIUM", "label": "กลาง"},
            {"value": "HIGH", "label": "สูง"},
            {"value": "CRITICAL", "label": "วิกฤต"}
        ]
        
        return {
            "available_statuses": available_statuses,
            "available_types": available_types,
            "available_urgency": available_urgency,
            "available_severity": available_severity
        }
    except Exception as e:
        if DEBUG_MODE:
            print(f"Error getting filter options: {str(e)}")
        return {
            "available_statuses": [],
            "available_types": [],
            "available_urgency": [],
            "available_severity": []
        }

def create_complaint_list_item(complaint: Complaint, db: Session = None) -> ComplaintListItem:
    """สร้างข้อมูลแบบย่อสำหรับแสดงในรายการ"""
    try:
        complaint_subtype_name = ""
        if db and hasattr(complaint, "complaint_subtype_id") and complaint.complaint_subtype_id:
            from models.comp_complaint_types import ComplaintSubType
            subtype = db.query(ComplaintSubType).filter(ComplaintSubType.id == complaint.complaint_subtype_id).first()
            if subtype:
                complaint_subtype_name = subtype.name

        return ComplaintListItem(
            id=complaint.id,
            complaint_number=complaint.complaint_number,
            subject=complaint.subject,
            complaint_type=get_thai_complaint_type(complaint.complaint_type),
            status=get_thai_status(complaint.status),
            created_at=complaint.created_at,
            complainant_name=get_display_complainant_name(ensure_dict(complaint.complainant_data), ensure_dict(complaint.delegate_data) if complaint.delegate_data else None),
            respondent_name=get_display_respondent_name(complaint.respondent_type, ensure_dict(complaint.respondent_data)),
            incident_location=get_display_incident_location(complaint),
            assigned_to=get_display_assigned_info(complaint, db),
            assigned_remark=complaint.assigned_remark or "",
            urgency_level=complaint.urgency_level.lower() if complaint.urgency_level else "low",
            severity_level=complaint.severity_level.lower() if complaint.severity_level else "low",
            complaint_subtype=complaint_subtype_name
        )
        
    except Exception as e:
        return ComplaintListItem(
            id=complaint.id,
            complaint_number=complaint.complaint_number or "",
            subject=complaint.subject or "",
            complaint_type=complaint.complaint_type or "",
            status=get_thai_status(complaint.status),
            created_at=complaint.created_at,
            complainant_name="ข้อมูลไม่สมบูรณ์",
            respondent_name="ข้อมูลไม่สมบูรณ์",
            incident_location="",
            assigned_to="",
            assigned_remark=complaint.assigned_remark or "",
            urgency_level="low",
            severity_level="low"
        )

def get_display_complainant_name(complainant_data: Dict, delegate_data: Dict = None) -> str:
    """แสดงชื่อผู้ร้องเรียน - รวม delegate และ signer ถ้ามี"""
    
    # ตรวจสอบว่าเป็นนิติบุคคลหรือไม่
    company_name = complainant_data.get("name", "")
    
    # ตรวจสอบหลายเงื่อนไขสำหรับนิติบุคคล
    is_corporate = (
        complainant_data.get("companyName") or
        complainant_data.get("taxId") or
        complainant_data.get("registrationNumber") or
        complainant_data.get("idCard", "").startswith(("0", "1", "2", "3")) or
        any(keyword in company_name for keyword in ["บริษัท", "จำกัด", "มหาชน", "ห้างหุ้นส่วน"])
    )
    
    # กรณีนิติบุคคล
    if is_corporate:
        display_name = company_name
        
        # ✅ ตรวจสอบ signer (ผู้มีอำนาจลงนาม)
        signer_data = complainant_data.get("signer")
        if signer_data and isinstance(signer_data, dict):
            signer_name = signer_data.get("name", "")
            signer_position = signer_data.get("position", "")
            
            if signer_name:
                if signer_position:
                    display_name += f" (ผู้ลงนาม: {signer_name}, {signer_position})"
                else:
                    display_name += f" (ผู้ลงนาม: {signer_name})"
        
        # ตรวจสอบ delegate สำหรับนิติบุคคล
        if delegate_data and isinstance(delegate_data, dict):
            delegate_name = delegate_data.get("name", "")
            if delegate_name and delegate_name.strip():
                display_name += f" [ผู้รับมอบอำนาจ: {delegate_name}]"
        
        return display_name
    
    # กรณีบุคคลธรรมดา
    else:
        primary_name = company_name
        
        # ถ้ามี delegate ให้แสดงทั้งคู่
        if delegate_data and isinstance(delegate_data, dict):
            delegate_name = delegate_data.get("name", "")
            if delegate_name and delegate_name.strip():
                return f"{primary_name} (ผู้รับมอบอำนาจ: {delegate_name})"
        
        return primary_name

def get_display_respondent_name(respondent_type: RespondentType, respondent_data: Dict) -> str:
    """แสดงชื่อผู้ถูกร้องเรียน"""
    if respondent_type == RespondentType.GOVERNMENT:
        agency_name = respondent_data.get("agencyName", "")
        full_name = respondent_data.get("fullName", "")
        return full_name if full_name else agency_name
    
    elif respondent_type == RespondentType.CORPORATE:
        return respondent_data.get("name", respondent_data.get("companyName", ""))
    
    elif respondent_type == RespondentType.INDIVIDUAL:
        return respondent_data.get("name", "")
    
    else:
        return respondent_data.get("name", "บุคคลไม่ทราบชื่อ")

def get_display_incident_location(complaint: Complaint) -> str:
    """แสดงสถานที่เกิดเหตุ"""
    location_parts = []
    
    if complaint.incident_province:
        location_parts.append(complaint.incident_province)
    if complaint.incident_district:
        location_parts.append(complaint.incident_district)
    if complaint.incident_subdistrict:
        location_parts.append(complaint.incident_subdistrict)
    
    return " > ".join(location_parts) if location_parts else ""

def get_display_assigned_info(complaint: Complaint, db: Session = None) -> str:
    """แสดงข้อมูลผู้รับผิดชอบ"""
    if complaint.assigned_to:
        return complaint.assigned_to
    elif complaint.assigned_officer_id and db:
        # ถ้ามีการกำหนด officer โดยเฉพาะ
        return "เจ้าหน้าที่ที่รับผิดชอบ"
    else:
        return ""

def get_thai_complaint_type(complaint_type: str) -> str:
    """แปลงประเภทเรื่องร้องเรียนเป็นภาษาไทย"""
    type_mapping = {
        "FRAUD": "ฉ้อโกง",
        "CORRUPTION": "ทุจริต", 
        "SERVICE": "บริการ",
        "OTHER": "อื่นๆ"
    }
    return type_mapping.get(complaint_type, complaint_type)

def get_thai_status(status: str) -> str:
    """แปลงสถานะเป็นภาษาไทย"""
    status_mapping = {
        "SUBMITTED": "รับเรื่อง",
        "submitted": "รับเรื่อง", #กรณี lowercase
        "SENT_TO_AGENCY": "ส่งหน่วยงาน", 
        "IN_PROCESS": "กำลังดำเนินการ",
        "IN_REVIEW": "อยู่ระหว่างพิจารณา",
        "TRACKING": "ติดตามผล",
        "REVIEWED": "แจ้งผลการพิจารณา",
        "COMPLETED": "เสร็จสิ้น"
    }
    return status_mapping.get(status.upper() if status else "", status)  # ✅ ใช้ upper()

def ensure_dict(data: Any) -> Dict:
    """แปลงข้อมูลให้เป็น dict"""
    if data is None:
        return {}
    if isinstance(data, dict):
        return data
    if isinstance(data, str):
        try:
            return json.loads(data)
        except:
            return {}
    return {}

def get_complaint_attachments(complaint: Complaint) -> List[Dict]:
    """ดึงรายการไฟล์แนบของข้อร้องเรียน"""
    attachment_list = []
    if hasattr(complaint, 'attachments') and complaint.attachments:
        for attachment in complaint.attachments:
            attachment_list.append({
                "fileName": attachment.file_name,
                "fileSize": attachment.file_size,
                "fileUrl": attachment.file_url,
                "fileType": attachment.file_type
            })
    return attachment_list

def get_complaint_status_history(db: Session, complaint_id: UUID) -> List[Dict]:
    """ดึงประวัติสถานะของข้อร้องเรียน - เรียงใหม่ล่าสุดก่อน"""
    status_history = []

    history_records = db.query(ComplaintStatusHistory).filter(
        ComplaintStatusHistory.complaint_id == complaint_id
    ).order_by(ComplaintStatusHistory.changed_at.desc()).all()
    
    for history in history_records:
        status_history.append({
            "status": history.status,
            "status_thai": get_thai_status(history.status),
            "notes": history.notes,
            "changed_at": history.changed_at,
            "changed_by": history.changed_by
        })
    return status_history

def reconstruct_complaint_data(complaint: Complaint, attachment_list: List, status_history: List) -> Dict:
    """สร้างโครงสร้างข้อมูลข้อร้องเรียนที่สมบูรณ์"""
    # สร้างข้อมูลผู้ร้องเรียน step1
    step1 = {
        "general": {
            "activeType": "general" if complaint.complainant_type == ComplainantType.INDIVIDUAL else "corporate"
        }
    }
    
    if complaint.complainant_type == ComplainantType.INDIVIDUAL:
        step1["general"]["general"] = complaint.complainant_data
    else:
        step1["general"]["corporate"] = complaint.complainant_data
        if isinstance(complaint.complainant_data, dict) and "signer" in complaint.complainant_data:
            step1["general"]["signer"] = complaint.complainant_data["signer"]
            if "signer" in step1["general"]["corporate"]:
                del step1["general"]["corporate"]["signer"]
    
    if complaint.delegate_data:
        step1["general"]["delegate"] = complaint.delegate_data
    
    # สร้างข้อมูลผู้ถูกร้องเรียน step2
    respondent_type_key = "government"
    if complaint.respondent_type == RespondentType.INDIVIDUAL:
        respondent_type_key = "individual"
    elif complaint.respondent_type == RespondentType.CORPORATE:
        respondent_type_key = "corporate"
    
    step2 = {
        "general": {
            "activeType": respondent_type_key,
            respondent_type_key: complaint.respondent_data
        }
    }
    
    # สร้างข้อมูลรายละเอียดร้องเรียน step3
    step3 = {
        "general": {
            "subject": complaint.subject,
            "description": complaint.description,
            "complaintType": complaint.complaint_type,
            "incidentDate": complaint.incident_date.isoformat() if complaint.incident_date else None,
            "attachment": attachment_list
        }
    }
    
    # สร้างข้อมูลการยอมรับเงื่อนไข step4
    step4 = {
        "general": {
            "accepted": complaint.terms_accepted
        }
    }
    
    return {
        "id": complaint.id,
        "complaint_number": complaint.complaint_number,
        "step1": step1,
        "step2": step2,
        "step3": step3,
        "step4": step4,
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
    
    complaint.status = new_status
    complaint.updated_at = datetime.now()
    
    if new_status == ComplaintStatus.COMPLETED:
        complaint.resolved_date = datetime.now()
    
    create_status_history(db, complaint_id, new_status, notes, user_id)
    
    try:
        old_status = complaint.status
        if should_notify_status_change(old_status, new_status):
            # ดึงข้อมูลผู้ร้องเรียน
            complainant_data = ensure_dict(complaint.complainant_data)
            delegate_data = ensure_dict(complaint.delegate_data) if complaint.delegate_data else None
            complainant_name = get_complainant_display_name_for_notification(complainant_data, delegate_data)
            
            # สร้าง notification message
            status_message = create_status_change_notification_message(
                complaint, old_status, new_status, complainant_name, notes
            )
            
            # กำหนด role ที่จะได้รับ notification ตามสถานะ
            target_roles = get_notification_roles_by_status(new_status)
            
            # สร้าง notification
            notification_data = NotificationCreate(
                title="อัปเดตสถานะเรื่องร้องเรียน",
                message=status_message,
                role_seeking_group=target_roles,
                redirect_url=f"/complaints/{complaint.id}"
            )
            
            notification_controller.create_notification(db, notification_data)
            logger.info(f"Status change notification created for complaint: {complaint.complaint_number}")
            
    except Exception as e:
        logger.error(f"Error creating status change notification: {str(e)}")
    
    db.commit()
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

def get_user_complaints(db: Session, user_id: UUID, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    """ดึงรายการข้อร้องเรียนของผู้ใช้เฉพาะราย"""
    try:
        # ตรวจสอบ role ของผู้ใช้
        user_roles = get_user_roles(db, user_id)
        is_admin = any(role.name == "admin" for role in user_roles)
        
        # สร้าง query พื้นฐาน
        query = db.query(Complaint)
        
        # ถ้าไม่ใช่ admin ให้กรองเฉพาะเรื่องที่เกี่ยวข้องกับผู้ใช้
        if not is_admin:
            query = query.filter(
                or_(
                    Complaint.created_by == user_id,           # เรื่องที่ตนเองสร้าง
                    Complaint.assigned_officer_id == user_id   # เรื่องที่ได้รับมอบหมาย
                )
            )
        
        # กรองตาม status ถ้ามี
        if status:
            query = query.filter(Complaint.status == status)
        
        total_count = query.count()
        query = query.order_by(Complaint.created_at.desc())
        complaints = query.offset(skip).limit(limit).all()
        
        result = []
        for complaint in complaints:
            try:
                list_item = create_complaint_list_item(complaint, db)
                result.append(list_item.__dict__)
            except Exception as e:
                if DEBUG_MODE:
                    print(f"Error creating list item for complaint {complaint.id}: {str(e)}")
                continue
        
        return {
            "items": result,
            "pagination": {
                "total": total_count,
                "skip": skip,
                "limit": limit,
                "has_more": total_count > (skip + limit)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting user complaints: {str(e)}")
        return {
            "items": [],
            "pagination": {"total": 0, "skip": skip, "limit": limit, "has_more": False}
        }

def map_complaint_type(db: Session, complaint_type_str: str) -> str:
    """แมปประเภทเรื่องร้องเรียนจากข้อความที่รับเข้ามาเป็นประเภทที่มีในฐานข้อมูล"""
    if not complaint_type_str:
        return "อื่นๆ"
        
    direct_match = db.query(ComplaintType).filter(
        ComplaintType.name == complaint_type_str,
        ComplaintType.is_active == True
    ).first()
    
    if direct_match:
        return complaint_type_str
    
    if any(word in complaint_type_str for word in ["ฉ้อโกง", "หลอกลวง", "ต้มตุ๋น"]):
        return "ฉ้อโกง"
        
    if any(word in complaint_type_str for word in ["ทุจริต", "คอร์รัปชั่น", "ผลประโยชน์"]):
        return "ทุจริต"
        
    if any(word in complaint_type_str for word in ["บริการ", "ล่าช้า"]):
        return "บริการ"
        
    if any(word in complaint_type_str for word in ["สินค้า", "ออนไลน์", "ซื้อขาย"]):
        return "สินค้าและบริการ"
    
    return "อื่นๆ"

def get_location_hierarchy_by_ids(db: Session, province_id: int = None, amphure_id: int = None, district_id: str = None) -> Dict:
    """ดึงข้อมูลลำดับชั้นทางภูมิศาสตร์ตาม ID ที่กำหนด"""
    result = {
        "province": None,
        "amphure": None,
        "district": None
    }
    
    if district_id:
        district = db.query(District).filter(District.id == district_id).first()
        if district:
            result["district"] = model_to_dict(district)
            amphure_id = district.amphure_id
    
    if amphure_id:
        amphure = db.query(Amphure).filter(Amphure.id == amphure_id).first()
        if amphure:
            result["amphure"] = model_to_dict(amphure)
            province_id = amphure.province_id
    
    if province_id:
        province = db.query(Province).filter(Province.id == province_id).first()
        if province:
            result["province"] = model_to_dict(province)
    
    return result

def get_or_create_location_ids(db: Session, location_data: Dict) -> Dict:
    """ดึงหรือสร้าง ID ของตำแหน่งทางภูมิศาสตร์ตามข้อมูลที่ได้รับ"""
    result = {}
    
    # ตรวจสอบข้อมูลจังหวัด
    province_name = location_data.get("province")
    if province_name:
        # ค้นหาจังหวัดจากชื่อ
        province = db.query(Province).filter(
            (Province.name_th == province_name) | 
            (Province.name_en == province_name)
        ).first()
        
        if province:
            result["province_id"] = province.id
            result["province_name"] = province.name_th
        
            # ตรวจสอบข้อมูลอำเภอ
            amphure_name = location_data.get("amphure")
            if amphure_name:
                # ค้นหาอำเภอจากชื่อและจังหวัด
                amphure = db.query(Amphure).filter(
                    ((Amphure.name_th == amphure_name) | (Amphure.name_en == amphure_name)) &
                    (Amphure.province_id == province.id)
                ).first()
                
                if amphure:
                    result["amphure_id"] = amphure.id
                    result["amphure_name"] = amphure.name_th
                
                    # ตรวจสอบข้อมูลตำบล
                    district_name = location_data.get("district")
                    if district_name:
                        # ค้นหาตำบลจากชื่อและอำเภอ
                        district = db.query(District).filter(
                            ((District.name_th == district_name) | (District.name_en == district_name)) &
                            (District.amphure_id == amphure.id)
                        ).first()
                        
                        if district:
                            result["district_id"] = district.id
                            result["district_name"] = district.name_th
    
    return result
def update_existing_geographic_data(db: Session, complaint_id: UUID = None) -> bool:
    """ปรับปรุงข้อมูลทางภูมิศาสตร์ในข้อร้องเรียนที่มีอยู่แล้ว"""
    try:
        query = db.query(Complaint)
        
        if complaint_id:
            query = query.filter(Complaint.id == complaint_id)
        
        complaints = query.all()
        update_count = 0
        
        for complaint in complaints:
            need_update = False
            
            # ตรวจสอบและปรับปรุงข้อมูลพื้นที่เกิดเหตุ
            if not complaint.incident_province_id and not complaint.incident_district_id and not complaint.incident_subdistrict_id:
                if complaint.full_complaint_data:
                    full_data = ensure_dict(complaint.full_complaint_data)
                    incident_location = extract_incident_location(full_data)
                    if incident_location:
                        verified_location = verify_geographic_data(db, incident_location)
                        if verified_location:
                            for key, value in verified_location.items():
                                setattr(complaint, key, value)
                            need_update = True
            
            # ซิงค์ชื่อกับ ID ที่มีอยู่
            if complaint.incident_province_id:
                province = db.query(Province).filter(Province.id == complaint.incident_province_id).first()
                if province and (complaint.incident_province != province.name_th):
                    complaint.incident_province = province.name_th
                    need_update = True
            
            if complaint.incident_district_id:
                amphure = db.query(Amphure).filter(Amphure.id == complaint.incident_district_id).first()
                if amphure and (complaint.incident_district != amphure.name_th):
                    complaint.incident_district = amphure.name_th
                    need_update = True
            
            if complaint.incident_subdistrict_id:
                district = db.query(District).filter(District.id == str(complaint.incident_subdistrict_id)).first()
                if district and (complaint.incident_subdistrict != district.name_th):
                    complaint.incident_subdistrict = district.name_th
                    need_update = True
            
            # หา ID จากชื่อที่มีอยู่
            if complaint.incident_province and not complaint.incident_province_id:
                province = db.query(Province).filter(
                    (Province.name_th.ilike(f"%{complaint.incident_province}%")) | 
                    (Province.name_en.ilike(f"%{complaint.incident_province}%"))
                ).first()
                if province:
                    complaint.incident_province_id = province.id
                    complaint.incident_province = province.name_th
                    need_update = True
            
            if complaint.incident_district and complaint.incident_province_id and not complaint.incident_district_id:
                amphure = db.query(Amphure).filter(
                    (Amphure.name_th.ilike(f"%{complaint.incident_district}%")) | 
                    (Amphure.name_en.ilike(f"%{complaint.incident_district}%")),
                    Amphure.province_id == complaint.incident_province_id
                ).first()
                if amphure:
                    complaint.incident_district_id = amphure.id
                    complaint.incident_district = amphure.name_th
                    need_update = True
            
            if complaint.incident_subdistrict and complaint.incident_district_id and not complaint.incident_subdistrict_id:
                district = db.query(District).filter(
                    (District.name_th.ilike(f"%{complaint.incident_subdistrict}%")) | 
                    (District.name_en.ilike(f"%{complaint.incident_subdistrict}%")),
                    District.amphure_id == complaint.incident_district_id
                ).first()
                if district:
                    complaint.incident_subdistrict_id = district.id
                    complaint.incident_subdistrict = district.name_th
                    need_update = True
            
            if need_update:
                complaint.updated_at = datetime.now()
                update_count += 1
        
        if update_count > 0:
            db.commit()
            
        return True
    except Exception as e:
        db.rollback()
        if DEBUG_MODE:
            print(f"Error updating geographic data: {str(e)}")
        return False

def fix_all_geographic_data(db: Session) -> Dict:
    """แก้ไขข้อมูลทางภูมิศาสตร์ทั้งหมดในเรื่องร้องเรียนที่มีปัญหา"""
    try:
        # นับจำนวนเรื่องร้องเรียนที่มีปัญหาข้อมูลทางภูมิศาสตร์
        inconsistent_province_count = db.query(Complaint).filter(
            Complaint.incident_province_id.isnot(None),
            ~Complaint.incident_province.in_(
                db.query(Province.name_th).filter(
                    Province.id == Complaint.incident_province_id
                )
            )
        ).count()
        
        missing_province_count = db.query(Complaint).filter(
            Complaint.incident_province.isnot(None),
            Complaint.incident_province_id.is_(None)
        ).count()
        
        # แก้ไขข้อมูลทั้งหมด
        update_existing_geographic_data(db)
        
        # นับจำนวนที่แก้ไขเรียบร้อยแล้ว
        remaining_inconsistent = db.query(Complaint).filter(
            Complaint.incident_province_id.isnot(None),
            ~Complaint.incident_province.in_(
                db.query(Province.name_th).filter(
                    Province.id == Complaint.incident_province_id
                )
            )
        ).count()
        
        remaining_missing = db.query(Complaint).filter(
            Complaint.incident_province.isnot(None),
            Complaint.incident_province_id.is_(None)
        ).count()
        
        return {
            "before": {
                "inconsistent_province": inconsistent_province_count,
                "missing_province_id": missing_province_count
            },
            "after": {
                "inconsistent_province": remaining_inconsistent,
                "missing_province_id": remaining_missing
            },
            "fixed": {
                "inconsistent_province": inconsistent_province_count - remaining_inconsistent,
                "missing_province_id": missing_province_count - remaining_missing
            }
        }
    except Exception as e:
        if DEBUG_MODE:
            print(f"Error fixing geographic data: {str(e)}")
        return {"error": str(e)}

def update_all_geographic_data(db: Session) -> Dict:
    """แก้ไขข้อมูลทางภูมิศาสตร์ทั้งหมดในฐานข้อมูล"""
    try:
        complaints = db.query(Complaint).all()
        updated_count = 0
        
        for complaint in complaints:
            need_update = False
            
            # ตรวจสอบและแก้ไขข้อมูลจังหวัด
            if complaint.incident_province_id:
                province = db.query(Province).filter(Province.id == complaint.incident_province_id).first()
                if province and complaint.incident_province != province.name_th:
                    complaint.incident_province = province.name_th
                    need_update = True
                    
            # ตรวจสอบและแก้ไขข้อมูลอำเภอ
            if complaint.incident_district_id:
                amphure = db.query(Amphure).filter(Amphure.id == complaint.incident_district_id).first()
                if amphure and complaint.incident_district != amphure.name_th:
                    complaint.incident_district = amphure.name_th
                    need_update = True
                    
            # ตรวจสอบและแก้ไขข้อมูลตำบล
            if complaint.incident_subdistrict_id:
                district = db.query(District).filter(District.id == complaint.incident_subdistrict_id).first()
                if district and complaint.incident_subdistrict != district.name_th:
                    complaint.incident_subdistrict = district.name_th
                    need_update = True
                
            if need_update:
                complaint.updated_at = datetime.now()
                updated_count += 1
        
        if updated_count > 0:
            db.commit()
            
        return {"updated_count": updated_count}
    except Exception as e:
        db.rollback()
        if DEBUG_MODE:
            print(f"Error updating all geographic data: {str(e)}")
        return {"error": str(e), "updated_count": 0}

def set_default_channel_id(db: Session) -> Dict:
    """กำหนดค่า complaint_channel_id เป็นค่าเริ่มต้น (ออนไลน์) สำหรับรายการที่เป็น null"""
    try:
        default_channel = db.query(ComplaintChannel).filter(ComplaintChannel.name == "ออนไลน์").first()
        
        if default_channel:
            result = db.query(Complaint).filter(Complaint.complaint_channel_id.is_(None)).update(
                {"complaint_channel_id": default_channel.id}
            )
            db.commit()
            return {"updated_count": result}
        return {"updated_count": 0, "error": "ไม่พบช่องทางเริ่มต้น (ออนไลน์)"}
    except Exception as e:
        db.rollback()
        if DEBUG_MODE:
            print(f"Error setting default channel: {str(e)}")
        return {"updated_count": 0, "error": str(e)}

def verify_geographic_data(db: Session, location_data: Dict) -> Dict:
    """ตรวจสอบและยืนยันความถูกต้องของข้อมูลทางภูมิศาสตร์"""
    verified_location = {}
    
    if not location_data:
        return verified_location
    
    try:
        # ตรวจสอบข้อมูลจังหวัด
        province_id = location_data.get("incident_province_id")
        province_name = location_data.get("incident_province")
        
        if province_id:
            province = db.query(Province).filter(Province.id == province_id).first()
            if province:
                verified_location["incident_province_id"] = province.id
                verified_location["incident_province"] = province.name_th
            elif province_name:
                province = db.query(Province).filter(
                    (Province.name_th.ilike(f"%{province_name}%")) | 
                    (Province.name_en.ilike(f"%{province_name}%"))
                ).first()
                if province:
                    verified_location["incident_province_id"] = province.id
                    verified_location["incident_province"] = province.name_th
        elif province_name:
            province = db.query(Province).filter(
                (Province.name_th.ilike(f"%{province_name}%")) | 
                (Province.name_en.ilike(f"%{province_name}%"))
            ).first()
            if province:
                verified_location["incident_province_id"] = province.id
                verified_location["incident_province"] = province.name_th
        
        # ตรวจสอบข้อมูลอำเภอ (เฉพาะเมื่อมีจังหวัดแล้ว)
        if verified_location.get("incident_province_id"):
            district_id = location_data.get("incident_district_id")
            district_name = location_data.get("incident_district")
            
            if district_id:
                amphure = db.query(Amphure).filter(
                    Amphure.id == district_id,
                    Amphure.province_id == verified_location["incident_province_id"]
                ).first()
                if amphure:
                    verified_location["incident_district_id"] = amphure.id
                    verified_location["incident_district"] = amphure.name_th
                elif district_name:
                    amphure = db.query(Amphure).filter(
                        ((Amphure.name_th.ilike(f"%{district_name}%")) | 
                         (Amphure.name_en.ilike(f"%{district_name}%"))),
                        Amphure.province_id == verified_location["incident_province_id"]

                    ).first()
                    if amphure:
                        verified_location["incident_district_id"] = amphure.id
                        verified_location["incident_district"] = amphure.name_th
            elif district_name:
                amphure = db.query(Amphure).filter(
                    ((Amphure.name_th.ilike(f"%{district_name}%")) | 
                     (Amphure.name_en.ilike(f"%{district_name}%"))),
                    Amphure.province_id == verified_location["incident_province_id"]
                ).first()
                if amphure:
                    verified_location["incident_district_id"] = amphure.id
                    verified_location["incident_district"] = amphure.name_th
        
        # ตรวจสอบข้อมูลตำบล (เฉพาะเมื่อมีอำเภอแล้ว)
        if verified_location.get("incident_district_id"):
            subdistrict_id = location_data.get("incident_subdistrict_id")
            subdistrict_name = location_data.get("incident_subdistrict")
            
            if subdistrict_id:
                district = db.query(District).filter(
                    District.id == str(subdistrict_id),
                    District.amphure_id == verified_location["incident_district_id"]
                ).first()
                if district:
                    verified_location["incident_subdistrict_id"] = district.id
                    verified_location["incident_subdistrict"] = district.name_th
                elif subdistrict_name:
                    district = db.query(District).filter(
                        ((District.name_th.ilike(f"%{subdistrict_name}%")) | 
                         (District.name_en.ilike(f"%{subdistrict_name}%"))),
                        District.amphure_id == verified_location["incident_district_id"]
                    ).first()
                    if district:
                        verified_location["incident_subdistrict_id"] = district.id
                        verified_location["incident_subdistrict"] = district.name_th
            elif subdistrict_name:
                district = db.query(District).filter(
                    ((District.name_th.ilike(f"%{subdistrict_name}%")) | 
                     (District.name_en.ilike(f"%{subdistrict_name}%"))),
                    District.amphure_id == verified_location["incident_district_id"]
                ).first()
                if district:
                    verified_location["incident_subdistrict_id"] = district.id
                    verified_location["incident_subdistrict"] = district.name_th
            
    except Exception as e:
        if DEBUG_MODE:
            print(f"Error verifying geographic data: {str(e)}")
    
    return verified_location

def handle_incomplete_location_data(location_data: Dict) -> Dict:
    """จัดการกับข้อมูลที่อยู่ที่ไม่สมบูรณ์"""
    result = {}
    
    if check_province_only_data(location_data):
        result = {
            "incident_province_id": location_data.get("incident_province_id"),
            "incident_province": location_data.get("incident_province"),
            "location_level": "province_only"
        }
    elif not location_data:
        result = {"location_level": "no_location_data"}
    else:
        result = location_data.copy()
        result["location_level"] = "complete"
    
    return result

def get_fallback_location_strategy(complaint_data: Dict) -> Dict:
    """กลยุทธ์การหาข้อมูลที่อยู่สำรองแบบใหม่"""
    strategies = []
    
    try:
        # ✅ Strategy 1: สถานที่เกิดเหตุที่ระบุโดยตรง (สำคัญสุด)
        step3 = complaint_data.get("step3", {}).get("general", {})
        if "incidentLocation" in step3:
            incident_loc = extract_location_data(step3["incidentLocation"])
            if incident_loc:
                strategies.append(("specific_incident", incident_loc))
        
        # ✅ Strategy 2: ที่อยู่ผู้ร้องเรียน (เหตุการณ์ส่วนใหญ่เกิดที่นี่)
        step1_location = fallback_to_step1_location(complaint_data)
        if step1_location:
            strategies.append(("complainant", step1_location))
        
        # ✅ Strategy 3: ที่อยู่ผู้ถูกร้องเรียน (ทางเลือกสุดท้าย)
        step2_location = extract_respondent_location(complaint_data.get("step2", {}).get("general", {}))
        if step2_location:
            strategies.append(("respondent", step2_location))
        
        # เลือกกลยุทธ์ที่ดีที่สุดตามลำดับความสำคัญใหม่
        priority_order = ["specific_incident", "complainant", "respondent"]
        best_strategy = None
        best_score = 0
        
        for strategy_name, location in strategies:
            score = calculate_location_completeness_score(location)
            
            # ✅ ให้คะแนนพิเศษตามลำดับความสำคัญ
            if strategy_name == "specific_incident":
                score += 10  # สำคัญสุด
            elif strategy_name == "complainant":
                score += 5   # สำคัญรอง
            elif strategy_name == "respondent":
                score += 1   # ทางเลือกสุดท้าย
            
            if score > best_score:
                best_score = score
                best_strategy = (strategy_name, location)
        
        if best_strategy:
            return {
                "strategy": best_strategy[0],
                "location": best_strategy[1],
                "completeness_score": best_score
            }
    except Exception as e:
        if DEBUG_MODE:
            print(f"Error in fallback location strategy: {str(e)}")
    
    return {"strategy": "none", "location": {}, "completeness_score": 0}

def calculate_location_completeness_score(location_data: Dict) -> int:
    """คำนวณคะแนนความสมบูรณ์ของข้อมูลที่อยู่"""
    score = 0
    
    # จังหวัด (ค่าน้ำหนัก 1)
    if location_data.get("incident_province_id") or location_data.get("incident_province"):
        score += 1
    
    # อำเภอ (ค่าน้ำหนัก 2)
    if location_data.get("incident_district_id") or location_data.get("incident_district"):
        score += 2
    
    # ตำบล (ค่าน้ำหนัก 4)
    if location_data.get("incident_subdistrict_id") or location_data.get("incident_subdistrict"):
        score += 4
    
    return score

# Helper functions สำหรับ production
def safe_get_nested_value(data: Dict, keys: List[str], default=None):
    """ดึงค่าจาก nested dict อย่างปลอดภัย"""
    current = data
    try:
        for key in keys:
            current = current[key]
        return current
    except (KeyError, TypeError):
        return default

def validate_required_fields(data: Dict, required_fields: List[str]) -> List[str]:
    """ตรวจสอบ required fields และคืนค่า list ของ field ที่ขาด"""
    missing_fields = []
    for field in required_fields:
        if not data.get(field):
            missing_fields.append(field)
    return missing_fields

def sanitize_json_data(data) -> str:
    """แปลงข้อมูลเป็น JSON อย่างปลอดภัย"""
    if data is None:
        return None
    
    if isinstance(data, str):
        return data
    
    try:
        return json.dumps(data, ensure_ascii=False, default=str)
    except (TypeError, ValueError) as e:
        if DEBUG_MODE:
            print(f"Error serializing data to JSON: {str(e)}")
        return "{}"
    
def extract_location_data_from_nested(data: Dict) -> Dict:
    """สกัดข้อมูลที่อยู่จาก nested structure"""
    location_data = {}
    
    try:
        # ลองหาจาก step1 > general > general
        step1 = data.get("step1", {}).get("general", {})
        
        if "general" in step1:
            general_data = step1["general"]
            if "province" in general_data and isinstance(general_data["province"], dict):
                location_data["province_id"] = general_data["province"].get("value")
                location_data["province_name"] = general_data["province"].get("label")
            
            if "districts" in general_data and isinstance(general_data["districts"], dict):
                location_data["district_id"] = general_data["districts"].get("value")
                location_data["district_name"] = general_data["districts"].get("label")
            
            if "subdistricts" in general_data and isinstance(general_data["subdistricts"], dict):
                location_data["subdistrict_id"] = general_data["subdistricts"].get("value")
                location_data["subdistrict_name"] = general_data["subdistricts"].get("label")
        
        # ถ้าไม่เจอ ลองดึงจาก respondent ใน step2
        if not location_data and "step2" in data:
            step2 = data.get("step2", {}).get("general", {})
            if "individual" in step2:
                individual = step2["individual"]
                if isinstance(individual, dict):
                    for resp_type in ["individual", "corporate", "government"]:
                        if resp_type in individual and isinstance(individual[resp_type], dict):
                            resp_data = individual[resp_type]
                            if "province" in resp_data and isinstance(resp_data["province"], dict):
                                location_data["province_id"] = resp_data["province"].get("value")
                                location_data["province_name"] = resp_data["province"].get("label")
                                break
    
    except Exception as e:
        if DEBUG_MODE:
            print(f"Error extracting location data: {str(e)}")
    
    return location_data

def check_province_only_data(location_data: Dict) -> bool:
    """ตรวจสอบว่ามีข้อมูลเฉพาะจังหวัดเท่านั้น"""
    has_province = bool(location_data.get("incident_province_id") or location_data.get("incident_province"))
    has_district = bool(location_data.get("incident_district_id") or location_data.get("incident_district"))
    has_subdistrict = bool(location_data.get("incident_subdistrict_id") or location_data.get("incident_subdistrict"))
    
    return has_province and not has_district and not has_subdistrict

def fallback_to_step1_location(complaint_data: Dict) -> Dict:
    """ใช้ที่อยู่ผู้ร้องเรียนเป็นสำรอง"""
    try:
        step1 = complaint_data.get("step1", {}).get("general", {})
        
        if "general" in step1:
            general_data = step1["general"]
            return extract_location_data_from_nested({"step1": {"general": {"general": general_data}}})
    
    except Exception as e:
        if DEBUG_MODE:
            print(f"Error in step1 fallback: {str(e)}")
    
    return {}

def extract_respondent_location(step2_general: Dict) -> Dict:
    """สกัดที่อยู่ผู้ถูกร้องเรียน"""
    try:
        active_type = step2_general.get("activeType", "individual")
        
        if active_type in step2_general:
            respondent_data = step2_general[active_type]
            if isinstance(respondent_data, dict):
                location_data = {}
                if "province" in respondent_data and isinstance(respondent_data["province"], dict):
                    location_data["province_id"] = respondent_data["province"].get("value")
                    location_data["province_name"] = respondent_data["province"].get("label")
                
                if "districts" in respondent_data and isinstance(respondent_data["districts"], dict):
                    location_data["district_id"] = respondent_data["districts"].get("value")
                    location_data["district_name"] = respondent_data["districts"].get("label")
                
                return location_data
    
    except Exception as e:
        if DEBUG_MODE:
            print(f"Error extracting respondent location: {str(e)}")
    
    return {}

def prepare_complaint_model_data(
    db: Session, 
    complaint_data: Dict, 
    original_data: Dict, 
    extracted_data: Dict, 
    root_complaint_type: str, 
    user_id: Optional[UUID]
) -> Dict:
    """เตรียมข้อมูลสำหรับสร้าง Complaint model"""
    
    # สร้างเลขที่เรื่องร้องเรียน
    complaint_number = generate_complaint_number(db)
    
    # ประมวลผลข้อมูลที่อยู่
    location_data = extract_location_data(complaint_data)
    
    return {
        "id": uuid.uuid4(),
        "complaint_number": complaint_number,
        "subject": extracted_data["subject"],
        "description": extracted_data["description"],
        "status": ComplaintStatus.SUBMITTED,
        "complainant_data": json.dumps(extracted_data["complainant_data"], ensure_ascii=False),
        "complainant_type": extracted_data["complainant_type"],
        "delegate_data": json.dumps(extracted_data["delegate_data"], ensure_ascii=False) if extracted_data["delegate_data"] else None,
        "respondent_data": json.dumps(extracted_data["respondent_data"], ensure_ascii=False),
        "respondent_type": extracted_data["respondent_type"],
        "full_complaint_data": json.dumps(original_data, ensure_ascii=False),
        "incident_date": extracted_data["incident_date"],
        "complaint_type": extracted_data["complaint_type"],
        "terms_accepted": extracted_data["accepted"],
        "created_by": user_id,
        "incident_province_id": location_data.get("province_id"),
        "incident_province": location_data.get("province_name"),
        "incident_district_id": location_data.get("district_id"),
        "incident_district": location_data.get("district_name"),
        "incident_subdistrict_id": location_data.get("subdistrict_id"),
        "incident_subdistrict": location_data.get("subdistrict_name"),
        "confidentiality_level": ConfidentialityLevel.NORMAL,
        "urgency_level": UrgencyLevel.LOW,
        "severity_level": SeverityLevel.LOW,
        "complaint_filing_type": ComplaintFilingType.NEW,
        "progress_percentage": 0
    }

def add_related_complaint(db: Session, complaint_id: UUID, related_complaint_id: UUID) -> bool:
    """เพิ่มความสัมพันธ์ระหว่างเรื่องร้องเรียน"""
    try:
        # ตรวจสอบว่าทั้งสองเรื่องมีอยู่จริง
        main_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        related_complaint = db.query(Complaint).filter(Complaint.id == related_complaint_id).first()
        
        if not main_complaint or not related_complaint:
            return False
        
        # อัพเดทข้อมูลความสัมพันธ์
        if main_complaint.related_complaints:
            try:
                related_list = json.loads(main_complaint.related_complaints) if isinstance(main_complaint.related_complaints, str) else main_complaint.related_complaints
                if not isinstance(related_list, list):
                    related_list = []
            except:
                related_list = []
        else:
            related_list = []
        
        # เพิ่มเรื่องที่เกี่ยวข้องใหม่ถ้ายังไม่มี
        related_complaint_info = {
            "id": str(related_complaint_id),
            "complaint_number": related_complaint.complaint_number,
            "subject": related_complaint.subject,
            "linked_at": datetime.now().isoformat()
        }
        
        # ตรวจสอบว่ายังไม่ได้เชื่อมโยงไว้แล้ว
        if not any(item.get("id") == str(related_complaint_id) for item in related_list):
            related_list.append(related_complaint_info)
            main_complaint.related_complaints = json.dumps(related_list, ensure_ascii=False)
            main_complaint.updated_at = datetime.now()
            
            db.commit()
            db.refresh(main_complaint)
        
        return True
        
    except Exception as e:
        db.rollback()
        if DEBUG_MODE:
            print(f"Error adding related complaint: {str(e)}")
        return False

def extract_incident_location(full_data: Dict) -> Dict:
    """สกัดข้อมูลที่อยู่สถานที่เกิดเหตุจาก full_complaint_data"""
    location_data = {}
    
    try:
        # ลองหาจากหลายแหล่ง
        sources = [
            # จาก step3 - ข้อมูลเหตุการณ์โดยตรง
            full_data.get("step3", {}).get("general", {}),
            # จาก step1 - ที่อยู่ผู้ร้องเรียน
            full_data.get("step1", {}).get("general", {}).get("general", {}),
            # จาก step2 - ที่อยู่ผู้ถูกร้องเรียน
            full_data.get("step2", {}).get("general", {})
        ]
        
        for source in sources:
            if not source:
                continue
                
            # ตรวจสอบข้อมูลจังหวัด
            if "province" in source and isinstance(source["province"], dict):
                location_data["incident_province_id"] = source["province"].get("value")
                location_data["incident_province"] = source["province"].get("label")
            
            # ตรวจสอบข้อมูลอำเภอ
            if "districts" in source and isinstance(source["districts"], dict):
                location_data["incident_district_id"] = source["districts"].get("value")
                location_data["incident_district"] = source["districts"].get("label")
            
            # ตรวจสอบข้อมูลตำบล
            if "subdistricts" in source and isinstance(source["subdistricts"], dict):
                location_data["incident_subdistrict_id"] = source["subdistricts"].get("value")
                location_data["incident_subdistrict"] = source["subdistricts"].get("label")
            
            # ถ้าพบข้อมูลแล้วให้หยุด
            if location_data.get("incident_province_id"):
                break
    
    except Exception as e:
        if DEBUG_MODE:
            print(f"Error extracting incident location: {str(e)}")
    
    return location_data

def enrich_address_fields(data: dict, db: Session) -> dict:
    """แปลง province, districts, subdistricts, zipcode ให้เป็น object (value/label/zip_code)"""
    if not data or not db:
        return data
    # Province
    if "province" in data and isinstance(data["province"], (int, str)):
        province = db.query(Province).filter(Province.id == data["province"]).first()
        if province:
            data["province"] = {"value": province.id, "label": province.name_th}
    # District
    if "districts" in data and isinstance(data["districts"], (int, str)):
        amphure = db.query(Amphure).filter(Amphure.id == data["districts"]).first()
        if amphure:
            data["districts"] = {"value": amphure.id, "label": amphure.name_th}
    # Subdistrict
    if "subdistricts" in data and isinstance(data["subdistricts"], (int, str)):
        district = db.query(District).filter(District.id == str(data["subdistricts"])).first()
        if district:
            data["subdistricts"] = {
                "value": district.id,
                "label": district.name_th,
                "zip_code": {
                    "value": district.zip_code,
                    "label": str(district.zip_code)
                }
            }
            # เพิ่ม zipcode field ด้วย (ถ้ามี)
            data["zipcode"] = district.zip_code
    # Zipcode
    if "zipcode" in data and isinstance(data["zipcode"], int):
        data["zipcode"] = {"value": data["zipcode"], "label": str(data["zipcode"])}
    return data

def get_user_roles(db: Session, user_id: UUID):
    """ดึง roles ของผู้ใช้"""
    from models.user_role import UserRole
    from models.role import Role
    
    try:
        user_roles = db.query(Role).join(
            UserRole, Role.id == UserRole.role_id
        ).filter(
            UserRole.user_id == user_id,
            Role.is_active == True
        ).all()
        
        return user_roles
    except Exception as e:
        logger.error(f"Error getting user roles: {str(e)}")
        return []

def get_complaint_by_id_with_assignment_data(db: Session, complaint: Complaint) -> Dict:
    """แปลงข้อมูล complaint เป็นรูปแบบที่ต้องการ - แก้ไข status_history"""
    try:
        result = {
            "id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "step1": parse_complainant_data(complaint.complainant_data, db),
            "step2": parse_respondent_data(complaint.respondent_data, db),
            "step3": parse_incident_data(complaint),
            "step4": {"general": {"accepted": complaint.terms_accepted}},
            "status": complaint.status,
            "status_history": format_status_history(complaint.status_history),
            "created_at": complaint.created_at.isoformat(),
            "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None,
            "assigned_to": complaint.assigned_to,
            "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None,
            "resolution_summary": complaint.resolution_summary,
            "resolved_date": complaint.resolved_date.isoformat() if complaint.resolved_date else None,
        }
        
        # เพิ่มข้อมูล assignment_form
        assignment_form = {
            "id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "subject": complaint.subject,
            "complaint_type": complaint.complaint_type,
            "status": complaint.status,
            "reference_number": complaint.reference_number,
            "reference_date": complaint.reference_date.isoformat() if complaint.reference_date else None,
            "reference_number2": complaint.reference_number2,
            "reference_date2": complaint.reference_date2.isoformat() if complaint.reference_date2 else None,
            "reference_number3": complaint.reference_number3,
            "reference_date3": complaint.reference_date3.isoformat() if complaint.reference_date3 else None,
            "reference_number4": complaint.reference_number4,
            "reference_date4": complaint.reference_date4.isoformat() if complaint.reference_date4 else None,
            "document_number": complaint.document_number,
            "document_date": complaint.document_date.isoformat() if complaint.document_date else None,
            "confidentiality_level": complaint.confidentiality_level,
            "urgency_level": complaint.urgency_level,
            "complaint_filing_type": complaint.complaint_filing_type,
            "agency_sender": complaint.agency_sender,
            "additional_reference_number1": complaint.additional_reference_number1,
            "additional_reference_date1": complaint.additional_reference_date1.isoformat() if complaint.additional_reference_date1 else None,
            "additional_reference_number2": complaint.additional_reference_number2,
            "additional_reference_date2": complaint.additional_reference_date2.isoformat() if complaint.additional_reference_date2 else None,
            "assigned_officer_id": str(complaint.assigned_officer_id) if complaint.assigned_officer_id else None,
            "assigned_to": complaint.assigned_to,
            "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None,
            "assigned_remark": complaint.assigned_remark,
            "complaint_type_id": str(complaint.complaint_type_id) if complaint.complaint_type_id else None,
            "complaint_subtype_id": str(complaint.complaint_subtype_id) if complaint.complaint_subtype_id else None,
            "complaint_channel_id": str(complaint.complaint_channel_id) if complaint.complaint_channel_id else None,
            "registration_date": complaint.registration_date.isoformat() if complaint.registration_date else None,
            "new_complaint": complaint.new_complaint,
            "add_more_complaint_to_ref": complaint.add_more_complaint_to_ref,
            "group_work": complaint.group_work,
            "regulation_reference": complaint.regulation_reference,
            "created_at": complaint.created_at.isoformat(),
            "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None,
            "attachments": parse_incident_data(complaint)["general"]["attachment"]
        }
        
        result["assignment_form"] = assignment_form
        
        return result
        
    except Exception as e:
        logger.error(f"Error converting complaint data: {str(e)}")
        return {"error": f"เกิดข้อผิดพลาด: {str(e)}"}

def parse_complainant_data(complainant_data, db: Session = None):
    """แปลงข้อมูลผู้ร้องเรียนให้อยู่ในรูปแบบ step1 พร้อม enrich address"""
    try:
        if isinstance(complainant_data, str):
            data = json.loads(complainant_data)
        else:
            data = complainant_data or {}
        # enrich address fields
        data = enrich_address_fields(data, db)
        return {
            "general": {
                "general": data
            }
        }
    except Exception as e:
        logger.error(f"Error parsing complainant data: {str(e)}")
        return {"general": {"general": {}}}

def parse_respondent_data(respondent_data, db: Session = None):
    """แปลงข้อมูลผู้ถูกร้องเรียนให้อยู่ในรูปแบบ step2 พร้อม enrich address"""
    try:
        if isinstance(respondent_data, str):
            data = json.loads(respondent_data)
        else:
            data = respondent_data or {}
        data = enrich_address_fields(data, db)
        return {
            "general": {
                "activeType": "individual",
                "individual": data
            }
        }
    except Exception as e:
        logger.error(f"Error parsing respondent data: {str(e)}")
        return {"general": {"activeType": "individual", "individual": {}}}

def parse_incident_data(complaint):
    """แปลงข้อมูลเหตุการณ์ให้อยู่ในรูปแบบ step3 - รวม attachments"""
    try:
        # ดึงไฟล์แนบจาก relationship
        attachment_list = []
        if hasattr(complaint, 'attachments') and complaint.attachments:
            for attachment in complaint.attachments:
                attachment_list.append({
                    "id": str(attachment.id),
                    "fileName": attachment.file_name,
                    "fileSize": attachment.file_size,
                    "fileUrl": attachment.file_url,
                    "fileType": attachment.file_type,
                    "created_at": attachment.created_at.isoformat() if attachment.created_at else None
                })
        
        return {
            "general": {
                "complaintType": complaint.complaint_type or "",
                "subject": complaint.subject or "",
                "description": complaint.description or "",
                "incidentDate": complaint.incident_date.isoformat() if complaint.incident_date else None,
                "attachment": attachment_list  # เพิ่มไฟล์แนบที่ดึงจากฐานข้อมูล
            }
        }
    except Exception as e:
        logger.error(f"Error parsing incident data: {str(e)}")
        return {
            "general": {
                "complaintType": "", 
                "subject": "", 
                "description": "", 
                "incidentDate": None, 
                "attachment": []
            }
        }

def format_status_history(status_history_list):
    """จัดรูปแบบประวัติสถานะ - เรียงใหม่ล่าสุดก่อน"""
    try:
        if not status_history_list:
            return []

        sorted_history = sorted(status_history_list, key=lambda x: x.changed_at, reverse=True)
        
        formatted_history = []
        for history in sorted_history:
            formatted_history.append({
                "status": history.status,
                "status_thai": get_thai_status(history.status),
                "notes": history.notes,
                "changed_at": history.changed_at.isoformat() if history.changed_at else None,
                "changed_by": str(history.changed_by) if history.changed_by else None
            })
        
        return formatted_history
    except Exception as e:
        logger.error(f"Error formatting status history: {str(e)}")
        return []

def get_my_complaint_by_id(db: Session, complaint_id: UUID, user_id: UUID) -> Dict:
    """ดึงรายละเอียดเรื่องร้องเรียนของผู้ใช้คนนั้นๆ รวมข้อมูล assignment form"""
    try:
        # ตรวจสอบ role ของผู้ใช้
        user_roles = get_user_roles(db, user_id)
        is_admin = any(role.name == "admin" for role in user_roles)
        
        # สร้าง query พื้นฐาน
        query = db.query(Complaint).filter(Complaint.id == complaint_id)
        
        # ถ้าไม่ใช่ admin ให้กรองเฉพาะเรื่องที่เกี่ยวข้องกับผู้ใช้
        if not is_admin:
            query = query.filter(
                or_(
                    Complaint.created_by == user_id,           # เรื่องที่ตนเองสร้าง
                    Complaint.assigned_officer_id == user_id   # เรื่องที่ได้รับมอบหมาย
                )
            )
        
        complaint = query.first()
        
        if not complaint:
            return {"error": "ไม่พบข้อร้องเรียนหรือไม่มีสิทธิ์เข้าถึง"}
        
        # ใช้ฟังก์ชันเดิมในการแปลงข้อมูล
        return get_complaint_by_id_with_assignment_data(db, complaint)
        
    except Exception as e:
        logger.error(f"Error getting my complaint: {str(e)}")
        return {"error": f"เกิดข้อผิดพลาด: {str(e)}"}
 
def get_complaint_by_id_with_assignment(db: Session, complaint_id: UUID) -> Dict:
    """ดึงรายละเอียดเรื่องร้องเรียนใดๆ รวมข้อมูล assignment form (ไม่จำกัดเฉพาะเจ้าของ)"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            return {"error": "ไม่พบเรื่องร้องเรียน"}

        result = {
            "id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "step1": parse_complainant_data(complaint.complainant_data, db),
            "step2": parse_respondent_data(complaint.respondent_data, db),
            "step3": parse_incident_data(complaint),
            "step4": {"general": {"accepted": complaint.terms_accepted}},
            "status": complaint.status,
            "status_history": format_status_history(complaint.status_history),
            "created_at": complaint.created_at.isoformat(),
            "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None,
            "assigned_to": complaint.assigned_to,
            "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None,
            "resolution_summary": complaint.resolution_summary,
            "resolved_date": complaint.resolved_date.isoformat() if complaint.resolved_date else None,
        }

        assignment_form = {
            "id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "subject": complaint.subject,
            "complaint_type": complaint.complaint_type,
            "status": complaint.status,
            
            # Reference Numbers (1-4)
            "reference_number": complaint.reference_number,
            "reference_date": complaint.reference_date.isoformat() if complaint.reference_date else None,
            "reference_number2": complaint.reference_number2,
            "reference_date2": complaint.reference_date2.isoformat() if complaint.reference_date2 else None,
            "reference_number3": complaint.reference_number3,
            "reference_date3": complaint.reference_date3.isoformat() if complaint.reference_date3 else None,
            "reference_number4": complaint.reference_number4,
            "reference_date4": complaint.reference_date4.isoformat() if complaint.reference_date4 else None,
            
            # Document Info
            "document_number": complaint.document_number,
            "document_date": complaint.document_date.isoformat() if complaint.document_date else None,
            
            # Levels & Classifications
            "confidentiality_level": complaint.confidentiality_level,
            "urgency_level": complaint.urgency_level,
            "complaint_filing_type": complaint.complaint_filing_type,
            
            # Agency Info
            "agency_sender": complaint.agency_sender,
            
            # Additional Reference Numbers
            "additional_reference_number1": complaint.additional_reference_number1,
            "additional_reference_date1": complaint.additional_reference_date1.isoformat() if complaint.additional_reference_date1 else None,
            "additional_reference_number2": complaint.additional_reference_number2,
            "additional_reference_date2": complaint.additional_reference_date2.isoformat() if complaint.additional_reference_date2 else None,
            
            # Assignment Info
            "assigned_officer_id": str(complaint.assigned_officer_id) if complaint.assigned_officer_id else None,
            "assigned_to": complaint.assigned_to,
            "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None,
            "assigned_remark": complaint.assigned_remark,

            # Complaint Categories
            "complaint_type_id": str(complaint.complaint_type_id) if complaint.complaint_type_id else None,
            "complaint_subtype_id": str(complaint.complaint_subtype_id) if complaint.complaint_subtype_id else None,
            "complaint_channel_id": str(complaint.complaint_channel_id) if complaint.complaint_channel_id else None,
            
            # Registration Date
            "registration_date": complaint.registration_date.isoformat() if complaint.registration_date else None,
            
            # Workflow Flags
            "new_complaint": complaint.new_complaint,
            "add_more_complaint_to_ref": complaint.add_more_complaint_to_ref,
            "group_work": complaint.group_work,
            
            # Legal Reference
            "regulation_reference": complaint.regulation_reference,
            
            # Timestamps
            "created_at": complaint.created_at.isoformat(),
            "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None,
            
            # ✅ เพิ่มไฟล์แนบใน assignment_form ด้วย
            "attachments": parse_incident_data(complaint)["general"]["attachment"]
        }
        
        result["assignment_form"] = assignment_form
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting complaint with assignment: {str(e)}")
        return {"error": f"เกิดข้อผิดพลาด: {str(e)}"}

def get_complaints_grouped_by_channel(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    complaint_type: Optional[str] = None,
    complaint_subtype: Optional[str] = None,
    assignee: Optional[str] = None,
    location: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    complainant_name: Optional[str] = None,
):
    """ดึงรายการข้อร้องเรียนที่จัดกลุ่มตาม complaint_channel_id"""
    from models.comp_complaint_types import ComplaintChannel, ComplaintSubType
    
    try:
        # สร้าง query พื้นฐาน
        query = db.query(Complaint)
        
        # Apply filters
        if status:
            query = query.filter(Complaint.status == status)
        
        if complaint_type:
            query = query.filter(Complaint.complaint_type.ilike(f"%{complaint_type}%"))
        
        if complaint_subtype:
            query = query.join(ComplaintSubType, Complaint.complaint_subtype_id == ComplaintSubType.id)
            query = query.filter(ComplaintSubType.name.ilike(f"%{complaint_subtype}%"))
        
        if assignee:
            query = query.filter(
                (Complaint.assigned_to.ilike(f"%{assignee}%")) |
                (Complaint.assigned_officer_id.isnot(None))
            )
        
        if location:
            query = query.filter(
                (Complaint.incident_province.ilike(f"%{location}%")) |
                (Complaint.incident_district.ilike(f"%{location}%")) |
                (Complaint.incident_subdistrict.ilike(f"%{location}%"))
            )
        
        if urgency:
            query = query.filter(Complaint.urgency_level == urgency)
        
        if search:
            query = query.outerjoin(ComplaintSubType, Complaint.complaint_subtype_id == ComplaintSubType.id)
            query = query.filter(
                or_(
                    Complaint.complaint_number.ilike(f"%{search}%"),
                    Complaint.subject.ilike(f"%{search}%"),
                    Complaint.description.ilike(f"%{search}%"),
                    Complaint.complaint_type.ilike(f"%{search}%"),
                    ComplaintSubType.name.ilike(f"%{search}%"),
                    Complaint.complainant_data.ilike(f"%{search}%")
                )
            )
        
        if complainant_name:
            query = query.filter(Complaint.complainant_data.ilike(f"%{complainant_name}%"))

        # Get total count และ complaints
        total_count = query.count()
        query = query.order_by(Complaint.created_at.desc())
        complaints = query.offset(skip).limit(limit).all()

        # จัดกลุ่มตาม complaint_channel_id
        grouped = {}
        
        for complaint in complaints:
            # กำหนด channel info
            channel_id = str(complaint.complaint_channel_id) if complaint.complaint_channel_id else "unknown"
            channel_name = get_channel_name(db, complaint.complaint_channel_id)
            
            # สร้าง complaint item
            item = create_grouped_complaint_item(db, complaint)
            item["complaint_channel_id"] = channel_id
            item["complaint_channel_name"] = channel_name
            
            # เพิ่มเข้า group
            if channel_id not in grouped:
                grouped[channel_id] = {
                    "complaint_channel_id": channel_id,
                    "complaint_channel_name": channel_name,
                    "items": []
                }
            grouped[channel_id]["items"].append(item)

        # แปลงเป็น list และเตรียม response
        grouped_list = list(grouped.values())
        filters = get_filter_options(db)
        
        return {
            "groups": grouped_list,
            "pagination": {
                "total": total_count,
                "skip": skip,
                "limit": limit,
                "has_more": total_count > (skip + limit)
            },
            "filters": filters
        }
        
    except Exception as e:
        logger.error(f"Error getting complaints grouped by channel: {str(e)}")
        return {
            "groups": [],
            "pagination": {"total": 0, "skip": skip, "limit": limit, "has_more": False},
            "filters": get_filter_options(db)
        }

def get_channel_name(db: Session, channel_id: Optional[UUID]) -> str:
    """ดึงชื่อช่องทางการร้องเรียน"""
    if not channel_id:
        return "ไม่ระบุช่องทาง"
    
    try:
        from models.comp_complaint_types import ComplaintChannel
        channel = db.query(ComplaintChannel).filter(ComplaintChannel.id == channel_id).first()
        return channel.name if channel else "ไม่ระบุช่องทาง"
    except Exception:
        return "ไม่ระบุช่องทาง"

def create_grouped_complaint_item(db: Session, complaint: Complaint) -> Dict:
    """สร้างข้อมูล complaint item สำหรับการจัดกลุ่ม"""
    try:
        # ดึงข้อมูล complaint_subtype
        complaint_subtype = ""
        if complaint.complaint_subtype_id:
            from models.comp_complaint_types import ComplaintSubType
            subtype = db.query(ComplaintSubType).filter(ComplaintSubType.id == complaint.complaint_subtype_id).first()
            if subtype:
                complaint_subtype = subtype.name
        
        return {
            "id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "subject": complaint.subject,
            "complaint_type": complaint.complaint_type,
            "complaint_subtype": complaint_subtype,
            "status": get_thai_status(complaint.status),
            "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
            "complainant_name": get_display_complainant_name(
                ensure_dict(complaint.complainant_data), 
                ensure_dict(complaint.delegate_data) if complaint.delegate_data else None
            ),
            "respondent_name": get_display_respondent_name(
                complaint.respondent_type, 
                ensure_dict(complaint.respondent_data)
            ),
            "incident_location": get_display_incident_location(complaint),
            "assigned_to": complaint.assigned_to or "",
            "urgency_level": complaint.urgency_level.lower() if complaint.urgency_level else "low",
            "severity_level": complaint.severity_level.lower() if complaint.severity_level else "low",
            
            # Reference fields
            "additional_reference_number1": complaint.additional_reference_number1,
            "additional_reference_date1": complaint.additional_reference_date1.isoformat() if complaint.additional_reference_date1 else None,
            "additional_reference_number2": complaint.additional_reference_number2,
            "additional_reference_date2": complaint.additional_reference_date2.isoformat() if complaint.additional_reference_date2 else None,
            "reference_number": complaint.reference_number,
            "reference_date": complaint.reference_date.isoformat() if complaint.reference_date else None,
            "reference_number2": complaint.reference_number2,
            "reference_date2": complaint.reference_date2.isoformat() if complaint.reference_date2 else None,
            "reference_number3": complaint.reference_number3,
            "reference_date3": complaint.reference_date3.isoformat() if complaint.reference_date3 else None,
            "reference_number4": complaint.reference_number4,
            "reference_date4": complaint.reference_date4.isoformat() if complaint.reference_date4 else None,
        }
        
    except Exception as e:
        logger.error(f"Error creating grouped complaint item: {str(e)}")
        return {
            "id": str(complaint.id),
            "complaint_number": complaint.complaint_number or "",
            "subject": complaint.subject or "",
            "complaint_type": complaint.complaint_type or "",
            "complaint_subtype": "",
            "status": get_thai_status(complaint.status),
            "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
            "complainant_name": "ข้อมูลไม่สมบูรณ์",
            "respondent_name": "ข้อมูลไม่สมบูรณ์",
            "incident_location": "",
            "assigned_to": "",
            "urgency_level": "low",
            "severity_level": "low",
            "additional_reference_number1": None,
            "additional_reference_date1": None,
            "additional_reference_number2": None,
            "additional_reference_date2": None,
            "reference_number": None,
            "reference_date": None,
            "reference_number2": None,
            "reference_date2": None,
            "reference_number3": None,
            "reference_date3": None,
            "reference_number4": None,
            "reference_date4": None,
        }

def get_channel_name_for_notification(db: Session, channel_id: UUID) -> str:
    """ดึงชื่อช่องทางการร้องเรียนจาก ID สำหรับ notification"""
    from models.comp_complaint_types import ComplaintChannel
    
    try:
        if not channel_id:
            return "ไม่ระบุช่องทาง"
            
        channel = db.query(ComplaintChannel).filter(
            ComplaintChannel.id == channel_id
        ).first()
        
        if channel:
            return channel.name
        else:
            return "ช่องทางไม่ทราบ"
            
    except Exception as e:
        logger.error(f"Error getting channel name for ID {channel_id}: {str(e)}")
        return "ช่องทางไม่ทราบ"

def get_complainant_display_name_for_notification(complainant_data: Dict, delegate_data: Dict = None) -> str:
    """สร้างชื่อผู้ร้องเรียนสำหรับแสดงใน notification"""
    try:
        # ลองดึงชื่อจากข้อมูลผู้ร้องเรียน
        if "name" in complainant_data:
            return complainant_data["name"]
        
        # รวมชื่อ-นามสกุล
        first_name = complainant_data.get("firstName", "") or complainant_data.get("first_name", "")
        last_name = complainant_data.get("lastName", "") or complainant_data.get("last_name", "")
        
        if first_name and last_name:
            name = f"{first_name} {last_name}"
        elif first_name:
            name = first_name
        elif last_name:
            name = last_name
        else:
            name = ""
        
        # ถ้ายังไม่มีชื่อ ลองดึงจากชื่อบริษัท (กรณีนิติบุคคล)
        if not name:
            company_name = complainant_data.get("companyName", "")
            if company_name:
                name = company_name
        
        # เพิ่มผู้รับมอบอำนาจถ้ามี
        if delegate_data and isinstance(delegate_data, dict):
            delegate_name = delegate_data.get("name", "")
            if delegate_name and delegate_name.strip():
                if name:
                    name += f" (ผู้รับมอบอำนาจ: {delegate_name})"
                else:
                    name = f"ผู้รับมอบอำนาจ: {delegate_name}"
        
        # ถ้าไม่มีชื่อเลย ให้ใช้ "ผู้ร้องเรียนไม่ทราบชื่อ"
        return name if name else "ผู้ร้องเรียนไม่ทราบชื่อ"
        
    except Exception as e:
        logger.error(f"Error getting complainant display name: {str(e)}")
        return "ผู้ร้องเรียน"

def create_complaint_notification_message(
    complaint: Complaint, 
    complainant_name: str, 
    channel_name: str, 
    complaint_type: str
) -> str:
    """สร้างข้อความ notification สำหรับเรื่องร้องเรียนใหม่"""
    try:
        # ข้อความพื้นฐาน
        base_message = f"มีเรื่องร้องเรียนใหม่จาก {complainant_name}"
        
        # เพิ่มประเภทเรื่องร้องเรียน
        if complaint_type:
            base_message += f" ประเภท: {complaint_type}"
        
        # เพิ่มช่องทางการร้องเรียน
        if channel_name and channel_name != "ช่องทางไม่ทราบ":
            base_message += f" ผ่านช่องทาง: {channel_name}"
        
        # เพิ่มหัวข้อเรื่องร้องเรียน
        if complaint.subject:
            subject_preview = complaint.subject[:50] + "..." if len(complaint.subject) > 50 else complaint.subject
            base_message += f" หัวข้อ: {subject_preview}"
        
        # เพิ่มเลขที่เรื่อง
        base_message += f" เลขที่เรื่อง: {complaint.complaint_number}"
        
        return base_message
        
    except Exception as e:
        logger.error(f"Error creating notification message: {str(e)}")
        return f"มีเรื่องร้องเรียนใหม่ เลขที่: {complaint.complaint_number}"

def should_notify_status_change(old_status: ComplaintStatus, new_status: ComplaintStatus) -> bool:
    """ตรวจสอบว่าควรส่ง notification เมื่อเปลี่ยนสถานะหรือไม่"""
    # สถานะที่สำคัญที่ควรแจ้งเตือน
    important_statuses = [
        ComplaintStatus.SENT_TO_AGENCY,
        ComplaintStatus.IN_PROCESS,
        ComplaintStatus.REVIEWED,
        ComplaintStatus.COMPLETED
    ]
    
    return new_status in important_statuses and old_status != new_status

def create_status_change_notification_message(
    complaint: Complaint, 
    old_status: ComplaintStatus, 
    new_status: ComplaintStatus,
    complainant_name: str,
    notes: Optional[str] = None
) -> str:
    """สร้างข้อความ notification สำหรับการเปลี่ยนสถานะ"""
    try:
        # แปลสถานะเป็นภาษาไทย
        old_status_thai = get_thai_status(old_status.value)
        new_status_thai = get_thai_status(new_status.value)
        
        message = f"เรื่องร้องเรียน {complaint.complaint_number} จาก {complainant_name} "
        message += f"เปลี่ยนสถานะจาก '{old_status_thai}' เป็น '{new_status_thai}'"
        
        # เพิ่มหมายเหตุถ้ามี
        if notes:
            notes_preview = notes[:100] + "..." if len(notes) > 100 else notes
            message += f" หมายเหตุ: {notes_preview}"
        
        return message
        
    except Exception as e:
        logger.error(f"Error creating status change notification message: {str(e)}")
        return f"อัปเดตสถานะเรื่องร้องเรียน {complaint.complaint_number}"

def get_notification_roles_by_status(status: ComplaintStatus) -> str:
    """กำหนด role ที่จะได้รับ notification ตามสถานะ"""
    role_mapping = {
        ComplaintStatus.SUBMITTED: "admin,staff",
        ComplaintStatus.SENT_TO_AGENCY: "admin,staff,supervisor",
        ComplaintStatus.IN_PROCESS: "admin,staff,supervisor",
        ComplaintStatus.IN_REVIEW: "admin,supervisor",
        ComplaintStatus.REVIEWED: "admin,staff,supervisor",
        ComplaintStatus.COMPLETED: "admin,staff,supervisor"
    }
    
    return role_mapping.get(status, "admin,staff")

def create_assignment_notification_message(
    complaint: Complaint,
    complainant_name: str,
    assigned_to: str,
    assigned_officer_name: Optional[str] = None
) -> str:
    """สร้างข้อความ notification สำหรับการมอบหมายงาน"""
    try:
        message = f"เรื่องร้องเรียน {complaint.complaint_number} จาก {complainant_name}"
        
        if assigned_officer_name:
            message += f" ได้รับการมอบหมายให้ {assigned_officer_name}"
        elif assigned_to:
            message += f" ได้รับการมอบหมายให้ {assigned_to}"
        else:
            message += " ได้รับการมอบหมายงาน"
        
        # เพิ่มหัวข้อเรื่องร้องเรียน
        if complaint.subject:
            subject_preview = complaint.subject[:50] + "..." if len(complaint.subject) > 50 else complaint.subject
            message += f" หัวข้อ: {subject_preview}"
        
        return message
        
    except Exception as e:
        logger.error(f"Error creating assignment notification message: {str(e)}")
        return f"มอบหมายเรื่องร้องเรียน {complaint.complaint_number}"

def assign_complaint_to_officer(
    db: Session, 
    complaint_id: UUID, 
    assigned_to: Optional[str] = None,
    assigned_officer_id: Optional[UUID] = None,
    notes: Optional[str] = None,
    user_id: Optional[UUID] = None
) -> Complaint:
    """มอบหมายเรื่องร้องเรียนให้เจ้าหน้าที่"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise ValueError("ไม่พบเรื่องร้องเรียน")
        
        # บันทึกข้อมูลการมอบหมาย
        complaint.assigned_to = assigned_to
        complaint.assigned_officer_id = assigned_officer_id
        complaint.assigned_date = datetime.now()
        complaint.updated_at = datetime.now()
        
        # สร้างประวัติ
        assignment_notes = notes or "มอบหมายเรื่องร้องเรียนให้เจ้าหน้าที่"
        if assigned_to:
            assignment_notes += f" ({assigned_to})"
        
        create_status_history(db, complaint_id, complaint.status, assignment_notes, user_id)
        
        # ✅ สร้าง notification สำหรับการมอบหมายงาน
        try:
            # ดึงข้อมูลผู้ร้องเรียน
            complainant_data = ensure_dict(complaint.complainant_data)
            delegate_data = ensure_dict(complaint.delegate_data) if complaint.delegate_data else None
            complainant_name = get_complainant_display_name_for_notification(complainant_data, delegate_data)
            
            # ดึงชื่อเจ้าหน้าที่ (ถ้ามี)
            assigned_officer_name = None
            if assigned_officer_id:
                try:
                    from app.api.v1.controllers.user_controller import get_user_with_roles_and_titles
                    officer_info = get_user_with_roles_and_titles(db, assigned_officer_id)
                    if officer_info:
                        assigned_officer_name = officer_info.get("displayName") or officer_info.get("username")
                except Exception:
                    pass
            
            # สร้าง notification message
            assignment_message = create_assignment_notification_message(
                complaint, complainant_name, assigned_to or "", assigned_officer_name
            )
            
            # สร้าง notification สำหรับทีม
            notification_data = NotificationCreate(
                title="มอบหมายเรื่องร้องเรียน",
                message=assignment_message,
                role_seeking_group="admin,staff,supervisor",
                redirect_url=f"/complaints/{complaint.id}"
            )
            
            notification_controller.create_notification(db, notification_data)
            
            # สร้าง notification เฉพาะให้เจ้าหน้าที่ที่ได้รับมอบหมาย (ถ้ามี)
            if assigned_officer_id:
                personal_notification = NotificationCreate(
                    title="คุณได้รับมอบหมายเรื่องร้องเรียนใหม่",
                    message=f"คุณได้รับมอบหมายเรื่องร้องเรียน {complaint.complaint_number} จาก {complainant_name}",
                    user_id=assigned_officer_id,
                    redirect_url=f"/complaints/{complaint.id}"
                )
                
                notification_controller.create_notification(db, personal_notification)
            
            logger.info(f"Assignment notification created for complaint: {complaint.complaint_number}")
            
        except Exception as e:
            logger.error(f"Error creating assignment notification: {str(e)}")
        
        db.commit()
        db.refresh(complaint)
        
        logger.info(f"Complaint {complaint.complaint_number} assigned successfully")
        return complaint
        
    except Exception as e:
        logger.error(f"Failed to assign complaint {complaint_id}: {str(e)}")
        db.rollback()
        raise