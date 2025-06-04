from datetime import datetime
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, Optional, List
import json

from models.comp_complaint import (
    Complaint, ComplaintStatus, ComplaintFilingType, 
    ConfidentialityLevel, UrgencyLevel, ComplaintStatusHistory
)
from models.user import User
from models.comp_complaint_types import ComplaintType, ComplaintSubType, ComplaintChannel

import logging
logger = logging.getLogger(__name__)

def validate_assignment_data(assignment_data: Dict[str, Any]) -> Dict:
    """ตรวจสอบความถูกต้องของข้อมูลการมอบหมาย"""
    errors = []
    
    # ตรวจสอบ confidentiality_level
    if "confidentiality_level" in assignment_data:
        valid_levels = ["normal", "confidential", "secret", "top_secret"]
        if assignment_data["confidentiality_level"] not in valid_levels:
            errors.append("ระดับความลับไม่ถูกต้อง")
    
    # ตรวจสอบ urgency_level
    if "urgency_level" in assignment_data:
        valid_urgency = ["low", "medium", "high", "urgent", "critical"]
        if assignment_data["urgency_level"] not in valid_urgency:
            errors.append("ระดับความเร่งด่วนไม่ถูกต้อง")
    
    # ตรวจสอบรูปแบบวันที่
    date_fields = ["reference_date", "reference_date2", "reference_date3", "reference_date4", "document_date"]
    for field in date_fields:
        if field in assignment_data and assignment_data[field]:
            try:
                if isinstance(assignment_data[field], str):
                    datetime.fromisoformat(assignment_data[field].replace('Z', '+00:00'))
            except ValueError:
                errors.append(f"รูปแบบวันที่ {field} ไม่ถูกต้อง")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def update_complaint_assignment_data(
    db: Session,
    complaint_id: UUID,
    assignment_data: Dict[str, Any],
    updated_by: UUID
) -> Dict:
    """อัพเดทข้อมูลการมอบหมายงาน"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}

        changes = []

        # ✅ 1. บันทึก reference_number1-4
        if "reference_number1" in assignment_data:
            old_value = complaint.reference_number
            complaint.reference_number = assignment_data["reference_number1"]
            if assignment_data["reference_number1"] != old_value:
                changes.append(f"เลขอ้างอิง 1: {old_value} → {assignment_data['reference_number1']}")

        if "reference_date1" in assignment_data and assignment_data["reference_date1"]:
            complaint.reference_date = datetime.fromisoformat(assignment_data["reference_date1"].replace('Z', '+00:00'))

        if "reference_number2" in assignment_data:
            old_value = complaint.reference_number2
            complaint.reference_number2 = assignment_data["reference_number2"]
            if assignment_data["reference_number2"] != old_value:
                changes.append(f"เลขอ้างอิง 2: {old_value} → {assignment_data['reference_number2']}")

        if "reference_date2" in assignment_data and assignment_data["reference_date2"]:
            complaint.reference_date2 = datetime.fromisoformat(assignment_data["reference_date2"].replace('Z', '+00:00'))

        if "reference_number3" in assignment_data:
            old_value = complaint.reference_number3
            complaint.reference_number3 = assignment_data["reference_number3"]
            if assignment_data["reference_number3"] != old_value:
                changes.append(f"เลขอ้างอิง 3: {old_value} → {assignment_data['reference_number3']}")

        if "reference_date3" in assignment_data and assignment_data["reference_date3"]:
            complaint.reference_date3 = datetime.fromisoformat(assignment_data["reference_date3"].replace('Z', '+00:00'))

        if "reference_number4" in assignment_data:
            old_value = complaint.reference_number4
            complaint.reference_number4 = assignment_data["reference_number4"]
            if assignment_data["reference_number4"] != old_value:
                changes.append(f"เลขอ้างอิง 4: {old_value} → {assignment_data['reference_number4']}")

        if "reference_date4" in assignment_data and assignment_data["reference_date4"]:
            complaint.reference_date4 = datetime.fromisoformat(assignment_data["reference_date4"].replace('Z', '+00:00'))

        # ✅ 2. บันทึก document_number และ document_date
        if "document_number" in assignment_data:
            old_value = complaint.document_number
            complaint.document_number = assignment_data["document_number"]
            if assignment_data["document_number"] != old_value:
                changes.append(f"เลขที่หนังสือ: {old_value} → {assignment_data['document_number']}")

        if "document_date" in assignment_data and assignment_data["document_date"]:
            complaint.document_date = datetime.fromisoformat(assignment_data["document_date"].replace('Z', '+00:00'))

        # ✅ 3. บันทึก assigned_agency
        if "assigned_agency" in assignment_data:
            old_value = complaint.agency_sender
            complaint.agency_sender = assignment_data["assigned_agency"]
            if assignment_data["assigned_agency"] != old_value:
                changes.append(f"หน่วยงานที่ส่ง: {old_value} → {assignment_data['assigned_agency']}")

        # ✅ 4. บันทึก complaint_filing_type
        if "complaint_filing_type" in assignment_data:
            old_value = complaint.complaint_filing_type
            complaint.complaint_filing_type = assignment_data["complaint_filing_type"]
            if assignment_data["complaint_filing_type"] != old_value:
                changes.append(f"ประเภทการยื่น: {old_value} → {assignment_data['complaint_filing_type']}")

        # ✅ 5. บันทึกฟิลด์ใหม่ (ลบฟิลด์เก่าออก)
        # ลบส่วนนี้ออก - ไม่มีแล้ว
        # if "has_complaints_addition" in assignment_data:
        # if "has_complaints_objection" in assignment_data:
        # if "has_prosecution_request" in assignment_data:
        # if "ministry_regulation_clause" in assignment_data:

        # ✅ 6. ตรวจสอบและบันทึกประเภทการร้องเรียนใหม่
        complaint_types_count = 0
        
        # ใช้ฟิลด์ใหม่ที่มีใน model แล้ว
        if "new_complaint" in assignment_data:
            old_value = complaint.new_complaint
            complaint.new_complaint = bool(assignment_data["new_complaint"])
            if complaint.new_complaint != old_value:
                changes.append(f"ร้องเรียนใหม่: {old_value} → {complaint.new_complaint}")
            if complaint.new_complaint:
                complaint_types_count += 1

        if "add_more_complaint_to_ref" in assignment_data:
            old_value = complaint.add_more_complaint_to_ref
            complaint.add_more_complaint_to_ref = bool(assignment_data["add_more_complaint_to_ref"])
            if complaint.add_more_complaint_to_ref != old_value:
                changes.append(f"ร้องเรียนเพิ่มเติม: {old_value} → {complaint.add_more_complaint_to_ref}")
            if complaint.add_more_complaint_to_ref:
                complaint_types_count += 1
                
                # ✅ ถ้าเป็นร้องเรียนเพิ่มเติม ต้องมี additional_reference_number1
                if "additional_reference_number1" not in assignment_data or not assignment_data["additional_reference_number1"]:
                    return {
                        "success": False, 
                        "message": "ร้องเรียนเพิ่มเติมต้องระบุเลขอ้างอิง 1"
                    }
                if "additional_reference_date1" not in assignment_data or not assignment_data["additional_reference_date1"]:
                    return {
                        "success": False, 
                        "message": "ร้องเรียนเพิ่มเติมต้องระบุวันที่อ้างอิง 1"
                    }

        if "group_work" in assignment_data:
            old_value = complaint.group_work
            complaint.group_work = bool(assignment_data["group_work"])
            if complaint.group_work != old_value:
                changes.append(f"รับเรื่องจากคณะบัตรสนเท่ห์: {old_value} → {complaint.group_work}")
            if complaint.group_work:
                complaint_types_count += 1
                
                # ✅ ถ้าเป็นรับเรื่องจากคณะบัตรสนเท่ห์ ต้องมี additional_reference_number2
                if "additional_reference_number2" not in assignment_data or not assignment_data["additional_reference_number2"]:
                    return {
                        "success": False, 
                        "message": "รับเรื่องจากคณะบัตรสนเท่ห์ต้องระบุเลขอ้างอิง 2"
                    }
                if "additional_reference_date2" not in assignment_data or not assignment_data["additional_reference_date2"]:
                    return {
                        "success": False, 
                        "message": "รับเรื่องจากคณะบัตรสนเท่ห์ต้องระบุวันที่อ้างอิง 2"
                    }

        # ✅ ตรวจสอบว่าเลือกประเภทได้เพียงอย่างเดียว
        if complaint_types_count > 1:
            return {
                "success": False, 
                "message": "กรุณาเลือกประเภทการร้องเรียนเพียงอย่างเดียว"
            }
        elif complaint_types_count == 0:
            # ถ้าไม่ได้เลือกเลย ให้เป็น new_complaint = true
            complaint.new_complaint = True
            complaint.add_more_complaint_to_ref = False
            complaint.group_work = False

        # ✅ ถ้าเป็น new_complaint ล้างข้อมูล additional_reference
        if complaint.new_complaint:
            complaint.additional_reference_number1 = None
            complaint.additional_reference_date1 = None
            complaint.additional_reference_number2 = None
            complaint.additional_reference_date2 = None

        # ✅ บันทึก regulation_reference
        if "regulation_reference" in assignment_data:
            old_value = complaint.regulation_reference
            complaint.regulation_reference = assignment_data["regulation_reference"]
            if assignment_data["regulation_reference"] != old_value:
                changes.append(f"อ้างอิงกฎหมาย: {old_value} → {assignment_data['regulation_reference']}")

        # ✅ 7. บันทึก additional_reference
        if "additional_reference_number1" in assignment_data:
            old_value = complaint.additional_reference_number1
            complaint.additional_reference_number1 = assignment_data["additional_reference_number1"]
            if assignment_data["additional_reference_number1"] != old_value:
                changes.append(f"เลขอ้างอิงเพิ่มเติม 1: {old_value} → {assignment_data['additional_reference_number1']}")

        if "additional_reference_date1" in assignment_data and assignment_data["additional_reference_date1"]:
            complaint.additional_reference_date1 = datetime.fromisoformat(assignment_data["additional_reference_date1"].replace('Z', '+00:00'))

        if "additional_reference_number2" in assignment_data:
            old_value = complaint.additional_reference_number2
            complaint.additional_reference_number2 = assignment_data["additional_reference_number2"]
            if assignment_data["additional_reference_number2"] != old_value:
                changes.append(f"เลขอ้างอิงเพิ่มเติม 2: {old_value} → {assignment_data['additional_reference_number2']}")

        if "additional_reference_date2" in assignment_data and assignment_data["additional_reference_date2"]:
            complaint.additional_reference_date2 = datetime.fromisoformat(assignment_data["additional_reference_date2"].replace('Z', '+00:00'))

        # ✅ 8. บันทึกข้อมูลอื่นๆ
        if "assigned_officer_id" in assignment_data and assignment_data["assigned_officer_id"]:
            try:
                officer_id = UUID(assignment_data["assigned_officer_id"])
                old_value = complaint.assigned_officer_id
                complaint.assigned_officer_id = officer_id
                complaint.assigned_date = datetime.now()
                
                officer = db.query(User).filter(User.id == officer_id).first()
                if officer:
                    complaint.assigned_to = f"{officer.first_name} {officer.last_name}"
                    changes.append(f"มอบหมายให้: {complaint.assigned_to}")
                
            except ValueError:
                logger.warning(f"Invalid officer ID format: {assignment_data['assigned_officer_id']}")

        if "confidentiality_level" in assignment_data:
            old_value = complaint.confidentiality_level
            complaint.confidentiality_level = assignment_data["confidentiality_level"]
            if assignment_data["confidentiality_level"] != old_value:
                changes.append(f"ระดับความลับ: {old_value} → {assignment_data['confidentiality_level']}")

        if "urgency_level" in assignment_data:
            old_value = complaint.urgency_level
            complaint.urgency_level = assignment_data["urgency_level"]
            if assignment_data["urgency_level"] != old_value:
                changes.append(f"ระดับความเร่งด่วน: {old_value} → {assignment_data['urgency_level']}")

        # บันทึกการเปลี่ยนแปลง
        complaint.updated_at = datetime.now()
        
        db.commit()
        db.refresh(complaint)

        return {
            "success": True,
            "message": "อัพเดทข้อมูลการมอบหมายเรียบร้อย",
            "complaint_id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "complaint_type": {
                "new_complaint": complaint.new_complaint,
                "add_more_complaint_to_ref": complaint.add_more_complaint_to_ref,
                "group_work": complaint.group_work
            },
            "assigned_officer_id": str(complaint.assigned_officer_id) if complaint.assigned_officer_id else None,
            "assigned_to": complaint.assigned_to,
            "confidentiality_level": complaint.confidentiality_level,
            "urgency_level": complaint.urgency_level,
            "changes": changes,
            "updated_at": complaint.updated_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error updating assignment: {str(e)}")
        db.rollback()
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}

def get_assignment_form_data(db: Session, complaint_id: UUID) -> Dict:
    """ดึงข้อมูลสำหรับฟอร์ม Assignment"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            return {"error": "ไม่พบเรื่องร้องเรียน"}
        
        complaint_data = {
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
            # ✅ ใช้ฟิลด์ใหม่แทนฟิลด์เก่า
            "new_complaint": complaint.new_complaint,
            "add_more_complaint_to_ref": complaint.add_more_complaint_to_ref,
            "group_work": complaint.group_work,
            "regulation_reference": complaint.regulation_reference,
            "created_at": complaint.created_at.isoformat(),
            "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None
        }

        # ดึงข้อมูล dropdown options
        complaint_types = db.query(ComplaintType).filter(ComplaintType.is_active == True).order_by(ComplaintType.name).all()
        complaint_channels = db.query(ComplaintChannel).filter(ComplaintChannel.is_active == True).order_by(ComplaintChannel.name).all()
        available_officers = db.query(User).filter(User.is_active == True).all()
        
        return {
            "complaint": complaint_data,
            "options": {
                "complaint_types": [{"value": str(ct.id), "label": ct.name} for ct in complaint_types],
                "complaint_channels": [{"value": str(cc.id), "label": cc.name} for cc in complaint_channels],
                "officers": [{"value": str(u.id), "label": f"{u.first_name} {u.last_name}"} for u in available_officers],
                "confidentiality_levels": [
                    {"value": "normal", "label": "ปกติ"},
                    {"value": "confidential", "label": "ลับ"},
                    {"value": "secret", "label": "ลับมาก"},
                    {"value": "top_secret", "label": "ลับที่สุด"}
                ],
                "urgency_levels": [
                    {"value": "low", "label": "ไม่เร่งด่วน"},
                    {"value": "medium", "label": "เร่งด่วน"},
                    {"value": "high", "label": "ด่วน"},
                    {"value": "urgent", "label": "ด่วนมาก"},
                    {"value": "critical", "label": "ด่วนที่สุด"}
                ],
                "filing_types": [
                    {"value": "new", "label": "เรื่องส่องเค้นใหม่"},
                    {"value": "additional", "label": "เรื่องส่องเค้นเพิ่มเติม"},
                    {"value": "anonymous", "label": "รับเรื่องจากคณะทำงานบัตรสนเท่ห์"}
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting assignment form data: {str(e)}")
        return {"error": f"เกิดข้อผิดพลาด: {str(e)}"}

def link_related_complaint(
    db: Session,
    main_complaint_id: UUID,
    related_complaint_number: str,
    updated_by: UUID
) -> Dict:
    """เชื่อมโยงเรื่องร้องเรียนที่เกี่ยวข้อง"""
    try:
        # หาเรื่องหลัก
        main_complaint = db.query(Complaint).filter(Complaint.id == main_complaint_id).first()
        if not main_complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียนหลัก"}
        
        # หาเรื่องที่ต้องการเชื่อมโยง
        related_complaint = db.query(Complaint).filter(
            Complaint.complaint_number == related_complaint_number
        ).first()
        if not related_complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียนที่ต้องการเชื่อมโยง"}
        
        # อัพเดทข้อมูลความสัมพันธ์
        try:
            related_list = json.loads(main_complaint.related_complaints) if main_complaint.related_complaints else []
        except:
            related_list = []
        
        # เพิ่มเรื่องที่เกี่ยวข้องใหม่
        related_info = {
            "id": str(related_complaint.id),
            "complaint_number": related_complaint.complaint_number,
            "subject": related_complaint.subject,
            "linked_at": datetime.now().isoformat()
        }
        
        # ตรวจสอบว่ายังไม่ได้เชื่อมโยงไว้แล้ว
        if not any(item.get("id") == str(related_complaint.id) for item in related_list):
            related_list.append(related_info)
            main_complaint.related_complaints = json.dumps(related_list, ensure_ascii=False)
            main_complaint.updated_at = datetime.now()
            
            db.commit()
        
        return {
            "success": True,
            "message": "เชื่อมโยงเรื่องร้องเรียนเรียบร้อย",
            "main_complaint_number": main_complaint.complaint_number,
            "related_complaint_number": related_complaint.complaint_number
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error linking complaint: {str(e)}")
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}

def update_complainant_data(
    db: Session,
    complaint_id: UUID,
    complainant_data: Dict[str, Any],
    updated_by: UUID
) -> Dict:
    """อัพเดทข้อมูลผู้ร้องเรียน"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
        # Merge ข้อมูลใหม่
        try:
            current_data = json.loads(complaint.complainant_data) if complaint.complainant_data else {}
        except:
            current_data = {}
        
        # อัพเดทข้อมูล
        for key, value in complainant_data.items():
            current_data[key] = value
        
        complaint.complainant_data = json.dumps(current_data, ensure_ascii=False)
        complaint.updated_at = datetime.now()
        
        db.commit()
        
        return {
            "success": True,
            "message": "อัพเดทข้อมูลผู้ร้องเรียนเรียบร้อย",
            "complaint_id": str(complaint.id),
            "updated_data": current_data
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating complainant: {str(e)}")
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}

def update_respondent_data(
    db: Session,
    complaint_id: UUID,
    respondent_data: Dict[str, Any],
    updated_by: UUID
) -> Dict:
    """อัพเดทข้อมูลผู้ถูกร้องเรียน"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
        # Merge ข้อมูลใหม่
        try:
            current_data = json.loads(complaint.respondent_data) if complaint.respondent_data else {}
        except:
            current_data = {}
        
        # อัพเดทข้อมูล
        for key, value in respondent_data.items():
            current_data[key] = value
        
        complaint.respondent_data = json.dumps(current_data, ensure_ascii=False)
        complaint.updated_at = datetime.now()
        
        db.commit()
        
        return {
            "success": True,
            "message": "อัพเดทข้อมูลผู้ถูกร้องเรียนเรียบร้อย",
            "complaint_id": str(complaint.id),
            "updated_data": current_data
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating respondent: {str(e)}")
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}

def search_complaint_for_reference(db: Session, search_term: str, limit: int = 10) -> List[Dict]:
    """ค้นหาเรื่องร้องเรียนสำหรับการอ้างอิง"""
    try:
        complaints = db.query(Complaint).filter(
            (Complaint.complaint_number.contains(search_term)) |
            (Complaint.subject.contains(search_term))
        ).limit(limit).all()
        
        results = []
        for complaint in complaints:
            results.append({
                "id": str(complaint.id),
                "complaint_number": complaint.complaint_number,
                "subject": complaint.subject,
                "status": complaint.status,
                "created_at": complaint.created_at.isoformat()
            })
        
        return results
        
    except Exception as e:
        logger.error(f"Error searching complaints: {str(e)}")
        return []

def add_additional_complaint_reference(
    db: Session,
    complaint_id: UUID,
    reference_complaint_id: Optional[UUID] = None,
    reference_complaint_number: Optional[str] = None,
    updated_by: UUID = None
) -> Dict:
    """เพิ่มเลขอ้างอิงสำหรับเรื่องร้องเรียนเพิ่มเติม"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
        # หาเรื่องอ้างอิง
        reference_complaint = None
        if reference_complaint_id:
            reference_complaint = db.query(Complaint).filter(
                Complaint.id == reference_complaint_id
            ).first()
        elif reference_complaint_number:
            reference_complaint = db.query(Complaint).filter(
                Complaint.complaint_number == reference_complaint_number
            ).first()
        
        if not reference_complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียนอ้างอิง"}
        
        # บันทึกลง additional_reference_number
        current_time = datetime.now()
        
        if not complaint.additional_reference_number1:
            complaint.additional_reference_number1 = reference_complaint.complaint_number
            complaint.additional_reference_date1 = current_time
            reference_field = "additional_reference_number1"
        elif not complaint.additional_reference_number2:
            complaint.additional_reference_number2 = reference_complaint.complaint_number
            complaint.additional_reference_date2 = current_time
            reference_field = "additional_reference_number2"
        else:
            return {"success": False, "message": "ช่องเลขอ้างอิงเต็มแล้ว"}
        
        # อัพเดท parent relationship
        complaint.parent_complaint_id = reference_complaint.id
        complaint.updated_at = current_time
        
        db.commit()
        
        return {
            "success": True,
            "message": "เพิ่มเลขอ้างอิงเรียบร้อย",
            "complaint_id": str(complaint_id),
            "reference_complaint_id": str(reference_complaint.id),
            "reference_complaint_number": reference_complaint.complaint_number,
            "reference_field": reference_field,
            "reference_date": current_time.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding reference: {str(e)}")
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}
    

def get_complaint_assignment_history(
    db: Session,
    complaint_id: UUID,
    limit: int = 20
) -> List[Dict]:
    """ดูประวัติการเปลี่ยนแปลงการมอบหมาย"""
    try:
        history = db.query(ComplaintStatusHistory).filter(
            ComplaintStatusHistory.complaint_id == complaint_id
        ).order_by(ComplaintStatusHistory.changed_at.desc()).limit(limit).all()
        
        results = []
        for record in history:
            # ดึงข้อมูลผู้เปลี่ยนแปลง
            changed_by_user = None
            if record.changed_by:
                changed_by_user = db.query(User).filter(User.id == record.changed_by).first()
            
            results.append({
                "id": str(record.id),
                "status": record.status,
                "notes": record.notes,
                "changed_at": record.changed_at.isoformat(),
                "changed_by": {
                    "id": str(record.changed_by) if record.changed_by else None,
                    "name": f"{changed_by_user.first_name} {changed_by_user.last_name}" if changed_by_user else "ระบบ"
                }
            })
        
        return results
        
    except Exception as e:
        logger.error(f"Error getting assignment history: {str(e)}")
        return []

def bulk_assignment_complaints(
    db: Session,
    complaint_ids: List[UUID],
    assignment_data: Dict[str, Any],
    updated_by: UUID
) -> Dict:
    """มอบหมายงานแบบ bulk หลายเรื่องพร้อมกัน"""
    try:
        success_count = 0
        error_count = 0
        errors = []
        
        for complaint_id in complaint_ids:
            result = update_complaint_assignment_data(
                db=db,
                complaint_id=complaint_id,
                assignment_data=assignment_data,
                updated_by=updated_by
            )
            
            if result.get("success"):
                success_count += 1
            else:
                error_count += 1
                errors.append({
                    "complaint_id": str(complaint_id),
                    "error": result.get("message", "Unknown error")
                })
        
        return {
            "success": error_count == 0,
            "message": f"ประมวลผลเสร็จสิ้น: สำเร็จ {success_count} เรื่อง, ผิดพลาด {error_count} เรื่อง",
            "summary": {
                "total": len(complaint_ids),
                "success": success_count,
                "error": error_count
            },
            "errors": errors if errors else None
        }
        
    except Exception as e:
        logger.error(f"Error in bulk assignment: {str(e)}")
        return {
            "success": False,
            "message": f"เกิดข้อผิดพลาดในการมอบหมายงานแบบ bulk: {str(e)}"
        }

def get_assignment_statistics(
    db: Session,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> Dict:
    """สถิติการมอบหมายงาน"""
    try:
        from sqlalchemy import func, and_
        
        # Base query
        query = db.query(Complaint)
        
        # Filter by date range if provided
        if date_from:
            query = query.filter(Complaint.created_at >= date_from)
        if date_to:
            query = query.filter(Complaint.created_at <= date_to)
        
        # Count by status
        status_counts = {}
        for status in ['submitted', 'assigned', 'in_progress', 'resolved', 'closed']:
            count = query.filter(Complaint.status == status).count()
            status_counts[status] = count
        
        # Count by urgency level
        urgency_counts = {}
        for urgency in ['low', 'medium', 'high', 'urgent', 'critical']:
            count = query.filter(Complaint.urgency_level == urgency).count()
            urgency_counts[urgency] = count
        
        # Count by confidentiality level
        confidentiality_counts = {}
        for level in ['normal', 'confidential', 'secret', 'top_secret']:
            count = query.filter(Complaint.confidentiality_level == level).count()
            confidentiality_counts[level] = count
        
        # Assigned vs Unassigned
        assigned_count = query.filter(Complaint.assigned_officer_id.isnot(None)).count()
        unassigned_count = query.filter(Complaint.assigned_officer_id.is_(None)).count()
        
        # Officer workload
        officer_workload = db.query(
            Complaint.assigned_officer_id,
            func.count(Complaint.id).label('count')
        ).filter(
            Complaint.assigned_officer_id.isnot(None)
        ).group_by(Complaint.assigned_officer_id).all()
        
        officer_stats = []
        for officer_id, count in officer_workload:
            officer = db.query(User).filter(User.id == officer_id).first()
            if officer:
                officer_stats.append({
                    "officer_id": str(officer_id),
                    "officer_name": f"{officer.first_name} {officer.last_name}",
                    "complaint_count": count
                })
        
        return {
            "total_complaints": query.count(),
            "status_distribution": status_counts,
            "urgency_distribution": urgency_counts,
            "confidentiality_distribution": confidentiality_counts,
            "assignment_status": {
                "assigned": assigned_count,
                "unassigned": unassigned_count
            },
            "officer_workload": officer_stats,
            "date_range": {
                "from": date_from.isoformat() if date_from else None,
                "to": date_to.isoformat() if date_to else None
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting assignment statistics: {str(e)}")
        return {"error": f"เกิดข้อผิดพลาด: {str(e)}"}

def validate_officer_assignment(
    db: Session,
    officer_id: UUID,
    complaint_type: str = None,
    urgency_level: str = None
) -> Dict:
    """ตรวจสอบความเหมาะสมของการมอบหมายเจ้าหน้าที่"""
    try:
        officer = db.query(User).filter(User.id == officer_id, User.is_active == True).first()
        if not officer:
            return {
                "valid": False,
                "message": "ไม่พบเจ้าหน้าที่หรือเจ้าหน้าที่ไม่ได้ใช้งาน"
            }
        
        # ตรวจสอบภาระงานปัจจุบัน
        current_workload = db.query(Complaint).filter(
            Complaint.assigned_officer_id == officer_id,
            Complaint.status.in_(['assigned', 'in_progress'])
        ).count()
        
        # กำหนดขีดจำกัดงาน (ปรับตามนีค์องค์กร)
        max_workload = 20
        
        warnings = []
        if current_workload >= max_workload:
            warnings.append(f"เจ้าหน้าที่มีภาระงาน {current_workload} เรื่อง (เกินขีดจำกัด {max_workload} เรื่อง)")
        
        # ตรวจสอบความเหมาะสมตามประเภทเรื่อง
        if complaint_type and urgency_level == 'critical':
            # ตรวจสอบประสบการณ์กับเรื่องด่วนที่สุด
            critical_experience = db.query(Complaint).filter(
                Complaint.assigned_officer_id == officer_id,
                Complaint.urgency_level == 'critical',
                Complaint.status == 'resolved'
            ).count()
            
            if critical_experience < 3:
                warnings.append("เจ้าหน้าที่มีประสบการณ์จัดการเรื่องด่วนที่สุดน้อย")
        
        return {
            "valid": True,
            "officer": {
                "id": str(officer.id),
                "name": f"{officer.first_name} {officer.last_name}",
                "current_workload": current_workload,
                "max_workload": max_workload
            },
            "warnings": warnings,
            "recommendation": "เหมาะสม" if not warnings else "ควรพิจารณา"
        }
        
    except Exception as e:
        logger.error(f"Error validating officer assignment: {str(e)}")
        return {
            "valid": False,
            "message": f"เกิดข้อผิดพลาด: {str(e)}"
        }

def auto_assign_complaint(
    db: Session,
    complaint_id: UUID,
    assignment_rules: Dict[str, Any] = None
) -> Dict:
    """มอบหมายงานอัตโนมัติตามกฎที่กำหนด"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
        if complaint.assigned_officer_id:
            return {"success": False, "message": "เรื่องนี้มีการมอบหมายแล้ว"}
        
        # กฎการมอบหมายอัตโนมัติ
        if not assignment_rules:
            assignment_rules = {
                "by_urgency": True,
                "by_workload": True,
                "by_expertise": False
            }
        
        # หาเจ้าหน้าที่ที่เหมาะสม
        available_officers = db.query(User).filter(
            User.is_active == True,
            # สามารถเพิ่มเงื่อนไข role ได้
        ).all()
        
        if not available_officers:
            return {"success": False, "message": "ไม่มีเจ้าหน้าที่ที่พร้อมรับงาน"}
        
        # คำนวณคะแนนความเหมาะสม
        officer_scores = []
        for officer in available_officers:
            score = 0
            
            # คะแนนจากภาระงาน (น้อยกว่า = ดีกว่า)
            if assignment_rules.get("by_workload"):
                workload = db.query(Complaint).filter(
                    Complaint.assigned_officer_id == officer.id,
                    Complaint.status.in_(['assigned', 'in_progress'])
                ).count()
                score += max(0, 100 - (workload * 5))  # ลบคะแนนตามจำนวนงาน
            
            # คะแนนจากความเร่งด่วน (มีประสบการณ์กับเรื่องเร่งด่วน)
            if assignment_rules.get("by_urgency") and complaint.urgency_level in ['urgent', 'critical']:
                urgent_experience = db.query(Complaint).filter(
                    Complaint.assigned_officer_id == officer.id,
                    Complaint.urgency_level.in_(['urgent', 'critical']),
                    Complaint.status == 'resolved'
                ).count()
                score += urgent_experience * 10
            
            officer_scores.append({
                "officer": officer,
                "score": score
            })
        
        # เลือกเจ้าหน้าที่ที่มีคะแนนสูงสุด
        best_officer = max(officer_scores, key=lambda x: x["score"])["officer"]
        
        # มอบหมายงาน
        assignment_data = {
            "assigned_officer_id": str(best_officer.id),
            "urgency_level": complaint.urgency_level,
            "confidentiality_level": complaint.confidentiality_level
        }
        
        result = update_complaint_assignment_data(
            db=db,
            complaint_id=complaint_id,
            assignment_data=assignment_data,
            updated_by=best_officer.id  # หรือ system user ID
        )
        
        if result.get("success"):
            result["auto_assigned"] = True
            result["assigned_officer"] = {
                "id": str(best_officer.id),
                "name": f"{best_officer.first_name} {best_officer.last_name}"
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Error in auto assignment: {str(e)}")
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}