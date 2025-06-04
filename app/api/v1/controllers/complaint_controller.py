import uuid
import json
import traceback
import logging
from datetime import datetime, date
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any, Optional, Tuple

from models.comp_complaint import Complaint, ComplaintStatus, ComplainantType, RespondentType, ComplaintStatusHistory
from models.comp_provinces import Province
from models.comp_amphures import Amphure
from models.comp_districts import District
from app.api.v1.schemas.complaint import ComplaintListItem
from models.comp_complaint_types import ComplaintType, ComplaintSubType, ComplaintChannel
from app.api.v1.controllers.geography_controller import model_to_dict

logger = logging.getLogger(__name__)

# Global flag สำหรับควบคุม debug logs
DEBUG_MODE = False

def debug_log(message: str):
    """Log debug messages ด้วย logging level"""
    logger.debug(message)

def save_original_complaint(complaint_data: Dict[str, Any]) -> Dict[str, Any]:
    """บันทึกข้อมูลตามโครงสร้าง step1-step4 ตามที่ได้รับจากหน้าบ้าน"""
    import copy
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

def create_complaint(db: Session, complaint_data: Dict[str, Any], user_id: Optional[UUID] = None) -> Complaint:
    """สร้างข้อร้องเรียนใหม่"""
    try:
        debug_log(f"🔍 [CONTROLLER] Starting create_complaint with user: {user_id}")
        
        # แปลงข้อมูล formData ถ้ามีก่อน
        if "formData" in complaint_data:
            complaint_data = complaint_data["formData"]
            debug_log(f"✅ [CONTROLLER] Extracted formData")

        # เก็บค่า complaintType จาก root level ไว้ก่อน
        root_complaint_type = complaint_data.get("complaintType", "")

        # ตรวจสอบและแปลงรูปแบบข้อมูลถ้าจำเป็น
        if "subject" in complaint_data and "step1" not in complaint_data:
            debug_log(f"🔄 [CONTROLLER] Converting flat data to structured")
            structured_data = convert_flat_to_structured(complaint_data, root_complaint_type)
            complaint_data = structured_data
        elif root_complaint_type:
            ensure_complaint_type_consistency(complaint_data, root_complaint_type)
        
        # 1. เก็บข้อมูลดิบทั้งหมดแบบ JSON object
        original_data = save_original_complaint(complaint_data)
        
        # 2. แยกข้อมูลตามขั้นตอนและประมวลผลเฉพาะส่วนที่จำเป็น
        extracted_data = extract_complaint_data(complaint_data, root_complaint_type)
        
        # ตรวจสอบข้อมูลที่จำเป็น
        if not extracted_data.get("subject"):
            raise ValueError("Subject is required")
            
        if not extracted_data.get("complainant_data"):
            raise ValueError("Complainant data is required")
            
        if not extracted_data.get("respondent_data"):
            raise ValueError("Respondent data is required")
        
        # เตรียมข้อมูลสำหรับสร้าง model
        complaint_model_data = prepare_complaint_model_data(
            db, complaint_data, original_data, extracted_data, root_complaint_type, user_id
        )
        
        # บันทึกข้อมูล
        new_complaint = Complaint(**complaint_model_data)
        db.add(new_complaint)
        db.commit()
        db.refresh(new_complaint)
        
        # บันทึกประวัติสถานะเริ่มต้น
        create_status_history(db, new_complaint.id, ComplaintStatus.SUBMITTED, "รับเรื่องร้องเรียนเรียบร้อย", user_id)
        
        # ตรวจสอบข้อมูลทางภูมิศาสตร์อีกครั้งหลังจากบันทึก
        update_existing_geographic_data(db, new_complaint.id)
        
        # Log เฉพาะ success ในรูปแบบกระชับ
        logger.info(f"Complaint created: {new_complaint.complaint_number}")

        return new_complaint
        
    except Exception as e:
        print(f"❌ [{datetime.now().strftime('%H:%M:%S')}] Create complaint failed: {str(e)}")
        if DEBUG_MODE:
            traceback.print_exc()
        db.rollback()
        raise

def convert_flat_to_structured(flat_data: Dict[str, Any], root_complaint_type: str) -> Dict[str, Any]:
    """แปลงข้อมูลจากรูปแบบ flat เป็น structured"""
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
    
    handle_complainant_data(structured_data, flat_data)
    handle_respondent_data(structured_data, flat_data)
    
    if root_complaint_type:
        structured_data["complaintType"] = root_complaint_type
        structured_data["step3"]["general"]["complaintType"] = root_complaint_type
        
    return structured_data

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

