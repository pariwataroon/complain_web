from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from uuid import UUID
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, UploadFile

from models.outgoing_reports2 import OutgoingReport2, OutgoingReportAttachment2
from models.comp_complaint import Complaint
from models.user import User
from models.position import Position
from models.departments import Department
from app.api.v1.schemas.outgoing_report2 import OutgoingReport2Create, OutgoingReport2Update
from lib.logger import get_logger

logger = get_logger("outgoing_report2_controller")

class DuplicateKeyError(Exception):
    pass

def create_outgoing_report2(
    db: Session,
    report_data: OutgoingReport2Create,
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None
) -> Dict:
    """สร้างรายงานแจ้งผู้ร้องเรียนใหม่"""
    try:
        logger.info(f"Creating OutgoingReport2: {report_data.complaint_number}")
        
        # ตรวจสอบ complaint_number ซ้ำ
        existing = db.query(OutgoingReport2).filter(
            OutgoingReport2.complaint_number == report_data.complaint_number,
            OutgoingReport2.is_active == True
        ).first()
        
        if existing:
            raise DuplicateKeyError(f"เลขหนังสือ {report_data.complaint_number} มีอยู่แล้ว")
        
        # ตรวจสอบความสอดคล้องระหว่าง complaint_id และ complaint_number
        if report_data.complaint_id:
            complaint = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()
            if not complaint:
                raise HTTPException(status_code=400, detail="ไม่พบข้อร้องเรียนที่ระบุ")
            
            # ตรวจสอบว่า complaint_number ตรงกันหรือไม่
            if complaint.complaint_number != report_data.complaint_number:
                raise HTTPException(
                    status_code=400, 
                    detail=f"หมายเลขข้อร้องเรียน '{report_data.complaint_number}' ไม่ตรงกับข้อร้องเรียน ID ที่ระบุ (ควรเป็น '{complaint.complaint_number}')"
                )
        
        # สร้าง object ตาม model ที่ถูกต้อง
        db_report = OutgoingReport2(
            position_id=report_data.position_id,
            complaint_number=report_data.complaint_number,
            complaint_number_date=report_data.complaint_number_date,
            subject=report_data.subject,
            signature_authority_user_id=report_data.signature_authority_user_id,
            department_id=report_data.department_id,
            user_id=report_data.user_id,
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
        
        return get_outgoing_report2_by_id(db, db_report.id)
        
    except DuplicateKeyError:
        db.rollback()
        raise
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating outgoing report2: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report2_by_id(db: Session, report_id: UUID) -> Dict:
    """ดึงรายงานแจ้งผู้ร้องเรียนตาม ID"""
    try:
        report = db.query(OutgoingReport2).options(
            joinedload(OutgoingReport2.position),
            joinedload(OutgoingReport2.signature_authority_user),
            joinedload(OutgoingReport2.department),
            joinedload(OutgoingReport2.user),
            joinedload(OutgoingReport2.creator),
            joinedload(OutgoingReport2.complaint),
            joinedload(OutgoingReport2.attachments)
        ).filter(
            OutgoingReport2.id == report_id,
            OutgoingReport2.is_active == True
        ).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")
        
        return {
            "id": str(report.id),
            "position": {
                "id": str(report.position_id),
                "name": report.position.name if report.position else "N/A"
            },
            "complaint_number": report.complaint_number,
            "complaint_number_date": report.complaint_number_date.isoformat() if report.complaint_number_date else None,
            "subject": report.subject,
            "department": {
                "id": str(report.department_id) if report.department_id else None,
                "name": report.department.name if report.department else "N/A"
            },
            "user": {
                "id": str(report.user_id) if report.user_id else None,
                "name": f"{report.user.first_name} {report.user.last_name}" if report.user else "N/A"
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
        logger.error(f"Error getting outgoing report2: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_reports2(
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
    """ดึงรายการรายงานแจ้งผู้ร้องเรียน"""
    try:
        query = db.query(OutgoingReport2).options(
            joinedload(OutgoingReport2.position),
            joinedload(OutgoingReport2.signature_authority_user),
            joinedload(OutgoingReport2.department),
            joinedload(OutgoingReport2.user),
            joinedload(OutgoingReport2.complaint),
            joinedload(OutgoingReport2.attachments)
        ).filter(OutgoingReport2.is_active == True)
        
        if search:
            query = query.filter(
                or_(
                    OutgoingReport2.complaint_number.ilike(f"%{search}%"),
                    OutgoingReport2.subject.ilike(f"%{search}%"),
                    OutgoingReport2.remarks.ilike(f"%{search}%")
                )
            )
        
        if position_id:
            query = query.filter(OutgoingReport2.position_id == position_id)
        if department_id:
            query = query.filter(OutgoingReport2.department_id == department_id)
        if signature_authority_user_id:
            query = query.filter(OutgoingReport2.signature_authority_user_id == signature_authority_user_id)
        if urgency_level:
            query = query.filter(OutgoingReport2.urgency_level == urgency_level)
        if date_from:
            query = query.filter(OutgoingReport2.complaint_number_date >= date_from)
        if date_to:
            query = query.filter(OutgoingReport2.complaint_number_date <= date_to)
        
        total = query.count()
        reports = query.order_by(OutgoingReport2.created_at.desc()).offset(skip).limit(limit).all()
        
        items = []
        for report in reports:
            items.append({
                "id": str(report.id),
                "complaint_number": report.complaint_number,
                "subject": report.subject,
                "position_name": report.position.name if report.position else "N/A",
                "department_name": report.department.name if report.department else "N/A",
                "signature_user_name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else "N/A",
                "urgency_level": report.urgency_level,
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
        logger.error(f"Error getting outgoing reports2: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report2_options(db: Session) -> Dict:
    """ดึงตัวเลือกสำหรับ dropdown"""
    try:
        positions = db.query(Position).filter(Position.is_active == True).order_by(Position.name).all()
        departments = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
        users = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()
        
        return {
            "positions": [{"id": str(pos.id), "name": pos.name} for pos in positions],
            "departments": [{"id": str(dept.id), "name": dept.name} for dept in departments],
            "users": [{"id": str(user.id), "name": f"{user.first_name} {user.last_name}"} for user in users],
            "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
            "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"]
        }
        
    except Exception as e:
        logger.error(f"Error getting options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def auto_fill_from_complaint2(db: Session, complaint_id: UUID) -> Dict:
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")
        
        return {
            "complaint_id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "subject": complaint.subject,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto filling: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")