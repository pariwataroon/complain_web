from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from config.database import get_db
from app.api.middleware.permission_middleware import can_read
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.controllers.inspector_pending_report_controller import get_inspector_pending_report

router = APIRouter(
    prefix="/reports/inspector-pending",
    tags=["reports_inspector_pending"],
)

@router.get("", response_model=FormatResponseModel)
def list_inspector_pending_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="ค้นหา (ชื่อผู้ตรวจ, หน่วยงาน)",),
    year: Optional[int] = Query(None, description="ปี ค.ศ. สำหรับค้นหา (default: ปีปัจจุบัน)",),
    date_from: Optional[str] = Query(None, description="วันที่เริ่มต้น (YYYY-MM-DD)",),
    date_to: Optional[str] = Query(None, description="วันที่สิ้นสุด (YYYY-MM-DD)",),
    db: Session = Depends(get_db),
    current_user: dict = Depends(can_read("dashboard")),
):
    try:
        result = get_inspector_pending_report(
            db=db,
            skip=skip,
            limit=limit,
            search=search,
            year=year,
            date_from=date_from,
            date_to=date_to,
        )
        return format_response("0000", result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
