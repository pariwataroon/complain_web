from __future__ import annotations

import os
from uuid import UUID, uuid4
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload, with_loader_criteria
from sqlalchemy import or_

from models.outgoing_reports4 import OutgoingReport4, OutgoingReportAttachment4
from lib.file_upload import get_storage_config, get_now_tz
from models.comp_complaint import Complaint, ComplaintStatus
from models.user import User
from models.departments import Department  # legacy internal (kept for backward compatibility)
from models.outside_departments import OutsideDepartment
from app.api.v1.schemas.outgoing_report4 import OutgoingReport4Create, OutgoingReport4Update
from lib.logger import get_logger

logger = get_logger("outgoing_report4_controller")

# ปรับ path ได้ตามโครงโปรเจค
BASE_UPLOAD_DIR = os.path.join("uploads", "outgoing-reports4")


class DuplicateKeyError(Exception):
    pass


# ------------------------- Utils -------------------------
def _safe_str(x):
    return str(x) if x is not None else None

def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None

def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

def _attachment_dict(att: OutgoingReportAttachment4) -> Dict[str, Any]:
    return {
        "id": _safe_str(att.id),
        "file_name": getattr(att, "file_name", None),
        "file_size": getattr(att, "file_size", None),
        "file_type": getattr(att, "file_type", None),
        "created_at": _iso(getattr(att, "created_at", None)),
    }

def _map_consideration_to_status(s: str) -> ComplaintStatus:
    if not s:
        return ComplaintStatus.REVIEWED

    t = str(s).strip()
    if t in {"ทราบ", "ทราบไว้ชั้นหนึ่ง"}:
        return ComplaintStatus.REVIEWED
    if t in {"ยุติเรื่องได้"}:
        return ComplaintStatus.COMPLETED
    if t in {"เห็นชอบ"}:
        return ComplaintStatus.COMPLETED
        # return getattr(ComplaintStatus, "APPROVED", ComplaintStatus.REVIEWED)
    if t in {"อยู่ระหว่างดำเนินการ"}:
        return ComplaintStatus.REVIEWED
        # return getattr(ComplaintStatus, "IN_PROGRESS", getattr(ComplaintStatus, "TRACKING", ComplaintStatus.REVIEWED))

    # fallback
    return ComplaintStatus.REVIEWED

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
        logger.warning(f"Could not update complaint status/log history (OR4): {e}")