def ensure_complaint_type_consistency(data: Dict, complaint_type: str):
    """ตรวจสอบความสอดคล้องของ complaintType ในทุกระดับ"""
    if not complaint_type:
        return
        
    data["complaintType"] = complaint_type
    
    if "step3" in data and isinstance(data["step3"], dict):
        if "general" in data["step3"] and isinstance(data["step3"]["general"], dict):
            data["step3"]["general"]["complaintType"] = complaint_type

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
        step3_general = step3["general"]
        subject = step3_general.get("subject", "")
        description = step3_general.get("description", "")
        
        if not complaint_type and "complaintType" in step3_general and step3_general["complaintType"]:
            complaint_type = step3_general["complaintType"]
        
        if "incidentDate" in step3_general and step3_general["incidentDate"]:
            try:
                incident_date = datetime.fromisoformat(step3_general["incidentDate"].replace('Z', '+00:00'))
            except Exception:
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
    complainant_data = {}
    complainant_type = ComplainantType.INDIVIDUAL
    delegate_data = None
    
    if "general" in step1:
        step1_general = step1["general"]
        
        if "corporate" in step1_general:
            complainant_type = ComplainantType.CORPORATE
            complainant_data = process_nested_fields(step1_general["corporate"])
            
            if "signer" in step1_general and step1_general.get("signer"):
                complainant_data["signer"] = process_nested_fields(step1_general["signer"])
        
        elif "general" in step1_general:
            complainant_type = ComplainantType.INDIVIDUAL
            complainant_data = process_nested_fields(step1_general["general"])
        
        else:
            active_type = step1_general.get("activeType", "general")
            
            if (active_type == "general" or active_type == "individual") and "general" in step1_general:
                complainant_type = ComplainantType.INDIVIDUAL
                complainant_data = process_nested_fields(step1_general["general"])
            
            elif active_type == "corporate" and "corporate" in step1_general:
                complainant_type = ComplainantType.CORPORATE
                complainant_data = process_nested_fields(step1_general["corporate"])
                
                if "signer" in step1_general and step1_general.get("signer"):
                    complainant_data["signer"] = process_nested_fields(step1_general["signer"])
        
        if "delegate" in step1_general and step1_general.get("delegate") and isinstance(step1_general["delegate"], dict) and len(step1_general["delegate"]) > 0:
            delegate_data = process_nested_fields(step1_general["delegate"])
    
    return {
        "data": complainant_data,
        "type": complainant_type,
        "delegate_data": delegate_data
    }

def process_respondent_data(step2: Dict) -> Dict:
    """ประมวลผลข้อมูลผู้ถูกร้องเรียน"""
    respondent_data = {}
    respondent_type = RespondentType.INDIVIDUAL
    
    if "general" not in step2:
        return {"data": respondent_data, "type": respondent_type}
        
    step2_general = step2["general"]
    
    if "activeType" in step2_general:
        result = process_respondent_with_active_type(step2_general)
    else:
        result = process_respondent_without_active_type(step2_general)
    
    return result

def process_respondent_with_active_type(step2_general: Dict) -> Dict:
    """ประมวลผลข้อมูลผู้ถูกร้องเรียนที่มี activeType"""
    active_type = step2_general["activeType"]
    respondent_data = {}
    respondent_type = RespondentType.INDIVIDUAL
    
    if active_type == "corporate":
        respondent_type = RespondentType.CORPORATE
        
        if "corporate" in step2_general:
            corp_data = step2_general["corporate"] 
            if "companyName" in corp_data and not "name" in corp_data:
                corp_data["name"] = corp_data["companyName"]
            respondent_data = process_nested_fields(corp_data)
        elif "individual" in step2_general and isinstance(step2_general["individual"], dict) and "corporate" in step2_general["individual"]:
            corp_data = step2_general["individual"]["corporate"]
            if "companyName" in corp_data and not "name" in corp_data:
                corp_data["name"] = corp_data["companyName"]
            respondent_data = process_nested_fields(corp_data)
    
    elif active_type == "government":
        respondent_type = RespondentType.GOVERNMENT
        
        if "government" in step2_general:
            gov_data = step2_general["government"]
            if "agencyName" in gov_data and not "name" in gov_data:
                gov_data["name"] = gov_data["agencyName"]
            respondent_data = process_nested_fields(gov_data)
        elif "individual" in step2_general and isinstance(step2_general["individual"], dict) and "government" in step2_general["individual"]:
            gov_data = step2_general["individual"]["government"]
            if "agencyName" in gov_data and not "name" in gov_data:
                gov_data["name"] = gov_data["agencyName"]
            respondent_data = process_nested_fields(gov_data)
    
    elif active_type in ["individual", "general"]:
        if "individual" in step2_general and isinstance(step2_general["individual"], dict):
            nested_result = check_nested_respondent(step2_general["individual"])
            respondent_type = nested_result["type"]
            respondent_data = nested_result["data"]
    
    return {
        "data": respondent_data, 
        "type": respondent_type
    }

