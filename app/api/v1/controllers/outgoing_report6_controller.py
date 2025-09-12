from __future__ import annotations
from typing import Dict, Any, Optional, List, Tuple, Union
from uuid import UUID
from datetime import datetime
import os
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload, with_loader_criteria
from sqlalchemy import or_
from models.outgoing_reports6 import OutgoingReport6, OutgoingReportAttachment6
from models.comp_complaint import Complaint
from models.user import User
from models.departments import Department
from models.position import Position
from app.api.v1.schemas.outgoing_report6 import OutgoingReport6Create, OutgoingReport6Update
from lib.file_upload import save_upload_file, delete_upload_file, get_storage_config
from lib.logger import get_logger
logger = get_logger("outgoing_report6_controller")

class DuplicateKeyError(Exception):
    pass

def _safe_str(v): return str(v) if v is not None else None
def _iso(dt: Optional[datetime]): return dt.isoformat() if dt else None

def _attachment_dict(att: OutgoingReportAttachment6) -> Dict[str, Any]:
    return {
        "id": _safe_str(getattr(att, "id", None)),
        "file_name": getattr(att, "file_name", None),
        "file_path": getattr(att, "file_path", None),
        "file_type": getattr(att, "file_type", None),
        "file_size": getattr(att, "file_size", None),
        "created_at": _iso(getattr(att, "created_at", None)),
    }

