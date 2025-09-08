from __future__ import annotations

import os
from uuid import UUID, uuid4
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload, with_loader_criteria
from sqlalchemy import or_, func

from models.outgoing_reports2 import OutgoingReport2, OutgoingReportAttachment2
from lib.file_upload import get_storage_config, get_now_tz
from models.comp_complaint import Complaint, ComplaintStatus
from models.user import User
from models.position import Position
from models.departments import Department
from app.api.v1.schemas.outgoing_report2 import OutgoingReport2Create
from lib.logger import get_logger

logger = get_logger("outgoing_report2_controller")

# ======== Config พื้นฐานในการจัดเก็บไฟล์แนบ ========
BASE_UPLOAD_DIR = os.path.join("uploads", "outgoing-reports2")  # legacy local dir (not used for new saves)

class DuplicateKeyError(Exception):
    pass

# ------------------------- Utils -------------------------
def _safe_str(x):
    return str(x) if x is not None else None

def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None

def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

def _attachment_dict(att: OutgoingReportAttachment2) -> Dict[str, Any]:
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
    """Update complaint status if changed; always append status history with a note."""
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
        logger.warning(f"Could not update complaint status/log history (OR2): {e}")


# ------------------------- Core CRUD -------------------------
def create_outgoing_report2(
    db: Session,
    report_data: OutgoingReport2Create,
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None
) -> Dict[str, Any]:
    """สร้างรายงานแจ้งผู้ร้องเรียนใหม่"""
    try:
        logger.info(f"Creating OutgoingReport2: {report_data.complaint_number}")

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
        existing = db.query(OutgoingReport2).filter(
            OutgoingReport2.document_number == report_data.document_number,
            OutgoingReport2.is_active == True
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
                existing.user_id = report_data.user_id
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

                # ประวัติ: อัปเดตข้อมูลแบบรายงาน 2
                if report_data.complaint_id:
                    try:
                        complaint = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()
                        note = (
                            f"อัปเดตแบบรายงานแจ้งผู้ร้อง/หน่วยงานทราบเบื้องต้น | เอกสารเลขที่: {existing.document_number or '-'} | "
                            f"เรื่อง: {existing.subject or '-'}"
                        )
                        cur = getattr(complaint, "status", ComplaintStatus.IN_PROCESS)
                        _update_status_and_log(db, complaint, cur, note, current_user_id)
                    except Exception as e:
                        logger.warning(f"OR2 upsert history failed: {e}")

                return get_outgoing_report2_by_id(db, existing.id)
            else:
                raise DuplicateKeyError(f"เลขเอกสาร {report_data.document_number} มีอยู่แล้ว")

        # ตรวจสอบความสอดคล้องระหว่าง complaint_id และ complaint_number
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

        # สร้าง object ตาม model ที่ถูกต้อง
        db_report = OutgoingReport2(
            position_id=report_data.position_id,
            position_other_text=getattr(report_data, "position_other_text", None),
            complaint_number=report_data.complaint_number,
            complaint_number_date=report_data.complaint_number_date,
            subject=report_data.subject,
            signature_authority_user_id=report_data.signature_authority_user_id,
            department_id=report_data.department_id,
            user_id=report_data.user_id,
            confidentiality_level=report_data.confidentiality_level,
            urgency_level=report_data.urgency_level,
            document_number=report_data.document_number,
            document_date=report_data.document_date,
            remarks=report_data.remarks,
            complaint_id=report_data.complaint_id,
            created_by=current_user_id
        )

        db.add(db_report)
        db.flush()

        # แนบไฟล์ทันทีถ้ามี (optional)
        if files:
            _save_files_for_report(db, db_report.id, files)

        db.commit()

        # ✅ สถานะ/ประวัติ: แบบรายงาน 2 = แจ้งผู้ร้อง/หน่วยงานทราบเบื้องต้น → ดันสู่สถานะ In process (ถ้ายังไม่ถึง)
        if report_data.complaint_id:
            try:
                dept_name = None
                if getattr(db_report, "department", None):
                    dept_name = getattr(db_report.department, "name", None)
                note = (
                    f"สร้างแบบรายงานแจ้งผู้ร้อง/หน่วยงานทราบเบื้องต้น | เอกสารเลขที่: {db_report.document_number or '-'} | "
                    f"เรื่อง: {db_report.subject or '-'}"
                )
                # heuristic: ถ้ายังอยู่ Submitted/Sent to agency → set IN_PROCESS; มิฉะนั้น บันทึก history อย่างเดียว
                target = ComplaintStatus.IN_PROCESS
                if complaint and getattr(complaint, "status", None) in {ComplaintStatus.SUBMITTED, ComplaintStatus.SENT_TO_AGENCY, None}:
                    _update_status_and_log(db, complaint, target, note, current_user_id)
                else:
                    # preserve current status but log
                    cur = getattr(complaint, "status", ComplaintStatus.IN_PROCESS)
                    _update_status_and_log(db, complaint, cur, note, current_user_id)
            except Exception as e:
                logger.warning(f"OR2 post-create status/history failed: {e}")

        db.refresh(db_report)
        return get_outgoing_report2_by_id(db, db_report.id)

    except DuplicateKeyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating outgoing report2: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


def get_outgoing_report2_by_id(db: Session, report_id: UUID) -> Dict[str, Any]:
    """ดึงรายงานแจ้งผู้ร้องเรียนตาม ID (รวมไฟล์แนบ)"""
    try:
        report = db.query(OutgoingReport2).options(
            joinedload(OutgoingReport2.position),
            joinedload(OutgoingReport2.signature_authority_user),
            joinedload(OutgoingReport2.department),
            joinedload(OutgoingReport2.user),
            joinedload(OutgoingReport2.creator),
            joinedload(OutgoingReport2.complaint),
            joinedload(OutgoingReport2.attachments),
            with_loader_criteria(OutgoingReportAttachment2, OutgoingReportAttachment2.is_active == True, include_aliases=True),
        ).filter(
            OutgoingReport2.id == report_id,
            OutgoingReport2.is_active == True
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
            "user": {
                "id": _safe_str(report.user_id) if report.user_id else None,
                "name": f"{report.user.first_name} {report.user.last_name}" if report.user else "N/A",
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
            # attachments ถูกกรอง is_active ตั้งแต่ SELECT แล้ว
            "attachments": [_attachment_dict(att) for att in report.attachments],
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
) -> Dict[str, Any]:
    """ดึงรายการรายงานแจ้งผู้ร้องเรียน"""
    try:
        query = db.query(OutgoingReport2).options(
            joinedload(OutgoingReport2.position),
            joinedload(OutgoingReport2.signature_authority_user),
            joinedload(OutgoingReport2.department),
            joinedload(OutgoingReport2.user),
            joinedload(OutgoingReport2.complaint),
            joinedload(OutgoingReport2.attachments),
            with_loader_criteria(OutgoingReportAttachment2, OutgoingReportAttachment2.is_active == True, include_aliases=True),
        ).filter(OutgoingReport2.is_active == True)

        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    OutgoingReport2.complaint_number.ilike(like),
                    OutgoingReport2.subject.ilike(like),
                    OutgoingReport2.remarks.ilike(like),
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
        for r in reports:
            items.append({
                "id": _safe_str(r.id),
                "complaint_number": r.complaint_number,
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
        logger.error(f"Error getting outgoing reports2: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


def get_outgoing_report2_options(db: Session) -> Dict[str, Any]:
    """ดึงตัวเลือกสำหรับ dropdown"""
    try:
        positions = db.query(Position).filter(Position.is_active == True).order_by(Position.name).all()
        departments = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
        users = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()

        return {
            "positions": [{"id": _safe_str(pos.id), "name": pos.name} for pos in positions],
            "departments": [{"id": _safe_str(dept.id), "name": dept.name} for dept in departments],
            "users": [{"id": _safe_str(user.id), "name": f"{user.first_name} {user.last_name}"} for user in users],
            "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
            "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"],
        }

    except Exception as e:
        logger.error(f"Error getting options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


def auto_fill_from_complaint2(db: Session, complaint_id: UUID) -> Dict[str, Any]:
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")

        return {
            "complaint_id": _safe_str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "subject": complaint.subject,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto filling: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# ------------------------- Attachments (รุ่น 2) -------------------------
def _report_dir(report_id: UUID) -> str:
    # Keep for backward-compat where absolute paths were stored previously
    return os.path.join(BASE_UPLOAD_DIR, str(report_id))

def _save_files_for_report(db: Session, report_id: UUID, files: List[UploadFile]) -> List[OutgoingReportAttachment2]:
    """บันทึกไฟล์จริงลงดิสก์ + สร้างเรคอร์ดแนบ (จัดเก็บตามวันที่ YYYY/MM/DD)"""
    saved: List[OutgoingReportAttachment2] = []
    base_dir = get_storage_config().get("base_dir")

    now = get_now_tz()
    y = str(now.year)
    m = str(now.month).zfill(2)
    d = str(now.day).zfill(2)
    target_dir = os.path.join(base_dir, y, m, d, "outgoing-reports", str(report_id))
    _ensure_dir(target_dir)

    for f in files:
        filename = f.filename or "upload.bin"
        safe_name = os.path.basename(filename)
        unique_name = f"{uuid4().hex}_{safe_name}"
        file_path = os.path.join(target_dir, unique_name)

        # write in chunks to handle large files
        with open(file_path, "wb") as out:
            chunk = f.file.read(8192)
            while chunk:
                out.write(chunk)
                chunk = f.file.read(8192)

        file_size = None
        try:
            file_size = str(os.path.getsize(file_path))
        except Exception:
            file_size = None

        # Web-relative path for frontend and static serving
        rel_web = f"/uploads/{y}/{m}/{d}/outgoing-reports/{report_id}/{unique_name}"

        att = OutgoingReportAttachment2(
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


def add_attachments_to_outgoing_report2(
    db: Session,
    outgoing_report_id: UUID,
    files: List[UploadFile],
    current_user_id: UUID,
) -> Dict[str, Any]:
    """อัปโหลดหลายไฟล์ให้รายงาน (รุ่น 2)"""
    report = db.query(OutgoingReport2).filter(OutgoingReport2.id == outgoing_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ไม่พบรายงานส่งออกที่ระบุ")

    atts = _save_files_for_report(db, outgoing_report_id, files)
    db.commit()

    # ✅ ประวัติ: แนบเอกสารเพิ่มเติมให้แบบรายงาน 2
    try:
        complaint = None
        if getattr(report, "complaint_id", None):
            complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
        note = (
            f"แนบเอกสารเพิ่มเติม แบบรายงานแจ้งผู้ร้องเรียน / ส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น จำนวน {len(atts)} ไฟล์ | เอกสารเลขที่: {getattr(report, 'document_number', None) or '-'}"
        )
        cur = getattr(complaint, "status", ComplaintStatus.IN_PROCESS)
        _update_status_and_log(db, complaint, cur, note, current_user_id)
    except Exception as e:
        logger.warning(f"OR2 attach history failed: {e}")

    return {
        "outgoing_report_id": _safe_str(outgoing_report_id),
        "attachments": [_attachment_dict(att) for att in atts],
    }


def list_attachments_of_outgoing_report2(db: Session, outgoing_report_id: UUID) -> Dict[str, Any]:
    q = db.query(OutgoingReportAttachment2).filter(
        OutgoingReportAttachment2.outgoing_report_id == outgoing_report_id
    )
    if hasattr(OutgoingReportAttachment2, "is_active"):
        q = q.filter(OutgoingReportAttachment2.is_active == True)

    if hasattr(OutgoingReportAttachment2, "created_at"):
        q = q.order_by(OutgoingReportAttachment2.created_at.desc())

    rows = q.all()
    return {
        "outgoing_report_id": _safe_str(outgoing_report_id),
        "attachments": [_attachment_dict(r) for r in rows],
    }


def get_outgoing_report2_attachment_fileinfo(
    db: Session, outgoing_report_id: UUID, attachment_id: UUID
) -> Tuple[str, str, str]:
    att = db.query(OutgoingReportAttachment2).filter(
        OutgoingReportAttachment2.id == attachment_id,
        OutgoingReportAttachment2.outgoing_report_id == outgoing_report_id,
        OutgoingReportAttachment2.is_active == True if hasattr(OutgoingReportAttachment2, "is_active") else True,
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์แนบที่ระบุ")

    if hasattr(att, "is_active") and not getattr(att, "is_active"):
        raise HTTPException(status_code=404, detail="ไฟล์แนบนี้ถูกลบออกจากการแสดงผลแล้ว")

    file_path = getattr(att, "file_path", None)
    if not file_path:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์บนเซิร์ฟเวอร์")

    # Map web path to absolute if needed
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


def delete_outgoing_report2_attachment_by_id(
    db: Session,
    outgoing_report_id: UUID,
    attachment_id: UUID,
    hard_delete: bool = False,
) -> Dict[str, Any]:
    att = db.query(OutgoingReportAttachment2).filter(
        OutgoingReportAttachment2.id == attachment_id,
        OutgoingReportAttachment2.outgoing_report_id == outgoing_report_id,
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์แนบที่ระบุ")

    # hard delete: ลบทั้ง record + ลบไฟล์จริง
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
            report = db.query(OutgoingReport2).filter(OutgoingReport2.id == outgoing_report_id).first()
            complaint = None
            if report and getattr(report, "complaint_id", None):
                complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
            note = (
                f"ลบไฟล์แนบแบบถาวร แบบรายงานแจ้งผู้ร้องเรียน / ส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น | เอกสารเลขที่: {getattr(report, 'document_number', None) or '-'} | ไฟล์: {getattr(att, 'file_name', None) or '-'}"
            )
            cur = getattr(complaint, "status", ComplaintStatus.IN_PROCESS)
            _update_status_and_log(db, complaint, cur, note, current_user_id=None)
        except Exception as e:
            logger.warning(f"OR2 delete attach history failed: {e}")
        return {"code": "0003", "message": "ลบไฟล์แนบ (hard delete) เรียบร้อย", "attachment_id": _safe_str(attachment_id)}

    # soft delete: ตีธง is_active = False ถ้ามีคอลัมน์นี้ในโมเดล
    if hasattr(att, "is_active"):
        att.is_active = False
        db.commit()
        # ✅ ประวัติ
        try:
            report = db.query(OutgoingReport2).filter(OutgoingReport2.id == outgoing_report_id).first()
            complaint = None
            if report and getattr(report, "complaint_id", None):
                complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
            note = (
                f"ลบไฟล์แนบ (soft delete) แบบรายงานแจ้งผู้ร้องเรียน / ส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น | เอกสารเลขที่: {getattr(report, 'document_number', None) or '-'} | ไฟล์: {getattr(att, 'file_name', None) or '-'}"
            )
            cur = getattr(complaint, "status", ComplaintStatus.IN_PROCESS)
            _update_status_and_log(db, complaint, cur, note, current_user_id=None)
        except Exception as e:
            logger.warning(f"OR2 delete attach history failed: {e}")
        return {"code": "0001", "message": "ลบไฟล์แนบเรียบร้อย (soft delete)", "attachment_id": _safe_str(attachment_id)}

    # fallback: ไม่มี is_active → ลบ record
    db.delete(att)
    db.commit()
    # ✅ ประวัติ
    try:
        report = db.query(OutgoingReport2).filter(OutgoingReport2.id == outgoing_report_id).first()
        complaint = None
        if report and getattr(report, "complaint_id", None):
            complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
        note = (
            f"ลบเรคอร์ดไฟล์แนบ แบบรายงานแจ้งผู้ร้องเรียน / ส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น | เอกสารเลขที่: {getattr(report, 'document_number', None) or '-'} | ไฟล์: {getattr(att, 'file_name', None) or '-'}"
        )
        cur = getattr(complaint, "status", ComplaintStatus.IN_PROCESS)
        _update_status_and_log(db, complaint, cur, note, current_user_id=None)
    except Exception as e:
        logger.warning(f"OR2 delete attach history failed: {e}")
    return {"code": "0003", "message": "ลบเรคอร์ดไฟล์แนบ (no is_active field)", "attachment_id": _safe_str(attachment_id)}