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

from app.api.v1.controllers.dashboard_controller import get_full_map_json_from_db, get_complaint_summary_bkk_year, get_donut_types_grouped_by_department, get_donut_by_channels, get_department_ranking_by_date

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
    year: Optional[int] = Query(None, description="ปี ค.ศ. ที่ต้องการ (เช่น 2025)"),
    only_year: bool = Query(False, description="ส่งเฉพาะปีที่เลือก (ไม่รวมปีจากไฟล์ seed)"),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard"))
):
    """
    ส่งออกข้อมูลแผนที่ทั้งก้อน (เหมือน map.json)
    - ถ้า only_year=true จะส่งเฉพาะปี พ.ศ. ที่คำนวณจาก year เท่านั้น
    """
    try:
        result = get_full_map_json_from_db(db, json_path, year=year, only_year=only_year)
        return format_response("0000", result)
    except Exception as e:
        import traceback; traceback.print_exc()
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

@router.get("/donut/types", response_model=FormatResponseModel)
async def donut_types_endpoint(
    year: Optional[int] = Query(None),
    department_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = get_donut_types_grouped_by_department(db, year=year, department_id=department_id)
        return format_response("0000", data)
    except Exception as e:
        import traceback; traceback.print_exc()
        return format_response("5000", {"error": str(e)})

@router.get("/donut/channels", response_model=FormatResponseModel)
async def donut_channels_endpoint(
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    try:
        data = get_donut_by_channels(db, year=year)
        return format_response("0000", data)
    except Exception as e:
        import traceback; traceback.print_exc()
        return format_response("5000", {"error": str(e)})
    
@router.get("/departments/ranking", response_model=FormatResponseModel)
async def get_department_ranking_endpoint(
    date_from: Optional[str] = Query(None, description="วันที่เริ่ม (เช่น 2025-01-31 หรือ 31/01/2568)"),
    date_to: Optional[str]   = Query(None, description="วันที่สิ้นสุด (เช่น 2025-04-02 หรือ 02/04/2568)"),
    limit_top: Optional[int] = Query(5, ge=1, le=50, description="จำนวนอันดับมากที่สุด"),
    limit_bottom: Optional[int] = Query(5, ge=1, le=50, description="จำนวนอันดับน้อยที่สุด"),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("dashboard")),
):
    """
    จัดอันดับหน่วยงานที่มีเรื่อง 'มากที่สุด' และ 'น้อยที่สุด' ตามช่วงวันที่
    - ผูก complaint ↔ department ผ่าน outgoing_reports(1–4) แบบเดียวกับโดนัท
    - วันที่ใช้เวลาไทย แล้วแปลงเป็น UTC ก่อนคิวรี
    """
    try:
        data = get_department_ranking_by_date(
            db,
            date_from=date_from,
            date_to=date_to,
            limit_top=limit_top or 5,
            limit_bottom=limit_bottom or 5,
        )
        return format_response("0000", data)
    except Exception as e:
        import traceback; traceback.print_exc()
        return format_response("5000", {"error": str(e)})