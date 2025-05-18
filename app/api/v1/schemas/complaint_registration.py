from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class ComplaintRegistrationRequest(BaseModel):
    """Schema สำหรับการลงทะเบียนเรื่องร้องเรียนโดยเจ้าหน้าที่"""
    complaint_type_id: UUID = Field(..., description="รหัสประเภทเรื่องร้องเรียน")
    complaint_subtype_id: UUID = Field(..., description="รหัสประเภทเรื่องร้องเรียนย่อย")
    complaint_channel_id: UUID = Field(..., description="รหัสช่องทางการร้องเรียน")
    
    reference_number: Optional[str] = Field(None, description="เลข อปค.")
    reference_number2: Optional[str] = Field(None, description="เลข สตร.")
    reference_number3: Optional[str] = Field(None, description="เลขหนังสือ")
    
    registration_date: datetime = Field(..., description="วันที่ลงทะเบียน")
    
    confidentiality_level: Optional[str] = Field(None, description="ขั้นความลับ")
    urgency_level: Optional[str] = Field(None, description="ความเร่งด่วน")
    
    agency_sender: Optional[str] = Field(None, description="หน่วยงานที่ส่งเรื่องมาถึง กค.")

class ComplaintRegistrationResponse(ComplaintRegistrationRequest):
    id: UUID
    complaint_number: str
    updated_at: datetime
    
    class Config:
        from_attributes = True