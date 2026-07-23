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
    date_fields = [
        "reference_date",
        "reference_date2",
        "reference_date3",
        "reference_date4",
        "document_date",
        "director_submission_date"
    ]
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

def get_thai_status(status: str) -> str:
    """แปลงสถานะเป็นภาษาไทย"""
    status_mapping = {
        "submitted": "รับเรื่อง",
        "sent_to_agency": "มอบหมายเจ้าหน้าที่",
        "sent_to_external": "ส่งหน่วยงานที่เกี่ยวข้อง", 
        "in_process": "กำลังดำเนินการ",
        "in_review": "อยู่ระหว่างพิจารณา",
        "tracking": "ติดตามผล",
        "reviewed": "แจ้งผลการพิจารณา",
        "completed": "เสร็จสิ้น",
        "cancelled": "ยกเลิก"
    }
    return status_mapping.get(status.lower(), status)

def update_complaint_assignment_data(
    db: Session,
    complaint_id: UUID,
    assignment_data: Dict[str, Any],
    updated_by: UUID
) -> Dict:
    """อัพเดทข้อมูลการมอบหมายงาน"""
    try:
        # 🔁 รองรับ alias จาก frontend: reference_number -> reference_number1, reference_date -> reference_date1
        if assignment_data is None:
            assignment_data = {}
        else:
            # ทำสำเนาแบบตื้นป้องกัน side effects
            assignment_data = dict(assignment_data)
        if "reference_number" in assignment_data and "reference_number1" not in assignment_data:
            assignment_data["reference_number1"] = assignment_data["reference_number"]
        if "reference_date" in assignment_data and "reference_date1" not in assignment_data:
            assignment_data["reference_date1"] = assignment_data["reference_date"]
        # รองรับ alias: agency_sender -> assigned_agency (frontend อาจส่งมาเป็น agency_sender)
        if "agency_sender" in assignment_data and "assigned_agency" not in assignment_data:
            assignment_data["assigned_agency"] = assignment_data["agency_sender"]

        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}

        changes = []
        assigned_officer = None
        status_change_notes = []
        new_status = None
        old_status = complaint.status

        # ✅ ตรวจสอบประเภทการ assignment และกำหนดสถานะใหม่
        if "assigned_officer_id" in assignment_data and assignment_data["assigned_officer_id"]:
            # มีการมอบหมายเจ้าหน้าที่
            if complaint.status == ComplaintStatus.SUBMITTED:
                new_status = ComplaintStatus.SENT_TO_AGENCY
                status_change_notes.append("มอบหมายเรื่องให้เจ้าหน้าที่รับผิดชอบ")
        
        # ✅ ตรวจสอบการลงทะเบียน (มีเลขอ้างอิง/เอกสาร)
        if any(key in assignment_data for key in ["reference_number", "reference_number1", "reference_number2", "document_number", "registration_date"]):
            if complaint.status == ComplaintStatus.SUBMITTED and not new_status:
                new_status = ComplaintStatus.IN_PROCESS
                status_change_notes.append("ลงทะเบียนและเริ่มดำเนินการ")
        
        # ✅ ตรวจสอบการกำหนดระดับความลับ/เร่งด่วน
        if any(key in assignment_data for key in ["confidentiality_level", "urgency_level"]):
            if complaint.status in [ComplaintStatus.SUBMITTED, ComplaintStatus.IN_PROCESS] and not new_status:
                new_status = ComplaintStatus.IN_REVIEW
                status_change_notes.append("อยู่ระหว่างการพิจารณาและจัดลำดับความสำคัญ")

        # ✅ ตรวจสอบ 3 ประเภทการร้องเรียนและเงื่อนไขที่จำเป็น
        complaint_type_flags = {
            "new_complaint": assignment_data.get("new_complaint", False),
            "add_more_complaint_to_ref": assignment_data.get("add_more_complaint_to_ref", False),
            "group_work": assignment_data.get("group_work", False)
        }
        
        # นับจำนวนประเภทที่เลือก
        selected_types = sum(1 for v in complaint_type_flags.values() if v)
        
        if selected_types > 1:
            return {
                "success": False, 
                "message": "กรุณาเลือกประเภทการร้องเรียนเพียงอย่างเดียว (new_complaint, add_more_complaint_to_ref, หรือ group_work)"
            }
        elif selected_types == 0:
            return {
                "success": False, 
                "message": "กรุณาเลือกประเภทการร้องเรียนอย่างน้อย 1 ประเภท"
            }

        # ✅ 1. เรื่องร้องทุกข์ใหม่
        if complaint_type_flags["new_complaint"]:
            complaint.new_complaint = True
            complaint.add_more_complaint_to_ref = False
            complaint.group_work = False
            complaint.complaint_filing_type = ComplaintFilingType.NEW
            complaint.parent_complaint_id = None
            complaint.page_type = "website"  # ✅ คลังเรื่องราวร้องทุกข์

            if not new_status and complaint.status == ComplaintStatus.SUBMITTED:
                new_status = ComplaintStatus.IN_PROCESS
                status_change_notes.append("ลงทะเบียนเรื่องร้องเรียนใหม่")

            changes.append("ประเภท: เรื่องร้องทุกข์ใหม่")

        # ✅ 2. แนบเรื่องหรือเนื้อหาร้องทุกข์เพิ่มเติม - additional_reference_number1 กรอกทีหลังได้
        elif complaint_type_flags["add_more_complaint_to_ref"]:
            complaint.new_complaint = False
            complaint.add_more_complaint_to_ref = True
            complaint.group_work = False
            complaint.complaint_filing_type = ComplaintFilingType.ADDITIONAL
            complaint.additional_reference_number2 = None
            complaint.additional_reference_date2 = None
            complaint.page_type = "website"  # ✅ คลังเรื่องราวร้องทุกข์

            ref1 = assignment_data.get("additional_reference_number1", "")
            if ref1:
                changes.append(f"ประเภท: แนบเรื่องร้องทุกข์เพิ่มเติม (อ้างอิง: {ref1})")
            else:
                changes.append("ประเภท: แนบเรื่องร้องทุกข์เพิ่มเติม")

            if not new_status:
                new_status = ComplaintStatus.TRACKING
                status_change_notes.append("เพิ่มข้อมูลเรื่องร้องเรียนเพิ่มเติม")

        # ✅ 3. แนบเรื่องร้องทุกข์ผ่านบัตรสนเท่ห์ - additional_reference_number2 กรอกทีหลังได้
        elif complaint_type_flags["group_work"]:
            complaint.new_complaint = False
            complaint.add_more_complaint_to_ref = False
            complaint.group_work = True
            complaint.complaint_filing_type = ComplaintFilingType.ANONYMOUS
            complaint.additional_reference_number1 = None
            complaint.additional_reference_date1 = None
            complaint.page_type = "card"  # ✅ คลังบัตรสนเทศ

            ref2 = assignment_data.get("additional_reference_number2", "")
            if ref2:
                changes.append(f"ประเภท: แนบเรื่องร้องทุกข์ผ่านบัตรสนเท่ห์ (อ้างอิง: {ref2})")
            else:
                changes.append("ประเภท: แนบเรื่องร้องทุกข์ผ่านบัตรสนเท่ห์")

            if not new_status:
                new_status = ComplaintStatus.IN_REVIEW
                status_change_notes.append("รับเรื่องจากคณะทำงานบัตรสนเท่ห์")

        # ✅ อัพเดท page_type: เมื่อเลือกบัตรสนเทศให้ย้ายไปคลังบัตรสนเทศ
        if "page_type" in assignment_data and assignment_data["page_type"]:
            complaint.page_type = assignment_data["page_type"]
            changes.append(f"page_type → {assignment_data['page_type']}")

    # ✅ บันทึก assigned_officer_id และ assigned_date
        if "assigned_officer_id" in assignment_data and assignment_data["assigned_officer_id"]:
            try:
                officer_id = UUID(assignment_data["assigned_officer_id"])
                
                # ดึงข้อมูลเจ้าหน้าที่
                officer = db.query(User).filter(User.id == officer_id).first()
                if officer:
                    old_officer_id = complaint.assigned_officer_id
                    old_assigned_to = complaint.assigned_to
                    
                    complaint.assigned_officer_id = officer_id
                    complaint.assigned_to = f"{officer.first_name} {officer.last_name}"
                    assigned_officer = officer

                    # กำหนด assigned_date อัตโนมัติหากไม่ได้ระบุ
                    if "assigned_date" in assignment_data and assignment_data["assigned_date"]:
                        try:
                            complaint.assigned_date = datetime.fromisoformat(assignment_data["assigned_date"].replace('Z', '+00:00'))
                        except ValueError:
                            complaint.assigned_date = datetime.now()
                    else:
                        complaint.assigned_date = datetime.now()
                    
                    if str(old_officer_id) != str(officer_id):
                        changes.append(f"มอบหมายให้: {old_assigned_to or 'ไม่ระบุ'} → {complaint.assigned_to}")
                    
                    # เพิ่มบันทึกเหตุผลการมอบหมาย
                    if "assignment_reason" in assignment_data and assignment_data["assignment_reason"]:
                        assignment_reason = assignment_data["assignment_reason"]
                        changes.append(f"เหตุผลการมอบหมาย: {assignment_reason}")
                        
                        # บันทึกในฟิลด์ processing_notes
                        if complaint.processing_notes:
                            complaint.processing_notes += f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M')}] เหตุผลการมอบหมาย: {assignment_reason}"
                        else:
                            complaint.processing_notes = f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] เหตุผลการมอบหมาย: {assignment_reason}"
                    
                else:
                    return {"success": False, "message": "ไม่พบเจ้าหน้าที่ที่ระบุ"}
                    
            except ValueError:
                return {"success": False, "message": "รูปแบบ assigned_officer_id ไม่ถูกต้อง"}

        # ✅ บันทึก assigned_date แยกต่างหาก (ถ้าไม่ได้มอบหมายเจ้าหน้าที่ใหม่)
        elif "assigned_date" in assignment_data and assignment_data["assigned_date"]:
            try:
                old_date = complaint.assigned_date
                complaint.assigned_date = datetime.fromisoformat(assignment_data["assigned_date"].replace('Z', '+00:00'))
                if old_date != complaint.assigned_date:
                    changes.append(f"วันที่มอบหมาย: {old_date.strftime('%Y-%m-%d') if old_date else 'ไม่ระบุ'} → {complaint.assigned_date.strftime('%Y-%m-%d')}")
            except ValueError:
                return {"success": False, "message": "รูปแบบวันที่มอบหมายไม่ถูกต้อง"}

        # ✅ กรณีส่งมาเป็น officer_received_date หรือ confirm_assigned_date ให้ใช้เป็น confirm_assigned_date (ทำงานแยก ไม่ผูกกับ elif เพื่อไม่ให้ถูกข้าม)
        if (
            ("officer_received_date" in assignment_data and assignment_data["officer_received_date"]) or
            ("confirm_assigned_date" in assignment_data and assignment_data["confirm_assigned_date"])
        ):
            try:
                # เลือกค่าที่ส่งมา (ให้ priority กับ confirm_assigned_date ถ้าส่งมาทั้งคู่)
                source_field = "confirm_assigned_date" if assignment_data.get("confirm_assigned_date") else "officer_received_date"
                incoming_value = assignment_data.get("confirm_assigned_date") or assignment_data.get("officer_received_date")
                old_date = complaint.confirm_assigned_date
                complaint.confirm_assigned_date = datetime.fromisoformat(str(incoming_value).replace('Z', '+00:00'))
                if old_date != complaint.confirm_assigned_date:
                    changes.append(
                        f"วันที่รับโดยเจ้าหน้าที่ ({source_field}): {old_date.strftime('%Y-%m-%d') if old_date else 'ไม่ระบุ'} → {complaint.confirm_assigned_date.strftime('%Y-%m-%d')}"
                    )
            except ValueError:
                return {"success": False, "message": "รูปแบบวันที่รับโดยเจ้าหน้าที่ไม่ถูกต้อง"}

        # ✅ กรณีส่งมาเป็น director_submitted_date ให้ใช้เป็น director_submission_date (ทำงานแยก ไม่ผูกกับ elif เพื่อไม่ให้ถูกข้าม)
        if "director_submitted_date" in assignment_data and assignment_data["director_submitted_date"]:
            try:
                old_date = complaint.director_submission_date
                complaint.director_submission_date = datetime.fromisoformat(str(assignment_data["director_submitted_date"]).replace('Z', '+00:00'))
                if old_date != complaint.director_submission_date:
                    changes.append(f"วันที่เสนอผู้อำนวยการ (director_submitted_date): {old_date.strftime('%Y-%m-%d') if old_date else 'ไม่ระบุ'} → {complaint.director_submission_date.strftime('%Y-%m-%d')}")
            except ValueError:
                return {"success": False, "message": "รูปแบบวันที่ส่งโดยผู้อำนวยการไม่ถูกต้อง"}

        # ✅ อัปเดตหัวข้อเรื่อง หากส่งมา
        if "subject" in assignment_data and assignment_data["subject"] is not None:
            old_subject = complaint.subject
            complaint.subject = assignment_data["subject"].strip()
            if complaint.subject != old_subject:
                changes.append(f"เรื่อง: {old_subject or 'ไม่ระบุ'} → {complaint.subject}")

        if "assigned_remark" in assignment_data:
            old_remark = complaint.assigned_remark
            complaint.assigned_remark = assignment_data["assigned_remark"]
            if assignment_data["assigned_remark"] != old_remark:
                changes.append(f"หมายเหตุการมอบหมาย: {old_remark or 'ไม่มี'} → {assignment_data['assigned_remark'] or 'ไม่มี'}")

        # ✅ บันทึก complaint_type_id, complaint_subtype_id, complaint_channel_id
        if "complaint_type_id" in assignment_data and assignment_data["complaint_type_id"]:
            try:
                type_id = UUID(assignment_data["complaint_type_id"])
                complaint_type = db.query(ComplaintType).filter(ComplaintType.id == type_id).first()
                if complaint_type:
                    old_type_id = complaint.complaint_type_id
                    complaint.complaint_type_id = type_id
                    
                    if str(old_type_id) != str(type_id):
                        changes.append(f"ประเภทเรื่องร้องเรียน: {old_type_id or 'ไม่ระบุ'} → {complaint_type.name}")
                else:
                    return {"success": False, "message": "ไม่พบประเภทเรื่องร้องเรียนที่ระบุ"}
            except ValueError:
                return {"success": False, "message": "รูปแบบ complaint_type_id ไม่ถูกต้อง"}

        if "complaint_subtype_id" in assignment_data and assignment_data["complaint_subtype_id"]:
            try:
                subtype_id = UUID(assignment_data["complaint_subtype_id"])
                complaint_subtype = db.query(ComplaintSubType).filter(ComplaintSubType.id == subtype_id).first()
                if complaint_subtype:
                    old_subtype_id = complaint.complaint_subtype_id
                    complaint.complaint_subtype_id = subtype_id
                    
                    if str(old_subtype_id) != str(subtype_id):
                        changes.append(f"ประเภทเรื่องร้องเรียนย่อย: {old_subtype_id or 'ไม่ระบุ'} → {complaint_subtype.name}")
                else:
                    return {"success": False, "message": "ไม่พบประเภทเรื่องร้องเรียนย่อยที่ระบุ"}
            except ValueError:
                return {"success": False, "message": "รูปแบบ complaint_subtype_id ไม่ถูกต้อง"}

        if "complaint_channel_id" in assignment_data and assignment_data["complaint_channel_id"]:
            try:
                channel_id = UUID(assignment_data["complaint_channel_id"])
                complaint_channel = db.query(ComplaintChannel).filter(ComplaintChannel.id == channel_id).first()
                if complaint_channel:
                    old_channel_id = complaint.complaint_channel_id
                    complaint.complaint_channel_id = channel_id
                    
                    if str(old_channel_id) != str(channel_id):
                        changes.append(f"ช่องทางการร้องเรียน: {old_channel_id or 'ไม่ระบุ'} → {complaint_channel.name}")
                else:
                    return {"success": False, "message": "ไม่พบช่องทางการร้องเรียนที่ระบุ"}
            except ValueError:
                return {"success": False, "message": "รูปแบบ complaint_channel_id ไม่ถูกต้อง"}

        # ✅ บันทึก registration_date (วันที่ลงทะเบียน)
        if "registration_date" in assignment_data and assignment_data["registration_date"]:
            try:
                old_date = complaint.registration_date
                complaint.registration_date = datetime.fromisoformat(assignment_data["registration_date"].replace('Z', '+00:00'))
                if old_date != complaint.registration_date:
                    changes.append(f"วันที่ลงทะเบียน: {old_date.strftime('%Y-%m-%d') if old_date else 'ไม่ระบุ'} → {complaint.registration_date.strftime('%Y-%m-%d')}")
            except ValueError:
                return {"success": False, "message": "รูปแบบวันที่ลงทะเบียนไม่ถูกต้อง"}

        # ✅ บันทึก reference_number1-4 (existing code)
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

        # ✅ บันทึก document_number และ document_date
        if "document_number" in assignment_data:
            old_value = complaint.document_number
            complaint.document_number = assignment_data["document_number"]
            if assignment_data["document_number"] != old_value:
                changes.append(f"เลขที่หนังสือ: {old_value} → {assignment_data['document_number']}")

        if "document_date" in assignment_data and assignment_data["document_date"]:
            complaint.document_date = datetime.fromisoformat(assignment_data["document_date"].replace('Z', '+00:00'))

        # ✅ บันทึก director_submission_date (วันที่เสนอผู้อำนวยการ)
        if "director_submission_date" in assignment_data:
            old_value = complaint.director_submission_date
            new_value = assignment_data["director_submission_date"]
            if new_value:
                try:
                    parsed = datetime.fromisoformat(str(new_value).replace('Z', '+00:00'))
                except ValueError:
                    return {"success": False, "message": "รูปแบบวันที่เสนอผู้อำนวยการไม่ถูกต้อง"}
                complaint.director_submission_date = parsed
            else:
                complaint.director_submission_date = None
            if old_value != complaint.director_submission_date:
                old_txt = old_value.isoformat() if old_value else 'ไม่ระบุ'
                new_txt = complaint.director_submission_date.isoformat() if complaint.director_submission_date else 'ไม่ระบุ'
                changes.append(f"วันที่เสนอผอ.: {old_txt} → {new_txt}")

        # ✅ บันทึก assigned_agency
        if "assigned_agency" in assignment_data:
            old_value = complaint.agency_sender
            complaint.agency_sender = assignment_data["assigned_agency"]
            if assignment_data["assigned_agency"] != old_value:
                changes.append(f"หน่วยงานที่ส่ง: {old_value} → {assignment_data['assigned_agency']}")

        # ✅ บันทึก complaint_filing_type (ข้ามถ้า boolean flags จัดการแล้ว)
        if "complaint_filing_type" in assignment_data and not (assignment_data.get("new_complaint") or assignment_data.get("add_more_complaint_to_ref") or assignment_data.get("group_work")):
            old_value = complaint.complaint_filing_type
            new_value = assignment_data["complaint_filing_type"]
            try:
                if isinstance(new_value, ComplaintFilingType):
                    complaint.complaint_filing_type = new_value
                elif isinstance(new_value, str) and new_value:
                    complaint.complaint_filing_type = ComplaintFilingType(new_value)
            except Exception:
                return {"success": False, "message": "ประเภทการยื่นไม่ถูกต้อง"}
            if complaint.complaint_filing_type != old_value:
                changes.append(f"ประเภทการยื่น: {old_value} → {complaint.complaint_filing_type}")

        # ✅ บันทึก regulation_reference
        if "regulation_reference" in assignment_data:
            old_value = complaint.regulation_reference
            new_value = assignment_data["regulation_reference"]
            
            if new_value:
                try:
                    cleaned_value = new_value.replace('?', '').strip()
                    if cleaned_value:
                        complaint.regulation_reference = cleaned_value
                    else:
                        complaint.regulation_reference = None
                except:
                    complaint.regulation_reference = None
            else:
                complaint.regulation_reference = new_value
            
            if assignment_data["regulation_reference"] != old_value:
                changes.append(f"อ้างอิงกฎหมาย: {old_value} → {complaint.regulation_reference}")

        # ✅ बันทึกข้อมูลอื่นๆ
        if "confidentiality_level" in assignment_data:
            old_value = complaint.confidentiality_level
            new_value = assignment_data["confidentiality_level"]
            try:
                if isinstance(new_value, ConfidentialityLevel):
                    complaint.confidentiality_level = new_value
                elif isinstance(new_value, str) and new_value:
                    complaint.confidentiality_level = ConfidentialityLevel(new_value)
                else:
                    complaint.confidentiality_level = None
            except Exception:
                return {"success": False, "message": "ระดับความลับไม่ถูกต้อง"}
            if complaint.confidentiality_level != old_value:
                changes.append(f"ระดับความลับ: {old_value} → {complaint.confidentiality_level}")

        if "urgency_level" in assignment_data:
            old_value = complaint.urgency_level
            new_value = assignment_data["urgency_level"]
            try:
                if isinstance(new_value, UrgencyLevel):
                    complaint.urgency_level = new_value
                elif isinstance(new_value, str) and new_value:
                    complaint.urgency_level = UrgencyLevel(new_value)
                else:
                    complaint.urgency_level = None
            except Exception:
                return {"success": False, "message": "ระดับความเร่งด่วนไม่ถูกต้อง"}
            if complaint.urgency_level != old_value:
                changes.append(f"ระดับความเร่งด่วน: {old_value} → {complaint.urgency_level}")

        # ✅ บันทึก additional_reference_number1-2 และ additional_reference_date1-2 (ตามเงื่อนไข)
        # ข้าม additional_reference_number1 เมื่อเป็นบัตรสนเทศ (group_work) เพราะบัตรใช้ ref2 เท่านั้น
        if "additional_reference_number1" in assignment_data and not complaint_type_flags.get("group_work"):
            old_value = complaint.additional_reference_number1
            new_reference_number = assignment_data["additional_reference_number1"]
            
            # ✅ ตรวจสอบการอ้างอิงตัวเอง - เพิ่มการตรวจสอบที่เข้มงวดขึ้น
            if new_reference_number and new_reference_number == complaint.complaint_number:
                return {"success": False, "message": f"ไม่สามารถอ้างอิงตัวเองได้ ({complaint.complaint_number})"}
            
            # ✅ ตรวจสอบว่าเลขอ้างอิงซ้ำในฟิลด์อื่นหรือไม่
            if new_reference_number and new_reference_number == complaint.additional_reference_number2:
                return {"success": False, "message": f"เลขอ้างอิง {new_reference_number} ถูกใช้ใน additional_reference_number2 แล้ว"}
            
            complaint.additional_reference_number1 = new_reference_number
            
            # ✅ เพิ่มการหา parent complaint และบันทึก parent_complaint_id
            if new_reference_number != old_value and new_reference_number:
                # หา complaint ที่ถูกอ้างอิง
                reference_complaint = db.query(Complaint).filter(
                    Complaint.complaint_number == new_reference_number
                ).first()
                
                if reference_complaint:
                    # ✅ ตรวจสอบการอ้างอิงตัวเองอีกครั้ง (double check)
                    if reference_complaint.id == complaint.id:
                        return {"success": False, "message": f"ไม่สามารถอ้างอิงตัวเองได้ - {new_reference_number} คือเรื่องเดียวกัน"}
                    
                    complaint.parent_complaint_id = reference_complaint.id
                    changes.append(f"เลขอ้างอิงเพิ่มเติม 1: {old_value or 'ไม่มี'} → {new_reference_number} (ผูกกับ {reference_complaint.complaint_number})")
                    logger.info(f"Set parent_complaint_id: {complaint.parent_complaint_id} for complaint: {complaint.complaint_number}")
                else:
                    # ถ้าไม่พบเรื่องอ้างอิง ให้คืนค่า parent_complaint_id เป็น None
                    complaint.parent_complaint_id = None
                    changes.append(f"เลขอ้างอิงเพิ่มเติม 1: {old_value or 'ไม่มี'} → {new_reference_number} (ไม่พบเรื่องอ้างอิง)")
                    logger.warning(f"Reference complaint not found: {new_reference_number}")
            elif not new_reference_number and old_value:
                # ถ้าลบเลขอ้างอิง ให้คืนค่า parent_complaint_id เป็น None (ถ้าไม่มี reference อื่น)
                if not complaint.additional_reference_number2:
                    complaint.parent_complaint_id = None
                    logger.info(f"Cleared parent_complaint_id for complaint: {complaint.complaint_number}")
                changes.append(f"เลขอ้างอิงเพิ่มเติม 1: {old_value} → ไม่มี")
            elif new_reference_number != old_value:
                changes.append(f"เลขอ้างอิงเพิ่มเติม 1: {old_value or 'ไม่มี'} → {new_reference_number or 'ไม่มี'}")

        # ข้าม additional_reference_date1 เมื่อเป็นบัตรสนเทศ (group_work)
        if "additional_reference_date1" in assignment_data and assignment_data["additional_reference_date1"] and not complaint_type_flags.get("group_work"):
            try:
                old_date = complaint.additional_reference_date1
                complaint.additional_reference_date1 = datetime.fromisoformat(assignment_data["additional_reference_date1"].replace('Z', '+00:00'))
                if old_date != complaint.additional_reference_date1:
                    changes.append(f"วันที่อ้างอิงเพิ่มเติม 1: {old_date} → {complaint.additional_reference_date1}")
            except ValueError:
                return {"success": False, "message": "รูปแบบวันที่อ้างอิงเพิ่มเติม 1 ไม่ถูกต้อง"}

        if "additional_reference_number2" in assignment_data:
            old_value = complaint.additional_reference_number2
            new_reference_number = assignment_data["additional_reference_number2"]
            
            # ✅ ตรวจสอบการอ้างอิงตัวเอง
            if new_reference_number and new_reference_number == complaint.complaint_number:
                return {"success": False, "message": f"ไม่สามารถอ้างอิงตัวเองได้ ({complaint.complaint_number})"}
            
            # ✅ ตรวจสอบว่าเลขอ้างอิงซ้ำในฟิลด์อื่นหรือไม่
            if new_reference_number and new_reference_number == complaint.additional_reference_number1:
                return {"success": False, "message": f"เลขอ้างอิง {new_reference_number} ถูกใช้ใน additional_reference_number1 แล้ว"}
            
            complaint.additional_reference_number2 = new_reference_number
            
            # ✅ เพิ่มการหา parent complaint และบันทึก parent_complaint_id (สำหรับ reference 2)
            if new_reference_number != old_value and new_reference_number:
                # หา complaint ที่ถูกอ้างอิง
                reference_complaint = db.query(Complaint).filter(
                    Complaint.complaint_number == new_reference_number
                ).first()
                
                if reference_complaint:
                    # ✅ ตรวจสอบการอ้างอิงตัวเองอีกครั้ง (double check)
                    if reference_complaint.id == complaint.id:
                        return {"success": False, "message": f"ไม่สามารถอ้างอิงตัวเองได้ - {new_reference_number} คือเรื่องเดียวกัน"}
                    
                    # ถ้ายังไม่มี parent ให้เซ็ต (อันดับแรกคือ reference_number1)
                    if not complaint.parent_complaint_id:
                        complaint.parent_complaint_id = reference_complaint.id
                        logger.info(f"Set parent_complaint_id from reference2: {complaint.parent_complaint_id} for complaint: {complaint.complaint_number}")
                    changes.append(f"เลขอ้างอิงเพิ่มเติม 2: {old_value or 'ไม่มี'} → {new_reference_number} (ผูกกับ {reference_complaint.complaint_number})")
                else:
                    changes.append(f"เลขอ้างอิงเพิ่มเติม 2: {old_value or 'ไม่มี'} → {new_reference_number} (ไม่พบเรื่องอ้างอิง)")
                    logger.warning(f"Reference complaint not found: {new_reference_number}")
            elif not new_reference_number and old_value:
                # ถ้าลบเลขอ้างอิง 2 และไม่มี reference 1 ให้คืนค่า parent_complaint_id เป็น None
                if not complaint.additional_reference_number1:
                    complaint.parent_complaint_id = None
                    logger.info(f"Cleared parent_complaint_id for complaint: {complaint.complaint_number}")
                changes.append(f"เลขอ้างอิงเพิ่มเติม 2: {old_value} → ไม่มี")
            elif new_reference_number != old_value:
                changes.append(f"เลขอ้างอิงเพิ่มเติม 2: {old_value or 'ไม่มี'} → {new_reference_number or 'ไม่มี'}")

        if "additional_reference_date2" in assignment_data and assignment_data["additional_reference_date2"]:
            try:
                old_date = complaint.additional_reference_date2
                complaint.additional_reference_date2 = datetime.fromisoformat(assignment_data["additional_reference_date2"].replace('Z', '+00:00'))
                if old_date != complaint.additional_reference_date2:
                    changes.append(f"วันที่อ้างอิงเพิ่มเติม 2: {old_date} → {complaint.additional_reference_date2}")
            except ValueError:
                return {"success": False, "message": "รูปแบบวันที่อ้างอิงเพิ่มเติม 2 ไม่ถูกต้อง"}

        # ✅ บันทึก assignment_reason (ถ้ามี)
        if "assignment_reason" in assignment_data:
            # สามารถเก็บใน processing_notes หรือสร้างฟิลด์ใหม่
            old_notes = complaint.processing_notes
            if assignment_data["assignment_reason"]:
                if old_notes:
                    complaint.processing_notes = f"{old_notes}\n\nเหตุผลการมอบหมาย: {assignment_data['assignment_reason']}"
                else:
                    complaint.processing_notes = f"เหตุผลการมอบหมาย: {assignment_data['assignment_reason']}"
                changes.append(f"เหตุผลการมอบหมาย: {assignment_data['assignment_reason']}")

        # ✅ อัปเดตสถานะใหม่พร้อมสร้าง status history
        if new_status and new_status != complaint.status:
            complaint.status = new_status
            
            # สร้าง status history
            status_notes = " | ".join(status_change_notes) if status_change_notes else "อัพเดทข้อมูลการมอบหมาย"
            
            status_history = ComplaintStatusHistory(
                complaint_id=complaint_id,
                status=new_status,
                notes=status_notes,
                changed_by=updated_by,
                changed_at=datetime.now()
            )
            db.add(status_history)
            
            changes.append(f"เปลี่ยนสถานะ: {get_thai_status(old_status.value)} → {get_thai_status(new_status.value)}")

        # บันทึกการเปลี่ยนแปลง
        complaint.updated_at = datetime.now()
        
        db.commit()
        db.refresh(complaint)

        # ส่ง notification
        if assigned_officer:
            try:
                from app.api.v1.controllers.notification_controller import create_notification
                from app.api.v1.schemas.notification import NotificationCreate
                
                # ดึงชื่อผู้ร้องเรียนสำหรับ notification
                complainant_data = {}
                try:
                    import json
                    complainant_data = json.loads(complaint.complainant_data) if complaint.complainant_data else {}
                except:
                    complainant_data = {}
                
                complainant_name = complainant_data.get("name", "ผู้ร้องเรียน")
                if not complainant_name:
                    first_name = complainant_data.get("firstName", "") or complainant_data.get("first_name", "")
                    last_name = complainant_data.get("lastName", "") or complainant_data.get("last_name", "")
                    if first_name and last_name:
                        complainant_name = f"{first_name} {last_name}"
                    elif first_name:
                        complainant_name = first_name
                    else:
                        complainant_name = "ผู้ร้องเรียน"
                
                # สร้างข้อความ notification สำหรับเจ้าหน้าที่ที่ได้รับมอบหมาย
                message = f"คุณได้รับมอบหมายเรื่องร้องเรียน {complaint.complaint_number} จาก {complainant_name}"
                
                if complaint.subject:
                    message += f" เรื่อง: {complaint.subject[:50]}{'...' if len(complaint.subject) > 50 else ''}"
                
                if assignment_data.get("assignment_reason"):
                    message += f" เหตุผล: {assignment_data['assignment_reason'][:50]}{'...' if len(assignment_data['assignment_reason']) > 50 else ''}"
                
                # สร้าง notification เฉพาะสำหรับเจ้าหน้าที่คนนั้น
                notification_data = NotificationCreate(
                    title="คุณได้รับมอบหมายเรื่องร้องเรียนใหม่",
                    message=message,
                    role_seeking_group=f"user_{assigned_officer.id}",
                    redirect_url=f"/complaints/{complaint.id}"
                )
                
                create_notification(db, notification_data)
                logger.info(f"Assignment notification sent to officer: {assigned_officer.id} for complaint: {complaint.complaint_number}")
                
                # ✅ ส่ง notification ไปยัง admin/supervisor ด้วย (แจ้งว่ามีการมอบหมาย)
                admin_notification_data = NotificationCreate(
                    title="มีการมอบหมายเรื่องร้องเรียน",
                    message=f"เรื่องร้องเรียน {complaint.complaint_number} ได้รับการมอบหมายให้ {assigned_officer.first_name} {assigned_officer.last_name}",
                    role_seeking_group="admin,supervisor",
                    redirect_url=f"/complaints/{complaint.id}"
                )
                
                create_notification(db, admin_notification_data)
                
            except Exception as e:
                logger.error(f"Error sending assignment notification: {str(e)}")

        return {
            "success": True,
            "message": "อัพเดทข้อมูลการมอบหมายเรียบร้อย และได้ส่ง notification ไปยังผู้ที่เกี่ยวข้องแล้ว",
            "complaint_id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "old_status": old_status.value,
            "new_status": new_status.value if new_status else complaint.status.value,
            "status_changed": new_status is not None,
            "complaint_type": {
                "new_complaint": complaint.new_complaint,
                "add_more_complaint_to_ref": complaint.add_more_complaint_to_ref,
                "group_work": complaint.group_work
            },
            "assigned_officer_id": str(complaint.assigned_officer_id) if complaint.assigned_officer_id else None,
            "assigned_to": complaint.assigned_to,
            "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None,
            "assigned_remark": complaint.assigned_remark,
            "confidentiality_level": complaint.confidentiality_level,
            "urgency_level": complaint.urgency_level,
            "complaint_type_id": str(complaint.complaint_type_id) if complaint.complaint_type_id else None,
            "complaint_subtype_id": str(complaint.complaint_subtype_id) if complaint.complaint_subtype_id else None,
            "complaint_channel_id": str(complaint.complaint_channel_id) if complaint.complaint_channel_id else None,
            "registration_date": complaint.registration_date.isoformat() if complaint.registration_date else None,
            "agency_sender": complaint.agency_sender,
            "additional_references": {
                "additional_reference_number1": complaint.additional_reference_number1,
                "additional_reference_date1": complaint.additional_reference_date1.isoformat() if complaint.additional_reference_date1 else None,
                "additional_reference_number2": complaint.additional_reference_number2,
                "additional_reference_date2": complaint.additional_reference_date2.isoformat() if complaint.additional_reference_date2 else None
            },
            "notification_sent": assigned_officer is not None,
            "changes": changes,
            "updated_at": complaint.updated_at.isoformat(),
            "confirm_assigned_date": complaint.confirm_assigned_date.isoformat() if complaint.confirm_assigned_date else None
        }
        
    except Exception as e:
        logger.error(f"Error updating assignment: {str(e)}")
        db.rollback()
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}

