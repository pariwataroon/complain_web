from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class OutgoingReport3AttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_size: Optional[str] = None
    file_type: Optional[str] = None

class OutgoingReport3AttachmentCreate(OutgoingReport3AttachmentBase):
    pass

class OutgoingReport3Attachment(OutgoingReport3AttachmentBase):
    id: UUID
    outgoing_report3_id: UUID
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class OutgoingReport3Base(BaseModel):
    position_id: UUID = Field(..., description="ตำแหน่งที่เกี่ยวข้อง")
    complaint_number: str = Field(..., description="หมายเลขข้อร้องเรียน")  # ตาม model
    complaint_number_date: datetime = Field(..., description="วันที่ของข้อร้องเรียน")  # ตาม model
    subject: str = Field(..., description="เรื่อง")
    signature_authority_user_id: UUID = Field(..., description="ผู้มีอำนาจลงนาม")
    department_id: UUID = Field(..., description="หน่วยงาน")
    confidentiality_level: str = Field(..., description="ระดับความลับ")
    urgency_level: str = Field(..., description="ระดับความเร่งด่วน")
    document_number: str = Field(..., description="เลขที่เอกสาร")
    document_date: datetime = Field(..., description="วันที่เอกสาร")
    remarks: Optional[str] = Field(None, description="หมายเหตุ")
    complaint_id: Optional[UUID] = Field(None, description="ID ของข้อร้องเรียนที่เกี่ยวข้อง")

class OutgoingReport3Create(BaseModel):
    position_id: UUID
    complaint_number: str = Field(..., max_length=50)  # ตาม model
    complaint_number_date: datetime  # ตาม model
    subject: str = Field(..., max_length=500)
    signature_authority_user_id: UUID
    department_id: UUID
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

class OutgoingReport3Update(BaseModel):
    position_id: Optional[UUID] = None
    complaint_number: Optional[str] = None
    complaint_number_date: Optional[datetime] = None
    subject: Optional[str] = None
    signature_authority_user_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    confidentiality_level: Optional[str] = None
    urgency_level: Optional[str] = None
    document_number: Optional[str] = None
    document_date: Optional[datetime] = None
    remarks: Optional[str] = None
    complaint_id: Optional[UUID] = None

class OutgoingReport3(OutgoingReport3Base):
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
    creator_name: Optional[str] = Field(None, description="ชื่อผู้สร้าง")
    
    # ไฟล์แนบ
    attachments: List[OutgoingReport3Attachment] = Field(default=[], description="ไฟล์แนบ")
    
    class Config:
        from_attributes = True

class OutgoingReport3Options(BaseModel):
    """ตัวเลือกสำหรับ dropdown ต่างๆ"""
    positions: List[dict] = Field(default=[], description="รายการตำแหน่ง")
    signature_authorities: List[dict] = Field(default=[], description="รายการผู้มีอำนาจลงนาม")
    departments: List[dict] = Field(default=[], description="รายการหน่วยงาน")
    confidentiality_levels: List[str] = Field(default=["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"], description="ระดับความลับ")
    urgency_levels: List[str] = Field(default=["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"], description="ระดับความเร่งด่วน")