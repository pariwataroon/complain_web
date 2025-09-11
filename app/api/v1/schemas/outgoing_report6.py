from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class OutgoingReport6AttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_size: Optional[str] = None
    file_type: Optional[str] = None

class OutgoingReport6AttachmentCreate(OutgoingReport6AttachmentBase):
    pass

class OutgoingReport6Attachment(OutgoingReport6AttachmentBase):
    id: UUID
    outgoing_report6_id: UUID
    created_at: datetime
    is_active: bool
    class Config:
        from_attributes = True

class OutgoingReport6Base(BaseModel):
    reference_number: str = Field(..., description="เลขอ้างอิง")
    reference_date: datetime = Field(..., description="วันที่เอกสาร")
    subject: str = Field(..., description="เรื่อง")
    complaint_number: str = Field(..., description="หมายเลขข้อร้องเรียน")
    complaint_number_date: datetime = Field(..., description="วันที่ของข้อร้องเรียน")
    signature_authority_user_id: UUID = Field(..., description="ผู้มีอำนาจลงนาม")
    department_id: Optional[UUID] = Field(None, description="หน่วยงาน")
    user_id: Optional[UUID] = Field(None, description="ผู้ใช้ที่เกี่ยวข้อง")
    other_department: Optional[str] = Field(None, description="หน่วยงานอื่นๆ")
    confidentiality_level: str = Field(..., description="ระดับความลับ")
    urgency_level: str = Field(..., description="ระดับความเร่งด่วน")
    document_number: str = Field(..., description="เลขที่เอกสาร")
    document_date: datetime = Field(..., description="วันที่เอกสาร")
    remarks: Optional[str] = Field(None, description="หมายเหตุ")
    proposal_purpose: Optional[str] = Field(None, description="เสนอเพื่อ")
    consideration_result: Optional[str] = Field(None, description="ผลการพิจารณา")
    complaint_id: Optional[UUID] = Field(None, description="ID ของข้อร้องเรียนที่เกี่ยวข้อง")

class OutgoingReport6Create(BaseModel):
    reference_number: str = Field(..., max_length=50)
    reference_date: datetime
    subject: str = Field(..., max_length=500)
    complaint_number: str = Field(..., max_length=50)
    complaint_number_date: datetime
    signature_authority_user_id: UUID
    department_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    other_department: Optional[str] = None
    confidentiality_level: str = Field(..., max_length=50)
    urgency_level: str = Field(..., max_length=50)
    document_number: str = Field(..., max_length=100)
    document_date: datetime
    remarks: Optional[str] = None
    proposal_purpose: Optional[str] = None
    consideration_result: Optional[str] = None
    complaint_id: Optional[UUID] = None
    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}

class OutgoingReport6Update(BaseModel):
    reference_number: Optional[str] = None
    reference_date: Optional[datetime] = None
    subject: Optional[str] = None
    signature_authority_user_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    other_department: Optional[str] = None
    confidentiality_level: Optional[str] = None
    urgency_level: Optional[str] = None
    document_number: Optional[str] = None
    document_date: Optional[datetime] = None
    remarks: Optional[str] = None
    proposal_purpose: Optional[str] = None
    consideration_result: Optional[str] = None
    complaint_id: Optional[UUID] = None

class OutgoingReport6(OutgoingReport6Base):
    id: UUID
    created_by: UUID
    updated_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    signature_authority_user_name: Optional[str] = Field(None, description="ชื่อผู้มีอำนาจลงนาม")
    department_name: Optional[str] = Field(None, description="ชื่อหน่วยงาน")
    user_name: Optional[str] = Field(None, description="ชื่อผู้ใช้ที่เกี่ยวข้อง")
    creator_name: Optional[str] = Field(None, description="ชื่อผู้สร้าง")
    attachments: List[OutgoingReport6Attachment] = Field(default=[], description="ไฟล์แนบ")
    class Config:
        from_attributes = True

class OutgoingReport6Options(BaseModel):
    signature_authorities: List[dict] = Field(default=[], description="รายการผู้มีอำนาจลงนาม")
    departments: List[dict] = Field(default=[], description="รายการหน่วยงาน")
    users: List[dict] = Field(default=[], description="รายการผู้ใช้")
    confidentiality_levels: List[str] = Field(default=["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"], description="ระดับความลับ")
    urgency_levels: List[str] = Field(default=["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"], description="ระดับความเร่งด่วน")