def create_outgoing_report6(
    db: Session,
    report_data: Union[OutgoingReport6Create, dict],
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None,
) -> Dict[str, Any]:
    if isinstance(report_data, dict):
        report_data = OutgoingReport6Create(**report_data)
    try:
        dup = db.query(OutgoingReport6).filter(
            OutgoingReport6.document_number == report_data.document_number,
            OutgoingReport6.is_active == True
        ).first()
        if dup:
            raise DuplicateKeyError(f"เลขที่เอกสาร {report_data.document_number} มีอยู่แล้ว")
        dept = db.query(Department).filter(Department.id == report_data.department_id, Department.is_active == True).first() if report_data.department_id else None
        if report_data.department_id and not dept:
            raise HTTPException(status_code=404, detail="ไม่พบหน่วยงานที่ระบุ")
        if report_data.signature_authority_user_id:
            sig_user = db.query(User).filter(User.id == report_data.signature_authority_user_id, User.is_active == True).first()
            if not sig_user:
                raise HTTPException(status_code=404, detail="ไม่พบผู้มีอำนาจลงนามที่ระบุ")
        if report_data.complaint_id:
            _ = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()
        # Validate position if provided
        if getattr(report_data, "position_id", None):
            pos = db.query(Position).filter(Position.id == report_data.position_id, Position.is_active == True).first()
            if not pos:
                raise HTTPException(status_code=400, detail="ไม่พบตำแหน่งที่เลือก")
            pos_name = getattr(pos, "name", "") or ""
            if pos_name in {"other", "others", "อื่นๆ", "อื่น ๆ"} and not getattr(report_data, "position_other_text", None):
                raise HTTPException(status_code=400, detail="กรุณาระบุตำแหน่ง (อื่นๆ) เพิ่มเติม")
        rec = OutgoingReport6(
            reference_number=report_data.reference_number,
            reference_date=report_data.reference_date,
            subject=report_data.subject,
            complaint_number=report_data.complaint_number,
            complaint_number_date=report_data.complaint_number_date,
            signature_authority_user_id=report_data.signature_authority_user_id,
            department_id=report_data.department_id,
            user_id=report_data.user_id,
            other_department=report_data.other_department,
            confidentiality_level=report_data.confidentiality_level,
            urgency_level=report_data.urgency_level,
            document_number=report_data.document_number,
            document_date=report_data.document_date,
            remarks=report_data.remarks,
            proposal_purpose=report_data.proposal_purpose,
            consideration_result=report_data.consideration_result,
            complaint_id=report_data.complaint_id,
            position_id=getattr(report_data, "position_id", None),
            position_other_text=getattr(report_data, "position_other_text", None),
            created_by=current_user_id
        )
        db.add(rec)
        db.flush()
        if files:
            for f in files:
                info = save_upload_file(f, f"outgoing-reports6/{rec.id}")
                att = OutgoingReportAttachment6(
                    outgoing_report_id=rec.id,
                    file_name=info.get("filename") or f.filename,
                    file_path=info.get("file_url"),
                    file_type=info.get("file_type"),
                    file_size=str(info.get("file_size")) if info.get("file_size") is not None else None,
                    is_active=True
                )
                db.add(att)
                db.flush()
                db.refresh(att)
        db.commit()
        db.refresh(rec)
        return get_outgoing_report6_by_id(db, rec.id)
    except DuplicateKeyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Create OutgoingReport6 error: {e}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report6_by_id(db: Session, report_id: UUID) -> Dict[str, Any]:
    rec = db.query(OutgoingReport6).options(
        joinedload(OutgoingReport6.department),
        joinedload(OutgoingReport6.user),
        joinedload(OutgoingReport6.signature_authority_user),
        joinedload(OutgoingReport6.creator),
        joinedload(OutgoingReport6.complaint),
        joinedload(OutgoingReport6.attachments),
        with_loader_criteria(OutgoingReportAttachment6, OutgoingReportAttachment6.is_active == True, include_aliases=True),
    ).filter(
        OutgoingReport6.id == report_id,
        OutgoingReport6.is_active == True
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="ไม่พบรายการที่ระบุ")
    return {
        "id": _safe_str(rec.id),
        "reference_number": rec.reference_number,
        "reference_date": _iso(rec.reference_date),
        "subject": rec.subject,
        "complaint_number": rec.complaint_number,
        "complaint_number_date": _iso(rec.complaint_number_date),
        "position": {
            "id": _safe_str(getattr(rec, "position_id", None)),
            "other_text": getattr(rec, "position_other_text", None)
        },
        "department": {"id": _safe_str(rec.department_id), "name": rec.department.name if rec.department else "N/A"},
        "signature_authority_user": {"id": _safe_str(rec.signature_authority_user_id), "name": (f"{rec.signature_authority_user.first_name} {rec.signature_authority_user.last_name}" if rec.signature_authority_user else "N/A")},
        "user": {"id": _safe_str(rec.user_id), "name": (f"{rec.user.first_name} {rec.user.last_name}" if rec.user else "N/A")},
        "confidentiality_level": rec.confidentiality_level,
        "urgency_level": rec.urgency_level,
        "other_department": rec.other_department,
        "document_number": rec.document_number,
        "document_date": _iso(rec.document_date),
        "remarks": rec.remarks,
        "proposal_purpose": rec.proposal_purpose,
        "consideration_result": rec.consideration_result,
        "complaint_id": _safe_str(rec.complaint_id) if rec.complaint_id else None,
        "created_at": _iso(rec.created_at),
        "updated_at": _iso(rec.updated_at),
        "attachments": [_attachment_dict(a) for a in rec.attachments],
        "attachment_count": len(rec.attachments)
    }

