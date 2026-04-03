from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class PendingTaskItem(BaseModel):
    id: UUID
    receive_reference_number: Optional[str] = None  # เลขรับ สรร. (reference_number4)
    reference_number: Optional[str] = None  # เลขที่อ้างอิง
    subject: Optional[str] = None  # เรื่อง
    assigned_date: Optional[datetime] = None  # วันที่รับงาน
    director_submission_date: Optional[datetime] = None  # วันที่เสนอ ผอ.สรร.
    department_name: Optional[str] = None  # หน่วยงานในสังกัด
    outside_department_name: Optional[str] = None  # หน่วยงานภายนอก
    document_number: Optional[str] = None  # เลขที่หนังสือจากส่วนราชการ
    status: Optional[str] = None  # สถานะเรื่อง
    days_in_progress: Optional[int] = None  # ดำเนินการมาแล้ว (วัน)
    assigned_officer_name: Optional[str] = None  # เจ้าหน้าที่ผู้รับผิดชอบ
    filing_type: Optional[str] = None  # ประเภทเรื่อง (new/additional)
    assigned_remark: Optional[str] = None  # หมายเหตุ
    remark: Optional[str] = None  # หมายเหตุ (alias)


class PendingTasksReport(BaseModel):
    items: List[PendingTaskItem] = []
    total: int
    page: int
    size: int
    total_pages: int
