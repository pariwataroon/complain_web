from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from config.database import get_db
from app.api.middleware.permission_middleware import can_read
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.controllers.annual_complaint_report_controller import (
    get_annual_complaint_summary,
    get_annual_complaint_details
)

router = APIRouter(
    prefix="/reports/annual-complaint",
    tags=["reports_annual_complaint"],
)

@router.get("/summary", response_model=FormatResponseModel)
def get_complaint_summary(
    year: Optional[int] = Query(None, description="ปี ค.ศ. (default: ปีปัจจุบัน)"),
    date_from: Optional[str] = Query(None, description="วันที่เริ่มต้น (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="วันที่สิ้นสุด (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(can_read("dashboard")),
):
    """
    รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ
    แสดงสรุปจำนวนเรื่องตามหน่วยงาน
    """
    try:
        # Parse date strings to datetime
        parsed_date_from = None
        parsed_date_to = None

        if date_from and date_from.strip():
            parsed_date_from = datetime.fromisoformat(date_from)

        if date_to and date_to.strip():
            parsed_date_to = datetime.fromisoformat(date_to)

        result = get_annual_complaint_summary(
            db=db,
            year=year,
            date_from=parsed_date_from,
            date_to=parsed_date_to,
        )
        return format_response("0000", result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/details", response_model=FormatResponseModel)
def get_complaint_details(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    year: Optional[int] = Query(None, description="ปี ค.ศ. (default: ปีปัจจุบัน)"),
    date_from: Optional[str] = Query(None, description="วันที่เริ่มต้น (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="วันที่สิ้นสุด (YYYY-MM-DD)"),
    department_id: Optional[str] = Query(None, description="หน่วยงาน ID"),
    status: Optional[str] = Query(None, description="สถานะ (ยุติ/อยู่ระหว่างดำเนินการ)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(can_read("dashboard")),
):
    """
    รายละเอียดเรื่องร้องเรียนแต่ละเรื่อง
    แสดงรายการเรื่องร้องเรียนทั้งหมดพร้อมรายละเอียด
    """
    try:
        # Parse date strings to datetime
        parsed_date_from = None
        parsed_date_to = None

        if date_from and date_from.strip():
            parsed_date_from = datetime.fromisoformat(date_from)

        if date_to and date_to.strip():
            parsed_date_to = datetime.fromisoformat(date_to)

        result = get_annual_complaint_details(
            db=db,
            year=year,
            date_from=parsed_date_from,
            date_to=parsed_date_to,
            department_id=department_id,
            status=status,
            skip=skip,
            limit=limit,
        )
        return format_response("0000", result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