def process_respondent_without_active_type(step2_general: Dict) -> Dict:
    """ประมวลผลข้อมูลผู้ถูกร้องเรียนที่ไม่มี activeType"""
    respondent_data = {}
    respondent_type = RespondentType.INDIVIDUAL
    
    if "government" in step2_general and isinstance(step2_general["government"], dict):
        respondent_type = RespondentType.GOVERNMENT
        gov_data = step2_general["government"]
        if "agencyName" in gov_data and not "name" in gov_data:
            gov_data["name"] = gov_data["agencyName"] 
        respondent_data = process_nested_fields(gov_data)
    
    elif "corporate" in step2_general and isinstance(step2_general["corporate"], dict):
        respondent_type = RespondentType.CORPORATE
        corp_data = step2_general["corporate"]
        if "companyName" in corp_data and not "name" in corp_data:
            corp_data["name"] = corp_data["companyName"]
        respondent_data = process_nested_fields(corp_data)
    
    elif "individual" in step2_general and isinstance(step2_general["individual"], dict):
        nested_result = check_nested_respondent(step2_general["individual"])
        respondent_type = nested_result["type"]
        respondent_data = nested_result["data"]
    
    return {
        "data": respondent_data, 
        "type": respondent_type
    }

def check_nested_respondent(individual_data: Dict) -> Dict:
    """ตรวจสอบข้อมูลซ้อนในส่วนของ individual"""
    respondent_data = {}
    respondent_type = RespondentType.INDIVIDUAL
    
    if "government" in individual_data and isinstance(individual_data["government"], dict):
        respondent_type = RespondentType.GOVERNMENT
        gov_data = individual_data["government"]
        if "agencyName" in gov_data and not "name" in gov_data:
            gov_data["name"] = gov_data["agencyName"]
        respondent_data = process_nested_fields(gov_data)
        
    elif "corporate" in individual_data and isinstance(individual_data["corporate"], dict):
        respondent_type = RespondentType.CORPORATE
        corp_data = individual_data["corporate"]
        if "companyName" in corp_data and not "name" in corp_data:
            corp_data["name"] = corp_data["companyName"]
        respondent_data = process_nested_fields(corp_data)
        
    elif "individual" in individual_data and isinstance(individual_data["individual"], dict):
        inner_individual = individual_data["individual"]
        
        if "government" in inner_individual and isinstance(inner_individual["government"], dict):
            respondent_type = RespondentType.GOVERNMENT
            gov_data = inner_individual["government"]
            if "agencyName" in gov_data and not "name" in gov_data:
                gov_data["name"] = gov_data["agencyName"]
            respondent_data = process_nested_fields(gov_data)
        elif "corporate" in inner_individual and isinstance(inner_individual["corporate"], dict):
            respondent_type = RespondentType.CORPORATE
            corp_data = inner_individual["corporate"]
            if "companyName" in corp_data and not "name" in corp_data:
                corp_data["name"] = corp_data["companyName"]
            respondent_data = process_nested_fields(corp_data)
        else:
            respondent_type = RespondentType.INDIVIDUAL
            respondent_data = process_nested_fields(inner_individual)
    else:
        respondent_data = process_nested_fields(individual_data)
    
    return {
        "data": respondent_data, 
        "type": respondent_type
    }

def process_nested_fields(data: Dict) -> Dict:
    """ประมวลผลข้อมูลแบบ nested fields ให้อยู่ในรูปแบบที่เหมาะสม"""
    result = {}
    
    if not isinstance(data, dict):
        return result
    
    for key, value in data.items():
        if isinstance(value, dict):
            result[key] = process_nested_fields(value)
        elif isinstance(value, list):
            processed_list = []
            for item in value:
                if isinstance(item, dict):
                    processed_list.append(process_nested_fields(item))
                else:
                    processed_list.append(item)
            result[key] = processed_list
        else:
            if isinstance(value, str):
                value = value.strip()
            if value is not None and value != "":
                result[key] = value
    
    return result

def extract_incident_location(complaint_data: Dict) -> Dict:
    """สกัดข้อมูลสถานที่สำหรับรายงานตามลำดับความสำคัญ"""
    incident_location = {}
    
    # Priority 1: สถานที่เกิดเหตุที่ระบุชัดเจน
    step3 = complaint_data.get("step3", {})
    general = step3.get("general", {})
    
    if "incidentLocation" in general:
        incident_location = extract_location_data(general["incidentLocation"])
        if incident_location:
            return normalize_location_data(incident_location)
    
    # Priority 2: ที่อยู่ผู้ถูกร้องเรียน
    step2 = complaint_data.get("step2", {}).get("general", {})
    respondent_location = extract_respondent_location(step2)
    
    if respondent_location:
        return normalize_location_data(respondent_location)
    
    # Priority 3: ที่อยู่ผู้ร้องเรียน
    complainant_location = fallback_to_step1_location(complaint_data)
    
    if complainant_location:
        return normalize_location_data(complainant_location)
    
    return {}

