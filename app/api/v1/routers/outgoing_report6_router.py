from __future__ import annotations
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from starlette.responses import FileResponse
from sqlalchemy.orm import Session
from config.database import get_db
from app.api.middleware.permission_middleware import can_read, can_create, can_delete, can_update
from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.permission_controller import check_permission_by_name
from models.outgoing_reports6 import OutgoingReport6
from app.api.v1.controllers.outgoing_report6_controller import (
    get_outgoing_reports6,
    get_outgoing_report6_by_id,
    create_outgoing_report6,
    get_outgoing_report6_options,
    auto_fill_from_complaint6,
    add_attachments_to_outgoing_report6,
    list_attachments_of_outgoing_report6,
    get_outgoing_report6_attachment_fileinfo,
    delete_outgoing_report6_attachment_by_id,
    update_outgoing_report6,
    DuplicateKeyError,
)
from app.api.v1.schemas.outgoing_report6 import (
    OutgoingReport6Create,
    OutgoingReport6Update,
)
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/outgoing-reports6",
    tags=["outgoing_reports6"],
)

@router.get("", response_model=FormatResponseModel)
async def get_outgoing_reports6_list(
    skip: int = Query(0, ge=0, description="จำนวนรายการที่ข้าม"),
    limit: int = Query(100, ge=1, le=1000, description="จำนวนรายการต่อหน้า"),
    search: Optional[str] = Query(None, description="ค้นหาจากเลขอ้างอิง, เรื่อง, หมายเลขข้อร้องเรียน"),
    department_id: Optional[UUID] = Query(None, description="หน่วยงาน"),
    signature_authority_user_id: Optional[UUID] = Query(None, description="ผู้มีอำนาจลงนาม"),
    urgency_level: Optional[str] = Query(None, description="ระดับความเร่งด่วน"),
    date_from: Optional[datetime] = Query(None, description="วันที่เริ่มต้น"),
    date_to: Optional[datetime] = Query(None, description="วันที่สิ้นสุด"),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = get_outgoing_reports6(
            db=db,
            skip=skip,
            limit=limit,
            search=search,
            department_id=department_id,
            signature_authority_user_id=signature_authority_user_id,
            urgency_level=urgency_level,
            date_from=date_from,
            date_to=date_to,
        )
        return format_response("0000", data)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/options", response_model=FormatResponseModel)
async def get_options6(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        options = get_outgoing_report6_options(db)
        return format_response("0000", options)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/auto-fill/{complaint_id}", response_model=FormatResponseModel)
async def auto_fill_from_complaint6_endpoint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = auto_fill_from_complaint6(db, complaint_id)
        return format_response("0000", data)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.post("", response_model=FormatResponseModel)
async def create_new_outgoing_report6(
    report_data: OutgoingReport6Create,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("dashboard")),
):
    try:
        report = create_outgoing_report6(
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

@router.get("/{report_id}", response_model=FormatResponseModel)
async def get_outgoing_report6(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        report = get_outgoing_report6_by_id(db, report_id)
        return format_response("0000", report)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.post("/{outgoing_report_id}/attachments", response_model=FormatResponseModel)
async def upload_outgoing_report6_attachments(
    outgoing_report_id: UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("dashboard")),
):
    try:
        data = add_attachments_to_outgoing_report6(
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

@router.get("/{outgoing_report_id}/attachments", response_model=FormatResponseModel)
async def list_outgoing_report6_attachments(
    outgoing_report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = list_attachments_of_outgoing_report6(db, outgoing_report_id)
        return format_response("0000", data)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/{outgoing_report_id}/attachments/{attachment_id}/download")
async def download_outgoing_report6_attachment(
    outgoing_report_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    file_path, media_type, filename = get_outgoing_report6_attachment_fileinfo(
        db=db,
        outgoing_report_id=outgoing_report_id,
        attachment_id=attachment_id,
    )
    return FileResponse(file_path, media_type=media_type, filename=filename)

@router.delete("/{outgoing_report_id}/attachments/{attachment_id}", response_model=FormatResponseModel)
async def delete_outgoing_report6_attachment(
    outgoing_report_id: UUID,
    attachment_id: UUID,
    hard_delete: bool = False,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token),
):
    try:
        user_id = UUID(current_user)
        has_perm = False
        try:
            has_perm = check_permission_by_name(db, user_id, "dashboard", "delete")
        except Exception:
            has_perm = False
        is_owner = False
        report = db.query(OutgoingReport6).filter(OutgoingReport6.id == outgoing_report_id).first()
        if report and getattr(report, "created_by", None) == user_id:
            is_owner = True
        if not (has_perm or is_owner):
            raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ลบไฟล์แนบ (ไม่ใช่เจ้าของและไม่มีสิทธิ์ลบ)")
        res = delete_outgoing_report6_attachment_by_id(
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
        code = "4040" if e.status_code == 404 else "4030"
        return format_response(code, {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.put("/{report_id}", response_model=FormatResponseModel)
async def update_outgoing_report6_endpoint(
    report_id: UUID,
    report_data: OutgoingReport6Update,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("dashboard")),
):
    try:
        data = update_outgoing_report6(db, report_id, report_data, UUID(current_user))
        return format_response("0002", data)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})
