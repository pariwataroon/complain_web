from __future__ import annotations

from uuid import UUID
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from starlette.responses import FileResponse
from sqlalchemy.orm import Session

from config.database import get_db
from app.api.middleware.permission_middleware import can_read, can_create, can_delete
from app.api.v1.controllers.outgoing_report2_controller import (
    get_outgoing_reports2,
    get_outgoing_report2_by_id,
    create_outgoing_report2,
    get_outgoing_report2_options,
    auto_fill_from_complaint2,
    add_attachments_to_outgoing_report2,
    list_attachments_of_outgoing_report2,
    get_outgoing_report2_attachment_fileinfo,
    delete_outgoing_report2_attachment_by_id,
    DuplicateKeyError,
)
from app.api.v1.schemas.outgoing_report2 import (
    OutgoingReport2Create,
    OutgoingReport2Update,
    OutgoingReport2 as OutgoingReport2Schema,
    OutgoingReport2Options,
)
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/outgoing-reports2",
    tags=["outgoing_reports2"],
)

# ---------- LIST ----------
@router.get("", response_model=FormatResponseModel)
async def get_outgoing_reports2_list(
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
    """ดึงรายการรายงานแจ้งผู้ร้องเรียนทั้งหมด"""
    try:
        data = get_outgoing_reports2(
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

# ---------- OPTIONS ----------
@router.get("/options", response_model=FormatResponseModel)
async def get_options2(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    """ดึงตัวเลือกสำหรับ dropdown ต่างๆ"""
    try:
        options = get_outgoing_report2_options(db)
        return format_response("0000", options)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# ---------- AUTO-FILL ----------
@router.get("/auto-fill/{complaint_id}", response_model=FormatResponseModel)
async def auto_fill_from_complaint2_endpoint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        data = auto_fill_from_complaint2(db, complaint_id)
        return format_response("0000", data)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# ---------- CREATE ----------
@router.post("", response_model=FormatResponseModel)
async def create_new_outgoing_report2(
    report_data: OutgoingReport2Create,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("dashboard")),
):
    """สร้างรายงานแจ้งผู้ร้องเรียนใหม่ด้วย JSON body"""
    try:
        report = create_outgoing_report2(
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

# ---------- GET BY ID ----------
@router.get("/{report_id}", response_model=FormatResponseModel)
async def get_outgoing_report2(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    """ดึงรายงานแจ้งผู้ร้องเรียนตาม ID"""
    try:
        report = get_outgoing_report2_by_id(db, report_id)
        return format_response("0000", report)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# =================== ATTACHMENTS (รุ่น 2) ===================

# Upload (multiple)
@router.post("/{outgoing_report_id}/attachments", response_model=FormatResponseModel)
async def upload_outgoing_report2_attachments(
    outgoing_report_id: UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("dashboard")),
):
    """อัปโหลดหลายไฟล์แนบให้รายงาน"""
    try:
        data = await add_attachments_to_outgoing_report2(
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
async def list_outgoing_report2_attachments(
    outgoing_report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    """ดึงรายการไฟล์แนบของรายงาน"""
    try:
        data = list_attachments_of_outgoing_report2(db, outgoing_report_id)
        return format_response("0000", data)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# Download
@router.get("/{outgoing_report_id}/attachments/{attachment_id}/download")
async def download_outgoing_report2_attachment(
    outgoing_report_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    """ดาวน์โหลดไฟล์แนบของรายงาน"""
    file_path, media_type, filename = get_outgoing_report2_attachment_fileinfo(
        db=db,
        outgoing_report_id=outgoing_report_id,
        attachment_id=attachment_id,
    )
    return FileResponse(file_path, media_type=media_type, filename=filename)

# Delete (soft/hard)
@router.delete("/{outgoing_report_id}/attachments/{attachment_id}", response_model=FormatResponseModel)
async def delete_outgoing_report2_attachment(
    outgoing_report_id: UUID,
    attachment_id: UUID,
    hard_delete: bool = False,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("dashboard")),
):
    """ลบไฟล์แนบ (soft delete เป็นค่าเริ่มต้น, ใส่ hard_delete=true เพื่อ hard delete)"""
    try:
        res = delete_outgoing_report2_attachment_by_id(
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
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})