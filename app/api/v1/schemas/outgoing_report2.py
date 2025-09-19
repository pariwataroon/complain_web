from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class OutgoingReport2AttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_size: Optional[str] = None
    file_type: Optional[str] = None

class OutgoingReport2AttachmentCreate(OutgoingReport2AttachmentBase):
    pass

class OutgoingReport2Attachment(OutgoingReport2AttachmentBase):
    id: UUID
    outgoing_report2_id: UUID
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class OutgoingReport2Base(BaseModel):
    position_id: UUID = Field(..., description="ตำแหน่งที่เกี่ยวข้อง")
    position_other_text: Optional[str] = Field(None, description="ระบุตำแหน่ง (เมื่อเลือก 'อื่นๆ')")
    complaint_number: str = Field(..., description="หมายเลขข้อร้องเรียน")
    complaint_number_date: datetime = Field(..., description="วันที่ของข้อร้องเรียน")
    subject: str = Field(..., description="เรื่อง")
    department_id: Optional[UUID] = Field(None, description="(deprecated) หน่วยงานภายในเดิม ใช้ outside_department_id แทน")
    outside_department_id: Optional[UUID] = Field(None, description="หน่วยงานภายนอก (ใหม่)")
    user_id: Optional[UUID] = Field(None, description="ผู้ใช้ที่เกี่ยวข้อง")
    signature_authority_user_id: UUID = Field(..., description="ผู้มีอำนาจลงนาม")
    confidentiality_level: str = Field(..., description="ระดับความลับ")
    urgency_level: str = Field(..., description="ระดับความเร่งด่วน")
    document_number: str = Field(..., description="เลขที่เอกสาร")
    document_date: datetime = Field(..., description="วันที่เอกสาร")
    remarks: Optional[str] = Field(None, description="หมายเหตุ")
    complaint_id: Optional[UUID] = Field(None, description="ID ของข้อร้องเรียนที่เกี่ยวข้อง")

class OutgoingReport2Create(BaseModel):
    position_id: UUID
    position_other_text: Optional[str] = None
    complaint_number: str = Field(..., max_length=50)
    complaint_number_date: datetime
    subject: str = Field(..., max_length=500)
    department_id: Optional[UUID] = None  # deprecated
    outside_department_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    signature_authority_user_id: UUID
    confidentiality_level: str = Field(..., max_length=50)
    urgency_level: str = Field(..., max_length=50)
    document_number: str = Field(..., max_length=100, description="เลขที่เอกสาร")
    document_date: datetime = Field(..., description="วันที่เอกสาร")
    remarks: Optional[str] = None
    complaint_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class OutgoingReport2Update(BaseModel):
    position_id: Optional[UUID] = None
    position_other_text: Optional[str] = None
    complaint_number: Optional[str] = None
    complaint_number_date: Optional[datetime] = None
    subject: Optional[str] = None
    department_id: Optional[UUID] = None  # deprecated
    outside_department_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    signature_authority_user_id: Optional[UUID] = None
    confidentiality_level: Optional[str] = None
    urgency_level: Optional[str] = None
    document_number: Optional[str] = None
    document_date: Optional[datetime] = None
    remarks: Optional[str] = None
    complaint_id: Optional[UUID] = None

class OutgoingReport2(OutgoingReport2Base):
    id: UUID
    created_by: UUID
    updated_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    # ข้อมูลเพิ่มเติมจาก relationships
    position_name: Optional[str] = Field(None, description="ชื่อตำแหน่ง")
    signature_authority_user_name: Optional[str] = Field(None, description="ชื่อผู้มีอำนาจลงนาม")
    department_name: Optional[str] = Field(None, description="ชื่อหน่วยงาน")
    user_name: Optional[str] = Field(None, description="ชื่อผู้ใช้ที่เกี่ยวข้อง")
    creator_name: Optional[str] = Field(None, description="ชื่อผู้สร้าง")
    
    # ไฟล์แนบ
    attachments: List[OutgoingReport2Attachment] = Field(default=[], description="ไฟล์แนบ")
    
    class Config:
        from_attributes = True

class OutgoingReport2Options(BaseModel):
    """ตัวเลือกสำหรับ dropdown ต่างๆ"""
    positions: List[dict] = Field(default=[], description="รายการตำแหน่ง")
    signature_authorities: List[dict] = Field(default=[], description="รายการผู้มีอำนาจลงนาม")
    departments: List[dict] = Field(default=[], description="(deprecated) รายการหน่วยงานภายใน")
    outside_departments: List[dict] = Field(default=[], description="รายการหน่วยงานภายนอก")
    users: List[dict] = Field(default=[], description="รายการผู้ใช้")
    confidentiality_levels: List[str] = Field(default=["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"], description="ระดับความลับ")
    urgency_levels: List[str] = Field(default=["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"], description="ระดับความเร่งด่วน")