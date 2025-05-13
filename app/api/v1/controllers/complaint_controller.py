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
    return result

def create_complaint(db: Session, complaint_data: Dict[str, Any], user_id: Optional[UUID] = None) -> Complaint:
    """สร้างข้อร้องเรียนใหม่"""
    try:
        # 1. ตรวจสอบโครงสร้างข้อมูลที่ได้รับ
        is_request_object = isinstance(complaint_data, dict) and "body" in complaint_data and "headers" in complaint_data
        
        # กรณีที่ได้รับข้อมูลที่อาจถูกห่อหุ้มมาจาก middleware หรือ request object
        if is_request_object and isinstance(complaint_data["body"], str):
            try:
                # พยายามแปลง JSON string จาก body
                print("Extracting from request object body string")
                complaint_data = json.loads(complaint_data["body"])
                print(f"Successfully parsed body JSON: {list(complaint_data.keys()) if isinstance(complaint_data, dict) else 'Not a dict'}")
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON from body: {e}")
        elif is_request_object and isinstance(complaint_data["body"], dict):
            # ใช้ body dictionary โดยตรง
            print("Extracting from request object body dict")
            complaint_data = complaint_data["body"]
            
        # แปลงข้อมูล formData ถ้ามีก่อน
        if isinstance(complaint_data, dict) and "formData" in complaint_data:
            complaint_data = complaint_data["formData"]

        # Check if data is in flat format and convert to step format if needed
        if isinstance(complaint_data, dict) and "subject" in complaint_data and "step1" not in complaint_data:
            print("Converting flat format to step format")
            structured_data = {
                "step1": {"general": {}},
                "step2": {"general": {}},
                "step3": {
                    "general": {
                        "subject": complaint_data.get("subject", ""),
                        "description": complaint_data.get("description", ""),
                        "complaintType": complaint_data.get("complaint_type", ""),
                        "channel": complaint_data.get("channel", ""),
                        "incidentDate": complaint_data.get("incident_date", None),
                        "attachment": complaint_data.get("attachments", [])
                    }
                },
                "step4": {
                    "general": {"accepted": complaint_data.get("accepted", True)}
                }
            }
            
            # Handle complainant data
            complainant_type = complaint_data.get("complainant_type", "individual")
            
            if complainant_type.lower() in ["individual", "general"]:
                structured_data["step1"]["general"]["activeType"] = "general" 
                structured_data["step1"]["general"]["general"] = complaint_data.get("complainant_data", {}).get("general", {})
                
                # Handle the nested structure in the actual data
                if not structured_data["step1"]["general"]["general"] and isinstance(complaint_data.get("complainant_data", {}), dict):
                    structured_data["step1"]["general"]["general"] = complaint_data.get("complainant_data", {})
                
            elif complainant_type.lower() == "corporate":
                structured_data["step1"]["general"]["activeType"] = "corporate"
                structured_data["step1"]["general"]["corporate"] = complaint_data.get("complainant_data", {}).get("corporate", {})
                
                # Handle the nested structure in the actual data
                if not structured_data["step1"]["general"]["corporate"] and isinstance(complaint_data.get("complainant_data", {}), dict):
                    structured_data["step1"]["general"]["corporate"] = complaint_data.get("complainant_data", {})
                
                # Handle signer if exists
                if "signer" in complaint_data:
                    structured_data["step1"]["general"]["signer"] = complaint_data.get("signer", {})
                elif "signer" in complaint_data.get("complainant_data", {}):
                    structured_data["step1"]["general"]["signer"] = complaint_data.get("complainant_data", {}).get("signer", {})
            
            # Handle delegate if exists
            if "delegate_data" in complaint_data:
                structured_data["step1"]["general"]["delegate"] = complaint_data.get("delegate_data", {})
            elif "delegate" in complaint_data.get("complainant_data", {}):
                structured_data["step1"]["general"]["delegate"] = complaint_data.get("complainant_data", {}).get("delegate", {})
            
            # Handle respondent data
            respondent_type = complaint_data.get("respondent_type", "individual")
            respondent_type_lower = respondent_type.lower() if isinstance(respondent_type, str) else "individual"
            
            # ตรวจสอบประเภทข้อมูลที่แท้จริง
            if "corporate" in complaint_data.get("respondent_data", {}):
                structured_data["step2"]["general"]["activeType"] = "corporate"
                structured_data["step2"]["general"]["corporate"] = complaint_data.get("respondent_data", {})
            elif "government" in complaint_data.get("respondent_data", {}):
                structured_data["step2"]["general"]["activeType"] = "government"
                structured_data["step2"]["general"]["government"] = complaint_data.get("respondent_data", {})
            else:
                if respondent_type_lower == "individual":
                    structured_data["step2"]["general"]["activeType"] = "individual"
                    structured_data["step2"]["general"]["individual"] = complaint_data.get("respondent_data", {})
                elif respondent_type_lower == "corporate":
                    structured_data["step2"]["general"]["activeType"] = "corporate"
                    structured_data["step2"]["general"]["corporate"] = complaint_data.get("respondent_data", {})
                elif respondent_type_lower == "government":
                    structured_data["step2"]["general"]["activeType"] = "government"
                    structured_data["step2"]["general"]["government"] = complaint_data.get("respondent_data", {})
                
            complaint_data = structured_data
           
        # 1. เก็บข้อมูลดิบทั้งหมดแบบ JSON object
        original_data = save_original_complaint(complaint_data)
        
        # 2. แยกข้อมูลตามขั้นตอน
        step1 = complaint_data.get("step1", {})
        step2 = complaint_data.get("step2", {})
        step3 = complaint_data.get("step3", {})
        step4 = complaint_data.get("step4", {})
        
        # 3. ดึงข้อมูลเรื่องร้องเรียน
        subject = ""
        description = ""
        complaint_type = ""
        channel = ""
        incident_date = None
        
        if "general" in step3:
            step3_general = step3["general"]
            subject = step3_general.get("subject", "")
            description = step3_general.get("description", "")
            complaint_type = step3_general.get("complaintType", "")
            channel = step3_general.get("channel", "")
            
            if "incidentDate" in step3_general and step3_general["incidentDate"]:
                try:
                    incident_date = datetime.fromisoformat(step3_general["incidentDate"].replace('Z', '+00:00'))
                except Exception as e:
                    incident_date = None
        
        # 4. ข้อมูลการยอมรับเงื่อนไข
        accepted = True
        if "general" in step4:
            accepted = step4["general"].get("accepted", True)
        
        # 5. ข้อมูลผู้ร้องเรียน
        complainant_data = {}
        complainant_type = ComplainantType.INDIVIDUAL
        delegate_data = None
        
        if "general" in step1:
            step1_general = step1["general"]
            
            # ตรวจสอบประเภทผู้ร้องเรียนจากข้อมูลที่มี
            # 1. หากมี activeType ให้ใช้ค่านั้น
            # 2. หากไม่มี ให้ตรวจว่ามีฟิลด์ corporate, general หรือไม่เพื่อกำหนดประเภท
            
            # เช็คว่ามี corporate โดยตรงไหม (กรณีไม่มี activeType)
            if "corporate" in step1_general:
                # เป็นนิติบุคคล
                active_type = "corporate"
                complainant_type = ComplainantType.CORPORATE
                complainant_data = process_nested_fields(step1_general["corporate"])
                
                # กรณีนิติบุคคล มีข้อมูลผู้ลงนาม
                if "signer" in step1_general and step1_general.get("signer"):
                    complainant_data["signer"] = process_nested_fields(step1_general["signer"])
            
            # เช็คว่ามี general โดยตรงไหม (กรณีไม่มี activeType)
            elif "general" in step1_general:
                active_type = "general"
                complainant_type = ComplainantType.INDIVIDUAL
                complainant_data = process_nested_fields(step1_general["general"])
            
            # กรณีมี activeType ระบุ
            else:
                active_type = step1_general.get("activeType", "general")
                
                # ตรวจสอบประเภทผู้ร้องเรียน - บุคคลธรรมดา
                if (active_type == "general" or active_type == "individual") and "general" in step1_general:
                    complainant_type = ComplainantType.INDIVIDUAL
                    complainant_data = process_nested_fields(step1_general["general"])
                
                # ตรวจสอบข้อมูลนิติบุคคล
                elif active_type == "corporate" and "corporate" in step1_general:
                    complainant_type = ComplainantType.CORPORATE
                    complainant_data = process_nested_fields(step1_general["corporate"])
                    
                    # กรณีนิติบุคคล มีข้อมูลผู้ลงนาม
                    if "signer" in step1_general and step1_general.get("signer"):
                        complainant_data["signer"] = process_nested_fields(step1_general["signer"])
            
            # ข้อมูลตัวแทน/ผู้รับมอบอำนาจ
            if "delegate" in step1_general and step1_general.get("delegate") and isinstance(step1_general["delegate"], dict) and len(step1_general["delegate"]) > 0:
                delegate_data = process_nested_fields(step1_general["delegate"])
        
        # 6. ข้อมูลผู้ถูกร้องเรียน
        respondent_data = {}
        respondent_type = RespondentType.INDIVIDUAL  # Default value
        
        if "general" in step2:
            step2_general = step2["general"]
            
            # ตรวจสอบ activeType ก่อนเป็นอันดับแรก
            if "activeType" in step2_general:
                active_type = step2_general["activeType"]
                
                if active_type == "corporate":
                    respondent_type = RespondentType.CORPORATE
                    
                    # ตรวจสอบว่ามีข้อมูล corporate อยู่หรือไม่
                    if "corporate" in step2_general:
                        corp_data = step2_general["corporate"] 
                        if "companyName" in corp_data and not "name" in corp_data:
                            corp_data["name"] = corp_data["companyName"]
                        respondent_data = process_nested_fields(corp_data)
                    # ถ้าไม่มี corporate แต่มีใน individual
                    elif "individual" in step2_general and isinstance(step2_general["individual"], dict) and "corporate" in step2_general["individual"]:
                        corp_data = step2_general["individual"]["corporate"]
                        if "companyName" in corp_data and not "name" in corp_data:
                            corp_data["name"] = corp_data["companyName"]
                        respondent_data = process_nested_fields(corp_data)
                
                elif active_type == "government":
                    respondent_type = RespondentType.GOVERNMENT
                    
                    # ตรวจสอบว่ามีข้อมูล government อยู่หรือไม่
                    if "government" in step2_general:
                        gov_data = step2_general["government"]
                        if "agencyName" in gov_data and not "name" in gov_data:
                            gov_data["name"] = gov_data["agencyName"]
                        respondent_data = process_nested_fields(gov_data)
                    # ถ้าไม่มี government แต่มีใน individual
                    elif "individual" in step2_general and isinstance(step2_general["individual"], dict) and "government" in step2_general["individual"]:
                        gov_data = step2_general["individual"]["government"]
                        if "agencyName" in gov_data and not "name" in gov_data:
                            gov_data["name"] = gov_data["agencyName"]
                        respondent_data = process_nested_fields(gov_data)
                
                elif active_type == "individual" or active_type == "general":
                    # ตรวจสอบว่ามีข้อมูล corporate หรือ government ซ้อนอยู่หรือไม่
                    if "individual" in step2_general and isinstance(step2_general["individual"], dict):
                        # ตรวจสอบ government ใน individual
                        if "government" in step2_general["individual"] and isinstance(step2_general["individual"]["government"], dict):
                            # กรณีพิเศษ: มีข้อมูล government อยู่ใน individual
                            respondent_type = RespondentType.GOVERNMENT
                            gov_data = step2_general["individual"]["government"]
                            if "agencyName" in gov_data and not "name" in gov_data:
                                gov_data["name"] = gov_data["agencyName"]
                            respondent_data = process_nested_fields(gov_data)
                        # ตรวจสอบ corporate ใน individual (ยังคงรักษาเงื่อนไขเดิม)
                        elif "corporate" in step2_general["individual"] and isinstance(step2_general["individual"]["corporate"], dict):
                            # กรณีพิเศษ: มีข้อมูล corporate อยู่ใน individual
                            respondent_type = RespondentType.CORPORATE
                            corp_data = step2_general["individual"]["corporate"]
                            if "companyName" in corp_data and not "name" in corp_data:
                                corp_data["name"] = corp_data["companyName"]
                            respondent_data = process_nested_fields(corp_data)
                        # ตรวจสอบกรณี individual.individual (ซ้อน 2 ชั้น)
                        elif "individual" in step2_general["individual"] and isinstance(step2_general["individual"]["individual"], dict):
                            inner_individual = step2_general["individual"]["individual"]
                            # ตรวจสอบซ้อนชั้นที่ 3
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
                                # ใช้ข้อมูล individual.individual โดยตรง
                                respondent_type = RespondentType.INDIVIDUAL
                                respondent_data = process_nested_fields(inner_individual)
                        else:
                            # ใช้ individual ตาม activeType
                            respondent_type = RespondentType.INDIVIDUAL
                            respondent_data = process_nested_fields(step2_general["individual"])
            
            # ถ้าไม่มี activeType ให้ตรวจสอบจากฟิลด์โดยตรง
            else:
                if "government" in step2_general and isinstance(step2_general["government"], dict):
                    # พบข้อมูล government โดยตรง
                    respondent_type = RespondentType.GOVERNMENT
                    gov_data = step2_general["government"]
                    if "agencyName" in gov_data and not "name" in gov_data:
                        gov_data["name"] = gov_data["agencyName"] 
                    respondent_data = process_nested_fields(gov_data)
                
                elif "corporate" in step2_general and isinstance(step2_general["corporate"], dict):
                    # พบข้อมูล corporate โดยตรง
                    respondent_type = RespondentType.CORPORATE
                    corp_data = step2_general["corporate"]
                    # แปลงชื่อฟิลด์ companyName เป็น name ถ้ามี
                    if "companyName" in corp_data and not "name" in corp_data:
                        corp_data["name"] = corp_data["companyName"]
                    respondent_data = process_nested_fields(corp_data)
                
                elif "individual" in step2_general and isinstance(step2_general["individual"], dict):
                    # พบข้อมูล individual โดยตรง - ตรวจสอบว่ามี corporate หรือ government ซ้อนอยู่หรือไม่
                    
                    # เพิ่มการตรวจสอบ government ใน individual ก่อน corporate
                    if "government" in step2_general["individual"] and isinstance(step2_general["individual"]["government"], dict):
                        # พบ government ใน individual
                        respondent_type = RespondentType.GOVERNMENT
                        gov_data = step2_general["individual"]["government"]
                        if "agencyName" in gov_data and not "name" in gov_data:
                            gov_data["name"] = gov_data["agencyName"]
                        respondent_data = process_nested_fields(gov_data)
                        
                    elif "corporate" in step2_general["individual"] and isinstance(step2_general["individual"]["corporate"], dict):
                        # พบ corporate ใน individual
                        respondent_type = RespondentType.CORPORATE
                        corp_data = step2_general["individual"]["corporate"]
                        if "companyName" in corp_data and not "name" in corp_data:
                            corp_data["name"] = corp_data["companyName"]
                        respondent_data = process_nested_fields(corp_data)
                        
                    # เพิ่มการตรวจสอบ individual.individual
                    elif "individual" in step2_general["individual"] and isinstance(step2_general["individual"]["individual"], dict):
                        inner_individual = step2_general["individual"]["individual"]
                        # ตรวจสอบซ้อนชั้นที่ 3
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
                            # ใช้ข้อมูล individual.individual โดยตรง
                            respondent_type = RespondentType.INDIVIDUAL
                            respondent_data = process_nested_fields(inner_individual)
                    else:
                        # ไม่พบข้อมูลซ้อน ใช้ individual ตามปกติ
                        respondent_type = RespondentType.INDIVIDUAL
                        respondent_data = process_nested_fields(step2_general["individual"])
    
        # 7. สร้างเลขที่ข้อร้องเรียน
        complaint_number = generate_complaint_number(db)
        
        # หากไม่มี subject แต่ข้อมูลอื่นมีครบ ให้ใช้ค่าเริ่มต้น
        if not subject and complainant_data and respondent_data:
            subject = "ทดสอบเรื่องร้องเรียน"
        
        # หากไม่มี complainant_data แต่มีผู้ถูกร้อง ให้ใช้ค่าเริ่มต้น
        if not complainant_data and respondent_data:
            complainant_data = {"name": "ผู้ร้องเรียนทั่วไป", "email": "anonymous@example.com"}
            
        # Validate required fields and return error if missing
        if not subject:
            raise ValueError("Subject is required")
            
        if not complainant_data:
            raise ValueError("Complainant data is required")
            
        if not respondent_data:
            raise ValueError("Respondent data is required")
            
        # Convert all JSON data to proper format for database (explicitly to JSON strings)
        complainant_data_json = convert_to_db_json(complainant_data)
        respondent_data_json = convert_to_db_json(respondent_data)
        delegate_data_json = convert_to_db_json(delegate_data) if delegate_data else None
        full_complaint_data_json = convert_to_db_json(original_data)
        
        new_complaint = Complaint(
            complaint_number=complaint_number,
            subject=subject,
            description=description,
            status=ComplaintStatus.SUBMITTED,
            complainant_data=complainant_data_json,
            complainant_type=complainant_type,
            delegate_data=delegate_data_json,
            respondent_data=respondent_data_json,
            respondent_type=respondent_type,
            incident_date=incident_date,
            complaint_type=complaint_type,
            terms_accepted=accepted,
            full_complaint_data=full_complaint_data_json,
            created_by=user_id
        )
        
        # บันทึกข้อมูล
        db.add(new_complaint)
        db.commit()
        db.refresh(new_complaint)
        
        # บันทึกประวัติสถานะเริ่มต้น
        create_status_history(db, new_complaint.id, ComplaintStatus.SUBMITTED, "รับเรื่องร้องเรียนเรียบร้อย", user_id)
        
        return new_complaint
        
    except Exception as e:
        db.rollback()
        raise