def extract_location_data(location_data: Dict) -> Dict:
    """สกัดข้อมูลที่อยู่จากโครงสร้างข้อมูลที่อยู่"""
    if not isinstance(location_data, dict):
        return {}
    
    location = {}
    
    if "province" in location_data:
        province_data = location_data["province"]
        if isinstance(province_data, dict):
            location["incident_province_id"] = province_data.get("value")
            location["incident_province"] = province_data.get("label")
        elif isinstance(province_data, str):
            location["incident_province"] = province_data
    
    if "districts" in location_data:
        district_data = location_data["districts"]
        if isinstance(district_data, dict):
            location["incident_district_id"] = district_data.get("value")
            location["incident_district"] = district_data.get("label")
        elif isinstance(district_data, str):
            location["incident_district"] = district_data
    
    if "subdistricts" in location_data:
        subdistrict_data = location_data["subdistricts"]
        if isinstance(subdistrict_data, dict):
            location["incident_subdistrict_id"] = subdistrict_data.get("value")
            location["incident_subdistrict"] = subdistrict_data.get("label")
        elif isinstance(subdistrict_data, str):
            location["incident_subdistrict"] = subdistrict_data
    
    return {k: v for k, v in location.items() if v}

def extract_complainant_location(step1_general: Dict) -> Dict:
    """ดึงข้อมูลที่อยู่ผู้ร้องเรียนตามประเภท"""
    location = {}
    
    active_type = step1_general.get("activeType", "general")
    
    complainant_data = None
    if active_type == "corporate" and "corporate" in step1_general:
        complainant_data = step1_general["corporate"]
    elif active_type in ["general", "individual"] and "general" in step1_general:
        complainant_data = step1_general["general"]
    elif "general" in step1_general:
        complainant_data = step1_general["general"]
    elif "corporate" in step1_general:
        complainant_data = step1_general["corporate"]
    
    if isinstance(complainant_data, dict):
        location = extract_address_fields(complainant_data, "incident")
    
    return location

def extract_respondent_location(step2_general: Dict) -> Dict:
    """ดึงข้อมูลที่อยู่ผู้ถูกร้องเรียนตามประเภท"""
    location = {}
    
    active_type = step2_general.get("activeType", "individual")
    respondent_data = step2_general.get(active_type, {})
    
    if active_type == "individual" and isinstance(respondent_data, dict):
        if "corporate" in respondent_data:
            respondent_data = respondent_data["corporate"]
        elif "government" in respondent_data:
            respondent_data = respondent_data["government"]
        elif "individual" in respondent_data:
            respondent_data = respondent_data["individual"]
    
    if isinstance(respondent_data, dict):
        location = extract_address_fields(respondent_data, "incident")
    
    return location

def extract_address_fields(data: Dict, prefix: str = "incident") -> Dict:
    """สกัดข้อมูลที่อยู่จากข้อมูลบุคคลหรือองค์กร"""
    location = {}
    
    if not isinstance(data, dict):
        return location
    
    if "province" in data:
        province_data = data["province"]
        if isinstance(province_data, dict):
            location[f"{prefix}_province_id"] = province_data.get("value")
            location[f"{prefix}_province"] = province_data.get("label")
        elif isinstance(province_data, str):
            location[f"{prefix}_province"] = province_data
    
    if "districts" in data:
        district_data = data["districts"]
        if isinstance(district_data, dict):
            location[f"{prefix}_district_id"] = district_data.get("value")
            location[f"{prefix}_district"] = district_data.get("label")
        elif isinstance(district_data, str):
            location[f"{prefix}_district"] = district_data
    
    if "subdistricts" in data:
        subdistrict_data = data["subdistricts"]
        if isinstance(subdistrict_data, dict):
            location[f"{prefix}_subdistrict_id"] = subdistrict_data.get("value")
            location[f"{prefix}_subdistrict"] = subdistrict_data.get("label")
        elif isinstance(subdistrict_data, str):
            location[f"{prefix}_subdistrict"] = subdistrict_data
    
    # รองรับกรณีที่ใช้ชื่อ field แตกต่างกัน
    if "amphur" in data or "amphure" in data:
        amphur_data = data.get("amphur", data.get("amphure"))
        if isinstance(amphur_data, dict):
            location[f"{prefix}_district_id"] = amphur_data.get("value")
            location[f"{prefix}_district"] = amphur_data.get("label")
        elif isinstance(amphur_data, str):
            location[f"{prefix}_district"] = amphur_data
    
    if "tambon" in data or "district" in data:
        tambon_data = data.get("tambon", data.get("district"))
        if isinstance(tambon_data, dict):
            location[f"{prefix}_subdistrict_id"] = tambon_data.get("value")
            location[f"{prefix}_subdistrict"] = tambon_data.get("label")
        elif isinstance(tambon_data, str):
            location[f"{prefix}_subdistrict"] = tambon_data
    
    return {k: v for k, v in location.items() if v}

def fallback_to_step1_location(complaint_data: Dict) -> Dict:
    """ใช้ที่อยู่ผู้ร้องเรียนเป็นทางเลือกสำรอง"""
    step1 = complaint_data.get("step1", {}).get("general", {})
    return extract_complainant_location(step1)

def check_province_only_data(location_data: Dict) -> bool:
    """ตรวจสอบว่ามีข้อมูลเฉพาะจังหวัดหรือไม่"""
    has_province = bool(location_data.get("incident_province_id") or location_data.get("incident_province"))
    has_district = bool(location_data.get("incident_district_id") or location_data.get("incident_district"))
    has_subdistrict = bool(location_data.get("incident_subdistrict_id") or location_data.get("incident_subdistrict"))
    
    return has_province and not has_district and not has_subdistrict

