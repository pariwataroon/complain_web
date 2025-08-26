# app/api/v1/schemas/outgoing_report5.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# ---------- Attachment ----------
class OutgoingReport5Attachment(BaseModel):
    id: UUID
    file_name: str
    file_path: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- Base ----------
class OutgoingReport5Base(BaseModel):
    receive_number: str = Field(..., description="เลขรับเรื่องผลการพิจารณา (ภายใน)")
    receive_date: datetime = Field(..., description="วันที่รับเรื่องผลการพิจารณา")
    subject: str = Field(..., description="เรื่อง")
    complaint_number: str = Field(..., description="เลขที่ข้อร้องเรียน")
    complaint_number_date: datetime = Field(..., description="วันที่ข้อร้องเรียน")

    # ผู้เกี่ยวข้อง/การจัดชั้นความลับ
    department_id: UUID = Field(..., description="หน่วยงานผู้รับผิดชอบ")
    signature_authority_user_id: Optional[UUID] = Field(None, description="ผู้มีอำนาจลงนาม (ถ้ามี)")
    user_id: Optional[UUID] = Field(None, description="ผู้ปฏิบัติ (ถ้ามี)")
    confidentiality_level: Optional[str] = Field("ปกติ", description="ขั้นความลับ")
    urgency_level: Optional[str] = Field("ปกติ", description="ความเร่งด่วน")

    # อ้างอิงเสริม (optional)
    agency_reference_number: Optional[str] = Field(None, description="เลขอ้างอิงจากหน่วยงานต้นทาง")
    agency_reference_date: Optional[datetime] = None
    internal_register_number: Optional[str] = None
    internal_register_date: Optional[datetime] = None
    present_to_director_date: Optional[datetime] = None
    document_number: str = Field(..., description="เลขที่เอกสาร")
    document_date: datetime = Field(..., description="วันที่เอกสาร")

    # เชื่อม complaint
    complaint_id: Optional[UUID] = None
    remarks: Optional[str] = None


class OutgoingReport5Create(OutgoingReport5Base):
    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}


class OutgoingReport5Update(BaseModel):
    # ทั้งหมด optional สำหรับ patch
    receive_number: Optional[str] = None
    receive_date: Optional[datetime] = None
    subject: Optional[str] = None
    complaint_number: Optional[str] = None
    complaint_number_date: Optional[datetime] = None
    department_id: Optional[UUID] = None
    signature_authority_user_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    confidentiality_level: Optional[str] = None
    urgency_level: Optional[str] = None
    agency_reference_number: Optional[str] = None
    agency_reference_date: Optional[datetime] = None
    internal_register_number: Optional[str] = None
    internal_register_date: Optional[datetime] = None
    present_to_director_date: Optional[datetime] = None
    document_number: Optional[str] = None
    document_date: Optional[datetime] = None
    complaint_id: Optional[UUID] = None
    remarks: Optional[str] = None


class OutgoingReport5(BaseModel):
    id: UUID
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: bool = True

    # fields จาก Base
    receive_number: str
    receive_date: datetime
    subject: str
    complaint_number: str
    complaint_number_date: datetime
    department_id: UUID
    signature_authority_user_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    confidentiality_level: Optional[str] = None
    urgency_level: Optional[str] = None
    agency_reference_number: Optional[str] = None
    agency_reference_date: Optional[datetime] = None
    internal_register_number: Optional[str] = None
    internal_register_date: Optional[datetime] = None
    present_to_director_date: Optional[datetime] = None
    document_number: str = Field(..., description="เลขที่เอกสาร")
    document_date: datetime = Field(..., description="วันที่เอกสาร")
    complaint_id: Optional[UUID] = None
    remarks: Optional[str] = None

    # display ช่วยหน้า UI
    department_name: Optional[str] = None
    signature_authority_user_name: Optional[str] = None
    creator_name: Optional[str] = None

    attachments: List[OutgoingReport5Attachment] = Field(default=[])

    class Config:
        from_attributes = True


class OutgoingReport5Options(BaseModel):
    departments: List[dict] = Field(default=[])
    signature_authorities: List[dict] = Field(default=[])
    users: List[dict] = Field(default=[])
    confidentiality_levels: List[str] = Field(default=["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"])
    urgency_levels: List[str] = Field(default=["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"])
