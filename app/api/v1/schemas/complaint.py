from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from uuid import UUID
from models.comp_complaint import ComplaintStatus

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
    created_at: datetime
    status: ComplaintStatus
    complaint_type: Optional[str] = None
    complainant_name: str
    respondent_name: Optional[str] = None
    
    class Config:
        from_attributes = True

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