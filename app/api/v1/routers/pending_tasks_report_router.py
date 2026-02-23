from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from config.database import get_db
from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.pending_tasks_report_controller import get_pending_tasks_report
from lib.format_data import FormatResponseModel, format_response
from app.api.middleware.permission_middleware import can_read

router = APIRouter(
    prefix="/reports/pending-tasks",
    tags=["reports_pending_tasks"],
)


@router.get("", response_model=FormatResponseModel)
def list_pending_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=10000),
    search: Optional[str] = Query(None, description="ค้นหา (เลขเรื่อง, เรื่อง, เลขอ้างอิง)"),
    status: Optional[str] = Query(None, description="สถานะเฉพาะ"),
    date_from: Optional[str] = Query(None, description="วันที่เริ่ม (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="วันที่สิ้นสุด (YYYY-MM-DD)"),
    department: Optional[str] = Query(None, description="หน่วยงาน (assigned_to)"),
    officer_id: Optional[str] = Query(None, description="รหัสเจ้าหน้าที่"),
    filing_type: Optional[str] = Query(None, description="ประเภทการรับเรื่อง (new, additional)"),
    all_officers: bool = Query(False, description="ดึงข้อมูลทุกเจ้าหน้าที่ (ไม่กรองตาม user ปัจจุบัน)"),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(can_read("dashboard")),  # เปลี่ยนจาก dict เป็น str
):
    try:
        date_from_obj = datetime.strptime(date_from, "%Y-%m-%d") if date_from else None
        date_to_obj = datetime.strptime(date_to, "%Y-%m-%d") if date_to else None

        # กำหนด officer_id: ถ้า all_officers=True ให้ไม่กรองตาม officer_id
        # ถ้าระบุ officer_id มาให้ใช้ค่านั้น, ถ้าไม่ระบุและไม่ใช่ all_officers ให้ใช้ user_id ปัจจุบัน
        final_officer_id = None
        if not all_officers:
            final_officer_id = officer_id if officer_id else current_user_id

        result = get_pending_tasks_report(
            db=db,
            skip=skip,
            limit=limit,
            search=search,
            status=status,
            date_from=date_from_obj,
            date_to=date_to_obj,
            department=department,
            officer_id=final_officer_id,
            filing_type=filing_type,
        )
        return format_response("0000", result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
