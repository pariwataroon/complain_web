from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from uuid import UUID
from typing import Dict, Any, Optional, List
from fastapi import HTTPException

from models.comp_complaint import Complaint
from models.outgoing_reports import OutgoingReport
from models.outgoing_reports2 import OutgoingReport2
from models.outgoing_reports3 import OutgoingReport3
from models.outgoing_reports4 import OutgoingReport4
from models.user import User
from models.departments import Department
from app.api.v1.schemas.consolidated_report import (
    ConsolidatedComplaintReport, ComplaintSummary, OutgoingReportSummary,
    AdditionalReference, RelatedComplaint
)
from lib.logger import get_logger

logger = get_logger("consolidated_report_controller")

def get_consolidated_reports(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    department_id: Optional[UUID] = None,
    report_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> Dict:
    """ดึงรายการรายงานรวมทั้งหมด"""
    try:
        query = db.query(Complaint).options(
            joinedload(Complaint.outgoing_reports),
            joinedload(Complaint.outgoing_reports2),
            joinedload(Complaint.outgoing_reports3),
            joinedload(Complaint.outgoing_reports4),
            joinedload(Complaint.parent_complaint),
            joinedload(Complaint.creator)
        )
        
        # Filter
        if search:
            query = query.filter(
                or_(
                    Complaint.complaint_number.ilike(f"%{search}%"),
                    Complaint.subject.ilike(f"%{search}%"),
                    Complaint.additional_reference_number1.ilike(f"%{search}%"),
                    Complaint.additional_reference_number2.ilike(f"%{search}%")
                )
            )
        
        if status:
            query = query.filter(Complaint.status == status)
        
        if date_from:
            query = query.filter(Complaint.created_at >= date_from)
        if date_to:
            query = query.filter(Complaint.created_at <= date_to)
        
        # Filter by report type
        if report_type:
            if report_type == "with_reports":
                query = query.filter(
                    or_(
                        Complaint.outgoing_reports.any(),
                        Complaint.outgoing_reports2.any(),
                        Complaint.outgoing_reports3.any(),
                        Complaint.outgoing_reports4.any()
                    )
                )
            elif report_type == "with_additional_refs":
                query = query.filter(
                    or_(
                        Complaint.additional_reference_number1.isnot(None),
                        Complaint.additional_reference_number2.isnot(None)
                    )
                )
        
        total = query.count()
        complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
        
        items = []
        for complaint in complaints:
            consolidated_report = build_consolidated_report(db, complaint)
            items.append(consolidated_report)
        
        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1,
            "size": limit,
            "total_pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Error getting consolidated reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_consolidated_report_by_id(db: Session, complaint_id: UUID) -> Dict:
    """ดึงรายงานรวมตาม ID - เพิ่มการโหลด relationships"""
    try:
        complaint = db.query(Complaint).options(
            joinedload(Complaint.outgoing_reports),
            joinedload(Complaint.outgoing_reports2),
            joinedload(Complaint.outgoing_reports3),
            joinedload(Complaint.outgoing_reports4),
            joinedload(Complaint.parent_complaint),
            joinedload(Complaint.creator),
            # ✅ เพิ่มการโหลด status_history
            joinedload(Complaint.status_history)
        ).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")
        
        return build_consolidated_report(db, complaint)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting consolidated report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def build_consolidated_report(db: Session, complaint: Complaint) -> Dict:
    """สร้างรายงานรวมจากข้อมูล complaint - เพิ่ม status_history"""
    try:
        # สร้างข้อมูลเรื่องร้องเรียนหลัก
        complaint_summary = {
            "id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "subject": complaint.subject,
            "status": complaint.status,
            "complainant_name": get_complainant_name(complaint),
            "respondent_name": get_respondent_name(complaint),
            "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
            "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None,
            # ✅ เพิ่ม status_history
            "status_history": format_status_history_for_consolidated(complaint.status_history),
            # ✅ เพิ่มข้อมูลเพิ่มเติม
            "complaint_type": complaint.complaint_type,
            "incident_date": complaint.incident_date.isoformat() if complaint.incident_date else None,
            "confidentiality_level": complaint.confidentiality_level,
            "urgency_level": complaint.urgency_level,
            "severity_level": complaint.severity_level,
            "assigned_to": complaint.assigned_to,
            "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None,
            "resolution_summary": complaint.resolution_summary,
            "resolved_date": complaint.resolved_date.isoformat() if complaint.resolved_date else None
        }
        
        # รวบรวม outgoing reports (เดิม - ไม่เปลี่ยน)
        outgoing_reports = []
        
        # OutgoingReport (Type 1)
        for report in complaint.outgoing_reports:
            if report.is_active:
                outgoing_reports.append({
                    "id": str(report.id),
                    "type": "report1",
                    "reference_number": report.reference_number,
                    "complaint_number": report.complaint_number,
                    "subject": report.subject,
                    "department_name": report.department.name if report.department else None,
                    "signature_user_name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else None,
                    "created_at": report.created_at.isoformat() if report.created_at else None
                })
        
        # OutgoingReport2, 3, 4 (เดิม - ไม่เปลี่ยน)
        for report in complaint.outgoing_reports2:
            if report.is_active:
                outgoing_reports.append({
                    "id": str(report.id),
                    "type": "report2",
                    "reference_number": None,
                    "complaint_number": report.complaint_number,
                    "subject": report.subject,
                    "department_name": report.department.name if report.department else None,
                    "signature_user_name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else None,
                    "created_at": report.created_at.isoformat() if report.created_at else None
                })
        
        for report in complaint.outgoing_reports3:
            if report.is_active:
                outgoing_reports.append({
                    "id": str(report.id),
                    "type": "report3",
                    "reference_number": None,
                    "complaint_number": report.complaint_number,
                    "subject": report.subject,
                    "department_name": report.department.name if report.department else None,
                    "signature_user_name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else None,
                    "created_at": report.created_at.isoformat() if report.created_at else None
                })
        
        for report in complaint.outgoing_reports4:
            if report.is_active:
                outgoing_reports.append({
                    "id": str(report.id),
                    "type": "report4",
                    "reference_number": report.reference_number,
                    "complaint_number": None,
                    "subject": report.subject,
                    "department_name": report.department.name if report.department else report.other_department,
                    "signature_user_name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else None,
                    "created_at": report.created_at.isoformat() if report.created_at else None
                })
        
        # รวบรวม additional references (เดิม - ไม่เปลี่ยน)
        additional_references = []
        if complaint.additional_reference_number1:
            additional_references.append({
                "type": "additional_reference_1",
                "reference_number": complaint.additional_reference_number1,
                "reference_date": complaint.additional_reference_date1.isoformat() if complaint.additional_reference_date1 else None
            })
        
        if complaint.additional_reference_number2:
            additional_references.append({
                "type": "additional_reference_2",
                "reference_number": complaint.additional_reference_number2,
                "reference_date": complaint.additional_reference_date2.isoformat() if complaint.additional_reference_date2 else None
            })
        
        # ✅ แก้ไข related complaints ให้ทำงานถูกต้อง
        related_complaints = []
        
        # ✅ 1. หา Parent complaint จาก parent_complaint_id (ถ้ามี)
        if complaint.parent_complaint_id:
            parent = db.query(Complaint).filter(Complaint.id == complaint.parent_complaint_id).first()
            if parent:
                related_complaints.append({
                    "id": str(parent.id),
                    "complaint_number": parent.complaint_number,
                    "subject": parent.subject,
                    "relationship_type": "parent",
                    "created_at": parent.created_at.isoformat() if parent.created_at else None
                })
        
        # ✅ 2. หา Child complaints (เรื่องที่อ้างอิงเรื่องนี้)
        child_complaints = db.query(Complaint).filter(Complaint.parent_complaint_id == complaint.id).all()
        for child in child_complaints:
            related_complaints.append({
                "id": str(child.id),
                "complaint_number": child.complaint_number,
                "subject": child.subject,
                "relationship_type": "child",
                "created_at": child.created_at.isoformat() if child.created_at else None
            })
        
        # ✅ 3. หา Sibling complaints (เรื่องที่มี parent เดียวกัน)
        if complaint.parent_complaint_id:
            sibling_complaints = db.query(Complaint).filter(
                and_(
                    Complaint.parent_complaint_id == complaint.parent_complaint_id,
                    Complaint.id != complaint.id  # ไม่เอาตัวเอง
                )
            ).all()
            
            for sibling in sibling_complaints:
                related_complaints.append({
                    "id": str(sibling.id),
                    "complaint_number": sibling.complaint_number,
                    "subject": sibling.subject,
                    "relationship_type": "sibling",
                    "created_at": sibling.created_at.isoformat() if sibling.created_at else None
                })
        
        # ✅ 4. หา Related complaints จาก additional_reference_number (ถ้าไม่มีใน parent/child/sibling แล้ว)
        existing_complaint_ids = {str(r["id"]) for r in related_complaints}
        existing_complaint_ids.add(str(complaint.id))  # เพิ่มตัวเองเพื่อไม่ให้ซ้ำ
        
        # หาจาก additional_reference_number1
        if complaint.additional_reference_number1:
            ref_complaint = db.query(Complaint).filter(
                Complaint.complaint_number == complaint.additional_reference_number1
            ).first()
            
            if ref_complaint and str(ref_complaint.id) not in existing_complaint_ids:
                related_complaints.append({
                    "id": str(ref_complaint.id),
                    "complaint_number": ref_complaint.complaint_number,
                    "subject": ref_complaint.subject,
                    "relationship_type": "referenced",
                    "created_at": ref_complaint.created_at.isoformat() if ref_complaint.created_at else None
                })
                existing_complaint_ids.add(str(ref_complaint.id))
        
        # หาจาก additional_reference_number2
        if complaint.additional_reference_number2:
            ref_complaint = db.query(Complaint).filter(
                Complaint.complaint_number == complaint.additional_reference_number2
            ).first()
            
            if ref_complaint and str(ref_complaint.id) not in existing_complaint_ids:
                related_complaints.append({
                    "id": str(ref_complaint.id),
                    "complaint_number": ref_complaint.complaint_number,
                    "subject": ref_complaint.subject,
                    "relationship_type": "referenced",
                    "created_at": ref_complaint.created_at.isoformat() if ref_complaint.created_at else None
                })
                existing_complaint_ids.add(str(ref_complaint.id))
        
        # ✅ 5. หาเรื่องที่อ้างอิงเรื่องนี้ (reverse reference)
        reverse_refs = db.query(Complaint).filter(
            or_(
                Complaint.additional_reference_number1 == complaint.complaint_number,
                Complaint.additional_reference_number2 == complaint.complaint_number
            ),
            Complaint.id != complaint.id  # ไม่เอาตัวเอง
        ).all()
        
        for ref_complaint in reverse_refs:
            if str(ref_complaint.id) not in existing_complaint_ids:
                related_complaints.append({
                    "id": str(ref_complaint.id),
                    "complaint_number": ref_complaint.complaint_number,
                    "subject": ref_complaint.subject,
                    "relationship_type": "references_this",
                    "created_at": ref_complaint.created_at.isoformat() if ref_complaint.created_at else None
                })
        
        total_documents = len(outgoing_reports) + len(additional_references)
        
        return {
            "complaint": complaint_summary,
            "outgoing_reports": outgoing_reports,
            "additional_references": additional_references,
            "related_complaints": related_complaints,
            "total_documents": total_documents,
            "parent_complaint_id": str(complaint.parent_complaint_id) if complaint.parent_complaint_id else None,
            "has_children": len([r for r in related_complaints if r["relationship_type"] == "child"]) > 0,
            "has_siblings": len([r for r in related_complaints if r["relationship_type"] == "sibling"]) > 0,
            "has_references": len([r for r in related_complaints if r["relationship_type"] in ["referenced", "references_this"]]) > 0,
            # ✅ เพิ่มข้อมูลสถิติ
            "relationship_summary": {
                "total_related": len(related_complaints),
                "parent_count": len([r for r in related_complaints if r["relationship_type"] == "parent"]),
                "child_count": len([r for r in related_complaints if r["relationship_type"] == "child"]),
                "sibling_count": len([r for r in related_complaints if r["relationship_type"] == "sibling"]),
                "referenced_count": len([r for r in related_complaints if r["relationship_type"] == "referenced"]),
                "references_this_count": len([r for r in related_complaints if r["relationship_type"] == "references_this"])
            },
            # ✅ เพิ่มข้อมูลการจัดประเภท
            "workflow_flags": {
                "new_complaint": complaint.new_complaint,
                "add_more_complaint_to_ref": complaint.add_more_complaint_to_ref,
                "group_work": complaint.group_work,
                "complaint_filing_type": complaint.complaint_filing_type
            },
            # ✅ เพิ่มข้อมูลเลขอ้างอิงต่างๆ
            "reference_numbers": {
                "reference_number": complaint.reference_number,
                "reference_date": complaint.reference_date.isoformat() if complaint.reference_date else None,
                "reference_number2": complaint.reference_number2,
                "reference_date2": complaint.reference_date2.isoformat() if complaint.reference_date2 else None,
                "reference_number3": complaint.reference_number3,
                "reference_date3": complaint.reference_date3.isoformat() if complaint.reference_date3 else None,
                "reference_number4": complaint.reference_number4,
                "reference_date4": complaint.reference_date4.isoformat() if complaint.reference_date4 else None,
                "document_number": complaint.document_number,
                "document_date": complaint.document_date.isoformat() if complaint.document_date else None
            }
        }
        
    except Exception as e:
        logger.error(f"Error building consolidated report: {str(e)}")
        raise

# ✅ เพิ่มฟังก์ชันใหม่สำหรับ format status history
def format_status_history_for_consolidated(status_history_list) -> List[Dict]:
    """จัดรูปแบบประวัติสถานะสำหรับ consolidated report"""
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
        logger.error(f"Error formatting status history for consolidated: {str(e)}")
        return []

def get_thai_status(status: str) -> str:
    """แปลงสถานะเป็นภาษาไทย"""
    status_mapping = {
        "SUBMITTED": "รับเรื่อง",
        "submitted": "รับเรื่อง",
        "SENT_TO_AGENCY": "มอบหมายเจ้าหน้าที่", 
        "SENT_TO_EXTERNAL": "ส่งหน่วยงานที่เกี่ยวข้อง",
        "IN_PROCESS": "กำลังดำเนินการ",
        "IN_REVIEW": "อยู่ระหว่างพิจารณา",
        "TRACKING": "ติดตามผล",
        "tracking": "ติดตามผล",
        "REVIEWED": "แจ้งผลการพิจารณา",
        "COMPLETED": "เสร็จสิ้น"
    }
    return status_mapping.get(status.upper() if status else "", status)

def get_complainant_name(complaint: Complaint) -> str:
    """ดึงชื่อผู้ร้องเรียน"""
    try:
        import json
        complainant_data = json.loads(complaint.complainant_data) if isinstance(complaint.complainant_data, str) else complaint.complainant_data
        
        if isinstance(complainant_data, dict):
            return complainant_data.get("name", "ไม่ระบุชื่อ")
        return "ไม่ระบุชื่อ"
    except:
        return "ไม่ระบุชื่อ"

def get_respondent_name(complaint: Complaint) -> str:
    """ดึงชื่อผู้ถูกร้องเรียน"""
    try:
        import json
        respondent_data = json.loads(complaint.respondent_data) if isinstance(complaint.respondent_data, str) else complaint.respondent_data
        
        if isinstance(respondent_data, dict):
            return respondent_data.get("name", "ไม่ระบุชื่อ")
        return "ไม่ระบุชื่อ"
    except:
        return "ไม่ระบุชื่อ"

def get_consolidated_report_options(db: Session) -> Dict:
    """ดึงตัวเลือกสำหรับ dropdown"""
    try:
        departments = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
        users = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()
        
        return {
            "departments": [{"id": str(dept.id), "name": dept.name} for dept in departments],
            "users": [{"id": str(user.id), "name": f"{user.first_name} {user.last_name}"} for user in users],
            "statuses": [
                {"value": "SUBMITTED", "label": "รับเรื่อง"},
                {"value": "SENT_TO_AGENCY", "label": "มอบหมายเจ้าหน้าที่"},
                {"value": "SENT_TO_EXTERNAL", "label": "ส่งหน่วยงานที่เกี่ยวข้อง"},
                {"value": "IN_PROCESS", "label": "กำลังดำเนินการ"},
                {"value": "IN_REVIEW", "label": "อยู่ระหว่างพิจารณา"},
                {"value": "TRACKING", "label": "ติดตามผล"},
                {"value": "REVIEWED", "label": "แจ้งผลการพิจารณา"},
                {"value": "COMPLETED", "label": "เสร็จสิ้น"}
            ],
            "report_types": [
                {"value": "all", "label": "ทั้งหมด"},
                {"value": "with_reports", "label": "มีเอกสารส่งออก"},
                {"value": "with_additional_refs", "label": "มีเลขอ้างอิงเพิ่มเติม"}
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_complaint_document_timeline(db: Session, complaint_id: UUID) -> Dict:
    """ดึง timeline ของเอกสารทั้งหมดที่เกี่ยวข้องกับเรื่องร้องเรียน"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")
        
        timeline = []
        
        # เพิ่มข้อร้องเรียนหลัก
        timeline.append({
            "date": complaint.created_at.isoformat() if complaint.created_at else None,
            "type": "complaint",
            "title": "สร้างเรื่องร้องเรียน",
            "description": complaint.subject,
            "document_number": complaint.complaint_number,
            "id": str(complaint.id)
        })
        
        # เพิ่ม outgoing reports ทั้งหมด
        for report in complaint.outgoing_reports:
            if report.is_active:
                timeline.append({
                    "date": report.created_at.isoformat() if report.created_at else None,
                    "type": "outgoing_report1",
                    "title": "รายงานส่งหน่วยงานที่เกี่ยวข้อง",
                    "description": report.subject,
                    "document_number": report.reference_number,
                    "id": str(report.id)
                })
        
        for report in complaint.outgoing_reports2:
            if report.is_active:
                timeline.append({
                    "date": report.created_at.isoformat() if report.created_at else None,
                    "type": "outgoing_report2",
                    "title": "รายงานแจ้งผู้ร้องเรียน",
                    "description": report.subject,
                    "document_number": report.complaint_number,
                    "id": str(report.id)
                })
        
        for report in complaint.outgoing_reports3:
            if report.is_active:
                timeline.append({
                    "date": report.created_at.isoformat() if report.created_at else None,
                    "type": "outgoing_report3",
                    "title": "รายงานขอทราบผลการพิจารณา",
                    "description": report.subject,
                    "document_number": report.complaint_number,
                    "id": str(report.id)
                })
        
        for report in complaint.outgoing_reports4:
            if report.is_active:
                timeline.append({
                    "date": report.created_at.isoformat() if report.created_at else None,
                    "type": "outgoing_report4",
                    "title": "รายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ",
                    "description": report.subject,
                    "document_number": report.reference_number,
                    "id": str(report.id)
                })
        
        # เรียงตาม date
        timeline.sort(key=lambda x: x["date"] or "", reverse=True)
        
        return {
            "complaint_id": str(complaint_id),
            "complaint_number": complaint.complaint_number,
            "timeline": timeline,
            "total_documents": len(timeline)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document timeline: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")