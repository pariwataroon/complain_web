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
        # ✅ เพิ่มการตรวจสอบข้อมูล
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
            "assigned_officer_id": complaint.assigned_officer_id,
            "confidentiality_level": complaint.confidentiality_level,
            "urgency_level": complaint.urgency_level
        }
        
        # ✅ อัพเดทเลขอ้างอิงตามฟอร์ม
        if "reference_number" in assignment_data:
            complaint.reference_number = assignment_data["reference_number"]
        if "reference_date" in assignment_data:
            complaint.reference_date = assignment_data["reference_date"]
            
        if "reference_number2" in assignment_data:
            complaint.reference_number2 = assignment_data["reference_number2"]
        if "reference_date2" in assignment_data:
            complaint.reference_date2 = assignment_data["reference_date2"]
            
        if "reference_number3" in assignment_data:
            complaint.reference_number3 = assignment_data["reference_number3"]
        if "reference_date3" in assignment_data:
            complaint.reference_date3 = assignment_data["reference_date3"]
            
        if "reference_number4" in assignment_data:
            complaint.reference_number4 = assignment_data["reference_number4"]
        if "reference_date4" in assignment_data:
            complaint.reference_date4 = assignment_data["reference_date4"]
        
        # ✅ เลขที่หนังสือ
        if "document_number" in assignment_data:
            complaint.document_number = assignment_data["document_number"]
        if "document_date" in assignment_data:
            complaint.document_date = assignment_data["document_date"]
        
        # ✅ หน่วยงานผู้ส่ง
        if "agency_sender" in assignment_data:
            complaint.agency_sender = assignment_data["agency_sender"]
        
        # ✅ ความลับและความเร่งด่วน
        if "confidentiality_level" in assignment_data:
            complaint.confidentiality_level = ConfidentialityLevel(assignment_data["confidentiality_level"])
        if "urgency_level" in assignment_data:
            complaint.urgency_level = UrgencyLevel(assignment_data["urgency_level"])
        
        # ✅ ประเภทการร้องเรียน (checkbox)
        if "complaint_filing_type" in assignment_data:
            complaint.complaint_filing_type = ComplaintFilingType(assignment_data["complaint_filing_type"])
        
        # ✅ เลขอ้างอิงเพิ่มเติม
        if "additional_reference_number1" in assignment_data:
            complaint.additional_reference_number1 = assignment_data["additional_reference_number1"]
        if "additional_reference_date1" in assignment_data:
            complaint.additional_reference_date1 = assignment_data["additional_reference_date1"]
            
        if "additional_reference_number2" in assignment_data:
            complaint.additional_reference_number2 = assignment_data["additional_reference_number2"]
        if "additional_reference_date2" in assignment_data:
            complaint.additional_reference_date2 = assignment_data["additional_reference_date2"]
        
        # ✅ การมอบหมายเจ้าหน้าที่
        if "assigned_officer_id" in assignment_data:
            complaint.assigned_officer_id = assignment_data["assigned_officer_id"]
            complaint.assigned_date = datetime.now()
            
            # อัพเดทชื่อเจ้าหน้าที่
            if assignment_data["assigned_officer_id"]:
                officer = db.query(User).filter(User.id == assignment_data["assigned_officer_id"]).first()
                if officer:
                    complaint.assigned_to = f"{officer.first_name} {officer.last_name}"
        
        # ✅ เพิ่มการบันทึก audit log
        changes = []
        for key, old_value in old_data.items():
            if key in assignment_data:
                new_value = assignment_data[key]
                if old_value != new_value:
                    changes.append(f"{key}: {old_value} → {new_value}")
        
        if changes:
            # บันทึกประวัติการเปลี่ยนแปลง
            from models.comp_complaint import ComplaintStatusHistory
            history = ComplaintStatusHistory(
                complaint_id=complaint_id,
                status=complaint.status,
                notes=f"อัพเดทการมอบหมาย: {'; '.join(changes)}",
                changed_by=updated_by
            )
            db.add(history)
        
        complaint.updated_at = datetime.now()
        
        db.commit()
        db.refresh(complaint)
        
        return {
            "success": True,
            "message": "อัพเดทข้อมูลการมอบหมายเรียบร้อย",
            "complaint": complaint,
            "changes": changes
        }
        
    except Exception as e:
        db.rollback()
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
        
        # ✅ แก้ไข: เปลี่ยนจาก name__in เป็นการ query ธรรมดา
        available_officers = db.query(User).filter(
            User.is_active == True
            # ✅ ลบส่วน roles filter ออกไปก่อน เพื่อให้ทำงานได้
            # User.roles.any(name__in=['officer', 'supervisor', 'admin'])
        ).all()
        
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
                "assigned_officer_id": complaint.assigned_officer_id,
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
    """เชื่อมโยงเรื่องร้องเรียนเพิ่มเติมกับเรื่องหลัก"""
    try:
        # ค้นหาเรื่องหลัก
        main_complaint = db.query(Complaint).filter(Complaint.id == main_complaint_id).first()
        if not main_complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียนหลัก"}
        
        # ค้นหาเรื่องที่เกี่ยวข้องจากเลขที่
        related_complaint = db.query(Complaint).filter(
            Complaint.complaint_number == related_complaint_number
        ).first()
        
        if not related_complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียนที่อ้างอิง"}
        
        # ✅ บันทึกข้อมูลลงใน additional_reference_number1
        if not main_complaint.additional_reference_number1:
            main_complaint.additional_reference_number1 = related_complaint_number
            main_complaint.additional_reference_date1 = datetime.now()
            ref_field = "additional_reference_number1"
        elif not main_complaint.additional_reference_number2:
            main_complaint.additional_reference_number2 = related_complaint_number
            main_complaint.additional_reference_date2 = datetime.now()
            ref_field = "additional_reference_number2"
        else:
            return {"success": False, "message": "ช่องเลขอ้างอิงเต็มแล้ว (สูงสุด 2 เรื่อง)"}
        
        # ✅ อัพเดท parent-child relationship
        main_complaint.parent_complaint_id = related_complaint.id
        
        # ✅ อัพเดท related_complaints array
        related_complaints = []
        if main_complaint.related_complaints:
            try:
                related_complaints = json.loads(main_complaint.related_complaints)
            except:
                related_complaints = []
        
        if str(related_complaint.id) not in related_complaints:
            related_complaints.append(str(related_complaint.id))
            main_complaint.related_complaints = json.dumps(related_complaints)
        
        main_complaint.updated_at = datetime.now()
        
        db.commit()
        db.refresh(main_complaint)
        
        return {
            "success": True,
            "message": f"เชื่อมโยงเรื่องร้องเรียนเรียบร้อยแล้ว (บันทึกใน {ref_field})",
            "linked_complaint": {
                "main_complaint_id": str(main_complaint.id),
                "related_complaint_id": str(related_complaint.id),
                "reference_field": ref_field
            }
        }
        
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}