def normalize_location_data(location_data: Dict) -> Dict:
    """ปรับปรุงและทำให้ข้อมูลที่อยู่เป็นมาตรฐาน"""
    normalized = {}
    
    for key, value in location_data.items():
        if value and str(value).strip():
            normalized[key] = str(value).strip()
    
    return normalized

def get_best_available_location(complaint_data: Dict) -> Dict:
    """ดึงข้อมูลที่อยู่ที่ดีที่สุดที่มีอยู่"""
    location = extract_incident_location(complaint_data)
    
    if not location:
        all_locations = []
        
        step1_location = fallback_to_step1_location(complaint_data)
        if step1_location:
            all_locations.append(("complainant", step1_location))
        
        step2_location = extract_respondent_location(complaint_data.get("step2", {}).get("general", {}))
        if step2_location:
            all_locations.append(("respondent", step2_location))
        
        best_location = None
        best_score = 0
        
        for source, loc_data in all_locations:
            score = 0
            if loc_data.get("incident_province_id") or loc_data.get("incident_province"):
                score += 1
            if loc_data.get("incident_district_id") or loc_data.get("incident_district"):
                score += 2
            if loc_data.get("incident_subdistrict_id") or loc_data.get("incident_subdistrict"):
                score += 4
            
            if score > best_score:
                best_score = score
                best_location = loc_data
        
        location = best_location or {}
    
    return normalize_location_data(location)

def prepare_complaint_model_data(
    db: Session, 
    complaint_data: Dict, 
    original_data: Dict, 
    extracted_data: Dict, 
    root_complaint_type: str, 
    user_id: Optional[UUID]
) -> Dict:
    """เตรียมข้อมูลสำหรับสร้าง Complaint model"""
    complaint_number = generate_complaint_number(db)
    
    subject = extracted_data["subject"]
    description = extracted_data["description"]
    original_complaint_type = extracted_data["complaint_type"]
    incident_date = extracted_data["incident_date"]
    accepted = extracted_data["accepted"]
    complainant_data = extracted_data["complainant_data"]
    complainant_type = extracted_data["complainant_type"]
    delegate_data = extracted_data["delegate_data"]
    respondent_data = extracted_data["respondent_data"]
    respondent_type = extracted_data["respondent_type"]
    
    # แมปและตรวจสอบ complaint_type ให้ตรงกับที่มีในฐานข้อมูล
    complaint_type = map_complaint_type(db, original_complaint_type)
    
    complaint_type_id = None
    complaint_subtype_id = None
    complaint_channel_id = None
    
    # ค้นหาและเชื่อมโยง complaint_type_id
    if complaint_type:
        complaint_type_record = db.query(ComplaintType).filter(
            ComplaintType.name == complaint_type,
            ComplaintType.is_active == True
        ).first()
        
        if complaint_type_record:
            complaint_type_id = complaint_type_record.id
            
            if complaint_type != original_complaint_type:
                if "step3" in original_data and "general" in original_data["step3"]:
                    original_data["step3"]["general"]["original_complaint_type"] = original_complaint_type
                    original_data["step3"]["general"]["complaintType"] = complaint_type
            
            step3 = original_data.get("step3", {}).get("general", {})
            complaint_subtype = step3.get("complaintSubtype")
            
            if complaint_subtype and isinstance(complaint_subtype, str):
                complaint_subtype_record = db.query(ComplaintSubType).filter(
                    ComplaintSubType.name == complaint_subtype,
                    ComplaintSubType.parent_type_id == complaint_type_id,
                    ComplaintSubType.is_active == True
                ).first()
                
                if complaint_subtype_record:
                    complaint_subtype_id = complaint_subtype_record.id
    
    # ค้นหา complaint_channel จากข้อมูล
    complaint_channel = original_data.get("step3", {}).get("general", {}).get("channel")
    if complaint_channel and isinstance(complaint_channel, str):
        complaint_channel_record = db.query(ComplaintChannel).filter(
            ComplaintChannel.name == complaint_channel,
            ComplaintChannel.is_active == True
        ).first()
        
        if complaint_channel_record:
            complaint_channel_id = complaint_channel_record.id
        else:
            default_channel = db.query(ComplaintChannel).filter(ComplaintChannel.name == "ออนไลน์").first()
            if default_channel:
                complaint_channel_id = default_channel.id
    else:
        default_channel = db.query(ComplaintChannel).filter(ComplaintChannel.name == "ออนไลน์").first()
        if default_channel:
            complaint_channel_id = default_channel.id
    
    # กำหนดค่าเริ่มต้นถ้าจำเป็น
    if not subject and complainant_data and respondent_data:
        subject = "ทดสอบเรื่องร้องเรียน"
    
    if not complainant_data and respondent_data:
        complainant_data = {"name": "ผู้ร้องเรียนทั่วไป", "email": "anonymous@example.com"}
    
    # ตรวจสอบข้อมูลที่จำเป็น
    if not subject:
        raise ValueError("Subject is required")
        
    if not complainant_data:
        raise ValueError("Complainant data is required")
        
    if not respondent_data:
        raise ValueError("Respondent data is required")
    
    # อัพเดต complaintType ในข้อมูลต้นฉบับ
    if complaint_type:
        ensure_complaint_type_consistency(complaint_data, complaint_type)
        ensure_complaint_type_consistency(original_data, complaint_type)
    
    # แปลงข้อมูลเป็น JSON
    complainant_data_json = convert_to_db_json(complainant_data)
    respondent_data_json = convert_to_db_json(respondent_data)
    delegate_data_json = convert_to_db_json(delegate_data) if delegate_data else None
    full_complaint_data_json = convert_to_db_json(original_data)
    
    # เพิ่มการดึงข้อมูลสถานที่เกิดเหตุ
    incident_location = get_best_available_location(complaint_data)
    
    # ตรวจสอบความถูกต้องของข้อมูลทางภูมิศาสตร์
    verified_location = verify_geographic_data(db, incident_location)
    
    # เพิ่มการดึงข้อมูลระดับความลับและความเร่งด่วน
    confidentiality_level = original_data.get("step3", {}).get("general", {}).get("confidentialityLevel", "NORMAL")
    urgency_level = original_data.get("step3", {}).get("general", {}).get("urgencyLevel", "LOW") 
    severity_level = original_data.get("step3", {}).get("general", {}).get("severityLevel", "LOW")
    
    # จัดเตรียมข้อมูลสำหรับสร้าง model
    result = {
        "complaint_number": complaint_number,
        "subject": subject,
        "description": description,
        "status": ComplaintStatus.SUBMITTED,
        "complainant_data": complainant_data_json,
        "complainant_type": complainant_type,
        "delegate_data": delegate_data_json,
        "respondent_data": respondent_data_json,
        "respondent_type": respondent_type,
        "incident_date": incident_date,
        "complaint_type": complaint_type,
        "complaint_type_id": complaint_type_id,
        "complaint_subtype_id": complaint_subtype_id,
        "complaint_channel_id": complaint_channel_id,
        "terms_accepted": accepted,
        "full_complaint_data": full_complaint_data_json,
        "created_by": user_id,
        
        "incident_province_id": verified_location.get("incident_province_id") or incident_location.get("incident_province_id"),
        "incident_province": verified_location.get("incident_province") or incident_location.get("incident_province"),
        "incident_district_id": verified_location.get("incident_district_id") or incident_location.get("incident_district_id"),
        "incident_district": verified_location.get("incident_district") or incident_location.get("incident_district"),
        "incident_subdistrict_id": verified_location.get("incident_subdistrict_id") or incident_location.get("incident_subdistrict_id"),
        "incident_subdistrict": verified_location.get("incident_subdistrict") or incident_location.get("incident_subdistrict"),
        "confidentiality_level": confidentiality_level,
        "urgency_level": urgency_level,
        "severity_level": severity_level,
    }
    
    return result

