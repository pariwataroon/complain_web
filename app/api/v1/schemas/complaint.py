from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from uuid import UUID
from models.comp_complaint import ComplaintStatus
from .pagination import PaginatedResponse

class ComplaintCreate(BaseModel):
    # Direct fields instead of nested structure
    # Step 1 fields (Complainant information)
    idCard: str
    name: str
    address: str
    phone: str
    email: str
    province: str
    districts: str
    subdistricts: str
    zipcode: str
    
    # Optional delegate fields
    delegate_idCard: Optional[str] = None
    delegate_name: Optional[str] = None
    delegate_address: Optional[str] = None
    delegate_phone: Optional[str] = None
    delegate_email: Optional[str] = None
    delegate_province: Optional[str] = None
    delegate_districts: Optional[str] = None
    delegate_subdistricts: Optional[str] = None
    delegate_zipcode: Optional[str] = None
    
    # Step 2 fields (Respondent information)
    respondent_type: str = Field(..., description="Type of respondent: individual, corporate, or government")
    respondent_idCard: Optional[str] = None
    respondent_name: str
    respondent_email: Optional[str] = None
    respondent_address: str
    respondent_phone: Optional[str] = None
    respondent_province: str
    respondent_districts: str
    respondent_subdistricts: str
    respondent_zipcode: str
    
    # Step 3 fields (Complaint details)
    incidentDate: datetime
    complaintType: str
    subject: str
    description: str
    attachment: List[Dict[str, Any]] = []
    
    # Step 4 fields (Acceptance)
    accepted: bool = True

class ComplaintListItem(BaseModel):
    id: UUID
    complaint_number: str
    subject: str
    complaint_type: str
    complaint_subtype: Optional[str] = ""
    status: str
    created_at: datetime
    complainant_name: str
    respondent_name: str
    # เพิ่มฟิลด์ใหม่
    incident_location: Optional[str] = ""
    assigned_to: Optional[str] = ""
    assigned_remark: Optional[str] = ""
    urgency_level: Optional[str] = "LOW"
    severity_level: Optional[str] = "LOW"
    
    class Config:
        from_attributes = True

class ComplaintListItemEnhanced(BaseModel):
    id: UUID
    complaint_number: str
    subject: str
    complaint_type: str
    complaint_subtype: Optional[str] = ""
    status: str
    created_at: datetime
    complainant_name: str
    respondent_name: str
    # เพิ่มฟิลด์ใหม่
    incident_location: Optional[str] = ""
    assigned_to: Optional[str] = ""
    assigned_remark: Optional[str] = ""
    urgency_level: Optional[str] = "LOW"
    severity_level: Optional[str] = "LOW"
    # เพิ่มฟิลด์ phone และ description จาก complainant_data สำหรับ enhanced version
    complainant_phone: Optional[str] = ""
    complainant_description: Optional[str] = ""
    
    class Config:
        from_attributes = True

class ComplaintList(PaginatedResponse[ComplaintListItem]):
    """รายการข้อร้องเรียนพร้อม pagination"""
    pass

class AttachmentInfo(BaseModel):
    fileName: str
    fileSize: int
    fileUrl: str
    fileType: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: UUID
    complaint_number: str
    subject: str
    description: str
    status: ComplaintStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    assigned_date: Optional[datetime] = None
    resolution_summary: Optional[str] = None
    resolved_date: Optional[datetime] = None
    
    # Structured data
    step1: Dict[str, Any]
    step2: Dict[str, Any]
    step3: Dict[str, Any]
    step4: Dict[str, Any]
    
    class Config:
        from_attributes = True

class StatusUpdateRequest(BaseModel):
    status: ComplaintStatus
    notes: Optional[str] = None

class ComplaintDetails(BaseModel):
    confidentiality_level: Optional[str] = None
    urgency_level: Optional[str] = None
    severity_level: Optional[str] = None
    incident_province_id: Optional[int] = None
    incident_province: Optional[str] = None
    incident_district_id: Optional[int] = None
    incident_district: Optional[str] = None
    incident_subdistrict_id: Optional[str] = None
    incident_subdistrict: Optional[str] = None
    assigned_officer_id: Optional[UUID] = None
    progress_percentage: Optional[int] = None
    processing_notes: Optional[str] = None
    parent_complaint_id: Optional[UUID] = None
    related_complaints: Optional[List[str]] = None
    
    class Config:
        from_attributes = True

class SatisfactionUpdate(BaseModel):
    rating: int
    comment: Optional[str] = None
    
    class Config:
        from_attributes = True