def update_complainant_data(
    db: Session,
    complaint_id: UUID,
    complainant_data: Dict[str, Any],
    updated_by: UUID
) -> Dict:
    """อัพเดทข้อมูลผู้ร้องเรียน (รวมผู้ลงนาม)"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
        # Merge ข้อมูลใหม่กับข้อมูลเดิม
        current_data = {}
        if complaint.complainant_data:
            try:
                current_data = json.loads(complaint.complainant_data) if isinstance(complaint.complainant_data, str) else complaint.complainant_data
            except:
                current_data = {}
        
        # อัพเดทข้อมูลผู้ลงนาม
        if "signer" in complainant_data:
            current_data["signer"] = complainant_data["signer"]
        
        # อัพเดทข้อมูลผู้รับมอบอำนาจ
        if "delegate" in complainant_data:
            current_data["delegate"] = complainant_data["delegate"]
        
        # อัพเดทข้อมูลทั่วไป
        allowed_fields = ["name", "idCard", "address", "phone", "email", "province", "districts", "subdistricts", "zipcode"]
        for field in allowed_fields:
            if field in complainant_data:
                current_data[field] = complainant_data[field]
        
        complaint.complainant_data = json.dumps(current_data, ensure_ascii=False)
        complaint.updated_at = datetime.now()
        
        db.commit()
        db.refresh(complaint)
        
        return {
            "success": True,
            "message": "อัพเดทข้อมูลผู้ร้องเรียนเรียบร้อย",
            "updated_data": current_data
        }
        
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}

def update_respondent_data(
    db: Session,
    complaint_id: UUID,
    respondent_data: Dict[str, Any],
    updated_by: UUID
) -> Dict:
    """อัพเดทข้อมูลผู้ถูกร้องเรียน (รวมที่อยู่)"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
        # Merge ข้อมูลใหม่กับข้อมูลเดิม
        current_data = {}
        if complaint.respondent_data:
            try:
                current_data = json.loads(complaint.respondent_data) if isinstance(complaint.respondent_data, str) else complaint.respondent_data
            except:
                current_data = {}
        
        # อัพเดทข้อมูลที่อยู่
        address_fields = ["address", "province", "districts", "subdistricts", "zipcode"]
        for field in address_fields:
            if field in respondent_data:
                current_data[field] = respondent_data[field]
        
        # อัพเดทข้อมูลทั่วไป
        general_fields = ["name", "idCard", "phone", "email", "companyName", "agencyName", "taxId", "registrationNumber"]
        for field in general_fields:
            if field in respondent_data:
                current_data[field] = respondent_data[field]
        
        complaint.respondent_data = json.dumps(current_data, ensure_ascii=False)
        
        # อัพเดทข้อมูลสถานที่เกิดเหตุถ้ามีการเปลี่ยน
        if "province" in respondent_data:
            province_data = respondent_data["province"]
            if isinstance(province_data, dict):
                complaint.incident_province_id = province_data.get("value")
                complaint.incident_province = province_data.get("label")
        
        if "districts" in respondent_data:
            district_data = respondent_data["districts"]
            if isinstance(district_data, dict):
                complaint.incident_district_id = district_data.get("value")
                complaint.incident_district = district_data.get("label")
        
        if "subdistricts" in respondent_data:
            subdistrict_data = respondent_data["subdistricts"]
            if isinstance(subdistrict_data, dict):
                complaint.incident_subdistrict_id = subdistrict_data.get("value")
                complaint.incident_subdistrict = subdistrict_data.get("label")
        
        complaint.updated_at = datetime.now()
        
        db.commit()
        db.refresh(complaint)
        
        return {
            "success": True,
            "message": "อัพเดทข้อมูลผู้ถูกร้องเรียนเรียบร้อย",
            "updated_data": current_data
        }
        
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}

def search_complaint_for_reference(db: Session, search_term: str) -> List[Dict]:
    """ค้นหาเรื่องร้องเรียนสำหรับการอ้างอิง"""
    try:
        query = db.query(Complaint).filter(
            (Complaint.complaint_number.ilike(f"%{search_term}%")) |
            (Complaint.subject.ilike(f"%{search_term}%"))
        ).limit(10)
        
        complaints = query.all()
        
        result = []
        for complaint in complaints:
            result.append({
                "id": str(complaint.id),
                "complaint_number": complaint.complaint_number,
                "subject": complaint.subject,
                "status": complaint.status,
                "created_at": complaint.created_at.strftime("%Y-%m-%d %H:%M:%S")
            })
        
        return result
        
    except Exception as e:
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
        
        # หาเรื่องอ้างอิงจาก ID หรือ เลขที่
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
        db.refresh(complaint)
        
        return {
            "success": True,
            "message": "เพิ่มเลขอ้างอิงเรียบร้อย",
            "data": {
                "complaint_id": str(complaint_id),
                "reference_complaint_id": str(reference_complaint.id),
                "reference_complaint_number": reference_complaint.complaint_number,
                "reference_field": reference_field,
                "reference_date": current_time.isoformat()
            }
        }
        
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}