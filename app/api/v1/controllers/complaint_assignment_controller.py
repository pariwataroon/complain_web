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

def update_complaint_assignment_data(
    db: Session, 
    complaint_id: UUID, 
    assignment_data: Dict[str, Any], 
    updated_by: UUID
) -> Dict:
    """อัพเดทข้อมูลการมอบหมายตามฟอร์ม UI"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
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
        
        complaint.updated_at = datetime.now()
        
        db.commit()
        db.refresh(complaint)
        
        return {
            "success": True,
            "message": "อัพเดทข้อมูลการมอบหมายเรียบร้อย",
            "complaint": complaint
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
        complaint_types = db.query(ComplaintType).filter(ComplaintType.is_active == True).all()
        complaint_channels = db.query(ComplaintChannel).filter(ComplaintChannel.is_active == True).all()
        available_officers = db.query(User).filter(User.is_active == True).all()
        
        return {
            "complaint": {
                "id": str(complaint.id),
                "complaint_number": complaint.complaint_number,
                "subject": complaint.subject,
                "complaint_type": complaint.complaint_type,
                
                # เลขอ้างอิงต่างๆ
                "reference_number": complaint.reference_number,
                "reference_date": complaint.reference_date,
                "reference_number2": complaint.reference_number2,
                "reference_date2": complaint.reference_date2,
                "reference_number3": complaint.reference_number3,
                "reference_date3": complaint.reference_date3,
                "reference_number4": complaint.reference_number4,
                "reference_date4": complaint.reference_date4,
                
                # เลขที่หนังสือ
                "document_number": complaint.document_number,
                "document_date": complaint.document_date,
                
                # ความลับและความเร่งด่วน
                "confidentiality_level": complaint.confidentiality_level,
                "urgency_level": complaint.urgency_level,
                
                # ประเภทการร้องเรียน
                "complaint_filing_type": complaint.complaint_filing_type,
                
                # หน่วยงานผู้ส่ง
                "agency_sender": complaint.agency_sender,
                
                # เลขอ้างอิงเพิ่มเติม
                "additional_reference_number1": complaint.additional_reference_number1,
                "additional_reference_date1": complaint.additional_reference_date1,
                "additional_reference_number2": complaint.additional_reference_number2,
                "additional_reference_date2": complaint.additional_reference_date2,
                
                # การมอบหมาย
                "assigned_officer_id": complaint.assigned_officer_id,
                "assigned_to": complaint.assigned_to,
                "assigned_date": complaint.assigned_date
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
    """อัพเดทข้อมูลผู้ร้องเรียนและผู้ลงนาม"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
        # ✅ อัพเดทข้อมูลผู้ร้องเรียน
        current_complainant_data = {}
        if complaint.complainant_data:
            try:
                current_complainant_data = json.loads(complaint.complainant_data)
            except:
                current_complainant_data = {}
        
        # Merge ข้อมูลใหม่กับข้อมูลเดิม
        current_complainant_data.update(complainant_data)
        
        complaint.complainant_data = json.dumps(current_complainant_data)
        complaint.updated_at = datetime.now()
        
        db.commit()
        db.refresh(complaint)
        
        return {
            "success": True,
            "message": "อัพเดทข้อมูลผู้ร้องเรียนเรียบร้อย",
            "updated_data": current_complainant_data
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
    """อัพเดทข้อมูลผู้ถูกร้องเรียน"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
        # ✅ อัพเดทข้อมูลผู้ถูกร้องเรียน
        current_respondent_data = {}
        if complaint.respondent_data:
            try:
                current_respondent_data = json.loads(complaint.respondent_data)
            except:
                current_respondent_data = {}
        
        # Merge ข้อมูลใหม่กับข้อมูลเดิม
        current_respondent_data.update(respondent_data)
        
        complaint.respondent_data = json.dumps(current_respondent_data)
        complaint.updated_at = datetime.now()
        
        db.commit()
        db.refresh(complaint)
        
        return {
            "success": True,
            "message": "อัพเดทข้อมูลผู้ถูกร้องเรียนเรียบร้อย",
            "updated_data": current_respondent_data
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