def update_complaint_details(db: Session, complaint_id: UUID, update_data: Dict, user_id: Optional[UUID] = None) -> Optional[Complaint]:
    """อัพเดทข้อมูลรายละเอียดเพิ่มเติมของเรื่องร้องเรียน"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return None
    
    updatable_fields = [
        "confidentiality_level", "urgency_level", "severity_level",
        "incident_province_id", "incident_province", 
        "incident_district_id", "incident_district",
        "incident_subdistrict_id", "incident_subdistrict",
        "assigned_officer_id", "progress_percentage", "processing_notes",
        "satisfaction_rating", "satisfaction_comment", 
        "parent_complaint_id", "related_complaints"
    ]
    
    for field in updatable_fields:
        if field in update_data:
            setattr(complaint, field, update_data[field])
    
    complaint.updated_at = datetime.now()
    
    db.commit()
    db.refresh(complaint)
    return complaint

def add_related_complaint(db: Session, complaint_id: UUID, related_complaint_id: UUID) -> bool:
    """เพิ่มความสัมพันธ์ระหว่างเรื่องร้องเรียน"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return False
    
    related_complaint = db.query(Complaint).filter(Complaint.id == related_complaint_id).first()
    if not related_complaint:
        return False
    
    related_complaints = []
    if complaint.related_complaints:
        if isinstance(complaint.related_complaints, str):
            try:
                related_complaints = json.loads(complaint.related_complaints)
            except:
                related_complaints = []
        elif isinstance(complaint.related_complaints, list):
            related_complaints = complaint.related_complaints
    
    if str(related_complaint_id) not in [str(x) for x in related_complaints]:
        related_complaints.append(str(related_complaint_id))
        
    complaint.related_complaints = json.dumps(related_complaints)
    complaint.updated_at = datetime.now()
    
    db.commit()
    return True

def convert_to_db_json(data):
    """Convert Python dictionary to proper JSON format for database storage."""
    if data is None:
        return None
    
    if isinstance(data, str):
        return data
        
    return json.dumps(data)

