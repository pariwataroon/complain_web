from __future__ import annotations

import os
from uuid import UUID, uuid4
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload, with_loader_criteria
from sqlalchemy import or_

from models.outgoing_reports3 import OutgoingReport3, OutgoingReportAttachment3
from lib.file_upload import get_storage_config, get_now_tz
from models.comp_complaint import Complaint, ComplaintStatus
from models.user import User
from models.position import Position
from models.departments import Department
from app.api.v1.schemas.outgoing_report3 import OutgoingReport3Create, OutgoingReport3Update
from lib.logger import get_logger

logger = get_logger("outgoing_report3_controller")

# ========= ที่เก็บไฟล์แนบ (ปรับตามโครงโปรเจคคุณได้) =========
BASE_UPLOAD_DIR = os.path.join("uploads", "outgoing-reports3")


class DuplicateKeyError(Exception):
    pass


# ------------------------- Utils -------------------------
def _safe_str(x):
    return str(x) if x is not None else None

def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None

def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

def _attachment_dict(att: OutgoingReportAttachment3) -> Dict[str, Any]:
    return {
        "id": _safe_str(att.id),
        "file_name": getattr(att, "file_name", None),
        "file_size": getattr(att, "file_size", None),
        "file_type": getattr(att, "file_type", None),
        "created_at": _iso(getattr(att, "created_at", None)),
    }


# ------------------------- Complaint status/history helpers -------------------------
def _update_status_and_log(
    db: Session,
    complaint: Optional[Complaint],
    target_status: ComplaintStatus,
    notes: str,
    user_id: Optional[UUID] = None,
) -> None:
    if not complaint:
        return
    try:
        from app.api.v1.controllers.complaint_controller import (
            update_complaint_status,
            create_status_history,
        )

        current = getattr(complaint, "status", None)
        if current != target_status:
            update_complaint_status(db, complaint.id, target_status, notes, user_id)
        else:
            create_status_history(db, complaint.id, target_status, notes, user_id)
    except Exception as e:
        logger.warning(f"Could not update complaint status/log history (OR3): {e}")


