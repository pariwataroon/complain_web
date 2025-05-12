import uuid
import enum
from sqlalchemy import (NVARCHAR, Boolean, Column, DateTime, 
                      ForeignKey, Integer, Text, JSON, Enum)
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base

# Define complaint status enum
class ComplaintStatus(str, enum.Enum):
    # Based on the tracking diagrams in the images
    SUBMITTED = "submitted"                 # ส่งคำร้อง
    SENT_TO_AGENCY = "sent_to_agency"       # ส่งหน่วยงาน
    IN_PROCESS = "in_process"               # อยู่ระหว่างดำเนินการ
    IN_REVIEW = "in_review"                 # อยู่ระหว่างการพิจารณา
    TRACKING = "tracking"                   # ติดตามผลการพิจารณา
    REVIEWED = "reviewed"                   # แจ้งผลการพิจารณา
    COMPLETED = "completed"                 # เสร็จสิ้น
    CANCELLED = "cancelled"                 # ยกเลิก

class Complaint(Base):
    __tablename__ = "comp_complaints"

    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_number = Column(NVARCHAR(100), unique=True, nullable=False)
    subject = Column(NVARCHAR(500), nullable=False)
    description = Column(NVARCHAR(2000))
    # Using the enum for status
    status = Column(
        Enum(ComplaintStatus), 
        default=ComplaintStatus.SUBMITTED, 
        nullable=False,
        comment="สถานะการร้องเรียน: submitted=ส่งคำร้อง, sent_to_agency=ส่งหน่วยงาน, in_process=อยู่ระหว่างดำเนินการ, in_review=อยู่ระหว่างการพิจารณา, tracking=ติดตามผลการพิจารณา, reviewed=แจ้งผลการพิจารณา, completed=เสร็จสิ้น, cancelled=ยกเลิก"
    )
    
    # Complainant information
    complainant_data = Column(JSON, nullable=False)
    complainant_type = Column(NVARCHAR(50), default="general")  # general or corporate
    delegate_data = Column(JSON, nullable=True)  # Optional delegate information
    
    # Respondent information
    respondent_data = Column(JSON, nullable=False)
    respondent_type = Column(NVARCHAR(50), nullable=False)  # individual, corporate or government
    
    # Incident information
    incident_date = Column(DateTime, nullable=True)
    complaint_type = Column(NVARCHAR(100), nullable=True)
    
    # Acceptance of terms
    terms_accepted = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Agency handling
    assigned_to = Column(NVARCHAR(200), nullable=True, comment="หน่วยงานที่รับผิดชอบ")
    assigned_date = Column(DateTime, nullable=True)
    
    # Resolution information
    resolution_summary = Column(NVARCHAR(2000), nullable=True)
    resolved_date = Column(DateTime, nullable=True)
    
    # User who created the complaint
    created_by = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True)
    creator = relationship("User", back_populates="complaints")
    
    # Attachments
    attachments = relationship("ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan")
    
    # Timeline tracking
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintAttachment(Base):
    __tablename__ = "comp_complaint_attachments"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_complaints.id"), nullable=False)
    file_name = Column(NVARCHAR(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_url = Column(NVARCHAR(1024), nullable=False)
    file_type = Column(NVARCHAR(100), nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    complaint = relationship("Complaint", back_populates="attachments")

class ComplaintStatusHistory(Base):
    """Track complaint status changes over time"""
    __tablename__ = "comp_complaint_status_history"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_complaints.id"), nullable=False)
    status = Column(Enum(ComplaintStatus), nullable=False)
    notes = Column(NVARCHAR(1000), nullable=True)
    changed_by = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True)
    changed_at = Column(DateTime, default=func.now())
    
    # Relationships
    complaint = relationship("Complaint", back_populates="status_history")
    user = relationship("User")