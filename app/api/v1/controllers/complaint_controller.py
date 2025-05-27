import uuid
import json
import traceback
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

def save_original_complaint(complaint_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    บันทึกข้อมูลตามโครงสร้าง step1-step4 ตามที่ได้รับจากหน้าบ้าน
    """
    import copy
    result = {
        "step1": copy.deepcopy(complaint_data.get("step1", {})),
        "step2": copy.deepcopy(complaint_data.get("step2", {})),
        "step3": copy.deepcopy(complaint_data.get("step3", {})),
        "step4": copy.deepcopy(complaint_data.get("step4", {}))
    }
    
    # ตรวจสอบและอัพเดต complaintType ในข้อมูล
    if "complaintType" in complaint_data and complaint_data["complaintType"]:
        # ตรวจสอบและสร้างโครงสร้าง step3.general ถ้าจำเป็น
        if "step3" not in result:
            result["step3"] = {"general": {}}
        elif "general" not in result["step3"]:
            result["step3"]["general"] = {}
            
        # บันทึกค่า complaintType
        result["step3"]["general"]["complaintType"] = complaint_data["complaintType"]
    
    return result

def create_complaint(db: Session, complaint_data: Dict[str, Any], user_id: Optional[UUID] = None) -> Complaint:
    """สร้างข้อร้องเรียนใหม่"""
    try:
        # แปลงข้อมูล formData ถ้ามีก่อน
        if "formData" in complaint_data:
            complaint_data = complaint_data["formData"]

        # เก็บค่า complaintType จาก root level ไว้ก่อน เพราะมีความสำคัญ
        root_complaint_type = complaint_data.get("complaintType", "")

        # Check if data is in flat format and convert to step format if needed
        if "subject" in complaint_data and "step1" not in complaint_data:
            # สร้างโครงสร้างข้อมูลแบบมีประสิทธิภาพ
            structured_data = convert_flat_to_structured(complaint_data, root_complaint_type)
            complaint_data = structured_data
        elif root_complaint_type:
            # รักษาค่า complaintType ไว้ในข้อมูลทุกระดับที่จำเป็น
            ensure_complaint_type_consistency(complaint_data, root_complaint_type)
           
        # 1. เก็บข้อมูลดิบทั้งหมดแบบ JSON object
        original_data = save_original_complaint(complaint_data)
        
        # 2. แยกข้อมูลตามขั้นตอนและประมวลผลเฉพาะส่วนที่จำเป็น
        extracted_data = extract_complaint_data(complaint_data, root_complaint_type)
        
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
        
        return new_complaint
        
    except Exception as e:
        db.rollback()
        print(f"Error in create_complaint: {str(e)}")
        traceback.print_exc()
        raise

def convert_flat_to_structured(flat_data: Dict[str, Any], root_complaint_type: str) -> Dict[str, Any]:
    """แปลงข้อมูลจากรูปแบบ flat เป็น structured"""
    # สร้างโครงสร้างพื้นฐาน
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
    
    # จัดการข้อมูลผู้ร้องเรียน
    handle_complainant_data(structured_data, flat_data)
    
    # จัดการข้อมูลผู้ถูกร้องเรียน
    handle_respondent_data(structured_data, flat_data)
    
    # รักษาค่า complaintType
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
        
        # Handle the nested structure
        if not structured_data["step1"]["general"]["general"] and isinstance(flat_data.get("complainant_data", {}), dict):
            structured_data["step1"]["general"]["general"] = flat_data.get("complainant_data", {})
        
    elif complainant_type.lower() == "corporate":
        structured_data["step1"]["general"]["activeType"] = "corporate"
        structured_data["step1"]["general"]["corporate"] = flat_data.get("complainant_data", {}).get("corporate", {})
        
        # Handle the nested structure
        if not structured_data["step1"]["general"]["corporate"] and isinstance(flat_data.get("complainant_data", {}), dict):
            structured_data["step1"]["general"]["corporate"] = flat_data.get("complainant_data", {})
        
        # Handle signer
        if "signer" in flat_data:
            structured_data["step1"]["general"]["signer"] = flat_data.get("signer", {})
        elif "signer" in flat_data.get("complainant_data", {}):
            structured_data["step1"]["general"]["signer"] = flat_data.get("complainant_data", {}).get("signer", {})
    
    # Handle delegate
    if "delegate_data" in flat_data:
        structured_data["step1"]["general"]["delegate"] = flat_data.get("delegate_data", {})
    elif "delegate" in flat_data.get("complainant_data", {}):
        structured_data["step1"]["general"]["delegate"] = flat_data.get("complainant_data", {}).get("delegate", {})

def handle_respondent_data(structured_data: Dict, flat_data: Dict):
    """จัดการข้อมูลผู้ถูกร้องเรียน"""
    respondent_type = flat_data.get("respondent_type", "individual")
    respondent_type_lower = respondent_type.lower() if isinstance(respondent_type, str) else "individual"
    respondent_data = flat_data.get("respondent_data", {})
    
    # ตรวจสอบข้อมูลเฉพาะ
    if "corporate" in respondent_data:
        structured_data["step2"]["general"]["activeType"] = "corporate"
        structured_data["step2"]["general"]["corporate"] = respondent_data
    elif "government" in respondent_data:
        structured_data["step2"]["general"]["activeType"] = "government"
        structured_data["step2"]["general"]["government"] = respondent_data
    else:
        # กำหนดตามประเภทที่ระบุ
        structured_data["step2"]["general"]["activeType"] = respondent_type_lower
        structured_data["step2"]["general"][respondent_type_lower] = respondent_data

def ensure_complaint_type_consistency(data: Dict, complaint_type: str):
    """ตรวจสอบความสอดคล้องของ complaintType ในทุกระดับ"""
    if not complaint_type:
        return
        
    # อัพเดตที่ root level
    data["complaintType"] = complaint_type
    
    # อัพเดตใน step3.general ถ้ามี
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
    
    # ลำดับความสำคัญในการดึงค่า complaintType
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
    
    # ใช้ค่าที่เก็บไว้ถ้ายังไม่มีค่า
    if not complaint_type and root_complaint_type:
        complaint_type = root_complaint_type
    
    # ข้อมูลการยอมรับเงื่อนไข
    accepted = True
    if "general" in step4:
        accepted = step4["general"].get("accepted", True)
    
    # ประมวลผลข้อมูลผู้ร้องเรียน
    complainant_result = process_complainant_data(step1)
    
    # ประมวลผลข้อมูลผู้ถูกร้องเรียน
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
        
        # ตรวจสอบประเภทผู้ร้องเรียน
        if "corporate" in step1_general:
            # เป็นนิติบุคคล
            complainant_type = ComplainantType.CORPORATE
            complainant_data = process_nested_fields(step1_general["corporate"])
            
            # กรณีนิติบุคคล มีข้อมูลผู้ลงนาม
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
        
        # ข้อมูลตัวแทน/ผู้รับมอบอำนาจ
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
    
    # ประมวลผลข้อมูลตามโครงสร้าง
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
        # ตรวจสอบข้อมูลซ้อนใน individual
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

# เพิ่มฟังก์ชันนี้ก่อนฟังก์ชัน process_complainant_data (ประมาณบรรทัดที่ 245-250)

def process_nested_fields(data: Dict) -> Dict:
    """
    ประมวลผลข้อมูลแบบ nested fields ให้อยู่ในรูปแบบที่เหมาะสม
    ทำความสะอาดและจัดรูปแบบข้อมูลก่อนบันทึก
    """
    result = {}
    
    # ถ้า data ไม่ใช่ dictionary ให้คืนค่าเป็น dictionary ว่าง
    if not isinstance(data, dict):
        return result
    
    # คัดลอกข้อมูลและทำความสะอาดข้อมูล
    for key, value in data.items():
        # กรณีเป็น dictionary ซ้อน ให้ประมวลผลต่อซ้อนลงไป
        if isinstance(value, dict):
            result[key] = process_nested_fields(value)
        # กรณีเป็น list ที่มี dictionary อยู่ภายใน
        elif isinstance(value, list):
            processed_list = []
            for item in value:
                if isinstance(item, dict):
                    processed_list.append(process_nested_fields(item))
                else:
                    processed_list.append(item)
            result[key] = processed_list
        # กรณีเป็นค่าธรรมดา
        else:
            # ทำความสะอาดข้อมูล string
            if isinstance(value, str):
                # ตัดช่องว่างหน้าหลัง
                value = value.strip()
            # บันทึกเฉพาะข้อมูลที่ไม่เป็นค่าว่าง
            if value is not None and value != "":
                result[key] = value
    
    return result

def extract_incident_location(complaint_data: Dict) -> Dict:
    """สกัดข้อมูลสถานที่เกิดเหตุจากข้อมูลร้องเรียน"""
    incident_location = {}
    
    # Strategy 1: ดึงจาก step3.general.incidentLocation (ถ้ามี)
    step3 = complaint_data.get("step3", {})
    general = step3.get("general", {})
    
    if "incidentLocation" in general and isinstance(general["incidentLocation"], dict):
        location = general["incidentLocation"]
        # สกัดข้อมูล province
        if "province" in location and isinstance(location["province"], dict):
            incident_location["incident_province_id"] = location["province"].get("value")
            incident_location["incident_province"] = location["province"].get("label")
        
        # สกัดข้อมูล district
        if "districts" in location and isinstance(location["districts"], dict):
            incident_location["incident_district_id"] = location["districts"].get("value")
            incident_location["incident_district"] = location["districts"].get("label")
        
        # สกัดข้อมูล subdistrict
        if "subdistricts" in location and isinstance(location["subdistricts"], dict):
            incident_location["incident_subdistrict_id"] = location["subdistricts"].get("value")
            incident_location["incident_subdistrict"] = location["subdistricts"].get("label")
    
    # Strategy 2: ถ้าไม่มี incidentLocation ลองดูที่ step3.general โดยตรง
    if not incident_location:
        # ข้อมูลจังหวัด
        if "province" in general and isinstance(general["province"], dict):
            incident_location["incident_province_id"] = general["province"].get("value")
            incident_location["incident_province"] = general["province"].get("label")
            
        # ข้อมูลอำเภอ
        if "districts" in general and isinstance(general["districts"], dict):
            incident_location["incident_district_id"] = general["districts"].get("value")
            incident_location["incident_district"] = general["districts"].get("label")
            
        # ข้อมูลตำบล
        if "subdistricts" in general and isinstance(general["subdistricts"], dict):
            incident_location["incident_subdistrict_id"] = general["subdistricts"].get("value")
            incident_location["incident_subdistrict"] = general["subdistricts"].get("label")
    
    # Strategy 3: ถ้าไม่พบที่เกิดเหตุโดยตรง ใช้ข้อมูลที่อยู่ของผู้ถูกร้องเรียน
    if not incident_location and "step2" in complaint_data:
        step2 = complaint_data.get("step2", {}).get("general", {})
        
        # ตรวจสอบประเภทผู้ถูกร้องเรียน
        active_type = step2.get("activeType")
        respondent_data = None
        
        if active_type == "government" and "government" in step2:
            respondent_data = step2["government"]
        elif active_type == "corporate" and "corporate" in step2:
            respondent_data = step2["corporate"]
        elif active_type in ["individual", "general"] and "individual" in step2:
            respondent_data = step2["individual"]
        
        # สกัดข้อมูลที่อยู่จาก respondent_data
        if respondent_data and isinstance(respondent_data, dict):
            # ข้อมูลจังหวัด
            if "province" in respondent_data and isinstance(respondent_data["province"], dict):
                incident_location["incident_province_id"] = respondent_data["province"].get("value")
                incident_location["incident_province"] = respondent_data["province"].get("label")
                
            # ข้อมูลอำเภอ
            if "districts" in respondent_data and isinstance(respondent_data["districts"], dict):
                incident_location["incident_district_id"] = respondent_data["districts"].get("value")
                incident_location["incident_district"] = respondent_data["districts"].get("label")
                
            # ข้อมูลตำบล
            if "subdistricts" in respondent_data and isinstance(respondent_data["subdistricts"], dict):
                incident_location["incident_subdistrict_id"] = respondent_data["subdistricts"].get("value")
                incident_location["incident_subdistrict"] = respondent_data["subdistricts"].get("label")
    
    # Strategy 4: ถ้ายังไม่พบ ใช้ข้อมูลที่อยู่ของผู้ร้องเรียน
    if not incident_location and "step1" in complaint_data:
        step1 = complaint_data.get("step1", {}).get("general", {})
        
        complainant_data = None
        active_type = step1.get("activeType", "general")
        
        if active_type == "corporate" and "corporate" in step1:
            complainant_data = step1["corporate"]
        elif (active_type == "general" or active_type == "individual") and "general" in step1:
            complainant_data = step1["general"]
        
        # สกัดข้อมูลที่อยู่จาก complainant_data
        if complainant_data and isinstance(complainant_data, dict):
            # ข้อมูลจังหวัด
            if "province" in complainant_data and isinstance(complainant_data["province"], dict):
                incident_location["incident_province_id"] = complainant_data["province"].get("value")
                incident_location["incident_province"] = complainant_data["province"].get("label")
                
            # ข้อมูลอำเภอ
            if "districts" in complainant_data and isinstance(complainant_data["districts"], dict):
                incident_location["incident_district_id"] = complainant_data["districts"].get("value")
                incident_location["incident_district"] = complainant_data["districts"].get("label")
                
            # ข้อมูลตำบล
            if "subdistricts" in complainant_data and isinstance(complainant_data["subdistricts"], dict):
                incident_location["incident_subdistrict_id"] = complainant_data["subdistricts"].get("value")
                incident_location["incident_subdistrict"] = complainant_data["subdistricts"].get("label")
    
    return incident_location

def verify_geographic_data(db: Session, incident_location: Dict) -> Dict:
    """ตรวจสอบและยืนยันความถูกต้องของข้อมูลทางภูมิศาสตร์"""
    verified_data = {}
    
    # ตรวจสอบจังหวัด
    province_id = incident_location.get("incident_province_id")
    province_name = incident_location.get("incident_province")
    
    # กรณีมี province_id ให้ใช้ข้อมูลจากฐานข้อมูลเท่านั้น
    if province_id:
        try:
            # รองรับกรณีที่ province_id อาจเป็นได้ทั้ง int หรือ string
            if isinstance(province_id, str) and province_id.isdigit():
                province_id = int(province_id)
                
            province = db.query(Province).filter(Province.id == province_id).first()
            if province:
                verified_data["incident_province_id"] = province.id
                verified_data["incident_province"] = province.name_th  # ใช้ชื่อจากฐานข้อมูลเสมอ
        except (ValueError, TypeError):
            # กรณีแปลงค่าไม่ได้ ให้ค้นหาจากชื่อแทน
            if province_name:
                province = db.query(Province).filter(
                    (Province.name_th.ilike(f"%{province_name}%")) | 
                    (Province.name_en.ilike(f"%{province_name}%"))
                ).first()
                if province:
                    verified_data["incident_province_id"] = province.id
                    verified_data["incident_province"] = province.name_th
    # กรณีไม่มี province_id แต่มีชื่อ
    elif province_name:
        # ค้นหาจากชื่อ
        province = db.query(Province).filter(
            (Province.name_th.ilike(f"%{province_name}%")) | 
            (Province.name_en.ilike(f"%{province_name}%"))
        ).first()
        if province:
            verified_data["incident_province_id"] = province.id
            verified_data["incident_province"] = province.name_th
    
    # แก้ไขส่วนที่เกี่ยวข้องกับอำเภอ
    district_id = incident_location.get("incident_district_id")
    district_name = incident_location.get("incident_district")
    
    # ตรวจสอบอำเภอ โดยไม่จำเป็นต้องขึ้นกับการมีจังหวัดที่ถูกต้อง
    if district_id:
        try:
            # เก็บเป็นค่า original_id ไว้ก่อนแปลง
            original_district_id = district_id
            
            # แปลงเป็น int ถ้าเป็นไปได้
            if isinstance(district_id, str) and district_id.isdigit():
                district_id = int(district_id)
                
            # ค้นหาอำเภอโดยตรง
            amphure = db.query(Amphure).filter(Amphure.id == district_id).first()
            
            # ถ้ามีจังหวัดที่ตรวจสอบแล้ว ให้กรองด้วยจังหวัดด้วย
            if "incident_province_id" in verified_data and amphure and amphure.province_id != verified_data["incident_province_id"]:
                # ถ้าอำเภอไม่ได้อยู่ในจังหวัดที่กำหนด ลองค้นหาในจังหวัดที่ถูกต้อง
                amphure = db.query(Amphure).filter(
                    Amphure.province_id == verified_data["incident_province_id"],
                    ((Amphure.name_th.ilike(f"%{district_name}%")) | (Amphure.name_en.ilike(f"%{district_name}%")))
                ).first()
            
            if amphure:
                verified_data["incident_district_id"] = amphure.id
                verified_data["incident_district"] = amphure.name_th
            elif district_name and "incident_province_id" in verified_data:
                # ค้นหาอำเภอจากชื่อในจังหวัดที่ถูกต้อง
                amphure = db.query(Amphure).filter(
                    ((Amphure.name_th.ilike(f"%{district_name}%")) | (Amphure.name_en.ilike(f"%{district_name}%"))),
                    (Amphure.province_id == verified_data["incident_province_id"])
                ).first()
                if amphure:
                    verified_data["incident_district_id"] = amphure.id
                    verified_data["incident_district"] = amphure.name_th
        except (ValueError, TypeError):
            # กรณีแปลงค่าไม่ได้ ให้ค้นหาจากชื่อแทน
            if district_name and "incident_province_id" in verified_data:
                amphure = db.query(Amphure).filter(
                    ((Amphure.name_th.ilike(f"%{district_name}%")) | (Amphure.name_en.ilike(f"%{district_name}%"))),
                    (Amphure.province_id == verified_data["incident_province_id"])
                ).first()
                if amphure:
                    verified_data["incident_district_id"] = amphure.id
                    verified_data["incident_district"] = amphure.name_th
    # กรณีมีแต่ชื่ออำเภอ และมีจังหวัดที่ถูกต้อง
    elif district_name and "incident_province_id" in verified_data:
        amphure = db.query(Amphure).filter(
            ((Amphure.name_th.ilike(f"%{district_name}%")) | (Amphure.name_en.ilike(f"%{district_name}%"))),
            (Amphure.province_id == verified_data["incident_province_id"])
        ).first()
        if amphure:
            verified_data["incident_district_id"] = amphure.id
            verified_data["incident_district"] = amphure.name_th
    
    # ส่วนตำบล (subdistrict) - ต้องแก้ไขการจัดการกับ ID
    subdistrict_id = incident_location.get("incident_subdistrict_id")
    subdistrict_name = incident_location.get("incident_subdistrict")
    
    if subdistrict_id:
        # ไม่ต้องแปลง subdistrict_id เป็น int เพราะในแบบจำลอง District.id เป็น string
        subdistrict_id = str(subdistrict_id)
        
        # ค้นหาตำบลโดยตรงจาก ID
        district = db.query(District).filter(District.id == subdistrict_id).first()
        
        # ถ้ามีอำเภอที่ตรวจสอบแล้ว ให้ตรวจสอบความสอดคล้องกับอำเภอด้วย
        if "incident_district_id" in verified_data and district and district.amphure_id != verified_data["incident_district_id"]:
            # ถ้าตำบลไม่ได้อยู่ในอำเภอที่กำหนด ลองค้นหาในอำเภอที่ถูกต้อง
            district = db.query(District).filter(
                District.amphure_id == verified_data["incident_district_id"],
                ((District.name_th.ilike(f"%{subdistrict_name}%")) | (District.name_en.ilike(f"%{subdistrict_name}%")))
            ).first()
        
        if district:
            verified_data["incident_subdistrict_id"] = district.id
            verified_data["incident_subdistrict"] = district.name_th
        elif subdistrict_name and "incident_district_id" in verified_data:
            # ค้นหาตำบลจากชื่อ
            district = db.query(District).filter(
                ((District.name_th.ilike(f"%{subdistrict_name}%")) | (District.name_en.ilike(f"%{subdistrict_name}%"))),
                (District.amphure_id == verified_data["incident_district_id"])
            ).first()
            if district:
                verified_data["incident_subdistrict_id"] = district.id
                verified_data["incident_subdistrict"] = district.name_th
    # กรณีมีแต่ชื่อตำบล
    elif subdistrict_name and "incident_district_id" in verified_data:
        district = db.query(District).filter(
            ((District.name_th.ilike(f"%{subdistrict_name}%")) | (District.name_en.ilike(f"%{subdistrict_name}%"))),
            (District.amphure_id == verified_data["incident_district_id"])
        ).first()
        if district:
            verified_data["incident_subdistrict_id"] = district.id
            verified_data["incident_subdistrict"] = district.name_th
                
    return verified_data

def prepare_complaint_model_data(
    db: Session, 
    complaint_data: Dict, 
    original_data: Dict, 
    extracted_data: Dict, 
    root_complaint_type: str, 
    user_id: Optional[UUID]
) -> Dict:
    """เตรียมข้อมูลสำหรับสร้าง Complaint model"""
    # สร้างเลขที่ข้อร้องเรียน
    complaint_number = generate_complaint_number(db)
    
    # ดึงข้อมูลจาก extracted_data
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
    
    # ค้นหา complaint_type_id จากชื่อที่แมปแล้ว
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
            
            # อัปเดต complaintType ในข้อมูลเพื่อความสอดคล้อง
            if complaint_type != original_complaint_type:
                # ถ้า complaintType ถูกแมป บันทึกค่าเดิมไว้
                if "step3" in original_data and "general" in original_data["step3"]:
                    original_data["step3"]["general"]["original_complaint_type"] = original_complaint_type
                    original_data["step3"]["general"]["complaintType"] = complaint_type
            
            # ถ้ามี step3 และ complaintSubtype ในข้อมูล
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
            # กำหนดค่าเริ่มต้นเป็น "ออนไลน์" ถ้าไม่มีการระบุ
            default_channel = db.query(ComplaintChannel).filter(ComplaintChannel.name == "ออนไลน์").first()
            if default_channel:
                complaint_channel_id = default_channel.id
    else:
        # กำหนดค่าเริ่มต้นเป็น "ออนไลน์" ถ้าไม่มีการระบุ
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
    incident_location = extract_incident_location(complaint_data)
    
    # ตรวจสอบความถูกต้องของข้อมูลทางภูมิศาสตร์
    verified_location = verify_geographic_data(db, incident_location)
    
    # เพิ่มการดึงข้อมูลระดับความลับและความเร่งด่วน
    confidentiality_level = original_data.get("step3", {}).get("general", {}).get("confidentialityLevel", "NORMAL")
    urgency_level = original_data.get("step3", {}).get("general", {}).get("urgencyLevel", "LOW") 
    severity_level = original_data.get("step3", {}).get("general", {}).get("severityLevel", "LOW")
    
    # ดึงข้อมูลช่องทางการร้องเรียน
    complaint_channel = original_data.get("step3", {}).get("general", {}).get("channel")
    if complaint_channel and isinstance(complaint_channel, str):
        complaint_channel_record = db.query(ComplaintChannel).filter(
            ComplaintChannel.name == complaint_channel,
            ComplaintChannel.is_active == True
        ).first()
        
        if complaint_channel_record:
            complaint_channel_id = complaint_channel_record.id
        else:
            # กำหนดค่าเริ่มต้นเป็น "ออนไลน์" ถ้าไม่มีการระบุ
            default_channel = db.query(ComplaintChannel).filter(ComplaintChannel.name == "ออนไลน์").first()
            if default_channel:
                complaint_channel_id = default_channel.id
    else:
        # กำหนดค่าเริ่มต้นเป็น "ออนไลน์" ถ้าไม่มีการระบุ
        default_channel = db.query(ComplaintChannel).filter(ComplaintChannel.name == "ออนไลน์").first()
        if default_channel:
            complaint_channel_id = default_channel.id
    
    # จัดเตรียมข้อมูลสำหรับสร้าง model (เพิ่มการตรวจสอบ verified_location)
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
        
        # ใช้ข้อมูลที่ผ่านการตรวจสอบแล้ว และเพิ่มการตรวจสอบว่ามีค่าหรือไม่
        "incident_province_id": verified_location.get("incident_province_id") or incident_location.get("incident_province_id"),
        "incident_province": verified_location.get("incident_province") or incident_location.get("incident_province"),
        "incident_district_id": verified_location.get("incident_district_id") or incident_location.get("incident_district_id"),
        "incident_district": verified_location.get("incident_district") or incident_location.get("incident_district"),
        "incident_subdistrict_id": verified_location.get("incident_subdistrict_id") or incident_location.get("incident_subdistrict_id"),
        "incident_subdistrict": verified_location.get("incident_subdistrict") or incident_location.get("incident_subdistrict"),
        "confidentiality_level": confidentiality_level,
        "urgency_level": urgency_level,
        "severity_level": severity_level,
        "complaint_channel_id": complaint_channel_id,
        # ... ฟิลด์อื่นๆ เหมือนเดิม ...
    }
    
    return result

# เพิ่มฟังก์ชันสำหรับการอัพเดทข้อมูลเพิ่มเติม
def update_complaint_details(db: Session, complaint_id: UUID, update_data: Dict, user_id: Optional[UUID] = None) -> Optional[Complaint]:
    """อัพเดทข้อมูลรายละเอียดเพิ่มเติมของเรื่องร้องเรียน"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return None
    
    # ฟิลด์ที่สามารถอัพเดทได้
    updatable_fields = [
        "confidentiality_level", "urgency_level", "severity_level",
        "incident_province_id", "incident_province", 
        "incident_district_id", "incident_district",
        "incident_subdistrict_id", "incident_subdistrict",
        "assigned_officer_id", "progress_percentage", "processing_notes",
        "satisfaction_rating", "satisfaction_comment", 
        "parent_complaint_id", "related_complaints"
    ]
    
    # อัพเดทเฉพาะฟิลด์ที่มีการส่งมา
    for field in updatable_fields:
        if field in update_data:
            setattr(complaint, field, update_data[field])
    
    # อัพเดทเวลาการแก้ไข
    complaint.updated_at = datetime.now()
    
    db.commit()
    db.refresh(complaint)
    return complaint

def add_related_complaint(db: Session, complaint_id: UUID, related_complaint_id: UUID) -> bool:
    """เพิ่มความสัมพันธ์ระหว่างเรื่องร้องเรียน"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return False
    
    # ตรวจสอบว่าเรื่องที่จะเชื่อมโยงมีอยู่จริง
    related_complaint = db.query(Complaint).filter(Complaint.id == related_complaint_id).first()
    if not related_complaint:
        return False
    
    # ตรวจสอบว่ามี related_complaints อยู่แล้วหรือไม่
    related_complaints = []
    if complaint.related_complaints:
        if isinstance(complaint.related_complaints, str):
            try:
                related_complaints = json.loads(complaint.related_complaints)
            except:
                related_complaints = []
        elif isinstance(complaint.related_complaints, list):
            related_complaints = complaint.related_complaints
    
    # เพิ่มเรื่องที่เกี่ยวข้องถ้ายังไม่มี
    if str(related_complaint_id) not in [str(x) for x in related_complaints]:
        related_complaints.append(str(related_complaint_id))
        
    # อัพเดทข้อมูล
    complaint.related_complaints = json.dumps(related_complaints)
    complaint.updated_at = datetime.now()
    
    db.commit()
    return True

def convert_to_db_json(data):
    """
    Convert Python dictionary to proper JSON format for database storage.
    This handles SQLAlchemy JSON field requirements.
    """
    if data is None:
        return None
    
    # If data is already a string, return it
    if isinstance(data, str):
        return data
        
    # Explicitly serialize to JSON string
    return json.dumps(data)

def generate_complaint_number(db: Session) -> str:
    """สร้างเลขที่ข้อร้องเรียนแบบอัตโนมัติ"""
    today = datetime.now()
    date_part = today.strftime("%Y%m%d")
    
    # นับจำนวนข้อร้องเรียนที่สร้างในวันนี้
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

def get_complaints(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    """ดึงรายการข้อร้องเรียนพร้อมการแบ่งหน้าและนับจำนวนทั้งหมด"""
    query = db.query(Complaint)
    
    if status:
        query = query.filter(Complaint.status == status)
    
    # นับจำนวนรายการทั้งหมด
    total_count = query.count()
    
    # เรียงลำดับตามวันที่สร้าง ล่าสุดขึ้นก่อน
    query = query.order_by(Complaint.created_at.desc())

    # ดึงข้อมูลตาม pagination
    complaints = query.offset(skip).limit(limit).all()
    
    result = []
    for complaint in complaints:
        try:
            # แยกข้อมูลสำหรับแสดงในรายการ
            list_item = create_complaint_list_item(complaint)
            result.append(list_item)
        except Exception as e:
            # ถ้าเกิด error กับ complaint ใดๆ ให้ข้ามไปและ log error
            print(f"Error processing complaint {complaint.id}: {str(e)}")
            continue
    
    # คืนค่าเป็น dictionary ที่มีข้อมูล pagination และ items
    return {
        "items": result,
        "pagination": {
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "has_more": total_count > (skip + limit)
        }
    }

def create_complaint_list_item(complaint: Complaint) -> ComplaintListItem:
    """สร้างข้อมูลแบบย่อสำหรับแสดงในรายการ"""
    # ดึงชื่อผู้ร้องเรียนโดยใช้ ensure_dict
    complainant_data = ensure_dict(complaint.complainant_data)
    complainant_name = complainant_data.get("name", "")
    
    # ดึงชื่อผู้ถูกร้องเรียนตามประเภท
    respondent_data = ensure_dict(complaint.respondent_data)
    respondent_name = ""
    if complaint.respondent_type == RespondentType.INDIVIDUAL:
        respondent_name = respondent_data.get("name", "")
    elif complaint.respondent_type == RespondentType.CORPORATE:
        respondent_name = respondent_data.get("companyName", respondent_data.get("name", ""))
    elif complaint.respondent_type == RespondentType.GOVERNMENT:
        respondent_name = respondent_data.get("agencyName", respondent_data.get("name", ""))
    
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
    
    # ดึงข้อมูลไฟล์แนบ
    attachment_list = get_complaint_attachments(complaint)
    
    # ดึงประวัติสถานะ
    status_history = get_complaint_status_history(db, complaint_id)
    
    # Ensure JSON data is properly loaded
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
    
    # Set the parsed data back to the complaint object for other functions to use
    complaint.full_complaint_data = full_complaint_data
    complaint.complainant_data = complainant_data
    complaint.respondent_data = respondent_data
    
    # Ensure we have valid step data
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
        
        # แทรกข้อมูลไฟล์แนบ
        if "step3" in response_data and "general" in response_data["step3"]:
            response_data["step3"]["general"]["attachment"] = attachment_list
        
        return response_data
    
    # สร้างใหม่เนื่องจากไม่พบโครงสร้าง step1-step4
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
        # แยกข้อมูล signer ถ้ามี
        if isinstance(complaint.complainant_data, dict) and "signer" in complaint.complainant_data:
            step1["general"]["signer"] = complaint.complainant_data["signer"]
            # ลบ signer จาก corporate ที่ซ้ำกัน
            if "signer" in step1["general"]["corporate"]:
                del step1["general"]["corporate"]["signer"]
    
    # เพิ่มข้อมูลผู้รับมอบอำนาจ
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
    
    # สร้างผลลัพธ์
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
    
    # อัพเดทข้อมูลสถานะ
    complaint.status = new_status
    complaint.updated_at = datetime.now()
    
    # ถ้าสถานะเป็น "เสร็จสิ้น" ให้บันทึกวันที่ดำเนินการเสร็จ
    if new_status == ComplaintStatus.COMPLETED:
        complaint.resolved_date = datetime.now()
    
    # เพิ่มประวัติสถานะ
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
    # สร้าง query พื้นฐาน
    query = db.query(Complaint).filter(Complaint.created_by == user_id)
    
    # กรองตาม status ถ้าระบุ
    if status:
        query = query.filter(Complaint.status == status)
    
    # นับจำนวนรายการทั้งหมดเฉพาะของ user นี้
    total_count = query.count()
    
    # เรียงลำดับตามวันที่สร้าง ล่าสุดขึ้นก่อน
    query = query.order_by(Complaint.created_at.desc())

    # ดึงข้อมูลตาม pagination
    complaints = query.offset(skip).limit(limit).all()
    
    result = []
    for complaint in complaints:
        try:
            # แยกข้อมูลสำหรับแสดงในรายการ
            list_item = create_complaint_list_item(complaint)
            result.append(list_item)
        except Exception as e:
            # ถ้าเกิด error กับ complaint ใดๆ ให้ข้ามไปและ log error
            print(f"Error processing complaint {complaint.id}: {str(e)}")
            continue
    
    # คืนค่าเป็น dictionary ที่มีข้อมูล pagination และ items
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
    # ตรวจสอบว่า complaint นี้เป็นของ user หรือไม่
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.created_by == user_id
    ).first()
    
    if not complaint:
        return None
    
    # ใช้ฟังก์ชันเดิมในการดึงรายละเอียด
    return get_complaint(db, complaint_id)

def map_complaint_type(db: Session, complaint_type_str: str) -> str:
    """
    แมปประเภทเรื่องร้องเรียนจากข้อความที่รับเข้ามาเป็นประเภทที่มีในฐานข้อมูล
    """
    if not complaint_type_str:
        return "อื่นๆ"
        
    # ตรวจสอบว่ามีในฐานข้อมูลตรงๆ หรือไม่
    direct_match = db.query(ComplaintType).filter(
        ComplaintType.name == complaint_type_str,
        ComplaintType.is_active == True
    ).first()
    
    if direct_match:
        return complaint_type_str
    
    # แมปกลุ่มประเภทที่คล้ายกัน
    if any(word in complaint_type_str for word in ["ฉ้อโกง", "หลอกลวง", "ต้มตุ๋น"]):
        return "ฉ้อโกง"
        
    if any(word in complaint_type_str for word in ["ทุจริต", "คอร์รัปชั่น", "ผลประโยชน์"]):
        return "ทุจริต"
        
    if any(word in complaint_type_str for word in ["บริการ", "ล่าช้า"]):
        return "บริการ"
        
    if any(word in complaint_type_str for word in ["สินค้า", "ออนไลน์", "ซื้อขาย"]):
        return "สินค้าและบริการ"
    
    # ถ้าไม่เข้าเงื่อนไขใดๆ ให้ใช้ "อื่นๆ"
    return "อื่นๆ"

def get_location_hierarchy_by_ids(db: Session, province_id: int = None, amphure_id: int = None, district_id: str = None) -> Dict:
    """ดึงข้อมูลลำดับชั้นทางภูมิศาสตร์ตาม ID ที่กำหนด"""
    result = {
        "province": None,
        "amphure": None,
        "district": None
    }
    
    # ถ้ามี district_id ให้ดึงข้อมูลตำบลและลำดับชั้นที่สูงกว่า
    if district_id:
        district = db.query(District).filter(District.id == district_id).first()
        if district:
            result["district"] = model_to_dict(district)
            amphure_id = district.amphure_id
    
    # ถ้ามี amphure_id ให้ดึงข้อมูลอำเภอและลำดับชั้นที่สูงกว่า
    if amphure_id:
        amphure = db.query(Amphure).filter(Amphure.id == amphure_id).first()
        if amphure:
            result["amphure"] = model_to_dict(amphure)
            province_id = amphure.province_id
    
    # ถ้ามี province_id ให้ดึงข้อมูลจังหวัด
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
        # สร้าง query
        query = db.query(Complaint)
        
        # ถ้าระบุ complaint_id ให้แก้ไขเฉพาะรายการนั้น
        if complaint_id:
            query = query.filter(Complaint.id == complaint_id)
        
        # ดึงรายการข้อร้องเรียนที่ต้องการปรับปรุง
        complaints = query.all()
        update_count = 0
        
        for complaint in complaints:
            need_update = False
            
            # 1. ถ้าไม่มีข้อมูลพื้นที่เกิดเหตุเลย ลองสร้างขึ้นใหม่จากข้อมูลร้องเรียน
            if not complaint.incident_province_id and not complaint.incident_district_id and not complaint.incident_subdistrict_id:
                if complaint.full_complaint_data:
                    full_data = ensure_dict(complaint.full_complaint_data)
                    # ลองดึงข้อมูลที่ตั้งจากข้อมูลร้องเรียน
                    incident_location = extract_incident_location(full_data)
                    if incident_location:
                        # ตรวจสอบและยืนยันข้อมูลพื้นที่
                        verified_location = verify_geographic_data(db, incident_location)
                        if verified_location:
                            # อัพเดตข้อมูลพื้นที่
                            for key, value in verified_location.items():
                                setattr(complaint, key, value)
                            need_update = True
            
            # 2. กรณีมี province_id แต่ชื่อไม่ตรงกัน
            if complaint.incident_province_id:
                province = db.query(Province).filter(Province.id == complaint.incident_province_id).first()
                if province and (complaint.incident_province != province.name_th):
                    complaint.incident_province = province.name_th
                    need_update = True
            
            # 3. กรณีมี district_id แต่ชื่อไม่ตรงกัน
            if complaint.incident_district_id:
                # district_id ในตาราง Amphure เป็น integer
                district_id = complaint.incident_district_id
                amphure = db.query(Amphure).filter(Amphure.id == district_id).first()
                if amphure and (complaint.incident_district != amphure.name_th):
                    complaint.incident_district = amphure.name_th
                    need_update = True
            
            # 4. กรณีมี subdistrict_id แต่ชื่อไม่ตรงกัน
            if complaint.incident_subdistrict_id:
                # ต้องแน่ใจว่า subdistrict_id เป็น string เมื่อทำการค้นหาจาก District
                district = db.query(District).filter(District.id == str(complaint.incident_subdistrict_id)).first()
                if district and (complaint.incident_subdistrict != district.name_th):
                    complaint.incident_subdistrict = district.name_th
                    need_update = True
            
            # 5. กรณีมีชื่อ province แต่ไม่มี ID หรือ ID ไม่ถูกต้อง
            if complaint.incident_province and (not complaint.incident_province_id or 
                                               not db.query(Province).filter(Province.id == complaint.incident_province_id).first()):
                province = db.query(Province).filter(
                    (Province.name_th.ilike(f"%{complaint.incident_province}%")) | 
                    (Province.name_en.ilike(f"%{complaint.incident_province}%"))
                ).first()
                if province:
                    complaint.incident_province_id = province.id
                    complaint.incident_province = province.name_th
                    need_update = True
            
            # 6. กรณีมีชื่อ district แต่ไม่มี district_id หรือ district_id ไม่ถูกต้อง
            if complaint.incident_district and complaint.incident_province_id and (
                not complaint.incident_district_id or not db.query(Amphure).filter(
                    Amphure.id == complaint.incident_district_id,
                    Amphure.province_id == complaint.incident_province_id
                ).first()
            ):
                amphure = db.query(Amphure).filter(
                    (Amphure.name_th.ilike(f"%{complaint.incident_district}%")) | 
                    (Amphure.name_en.ilike(f"%{complaint.incident_district}%")),
                    Amphure.province_id == complaint.incident_province_id
                ).first()
                if amphure:
                    complaint.incident_district_id = amphure.id
                    complaint.incident_district = amphure.name_th
                    need_update = True
            
            # บันทึกการเปลี่ยนแปลงถ้าจำเป็น
            if need_update:
                complaint.updated_at = datetime.now()
                update_count += 1
        
        # บันทึกการเปลี่ยนแปลงทั้งหมดในครั้งเดียว
        if update_count > 0:
            db.commit()
            
        return True
    except Exception as e:
        db.rollback()
        print(f"Error updating geographic data: {str(e)}")
        traceback.print_exc()
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
        print(f"Error fixing geographic data: {str(e)}")
        return {"error": str(e)}
    
def update_all_geographic_data(db: Session):
    """แก้ไขข้อมูลทางภูมิศาสตร์ทั้งหมดในฐานข้อมูล"""
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
            district = db.query(Amphure).filter(Amphure.id == complaint.incident_district_id).first()
            if district and complaint.incident_district != district.name_th:
                complaint.incident_district = district.name_th
                need_update = True
                
        # ตรวจสอบและแก้ไขข้อมูลตำบล
        if complaint.incident_subdistrict_id:
            subdistrict = db.query(District).filter(District.id == complaint.incident_subdistrict_id).first()
            if subdistrict and complaint.incident_subdistrict != subdistrict.name_th:
                complaint.incident_subdistrict = subdistrict.name_th
                need_update = True
                
        # บันทึกการเปลี่ยนแปลง
        if need_update:
            db.commit()
            updated_count += 1
    
    return {"updated_count": updated_count}

def set_default_channel_id(db: Session):
    """กำหนดค่า complaint_channel_id เป็นค่าเริ่มต้น (ออนไลน์) สำหรับรายการที่เป็น null"""
    default_channel = db.query(ComplaintChannel).filter(ComplaintChannel.name == "ออนไลน์").first()
    
    if default_channel:
        # อัปเดตทุกรายการที่ยังไม่มี complaint_channel_id
        result = db.query(Complaint).filter(Complaint.complaint_channel_id == None).update(
            {"complaint_channel_id": default_channel.id}
        )
        db.commit()
        return {"updated_count": result}
    return {"updated_count": 0, "error": "ไม่พบช่องทางเริ่มต้น (ออนไลน์)"}