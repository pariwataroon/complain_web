# app/api/v1/routers/outgoing_report5_router.py
from __future__ import annotations
from uuid import UUID
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Body
from starlette.responses import FileResponse
from sqlalchemy.orm import Session

from config.database import get_db
from app.api.middleware.permission_middleware import can_read, can_create, can_delete
from lib.format_data import FormatResponseModel, format_response

from app.api.v1.controllers.outgoing_report5_controller import (
    get_outgoing_reports5,
    get_outgoing_report5_by_id,
    create_outgoing_report5,
    get_outgoing_report5_options,
    auto_fill_from_complaint5,
    add_attachments_to_outgoing_report5,
    list_attachments_of_outgoing_report5,
    get_outgoing_report5_attachment_fileinfo,
    delete_outgoing_report5_attachment_by_id,
    DuplicateKeyError,
)
from app.api.v1.schemas.outgoing_report5 import OutgoingReport5Create

router = APIRouter(
    prefix="/outgoing-reports5",
    tags=["outgoing_reports5"],
)

# ---------- LIST ----------
@router.get("", response_model=FormatResponseModel)
async def get_outgoing_reports5_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    department_id: Optional[UUID] = Query(None),
    signature_authority_user_id: Optional[UUID] = Query(None),
    urgency_level: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = get_outgoing_reports5(
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

# ---------- OPTIONS ----------
@router.get("/options", response_model=FormatResponseModel)
async def get_options5(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        options = get_outgoing_report5_options(db)
        return format_response("0000", options)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# ---------- AUTO-FILL ----------
@router.get("/auto-fill/{complaint_id}", response_model=FormatResponseModel)
async def auto_fill_from_complaint5_endpoint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = auto_fill_from_complaint5(db, complaint_id)
        return format_response("0000", data)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# ---------- CREATE ----------
@router.post("", response_model=FormatResponseModel)
async def create_new_outgoing_report5(
    report_data: OutgoingReport5Create,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("dashboard")),
):
    try:
        result = await create_outgoing_report5(
            db=db,
            report_data=report_data,
            current_user_id=UUID(current_user),
            files=None,
        )
        return format_response("0001", result)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# ---------- GET BY ID ----------
@router.get("/{report_id}", response_model=FormatResponseModel)
async def get_outgoing_report5(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = get_outgoing_report5_by_id(db, report_id)
        return format_response("0000", data)
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

# =================== ATTACHMENTS ===================

@router.post("/{outgoing_report_id}/attachments", response_model=FormatResponseModel)
async def upload_outgoing_report5_attachments(
    outgoing_report_id: UUID,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("dashboard")),
):
    try:
        data = await add_attachments_to_outgoing_report5(
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
async def list_outgoing_report5_attachments(
    outgoing_report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = list_attachments_of_outgoing_report5(db, outgoing_report_id)
        return format_response("0000", data)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/{outgoing_report_id}/attachments/{attachment_id}/download")
async def download_outgoing_report5_attachment(
    outgoing_report_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    file_path, media_type, filename = get_outgoing_report5_attachment_fileinfo(
        db=db,
        outgoing_report_id=outgoing_report_id,
        attachment_id=attachment_id,
    )
    return FileResponse(file_path, media_type=media_type, filename=filename)

@router.delete("/{outgoing_report_id}/attachments/{attachment_id}", response_model=FormatResponseModel)
async def delete_outgoing_report5_attachment(
    outgoing_report_id: UUID,
    attachment_id: UUID,
    hard_delete: bool = False,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("dashboard")),
):
    try:
        res = delete_outgoing_report5_attachment_by_id(
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
