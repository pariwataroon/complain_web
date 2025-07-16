from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from config.database import get_db
from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import can_read, can_create
from app.api.v1.controllers.outgoing_report3_controller import (
    get_outgoing_reports3,
    get_outgoing_report3_by_id,
    create_outgoing_report3,
    get_outgoing_report3_options,
    auto_fill_from_complaint3,
    DuplicateKeyError
)
from app.api.v1.schemas.outgoing_report3 import (
    OutgoingReport3Create,
    OutgoingReport3Update,
    OutgoingReport3,
    OutgoingReport3Options
)
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/outgoing-reports3",
    tags=["outgoing_reports3"],
)

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
    current_user: str = Depends(can_read("dashboard"))
):
    """ดึงรายการรายงานขอทราบผลการพิจารณาทั้งหมด"""
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
            date_to=date_to
        )
        
        return format_response("0000", data)
        
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/options", response_model=FormatResponseModel)
async def get_options3(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard"))
):
    """ดึงตัวเลือกสำหรับ dropdown ต่างๆ"""
    try:
        options = get_outgoing_report3_options(db)
        return format_response("0000", options)
        
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/auto-fill/{complaint_id}", response_model=FormatResponseModel)
async def auto_fill_from_complaint3_endpoint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard"))
):
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        data = auto_fill_from_complaint3(db, complaint_id)
        return format_response("0000", data)
        
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.post("", response_model=FormatResponseModel)
async def create_new_outgoing_report3(
    report_data: OutgoingReport3Create,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("dashboard"))
):
    """สร้างรายงานขอทราบผลการพิจารณาใหม่ด้วย JSON body"""
    try:
        report = create_outgoing_report3(
            db=db,
            report_data=report_data,
            current_user_id=UUID(current_user),
            files=None
        )
        
        return format_response("0001", report)
        
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/{report_id}", response_model=FormatResponseModel)
async def get_outgoing_report3(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard"))
):
    """ดึงรายงานขอทราบผลการพิจารณาตาม ID"""
    try:
        report = get_outgoing_report3_by_id(db, report_id)
        return format_response("0000", report)
        
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})