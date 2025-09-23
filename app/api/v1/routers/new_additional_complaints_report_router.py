from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from config.database import get_db
from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.new_additional_complaints_report_controller import get_new_additional_complaints_report
from lib.format_data import FormatResponseModel, format_response
from app.api.middleware.permission_middleware import can_read

router = APIRouter(
    prefix="/reports/new-additional-complaints",
    tags=["reports_new_additional_complaints"],
)


@router.get("", response_model=FormatResponseModel)
def list_new_additional_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="ค้นหาจากเลขเรื่อง, เรื่อง, เลข สรร."),
    filing_type: Optional[str] = Query(None, description="ประเภทการร้องเรียน: new / additional / anonymous / all"),
    date_from: Optional[str] = Query(None, description="วันที่เริ่ม (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="วันที่สิ้นสุด (YYYY-MM-DD)"),
    department: Optional[str] = Query(None, description="หน่วยงาน (assigned_to)"),
    officer_id: Optional[str] = Query(None, description="รหัสเจ้าหน้าที่ผู้รับผิดชอบ"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(can_read("dashboard")),
):
    try:
        date_from_obj = datetime.strptime(date_from, "%Y-%m-%d") if date_from else None
        date_to_obj = datetime.strptime(date_to, "%Y-%m-%d") if date_to else None

        result = get_new_additional_complaints_report(
            db=db,
            skip=skip,
            limit=limit,
            search=search,
            filing_type=filing_type,
            date_from=date_from_obj,
            date_to=date_to_obj,
            department=department,
            officer_id=officer_id,
        )
        return format_response("0000", result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
