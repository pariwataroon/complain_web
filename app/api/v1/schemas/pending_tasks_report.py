from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class PendingTaskItem(BaseModel):
    id: UUID
    receive_reference_number: Optional[str] = None  # เลขรับ สรร. (reference_number4)
    reference_number: Optional[str] = None  # เลขที่อ้างอิง (reference_number / reference_number2 / ... รวมหลัก)
    subject: Optional[str] = None  # เรื่อง
    assigned_date: Optional[datetime] = None  # วันที่รับงาน (assigned_date)
    director_submission_date: Optional[datetime] = None  # วันที่เสนอ ผอ.สรร.
    department_name: Optional[str] = None  # หน่วยงานในสังกัด (assigned_to)
    document_number: Optional[str] = None  # เลขที่หนังสือจากส่วนราชการ (document_number)
    status: Optional[str] = None  # สถานะเรื่อง
    days_in_progress: Optional[int] = None  # ดำเนินการมาแล้ว (วัน)
    assigned_officer_name: Optional[str] = None  # เจ้าหน้าที่ผู้รับผิดชอบ


class PendingTasksReport(BaseModel):
    items: List[PendingTaskItem] = []
    total: int
    page: int
    size: int
    total_pages: int
