# app/api/v1/controllers/outgoing_report5_controller.py
from __future__ import annotations
from typing import Dict, Any, Optional, List, Tuple, Union
from uuid import UUID
from datetime import datetime
import os

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from models.outgoing_reports5 import OutgoingReport5, OutgoingReportAttachment5
from models.comp_complaint import Complaint
from models.user import User
from models.departments import Department
from app.api.v1.schemas.outgoing_report5 import OutgoingReport5Create, OutgoingReport5Update
from lib.file_upload import save_upload_file, delete_upload_file
from lib.logger import get_logger

logger = get_logger("outgoing_report5_controller")


class DuplicateKeyError(Exception):
    pass


def _safe_str(v): return str(v) if v is not None else None
def _iso(dt: Optional[datetime]): return dt.isoformat() if dt else None

def _attachment_dict(att: OutgoingReportAttachment5) -> Dict[str, Any]:
    return {
        "id": _safe_str(getattr(att, "id", None)),
        "file_name": getattr(att, "file_name", None),
        "file_path": getattr(att, "file_path", None),
        "file_url": getattr(att, "file_url", None),
        "file_type": getattr(att, "file_type", None),
        "file_size": getattr(att, "file_size", None),
        "created_at": _iso(getattr(att, "created_at", None)),
    }


# ========= CREATE =========
async def create_outgoing_report5(
    db: Session,
    report_data: Union[OutgoingReport5Create, dict],
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None,
) -> Dict[str, Any]:
    if isinstance(report_data, dict):
        report_data = OutgoingReport5Create(**report_data)

    try:
        # กันเลขซ้ำโดยใช้ receive_number
        dup = db.query(OutgoingReport5).filter(
            OutgoingReport5.receive_number == report_data.receive_number,
            OutgoingReport5.is_active == True
        ).first()
        if dup:
            raise DuplicateKeyError(f"เลขรับเรื่อง {report_data.receive_number} มีอยู่แล้ว")

        # validate ความสัมพันธ์หลัก
        dept = db.query(Department).filter(Department.id == report_data.department_id, Department.is_active == True).first()
        if not dept:
            raise HTTPException(status_code=404, detail="ไม่พบหน่วยงานที่ระบุ")

        sig_user = None
        if report_data.signature_authority_user_id:
            sig_user = db.query(User).filter(User.id == report_data.signature_authority_user_id, User.is_active == True).first()
            if not sig_user:
                raise HTTPException(status_code=404, detail="ไม่พบผู้มีอำนาจลงนามที่ระบุ")

        complaint = None
        if report_data.complaint_id:
            complaint = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()

        # insert
        rec = OutgoingReport5(
            receive_number=report_data.receive_number,
            receive_date=report_data.receive_date,
            agency_reference_number=report_data.agency_reference_number,
            agency_reference_date=report_data.agency_reference_date,
            internal_register_number=report_data.internal_register_number,
            internal_register_date=report_data.internal_register_date,
            present_to_director_date=report_data.present_to_director_date,

            complaint_id=report_data.complaint_id,
            complaint_number=report_data.complaint_number,
            complaint_number_date=report_data.complaint_number_date,

            subject=report_data.subject,
            document_number=report_data.document_number,
            document_date=report_data.document_date,
            remarks=report_data.remarks,

            signature_authority_user_id=report_data.signature_authority_user_id,
            department_id=report_data.department_id,
            user_id=report_data.user_id,

            confidentiality_level=report_data.confidentiality_level,
            urgency_level=report_data.urgency_level,

            created_by=current_user_id
        )
        db.add(rec)
        db.flush()  # เพื่อให้ได้ id

        # แนบไฟล์ (optional)
        uploaded = []
        if files:
            for f in files:
                info = await save_upload_file(f, f"outgoing-reports5/{rec.id}")
                att = OutgoingReportAttachment5(
                    outgoing_report_id=rec.id,
                    file_name=info.get("filename") or f.filename,
                    file_path=info.get("file_path"),
                    file_url=info.get("file_url"),
                    file_type=info.get("file_type"),
                    file_size=str(info.get("file_size")) if info.get("file_size") is not None else None,
                    is_active=True
                )
                db.add(att)
                db.flush()
                db.refresh(att)
                uploaded.append(att)

        db.commit()
        db.refresh(rec)

        return get_outgoing_report5_by_id(db, rec.id)

    except DuplicateKeyError:
        db.rollback()
        raise
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Create OutgoingReport5 error: {e}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# ========= READ BY ID =========
def get_outgoing_report5_by_id(db: Session, report_id: UUID) -> Dict[str, Any]:
    rec = db.query(OutgoingReport5).options(
        joinedload(OutgoingReport5.department),
        joinedload(OutgoingReport5.user),
        joinedload(OutgoingReport5.signature_authority_user),
        joinedload(OutgoingReport5.creator),
        joinedload(OutgoingReport5.complaint),
        joinedload(OutgoingReport5.attachments),
    ).filter(
        OutgoingReport5.id == report_id,
        OutgoingReport5.is_active == True
    ).first()

    if not rec:
        raise HTTPException(status_code=404, detail="ไม่พบรายการที่ระบุ")

    return {
        "id": _safe_str(rec.id),
        "receive_number": rec.receive_number,
        "receive_date": _iso(rec.receive_date),
        "subject": rec.subject,
        "complaint_number": rec.complaint_number,
        "complaint_number_date": _iso(rec.complaint_number_date),

        "department": {
            "id": _safe_str(rec.department_id),
            "name": rec.department.name if rec.department else "N/A",
        },
        "signature_authority_user": {
            "id": _safe_str(rec.signature_authority_user_id),
            "name": (f"{rec.signature_authority_user.first_name} {rec.signature_authority_user.last_name}"
                     if rec.signature_authority_user else "N/A")
        } if rec.signature_authority_user_id else None,
        "user": {
            "id": _safe_str(rec.user_id),
            "name": (f"{rec.user.first_name} {rec.user.last_name}" if rec.user else "N/A")
        } if rec.user_id else None,

        "confidentiality_level": rec.confidentiality_level,
        "urgency_level": rec.urgency_level,

        "agency_reference_number": rec.agency_reference_number,
        "agency_reference_date": _iso(rec.agency_reference_date),
        "internal_register_number": rec.internal_register_number,
        "internal_register_date": _iso(rec.internal_register_date),
        "present_to_director_date": _iso(rec.present_to_director_date),
        "document_number": rec.document_number,
        "document_date": _iso(rec.document_date),

        "complaint_id": _safe_str(rec.complaint_id) if rec.complaint_id else None,
        "created_at": _iso(rec.created_at),
        "updated_at": _iso(rec.updated_at),
        "attachments": [_attachment_dict(a) for a in rec.attachments if getattr(a, "is_active", True)],
        "attachment_count": len([a for a in rec.attachments if getattr(a, "is_active", True)])
    }


