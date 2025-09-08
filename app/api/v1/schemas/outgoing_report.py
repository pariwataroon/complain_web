from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class OutgoingReportAttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_size: Optional[str] = None
    file_type: Optional[str] = None

class OutgoingReportAttachmentCreate(OutgoingReportAttachmentBase):
    pass

class OutgoingReportAttachment(OutgoingReportAttachmentBase):
    id: UUID
    outgoing_report_id: UUID
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class OutgoingReportBase(BaseModel):
    # 🔥 แก้ไข: ใช้ position_id แทน report_type
    position_id: UUID = Field(..., description="ตำแหน่งที่เกี่ยวข้อง")
    position_other_text: Optional[str] = Field(None, description="ระบุตำแหน่ง (เมื่อเลือก 'อื่นๆ')")
    
    # 🔥 แก้ไข: ใช้ reference_number และ reference_date
    reference_number: str = Field(..., description="เลข สป.กค")
    reference_date: datetime = Field(..., description="วันที่เอกสาร สป.กค")
    
    subject: str = Field(..., description="เรื่อง")
    
    # 🔥 เพิ่ม: ข้อมูลข้อร้องเรียน
    complaint_number: str = Field(..., description="หมายเลขข้อร้องเรียน")
    complaint_number_date: datetime = Field(..., description="วันที่ของข้อร้องเรียน")
    
    # 🔥 เพิ่ม: ผู้มีอำนาจลงนามและหน่วยงาน
    signature_authority_user_id: UUID = Field(..., description="ผู้มีอำนาจลงนาม")
    department_id: UUID = Field(..., description="หน่วยงาน")
    
    # ระดับความลับและความเร่งด่วน
    confidentiality_level: str = Field(..., description="ระดับความลับ")
    urgency_level: str = Field(..., description="ระดับความเร่งด่วน")
    
    # เลขเอกสารและวันที่เอกสาร (บังคับ)
    document_number: str = Field(..., description="เลขที่เอกสาร")
    document_date: datetime = Field(..., description="วันที่เอกสาร")
    
    # หมายเหตุ
    remarks: Optional[str] = Field(None, description="หมายเหตุ")
    
    # ข้อร้องเรียนที่เกี่ยวข้อง (optional)
    complaint_id: Optional[UUID] = Field(None, description="ID ของข้อร้องเรียนที่เกี่ยวข้อง")

class OutgoingReportCreate(BaseModel):
    position_id: UUID
    position_other_text: Optional[str] = None
    reference_number: str = Field(..., max_length=50)
    reference_date: datetime
    subject: str = Field(..., max_length=500)
    complaint_number: str = Field(..., max_length=50)
    complaint_number_date: datetime
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

class OutgoingReportUpdate(BaseModel):
    position_id: Optional[UUID] = None
    position_other_text: Optional[str] = None
    reference_number: Optional[str] = None
    reference_date: Optional[datetime] = None
    subject: Optional[str] = None
    complaint_number: Optional[str] = None
    complaint_number_date: Optional[datetime] = None
    signature_authority_user_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    confidentiality_level: Optional[str] = None
    urgency_level: Optional[str] = None
    document_number: Optional[str] = None
    document_date: Optional[datetime] = None
    remarks: Optional[str] = None
    complaint_id: Optional[UUID] = None

class OutgoingReport(OutgoingReportBase):
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
    attachments: List[OutgoingReportAttachment] = Field(default=[], description="ไฟล์แนบ")
    
    class Config:
        from_attributes = True

class OutgoingReportOptions(BaseModel):
    """ตัวเลือกสำหรับ dropdown ต่างๆ"""
    positions: List[dict] = Field(default=[], description="รายการตำแหน่ง")
    signature_authorities: List[dict] = Field(default=[], description="รายการผู้มีอำนาจลงนาม")
    departments: List[dict] = Field(default=[], description="รายการหน่วยงาน")
    confidentiality_levels: List[str] = Field(default=["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"], description="ระดับความลับ")
    urgency_levels: List[str] = Field(default=["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"], description="ระดับความเร่งด่วน")