def get_assignment_form_data(db: Session, complaint_id: UUID) -> Dict:
    """ดึงข้อมูลสำหรับฟอร์ม Assignment รวมข้อมูลเรื่องร้องเรียนและตัวเลือกต่างๆ"""
    try:
        # ดึงข้อมูลเรื่องร้องเรียน
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            return {
                "error": "ไม่พบเรื่องร้องเรียนที่ระบุ",
                "message": "COMPLAINT_NOT_FOUND"
            }
        
        # ✅ เพิ่มข้อมูลครบถ้วนรวมฟิลด์ที่ขาดหายไป
        complaint_data = {
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
            "director_submission_date": complaint.director_submission_date.isoformat() if complaint.director_submission_date else None,
            
            # Classification Levels
            "confidentiality_level": complaint.confidentiality_level,
            "urgency_level": complaint.urgency_level,
            "complaint_filing_type": complaint.complaint_filing_type,
            
            # Agency Info
            "agency_sender": complaint.agency_sender,
            
            # ✅ Additional Reference Numbers (ฟิลด์ที่ขาดหายไป)
            "additional_reference_number1": complaint.additional_reference_number1,
            "additional_reference_date1": complaint.additional_reference_date1.isoformat() if complaint.additional_reference_date1 else None,
            "additional_reference_number2": complaint.additional_reference_number2,
            "additional_reference_date2": complaint.additional_reference_date2.isoformat() if complaint.additional_reference_date2 else None,
            
            # ✅ Assignment Info (ฟิลด์ที่ขาดหายไป)
            "assigned_officer_id": str(complaint.assigned_officer_id) if complaint.assigned_officer_id else None,
            "assigned_to": complaint.assigned_to,
            "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None,
            "assigned_remark": complaint.assigned_remark,

            # ✅ Complaint Categories (ฟิลด์ที่ขาดหายไป)
            "complaint_type_id": str(complaint.complaint_type_id) if complaint.complaint_type_id else None,
            "complaint_subtype_id": str(complaint.complaint_subtype_id) if complaint.complaint_subtype_id else None,
            "complaint_channel_id": str(complaint.complaint_channel_id) if complaint.complaint_channel_id else None,
            
            # ✅ Registration Date (ฟิลด์ที่ขาดหายไป)
            "registration_date": complaint.registration_date.isoformat() if complaint.registration_date else None,
            
            # Workflow Flags
            "new_complaint": complaint.new_complaint,
            "add_more_complaint_to_ref": complaint.add_more_complaint_to_ref,
            "group_work": complaint.group_work,
            "page_type": complaint.page_type or "website",
            "complaint_filing_type": complaint.complaint_filing_type.value if complaint.complaint_filing_type else "new",
            
            # Legal Reference
            "regulation_reference": complaint.regulation_reference,
            
            # Timestamps
            "created_at": complaint.created_at.isoformat(),
            "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None
        }
        
        # ดึงตัวเลือกต่างๆ สำหรับฟอร์ม
        options = get_assignment_options(db)
        
        return {
            "complaint": complaint_data,
            "options": options
        }
        
    except Exception as e:
        logger.error(f"Error getting assignment form data: {str(e)}")
        return {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        }