# ------------------------- Core CRUD -------------------------
def create_outgoing_report3(
    db: Session,
    report_data: OutgoingReport3Create,
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None,
) -> Dict[str, Any]:
    """สร้างรายงานขอทราบผลการพิจารณาใหม่"""
    try:
        logger.info(f"Creating OutgoingReport3: {report_data.complaint_number}")

        # ตรวจสอบตำแหน่ง และกรณีเลือก "อื่นๆ" ต้องระบุ position_other_text
        position = db.query(Position).filter(Position.id == report_data.position_id, Position.is_active == True).first()
        if not position:
            raise HTTPException(status_code=404, detail="ไม่พบตำแหน่งที่ระบุ")
        try:
            pos_name = (position.name or "").strip().lower()
            if pos_name in {"อื่นๆ", "อื่น ๆ", "other", "others"} and not getattr(report_data, "position_other_text", None):
                raise HTTPException(status_code=400, detail="กรุณาระบุ 'ตำแหน่งอื่นๆ' เมื่อเลือกตำแหน่งเป็น 'อื่นๆ'")
        except AttributeError:
            pass

        # ตรวจสอบ document_number ซ้ำ (แทน complaint_number เพราะเรื่องเดียวกันอาจส่งหลายหน่วย)
        existing = db.query(OutgoingReport3).filter(
            OutgoingReport3.document_number == report_data.document_number,
            OutgoingReport3.is_active == True
        ).first()
        if existing:
            # Upsert: อัปเดตเมื่อ complaint_number ซ้ำ, ถ้าไม่ซ้ำถือว่า conflict
            if (existing.complaint_number or "") == (report_data.complaint_number or ""):
                existing.position_id = report_data.position_id
                if hasattr(existing, "position_other_text"):
                    existing.position_other_text = getattr(report_data, "position_other_text", None)
                existing.complaint_number = report_data.complaint_number
                existing.complaint_number_date = report_data.complaint_number_date
                existing.subject = report_data.subject
                existing.signature_authority_user_id = report_data.signature_authority_user_id
                existing.department_id = report_data.department_id
                existing.confidentiality_level = report_data.confidentiality_level
                existing.urgency_level = report_data.urgency_level
                existing.document_number = report_data.document_number
                existing.document_date = report_data.document_date
                existing.remarks = report_data.remarks
                existing.complaint_id = report_data.complaint_id
                existing.updated_by = current_user_id

                db.flush()

                # แนบไฟล์เพิ่มเติมถ้ามี
                if files:
                    _save_files_for_report(db, existing.id, files)

                db.commit()

                # ประวัติ: อัปเดตข้อมูลแบบรายงาน 3
                if report_data.complaint_id:
                    try:
                        complaint = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()
                        note = (
                            f"อัปเดตแบบรายงานขอทราบผล/ความคืบหน้า | เอกสารเลขที่: {existing.document_number or '-'} | "
                            f"เรื่อง: {existing.subject or '-'}"
                        )
                        cur = getattr(complaint, "status", ComplaintStatus.TRACKING)
                        _update_status_and_log(db, complaint, cur, note, current_user_id)
                    except Exception as e:
                        logger.warning(f"OR3 upsert history failed: {e}")

                return get_outgoing_report3_by_id(db, existing.id)
            else:
                raise DuplicateKeyError(f"เลขเอกสาร {report_data.document_number} มีอยู่แล้ว")

        # ตรวจสอบความสอดคล้อง complaint_id ↔ complaint_number
        if report_data.complaint_id:
            complaint = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()
            if not complaint:
                raise HTTPException(status_code=400, detail="ไม่พบข้อร้องเรียนที่ระบุ")
            if complaint.complaint_number != report_data.complaint_number:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"หมายเลขข้อร้องเรียน '{report_data.complaint_number}' "
                        f"ไม่ตรงกับข้อร้องเรียน ID ที่ระบุ (ควรเป็น '{complaint.complaint_number}')"
                    ),
                )

        db_report = OutgoingReport3(
            position_id=report_data.position_id,
            position_other_text=getattr(report_data, "position_other_text", None),
            complaint_number=report_data.complaint_number,
            complaint_number_date=report_data.complaint_number_date,
            subject=report_data.subject,
            signature_authority_user_id=report_data.signature_authority_user_id,
            department_id=report_data.department_id,
            confidentiality_level=report_data.confidentiality_level,
            urgency_level=report_data.urgency_level,
            document_number=report_data.document_number,
            document_date=report_data.document_date,
            remarks=report_data.remarks,
            complaint_id=report_data.complaint_id,
            created_by=current_user_id,
        )

        db.add(db_report)
        db.flush()

        # แนบไฟล์ทันทีถ้ามี (optional)
        if files:
            _save_files_for_report(db, db_report.id, files)

        db.commit()

        # ✅ OR3: ขอทราบผล/ความคืบหน้า → แนะนำสถานะ TRACKING
        if report_data.complaint_id:
            try:
                complaint = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()
                note = (
                    f"สร้างแบบรายงานขอทราบผล/ความคืบหน้า | เอกสารเลขที่: {db_report.document_number or '-'} | "
                    f"เรื่อง: {db_report.subject or '-'}"
                )
                _update_status_and_log(db, complaint, ComplaintStatus.TRACKING, note, current_user_id)
            except Exception as e:
                logger.warning(f"OR3 post-create status/history failed: {e}")

        db.refresh(db_report)
        return get_outgoing_report3_by_id(db, db_report.id)

    except DuplicateKeyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating outgoing report3: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


