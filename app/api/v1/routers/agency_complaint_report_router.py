from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from config.database import get_db
from app.api.middleware.permission_middleware import can_read
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.controllers.agency_complaint_report_controller import (
    get_agency_complaint_report
)

router = APIRouter(
    prefix="/reports/agency-complaint",
    tags=["reports_agency_complaint"],
)

@router.get("/list", response_model=FormatResponseModel)
def get_agency_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    year: Optional[int] = Query(None, description="ปี ค.ศ. (default: ปีปัจจุบัน)"),
    date_from: Optional[str] = Query(None, description="วันที่เริ่มต้น (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="วันที่สิ้นสุด (YYYY-MM-DD)"),
    department_id: Optional[str] = Query(None, description="หน่วยงาน ID"),
    status: Optional[str] = Query(None, description="สถานะ (ทราบ/ทราบไว้ชั้นหนึ่ง/ยุติเรื่องได้/เห็นชอบ/อยู่ระหว่างดำเนินการ)"),
    agency: Optional[str] = Query(None, description="ชื่อหน่วยงาน"),
    responsible_officer: Optional[str] = Query(None, description="เจ้าหน้าที่รับผิดชอบ"),
    claimant_name: Optional[str] = Query(None, description="ชื่อผู้ร้อง/เรื่อง"),
    db: Session = Depends(get_db),
):
    """
    รายงานสรุปเรื่องร้องเรียนของหน่วยงาน
    แสดงรายละเอียดเรื่องร้องเรียนแต่ละเรื่องพร้อมหน่วยงานและเจ้าหน้าที่รับผิดชอบ
    """
    try:
        # Parse date strings to datetime
        parsed_date_from = None
        parsed_date_to = None

        if date_from and date_from.strip():
            parsed_date_from = datetime.fromisoformat(date_from)

        if date_to and date_to.strip():
            parsed_date_to = datetime.fromisoformat(date_to)

        result = get_agency_complaint_report(
            db=db,
            year=year,
            date_from=parsed_date_from,
            date_to=parsed_date_to,
            department_id=department_id,
            status=status,
            agency=agency,
            responsible_officer=responsible_officer,
            claimant_name=claimant_name,
            skip=skip,
            limit=limit,
        )
        return format_response("0000", result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