def get_assignment_options(db: Session) -> Dict:
    """ดึงตัวเลือกทั้งหมดสำหรับการมอบหมายงาน"""
    try:
        # ดึงประเภทเรื่องร้องเรียน
        complaint_types = db.query(ComplaintType).filter(ComplaintType.is_active == True).order_by(ComplaintType.name).all()
        
        # ดึงช่องทางการร้องเรียน
        complaint_channels = db.query(ComplaintChannel).filter(ComplaintChannel.is_active == True).order_by(ComplaintChannel.name).all()
        
        # ดึงรายการเจ้าหน้าที่
        from models.user import User
        officers = db.query(User).filter(User.is_active == True).all()
        
        return {
            "complaint_types": [
                {
                    "value": str(ct.id),
                    "label": ct.name
                } for ct in complaint_types
            ],
            "complaint_channels": [
                {
                    "value": str(cc.id),
                    "label": cc.name
                } for cc in complaint_channels
            ],
            "officers": [
                {
                    "value": str(officer.id),
                    "label": f"{officer.first_name} {officer.last_name}".strip()
                } for officer in officers if officer.first_name or officer.last_name
            ],
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
        
    except Exception as e:
        logger.error(f"Error getting assignment options: {str(e)}")
        return {
            "complaint_types": [],
            "complaint_channels": [],
            "officers": [],
            "confidentiality_levels": [],
            "urgency_levels": [],
            "filing_types": []
        }

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
        
        # ✅ เพิ่มการตรวจสอบการอ้างอิงตัวเอง
        if reference_complaint.id == complaint.id:
            return {"success": False, "message": "ไม่สามารถอ้างอิงตัวเองได้"}
        
        # ✅ ตรวจสอบว่าอ้างอิงซ้ำหรือไม่
        if (complaint.additional_reference_number1 == reference_complaint.complaint_number or 
            complaint.additional_reference_number2 == reference_complaint.complaint_number):
            return {"success": False, "message": f"เลขอ้างอิง {reference_complaint.complaint_number} ถูกใช้แล้ว"}
        
        # บันทึกลง additional_reference_number
        # ✅ บัตรสนเทศใช้ ref2 เท่านั้น — ข้าม ref1
        current_time = datetime.now()

        if complaint.group_work and not complaint.additional_reference_number2:
            # บัตรสนเทศ: ใส่เลขอ้างอิงลง ref2 โดยตรง
            complaint.additional_reference_number2 = reference_complaint.complaint_number
            complaint.additional_reference_date2 = current_time
            reference_field = "additional_reference_number2"
        elif not complaint.additional_reference_number1:
            complaint.additional_reference_number1 = reference_complaint.complaint_number
            complaint.additional_reference_date1 = current_time
            reference_field = "additional_reference_number1"
        elif not complaint.additional_reference_number2:
            complaint.additional_reference_number2 = reference_complaint.complaint_number
            complaint.additional_reference_date2 = current_time
            reference_field = "additional_reference_number2"
        else:
            return {"success": False, "message": "ช่องเลขอ้างอิงเต็มแล้ว"}
        
        # ✅ อัพเดท parent relationship (แก้ไขให้ถูกต้อง)
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
            "reference_date": current_time.isoformat(),
            "parent_complaint_id": str(complaint.parent_complaint_id)  # ✅ เพิ่มข้อมูลนี้
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
    """ดูประวัติการเปลี่ยนแปลงการมอบหมาย - เรียงใหม่ล่าสุดก่อน"""
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
                "status_thai": get_thai_status(record.status),
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

def get_complaints_by_page_type_with_assignment_form(
    db: Session,
    current_user_id: UUID,
    page_type: Optional[str] = None,
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
    my_assignments_only: bool = True
) -> Dict:
    """ดึงข้อมูลเรื่องร้องเรียนแบ่งตาม page_type ในรูปแบบ assignment form - เฉพาะงานที่ได้รับมอบหมาย (admin สามารถดูทั้งหมดได้)"""
    try:
        from models.comp_complaint_types import ComplaintChannel, ComplaintSubType
        from sqlalchemy import and_, or_, func

        normalized_page_type = (page_type or "").lower()
        effective_page_type = normalized_page_type or "all"

        # กำหนด channel ตาม page_type
        if normalized_page_type == "website":
            target_channels = db.query(ComplaintChannel).filter(
                ComplaintChannel.is_active == True,
                or_(
                    ComplaintChannel.name.contains("เว็บไซต์"),
                    ComplaintChannel.description.contains("ร้องเรียนผ่านเว็บไซต์"),
                    ComplaintChannel.name.contains("ออนไลน์")
                )
            ).all()
        elif normalized_page_type == "card":
            target_channels = db.query(ComplaintChannel).filter(
                ComplaintChannel.is_active == True,
                or_(
                    ComplaintChannel.name.contains("บัตรสนเท่ห์"),
                    ComplaintChannel.description.contains("บัตรสนเท่ห์"),
                    ComplaintChannel.name.contains("การ์ด")
                )
            ).all()
        else:
            target_channels = db.query(ComplaintChannel).filter(
                ComplaintChannel.is_active == True
            ).all()
        
        # ดึง channel IDs
        channel_ids = [channel.id for channel in target_channels]
        
        if not channel_ids:
            return {
                "items": [],
                "total": 0,
                "page_info": {
                    "current_page": 1,
                    "page_size": limit,
                    "total_pages": 0,
                    "has_next": False,
                    "has_prev": False
                },
                "channels": [],
                "page_type": effective_page_type,
                "my_assignments": my_assignments_only
            }

        # ✅ กรองรวมทั้ง page_type column (จากคัดกรอง) และ channel (จากช่องทางเดิม)
        if normalized_page_type == "card":
            card_filter = and_(
                or_(
                    Complaint.page_type == "card",
                    Complaint.complaint_channel_id.in_(channel_ids)
                ),
            )
            query = db.query(Complaint).filter(
                and_(card_filter, Complaint.assigned_officer_id == current_user_id)
                if my_assignments_only else card_filter
            )
        else:
            website_filter = Complaint.complaint_channel_id.in_(channel_ids)
            query = db.query(Complaint).filter(
                and_(website_filter, Complaint.assigned_officer_id == current_user_id)
                if my_assignments_only else website_filter
            )
        
        # Apply filters (เหมือนเดิม)
        if status:
            query = query.filter(Complaint.status == status)
        
        if complaint_type:
            query = query.filter(Complaint.complaint_type.ilike(f"%{complaint_type}%"))
        
        if complaint_subtype:
            query = query.join(ComplaintSubType, Complaint.complaint_subtype_id == ComplaintSubType.id)
            query = query.filter(ComplaintSubType.name.ilike(f"%{complaint_subtype}%"))
        
        if assignee:
            query = query.filter(
                or_(
                    Complaint.assigned_to.ilike(f"%{assignee}%"),
                    Complaint.assigned_officer_id.isnot(None)
                )
            )
        
        if location:
            query = query.filter(
                or_(
                    Complaint.incident_province.ilike(f"%{location}%"),
                    Complaint.incident_district.ilike(f"%{location}%"),
                    Complaint.incident_subdistrict.ilike(f"%{location}%")
                )
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
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
        
        # สร้างข้อมูลในรูปแบบ assignment form
        items = []
        for complaint in complaints:
            received_date_info = _get_received_date_info(complaint)
            
            # ✅ ดึงข้อมูลชื่อผู้ร้องเรียนจาก complainant_data JSON
            complainant_name = ""
            try:
                import json
                if complaint.complainant_data:
                    complainant_json = json.loads(complaint.complainant_data) if isinstance(complaint.complainant_data, str) else complaint.complainant_data
                    # พยายามดึงชื่อจากหลายฟิลด์ที่เป็นไปได้
                    if isinstance(complainant_json, dict):
                        name_parts = []
                        
                        # ลองดึงจากฟิลด์ต่างๆ
                        if complainant_json.get("title"):
                            name_parts.append(complainant_json["title"])
                        if complainant_json.get("first_name"):
                            name_parts.append(complainant_json["first_name"])
                        if complainant_json.get("last_name"):
                            name_parts.append(complainant_json["last_name"])
                        
                        # ถ้าไม่มี ลองดูฟิลด์อื่น
                        if not name_parts:
                            if complainant_json.get("name"):
                                name_parts.append(complainant_json["name"])
                            elif complainant_json.get("full_name"):
                                name_parts.append(complainant_json["full_name"])
                            elif complainant_json.get("complainant_name"):
                                name_parts.append(complainant_json["complainant_name"])
                        
                        complainant_name = " ".join(name_parts).strip()
                        
                        # ถ้ายังไม่ได้ ลองใช้ชื่อบริษัท/องค์กร (สำหรับนิติบุคคล)
                        if not complainant_name:
                            if complainant_json.get("company_name"):
                                complainant_name = complainant_json["company_name"]
                            elif complainant_json.get("organization_name"):
                                complainant_name = complainant_json["organization_name"]
            except:
                complainant_name = ""
            
            assignment_form = {
                "id": str(complaint.id),
                "complaint_number": complaint.complaint_number,
                "subject": complaint.subject,
                "complaint_type": complaint.complaint_type,
                "status": complaint.status,
                
                # ✅ เพิ่มข้อมูลชื่อผู้ร้องเรียน
                "complainant_name": complainant_name,
                "complainant_type": complaint.complainant_type,
                
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
                "director_submission_date": complaint.director_submission_date.isoformat() if complaint.director_submission_date else None,
                
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

                # 🔥 เพิ่มข้อมูลการยืนยันรับงาน (ที่ขาดหายไป)
                "confirm_assigned_status": complaint.confirm_assigned_status,
                "confirm_assigned_date": complaint.confirm_assigned_date.isoformat() if complaint.confirm_assigned_date else None,
                "confirm_assigned_remark": complaint.confirm_assigned_remark,
                "confirm_assigned_by": str(complaint.confirm_assigned_by) if complaint.confirm_assigned_by else None,

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
                
                # 🔥 เพิ่มข้อมูลสำหรับการแสดงผลในหน้าเว็บ
                "received_date_display": received_date_info["display_text"],
                "received_date_raw": received_date_info["raw_date"],
                "confirmation_status": received_date_info["confirmation_status"],
                "confirmation_status_text": received_date_info["confirmation_status_text"],
                
                # Page Type & Assignment Info
                "page_type": complaint.page_type or "website",
                "is_my_assignment": True,
                
                # 🔥 เพิ่ม metadata สำหรับ UI
                "needs_confirmation": complaint.assigned_officer_id is not None and complaint.confirm_assigned_status is None,
                "can_confirm": complaint.assigned_officer_id == current_user_id and complaint.confirm_assigned_status is None,
                "is_confirmed": complaint.confirm_assigned_status == True,
                "is_rejected": complaint.confirm_assigned_status == False
            }
            
            items.append({"complaint": assignment_form})
        
        # Calculate pagination info
        total_pages = (total + limit - 1) // limit
        current_page = (skip // limit) + 1
        
        return {
            "items": items,
            "total": total,
            "page_info": {
                "current_page": current_page,
                "page_size": limit,
                "total_pages": total_pages,
                "has_next": current_page < total_pages,
                "has_prev": current_page > 1
            },
            "channels": [
                {
                    "id": str(channel.id),
                    "name": channel.name,
                    "description": channel.description
                } for channel in target_channels
            ],
        "page_type": effective_page_type,
            "my_assignments": my_assignments_only,
            "assigned_user_id": str(current_user_id),
            
            # 🔥 เพิ่ม legend สำหรับการแสดงผล
            "legend": {
                "received_date_display": "วันที่รับเรื่อง - แสดงวันที่เจ้าหน้าที่ยืนยันรับงาน หรือสถานะการมอบหมาย",
                "confirmation_status": {
                    "confirmed": "ยืนยันรับงานแล้ว",
                    "rejected": "ปฏิเสธรับงาน",
                    "pending": "รอการยืนยัน",
                    "not_assigned": "ยังไม่ได้มอบหมาย"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting my assignments by page type: {str(e)}")
        return {
            "items": [],
            "total": 0,
            "page_info": {
                "current_page": 1,
                "page_size": limit,
                "total_pages": 0,
                "has_next": False,
                "has_prev": False
            },
            "channels": [],
            "page_type": page_type,
            "my_assignments": my_assignments_only,
            "assigned_user_id": str(current_user_id),
            "error": str(e)
        }

def _get_received_date_info(complaint) -> Dict:
    """สร้างข้อมูลวันที่รับเรื่องสำหรับการแสดงผล"""
    
    if complaint.confirm_assigned_date and complaint.confirm_assigned_status == True:
        # ยืนยันรับงานแล้ว
        return {
            "display_text": complaint.confirm_assigned_date.strftime("%d %b %Y"),
            "raw_date": complaint.confirm_assigned_date.isoformat(),
            "confirmation_status": "confirmed",
            "confirmation_status_text": "ยืนยันรับงานแล้ว"
        }
    elif complaint.confirm_assigned_status == False:
        # ปฏิเสธรับงาน
        reject_date = complaint.confirm_assigned_date.strftime("%d %b %Y") if complaint.confirm_assigned_date else "ไม่ทราบ"
        return {
            "display_text": f"ปฏิเสธแล้ว ({reject_date})",
            "raw_date": complaint.confirm_assigned_date.isoformat() if complaint.confirm_assigned_date else None,
            "confirmation_status": "rejected",
            "confirmation_status_text": "ปฏิเสธรับงาน"
        }
    elif complaint.assigned_date:
        # มอบหมายแล้วแต่ยังไม่ได้ยืนยัน
        return {
            "display_text": f"รอการยืนยัน ({complaint.assigned_date.strftime('%d %b %Y')})",
            "raw_date": complaint.assigned_date.isoformat(),
            "confirmation_status": "pending",
            "confirmation_status_text": "รอการยืนยัน"
        }
    else:
        # ยังไม่ได้มอบหมาย
        return {
            "display_text": "ยังไม่ได้รับงาน",
            "raw_date": None,
            "confirmation_status": "not_assigned",
            "confirmation_status_text": "ยังไม่ได้มอบหมาย"
        }

def confirm_assignment(
    db: Session,
    complaint_id: UUID,
    current_user_id: UUID,
    confirm_status: bool,
    remark: Optional[str] = None
) -> Dict:
    """ยืนยันรับงานที่ได้รับมอบหมาย"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            return {"success": False, "message": "ไม่พบเรื่องร้องเรียน"}
        
        # ตรวจสอบว่างานนี้ถูกมอบหมายให้ผู้ใช้นี้หรือไม่
        if complaint.assigned_officer_id != current_user_id:
            return {"success": False, "message": "คุณไม่มีสิทธิ์ยืนยันงานนี้ เนื่องจากงานนี้ไม่ได้มอบหมายให้คุณ"}
        
        # ✅ แก้ไข: ตรวจสอบว่ายืนยันรับงานแล้วหรือไม่ (เฉพาะกรณีที่ confirm_status = True)
        if complaint.confirm_assigned_status == True:
            return {
                "success": False, 
                "message": f"คุณได้ยืนยันรับงานนี้แล้วเมื่อ {complaint.confirm_assigned_date.strftime('%Y-%m-%d %H:%M') if complaint.confirm_assigned_date else 'ไม่ทราบ'}"
            }
        
        # ✅ สร้างข้อความตามสถานะปัจจุบันและการกระทำใหม่
        previous_status = complaint.confirm_assigned_status
        action_text = "ยืนยันรับงาน" if confirm_status else "ปฏิเสธรับงาน"
        
        if previous_status is not None:
            previous_text = "ยืนยันรับงาน" if previous_status else "ปฏิเสธรับงาน"
            if previous_status == confirm_status:
                # ทำซ้ำ
                return {
                    "success": False,
                    "message": f"คุณได้{action_text}นี้แล้วเมื่อ {complaint.confirm_assigned_date.strftime('%Y-%m-%d %H:%M') if complaint.confirm_assigned_date else 'ไม่ทราบ'}"
                }
            else:
                # เปลี่ยนใจ
                status_note = f"เจ้าหน้าที่เปลี่ยนจาก '{previous_text}' เป็น '{action_text}'"
        else:
            # ครั้งแรก
            status_note = f"เจ้าหน้าที่{action_text}"

        # บันทึกการยืนยัน
        complaint.confirm_assigned_status = confirm_status
        complaint.confirm_assigned_by = current_user_id
        complaint.confirm_assigned_remark = remark
        
        # ✅ เก็บ confirm_assigned_date เฉพาะเมื่อ confirm_status = True (ยอมรับงาน)
        if confirm_status:
            complaint.confirm_assigned_date = datetime.now()
        else:
            # ✅ เมื่อปฏิเสธ ไม่เก็บ confirm_assigned_date (หรือล้างค่าเดิม)
            complaint.confirm_assigned_date = None
        
        # เปลี่ยนสถานะตามการยืนยัน
        old_status = complaint.status
        if confirm_status:
            # ยืนยันรับงาน -> เปลี่ยนเป็น in_process
            complaint.status = ComplaintStatus.IN_PROCESS
        else:
            # ปฏิเสธงาน -> เปลี่ยนกลับเป็น submitted เพื่อให้มอบหมายใหม่
            complaint.status = ComplaintStatus.SUBMITTED
            complaint.assigned_officer_id = None
            complaint.assigned_to = None
            complaint.assigned_date = None
            status_note += " - ต้องมอบหมายใหม่"
        
        if remark:
            status_note += f" หมายเหตุ: {remark}"
        
        complaint.updated_at = datetime.now()
        
        # สร้าง status history
        status_history = ComplaintStatusHistory(
            complaint_id=complaint_id,
            status=complaint.status,
            notes=status_note,
            changed_by=current_user_id,
            changed_at=datetime.now()
        )
        db.add(status_history)
        
        db.commit()
        db.refresh(complaint)
        
        # ส่ง notification ไปยัง admin/supervisor
        try:
            from app.api.v1.controllers.notification_controller import create_notification
            from app.api.v1.schemas.notification import NotificationCreate
            
            # ดึงข้อมูลเจ้าหน้าที่
            officer = db.query(User).filter(User.id == current_user_id).first()
            officer_name = f"{officer.first_name} {officer.last_name}" if officer else "เจ้าหน้าที่"
            
            message = f"{officer_name} {action_text} {complaint.complaint_number}"
            if previous_status is not None:
                message += f" (เปลี่ยนจาก '{previous_text}')"
            if remark:
                message += f" หมายเหตุ: {remark}"
            
            notification_data = NotificationCreate(
                title=f"เจ้าหน้าที่{action_text}",
                message=message,
                role_seeking_group="admin,supervisor",
                redirect_url=f"/complaints/{complaint.id}"
            )
            
            create_notification(db, notification_data)
            
        except Exception as e:
            logger.error(f"Error sending confirmation notification: {str(e)}")
        
        return {
            "success": True,
            "message": f"{action_text}เรียบร้อยแล้ว" + (f" (เปลี่ยนจาก '{previous_text}')" if previous_status is not None else ""),
            "complaint_id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "confirmed": confirm_status,
            "confirmed_at": complaint.confirm_assigned_date.isoformat() if complaint.confirm_assigned_date else None,
            "confirmed_by": str(complaint.confirm_assigned_by) if complaint.confirm_assigned_by else None,
            "director_submission_date": complaint.director_submission_date.isoformat() if complaint.director_submission_date else None,
            "old_status": old_status.value,
            "new_status": complaint.status.value,
            "remark": remark,
            "requires_reassignment": not confirm_status,  # ถ้าปฏิเสธ ต้องมอบหมายใหม่
            "changed_mind": previous_status is not None and previous_status != confirm_status
        }
        
    except Exception as e:
        logger.error(f"Error confirming assignment: {str(e)}")
        db.rollback()
        return {"success": False, "message": f"เกิดข้อผิดพลาด: {str(e)}"}