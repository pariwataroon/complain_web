import traceback
from datetime import datetime
from sqlalchemy.orm import Session, joinedload, with_loader_criteria
from sqlalchemy import or_, func
from uuid import UUID
from typing import Dict, Any, Optional, List, Tuple, Union
from fastapi import HTTPException, UploadFile
import os

from models.outgoing_reports import OutgoingReport, OutgoingReportAttachment
from models.comp_complaint import Complaint, ComplaintStatus
from models.user import User
from models.position import Position
from models.departments import Department
from app.api.v1.schemas.outgoing_report import OutgoingReportCreate, OutgoingReportUpdate
from lib.logger import get_logger
from lib.file_upload import save_upload_file, delete_upload_file, get_storage_config

logger = get_logger("outgoing_report_controller")


class DuplicateKeyError(Exception):
    pass


# =========================
# Helpers
# =========================
def _set_if_has(obj, **kwargs):
    """ตั้งค่าเฉพาะฟิลด์ที่โมเดลมีจริง เพื่อกัน schema ต่างกันระหว่าง env"""
    for k, v in kwargs.items():
        if hasattr(obj, k):
            setattr(obj, k, v)


def _attachment_dict(att):
    """แปลง attachment model เป็น dict แบบปลอดภัย"""
    return {
        "attachment_id": str(getattr(att, "id", None)) if getattr(att, "id", None) else None,
        "fileName": getattr(att, "file_name", None),
        "fileUrl": getattr(att, "file_url", None),   # ถ้า schema ไม่มีคอลัมน์นี้จะเป็น None
        "filePath": getattr(att, "file_path", None),
        "fileType": getattr(att, "file_type", None),
        "fileSize": getattr(att, "file_size", None),
        "created_at": getattr(att, "created_at", None).isoformat() if getattr(att, "created_at", None) else None,
    }


def _get_officer_full_name(user: User) -> Optional[str]:
    """ดึงชื่อเจ้าหน้าที่พร้อมคำนำหน้า"""
    if not user:
        logger.debug(f"_get_officer_full_name: user is None")
        return None

    try:
        prefix = ""
        # ใช้ title.short_name ถ้ามี
        if hasattr(user, 'title') and user.title and hasattr(user.title, 'short_name'):
            prefix = user.title.short_name or ""
            logger.debug(f"_get_officer_full_name: using title.short_name = {prefix}")
        # ถ้าไม่มี title แต่มี prefix_other (กรณีเลือก "อื่นๆ")
        elif hasattr(user, 'prefix_other') and user.prefix_other:
            prefix = user.prefix_other
            logger.debug(f"_get_officer_full_name: using prefix_other = {prefix}")
        else:
            logger.debug(f"_get_officer_full_name: no prefix found, user.title={user.title if hasattr(user, 'title') else 'N/A'}")

        first_name = getattr(user, 'first_name', '') or ''
        last_name = getattr(user, 'last_name', '') or ''

        full_name = f"{prefix} {first_name} {last_name}".strip()
        logger.debug(f"_get_officer_full_name: result = {full_name}")
        return full_name if full_name else None
    except Exception as e:
        logger.error(f"Error getting officer full name: {e}")
        return None


# =========================
# Complaint status/history helpers
# =========================
def _update_status_and_log(
    db: Session,
    complaint: Optional[Complaint],
    target_status: ComplaintStatus,
    notes: str,
    user_id: Optional[UUID] = None,
) -> None:
    """อัปเดตสถานะข้อร้องเรียน (ถ้าจำเป็น) และบันทึกประวัติสถานะพร้อมหมายเหตุ

    - ถ้าสถานะปัจจุบันไม่ใช่ target_status: ใช้ update_complaint_status() เพื่อเปลี่ยนสถานะและสร้าง history
    - ถ้าสถานะปัจจุบันเท่ากับ target_status: บันทึก history เพิ่มด้วยสถานะเดิม (create_status_history)
    """
    if not complaint:
        return
    try:
        # import แบบภายในฟังก์ชันเพื่อหลีกเลี่ยงวงจรการ import
        from app.api.v1.controllers.complaint_controller import (
            update_complaint_status,
            create_status_history,
        )

        current = getattr(complaint, "status", None)
        if current != target_status:
            update_complaint_status(db, complaint.id, target_status, notes, user_id)
        else:
            # สถานะเดิมเหมือนเดิม → แค่เพิ่มประวัติให้ครบถ้วน
            create_status_history(db, complaint.id, target_status, notes, user_id)
    except Exception as e:
        logger.warning(f"Could not update complaint status/log history: {e}")