def generate_complaint_number(db: Session) -> str:
    """สร้างเลขที่ข้อร้องเรียนแบบอัตโนมัติ"""
    today = datetime.now()
    date_part = today.strftime("%Y%m%d")
    
    today_start = datetime.combine(today.date(), datetime.min.time())
    today_end = datetime.combine(today.date(), datetime.max.time())
    
    today_count = db.query(Complaint).filter(
        Complaint.created_at.between(today_start, today_end)
    ).count()
    
    sequence = str(today_count + 1).zfill(5)
    return f"CMPL-{date_part}-{sequence}"

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
    assignee: Optional[str] = None,
    location: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None
):
    """ดึงรายการข้อร้องเรียนพร้อมการแบ่งหน้าและ filter ขั้นสูง"""
    query = db.query(Complaint)
    
    # Filter by status
    if status:
        query = query.filter(Complaint.status == status)
    
    # Filter by complaint type
    if complaint_type:
        query = query.filter(Complaint.complaint_type.ilike(f"%{complaint_type}%"))
    
    # Filter by assignee
    if assignee:
        query = query.filter(
            (Complaint.assigned_to.ilike(f"%{assignee}%")) |
            (Complaint.assigned_officer_id.isnot(None))
        )
    
    # Filter by location
    if location:
        query = query.filter(
            (Complaint.incident_province.ilike(f"%{location}%")) |
            (Complaint.incident_district.ilike(f"%{location}%")) |
            (Complaint.incident_subdistrict.ilike(f"%{location}%"))
        )
    
    # Filter by urgency
    if urgency:
        query = query.filter(Complaint.urgency_level == urgency)
    
    # Search in multiple fields
    if search:
        search_filter = (
            Complaint.complaint_number.ilike(f"%{search}%") |
            Complaint.subject.ilike(f"%{search}%") |
            Complaint.description.ilike(f"%{search}%") |
            Complaint.complaint_type.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    total_count = query.count()
    query = query.order_by(Complaint.created_at.desc())
    complaints = query.offset(skip).limit(limit).all()
    
    result = []
    for complaint in complaints:
        try:
            list_item = create_complaint_list_item(complaint, db)  # ✅ ส่ง db parameter
            result.append(list_item.__dict__)
        except Exception as e:
            if DEBUG_MODE:
                print(f"Error creating list item: {str(e)}")
            continue
    
    # ✅ เพิ่มข้อมูล filters สำหรับ frontend
    filters = get_filter_options(db)
    
    return {
        "items": result,
        "pagination": {
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": total_count > (skip + limit)
        },
        "filters": filters  # ✅ เพิ่มส่วนนี้
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
    complainant_data = ensure_dict(complaint.complainant_data)
    complainant_name = complainant_data.get("name", "")
    
    respondent_data = ensure_dict(complaint.respondent_data)
    respondent_name = ""
    if complaint.respondent_type == RespondentType.INDIVIDUAL:
        respondent_name = respondent_data.get("name", "")
    elif complaint.respondent_type == RespondentType.CORPORATE:
        respondent_name = respondent_data.get("companyName", respondent_data.get("name", ""))
    elif complaint.respondent_type == RespondentType.GOVERNMENT:
        respondent_name = respondent_data.get("agencyName", respondent_data.get("name", ""))
    
    # เพิ่มข้อมูลประเภทเรื่องร้องเรียน
    complaint_type_thai = get_thai_complaint_type(complaint.complaint_type)
    
    # เพิ่มข้อมูลสถานที่เกิดเหตุ
    incident_location = ""
    if complaint.incident_province:
        incident_location = complaint.incident_province
        if complaint.incident_district:
            incident_location += f" > {complaint.incident_district}"
        if complaint.incident_subdistrict:
            incident_location += f" > {complaint.incident_subdistrict}"
    
    # เพิ่มข้อมูลผู้รับผิดชอบ
    assigned_info = ""
    if complaint.assigned_to:
        assigned_info = complaint.assigned_to
    elif complaint.assigned_officer_id and db:  # ✅ ตรวจสอบ db ก่อนใช้
        try:
            from models.user import User
            assigned_officer = db.query(User).filter(User.id == complaint.assigned_officer_id).first()
            if assigned_officer:
                assigned_info = f"{assigned_officer.first_name} {assigned_officer.last_name}"
        except:
            assigned_info = "มอบหมายแล้ว"
    elif complaint.assigned_officer_id:
        assigned_info = "มอบหมายแล้ว"
    
    # เพิ่มข้อมูลสถานะภาษาไทย
    status_thai = get_thai_status(complaint.status)
    
    return ComplaintListItem(
        id=complaint.id,
        complaint_number=complaint.complaint_number,
        subject=complaint.subject,
        complaint_type=complaint_type_thai,
        status=status_thai,
        created_at=complaint.created_at,
        complainant_name=complainant_name,
        respondent_name=respondent_name,
        incident_location=incident_location,
        assigned_to=assigned_info,
        urgency_level=complaint.urgency_level or "LOW",
        severity_level=complaint.severity_level or "LOW"
    )

def get_thai_complaint_type(complaint_type: str) -> str:
    """แปลงประเภทเรื่องร้องเรียนเป็นภาษาไทย"""
    type_mapping = {
        "fraud": "ฉ้อโกง",
        "corruption": "ทุจริต", 
        "service": "บริการ",
        "product": "สินค้าและบริการ",
        "other": "อื่นๆ"
    }
    return type_mapping.get(complaint_type, complaint_type)

def get_thai_status(status: str) -> str:
    """แปลงสถานะเป็นภาษาไทย"""
    status_mapping = {
        "submitted": "รับเรื่อง",
        "sent_to_agency": "ส่งหน่วยงาน",
        "in_process": "กำลังดำเนินการ",
        "in_review": "อยู่ระหว่างพิจารณา",
        "tracking": "ติดตามผล",
        "reviewed": "แจ้งผลการพิจารณา",
        "completed": "เสร็จสิ้น"
    }
    return status_mapping.get(status, status)

def ensure_dict(data):
    """ตรวจสอบให้แน่ใจว่าข้อมูลเป็น dictionary"""
    if isinstance(data, str):
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            return {}
    elif isinstance(data, dict):
        return data
    return {}

def get_complaint(db: Session, complaint_id: uuid.UUID):
    """ดึงข้อมูลข้อร้องเรียนแบบละเอียด"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return None
    
    attachment_list = get_complaint_attachments(complaint)
    status_history = get_complaint_status_history(db, complaint_id)
    
    full_complaint_data = complaint.full_complaint_data
    if isinstance(full_complaint_data, str):
        try:
            full_complaint_data = json.loads(full_complaint_data)
        except Exception as e:
            full_complaint_data = {}
    
    complainant_data = complaint.complainant_data
    if isinstance(complainant_data, str):
        try:
            complainant_data = json.loads(complainant_data)
        except Exception as e:
            complainant_data = {}
    
    respondent_data = complaint.respondent_data
    if isinstance(respondent_data, str):
        try:
            respondent_data = json.loads(respondent_data)
        except Exception as e:
            respondent_data = {}
    
    complaint.full_complaint_data = full_complaint_data
    complaint.complainant_data = complainant_data
    complaint.respondent_data = respondent_data
    
    if full_complaint_data and isinstance(full_complaint_data, dict) and "step1" in full_complaint_data:
        response_data = {
            "id": complaint.id,
            "complaint_number": complaint.complaint_number,
            **full_complaint_data,
            "status": complaint.status,
            "status_history": status_history,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at,
            "assigned_to": complaint.assigned_to,
            "assigned_date": complaint.assigned_date,
            "resolution_summary": complaint.resolution_summary,
            "resolved_date": complaint.resolved_date
        }
        
        if "step3" in response_data and "general" in response_data["step3"]:
            response_data["step3"]["general"]["attachment"] = attachment_list
        
        return response_data
    
    return reconstruct_complaint_data(complaint, attachment_list, status_history)

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
    query = db.query(Complaint).filter(Complaint.created_by == user_id)
    
    if status:
        query = query.filter(Complaint.status == status)
    
    total_count = query.count()
    query = query.order_by(Complaint.created_at.desc())
    complaints = query.offset(skip).limit(limit).all()
    
    result = []
    for complaint in complaints:
        try:
            list_item = create_complaint_list_item(complaint, db)  # ✅ ส่ง db parameter
            result.append(list_item.__dict__)  # ✅ แปลงเป็น dict
        except Exception as e:
            if DEBUG_MODE:
                print(f"Error processing complaint {complaint.id}: {str(e)}")
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

def get_user_complaint_detail(db: Session, user_id: UUID, complaint_id: UUID):
    """ดึงข้อมูลข้อร้องเรียนแบบละเอียดของผู้ใช้เฉพาะราย"""
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.created_by == user_id
    ).first()
    
    if not complaint:
        return None
    
    return get_complaint(db, complaint_id)

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
    """กลยุทธ์การหาข้อมูลที่อยู่สำรอง"""
    strategies = []
    
    try:
        # Strategy 1: ที่อยู่ผู้ถูกร้องเรียน
        step2_location = extract_respondent_location(complaint_data.get("step2", {}).get("general", {}))
        if step2_location:
            strategies.append(("respondent", step2_location))
        
        # Strategy 2: ที่อยู่ผู้ร้องเรียน
        step1_location = fallback_to_step1_location(complaint_data)
        if step1_location:
            strategies.append(("complainant", step1_location))
        
        # Strategy 3: สถานที่เกิดเหตุที่ระบุโดยตรง
        step3 = complaint_data.get("step3", {}).get("general", {})
        if "incidentLocation" in step3:
            incident_loc = extract_location_data(step3["incidentLocation"])
            if incident_loc:
                strategies.append(("incident", incident_loc))
        
        # เลือกกลยุทธ์ที่ดีที่สุด
        best_strategy = None
        best_score = 0
        
        for strategy_name, location in strategies:
            score = calculate_location_completeness_score(location)
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