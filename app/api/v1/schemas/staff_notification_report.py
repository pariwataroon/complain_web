"""
Schema สำหรับรายงานการรับงานของเจ้าหน้าที่
Staff Notification Report Schema
"""
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class ComplainantInfo(BaseModel):
    """ข้อมูลผู้ร้องเรียน"""
    name: Optional[str] = None
    type: Optional[str] = None  # individual, corporate


class StaffNotificationItem(BaseModel):
    """รายการงานที่เจ้าหน้าที่รับผิดชอบ"""
    id: str
    complaint_number: str  # เลข สร.
    claimant_name: str  # ชื่อผู้ร้องเรียน
    issue: str  # เรื่องที่ร้องเรียน (subject)
    responsible_officer: Optional[str] = None  # เจ้าหน้าที่ผู้รับผิดชอบ
    receipt_number: Optional[str] = None  # เลข สป.กค.
    officer_receive_date: Optional[str] = None  # วันที่เจ้าหน้าที่รับงาน (formatted)
    officer_receive_date_iso: Optional[datetime] = None  # วันที่เจ้าหน้าที่รับงาน (ISO)
    issue_type: Optional[str] = None  # ประเภทเรื่อง
    count_times: int = 0  # จำนวนครั้ง
    status: Optional[str] = None  # สถานะ
    assigned_date: Optional[datetime] = None  # วันที่มอบหมาย
    confirm_assigned_status: Optional[bool] = None  # สถานะการยืนยัน (True=ยืนยัน, False=ปฏิเสธ, None=รอ)
    created_at: Optional[datetime] = None
    # ฟิลด์ time tracking
    time_status: Optional[str] = None  # "normal" | "warning" | "overdue"
    days_remaining: Optional[int] = None  # จำนวนวันที่เหลือ (ติดลบ = เกินกำหนด)
    time_limit_days: Optional[int] = None  # ระยะเวลาที่กำหนด
    time_limit_label: Optional[str] = None  # คำอธิบายภาษาไทย

    class Config:
        from_attributes = True


class StaffNotificationReportResponse(BaseModel):
    """Response รายงานการรับงานของเจ้าหน้าที่"""
    total: int
    items: List[StaffNotificationItem]

    # สถิติเพิ่มเติม
    total_confirmed: int = 0  # จำนวนงานที่ยืนยันรับแล้ว
    total_pending: int = 0  # จำนวนงานที่รอยืนยัน
    total_rejected: int = 0  # จำนวนงานที่ปฏิเสธ
    # สถิติ time tracking
    total_overdue: int = 0
    total_warning: int = 0
    total_normal: int = 0
    # ค่า time settings ที่ใช้
    time_settings: Optional[dict] = None

    class Config:
        from_attributes = True


class StaffNotificationFilterParams(BaseModel):
    """Filter parameters สำหรับรายงาน"""
    user_id: Optional[str] = None  # filter ตาม user_id เฉพาะ
    status: Optional[str] = None  # filter ตามสถานะงาน
    confirm_status: Optional[bool] = None  # filter ตามสถานะการยืนยัน
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search: Optional[str] = None  # ค้นหาเลขที่เรื่อง หรือ subject
    show_alerts_only: bool = False  # แสดงเฉพาะรายการที่ต้องเตือน (warning/overdue)
    skip: int = 0
    limit: int = 100