# ------------------------- Core CRUD -------------------------
def create_outgoing_report4(
    db: Session,
    report_data: OutgoingReport4Create,
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None
) -> Dict[str, Any]:
    """สร้างรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบใหม่ (OR4)
       - reference_number: ซ้ำได้
       - document_number: ห้ามซ้ำ (ถ้าซ้ำให้ใช้ PUT แก้ของเดิม)
    """
    try:
        logger.info(f"Creating OutgoingReport4: {report_data.reference_number}")

        # ❗ บังคับเอกลักษณ์ document_number (ทั่วระบบที่ยัง active)
        dup_doc = (
            db.query(OutgoingReport4)
            .filter(
                OutgoingReport4.is_active == True,
                OutgoingReport4.document_number == report_data.document_number,
            )
            .first()
        )
        if dup_doc:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"document_number '{report_data.document_number}' ถูกใช้แล้ว "
                    f"กรุณาใช้วิธี PUT เพื่อแก้ไขรายงานเดิม (id={dup_doc.id})"
                ),
            )

        # complaint_id ไม่บังคับ แต่ถ้าส่งมาก็ตรวจว่ามีจริง
        complaint = None
        if report_data.complaint_id:
            complaint = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()
            if not complaint:
                raise HTTPException(status_code=400, detail="ไม่พบข้อร้องเรียนที่ระบุ")

        # ตรวจสอบ position (optional)
        if getattr(report_data, "position_id", None):
            from models.position import Position
            position_obj = db.query(Position).filter(
                Position.id == report_data.position_id,
                Position.is_active == True
            ).first()
            if not position_obj:
                raise HTTPException(status_code=400, detail="ไม่พบตำแหน่งที่เลือก")
            pos_name = getattr(position_obj, "name", "") or ""
            if pos_name in {"อื่นๆ", "อื่น ๆ", "other", "others"} and not getattr(report_data, "position_other_text", None):
                raise HTTPException(status_code=400, detail="กรุณาระบุตำแหน่ง (อื่นๆ) เพิ่มเติม")

        # Validate outside vs legacy ids (ต้องเลือกอย่างใดอย่างหนึ่ง)
        if report_data.department_id and report_data.outside_department_id:
            raise HTTPException(status_code=400, detail="กรุณาส่ง department_id หรือ outside_department_id อย่างใดอย่างหนึ่ง ไม่ใช่ทั้งคู่")

        if report_data.outside_department_id:
            od = db.query(OutsideDepartment).filter(
                OutsideDepartment.id == report_data.outside_department_id,
                OutsideDepartment.is_active == True
            ).first()
            if not od:
                raise HTTPException(status_code=404, detail="ไม่พบหน่วยงานภายนอกที่ระบุ")

        effective_outside_id = report_data.outside_department_id
        legacy_department_id = report_data.department_id

        db_report = OutgoingReport4(
            reference_number=report_data.reference_number,
            reference_date=report_data.reference_date,
            subject=report_data.subject,
            complaint_number=report_data.complaint_number,
            complaint_number_date=report_data.complaint_number_date,
            signature_authority_user_id=report_data.signature_authority_user_id,
            department_id=legacy_department_id,  # ไม่ mirror
            outside_department_id=effective_outside_id,
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
            created_by=current_user_id,
            position_id=getattr(report_data, "position_id", None),
            position_other_text=getattr(report_data, "position_other_text", None),
        )

        db.add(db_report)
        db.flush()

        # แนบไฟล์ทันทีถ้ามี (optional)
        if files:
            _save_files_for_report(db, db_report.id, files)

        db.commit()

        # 🔁 บันทึกประวัติ + อัปเดตสถานะตาม consideration_result
        if complaint:
            try:
                note = (
                    f"สร้างแบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ | อ้างอิง: {db_report.reference_number or '-'} | "
                    f"เรื่อง: {db_report.subject or '-'} | ผลพิจารณา: {report_data.consideration_result or '-'}"
                )
                target = _map_consideration_to_status(report_data.consideration_result)
                _update_status_and_log(db, complaint, target, note, current_user_id)
            except Exception as e:
                logger.warning(f"OR4 post-create status/history failed: {e}")

        db.refresh(db_report)
        return get_outgoing_report4_by_id(db, db_report.id)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating outgoing report4: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report4_by_id(db: Session, report_id: UUID) -> Dict[str, Any]:
    """ดึงรายงานตาม ID (รวมไฟล์แนบ)"""
    try:
        report = db.query(OutgoingReport4).options(
            joinedload(OutgoingReport4.signature_authority_user),
            joinedload(OutgoingReport4.department),  # legacy
            joinedload(OutgoingReport4.outside_department),
            joinedload(OutgoingReport4.user),
            joinedload(OutgoingReport4.creator),
            joinedload(OutgoingReport4.complaint),
            joinedload(OutgoingReport4.attachments),
            with_loader_criteria(OutgoingReportAttachment4, OutgoingReportAttachment4.is_active == True, include_aliases=True),
        ).filter(
            OutgoingReport4.id == report_id,
            OutgoingReport4.is_active == True
        ).first()

        if not report:
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")

        if getattr(report, 'outside_department', None):
            outside_department_payload = {
                'id': _safe_str(getattr(report.outside_department, 'id', None)),
                'name': getattr(report.outside_department, 'name', None)
            }
        elif getattr(report, 'department', None):
            outside_department_payload = {
                'id': _safe_str(getattr(report.department, 'id', None)),
                'name': getattr(report.department, 'name', None)
            }
        else:
            outside_department_payload = None

        return {
            "id": _safe_str(report.id),
            "position": {
                "id": _safe_str(report.position_id) if hasattr(report, "position_id") else None,
                "other_text": getattr(report, "position_other_text", None)
            },
            "reference_number": report.reference_number,
            "reference_date": _iso(report.reference_date),
            "subject": report.subject,
            "complaint_number": report.complaint_number,
            "complaint_number_date": _iso(report.complaint_number_date),
            "document_number": report.document_number,
            "document_date": _iso(report.document_date),
            "signature_authority_user": {
                "id": _safe_str(report.signature_authority_user_id),
                "name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}"
                if report.signature_authority_user else "N/A",
            },
            "department": outside_department_payload,  # backward compatible key
            "outside_department": outside_department_payload,
            "user": {
                "id": _safe_str(report.user_id) if report.user_id else None,
                "name": f"{report.user.first_name} {report.user.last_name}" if report.user else "N/A",
            },
            "other_department": report.other_department,
            "confidentiality_level": report.confidentiality_level,
            "urgency_level": report.urgency_level,
            "remarks": report.remarks,
            "proposal_purpose": report.proposal_purpose,
            "consideration_result": report.consideration_result,
            "complaint_id": _safe_str(report.complaint_id) if report.complaint_id else None,
            "created_at": _iso(report.created_at),
            "creator_name": f"{report.creator.first_name} {report.creator.last_name}" if report.creator else "N/A",
            # กรองตั้งแต่ SELECT แล้ว
            "attachments": [_attachment_dict(att) for att in report.attachments],
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
    department_id: Optional[UUID] = None,  # legacy
    outside_department_id: Optional[UUID] = None,
    signature_authority_user_id: Optional[UUID] = None,
    urgency_level: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> Dict[str, Any]:
    """ดึงรายการรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ"""
    try:
        query = db.query(OutgoingReport4).options(
            joinedload(OutgoingReport4.signature_authority_user),
            joinedload(OutgoingReport4.department),  # legacy
            joinedload(OutgoingReport4.outside_department),
            joinedload(OutgoingReport4.user),
            joinedload(OutgoingReport4.complaint),
            joinedload(OutgoingReport4.attachments),
            with_loader_criteria(OutgoingReportAttachment4, OutgoingReportAttachment4.is_active == True, include_aliases=True),
        ).filter(OutgoingReport4.is_active == True)

        if search:
            like = f"%{search}%"
            query = query.filter(or_(
                OutgoingReport4.reference_number.ilike(like),
                OutgoingReport4.subject.ilike(like),
                OutgoingReport4.remarks.ilike(like),
                OutgoingReport4.other_department.ilike(like),
            ))

        if outside_department_id:
            query = query.filter(OutgoingReport4.outside_department_id == outside_department_id)
        elif department_id:
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
        for r in reports:
            dept_name = None
            if getattr(r, 'outside_department', None):
                dept_name = getattr(r.outside_department, 'name', None)
            elif getattr(r, 'department', None):
                dept_name = getattr(r.department, 'name', None)
            else:
                dept_name = r.other_department
            items.append({
                "id": _safe_str(r.id),
                "position": {
                    "id": _safe_str(r.position_id) if hasattr(r, "position_id") else None,
                    "other_text": getattr(r, "position_other_text", None)
                },
                "reference_number": r.reference_number,
                "reference_date": _iso(r.reference_date),
                "subject": r.subject,
                "complaint_number": r.complaint_number,
                "complaint_number_date": _iso(r.complaint_number_date),
                "document_number": r.document_number,
                "document_date": _iso(r.document_date),
                "department_name": dept_name or "N/A",
                "signature_user_name": (
                    f"{r.signature_authority_user.first_name} {r.signature_authority_user.last_name}"
                    if r.signature_authority_user else "N/A"
                ),
                "urgency_level": r.urgency_level,
                "proposal_purpose": r.proposal_purpose,
                "consideration_result": r.consideration_result,
                "created_at": _safe_str(_iso(r.created_at)),
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
        logger.error(f"Error getting outgoing reports4: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


def get_outgoing_report4_options(db: Session) -> Dict[str, Any]:
    """ดึงตัวเลือกสำหรับ dropdown"""
    try:
        # NOTE: Front-end now sends IDs from outside_departments for OutgoingReport4 as well.
        # Provide list under both outside_departments and departments keys during transition.
        outside_departments = db.query(OutsideDepartment).filter(OutsideDepartment.is_active == True).order_by(OutsideDepartment.name).all()
        users = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()

        return {
            "outside_departments": [{"id": _safe_str(dept.id), "name": dept.name} for dept in outside_departments],
            "departments": [{"id": _safe_str(dept.id), "name": dept.name} for dept in outside_departments],  # transitional alias
            "signature_authorities": [{"id": _safe_str(u.id), "name": f"{u.first_name} {u.last_name}"} for u in users],
            "users": [{"id": _safe_str(u.id), "name": f"{u.first_name} {u.last_name}"} for u in users],
            "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
            "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"],
        }

    except Exception as e:
        logger.error(f"Error getting options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


def auto_fill_from_complaint4(db: Session, complaint_id: UUID) -> Dict[str, Any]:
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")

        return {
            "complaint_id": _safe_str(complaint.id),
            "subject": f"แจ้งผลการให้ผู้เกี่ยวข้องทราบ - {complaint.subject}",
            "reference_number": f"อ้างอิง-{getattr(complaint, 'complaint_number', '')}".strip("-"),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto filling: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# ------------------------- Attachments (รุ่น 4) -------------------------
def _report_dir(report_id: UUID) -> str:
    return os.path.join(BASE_UPLOAD_DIR, str(report_id))

def _save_files_for_report(db: Session, report_id: UUID, files: List[UploadFile]) -> List[OutgoingReportAttachment4]:
    """บันทึกไฟล์ลงดิสก์ + สร้างเรคอร์ดแนบ (sanitize + unique name; จัดเก็บตามวันที่ YYYY/MM/DD)"""
    saved: List[OutgoingReportAttachment4] = []
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

        att = OutgoingReportAttachment4(
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


def add_attachments_to_outgoing_report4(
    db: Session,
    outgoing_report_id: UUID,
    files: List[UploadFile],
    current_user_id: UUID,
) -> Dict[str, Any]:
    """อัปโหลดหลายไฟล์ให้รายงาน (รุ่น 4)"""
    report = db.query(OutgoingReport4).filter(OutgoingReport4.id == outgoing_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ไม่พบรายงานส่งออกที่ระบุ")

    atts = _save_files_for_report(db, outgoing_report_id, files)
    db.commit()

    # ✅ ประวัติ: แนบเอกสารเพิ่มเติม (รุ่น 4)
    try:
        complaint = None
        if getattr(report, "complaint_id", None):
            complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
        note = (
            f"แนบเอกสารเพิ่มเติม แบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ จำนวน {len(atts)} ไฟล์ | อ้างอิง: {getattr(report, 'reference_number', None) or '-'}"
        )
        cur = getattr(complaint, "status", ComplaintStatus.REVIEWED)
        _update_status_and_log(db, complaint, cur, note, current_user_id)
    except Exception as e:
        logger.warning(f"OR4 attach history failed: {e}")

    return {
        "outgoing_report_id": _safe_str(outgoing_report_id),
        "attachments": [_attachment_dict(att) for att in atts],
    }


def list_attachments_of_outgoing_report4(db: Session, outgoing_report_id: UUID) -> Dict[str, Any]:
    q = db.query(OutgoingReportAttachment4).filter(
        OutgoingReportAttachment4.outgoing_report_id == outgoing_report_id
    )
    if hasattr(OutgoingReportAttachment4, "is_active"):
        q = q.filter(OutgoingReportAttachment4.is_active == True)

    if hasattr(OutgoingReportAttachment4, "created_at"):
        q = q.order_by(OutgoingReportAttachment4.created_at.desc())

    rows = q.all()
    return {
        "outgoing_report_id": _safe_str(outgoing_report_id),
        "attachments": [_attachment_dict(r) for r in rows],
    }


def get_outgoing_report4_attachment_fileinfo(
    db: Session, outgoing_report_id: UUID, attachment_id: UUID
) -> Tuple[str, str, str]:
    att = db.query(OutgoingReportAttachment4).filter(
        OutgoingReportAttachment4.id == attachment_id,
        OutgoingReportAttachment4.outgoing_report_id == outgoing_report_id,
        OutgoingReportAttachment4.is_active == True if hasattr(OutgoingReportAttachment4, "is_active") else True,
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


def delete_outgoing_report4_attachment_by_id(
    db: Session,
    outgoing_report_id: UUID,
    attachment_id: UUID,
    hard_delete: bool = False,
) -> Dict[str, Any]:
    att = db.query(OutgoingReportAttachment4).filter(
        OutgoingReportAttachment4.id == attachment_id,
        OutgoingReportAttachment4.outgoing_report_id == outgoing_report_id,
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
            report = db.query(OutgoingReport4).filter(OutgoingReport4.id == outgoing_report_id).first()
            complaint = None
            if report and getattr(report, "complaint_id", None):
                complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
            note = (
                f"ลบไฟล์แนบแบบถาวร แบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ | อ้างอิง: {getattr(report, 'reference_number', None) or '-'} | ไฟล์: {getattr(att, 'file_name', None) or '-'}"
            )
            cur = getattr(complaint, "status", ComplaintStatus.REVIEWED)
            _update_status_and_log(db, complaint, cur, note, user_id=None)
        except Exception as e:
            logger.warning(f"OR4 delete attach history failed: {e}")
        return {"code": "0003", "message": "ลบไฟล์แนบ (hard delete) เรียบร้อย", "attachment_id": _safe_str(attachment_id)}

    # soft delete
    if hasattr(att, "is_active"):
        att.is_active = False
        db.commit()
        # ✅ ประวัติ
        try:
            report = db.query(OutgoingReport4).filter(OutgoingReport4.id == outgoing_report_id).first()
            complaint = None
            if report and getattr(report, "complaint_id", None):
                complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
            note = (
                f"ลบไฟล์แนบ (soft delete) แบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ | อ้างอิง: {getattr(report, 'reference_number', None) or '-'} | ไฟล์: {getattr(att, 'file_name', None) or '-'}"
            )
            cur = getattr(complaint, "status", ComplaintStatus.REVIEWED)
            _update_status_and_log(db, complaint, cur, note, user_id=None)
        except Exception as e:
            logger.warning(f"OR4 delete attach history failed: {e}")
        return {"code": "0001", "message": "ลบไฟล์แนบเรียบร้อย (soft delete)", "attachment_id": _safe_str(attachment_id)}

    # fallback: ไม่มี is_active → ลบเรคอร์ด
    db.delete(att)
    db.commit()
    # ✅ ประวัติ
    try:
        report = db.query(OutgoingReport4).filter(OutgoingReport4.id == outgoing_report_id).first()
        complaint = None
        if report and getattr(report, "complaint_id", None):
            complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
        note = (
            f"ลบเรคอร์ดไฟล์แนบ แบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ | อ้างอิง: {getattr(report, 'reference_number', None) or '-'} | ไฟล์: {getattr(att, 'file_name', None) or '-'}"
        )
        cur = getattr(complaint, "status", ComplaintStatus.REVIEWED)
        _update_status_and_log(db, complaint, cur, note, user_id=None)
    except Exception as e:
        logger.warning(f"OR4 delete attach history failed: {e}")
    return {"code": "0003", "message": "ลบเรคอร์ดไฟล์แนบ", "attachment_id": _safe_str(attachment_id)}


# ------------------------- Update -------------------------
def update_outgoing_report4(
    db: Session,
    report_id: UUID,
    report_data: OutgoingReport4Update,
    current_user_id: UUID,
) -> Dict[str, Any]:
    """อัปเดตรายงาน (รุ่น 4) ตาม ID
       - เปลี่ยน document_number ได้ แต่ต้องไม่ชนกับเรคอร์ด active อื่น
    """
    try:
        rec = db.query(OutgoingReport4).filter(
            OutgoingReport4.id == report_id,
            OutgoingReport4.is_active == True
        ).first()
        if not rec:
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")

        # กันเลขเอกสารซ้ำ ถ้ามีการเปลี่ยน
        incoming = report_data.model_dump(exclude_unset=True)
        if "document_number" in incoming and incoming["document_number"] != rec.document_number:
            dup = db.query(OutgoingReport4).filter(
                OutgoingReport4.is_active == True,
                OutgoingReport4.document_number == incoming["document_number"],
                OutgoingReport4.id != report_id,
            ).first()
            if dup:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"document_number '{incoming['document_number']}' ถูกใช้แล้ว "
                        f"ไม่สามารถแก้ไขให้ซ้ำกับเอกสารอื่นได้ (ชน id={dup.id})"
                    ),
                )

        # ถ้าส่ง complaint_id มา ตรวจว่ามีจริง
        if report_data.complaint_id is not None:
            complaint = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()
            if not complaint:
                raise HTTPException(status_code=400, detail="ไม่พบข้อร้องเรียนที่ระบุ")

        # ไม่ให้ส่ง department_id + outside_department_id พร้อมกัน (และถ้าต่างกันให้ error)
        if (
            incoming.get("department_id")
            and incoming.get("outside_department_id")
            and incoming.get("department_id") != incoming.get("outside_department_id")
        ):
            raise HTTPException(status_code=400, detail="กรุณาอัปเดต department_id หรือ outside_department_id อย่างใดอย่างหนึ่ง ไม่ใช่ทั้งคู่")

        # validate outside_department_id ถ้ามี
        if incoming.get("outside_department_id"):
            od = db.query(OutsideDepartment).filter(
                OutsideDepartment.id == incoming["outside_department_id"],
                OutsideDepartment.is_active == True,
            ).first()
            if not od:
                raise HTTPException(status_code=404, detail="ไม่พบหน่วยงานภายนอกที่ระบุ")

        # อัปเดตฟิลด์
        for field, value in incoming.items():
            setattr(rec, field, value)

        # ตรวจสอบตำแหน่งถ้ามีการอัปเดต
        if "position_id" in incoming:
            if getattr(report_data, "position_id", None):
                from models.position import Position
                pos = db.query(Position).filter(Position.id == report_data.position_id, Position.is_active == True).first()
                if not pos:
                    raise HTTPException(status_code=400, detail="ไม่พบตำแหน่งที่เลือก")
                pos_name = getattr(pos, "name", "") or ""
                if pos_name in {"อื่นๆ", "อื่น ๆ", "other", "others"} and not getattr(report_data, "position_other_text", None):
                    raise HTTPException(status_code=400, detail="กรุณาระบุตำแหน่ง (อื่นๆ) เพิ่มเติม")

        rec.updated_by = current_user_id
        db.commit()
        db.refresh(rec)

        # 🔁 บันทึกประวัติ + อัปเดตสถานะตาม consideration_result (เวอร์ชันหลังแก้)
        try:
            if rec.complaint_id:
                complaint = db.query(Complaint).filter(Complaint.id == rec.complaint_id).first()
                if complaint:
                    note = (
                        f"แก้ไขรายงานรุ่น 4 | เอกสารเลขที่: {rec.document_number or '-'} | "
                        f"เรื่อง: {rec.subject or '-'} | ผลพิจารณา: {rec.consideration_result or '-'}"
                    )
                    target = _map_consideration_to_status(rec.consideration_result)
                    _update_status_and_log(db, complaint, target, note, current_user_id)
        except Exception as e:
            logger.warning(f"OR4 post-update status/history failed: {e}")

        return get_outgoing_report4_by_id(db, rec.id)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating outgoing report4: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

# ------------------------- Delete (soft) -------------------------
def delete_outgoing_report4(db: Session, report_id: UUID, current_user_id: UUID) -> Dict[str, Any]:
    """ลบรายงานรุ่น 4 (soft delete)"""
    try:
        report = db.query(OutgoingReport4).filter(
            OutgoingReport4.id == report_id,
            OutgoingReport4.is_active == True
        ).first()
        if not report:
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")

        report.is_active = False
        if hasattr(report, "updated_by"):
            report.updated_by = current_user_id

        for att in getattr(report, "attachments", []) or []:
            if hasattr(att, "is_active"):
                att.is_active = False

        db.commit()

        # ✅ ประวัติ
        try:
            complaint = None
            if getattr(report, "complaint_id", None):
                complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
            if complaint:
                note = (
                    f"ยกเลิกรายงานรุ่น 4 (soft delete) | เอกสารเลขที่: {report.document_number or '-'} | เรื่อง: {report.subject or '-'}"
                )
                cur = getattr(complaint, "status", ComplaintStatus.REVIEWED) or ComplaintStatus.REVIEWED
                _update_status_and_log(db, complaint, cur, note, current_user_id)
        except Exception as e:
            logger.warning(f"OR4 delete history failed: {e}")

        return {"id": str(report_id), "message": "ลบรายงานรุ่น 4 เรียบร้อยแล้ว"}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting outgoing report4: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")