from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from config.database import get_db
from app.api.middleware.permission_middleware import can_read
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.controllers.inspector_complaint_management_controller import (
    get_inspector_complaint_management_report
)

router = APIRouter(
    prefix="/reports/inspector-complaint-management",
    tags=["reports_inspector_complaint_management"],
)

@router.get("/list", response_model=FormatResponseModel)
def get_inspector_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=10000),
    year: Optional[int] = Query(None, description="ปี ค.ศ. (default: ปีปัจจุบัน)"),
    date_from: Optional[str] = Query(None, description="วันที่เริ่มต้น (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="วันที่สิ้นสุด (YYYY-MM-DD)"),
    inspector_id: Optional[str] = Query(None, description="รหัสผู้ตรวจราชการ"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(can_read("dashboard")),
):
    """
    รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจราชการกระทรวงการคลัง
    แสดงข้อมูลแยกตามผู้ตรวจราชการ พร้อมหน่วยงานภายนอก และจังหวัด
    """
    try:
        # Parse date strings to datetime
        parsed_date_from = None
        parsed_date_to = None

        if date_from and date_from.strip():
            parsed_date_from = datetime.fromisoformat(date_from)

        if date_to and date_to.strip():
            parsed_date_to = datetime.fromisoformat(date_to)

        result = get_inspector_complaint_management_report(
            db=db,
            year=year,
            date_from=parsed_date_from,
            date_to=parsed_date_to,
            inspector_id=inspector_id,
            skip=skip,
            limit=limit,
        )
        return format_response("0000", result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
