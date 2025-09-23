from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class NewAdditionalComplaintItem(BaseModel):
    id: UUID
    received_date: Optional[datetime] = None  # วันที่รับเรื่อง (created_at หรือ registration_date)
    reference_number_sar: Optional[str] = None  # เลข สรร. (reference_number4)
    complaint_number: Optional[str] = None
    complainant_name: Optional[str] = None  # ชื่อ - สกุล (ผู้ร้อง)
    assigned_officer_name: Optional[str] = None  # เจ้าหน้าที่ผู้รับผิดชอบ
    department_name: Optional[str] = None  # หน่วยงาน (assigned_to)
    complaint_type: Optional[str] = None  # ประเภทเรื่อง
    remark: Optional[str] = None  # หมายเหตุ (assigned_remark)
    filing_type: Optional[str] = None  # new / additional / anonymous


class NewAdditionalComplaintReport(BaseModel):
    items: List[NewAdditionalComplaintItem] = []
    total: int
    page: int
    size: int
    total_pages: int
