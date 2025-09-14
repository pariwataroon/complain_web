from __future__ import annotations

from uuid import UUID
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from starlette.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from config.database import get_db
from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import can_read, can_create, can_delete, can_update
from app.api.v1.controllers.permission_controller import check_permission_by_name
from models.outgoing_reports3 import OutgoingReport3
from app.api.v1.controllers.outgoing_report3_controller import (
    get_outgoing_reports3,
    get_outgoing_report3_by_id,
    create_outgoing_report3,
    get_outgoing_report3_options,
    auto_fill_from_complaint3,
    add_attachments_to_outgoing_report3,
    list_attachments_of_outgoing_report3,
    get_outgoing_report3_attachment_fileinfo,
    delete_outgoing_report3_attachment_by_id,
    update_outgoing_report3,
    delete_outgoing_report3,
    DuplicateKeyError,
    get_my_outgoing_reports3_list,
)
from app.api.v1.schemas.outgoing_report3 import (
    OutgoingReport3Create,
    OutgoingReport3Update,
)
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/outgoing-reports3",
    tags=["outgoing_reports3"],
)

# ---------- LIST ----------
@router.get("", response_model=FormatResponseModel)
async def get_outgoing_reports3_list(
    skip: int = Query(0, ge=0, description="จำนวนรายการที่ข้าม"),
    limit: int = Query(100, ge=1, le=1000, description="จำนวนรายการต่อหน้า"),
    search: Optional[str] = Query(None, description="ค้นหาจากเลขหนังสือ, เรื่อง, หมายเลขข้อร้องเรียน"),
    position_id: Optional[UUID] = Query(None, description="ตำแหน่งที่เกี่ยวข้อง"),
    department_id: Optional[UUID] = Query(None, description="หน่วยงาน"),
    signature_authority_user_id: Optional[UUID] = Query(None, description="ผู้มีอำนาจลงนาม"),
    urgency_level: Optional[str] = Query(None, description="ระดับความเร่งด่วน"),
    date_from: Optional[datetime] = Query(None, description="วันที่เริ่มต้น"),
    date_to: Optional[datetime] = Query(None, description="วันที่สิ้นสุด"),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = get_outgoing_reports3(
            db=db,
            skip=skip,
            limit=limit,
            search=search,
            position_id=position_id,
            department_id=department_id,
            signature_authority_user_id=signature_authority_user_id,
            urgency_level=urgency_level,
            date_from=date_from,
            date_to=date_to,
        )
        return format_response("0000", data)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# ---------- DELETE (soft) ----------
@router.delete("/{report_id}", response_model=FormatResponseModel)
async def delete_outgoing_report3_endpoint(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_access")),
):
    try:
        res = delete_outgoing_report3(db, report_id, UUID(current_user))
        return format_response("0003", res)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# ---------- OPTIONS ----------
@router.get("/options", response_model=FormatResponseModel)
async def get_options3(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        options = get_outgoing_report3_options(db)
        return format_response("0000", options)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# ---------- AUTO-FILL ----------
@router.get("/auto-fill/{complaint_id}", response_model=FormatResponseModel)
async def auto_fill_from_complaint3_endpoint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = auto_fill_from_complaint3(db, complaint_id)
        return format_response("0000", data)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# ---------- CREATE ----------
@router.post("", response_model=FormatResponseModel)
async def create_new_outgoing_report3(
    report_data: OutgoingReport3Create,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("dashboard")),
):
    try:
        report = create_outgoing_report3(
            db=db,
            report_data=report_data,
            current_user_id=UUID(current_user),
            files=None,
        )
        return format_response("0001", report)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/me", response_model=FormatResponseModel)
async def get_my_outgoing_reports3(
    skip: int = Query(0, ge=0, description="จำนวนรายการที่ข้าม"),
    limit: int = Query(100, ge=1, le=1000, description="จำนวนรายการต่อหน้า"),
    search: Optional[str] = Query(None, description="ค้นหาจากเลขหนังสือ, เรื่อง, หมายเหตุ"),
    date_from: Optional[datetime] = Query(None, description="วันที่เริ่มต้น (อิง document_date)"),
    date_to: Optional[datetime] = Query(None, description="วันที่สิ้นสุด (อิง document_date)"),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token),
):
    """รายการเอกสารรุ่น 3 ของผู้ใช้ปัจจุบัน (สำหรับจับคู่ /document-storage/me)

    เงื่อนไขหลัก: created_by = current_user
    ตัวกรองเสริม: search (complaint_number/subject/document_number/remarks), date_from/date_to
    """
    try:
        data = get_my_outgoing_reports3_list(
            db=db,
            current_user_id=UUID(current_user),
            skip=skip,
            limit=limit,
            search=search,
            date_from=date_from,
            date_to=date_to,
        )
        return format_response("0000", data)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/{report_id}", response_model=FormatResponseModel)
