from datetime import datetime
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, Optional, List
import json

from models.comp_complaint import (
    Complaint, ComplaintStatus, ComplaintFilingType, 
    ConfidentialityLevel, UrgencyLevel
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
    """อัพเดทข้อมูลการมอบหมายตามฟอร์ม UI"""
    try:
        # ✅ ตรวจสอบข้อมูล
        validation = validate_assignment_data(assignment_data)
        if not validation["valid"]:
            return {
                "success": False, 
                "message": f"ข้อมูลไม่ถูกต้อง: {', '.join(validation['errors'])}"
            }
        
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
        # เก็บข้อมูลเดิมไว้สำหรับ log
        old_data = {
            "assigned_officer_id": str(complaint.assigned_officer_id) if complaint.assigned_officer_id else None,
            "confidentiality_level": complaint.confidentiality_level,
            "urgency_level": complaint.urgency_level
        }
        
        # อัพเดทข้อมูลอ้างอิง
        if "reference_number1" in assignment_data:
            complaint.reference_number = assignment_data["reference_number1"]
        if "reference_date1" in assignment_data:
            complaint.reference_date = datetime.fromisoformat(assignment_data["reference_date1"].replace('Z', '+00:00')) if assignment_data["reference_date1"] else None
        
        if "reference_number2" in assignment_data:
            complaint.reference_number2 = assignment_data["reference_number2"]
        if "reference_date2" in assignment_data:
            complaint.reference_date2 = datetime.fromisoformat(assignment_data["reference_date2"].replace('Z', '+00:00')) if assignment_data["reference_date2"] else None
        
        if "reference_number3" in assignment_data:
            complaint.reference_number3 = assignment_data["reference_number3"]
        if "reference_date3" in assignment_data:
            complaint.reference_date3 = datetime.fromisoformat(assignment_data["reference_date3"].replace('Z', '+00:00')) if assignment_data["reference_date3"] else None
        
        if "reference_number4" in assignment_data:
            complaint.reference_number4 = assignment_data["reference_number4"]
        if "reference_date4" in assignment_data:
            complaint.reference_date4 = datetime.fromisoformat(assignment_data["reference_date4"].replace('Z', '+00:00')) if assignment_data["reference_date4"] else None
        
        # อัพเดทข้อมูลเอกสาร
        if "document_number" in assignment_data:
            complaint.document_number = assignment_data["document_number"]
        if "document_date" in assignment_data:
            complaint.document_date = datetime.fromisoformat(assignment_data["document_date"].replace('Z', '+00:00')) if assignment_data["document_date"] else None
        
        # อัพเดทการมอบหมาย
        if "assigned_officer_id" in assignment_data:
            complaint.assigned_officer_id = UUID(assignment_data["assigned_officer_id"]) if assignment_data["assigned_officer_id"] else None
            if complaint.assigned_officer_id:
                complaint.assigned_date = datetime.now()
                
                # ดึงชื่อเจ้าหน้าที่
                officer = db.query(User).filter(User.id == complaint.assigned_officer_id).first()
                if officer:
                    complaint.assigned_to = f"{officer.first_name} {officer.last_name}"
        
        if "assigned_agency" in assignment_data:
            complaint.agency_sender = assignment_data["assigned_agency"]
        
        # อัพเดทระดับความลับและความเร่งด่วน
        if "confidentiality_level" in assignment_data:
            complaint.confidentiality_level = assignment_data["confidentiality_level"]
        
        if "urgency_level" in assignment_data:
            complaint.urgency_level = assignment_data["urgency_level"]
        
        # อัพเดทข้อมูลเพิ่มเติม
        if "has_complaints_addition" in assignment_data:
            # บันทึกลง JSON field หรือ boolean field ตามโครงสร้าง database
            pass
        
        if "has_complaints_objection" in assignment_data:
            pass
        
        if "has_prosecution_request" in assignment_data:
            pass
        
        if "ministry_regulation_clause" in assignment_data:
            # บันทึกข้อมูลมาตราที่เกี่ยวข้อง
            pass
        
        # อัพเดทเวลา
        complaint.updated_at = datetime.now()
        
        # บันทึกประวัติการเปลี่ยนแปลง
        changes = []
        for key, old_value in old_data.items():
            new_value = None
            if key == "assigned_officer_id" and "assigned_officer_id" in assignment_data:
                new_value = assignment_data["assigned_officer_id"]
            elif key == "confidentiality_level" and "confidentiality_level" in assignment_data:
                new_value = assignment_data["confidentiality_level"]
            elif key == "urgency_level" and "urgency_level" in assignment_data:
                new_value = assignment_data["urgency_level"]
            
            if new_value and old_value != new_value:
                changes.append(f"{key}: {old_value} → {new_value}")
        
        if changes:
            history = ComplaintStatusHistory(
                complaint_id=complaint_id,
                status=complaint.status,
                notes=f"อัพเดทการมอบหมาย: {'; '.join(changes)}",
                changed_by=updated_by,
                changed_at=datetime.now()
            )
            db.add(history)
        
        db.commit()
        db.refresh(complaint)
        
        # ✅ แก้ไข: Return dictionary แทน SQLAlchemy object
        return {
            "success": True,
            "message": "อัพเดทข้อมูลการมอบหมายเรียบร้อย",
            "complaint_id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "assigned_officer_id": str(complaint.assigned_officer_id) if complaint.assigned_officer_id else None,
            "assigned_to": complaint.assigned_to,
            "confidentiality_level": complaint.confidentiality_level,
            "urgency_level": complaint.urgency_level,
            "changes": changes,
            "updated_at": complaint.updated_at.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating assignment: {str(e)}")
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}

def get_assignment_form_data(db: Session, complaint_id: UUID) -> Dict:
    """ดึงข้อมูลสำหรับฟอร์ม Assignment"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"error": "ไม่พบเรื่องร้องเรียน"}
        
        # ดึงข้อมูล dropdown options
        complaint_types = db.query(ComplaintType).filter(ComplaintType.is_active == True).order_by(ComplaintType.name).all()
        complaint_channels = db.query(ComplaintChannel).filter(ComplaintChannel.is_active == True).order_by(ComplaintChannel.name).all()
        available_officers = db.query(User).filter(User.is_active == True).all()
        
        return {
            "complaint": {
                "id": str(complaint.id),
                "complaint_number": complaint.complaint_number,
                "subject": complaint.subject,
                "complaint_type": complaint.complaint_type,
                "status": complaint.status,
                
                # เลขอ้างอิงต่างๆ
                "reference_number": complaint.reference_number,
                "reference_date": complaint.reference_date.isoformat() if complaint.reference_date else None,
                "reference_number2": complaint.reference_number2,
                "reference_date2": complaint.reference_date2.isoformat() if complaint.reference_date2 else None,
                "reference_number3": complaint.reference_number3,
                "reference_date3": complaint.reference_date3.isoformat() if complaint.reference_date3 else None,
                "reference_number4": complaint.reference_number4,
                "reference_date4": complaint.reference_date4.isoformat() if complaint.reference_date4 else None,
                
                # เลขที่หนังสือ
                "document_number": complaint.document_number,
                "document_date": complaint.document_date.isoformat() if complaint.document_date else None,
                
                # ความลับและความเร่งด่วน
                "confidentiality_level": complaint.confidentiality_level,
                "urgency_level": complaint.urgency_level,
                
                # ประเภทการร้องเรียน
                "complaint_filing_type": complaint.complaint_filing_type,
                
                # หน่วยงานผู้ส่ง
                "agency_sender": complaint.agency_sender,
                
                # เลขอ้างอิงเพิ่มเติม
                "additional_reference_number1": complaint.additional_reference_number1,
                "additional_reference_date1": complaint.additional_reference_date1.isoformat() if complaint.additional_reference_date1 else None,
                "additional_reference_number2": complaint.additional_reference_number2,
                "additional_reference_date2": complaint.additional_reference_date2.isoformat() if complaint.additional_reference_date2 else None,
                
                # การมอบหมาย
                "assigned_officer_id": str(complaint.assigned_officer_id) if complaint.assigned_officer_id else None,
                "assigned_to": complaint.assigned_to,
                "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None,
                
                # ข้อมูลสำหรับการแสดงผล
                "created_at": complaint.created_at.isoformat(),
                "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None
            },
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