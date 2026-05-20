"""
Router สำหรับรายงานการรับงานของเจ้าหน้าที่
Staff Notification Report Router
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from config.database import get_db
from app.api.v1.controllers.staff_notification_report_controller import get_staff_notification_report
from app.api.v1.schemas.staff_notification_report import StaffNotificationReportResponse
from app.api.middleware.jwt_verify import verify_token
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(prefix="/staff-notification-report", tags=["Staff Notification Report"])


@router.get("", response_model=FormatResponseModel)
async def get_staff_notifications(
    user_id: Optional[str] = Query(None, description="Filter by specific user ID"),
    status: Optional[str] = Query(None, description="Filter by complaint status"),
    confirm_status: Optional[bool] = Query(None, description="Filter by confirm status: true=confirmed, false=rejected, null=pending"),
    date_from: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    date_to: Optional[datetime] = Query(None, description="End date (ISO format)"),
    search: Optional[str] = Query(None, description="Search by complaint number or subject"),
    show_alerts_only: bool = Query(False, description="Show only warning/overdue items"),
    skip: int = Query(0, ge=0, description="Skip records"),
    limit: int = Query(100, ge=1, le=1000, description="Limit records"),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """
    ดึงรายงานการรับงานของเจ้าหน้าที่

    **Query Parameters:**
    - **user_id** (optional): กรองตามเจ้าหน้าที่คนใดคนหนึ่ง
    - **status** (optional): กรองตามสถานะงาน (submitted, sent_to_agency, in_process, etc.)
    - **confirm_status** (optional):
      - `true` = งานที่ยืนยันรับแล้ว
      - `false` = งานที่ปฏิเสธ
      - ไม่ระบุ = แสดงทั้งหมด
    - **date_from, date_to**: ช่วงเวลา
    - **search**: ค้นหาเลขที่เรื่อง หรือหัวข้อ
    - **skip, limit**: Pagination

    **Returns:**
    ```json
    {
      "total": 100,
      "items": [
        {
          "id": "uuid",
          "complaint_number": "841/68",
          "claimant_name": "นายปริญญา ทรัพย์รุ่ง",
          "issue": "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
          "responsible_officer": "นางสาวนภัส มีความสุข",
          "officer_receive_date": "01 ต.ค. 2568",
          "issue_type": "เรื่องร้องเรียนใหม่/ร้องเรียนเพิ่มเติม",
          "count_times": 3
        }
      ],
      "total_confirmed": 50,
      "total_pending": 30,
      "total_rejected": 20
    }
    ```
    """
    # ถ้าไม่ระบุ user_id จะแสดงทุกคน (สำหรับ admin)
    # สามารถเพิ่ม logic ตรวจสอบ permission ได้ที่นี่

    result = get_staff_notification_report(
        db=db,
        user_id=user_id,
        status=status,
        confirm_status=confirm_status,
        date_from=date_from,
        date_to=date_to,
        search=search,
        show_alerts_only=show_alerts_only,
        skip=skip,
        limit=limit
    )

    return format_response("0000", result.dict())


@router.get("/my-assignments", response_model=FormatResponseModel)
async def get_my_staff_notifications(
    status: Optional[str] = Query(None),
    confirm_status: Optional[bool] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """
    ดึงรายงานการรับงานของเจ้าหน้าที่คนปัจจุบัน (ตัวเอง)

    **แนะนำใช้ endpoint นี้สำหรับเจ้าหน้าที่ทั่วไป**
    จะแสดงเฉพาะงานที่ตัวเองได้รับมอบหมาย
    """
    # verify_token returns user_id as string
    user_id = current_user

    result = get_staff_notification_report(
        db=db,
        user_id=user_id,
        status=status,
        confirm_status=confirm_status,
        date_from=date_from,
        date_to=date_to,
        search=search,
        skip=skip,
        limit=limit
    )

    return format_response("0000", result.dict())


@router.get("/statistics", response_model=FormatResponseModel)
async def get_staff_notification_statistics(
    user_id: Optional[str] = Query(None, description="Filter by user ID (optional for admin)"),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """
    ดึงสถิติการรับงานของเจ้าหน้าที่แบบย่อ

    **Returns:**
    ```json
    {
      "total_assignments": 100,
      "confirmed": 50,
      "pending": 30,
      "rejected": 20,
      "completion_rate": 50.0
    }
    ```
    """
    # ถ้าไม่ระบุ user_id ให้ใช้ของตัวเอง
    if not user_id:
        user_id = current_user  # verify_token returns user_id as string

    result = get_staff_notification_report(
        db=db,
        user_id=user_id,
        skip=0,
        limit=1  # ดึงแค่ข้อมูลสถิติ ไม่ต้องการ items
    )

    completion_rate = 0.0
    if result.total > 0:
        completion_rate = (result.total_confirmed / result.total) * 100

    return format_response("0000", {
        "total_assignments": result.total,
        "confirmed": result.total_confirmed,
        "pending": result.total_pending,
        "rejected": result.total_rejected,
        "completion_rate": round(completion_rate, 2)
    })