def get_outgoing_reports6(
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
    q = db.query(OutgoingReport6).options(
        joinedload(OutgoingReport6.department),
        joinedload(OutgoingReport6.signature_authority_user),
        joinedload(OutgoingReport6.attachments),
        with_loader_criteria(OutgoingReportAttachment6, OutgoingReportAttachment6.is_active == True, include_aliases=True),
    ).filter(OutgoingReport6.is_active == True)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(OutgoingReport6.reference_number.ilike(like), OutgoingReport6.subject.ilike(like), OutgoingReport6.remarks.ilike(like), OutgoingReport6.complaint_number.ilike(like)))
    if department_id:
        q = q.filter(OutgoingReport6.department_id == department_id)
    if signature_authority_user_id:
        q = q.filter(OutgoingReport6.signature_authority_user_id == signature_authority_user_id)
    if urgency_level:
        q = q.filter(OutgoingReport6.urgency_level == urgency_level)
    if date_from:
        q = q.filter(OutgoingReport6.reference_date >= date_from)
    if date_to:
        q = q.filter(OutgoingReport6.reference_date <= date_to)
    total = q.count()
    rows = q.order_by(OutgoingReport6.created_at.desc()).offset(skip).limit(limit).all()
    items = []
    for r in rows:
        items.append({
            "id": _safe_str(r.id),
            "reference_number": r.reference_number,
            "reference_date": _iso(r.reference_date),
            "subject": r.subject,
            "document_number": r.document_number,
            "document_date": _iso(r.document_date),
            "complaint_number": r.complaint_number,
            "position": {
                "id": _safe_str(getattr(r, "position_id", None)),
                "other_text": getattr(r, "position_other_text", None)
            },
            "department_name": r.department.name if r.department else "N/A",
            "signature_user_name": (f"{r.signature_authority_user.first_name} {r.signature_authority_user.last_name}" if r.signature_authority_user else None),
            "urgency_level": r.urgency_level,
            "created_at": _iso(r.created_at),
            "attachment_count": len(r.attachments),
        })
    return {"items": items, "total": total, "page": (skip // limit) + 1, "size": limit, "total_pages": (total + limit - 1) // limit}

def get_outgoing_report6_options(db: Session) -> Dict[str, Any]:
    deps = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
    users = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()
    return {
        "departments": [{"id": _safe_str(d.id), "name": d.name} for d in deps],
        "signature_authorities": [{"id": _safe_str(u.id), "name": f"{u.first_name} {u.last_name}"} for u in users],
        "users": [{"id": _safe_str(u.id), "name": f"{u.first_name} {u.last_name}"} for u in users],
        "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
        "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"],
    }

def update_outgoing_report6(
    db: Session,
    report_id: UUID,
    report_data: OutgoingReport6Update,
    current_user_id: UUID,
) -> Dict[str, Any]:
    try:
        rec = db.query(OutgoingReport6).filter(
            OutgoingReport6.id == report_id,
            OutgoingReport6.is_active == True
        ).first()
        if not rec:
            raise HTTPException(status_code=404, detail="ไม่พบรายการที่ระบุ")
        if report_data.document_number is not None and report_data.document_number != rec.document_number:
            dup = db.query(OutgoingReport6).filter(
                OutgoingReport6.document_number == report_data.document_number,
                OutgoingReport6.id != report_id,
                OutgoingReport6.is_active == True,
            ).first()
            if dup:
                raise DuplicateKeyError(f"เลขที่เอกสาร {report_data.document_number} มีอยู่แล้ว")
        if report_data.department_id is not None:
            dept = db.query(Department).filter(Department.id == report_data.department_id, Department.is_active == True).first()
            if not dept:
                raise HTTPException(status_code=404, detail="ไม่พบหน่วยงานที่ระบุ")
        if report_data.signature_authority_user_id is not None:
            sig = db.query(User).filter(User.id == report_data.signature_authority_user_id, User.is_active == True).first()
            if not sig:
                raise HTTPException(status_code=404, detail="ไม่พบผู้มีอำนาจลงนามที่ระบุ")
        if (report_data.complaint_id is not None) and (report_data.complaint_number is not None):
            c = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()
            if not c:
                raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")
            if c.complaint_number != report_data.complaint_number:
                raise HTTPException(status_code=400, detail="หมายเลขข้อร้องเรียนไม่ตรงกับข้อร้องเรียนที่เลือก")
        for field, value in report_data.model_dump(exclude_unset=True).items():
            setattr(rec, field, value)
        # position validation on update if changed
        if "position_id" in report_data.model_dump(exclude_unset=True):
            if getattr(report_data, "position_id", None):
                pos = db.query(Position).filter(Position.id == report_data.position_id, Position.is_active == True).first()
                if not pos:
                    raise HTTPException(status_code=400, detail="ไม่พบตำแหน่งที่เลือก")
                pos_name = getattr(pos, "name", "") or ""
                if pos_name in {"other", "others", "อื่นๆ", "อื่น ๆ"} and not getattr(report_data, "position_other_text", None):
                    raise HTTPException(status_code=400, detail="กรุณาระบุตำแหน่ง (อื่นๆ) เพิ่มเติม")
        rec.updated_by = current_user_id
        db.commit()
        db.refresh(rec)
        return get_outgoing_report6_by_id(db, rec.id)
    except DuplicateKeyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Update OutgoingReport6 error: {e}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def auto_fill_from_complaint6(db: Session, complaint_id: UUID) -> Dict[str, Any]:
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")
    return {
        "complaint_id": _safe_str(c.id),
        "complaint_number": c.complaint_number,
        "complaint_number_date": _iso(getattr(c, "created_at", None)),
        "subject": f"รับเรื่องรายงานผลการพิจารณาจากหน่วยงาน - {c.subject}",
    }

def add_attachments_to_outgoing_report6(
    db: Session,
    outgoing_report_id: UUID,
    files: List[UploadFile],
    current_user_id: UUID
) -> Dict[str, Any]:
    rec = db.query(OutgoingReport6).filter(OutgoingReport6.id == outgoing_report_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="ไม่พบรายการที่ระบุ")
    saved = []
    for f in files:
        info = save_upload_file(f, f"outgoing-reports6/{outgoing_report_id}")
        att = OutgoingReportAttachment6(
            outgoing_report_id=outgoing_report_id,
            file_name=info.get("filename") or f.filename,
            file_path=info.get("file_url"),
            file_type=info.get("file_type"),
            file_size=str(info.get("file_size")) if info.get("file_size") is not None else None,
            is_active=True,
        )
        db.add(att)
        db.flush()
        db.refresh(att)
        saved.append(att)
    db.commit()
    return {"outgoing_report_id": _safe_str(outgoing_report_id), "attachments": [_attachment_dict(a) for a in saved]}

def list_attachments_of_outgoing_report6(db: Session, outgoing_report_id: UUID) -> Dict[str, Any]:
    rows = (
        db.query(OutgoingReportAttachment6)
        .filter(
            OutgoingReportAttachment6.outgoing_report_id == outgoing_report_id,
            OutgoingReportAttachment6.is_active == True,
        )
        .order_by(OutgoingReportAttachment6.created_at.desc())
        .all()
    )
    return {"outgoing_report_id": _safe_str(outgoing_report_id), "attachments": [_attachment_dict(r) for r in rows]}

def get_outgoing_report6_attachment_fileinfo(
    db: Session, outgoing_report_id: UUID, attachment_id: UUID
) -> Tuple[str, str, str]:
    att = db.query(OutgoingReportAttachment6).filter(
        OutgoingReportAttachment6.id == attachment_id,
        OutgoingReportAttachment6.outgoing_report_id == outgoing_report_id,
        OutgoingReportAttachment6.is_active == True,
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์แนบที่ระบุ")
    file_path = getattr(att, "file_path", None)
    if not file_path:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์บนเซิร์ฟเวอร์")
    abs_path = file_path
    try:
        if isinstance(file_path, str) and file_path.startswith("/uploads/"):
            base_dir = get_storage_config().get("base_dir")
            # Normalize: strip leading slashes and backslashes, then join to base_dir
            rel = file_path[len("/uploads/"):].lstrip("/\\")
            abs_path = os.path.join(base_dir, rel)
    except Exception:
        pass
    if not os.path.isfile(abs_path):
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์บนเซิร์ฟเวอร์")
    filename = getattr(att, "file_name", None) or os.path.basename(file_path)
    media_type = getattr(att, "file_type", None) or "application/octet-stream"
    return abs_path, media_type, filename

def delete_outgoing_report6_attachment_by_id(
    db: Session,
    outgoing_report_id: UUID,
    attachment_id: UUID,
    hard_delete: bool = False
) -> Dict[str, Any]:
    att = db.query(OutgoingReportAttachment6).filter(
        OutgoingReportAttachment6.id == attachment_id,
        OutgoingReportAttachment6.outgoing_report_id == outgoing_report_id
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์แนบที่ระบุ")
    if hard_delete:
        try:
            abs_path = getattr(att, "file_path", None)
            fp = abs_path
            if isinstance(fp, str) and fp.startswith("/uploads/"):
                base_dir = get_storage_config().get("base_dir")
                # Normalize: strip leading slashes and backslashes, then join to base_dir
                rel = fp[len("/uploads/"):].lstrip("/\\")
                abs_path = os.path.join(base_dir, rel)
            if abs_path:
                delete_upload_file(abs_path)
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