def get_outgoing_report3_by_id(db: Session, report_id: UUID) -> Dict[str, Any]:
    """ดึงรายงานขอทราบผลการพิจารณาตาม ID (รวมไฟล์แนบ)"""
    try:
        report = db.query(OutgoingReport3).options(
            joinedload(OutgoingReport3.position),
            joinedload(OutgoingReport3.signature_authority_user),
            joinedload(OutgoingReport3.department),
            joinedload(OutgoingReport3.creator),
            joinedload(OutgoingReport3.complaint),
            joinedload(OutgoingReport3.attachments),
            with_loader_criteria(OutgoingReportAttachment3, OutgoingReportAttachment3.is_active == True, include_aliases=True),
        ).filter(
            OutgoingReport3.id == report_id,
            OutgoingReport3.is_active == True
        ).first()

        if not report:
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")

        return {
            "id": _safe_str(report.id),
            "position": {
                "id": _safe_str(report.position_id),
                "name": report.position.name if report.position else "N/A",
            },
            "position_other_text": getattr(report, "position_other_text", None),
            "complaint_number": report.complaint_number,
            "complaint_number_date": _iso(report.complaint_number_date),
            "subject": report.subject,
            "document_number": report.document_number,
            "document_date": _iso(report.document_date),
            "department": {
                "id": _safe_str(report.department_id) if report.department_id else None,
                "name": report.department.name if report.department else "N/A",
            },
            "signature_authority_user": {
                "id": _safe_str(report.signature_authority_user_id),
                "name": (
                    f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}"
                    if report.signature_authority_user else "N/A"
                ),
            },
            "confidentiality_level": report.confidentiality_level,
            "urgency_level": report.urgency_level,
            "remarks": report.remarks,
            "complaint_id": _safe_str(report.complaint_id) if report.complaint_id else None,
            "created_at": _iso(report.created_at),
            "created_by": _safe_str(report.created_by),
            "creator_name": (
                f"{report.creator.first_name} {report.creator.last_name}" if report.creator else "N/A"
            ),
            # กรอง attachments ตั้งแต่ SELECT แล้ว
            "attachments": [_attachment_dict(att) for att in report.attachments],
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
    date_to: Optional[datetime] = None,
) -> Dict[str, Any]:
    """ดึงรายการรายงานขอทราบผลการพิจารณา"""
    try:
        q = db.query(OutgoingReport3).options(
            joinedload(OutgoingReport3.position),
            joinedload(OutgoingReport3.signature_authority_user),
            joinedload(OutgoingReport3.department),
            joinedload(OutgoingReport3.complaint),
            joinedload(OutgoingReport3.attachments),
            with_loader_criteria(OutgoingReportAttachment3, OutgoingReportAttachment3.is_active == True, include_aliases=True),
        ).filter(OutgoingReport3.is_active == True)

        if search:
            like = f"%{search}%"
            q = q.filter(or_(
                OutgoingReport3.complaint_number.ilike(like),
                OutgoingReport3.subject.ilike(like),
                OutgoingReport3.remarks.ilike(like),
            ))

        if position_id:
            q = q.filter(OutgoingReport3.position_id == position_id)
        if department_id:
            q = q.filter(OutgoingReport3.department_id == department_id)
        if signature_authority_user_id:
            q = q.filter(OutgoingReport3.signature_authority_user_id == signature_authority_user_id)
        if urgency_level:
            q = q.filter(OutgoingReport3.urgency_level == urgency_level)
        if date_from:
            q = q.filter(OutgoingReport3.complaint_number_date >= date_from)
        if date_to:
            q = q.filter(OutgoingReport3.complaint_number_date <= date_to)

        total = q.count()
        rows = q.order_by(OutgoingReport3.created_at.desc()).offset(skip).limit(limit).all()

        items = []
        for r in rows:
            items.append({
                "id": _safe_str(r.id),
                "complaint_number": r.complaint_number,
                "complaint_number_date": _iso(r.complaint_number_date),
                "subject": r.subject,
                "document_number": r.document_number,
                "document_date": _iso(r.document_date),
                "position_name": r.position.name if r.position else "N/A",
                "position_other_text": getattr(r, "position_other_text", None),
                "department_name": r.department.name if r.department else "N/A",
                "signature_user_name": (
                    f"{r.signature_authority_user.first_name} {r.signature_authority_user.last_name}"
                    if r.signature_authority_user else "N/A"
                ),
                "urgency_level": r.urgency_level,
                "confidentiality_level": r.confidentiality_level,
                "created_at": _iso(r.created_at),
                "attachment_count": len(r.attachments),
            })
        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1,
            "size": limit,
            "total_pages": (total + limit - 1) // limit,
        }

    except Exception as e:
        logger.error(f"Error getting outgoing reports3: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")