# =========================
# Create
# =========================
async def create_outgoing_report(
    db: Session,
    report_data: Union[OutgoingReportCreate, dict],
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None
) -> Dict:
    """สร้างรายงานส่งออกใหม่ (async)"""
    if isinstance(report_data, dict):
        report_data = OutgoingReportCreate(**report_data)

    db_report = None
    try:
        logger.info("=== START CREATE OUTGOING REPORT ===")
        logger.info(f"Report data: {report_data}")
        logger.info(f"Current user ID: {current_user_id} (type: {type(current_user_id)})")

    # อนุญาตให้ reference_number ซ้ำได้ (อ้างอิงเรื่องเดียวกันได้หลายครั้ง)
    # เดิมมีการตรวจซ้ำแบบ global ซึ่งขัดกับกติกางาน จึงตัดออก
    # หากต้องการ uniqueness แบบจำเพาะ ให้ไปกำหนดใน DB หรือปรับเงื่อนไขให้แคบลง (เช่น ต่อ complaint_id)

        # validate foreign keys หลัก ๆ
        position = db.query(Position).filter(Position.id == report_data.position_id, Position.is_active == True).first()
        if not position:
            raise HTTPException(status_code=404, detail="ไม่พบตำแหน่งที่ระบุ")
        # ถ้าเลือกตำแหน่งเป็น "อื่นๆ" บังคับให้กรอก position_other_text
        try:
            pos_name = (position.name or "").strip().lower()
            if pos_name in {"อื่นๆ", "อื่น ๆ", "other", "others"} and not getattr(report_data, "position_other_text", None):
                raise HTTPException(status_code=400, detail="กรุณาระบุ 'ตำแหน่งอื่นๆ' เมื่อเลือกตำแหน่งเป็น 'อื่นๆ'")
        except AttributeError:
            pass

        signature_user = db.query(User).filter(User.id == report_data.signature_authority_user_id, User.is_active == True).first()
        if not signature_user:
            raise HTTPException(status_code=404, detail="ไม่พบผู้มีอำนาจลงนามที่ระบุ")

        # ✅ รองรับทั้ง Department (ภายใน) และ OutsideDepartment (ภายนอก)
        department = None
        try:
            from models.outside_departments import OutsideDepartment
            # ลองหาใน OutsideDepartment ก่อน (ระบบใหม่)
            department = db.query(OutsideDepartment).filter(
                OutsideDepartment.id == report_data.department_id,
                OutsideDepartment.is_active == True
            ).first()
        except Exception:
            pass

        # ถ้าไม่เจอ ลองหาใน Department (ระบบเก่า)
        if not department:
            department = db.query(Department).filter(
                Department.id == report_data.department_id,
                Department.is_active == True
            ).first()

        if not department:
            raise HTTPException(status_code=404, detail="ไม่พบหน่วยงานที่ระบุ")

        complaint = None
        if report_data.complaint_id:
            complaint = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()

        # หากมีเรคอร์ดเดิมที่ document_number + complaint_number ซ้ำ ให้ "อัปเดต" แทนการสร้างใหม่
        existing_doc = (
            db.query(OutgoingReport)
            .filter(
                OutgoingReport.document_number == report_data.document_number,
                OutgoingReport.is_active == True,
            )
            .first()
        )
        if existing_doc:
            if (existing_doc.complaint_number or "") == (report_data.complaint_number or ""):
                # อัปเดตข้อมูลเดิม
                existing_doc.position_id = report_data.position_id
                if hasattr(existing_doc, "position_other_text"):
                    existing_doc.position_other_text = getattr(report_data, "position_other_text", None)
                existing_doc.reference_number = report_data.reference_number
                existing_doc.reference_date = report_data.reference_date
                existing_doc.subject = report_data.subject
                existing_doc.complaint_number = report_data.complaint_number
                existing_doc.complaint_number_date = report_data.complaint_number_date
                existing_doc.signature_authority_user_id = report_data.signature_authority_user_id
                existing_doc.department_id = report_data.department_id
                existing_doc.confidentiality_level = report_data.confidentiality_level
                existing_doc.urgency_level = report_data.urgency_level
                existing_doc.document_number = report_data.document_number
                existing_doc.document_date = report_data.document_date
                existing_doc.remarks = report_data.remarks
                existing_doc.complaint_id = report_data.complaint_id
                existing_doc.updated_by = current_user_id

                db.flush()

                # แนบไฟล์เพิ่ม (ถ้ามี)
                attachment_list: List[OutgoingReportAttachment] = []
                if files:
                    for file in files:
                        try:
                            info = await save_upload_file(file, f"outgoing-reports/{str(existing_doc.id)}")
                            att = OutgoingReportAttachment()
                            _set_if_has(
                                att,
                                outgoing_report_id=existing_doc.id,
                                file_name=info.get("filename") or file.filename,
                                file_path=info.get("file_url"),
                                file_size=str(info.get("file_size")) if info.get("file_size") is not None else None,
                                file_type=info.get("file_type"),
                                is_active=True,
                            )
                            if hasattr(att, "file_url"):
                                att.file_url = info.get("file_url")
                            db.add(att)
                            db.flush()
                            db.refresh(att)
                            attachment_list.append(att)
                        except Exception as e:
                            logger.warning(f"Could not save file {getattr(file, 'filename', '?')}: {e}")

                db.commit()

                # บันทึกประวัติ: อัปเดตข้อมูลหนังสือส่งออก
                if complaint:
                    try:
                        dept_name = department.name if department else None
                        note = (
                            f"อัปเดตข้อมูลหนังสือส่งออกถึงหน่วยงาน: {dept_name or '-'} | "
                            f"เลขอ้างอิง: {existing_doc.reference_number or '-'} | "
                            f"เรื่อง: {existing_doc.subject or '-'}"
                        )
                        current_status = getattr(complaint, "status", ComplaintStatus.SENT_TO_EXTERNAL) or ComplaintStatus.SENT_TO_EXTERNAL
                        _update_status_and_log(db, complaint, current_status, note, current_user_id)
                    except Exception as e:
                        logger.warning(f"Could not update complaint history after upsert (v1): {e}")

                db.refresh(existing_doc)
                return get_outgoing_report_by_id(db, existing_doc.id)
            else:
                # document_number ซ้ำ แต่คนละ complaint_number → ถือว่าผิดพลาด
                raise DuplicateKeyError(f"เลขที่เอกสาร {report_data.document_number} มีอยู่แล้ว")

        # สร้าง OutgoingReport ใหม่
        db_report = OutgoingReport(
            position_id=report_data.position_id,
            position_other_text=getattr(report_data, "position_other_text", None),
            reference_number=report_data.reference_number,
            reference_date=report_data.reference_date,
            subject=report_data.subject,
            complaint_number=report_data.complaint_number,
            complaint_number_date=report_data.complaint_number_date,
            signature_authority_user_id=report_data.signature_authority_user_id,
            department_id=report_data.department_id,
            confidentiality_level=report_data.confidentiality_level,
            urgency_level=report_data.urgency_level,
            document_number=report_data.document_number,
            document_date=report_data.document_date,
            remarks=report_data.remarks,
            complaint_id=report_data.complaint_id,
            created_by=current_user_id
        )
        db.add(db_report)
        db.flush()  # ได้ id

        # แนบไฟล์ (ถ้ามี) — ใช้ helper เดียวกับ /attachments ให้ path/metadata สอดคล้องกัน
        attachment_list: List[OutgoingReportAttachment] = []
        if files:
            for i, file in enumerate(files):
                try:
                    info = await save_upload_file(file, f"outgoing-reports/{str(db_report.id)}")
                    att = OutgoingReportAttachment()
                    _set_if_has(
                        att,
                        outgoing_report_id=db_report.id,
                        file_name=info.get("filename") or file.filename,
                        # store web-relative path for frontend usage
                        file_path=info.get("file_url"),
                        file_size=str(info.get("file_size")) if info.get("file_size") is not None else None,
                        file_type=info.get("file_type"),
                        is_active=True
                    )
                    # ถ้า schema ของคุณมีคอลัมน์ file_url ค่อย set เพิ่ม
                    if hasattr(att, "file_url"):
                        att.file_url = info.get("file_url")

                    db.add(att)
                    db.flush()
                    db.refresh(att)
                    attachment_list.append(att)
                except Exception as e:
                    logger.warning(f"Could not save file {getattr(file, 'filename', '?')}: {e}")

        db.commit()

    # ✅ อัปเดตสถานะ + บันทึกประวัติ เมื่อมีการสร้างหนังสือส่งออก
        if complaint:
            try:
                dept_name = department.name if department else None
                note = (
                    f"สร้างหนังสือส่งออกถึงหน่วยงาน: {dept_name or '-'} | "
                    f"เลขอ้างอิง: {db_report.reference_number or '-'} | "
                    f"เรื่อง: {db_report.subject or '-'}"
                )
                _update_status_and_log(
                    db,
                    complaint,
                    ComplaintStatus.SENT_TO_EXTERNAL,
                    note,
                    current_user_id,
                )
            except Exception as e:
                logger.warning(f"Could not update complaint status/history after creating outgoing report: {e}")
        
        # refresh หลัก ๆ
        db.refresh(db_report)

        # สร้าง response
        result = {
            "id": str(db_report.id),
            "position": {
                "id": str(position.id),
                "name": position.name,
                "level": position.level,
                "description": position.description
            },
            "position_other_text": getattr(db_report, "position_other_text", None),
            "reference_number": db_report.reference_number,
            "reference_date": db_report.reference_date.isoformat() if db_report.reference_date else None,
            "subject": db_report.subject,
            "complaint_number": db_report.complaint_number,
            "complaint_number_date": db_report.complaint_number_date.isoformat() if db_report.complaint_number_date else None,
            "signature_authority_user": {
                "id": str(signature_user.id),
                "name": f"{signature_user.first_name} {signature_user.last_name}".strip(),
                "email": signature_user.email if signature_user.email else "N/A"
            },
            "department": {
                "id": str(department.id),
                "name": department.name,
                "code": department.code,
                "short_name": department.short_name
            },
            "confidentiality_level": db_report.confidentiality_level,
            "urgency_level": db_report.urgency_level,
            "remarks": db_report.remarks,
            "related_complaint": {
                "id": str(complaint.id),
                "complaint_number": complaint.complaint_number,
                "subject": complaint.subject,
                "status": complaint.status.value if hasattr(complaint, 'status') and complaint.status else None
            } if complaint else None,
            "complaint_id": str(db_report.complaint_id) if db_report.complaint_id else None,
            "created_at": db_report.created_at.isoformat() if db_report.created_at else None,
            "updated_at": db_report.updated_at.isoformat() if db_report.updated_at else None,
            "attachments": [
                {
                    "id": str(att.id),
                    "file_name": att.file_name,
                    "file_size": att.file_size,
                    "file_type": att.file_type,
                    "created_at": att.created_at.isoformat() if getattr(att, "created_at", None) else None
                } for att in attachment_list
            ],
            "attachment_count": len(attachment_list),
            "message": "สร้างรายงานส่งออกเรียบร้อยแล้ว"
        }
        logger.info("=== END CREATE OUTGOING REPORT (SUCCESS) ===")
        return result

    except DuplicateKeyError:
        db.rollback()
        raise HTTPException(status_code=400, detail="เลขที่เอกสารซ้ำกับข้อมูลอื่น")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"UNEXPECTED ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# =========================
