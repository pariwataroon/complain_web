from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from config.database import get_db
from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.outgoing_report_controller import (
    get_outgoing_reports,
    get_outgoing_report_by_id,
    create_outgoing_report,
    get_outgoing_report_options,
    auto_fill_from_complaint,
    DuplicateKeyError
)
from app.api.v1.schemas.outgoing_report import (
    OutgoingReportCreate,
    OutgoingReportUpdate,
    OutgoingReport,
    OutgoingReportOptions
)
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/outgoing-reports",
    tags=["outgoing_reports"],
)

@router.get("", response_model=FormatResponseModel)
async def get_outgoing_reports_list(
    skip: int = Query(0, ge=0, description="จำนวนรายการที่ข้าม"),
    limit: int = Query(100, ge=1, le=1000, description="จำนวนรายการต่อหน้า"),
    search: Optional[str] = Query(None, description="ค้นหาจากเลข สป.กค, เรื่อง, หมายเลขข้อร้องเรียน"),
    position_id: Optional[UUID] = Query(None, description="ตำแหน่งที่เกี่ยวข้อง"),
    department_id: Optional[UUID] = Query(None, description="หน่วยงาน"),
    signature_authority_user_id: Optional[UUID] = Query(None, description="ผู้มีอำนาจลงนาม"),
    urgency_level: Optional[str] = Query(None, description="ระดับความเร่งด่วน"),
    date_from: Optional[datetime] = Query(None, description="วันที่เริ่มต้น"),
    date_to: Optional[datetime] = Query(None, description="วันที่สิ้นสุด"),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการรายงานส่งออกทั้งหมด"""
    try:
        data = get_outgoing_reports(
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
async def get_options(
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงตัวเลือกสำหรับ dropdown ต่างๆ"""
    try:
        options = get_outgoing_report_options(db)
        return format_response("0000", options)
        
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/auto-fill/{complaint_id}", response_model=FormatResponseModel)
async def auto_fill_from_complaint_endpoint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        data = auto_fill_from_complaint(db, complaint_id)
        return format_response("0000", data)
        
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.post("", response_model=FormatResponseModel)
async def create_new_outgoing_report(
    report_data: OutgoingReportCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """สร้างรายงานส่งออกใหม่ด้วย JSON body"""
    try:
        report = create_outgoing_report(
            db=db,
            report_data=report_data,
            current_user_id=UUID(current_user),
            files=None  # ไม่มีไฟล์ในเวอร์ชันนี้
        )
        
        return format_response("0001", report)
        
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.get("/{report_id}", response_model=FormatResponseModel)
async def get_outgoing_report(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายงานส่งออกตาม ID"""
    try:
        report = get_outgoing_report_by_id(db, report_id)
        return format_response("0000", report)
        
    except HTTPException as e:
        return format_response("4040", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})


