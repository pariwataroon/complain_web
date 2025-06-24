from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from uuid import UUID
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, UploadFile

from models.outgoing_reports4 import OutgoingReport4, OutgoingReportAttachment4
from models.comp_complaint import Complaint
from models.user import User
from models.departments import Department
from app.api.v1.schemas.outgoing_report4 import OutgoingReport4Create, OutgoingReport4Update
from lib.logger import get_logger

logger = get_logger("outgoing_report4_controller")

class DuplicateKeyError(Exception):
    pass

def create_outgoing_report4(
    db: Session,
    report_data: OutgoingReport4Create,
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None
) -> Dict:
    """สร้างรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบใหม่"""
    try:
        logger.info(f"Creating OutgoingReport4: {report_data.reference_number}")
        
        # ตรวจสอบ reference_number ซ้ำ
        existing = db.query(OutgoingReport4).filter(
            OutgoingReport4.reference_number == report_data.reference_number,
            OutgoingReport4.is_active == True
        ).first()
        
        if existing:
            raise DuplicateKeyError(f"เลขอ้างอิง {report_data.reference_number} มีอยู่แล้ว")
        
        # สร้าง object
        db_report = OutgoingReport4(
            reference_number=report_data.reference_number,
            reference_date=report_data.reference_date,
            subject=report_data.subject,
            signature_authority_user_id=report_data.signature_authority_user_id,
            department_id=report_data.department_id,
            user_id=report_data.user_id,
            other_department=report_data.other_department,
            confidentiality_level=report_data.confidentiality_level,
            urgency_level=report_data.urgency_level,
            remarks=report_data.remarks,
            proposal_purpose=report_data.proposal_purpose,
            consideration_result=report_data.consideration_result,
            complaint_id=report_data.complaint_id,
            created_by=current_user_id
        )
        
        db.add(db_report)
        db.flush()
        db.commit()
        db.refresh(db_report)
        
        return get_outgoing_report4_by_id(db, db_report.id)
        
    except DuplicateKeyError:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating outgoing report4: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report4_by_id(db: Session, report_id: UUID) -> Dict:
    """ดึงรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบตาม ID"""
    try:
        report = db.query(OutgoingReport4).options(
            joinedload(OutgoingReport4.signature_authority_user),
            joinedload(OutgoingReport4.department),
            joinedload(OutgoingReport4.user),
            joinedload(OutgoingReport4.creator),
            joinedload(OutgoingReport4.complaint),
            joinedload(OutgoingReport4.attachments)
        ).filter(
            OutgoingReport4.id == report_id,
            OutgoingReport4.is_active == True
        ).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")
        
        return {
            "id": str(report.id),
            "reference_number": report.reference_number,
            "reference_date": report.reference_date.isoformat() if report.reference_date else None,
            "subject": report.subject,
            "signature_authority_user": {
                "id": str(report.signature_authority_user_id),
                "name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else "N/A"
            },
            "department": {
                "id": str(report.department_id) if report.department_id else None,
                "name": report.department.name if report.department else "N/A"
            },
            "user": {
                "id": str(report.user_id) if report.user_id else None,
                "name": f"{report.user.first_name} {report.user.last_name}" if report.user else "N/A"
            },
            "other_department": report.other_department,
            "confidentiality_level": report.confidentiality_level,
            "urgency_level": report.urgency_level,
            "remarks": report.remarks,
            "proposal_purpose": report.proposal_purpose,
            "consideration_result": report.consideration_result,
            "complaint_id": str(report.complaint_id) if report.complaint_id else None,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "attachments": [
                {
                    "id": str(att.id),
                    "file_name": att.file_name,
                    "file_size": att.file_size,
                    "file_type": att.file_type
                } for att in report.attachments if att.is_active
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting outgoing report4: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_reports4(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    department_id: Optional[UUID] = None,
    signature_authority_user_id: Optional[UUID] = None,
    urgency_level: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> Dict:
    """ดึงรายการรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ"""
    try:
        query = db.query(OutgoingReport4).options(
            joinedload(OutgoingReport4.signature_authority_user),
            joinedload(OutgoingReport4.department),
            joinedload(OutgoingReport4.user),
            joinedload(OutgoingReport4.complaint),
            joinedload(OutgoingReport4.attachments)
        ).filter(OutgoingReport4.is_active == True)
        
        if search:
            query = query.filter(
                or_(
                    OutgoingReport4.reference_number.ilike(f"%{search}%"),
                    OutgoingReport4.subject.ilike(f"%{search}%"),
                    OutgoingReport4.remarks.ilike(f"%{search}%"),
                    OutgoingReport4.other_department.ilike(f"%{search}%")
                )
            )
        
        if department_id:
            query = query.filter(OutgoingReport4.department_id == department_id)
        if signature_authority_user_id:
            query = query.filter(OutgoingReport4.signature_authority_user_id == signature_authority_user_id)
        if urgency_level:
            query = query.filter(OutgoingReport4.urgency_level == urgency_level)
        if date_from:
            query = query.filter(OutgoingReport4.reference_date >= date_from)
        if date_to:
            query = query.filter(OutgoingReport4.reference_date <= date_to)
        
        total = query.count()
        reports = query.order_by(OutgoingReport4.created_at.desc()).offset(skip).limit(limit).all()
        
        items = []
        for report in reports:
            items.append({
                "id": str(report.id),
                "reference_number": report.reference_number,
                "reference_date": report.reference_date.isoformat() if report.reference_date else None,
                "subject": report.subject,
                "department_name": report.department.name if report.department else report.other_department or "N/A",
                "signature_user_name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else "N/A",
                "urgency_level": report.urgency_level,
                "proposal_purpose": report.proposal_purpose,
                "consideration_result": report.consideration_result,
                "created_at": report.created_at.isoformat() if report.created_at else None,
                "attachment_count": len([att for att in report.attachments if att.is_active])
            })
        
        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1,
            "size": limit,
            "total_pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Error getting outgoing reports4: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report4_options(db: Session) -> Dict:
    """ดึงตัวเลือกสำหรับ dropdown"""
    try:
        departments = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
        users = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()
        
        return {
            "departments": [{"id": str(dept.id), "name": dept.name} for dept in departments],
            "users": [{"id": str(user.id), "name": f"{user.first_name} {user.last_name}"} for user in users],
            "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
            "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"]
        }
        
    except Exception as e:
        logger.error(f"Error getting options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def auto_fill_from_complaint4(db: Session, complaint_id: UUID) -> Dict:
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")
        
        return {
            "complaint_id": str(complaint.id),
            "subject": complaint.subject,
            "reference_number": complaint.complaint_number if hasattr(complaint, 'complaint_number') else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto filling: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")