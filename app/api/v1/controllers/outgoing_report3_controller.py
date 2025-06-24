from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from uuid import UUID
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, UploadFile

from models.outgoing_reports3 import OutgoingReport3, OutgoingReportAttachment3
from models.comp_complaint import Complaint
from models.user import User
from models.position import Position
from models.departments import Department
from app.api.v1.schemas.outgoing_report3 import OutgoingReport3Create, OutgoingReport3Update
from lib.logger import get_logger

logger = get_logger("outgoing_report3_controller")

class DuplicateKeyError(Exception):
    pass

def create_outgoing_report3(
    db: Session,
    report_data: OutgoingReport3Create,
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None
) -> Dict:
    """สร้างรายงานขอทราบผลการพิจารณาใหม่"""
    try:
        logger.info(f"Creating OutgoingReport3: {report_data.complaint_number}")
        
        # ตรวจสอบ reference_number ซ้ำ (แก้ไขจาก complaint_number)
        existing = db.query(OutgoingReport3).filter(
            OutgoingReport3.reference_number == report_data.reference_number,
            OutgoingReport3.is_active == True
        ).first()
        
        if existing:
            raise DuplicateKeyError(f"เลขหนังสือ {report_data.reference_number} มีอยู่แล้ว")
        
        # สร้าง object ตาม schema ที่ถูกต้อง
        db_report = OutgoingReport3(
            position_id=report_data.position_id,
            reference_number=report_data.reference_number,
            reference_date=report_data.reference_date,
            subject=report_data.subject,
            complaint_number=report_data.complaint_number,
            complaint_number_date=report_data.complaint_number_date,
            signature_authority_user_id=report_data.signature_authority_user_id,
            department_id=report_data.department_id,
            confidentiality_level=report_data.confidentiality_level,
            urgency_level=report_data.urgency_level,
            remarks=report_data.remarks,
            complaint_id=report_data.complaint_id,
            created_by=current_user_id
        )
        
        db.add(db_report)
        db.flush()
        db.commit()
        db.refresh(db_report)
        
        return get_outgoing_report3_by_id(db, db_report.id)
        
    except DuplicateKeyError:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating outgoing report3: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report3_by_id(db: Session, report_id: UUID) -> Dict:
    """ดึงรายงานขอทราบผลการพิจารณาตาม ID"""
    try:
        report = db.query(OutgoingReport3).options(
            joinedload(OutgoingReport3.position),
            joinedload(OutgoingReport3.signature_authority_user),
            joinedload(OutgoingReport3.department),
            joinedload(OutgoingReport3.creator),
            joinedload(OutgoingReport3.complaint),
            joinedload(OutgoingReport3.attachments)
        ).filter(
            OutgoingReport3.id == report_id,
            OutgoingReport3.is_active == True
        ).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")
        
        return {
            "id": str(report.id),
            "position": {
                "id": str(report.position_id),
                "name": report.position.name if report.position else "N/A"
            },
            "reference_number": report.reference_number,
            "reference_date": report.reference_date.isoformat() if report.reference_date else None,
            "subject": report.subject,
            "complaint_number": report.complaint_number,
            "complaint_number_date": report.complaint_number_date.isoformat() if report.complaint_number_date else None,
            "department": {
                "id": str(report.department_id) if report.department_id else None,
                "name": report.department.name if report.department else "N/A"
            },
            "signature_authority_user": {
                "id": str(report.signature_authority_user_id),
                "name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else "N/A"
            },
            "confidentiality_level": report.confidentiality_level,
            "urgency_level": report.urgency_level,
            "remarks": report.remarks,
            "complaint_id": str(report.complaint_id) if report.complaint_id else None,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "created_by": str(report.created_by),
            "creator_name": f"{report.creator.first_name} {report.creator.last_name}" if report.creator else "N/A",
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
        logger.error(f"Error getting outgoing report3: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_reports3(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    position_id: Optional[UUID] = None,
    department_id: Optional[UUID] = None,
    signature_authority_user_id: Optional[UUID] = None,
    urgency_level: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> Dict:
    """ดึงรายการรายงานขอทราบผลการพิจารณา"""
    try:
        query = db.query(OutgoingReport3).options(
            joinedload(OutgoingReport3.position),
            joinedload(OutgoingReport3.signature_authority_user),
            joinedload(OutgoingReport3.department),
            joinedload(OutgoingReport3.complaint),
            joinedload(OutgoingReport3.attachments)
        ).filter(OutgoingReport3.is_active == True)
        
        if search:
            query = query.filter(
                or_(
                    OutgoingReport3.reference_number.ilike(f"%{search}%"),
                    OutgoingReport3.complaint_number.ilike(f"%{search}%"),
                    OutgoingReport3.subject.ilike(f"%{search}%"),
                    OutgoingReport3.remarks.ilike(f"%{search}%")
                )
            )
        
        if position_id:
            query = query.filter(OutgoingReport3.position_id == position_id)
        if department_id:
            query = query.filter(OutgoingReport3.department_id == department_id)
        if signature_authority_user_id:
            query = query.filter(OutgoingReport3.signature_authority_user_id == signature_authority_user_id)
        if urgency_level:
            query = query.filter(OutgoingReport3.urgency_level == urgency_level)
        if date_from:
            query = query.filter(OutgoingReport3.reference_date >= date_from)
        if date_to:
            query = query.filter(OutgoingReport3.reference_date <= date_to)
        
        total = query.count()
        reports = query.order_by(OutgoingReport3.created_at.desc()).offset(skip).limit(limit).all()
        
        items = []
        for report in reports:
            items.append({
                "id": str(report.id),
                "reference_number": report.reference_number,
                "reference_date": report.reference_date.isoformat() if report.reference_date else None,
                "complaint_number": report.complaint_number,
                "subject": report.subject,
                "position_name": report.position.name if report.position else "N/A",
                "department_name": report.department.name if report.department else "N/A",
                "signature_user_name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else "N/A",
                "urgency_level": report.urgency_level,
                "confidentiality_level": report.confidentiality_level,
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
        logger.error(f"Error getting outgoing reports3: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report3_options(db: Session) -> Dict:
    """ดึงตัวเลือกสำหรับ dropdown"""
    try:
        positions = db.query(Position).filter(Position.is_active == True).order_by(Position.name).all()
        departments = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
        
        # เปลี่ยนจาก users ทั่วไป เป็น signature authorities (users ที่มีสิทธิ์ลงนาม)
        signature_authorities = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()
        
        return {
            "positions": [{"id": str(pos.id), "name": pos.name} for pos in positions],
            "departments": [{"id": str(dept.id), "name": dept.name} for dept in departments],
            "signature_authorities": [{"id": str(user.id), "name": f"{user.first_name} {user.last_name}"} for user in signature_authorities],
            "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
            "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"]
        }
        
    except Exception as e:
        logger.error(f"Error getting options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def auto_fill_from_complaint3(db: Session, complaint_id: UUID) -> Dict:
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")
        
        return {
            "complaint_id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "complaint_number_date": complaint.created_at.isoformat() if complaint.created_at else None,
            "subject": f"ขอทราบผลการพิจารณา - {complaint.subject}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto filling: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")