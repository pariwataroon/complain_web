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

def get_thai_status(status: str) -> str:
    """แปลงสถานะเป็นภาษาไทย"""
    status_mapping = {
        "submitted": "รับเรื่อง",
        "sent_to_agency": "ส่งหน่วยงาน", 
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
        if any(key in assignment_data for key in ["reference_number1", "reference_number2", "document_number", "registration_date"]):
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
            
            if not new_status and complaint.status == ComplaintStatus.SUBMITTED:
                new_status = ComplaintStatus.IN_PROCESS
                status_change_notes.append("ลงทะเบียนเรื่องร้องเรียนใหม่")
            
            changes.append("ประเภท: เรื่องร้องทุกข์ใหม่")

        # ✅ 2. แนบเรื่องหรือเนื้อหาร้องทุกข์เพิ่มเติม - ต้องมี additional_reference_number1
        elif complaint_type_flags["add_more_complaint_to_ref"]:
            # ตรวจสอบว่ามี additional_reference_number1 หรือไม่
            if not assignment_data.get("additional_reference_number1"):
                return {
                    "success": False,
                    "message": "สำหรับเรื่องร้องทุกข์เพิ่มเติม จำเป็นต้องระบุ additional_reference_number1 เพื่ออ้างอิงเรื่องก่อนหน้า"
                }
            
            complaint.new_complaint = False
            complaint.add_more_complaint_to_ref = True
            complaint.group_work = False
            
            if not new_status:
                new_status = ComplaintStatus.TRACKING
                status_change_notes.append("เพิ่มข้อมูลเรื่องร้องเรียนเพิ่มเติม")
            
            changes.append(f"ประเภท: แนบเรื่องร้องทุกข์เพิ่มเติม (อ้างอิง: {assignment_data['additional_reference_number1']})")

        # ✅ 3. แนบเรื่องร้องทุกข์ผ่านบัตรสนเท่ห์ - ต้องมี additional_reference_number2
        elif complaint_type_flags["group_work"]:
            # ตรวจสอบว่ามี additional_reference_number2 หรือไม่
            if not assignment_data.get("additional_reference_number2"):
                return {
                    "success": False,
                    "message": "สำหรับเรื่องร้องทุกข์ผ่านบัตรสนเท่ห์ จำเป็นต้องระบุ additional_reference_number2 เพื่ออ้างอิงเรื่องก่อนหน้า"
                }
            
            complaint.new_complaint = False
            complaint.add_more_complaint_to_ref = False
            complaint.group_work = True
            
            if not new_status:
                new_status = ComplaintStatus.IN_REVIEW
                status_change_notes.append("รับเรื่องจากคณะทำงานบัตรสนเท่ห์")
            
            changes.append(f"ประเภท: แนบเรื่องร้องทุกข์ผ่านบัตรสนเท่ห์ (อ้างอิง: {assignment_data['additional_reference_number2']})")

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

        # ✅ บันทึก assigned_agency
        if "assigned_agency" in assignment_data:
            old_value = complaint.agency_sender
            complaint.agency_sender = assignment_data["assigned_agency"]
            if assignment_data["assigned_agency"] != old_value:
                changes.append(f"หน่วยงานที่ส่ง: {old_value} → {assignment_data['assigned_agency']}")

        # ✅ บันทึก complaint_filing_type
        if "complaint_filing_type" in assignment_data:
            old_value = complaint.complaint_filing_type
            complaint.complaint_filing_type = assignment_data["complaint_filing_type"]
            if assignment_data["complaint_filing_type"] != old_value:
                changes.append(f"ประเภทการยื่น: {old_value} → {assignment_data['complaint_filing_type']}")

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
            complaint.confidentiality_level = assignment_data["confidentiality_level"]
            if assignment_data["confidentiality_level"] != old_value:
                changes.append(f"ระดับความลับ: {old_value} → {assignment_data['confidentiality_level']}")

        if "urgency_level" in assignment_data:
            old_value = complaint.urgency_level
            complaint.urgency_level = assignment_data["urgency_level"]
            if assignment_data["urgency_level"] != old_value:
                changes.append(f"ระดับความเร่งด่วน: {old_value} → {assignment_data['urgency_level']}")

        # ✅ บันทึก additional_reference_number1-2 และ additional_reference_date1-2 (ตามเงื่อนไข)
        if "additional_reference_number1" in assignment_data:
            old_value = complaint.additional_reference_number1
            complaint.additional_reference_number1 = assignment_data["additional_reference_number1"]
            if assignment_data["additional_reference_number1"] != old_value:
                changes.append(f"เลขอ้างอิงเพิ่มเติม 1: {old_value} → {assignment_data['additional_reference_number1']}")

        if "additional_reference_date1" in assignment_data and assignment_data["additional_reference_date1"]:
            try:
                old_date = complaint.additional_reference_date1
                complaint.additional_reference_date1 = datetime.fromisoformat(assignment_data["additional_reference_date1"].replace('Z', '+00:00'))
                if old_date != complaint.additional_reference_date1:
                    changes.append(f"วันที่อ้างอิงเพิ่มเติม 1: {old_date} → {complaint.additional_reference_date1}")
            except ValueError:
                return {"success": False, "message": "รูปแบบวันที่อ้างอิงเพิ่มเติม 1 ไม่ถูกต้อง"}

        if "additional_reference_number2" in assignment_data:
            old_value = complaint.additional_reference_number2
            complaint.additional_reference_number2 = assignment_data["additional_reference_number2"]
            if assignment_data["additional_reference_number2"] != old_value:
                changes.append(f"เลขอ้างอิงเพิ่มเติม 2: {old_value} → {assignment_data['additional_reference_number2']}")

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
            "additional_references": {
                "additional_reference_number1": complaint.additional_reference_number1,
                "additional_reference_date1": complaint.additional_reference_date1.isoformat() if complaint.additional_reference_date1 else None,
                "additional_reference_number2": complaint.additional_reference_number2,
                "additional_reference_date2": complaint.additional_reference_date2.isoformat() if complaint.additional_reference_date2 else None
            },
            "notification_sent": assigned_officer is not None,
            "changes": changes,
            "updated_at": complaint.updated_at.isoformat()
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

def get_complaints_by_page_type_with_assignment_form(
    db: Session,
    current_user_id: UUID,
    page_type: str = "website",
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    complaint_type: Optional[str] = None,
    complaint_subtype: Optional[str] = None,
    assignee: Optional[str] = None,
    location: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    complainant_name: Optional[str] = None
) -> Dict:
    """ดึงข้อมูลเรื่องร้องเรียนแบ่งตาม page_type ในรูปแบบ assignment form - เฉพาะงานที่ได้รับมอบหมาย"""
    try:
        from models.comp_complaint_types import ComplaintChannel, ComplaintSubType
        from sqlalchemy import and_, or_, func
        
        # กำหนด channel ตาม page_type
        if page_type == "website":
            target_channels = db.query(ComplaintChannel).filter(
                ComplaintChannel.is_active == True,
                or_(
                    ComplaintChannel.name.contains("เว็บไซต์"),
                    ComplaintChannel.description.contains("ร้องเรียนผ่านเว็บไซต์"),
                    ComplaintChannel.name.contains("ออนไลน์")
                )
            ).all()
        elif page_type == "card":
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
                "page_type": page_type,
                "my_assignments": True
            }
        
        # ✅ สร้าง base query - กรองเฉพาะงานที่ได้รับมอบหมาย
        query = db.query(Complaint).filter(
            and_(
                Complaint.complaint_channel_id.in_(channel_ids),
                Complaint.assigned_officer_id == current_user_id  # ✅ เฉพาะงานที่มอบหมายให้ user นี้
            )
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
                
                # Page Type & Assignment Info
                "page_type": page_type,
                "is_my_assignment": True  # ✅ เพิ่ม flag ว่าเป็นงานของตัวเอง
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
            "page_type": page_type,
            "my_assignments": True,  # ✅ เพิ่ม flag ว่าเป็นงานที่ได้รับมอบหมาย
            "assigned_user_id": str(current_user_id)  # ✅ เพิ่ม user ID ที่ได้รับมอบหมาย
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
            "my_assignments": True,
            "assigned_user_id": str(current_user_id),
            "error": str(e)
        }