def get_outgoing_report3_options(db: Session) -> Dict[str, Any]:
    """ดึงตัวเลือกสำหรับ dropdown"""
    try:
        positions = db.query(Position).filter(Position.is_active == True).order_by(Position.name).all()
        departments = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
        signature_authorities = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()

        return {
            "positions": [{"id": _safe_str(pos.id), "name": pos.name} for pos in positions],
            "departments": [{"id": _safe_str(dept.id), "name": dept.name} for dept in departments],
            "signature_authorities": [{"id": _safe_str(u.id), "name": f"{u.first_name} {u.last_name}"} for u in signature_authorities],
            "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
            "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"],
        }

    except Exception as e:
        logger.error(f"Error getting options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


def auto_fill_from_complaint3(db: Session, complaint_id: UUID) -> Dict[str, Any]:
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")

        return {
            "complaint_id": _safe_str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "complaint_number_date": _iso(getattr(complaint, "created_at", None)),
            "subject": f"ขอทราบผลการพิจารณา - {complaint.subject}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto filling: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# ------------------------- Attachments (รุ่น 3) -------------------------
def _report_dir(report_id: UUID) -> str:
    return os.path.join(BASE_UPLOAD_DIR, str(report_id))

def _save_files_for_report(db: Session, report_id: UUID, files: List[UploadFile]) -> List[OutgoingReportAttachment3]:
    """บันทึกไฟล์จริงลงดิสก์ + สร้างเรคอร์ดแนบ (sanitize ชื่อและ unique เสมอ)"""
    saved: List[OutgoingReportAttachment3] = []
    base_dir = get_storage_config().get("base_dir")
    
    now = get_now_tz()
    y = str(now.year)
    m = str(now.month).zfill(2)
    d = str(now.day).zfill(2)
    target_dir = os.path.join(base_dir, y, m, d, "outgoing-reports", str(report_id))
    _ensure_dir(target_dir)

    for f in files:
        raw_name = f.filename or "upload.bin"
        safe_name = os.path.basename(raw_name)              # กัน path traversal
        unique_name = f"{uuid4().hex}_{safe_name}"         # กันชื่อชนกัน
        file_path = os.path.join(target_dir, unique_name)

        # เขียนไฟล์แบบ chunked
        with open(file_path, "wb") as out:
            chunk = f.file.read(8192)
            while chunk:
                out.write(chunk)
                chunk = f.file.read(8192)

        file_size = None
        try:
            file_size = str(os.path.getsize(file_path))
        except Exception:
            pass

        # derive web-relative (date-based)
        rel_web = f"/uploads/{y}/{m}/{d}/outgoing-reports/{report_id}/{unique_name}"

        att = OutgoingReportAttachment3(
            outgoing_report_id=report_id,
            file_name=unique_name,
            file_path=rel_web,
            file_size=file_size,
            file_type=getattr(f, "content_type", None),
            is_active=True,
        )
        db.add(att)
        db.flush()
        db.refresh(att)
        saved.append(att)

    return saved


def add_attachments_to_outgoing_report3(
    db: Session,
    outgoing_report_id: UUID,
    files: List[UploadFile],
    current_user_id: UUID,
) -> Dict[str, Any]:
    """อัปโหลดหลายไฟล์ให้รายงาน (รุ่น 3)"""
    report = db.query(OutgoingReport3).filter(OutgoingReport3.id == outgoing_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ไม่พบรายงานส่งออกที่ระบุ")

    atts = _save_files_for_report(db, outgoing_report_id, files)
    db.commit()

    # ✅ ประวัติ: แนบเอกสารเพิ่มเติม (รุ่น 3)
    try:
        complaint = None
        if getattr(report, "complaint_id", None):
            complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
        note = (
            f"แนบเอกสารเพิ่มเติม แบบรายงานขอทราบผลการพิจารณา / ผลความคืบหน้า จำนวน {len(atts)} ไฟล์ | เอกสารเลขที่: {getattr(report, 'document_number', None) or '-'}"
        )
        cur = getattr(complaint, "status", ComplaintStatus.TRACKING)
        _update_status_and_log(db, complaint, cur, note, current_user_id)
    except Exception as e:
        logger.warning(f"OR3 attach history failed: {e}")

    return {
        "outgoing_report_id": _safe_str(outgoing_report_id),
        "attachments": [_attachment_dict(att) for att in atts],
    }


def list_attachments_of_outgoing_report3(db: Session, outgoing_report_id: UUID) -> Dict[str, Any]:
    q = db.query(OutgoingReportAttachment3).filter(
        OutgoingReportAttachment3.outgoing_report_id == outgoing_report_id
    )
    if hasattr(OutgoingReportAttachment3, "is_active"):
        q = q.filter(OutgoingReportAttachment3.is_active == True)

    if hasattr(OutgoingReportAttachment3, "created_at"):
        q = q.order_by(OutgoingReportAttachment3.created_at.desc())

    rows = q.all()
    return {
        "outgoing_report_id": _safe_str(outgoing_report_id),
        "attachments": [_attachment_dict(r) for r in rows],
    }


def get_outgoing_report3_attachment_fileinfo(
    db: Session, outgoing_report_id: UUID, attachment_id: UUID
) -> Tuple[str, str, str]:
    att = db.query(OutgoingReportAttachment3).filter(
        OutgoingReportAttachment3.id == attachment_id,
        OutgoingReportAttachment3.outgoing_report_id == outgoing_report_id,
        OutgoingReportAttachment3.is_active == True if hasattr(OutgoingReportAttachment3, "is_active") else True,
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์แนบที่ระบุ")

    if hasattr(att, "is_active") and not getattr(att, "is_active"):
        raise HTTPException(status_code=404, detail="ไฟล์แนบนี้ถูกลบออกจากการแสดงผลแล้ว")

    file_path = getattr(att, "file_path", None)
    if not file_path:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์บนเซิร์ฟเวอร์")

    abs_path = file_path
    try:
        if isinstance(file_path, str) and file_path.startswith("/uploads/"):
            base_dir = get_storage_config().get("base_dir")
            rel = file_path[len("/uploads/"):].lstrip("/\\")
            abs_path = os.path.join(base_dir, rel)
    except Exception:
        pass
    if not os.path.isfile(abs_path):
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์บนเซิร์ฟเวอร์")

    filename = getattr(att, "file_name", None) or os.path.basename(file_path)
    media_type = getattr(att, "file_type", None) or "application/octet-stream"
    return abs_path, media_type, filename


def delete_outgoing_report3_attachment_by_id(
    db: Session,
    outgoing_report_id: UUID,
    attachment_id: UUID,
    hard_delete: bool = False,
) -> Dict[str, Any]:
    att = db.query(OutgoingReportAttachment3).filter(
        OutgoingReportAttachment3.id == attachment_id,
        OutgoingReportAttachment3.outgoing_report_id == outgoing_report_id,
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์แนบที่ระบุ")

    # hard delete (ลบไฟล์จริง + ลบเรคอร์ด)
    if hard_delete:
        file_path = getattr(att, "file_path", None)
        abs_path = file_path
        try:
            if isinstance(file_path, str) and file_path.startswith("/uploads/"):
                base_dir = get_storage_config().get("base_dir")
                rel = file_path[len("/uploads/"):].lstrip("/\\")
                abs_path = os.path.join(base_dir, rel)
        except Exception:
            pass
        try:
            if abs_path and os.path.isfile(abs_path):
                os.remove(abs_path)
        except Exception:
            pass
        db.delete(att)
        db.commit()
        # ✅ ประวัติ
        try:
            report = db.query(OutgoingReport3).filter(OutgoingReport3.id == outgoing_report_id).first()
            complaint = None
            if report and getattr(report, "complaint_id", None):
                complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
            note = (
                f"ลบไฟล์แนบแบบถาวร แบบรายงานขอทราบผลการพิจารณา / ผลความคืบหน้า | เอกสารเลขที่: {getattr(report, 'document_number', None) or '-'} | ไฟล์: {getattr(att, 'file_name', None) or '-'}"
            )
            cur = getattr(complaint, "status", ComplaintStatus.TRACKING)
            _update_status_and_log(db, complaint, cur, note, user_id=None)
        except Exception as e:
            logger.warning(f"OR3 delete attach history failed: {e}")
        return {"code": "0003", "message": "ลบไฟล์แนบ (hard delete) เรียบร้อย", "attachment_id": _safe_str(attachment_id)}

    # soft delete (is_active = False) ถ้ามี field
    if hasattr(att, "is_active"):
        att.is_active = False
        db.commit()
        # ✅ ประวัติ
        try:
            report = db.query(OutgoingReport3).filter(OutgoingReport3.id == outgoing_report_id).first()
            complaint = None
            if report and getattr(report, "complaint_id", None):
                complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
            note = (
                f"ลบไฟล์แนบ (soft delete) แบบรายงานขอทราบผลการพิจารณา / ผลความคืบหน้า | เอกสารเลขที่: {getattr(report, 'document_number', None) or '-'} | ไฟล์: {getattr(att, 'file_name', None) or '-'}"
            )
            cur = getattr(complaint, "status", ComplaintStatus.TRACKING)
            _update_status_and_log(db, complaint, cur, note, user_id=None)
        except Exception as e:
            logger.warning(f"OR3 delete attach history failed: {e}")
        return {"code": "0001", "message": "ลบไฟล์แนบเรียบร้อย (soft delete)", "attachment_id": _safe_str(attachment_id)}

    # fallback: ไม่มี is_active → ลบเรคอร์ด
    db.delete(att)
    db.commit()
    # ✅ ประวัติ
    try:
        report = db.query(OutgoingReport3).filter(OutgoingReport3.id == outgoing_report_id).first()
        complaint = None
        if report and getattr(report, "complaint_id", None):
            complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
        note = (
            f"ลบเรคอร์ดไฟล์แนบ แบบรายงานขอทราบผลการพิจารณา / ผลความคืบหน้า | เอกสารเลขที่: {getattr(report, 'document_number', None) or '-'} | ไฟล์: {getattr(att, 'file_name', None) or '-'}"
        )
        cur = getattr(complaint, "status", ComplaintStatus.TRACKING)
        _update_status_and_log(db, complaint, cur, note, user_id=None)
    except Exception as e:
        logger.warning(f"OR3 delete attach history failed: {e}")
    return {"code": "0003", "message": "ลบเรคอร์ดไฟล์แนบ", "attachment_id": _safe_str(attachment_id)}