# ========= LIST =========
def get_outgoing_reports5(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    department_id: Optional[UUID] = None,
    signature_authority_user_id: Optional[UUID] = None,
    urgency_level: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> Dict[str, Any]:
    q = db.query(OutgoingReport5).options(
        joinedload(OutgoingReport5.department),
        joinedload(OutgoingReport5.signature_authority_user),
        joinedload(OutgoingReport5.attachments),
    ).filter(OutgoingReport5.is_active == True)

    if search:
        like = f"%{search}%"
        q = q.filter(or_(
            OutgoingReport5.receive_number.ilike(like),
            OutgoingReport5.subject.ilike(like),
            OutgoingReport5.remarks.ilike(like),
            OutgoingReport5.complaint_number.ilike(like),
        ))

    if department_id:
        q = q.filter(OutgoingReport5.department_id == department_id)
    if signature_authority_user_id:
        q = q.filter(OutgoingReport5.signature_authority_user_id == signature_authority_user_id)
    if urgency_level:
        q = q.filter(OutgoingReport5.urgency_level == urgency_level)
    # กรองช่วงวันที่ด้วย receive_date
    if date_from:
        q = q.filter(OutgoingReport5.receive_date >= date_from)
    if date_to:
        q = q.filter(OutgoingReport5.receive_date <= date_to)

    total = q.count()
    rows = q.order_by(OutgoingReport5.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for r in rows:
        items.append({
            "id": _safe_str(r.id),
            "receive_number": r.receive_number,
            "receive_date": _iso(r.receive_date),
            "subject": r.subject,
            "complaint_number": r.complaint_number,
            "department_name": r.department.name if r.department else "N/A",
            "signature_user_name": (
                f"{r.signature_authority_user.first_name} {r.signature_authority_user.last_name}"
                if r.signature_authority_user else None
            ),
            "urgency_level": r.urgency_level,
            "created_at": _iso(r.created_at),
            "attachment_count": len([a for a in r.attachments if getattr(a, "is_active", True)]),
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit,
    }


# ========= OPTIONS =========
def get_outgoing_report5_options(db: Session) -> Dict[str, Any]:
    deps = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
    users = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()

    return {
        "departments": [{"id": _safe_str(d.id), "name": d.name} for d in deps],
        "signature_authorities": [{"id": _safe_str(u.id), "name": f"{u.first_name} {u.last_name}"} for u in users],
        "users": [{"id": _safe_str(u.id), "name": f"{u.first_name} {u.last_name}"} for u in users],
        "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
        "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"],
    }


# ========= AUTO-FILL =========
def auto_fill_from_complaint5(db: Session, complaint_id: UUID) -> Dict[str, Any]:
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")

    return {
        "complaint_id": _safe_str(c.id),
        "complaint_number": c.complaint_number,
        "complaint_number_date": _iso(getattr(c, "created_at", None)),
        "subject": f"รับเรื่องรายงานผลการพิจารณาจากหน่วยงาน - {c.subject}",
    }


# ========= ATTACHMENTS =========
async def add_attachments_to_outgoing_report5(
    db: Session,
    outgoing_report_id: UUID,
    files: List[UploadFile],
    current_user_id: UUID
) -> Dict[str, Any]:
    rec = db.query(OutgoingReport5).filter(OutgoingReport5.id == outgoing_report_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="ไม่พบรายการที่ระบุ")

    saved = []
    for f in files:
        info = await save_upload_file(f, f"outgoing-reports5/{outgoing_report_id}")
        att = OutgoingReportAttachment5(
            outgoing_report_id=outgoing_report_id,
            file_name=info.get("filename") or f.filename,
            file_path=info.get("file_path"),
            file_url=info.get("file_url"),
            file_type=info.get("file_type"),
            file_size=str(info.get("file_size")) if info.get("file_size") is not None else None,
            is_active=True,
        )
        db.add(att)
        db.flush()
        db.refresh(att)
        saved.append(att)

    db.commit()
    return {
        "outgoing_report_id": _safe_str(outgoing_report_id),
        "attachments": [_attachment_dict(a) for a in saved],
    }


def list_attachments_of_outgoing_report5(db: Session, outgoing_report_id: UUID) -> Dict[str, Any]:
    rows = (
        db.query(OutgoingReportAttachment5)
        .filter(OutgoingReportAttachment5.outgoing_report_id == outgoing_report_id)
        .order_by(OutgoingReportAttachment5.created_at.desc())
        .all()
    )
    return {
        "outgoing_report_id": _safe_str(outgoing_report_id),
        "attachments": [_attachment_dict(r) for r in rows if getattr(r, "is_active", True)],
    }


def get_outgoing_report5_attachment_fileinfo(
    db: Session, outgoing_report_id: UUID, attachment_id: UUID
) -> Tuple[str, str, str]:
    att = db.query(OutgoingReportAttachment5).filter(
        OutgoingReportAttachment5.id == attachment_id,
        OutgoingReportAttachment5.outgoing_report_id == outgoing_report_id
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์แนบที่ระบุ")

    file_path = getattr(att, "file_path", None)
    if not file_path or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์บนเซิร์ฟเวอร์")

    filename = getattr(att, "file_name", None) or os.path.basename(file_path)
    media_type = getattr(att, "file_type", None) or "application/octet-stream"
    return file_path, media_type, filename


def delete_outgoing_report5_attachment_by_id(
    db: Session,
    outgoing_report_id: UUID,
    attachment_id: UUID,
    hard_delete: bool = False
) -> Dict[str, Any]:
    att = db.query(OutgoingReportAttachment5).filter(
        OutgoingReportAttachment5.id == attachment_id,
        OutgoingReportAttachment5.outgoing_report_id == outgoing_report_id
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์แนบที่ระบุ")

    if hard_delete:
        try:
            if getattr(att, "file_path", None):
                delete_upload_file(att.file_path)
        except Exception:
            pass
        db.delete(att)
        db.commit()
        return {"code": "0003", "message": "ลบไฟล์แนบ (hard delete) เรียบร้อย", "attachment_id": _safe_str(attachment_id)}

    if hasattr(att, "is_active"):
        att.is_active = False
        db.commit()
        return {"code": "0001", "message": "ลบไฟล์แนบเรียบร้อย (soft delete)", "attachment_id": _safe_str(attachment_id)}

    db.delete(att)
    db.commit()
    return {"code": "0003", "message": "ลบเรคอร์ดไฟล์แนบ", "attachment_id": _safe_str(attachment_id)}