async def get_outgoing_report3(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        report = get_outgoing_report3_by_id(db, report_id)
        return format_response("0000", report)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# =================== ATTACHMENTS (รุ่น 3) ===================

# Upload (multiple)
@router.post("/{outgoing_report_id}/attachments", response_model=FormatResponseModel)
async def upload_outgoing_report3_attachments(
    outgoing_report_id: UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("dashboard")),
):
    try:
        data = add_attachments_to_outgoing_report3(
            db=db,
            outgoing_report_id=outgoing_report_id,
            files=files,
            current_user_id=UUID(current_user),
        )
        return format_response("0001", data)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# List
@router.get("/{outgoing_report_id}/attachments", response_model=FormatResponseModel)
async def list_outgoing_report3_attachments(
    outgoing_report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = list_attachments_of_outgoing_report3(db, outgoing_report_id)
        return format_response("0000", data)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# Download
@router.get("/{outgoing_report_id}/attachments/{attachment_id}/download")
async def download_outgoing_report3_attachment(
    outgoing_report_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    file_path, media_type, filename = get_outgoing_report3_attachment_fileinfo(
        db=db,
        outgoing_report_id=outgoing_report_id,
        attachment_id=attachment_id,
    )
    return FileResponse(file_path, media_type=media_type, filename=filename)

# Delete (soft/hard)
@router.delete("/{outgoing_report_id}/attachments/{attachment_id}", response_model=FormatResponseModel)
async def delete_outgoing_report3_attachment(
    outgoing_report_id: UUID,
    attachment_id: UUID,
    hard_delete: bool = False,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token),
):
    try:
        user_id = UUID(current_user)

        # 1) มีสิทธิ์ลบผ่าน permission system?
        has_perm = False
        try:
            has_perm = check_permission_by_name(db, user_id, "dashboard", "delete")
        except Exception:
            has_perm = False

        # 2) เจ้าของเรคอร์ด (report.created_by == current user)?
        is_owner = False
        report = db.query(OutgoingReport3).filter(OutgoingReport3.id == outgoing_report_id).first()
        if report and getattr(report, "created_by", None) == user_id:
            is_owner = True

        if not (has_perm or is_owner):
            raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ลบไฟล์แนบ (ไม่ใช่เจ้าของและไม่มีสิทธิ์ลบ)")

        res = delete_outgoing_report3_attachment_by_id(
            db=db,
            outgoing_report_id=outgoing_report_id,
            attachment_id=attachment_id,
            hard_delete=hard_delete,
        )
        return format_response(res.get("code", "0001"), {
            "message": res.get("message"),
            "attachment_id": res.get("attachment_id"),
        })
    except HTTPException as e:
        # 403 / 404
        code = "4040" if e.status_code == 404 else "4030"
        return format_response(code, {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# ---------- UPDATE (PUT) ----------
@router.put("/{report_id}", response_model=FormatResponseModel)
async def update_outgoing_report3_endpoint(
    report_id: UUID,
    report_data: OutgoingReport3Update,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("dashboard")),
):
    try:
        data = update_outgoing_report3(db, report_id, report_data, UUID(current_user))
        return format_response("0002", data)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})