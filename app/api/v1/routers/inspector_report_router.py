from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from config.database import get_db
from app.api.middleware.permission_middleware import can_read
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.controllers.inspector_report_controller import get_inspector_report

router = APIRouter(
    prefix="/reports/inspector",
    tags=["reports_inspector"],
)

@router.get("", response_model=FormatResponseModel)
def list_inspector_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="ค้นหา (ชื่อผู้ตรวจ, หน่วยงาน, เรื่อง)",),
    year: Optional[int] = Query(None, description="ปี ค.ศ. สำหรับค้นหา (default: ปีปัจจุบัน)",),
    date_from: Optional[str] = Query(None, description="วันที่เริ่มต้น (ISO format YYYY-MM-DD)",),
    date_to: Optional[str] = Query(None, description="วันที่สิ้นสุด (ISO format YYYY-MM-DD)",),
    department_id: Optional[str] = Query(None, description="ID หน่วยงาน",),
    inspector_id: Optional[str] = Query(None, description="ID ผู้ตรวจ",),
    status: Optional[str] = Query(None, description="สถานะ (closed/in_progress)",),
    db: Session = Depends(get_db),
    current_user: dict = Depends(can_read("dashboard")),
):
    try:
        result = get_inspector_report(
            db=db,
            skip=skip,
            limit=limit,
            search=search,
            year=year,
            date_from=date_from,
            date_to=date_to,
            department_id=department_id,
            inspector_id=inspector_id,
            status=status,
        )
        return format_response("0000", result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
