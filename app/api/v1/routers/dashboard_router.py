from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import can_read
from app.api.middleware.permission_middleware import permission_required
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

from app.api.v1.controllers.dashboard_controller import get_full_map_json_from_db, get_complaint_summary_bkk_year

# นำเข้า controller สำหรับ dashboard
from app.api.v1.controllers.dashboard_controller import (
    get_staff_workload,
    get_staff_performance
)

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
)

@router.get("/staff-workload", response_model=FormatResponseModel)
async def get_staff_workload_data(
    skip: int = 0, 
    limit: int = 100, 
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard"))
):
    """
    ดึงข้อมูลภาระงานของเจ้าหน้าที่แต่ละคน แยกตามสถานะของเรื่องร้องทุกข์
    เพื่อแสดงบน dashboard สำหรับผู้บริหาร
    """
    try:
        result = get_staff_workload(db, skip, limit, date_from, date_to)
        return format_response("0000", result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": str(e)})

@router.get("/staff-performance", response_model=FormatResponseModel)
async def get_staff_performance_data(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard"))
):
    """
    ดึงข้อมูลประสิทธิภาพการทำงานของเจ้าหน้าที่
    แสดงจำนวนเรื่องที่จัดการสำเร็จ ระยะเวลาเฉลี่ยในการจัดการเรื่องร้องทุกข์
    """
    try:
        result = get_staff_performance(db, date_from, date_to)
        return format_response("0000", result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": str(e)})

@router.get("/map-json", response_model=FormatResponseModel)
async def get_map_json_endpoint(
    json_path: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard"))
):
    """
    ส่งออกข้อมูลแผนที่ทั้งก้อน (เหมือน map.json)
    โดยดึง "ค่าจริง" จาก DB สำหรับปี 2025 และทำสำเนาเป็น key '2568' ด้วย
    พร้อม zero-fill จังหวัดให้ครบเพื่อกันกราฟพัง
    """
    try:
        result = get_full_map_json_from_db(db, json_path)
        return format_response("0000", result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": str(e)})
    
@router.get("/summary", response_model=FormatResponseModel)
async def get_complaint_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard"))
):
    """
    สรุปเรื่องร้องเรียนแบบสั้น:
    - total: ทั้งหมดในปีปัจจุบัน (ตาม BKK)
    - in_progress: สถานะที่ยังดำเนินการ
    - completed: COMPLETED + REVIEWED
    ช่วงเวลาเหมือน get_full_map_json_from_db (BKK-year -> UTC)
    """
    try:
        result = get_complaint_summary_bkk_year(db)
        return format_response("0000", result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": str(e)})