def extract_address_fields(data: Dict) -> Dict:
    """แปลงข้อมูลที่อยู่จากรูปแบบ {value, label} เป็นรูปแบบที่จัดเก็บในฐานข้อมูล"""
    return process_nested_fields(data)

def process_nested_fields(data: Dict) -> Dict:
    """Process nested fields and ensure proper JSON formatting"""
    if not data or not isinstance(data, dict):
        return {}
    
    result = {}
    
    # Copy basic fields
    for key, value in data.items():
        if key in ['province', 'districts', 'subdistricts', 'zipcode'] and isinstance(value, dict):
            # Handle address objects
            if 'value' in value:
                result[f"{key}_id"] = value['value']
            if 'label' in value:
                result[key] = value['label']
            
            # Handle zipcode in subdistricts
            if key == 'subdistricts' and 'zip_code' in value:
                result['zipcode'] = value['zip_code']
        elif isinstance(value, dict):
            # Handle other nested dictionaries
            result[key] = process_nested_fields(value)
        elif isinstance(value, (datetime, date)):
            # Handle date objects
            result[key] = value.isoformat()
        else:
            # Handle regular values
            result[key] = value
    
    # Handle special fields
    if 'companyName' in data and not 'name' in result:
        result['name'] = data['companyName']
    
    if 'agencyName' in data and not 'name' in result:
        result['name'] = data['agencyName']
        
    # Handle zipcode specifically if it's a direct value or in dictionary
    if 'zipcode' in data:
        if isinstance(data['zipcode'], dict) and 'value' in data['zipcode']:
            result['zipcode'] = data['zipcode']['value']
        elif not isinstance(data['zipcode'], dict):
            result['zipcode'] = data['zipcode']
    
    return result

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
    # ดึงชื่อผู้ร้องเรียน
    complainant_name = complaint.complainant_data.get("name", "")
    
    # ดึงชื่อผู้ถูกร้องเรียนตามประเภท
    respondent_name = ""
    if complaint.respondent_type == RespondentType.INDIVIDUAL:
        respondent_name = complaint.respondent_data.get("name", "")
    elif complaint.respondent_type == RespondentType.CORPORATE:
        respondent_name = complaint.respondent_data.get("companyName", complaint.respondent_data.get("name", ""))
    elif complaint.respondent_type == RespondentType.GOVERNMENT:
        respondent_name = complaint.respondent_data.get("agencyName", complaint.respondent_data.get("name", ""))
    
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
    respondent_type_key = str(complaint.respondent_type.value)
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