# Read (by id)
# =========================
def get_outgoing_report_by_id(db: Session, report_id: UUID) -> Dict:
    """ดึงรายงานส่งออกตาม ID"""
    try:
        report = db.query(OutgoingReport).options(
            joinedload(OutgoingReport.position),
            joinedload(OutgoingReport.signature_authority_user),
            joinedload(OutgoingReport.department),
            joinedload(OutgoingReport.creator),
            joinedload(OutgoingReport.updater),
            joinedload(OutgoingReport.complaint),
            joinedload(OutgoingReport.attachments),
            # กรอง attachments ตั้งแต่ตอน SELECT ให้ได้เฉพาะแถวที่ is_active
            with_loader_criteria(OutgoingReportAttachment, OutgoingReportAttachment.is_active == True, include_aliases=True)
        ).filter(
            OutgoingReport.id == report_id,
            OutgoingReport.is_active == True
        ).first()

        if not report:
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")

        response_data = {
            "id": str(report.id),
            "position": {
                "id": str(report.position_id),
                "name": report.position.name if report.position else "N/A",
                "level": report.position.level if report.position else None,
                "description": report.position.description if report.position else None
            },
            "position_other_text": getattr(report, "position_other_text", None),
            "reference_number": report.reference_number,
            "reference_date": report.reference_date.isoformat() if report.reference_date else None,
            "subject": report.subject,
            "document_number": report.document_number,
            "document_date": report.document_date.isoformat() if report.document_date else None,
            "complaint_number": report.complaint_number,
            "complaint_number_date": report.complaint_number_date.isoformat() if report.complaint_number_date else None,
            "signature_authority_user": {
                "id": str(report.signature_authority_user_id),
                "name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else "N/A",
                "email": report.signature_authority_user.email if report.signature_authority_user else "N/A"
            },
            "department": {
                "id": str(report.department_id),
                "name": report.department.name if report.department else "N/A",
                "code": report.department.code if report.department else "N/A",
                "short_name": report.department.short_name if report.department else "N/A"
            },
            "confidentiality_level": report.confidentiality_level,
            "urgency_level": report.urgency_level,
            "remarks": report.remarks,
            "complaint_id": str(report.complaint_id) if report.complaint_id else None,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "updated_at": report.updated_at.isoformat() if report.updated_at else None,
            "creator": {
                "id": str(report.creator.id) if report.creator else None,
                "name": f"{report.creator.first_name} {report.creator.last_name}" if report.creator else "N/A",
                "email": report.creator.email if report.creator else "N/A"
            },
            "updater": {
                "id": str(report.updater.id) if report.updater else None,
                "name": f"{report.updater.first_name} {report.updater.last_name}" if report.updater else None,
                "email": report.updater.email if report.updater else None
            } if report.updater else None,
            "related_complaint": {
                "id": str(report.complaint.id),
                "complaint_number": report.complaint.complaint_number,
                "subject": report.complaint.subject,
                "status": report.complaint.status.value if hasattr(report.complaint, 'status') and report.complaint.status else None
            } if report.complaint else None,
            # attachments ถูกกรอง is_active ตั้งแต่ SELECT แล้ว
            "attachments": [
                {
                    "id": str(att.id),
                    "file_name": att.file_name,
                    "file_path": att.file_path,
                    "file_size": att.file_size,
                    "file_type": att.file_type,
                    "created_at": getattr(att, "created_at", None).isoformat() if getattr(att, "created_at", None) else None
                } for att in report.attachments
            ],
            "attachment_count": len(report.attachments)
        }

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting outgoing report by ID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# =========================
# List
# =========================
def get_outgoing_reports(
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
    """ดึงรายการรายงานส่งออก"""
    try:
        query = db.query(OutgoingReport).options(
            joinedload(OutgoingReport.position),
            joinedload(OutgoingReport.signature_authority_user),
            joinedload(OutgoingReport.department),
            joinedload(OutgoingReport.creator),
            joinedload(OutgoingReport.complaint),
            joinedload(OutgoingReport.attachments),
            # กรอง attachments ให้โหลดเฉพาะ is_active
            with_loader_criteria(OutgoingReportAttachment, OutgoingReportAttachment.is_active == True, include_aliases=True)
        ).filter(OutgoingReport.is_active == True)

        if search:
            pattern = f"%{search}%"
            try:
                query = query.filter(
                    or_(
                        OutgoingReport.reference_number.ilike(pattern),
                        OutgoingReport.subject.ilike(pattern),
                        OutgoingReport.complaint_number.ilike(pattern),
                        OutgoingReport.remarks.ilike(pattern),
                    )
                )
            except Exception:
                query = query.filter(
                    or_(
                        func.lower(OutgoingReport.reference_number).like(func.lower(pattern)),
                        func.lower(OutgoingReport.subject).like(func.lower(pattern)),
                        func.lower(OutgoingReport.complaint_number).like(func.lower(pattern)),
                        func.lower(OutgoingReport.remarks).like(func.lower(pattern)),
                    )
                )

        if position_id:
            query = query.filter(OutgoingReport.position_id == position_id)
        if department_id:
            query = query.filter(OutgoingReport.department_id == department_id)
        if signature_authority_user_id:
            query = query.filter(OutgoingReport.signature_authority_user_id == signature_authority_user_id)
        if urgency_level:
            query = query.filter(OutgoingReport.urgency_level == urgency_level)
        if date_from:
            query = query.filter(OutgoingReport.reference_date >= date_from)
        if date_to:
            query = query.filter(OutgoingReport.reference_date <= date_to)

        total = query.count()
        reports = query.order_by(OutgoingReport.created_at.desc()).offset(skip).limit(limit).all()

        items = []
        for report in reports:
            item = {
                "id": str(report.id),
                "position": {
                    "id": str(report.position_id),
                    "name": report.position.name if report.position else "N/A",
                    "level": report.position.level if report.position else None
                },
                "position_other_text": getattr(report, "position_other_text", None),
                "reference_number": report.reference_number,
                "reference_date": report.reference_date.isoformat() if report.reference_date else None,
                "subject": report.subject,
                "document_number": report.document_number,
                "document_date": report.document_date.isoformat() if report.document_date else None,
                "complaint_number": report.complaint_number,
                "complaint_number_date": report.complaint_number_date.isoformat() if report.complaint_number_date else None,
                "signature_authority_user": {
                    "id": str(report.signature_authority_user_id),
                    "name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else "N/A",
                    "email": report.signature_authority_user.email if report.signature_authority_user else "N/A"
                },
                "department": {
                    "id": str(report.department_id),
                    "name": report.department.name if report.department else "N/A",
                    "code": report.department.code if report.department else "N/A"
                },
                "confidentiality_level": report.confidentiality_level,
                "urgency_level": report.urgency_level,
                "remarks": report.remarks,
                "complaint_id": str(report.complaint_id) if report.complaint_id else None,
                "created_at": report.created_at.isoformat() if report.created_at else None,
                "updated_at": report.updated_at.isoformat() if report.updated_at else None,
                "creator": {
                    "id": str(report.creator.id) if report.creator else None,
                    "name": f"{report.creator.first_name} {report.creator.last_name}" if report.creator else "N/A",
                    "email": report.creator.email if report.creator else "N/A"
                },
                "related_complaint": {
                    "id": str(report.complaint.id),
                    "complaint_number": report.complaint.complaint_number,
                    "subject": report.complaint.subject,
                    "status": report.complaint.status.value if hasattr(report.complaint, 'status') and report.complaint.status else None
                } if report.complaint else None,
                # with_loader_criteria ทำให้รายชื่อไฟล์เป็นเฉพาะ active แล้ว
                "attachments": [
                    {
                        "id": str(att.id),
                        "file_name": att.file_name,
                        "file_path": att.file_path,
                        "file_size": att.file_size,
                        "file_type": att.file_type,
                        "created_at": getattr(att, "created_at", None).isoformat() if getattr(att, "created_at", None) else None
                    } for att in report.attachments
                ],
                "attachment_count": len(report.attachments)
            }
            items.append(item)

        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1,
            "size": limit,
            "total_pages": (total + limit - 1) // limit
        }

    except Exception as e:
        logger.error(f"Error getting outgoing reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# =========================
# Options
# =========================
def get_outgoing_report_options(db: Session) -> Dict:
    """ดึงตัวเลือกสำหรับ dropdown ต่างๆ"""
    try:
        logger.info("Getting outgoing report options...")

        positions = db.query(Position).filter(Position.is_active == True).order_by(Position.name).all()
        logger.info(f"Found {len(positions)} positions")

        departments = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
        logger.info(f"Found {len(departments)} departments")

        signature_list = []
        try:
            users = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()
            for user in users:
                signature_list.append({
                    "id": str(user.id),
                    "user_id": str(user.id),
                    "name": f"{user.first_name} {user.last_name}".strip(),
                    "email": user.email if user.email else "N/A"
                })
            logger.info(f"Found {len(signature_list)} signature authorities")
        except Exception as e:
            logger.warning(f"Could not load signature authorities: {e}")

        result = {
            "positions": [
                {
                    "id": str(pos.id),
                    "name": pos.name,
                    "level": pos.level,
                    "description": pos.description
                } for pos in positions
            ],
            "departments": [
                {
                    "id": str(dept.id),
                    "name": dept.name,
                    "code": dept.code,
                    "short_name": dept.short_name
                } for dept in departments
            ],
            "signature_authorities": signature_list,
            "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
            "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"]
        }

        logger.info("Options retrieved successfully")
        return result

    except Exception as e:
        logger.error(f"Error getting outgoing report options: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# =========================
# Auto-fill from complaint
# =========================
def auto_fill_from_complaint(db: Session, complaint_id: UUID) -> Dict:
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        logger.info(f"Auto filling from complaint: {complaint_id}")

        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            logger.error(f"Complaint not found: {complaint_id}")
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")

        logger.info(f"Found complaint: {complaint.complaint_number}")

        result = {
            "complaint_id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "complaint_number_date": complaint.created_at.isoformat() if complaint.created_at else None,
            "reference_number": complaint.reference_number if hasattr(complaint, 'reference_number') else None,
            "reference_date": complaint.reference_date.isoformat() if hasattr(complaint, 'reference_date') and complaint.reference_date else None,
            "subject": complaint.subject,
        }

        logger.info(f"Auto fill data: {result}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto filling from complaint: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# =========================
# Update
# =========================
def update_outgoing_report(
    db: Session,
    report_id: UUID,
    report_data: OutgoingReportUpdate,
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None
) -> Dict:
    """แก้ไขรายงานส่งออก (รองรับ Pydantic v1/v2)"""
    def _model_to_dict(model) -> Dict[str, Any]:
        if hasattr(model, "model_dump"):
            return model.model_dump(exclude_unset=True)  # Pydantic v2
        return model.dict(exclude_unset=True)           # Pydantic v1

    try:
        logger.info(f"=== START UPDATE OUTGOING REPORT: {report_id} ===")

        report = db.query(OutgoingReport).filter(
            OutgoingReport.id == report_id,
            OutgoingReport.is_active == True
        ).first()

        if not report:
            logger.error(f"Report not found: {report_id}")
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")

        logger.info(f"Found report: {report.reference_number}")

        updates = _model_to_dict(report_data)
        if "reference_number" in updates and updates["reference_number"] != report.reference_number:
            dup = db.query(OutgoingReport).filter(
                OutgoingReport.reference_number == updates["reference_number"],
                OutgoingReport.is_active == True,
                OutgoingReport.id != report_id
            ).first()
            if dup:
                logger.error(f"Duplicate reference number: {updates['reference_number']}")
                raise DuplicateKeyError(f"เลข สป.กค {updates['reference_number']} มีอยู่แล้ว")

        # ✅ Validate foreign keys เหมือนกับ create
        if "position_id" in updates and updates["position_id"]:
            position = db.query(Position).filter(
                Position.id == updates["position_id"],
                Position.is_active == True
            ).first()
            if not position:
                logger.error(f"Position not found: {updates['position_id']}")
                raise HTTPException(status_code=404, detail="ไม่พบตำแหน่งที่ระบุ")

        if "signature_authority_user_id" in updates and updates["signature_authority_user_id"]:
            signature_user = db.query(User).filter(
                User.id == updates["signature_authority_user_id"],
                User.is_active == True
            ).first()
            if not signature_user:
                logger.error(f"Signature user not found: {updates['signature_authority_user_id']}")
                raise HTTPException(status_code=404, detail="ไม่พบผู้มีอำนาจลงนามที่ระบุ")

        if "department_id" in updates and updates["department_id"]:
            # ✅ รองรับทั้ง Department และ OutsideDepartment
            department = None
            try:
                from models.outside_departments import OutsideDepartment
                department = db.query(OutsideDepartment).filter(
                    OutsideDepartment.id == updates["department_id"],
                    OutsideDepartment.is_active == True
                ).first()
            except Exception:
                pass

            if not department:
                department = db.query(Department).filter(
                    Department.id == updates["department_id"],
                    Department.is_active == True
                ).first()

            if not department:
                logger.error(f"Department not found: {updates['department_id']}")
                raise HTTPException(status_code=404, detail="ไม่พบหน่วยงานที่ระบุ")

        updates["updated_by"] = current_user_id
        for field, value in updates.items():
            if hasattr(report, field):
                setattr(report, field, value)

        db.commit()
        db.refresh(report)
        logger.info(f"Updated report: {report.reference_number}")

        return get_outgoing_report_by_id(db, report_id)

    except DuplicateKeyError:
        db.rollback()
        raise
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating outgoing report: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# =========================
# Delete (soft)
# =========================
def delete_outgoing_report(db: Session, report_id: UUID, current_user_id: UUID) -> Dict:
    """ลบรายงานส่งออก (soft delete)"""
    try:
        logger.info(f"=== START DELETE OUTGOING REPORT: {report_id} ===")

        report = db.query(OutgoingReport).filter(
            OutgoingReport.id == report_id,
            OutgoingReport.is_active == True
        ).first()

        if not report:
            logger.error(f"Report not found: {report_id}")
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")

        logger.info(f"Found report: {report.reference_number}")

        # Soft delete
        report.is_active = False
        report.updated_by = current_user_id

        # ปิดการแสดงไฟล์แนบทั้งหมด
        for attachment in report.attachments:
            if hasattr(attachment, "is_active"):
                attachment.is_active = False

        db.commit()
        logger.info(f"Deleted report: {report.reference_number}")

        # ✅ บันทึกประวัติสถานะของ complaint ว่ามีการยกเลิก/ปิดการแสดงรายงานส่งออกนี้
        try:
            complaint = None
            if getattr(report, "complaint_id", None):
                complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
            if complaint:
                note = (
                    f"ยกเลิกรายงานส่งออก (soft delete) | เลขอ้างอิง: {report.reference_number or '-'} "
                    f"| เรื่อง: {report.subject or '-'}"
                )
                current_status = getattr(complaint, "status", ComplaintStatus.SENT_TO_EXTERNAL) or ComplaintStatus.SENT_TO_EXTERNAL
                _update_status_and_log(db, complaint, current_status, note, current_user_id)
        except Exception as e:
            logger.warning(f"Could not log history after deleting outgoing report: {e}")

        return {
            "id": str(report_id),
            "message": "ลบรายงานส่งออกเรียบร้อยแล้ว"
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting outgoing report: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")


# =========================
# User-related complaints with tracking
# =========================
def get_user_related_complaints_with_tracking(
    db: Session,
    current_user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    complaint_type: Optional[str] = None,
    complaint_subtype: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    complainant_name: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    รวม 'งานที่ผู้ใช้เกี่ยวข้อง' พร้อม timeline + pagination
    MSSQL-safe (fallback จาก ilike เป็น lower(..) LIKE lower(..))
    """
    from sqlalchemy import case

    def _iso(dt):
        return dt.isoformat() if dt else None

    def _enum_str(v):
        return getattr(v, "value", str(v)) if v is not None else None

    def _safe_str(v):
        return str(v) if v is not None else None

    def _dept_name(obj) -> Optional[str]:
        dep = getattr(obj, "department", None)
        if dep is not None:
            return getattr(dep, "name", None) or getattr(dep, "name_th", None) or getattr(dep, "title", None)
        return None

    status_th_map = {
        "submitted": "ส่งคำร้อง",
        "sent_to_agency": "มอบหมายเจ้าหน้าที่",
        "sent_to_external": "ส่งหน่วยงานที่เกี่ยวข้อง",
        "in_process": "อยู่ระหว่างดำเนินการ",
        "in_review": "อยู่ระหว่างพิจารณา",
        "tracking": "ติดตามผลการพิจารณา",
        "reviewed": "แจ้งผลการพิจารณา",
        "completed": "เสร็จสิ้น",
        "cancelled": "ยกเลิก",
    }
    decision_th_map = {
        "completed": "เสร็จสิ้น",
        "tracking": "ติดตามต่อ",
        "reviewed": "มีผลพิจารณา",
        "sent_to_external": "ส่งหน่วยงานที่เกี่ยวข้องแล้ว",
    }

    q = db.query(Complaint).options(
        joinedload(Complaint.status_history),
        joinedload(Complaint.assigned_officer).joinedload(User.title)
    ).filter(
        or_(
            Complaint.assigned_officer_id == current_user_id,
            Complaint.created_by == current_user_id
        )
    )

    if status:
        try:
            q = q.filter(Complaint.status == ComplaintStatus(status))
        except Exception:
            q = q.filter(Complaint.status == status)

    if complaint_type:
        try:
            q = q.filter(Complaint.complaint_type.ilike(f"%{complaint_type}%"))
        except Exception:
            pass

    if complaint_subtype:
        try:
            q = q.filter(Complaint.complaint_subtype.ilike(f"%{complaint_subtype}%"))
        except Exception:
            pass

    if urgency:
        try:
            q = q.filter(Complaint.urgency_level == urgency)
        except Exception:
            pass

    if search:
        try:
            q = q.filter(
                (Complaint.complaint_number.ilike(f"%{search}%")) |
                (Complaint.subject.ilike(f"%{search}%")) |
                (Complaint.description.ilike(f"%{search}%"))
            )
        except Exception:
            q = q.filter(
                or_(
                    func.lower(Complaint.complaint_number).like(func.lower(f"%{search}%")),
                    func.lower(Complaint.subject).like(func.lower(f"%{search}%")),
                    func.lower(Complaint.description).like(func.lower(f"%{search}%")),
                )
            )

    # name search (ถ้ามีคอลัมน์)
    if complainant_name:
        pattern = f"%{complainant_name}%"
        clauses = []
        for field in ["complainant_name", "complainant_fullname", "full_name", "first_name", "last_name", "name"]:
            col = getattr(Complaint, field, None)
            if col is not None:
                try:
                    clauses.append(col.ilike(pattern))
                except Exception:
                    clauses.append(func.lower(col).like(func.lower(pattern)))
        if clauses:
            q = q.filter(or_(*clauses))

    # Date range filter
    if date_from:
        q = q.filter(Complaint.created_at >= date_from)

    if date_to:
        q = q.filter(Complaint.created_at < date_to)

    total = q.count()
    ordering = [
        case((Complaint.updated_at.is_(None), 1), else_=0).asc(),
        Complaint.updated_at.desc(),
        Complaint.created_at.desc(),
    ]
    complaints: List[Complaint] = q.order_by(*ordering).offset(skip).limit(limit).all()

    # OR3 optional
    OR3Model = None
    try:
        from models.outgoing_reports3 import OutgoingReport3 as OR3Model  # type: ignore
    except Exception:
        OR3Model = None

    items: List[Dict[str, Any]] = []
    for c in complaints:
        timeline: List[Dict[str, Any]] = []

        # 1) status history
        try:
            for h in (c.status_history or []):
                st = _enum_str(getattr(h, "status", None))
                timeline.append({
                    "type": "status_history",
                    "at": _iso(getattr(h, "created_at", None) or getattr(h, "changed_at", None)),
                    "status": st,
                    "status_label": status_th_map.get(st, st),
                    "note": getattr(h, "notes", None) or getattr(h, "note", None) or getattr(h, "remark", None),
                    "by": _safe_str(getattr(h, "updated_by", None) or getattr(h, "changed_by", None)),
                })
        except Exception:
            pass

        # 2) OutgoingReport + department
        outgoing_list: List[OutgoingReport] = (
            db.query(OutgoingReport)
              .options(joinedload(OutgoingReport.department))
              .filter(OutgoingReport.is_active == True, OutgoingReport.complaint_id == c.id)
              .order_by(OutgoingReport.created_at.asc())
              .all()
        )
        for r in outgoing_list:
            timeline.append({
                "type": "outgoing_report",
                "at": _iso(getattr(r, "created_at", None)),
                "reference_number": getattr(r, "reference_number", None),
                "reference_date": _iso(getattr(r, "reference_date", None)),
                "subject": getattr(r, "subject", None),
                "department_id": _safe_str(getattr(r, "department_id", None)),
                "department_name": _dept_name(r),
                "confidentiality": _enum_str(getattr(r, "confidentiality_level", None)),
                "urgency": _enum_str(getattr(r, "urgency_level", None)),
                "by": _safe_str(getattr(r, "created_by", None)),
                "id": _safe_str(getattr(r, "id", None)),
            })

        # 3) OR3 (decisions) + department if has rel
        latest_decision: Optional[Dict[str, Any]] = None
        decision_list = []
        if OR3Model:
            has_dept_rel = hasattr(OR3Model, "department")
            q_or3 = (
                db.query(OR3Model)
                  .filter(OR3Model.is_active == True, OR3Model.complaint_id == c.id)
                  .order_by(OR3Model.created_at.asc())
            )
            if has_dept_rel:
                q_or3 = q_or3.options(joinedload(OR3Model.department))
            decision_list = q_or3.all()

            for d in decision_list:
                result_raw = (
                    getattr(d, "result", None)
                    or getattr(d, "outcome", None)
                    or getattr(d, "decision_status", None)
                )
                item = {
                    "type": "outgoing_report3",
                    "at": _iso(getattr(d, "created_at", None)),
                    "decision_subject": getattr(d, "subject", None),
                    "decision_note": getattr(d, "remarks", None) or getattr(d, "note", None),
                    "reference_number": getattr(d, "reference_number", None),
                    "reference_date": _iso(getattr(d, "reference_date", None)),
                    "by": _safe_str(getattr(d, "created_by", None)),
                    "id": _safe_str(getattr(d, "id", None)),
                    "result": result_raw,
                    "result_label": None,
                    "department_id": _safe_str(getattr(d, "department_id", None)),
                    "department_name": _dept_name(d),
                }
                timeline.append(item)
                latest_decision = item

        latest_sent = None
        if outgoing_list:
            r = outgoing_list[-1]
            latest_sent = {
                "id": _safe_str(getattr(r, "id", None)),
                "reference_number": getattr(r, "reference_number", None),
                "reference_date": _iso(getattr(r, "reference_date", None)),
                "subject": getattr(r, "subject", None),
                "department_id": _safe_str(getattr(r, "department_id", None)),
                "department_name": _dept_name(r),
                "created_at": _iso(getattr(r, "created_at", None)),
            }

        current_status = _enum_str(getattr(c, "status", None))
        suggested_next = None

        if latest_decision:
            decision_text_l = (latest_decision.get("result") or "").lower()
            if any(k in decision_text_l for k in ["complete", "completed", "success", "สำเร็จ", "เสร็จ", "ปิดเรื่อง"]):
                suggested_next = "completed"
            elif any(k in decision_text_l for k in ["ติดตาม", "ต่อเนื่อง", "follow", "follow-up", "รอ", "pending", "review"]):
                suggested_next = "tracking"
            else:
                suggested_next = "reviewed"
            latest_decision["result_label"] = decision_th_map.get(suggested_next, suggested_next)
        elif latest_sent:
            # ถ้ามี OutgoingReport แสดงว่าส่งหน่วยงานที่เกี่ยวข้องแล้ว
            # แต่ใช้ in_review เพื่อไม่ให้สับสนกับการมอบหมายเจ้าหน้าที่
            suggested_next = "in_review"  # รอการตอบกลับจากหน่วยงานภายนอก

        def _ts(x: Dict[str, Any]):
            return x.get("at") or x.get("reference_date") or x.get("created_at") or ""
        timeline.sort(key=_ts, reverse=True)

        items.append({
            "complaint": {
                "id": _safe_str(getattr(c, "id", None)),
                "complaint_number": getattr(c, "complaint_number", None),
                "subject": getattr(c, "subject", None),
                "status": current_status,
                "status_label": status_th_map.get(current_status, current_status),
                "created_at": _iso(getattr(c, "created_at", None)),
                "updated_at": _iso(getattr(c, "updated_at", None)),
                "assigned_officer_id": _safe_str(getattr(c, "assigned_officer_id", None)),
                "assigned_to": getattr(c, "assigned_to", None),
                "assigned_officer_full_name": _get_officer_full_name(getattr(c, "assigned_officer", None)),
                "assigned_date": _iso(getattr(c, "assigned_date", None)),
            },
            "counts": {
                "outgoing_reports": len(outgoing_list),
                "decisions": len(decision_list) if OR3Model else 0,
            },
            "latest": {
                "sent": latest_sent,
                "decision": latest_decision,
            },
            "history": timeline,
            "derived": {
                "current_status": current_status,
                "current_status_label": status_th_map.get(current_status, current_status),
                "suggested_next_status": suggested_next,
                "suggested_next_status_label": decision_th_map.get(suggested_next, suggested_next),
            }
        })

    return {
        "items": items,
        "pagination": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": total > (skip + limit)
        }
    }


# =========================
# Single complaint tracking
# =========================
def get_outgoing_tracking(
    db: Session,
    complaint_id: UUID,
    report_type: Optional[str] = None
) -> Dict[str, Any]:
    def _iso(dt):
        return dt.isoformat() if dt else None

    def _enum_str(v):
        if v is None:
            return None
        return getattr(v, "value", str(v))

    def _safe_str(v):
        return str(v) if v is not None else None

    def _dept_name(obj) -> Optional[str]:
        dep = getattr(obj, "department", None)
        if dep is not None:
            return getattr(dep, "name", None) or getattr(dep, "name_th", None) or getattr(dep, "title", None)
        return None

    status_th_map = {
        "submitted": "ส่งคำร้อง",
        "sent_to_agency": "มอบหมายเจ้าหน้าที่",
        "sent_to_external": "ส่งหน่วยงานที่เกี่ยวข้อง",
        "in_process": "อยู่ระหว่างดำเนินการ",
        "in_review": "อยู่ระหว่างการพิจารณา",
        "tracking": "ติดตามผลการพิจารณา",
        "reviewed": "แจ้งผลการพิจารณา",
        "completed": "เสร็จสิ้น",
        "cancelled": "ยกเลิก",
        # เพิ่ม label สำหรับ event ที่ไม่ใช่สถานะโดยตรง
        "outgoing_report": "รายงานส่งหน่วยงานที่เกี่ยวข้อง",
        "outgoing_report2": "ผลการแจ้งผู้ร้องเรียน / ส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น",
        "outgoing_report3": "ผลการพิจารณา / ผลความคืบหน้า",
        "outgoing_report4": "ผลการแจ้งผู้เกี่ยวข้องทราบ",
        "outgoing_report5": "ผลการรับเรื่องรายงานผลการพิจารณาจากหน่วยงาน",
        "outgoing_report6": "ผลการนำเรียนผู้ตรวจ"
    }
    decision_th_map = {
        "completed": "เสร็จสิ้น",
        "tracking": "ติดตามต่อ",
        "reviewed": "มีผลพิจารณา",
        "sent_to_external": "ส่งหน่วยงานที่เกี่ยวข้องแล้ว",
    }

    # -------- Complaint + history --------
    complaint = (
        db.query(Complaint)
        .options(joinedload(Complaint.status_history))
        .filter(Complaint.id == complaint_id)
        .first()
    )
    if not complaint:
        return {"error": "COMPLAINT_NOT_FOUND"}

    # -------- Outgoing (รุ่นเดิม) --------
    outgoing_list: List[Any] = (
        db.query(OutgoingReport)
        .options(joinedload(OutgoingReport.department))
        .filter(OutgoingReport.is_active == True, OutgoingReport.complaint_id == complaint_id)
        .order_by(OutgoingReport.created_at.asc())
        .all()
    )

    # -------- Outgoing (รุ่น 4) ใส่รวมด้วย --------
    OR4Model = None
    try:
        from models.outgoing_reports4 import OutgoingReport4 as OR4Model  # type: ignore
    except Exception:
        OR4Model = None

    if OR4Model:
        try:
            outgoing_list4 = (
                db.query(OR4Model)
                .options(
                    joinedload(getattr(OR4Model, "department", None)),
                    joinedload(getattr(OR4Model, "outside_department", None)),
                )
                .filter(getattr(OR4Model, "is_active") == True, getattr(OR4Model, "complaint_id") == complaint_id)
                .order_by(getattr(OR4Model, "created_at").asc())
                .all()
            )
        except Exception:
            outgoing_list4 = (
                db.query(OR4Model)
                .filter(getattr(OR4Model, "is_active") == True, getattr(OR4Model, "complaint_id") == complaint_id)
                .order_by(getattr(OR4Model, "created_at").asc())
                .all()
            )
        outgoing_list = list(outgoing_list) + list(outgoing_list4)

    # รวมทั้งหมดตามเวลา
    def _created_at(o):
        return getattr(o, "created_at", None) or getattr(o, "reference_date", None) or datetime.min
    outgoing_list.sort(key=_created_at)

    # -------- Decision (OR3) --------
    decision_list: List[Any] = []
    OR3Model = None
    try:
        from models.outgoing_reports3 import OutgoingReport3 as OR3Model  # type: ignore
    except Exception:
        OR3Model = None

    if OR3Model:
        try:
            decision_list = (
                db.query(OR3Model)
                .options(joinedload(getattr(OR3Model, "department", None)))
                .filter(OR3Model.is_active == True, OR3Model.complaint_id == complaint_id)
                .order_by(OR3Model.created_at.asc())
                .all()
            )
        except Exception:
            decision_list = (
                db.query(OR3Model)
                .filter(OR3Model.is_active == True, OR3Model.complaint_id == complaint_id)
                .order_by(OR3Model.created_at.asc())
                .all()
            )

    # =========================
    # สร้าง timeline (มาตรฐานเดียวกัน)
    # =========================
    timeline: List[Dict[str, Any]] = []

    # 1) status_history → โครงมาตรฐาน + ext (ว่าง/เล็กน้อย)
    try:
        for h in (complaint.status_history or []):
            st = _enum_str(getattr(h, "status", None))
            item = {
                "type": "status_history",
                "at": _iso(getattr(h, "changed_at", None)),  # align doc-storage
                "status": st,
                "status_label": status_th_map.get(st, st),
                "note": getattr(h, "remark", None) or getattr(h, "notes", None),
                "by": _safe_str(getattr(h, "changed_by", None)),
                "ext": {
                    "id": _safe_str(getattr(h, "id", None)),
                    "by_name": getattr(h, "changed_by_name", None) if hasattr(h, "changed_by_name") else None,
                },
            }
            timeline.append(item)
    except Exception:
        pass

    # util: หาชื่อหน่วยงานของ OR/OR4
    def _dept_id_and_name(o) -> Tuple[Optional[str], Optional[str]]:
        dep_id = _safe_str(getattr(o, "outside_department_id", None) or getattr(o, "department_id", None))
        name = None
        if getattr(o, "outside_department", None):
            name = getattr(o.outside_department, "name", None)
        elif getattr(o, "department", None):
            name = getattr(o.department, "name", None)
        else:
            name = getattr(o, "other_department", None)
        return dep_id, name

    # 2) outgoing_report (รวม OR เดิม + OR4) → โครงมาตรฐาน + ext ครบ
    for r in outgoing_list:
        dep_id, dep_name = _dept_id_and_name(r)
        cons = getattr(r, "consideration_result", None)
        closed_flag = bool(("ยุติ" in (cons or "").lower()))
        note_str = f"ส่งหนังสือออก | เลขอ้างอิง: {getattr(r, 'reference_number', None) or '-'} | เรื่อง: {getattr(r, 'subject', None) or '-'}"
        if dep_name:
            note_str += f" | หน่วยงาน: {dep_name}"
        if cons:
            note_str += f" | ผล: {cons}"

        timeline.append({
            "type": "outgoing_report",
            "at": _iso(getattr(r, "created_at", None)),
            "status": "outgoing_report",
            "status_label": status_th_map.get("outgoing_report", "หนังสือส่งออก"),
            "note": note_str,
            "by": _safe_str(getattr(r, "created_by", None)),
            "ext": {
                "id": _safe_str(getattr(r, "id", None)),
                "reference_number": getattr(r, "reference_number", None),
                "reference_date": _iso(getattr(r, "reference_date", None)),
                "subject": getattr(r, "subject", None),
                "department_id": dep_id,
                "department_name": dep_name,
                "confidentiality": _enum_str(getattr(r, "confidentiality_level", None)),
                "urgency": _enum_str(getattr(r, "urgency_level", None)),
                "consideration_result": cons,
                "is_closed_by_consideration": closed_flag,
            },
        })

    # 3) outgoing_report3 (decision) → โครงมาตรฐาน + ext
    latest_decision: Optional[Dict[str, Any]] = None
    for d in decision_list:
        result_raw = (
            getattr(d, "result", None)
            or getattr(d, "outcome", None)
            or getattr(d, "decision_status", None)
        )
        note_str = f"ผลการพิจารณา | เรื่อง: {getattr(d, 'subject', None) or '-'}"
        if result_raw:
            note_str += f" | ผล: {result_raw}"

        item = {
            "type": "outgoing_report3",
            "at": _iso(getattr(d, "created_at", None)),
            "status": "outgoing_report3",
            "status_label": status_th_map.get("outgoing_report3", "ผลการพิจารณา"),
            "note": note_str,
            "by": _safe_str(getattr(d, "created_by", None)),
            "ext": {
                "id": _safe_str(getattr(d, "id", None)),
                "subject": getattr(d, "subject", None),
                "result": _safe_str(result_raw),
                "department_id": _safe_str(getattr(d, "department_id", None)),
                "department_name": _dept_name(d),
                "reference_number": getattr(d, "reference_number", None),
                "reference_date": _iso(getattr(d, "reference_date", None)),
            },
        }
        timeline.append(item)
        latest_decision = item

    # -------- latest + derived --------
    latest_sent = None
    if outgoing_list:
        r = outgoing_list[-1]
        dep_id, dep_name = _dept_id_and_name(r)
        latest_sent = {
            "id": _safe_str(getattr(r, "id", None)),
            "reference_number": getattr(r, "reference_number", None),
            "reference_date": _iso(getattr(r, "reference_date", None)),
            "subject": getattr(r, "subject", None),
            "department_id": dep_id,
            "department_name": dep_name,
            "created_at": _iso(getattr(r, "created_at", None)),
        }

    current_status = _enum_str(getattr(complaint, "status", None))
    suggested_next = None

    # ปิดงานถ้า OR/OR4 มี consideration_result ที่มีคำว่า "ยุติ"
    closed_via_or4 = False
    for r in outgoing_list:
        txt = (getattr(r, "consideration_result", "") or "").lower()
        if "ยุติ" in txt:
            closed_via_or4 = True
            break

    if closed_via_or4:
        suggested_next = "completed"
    elif latest_decision:
        decision_text = (latest_decision.get("ext", {}) or {}).get("result") or ""
        decision_text_l = decision_text.lower()
        if any(k in decision_text_l for k in ["complete", "completed", "success", "สำเร็จ", "เสร็จ", "ปิดเรื่อง"]):
            suggested_next = "completed"
        elif any(k in decision_text_l for k in ["ติดตาม", "ต่อเนื่อง", "follow", "follow-up", "รอ", "pending", "review"]):
            suggested_next = "tracking"
        else:
            suggested_next = "reviewed"
        latest_decision["ext"]["result_label"] = decision_th_map.get(suggested_next, suggested_next)
    elif latest_sent:
        suggested_next = "in_review"

    # ตัวกรองตาม type (ยังใช้ได้เหมือนเดิม)
    if report_type in {"outgoing_report", "outgoing_report3", "status_history"}:
        timeline = [t for t in timeline if t.get("type") == report_type]

    # ลำดับเวลา: เก่าสุด → ล่าสุด (เหมือน payload ตัวอย่างของคุณ)
    def _ts(x: Dict[str, Any]):
        return x.get("at") or ""
    timeline.sort(key=_ts)

    return {
        "complaint": {
            "id": _safe_str(getattr(complaint, "id", None)),
            "complaint_number": getattr(complaint, "complaint_number", None),
            "subject": getattr(complaint, "subject", None),
            "status": current_status,
            "status_label": status_th_map.get(current_status, current_status),
            "created_at": _iso(getattr(complaint, "created_at", None)),
            "updated_at": _iso(getattr(complaint, "updated_at", None)),
        },
        "counts": {
            "outgoing_reports": len(outgoing_list),
            "decisions": len(decision_list) if OR3Model else 0,
        },
        "latest": {
            "sent": latest_sent,
            "decision": latest_decision,
        },
        "history": timeline,
        "derived": {
            "current_status": current_status,
            "current_status_label": status_th_map.get(current_status, current_status),
            "suggested_next_status": suggested_next,
            "suggested_next_status_label": status_th_map.get(suggested_next, suggested_next) if suggested_next else None,
        }
    }

# =========================
# Attachments
# =========================
async def add_attachments_to_outgoing_report(
    db: Session,
    outgoing_report_id: UUID,
    files: List[UploadFile],
    current_user_id: UUID
) -> Dict[str, Any]:
    """
    อัปโหลด 'หลายไฟล์' ให้รายงานส่งออกที่ระบุ
    - ไม่ส่ง keyword ที่โมเดลไม่มี (เช่น file_url) เข้า constructor โดยตรง
    - ใช้ _set_if_has(...) เพื่อตั้งค่าเฉพาะฟิลด์ที่มีจริง
    """
    report = db.query(OutgoingReport).filter(OutgoingReport.id == outgoing_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ไม่พบรายงานส่งออกที่ระบุ")

    saved: List[Dict[str, Any]] = []

    for f in files:
        info = await save_upload_file(f, f"outgoing-reports/{outgoing_report_id}")

        att = OutgoingReportAttachment()
        _set_if_has(
            att,
            outgoing_report_id=outgoing_report_id,
            file_name=info.get("filename") or f.filename,
            # store web-relative path for frontend usage
            file_path=info.get("file_url"),
            file_size=str(info.get("file_size")) if info.get("file_size") is not None else None,
            file_type=info.get("file_type"),
            is_active=True,
        )
        # ถ้า schema คุณมีคอลัมน์ file_url ค่อย set เพิ่ม
        if hasattr(att, "file_url"):
            att.file_url = info.get("file_url")

        db.add(att)
        db.flush()
        db.refresh(att)

        payload = _attachment_dict(att)
        if not payload.get("fileUrl") and info.get("file_url"):
            payload["fileUrl"] = info["file_url"]

        saved.append(payload)

    db.commit()
    
    # ✅ บันทึกประวัติสถานะ: แนบเอกสารเพิ่มเติมให้หนังสือส่งออก
    try:
        complaint = None
        if getattr(report, "complaint_id", None):
            complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
        if complaint:
            note = (
                f"แนบเอกสารเพิ่มเติม {len(saved)} ไฟล์ สำหรับหนังสืออ้างอิง: "
                f"{getattr(report, 'reference_number', None) or '-'}"
            )
            # คงสถานะเดิมถ้ายังเป็นการดำเนินการภายนอก
            target_status = getattr(complaint, "status", ComplaintStatus.SENT_TO_EXTERNAL) or ComplaintStatus.SENT_TO_EXTERNAL
            _update_status_and_log(db, complaint, target_status, note, current_user_id)
    except Exception as e:
        logger.warning(f"Could not log history for adding attachments: {e}")

    return {
        "outgoing_report_id": str(outgoing_report_id),
        "attachments": saved
    }


def list_attachments_of_outgoing_report(
    db: Session,
    outgoing_report_id: UUID
) -> Dict[str, Any]:
    """ดึงรายการไฟล์แนบทั้งหมด (active เท่านั้นถ้ามีฟิลด์ is_active)"""
    q = db.query(OutgoingReportAttachment).filter(
        OutgoingReportAttachment.outgoing_report_id == outgoing_report_id
    )
    if hasattr(OutgoingReportAttachment, "is_active"):
        q = q.filter(OutgoingReportAttachment.is_active == True)

    order_col = getattr(OutgoingReportAttachment, "created_at", None)
    if order_col is not None:
        q = q.order_by(order_col.desc())
    else:
        q = q.order_by(OutgoingReportAttachment.id.desc())

    rows = q.all()
    return {
        "outgoing_report_id": str(outgoing_report_id),
        "attachments": [_attachment_dict(r) for r in rows]
    }


def get_outgoing_report_attachment_fileinfo(
    db: Session,
    outgoing_report_id: UUID,
    attachment_id: UUID
) -> Tuple[str, str, str]:
    """
    คืน (file_path, media_type, filename) สำหรับใช้กับ FileResponse
    """
    att = db.query(OutgoingReportAttachment).filter(
        OutgoingReportAttachment.id == attachment_id,
        OutgoingReportAttachment.outgoing_report_id == outgoing_report_id,
        # ไม่ดึงแถวที่ inactive
        OutgoingReportAttachment.is_active == True if hasattr(OutgoingReportAttachment, "is_active") else True,
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์แนบที่ระบุ")

    if hasattr(att, "is_active") and not getattr(att, "is_active"):
        raise HTTPException(status_code=404, detail="ไฟล์แนบนี้ถูกลบออกจากการแสดงผลแล้ว")

    file_path = getattr(att, "file_path", None)
    if not file_path:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์บนเซิร์ฟเวอร์")

    # map web-relative to absolute disk path if needed
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

    filename = getattr(att, "file_name", None) or os.path.basename(abs_path)
    media_type = getattr(att, "file_type", None) or "application/octet-stream"
    return abs_path, media_type, filename


def delete_outgoing_report_attachment_by_id(
    db: Session,
    outgoing_report_id: UUID,
    attachment_id: UUID,
    hard_delete: bool = False
) -> Dict[str, Any]:
    """
    ลบไฟล์แนบ
    - soft delete (default): is_active=False ถ้ามีคอลัมน์
    - hard delete (เลือก): ลบไฟล์จริง + ลบเรคอร์ด
    """
    att = db.query(OutgoingReportAttachment).filter(
        OutgoingReportAttachment.id == attachment_id,
        OutgoingReportAttachment.outgoing_report_id == outgoing_report_id
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="ไม่พบไฟล์แนบที่ระบุ")

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
        if abs_path and os.path.isfile(abs_path):
            try:
                delete_upload_file(abs_path)
            except Exception:
                pass
        report_id_for_log = getattr(att, "outgoing_report_id", None)
        db.delete(att)
        db.commit()

        # ✅ บันทึกประวัติสถานะหลังลบไฟล์ (hard delete)
        try:
            if report_id_for_log:
                report = db.query(OutgoingReport).filter(OutgoingReport.id == report_id_for_log).first()
                if report and getattr(report, "complaint_id", None):
                    complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
                    if complaint:
                        note = (
                            f"ลบไฟล์แนบ (hard delete) จากหนังสืออ้างอิง: {getattr(report, 'reference_number', None) or '-'}"
                        )
                        current_status = getattr(complaint, "status", ComplaintStatus.SENT_TO_EXTERNAL) or ComplaintStatus.SENT_TO_EXTERNAL
                        _update_status_and_log(db, complaint, current_status, note, None)
        except Exception as e:
            logger.warning(f"Could not log history after hard delete attachment: {e}")

        return {"code": "0003", "message": "ลบไฟล์แนบ (hard delete) เรียบร้อย", "attachment_id": str(attachment_id)}

    if hasattr(att, "is_active"):
        setattr(att, "is_active", False)
        db.commit()

        # ✅ บันทึกประวัติสถานะหลังลบไฟล์ (soft delete)
        try:
            report = db.query(OutgoingReport).filter(OutgoingReport.id == att.outgoing_report_id).first()
            if report and getattr(report, "complaint_id", None):
                complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
                if complaint:
                    note = (
                        f"ลบไฟล์แนบ (soft delete) จากหนังสืออ้างอิง: {getattr(report, 'reference_number', None) or '-'}"
                    )
                    current_status = getattr(complaint, "status", ComplaintStatus.SENT_TO_EXTERNAL) or ComplaintStatus.SENT_TO_EXTERNAL
                    _update_status_and_log(db, complaint, current_status, note, None)
        except Exception as e:
            logger.warning(f"Could not log history after soft delete attachment: {e}")

        return {"code": "0001", "message": "ลบไฟล์แนบเรียบร้อย (soft delete)", "attachment_id": str(attachment_id)}

    report_id_for_log = getattr(att, "outgoing_report_id", None)
    db.delete(att)
    db.commit()

    try:
        if report_id_for_log:
            report = db.query(OutgoingReport).filter(OutgoingReport.id == report_id_for_log).first()
            if report and getattr(report, "complaint_id", None):
                complaint = db.query(Complaint).filter(Complaint.id == report.complaint_id).first()
                if complaint:
                    note = (
                        f"ลบไฟล์แนบ (record delete) จากหนังสืออ้างอิง: {getattr(report, 'reference_number', None) or '-'}"
                    )
                    current_status = getattr(complaint, "status", ComplaintStatus.SENT_TO_EXTERNAL) or ComplaintStatus.SENT_TO_EXTERNAL
                    _update_status_and_log(db, complaint, current_status, note, None)
    except Exception as e:
        logger.warning(f"Could not log history after record delete attachment: {e}")

    return {"code": "0003", "message": "ลบเรคอร์ดไฟล์แนบ (no is_active field)", "attachment_id": str(attachment_id)}