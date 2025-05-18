import uuid
import enum
from sqlalchemy import (NVARCHAR, Boolean, Column, DateTime, 
                      ForeignKey, Integer, Text, JSON, Enum, String)
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

# Define complaint type (ประเภทผู้ร้องเรียน)
class ComplainantType(str, enum.Enum):
    INDIVIDUAL = "individual"   # บุคคลธรรมดา
    CORPORATE = "corporate"     # นิติบุคคล

# Define respondent type (ประเภทผู้ถูกร้องเรียน)
class RespondentType(str, enum.Enum):
    INDIVIDUAL = "individual"   # บุคคลธรรมดา
    CORPORATE = "corporate"     # นิติบุคคล
    GOVERNMENT = "government"   # หน่วยงานราชการ

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
    
    # ข้อมูลผู้ร้องเรียน (ความเรียบง่าย - เก็บเฉพาะสิ่งที่จำเป็น)
    complainant_data = Column(JSON, nullable=False, default="{}")
    complainant_type = Column(Enum(ComplainantType), default=ComplainantType.INDIVIDUAL, nullable=False)
    delegate_data = Column(JSON, nullable=True)  # ข้อมูลผู้รับมอบอำนาจ (ถ้ามี)
    
    # ข้อมูลผู้ถูกร้องเรียน
    respondent_data = Column(JSON, nullable=False, default="{}")
    respondent_type = Column(Enum(RespondentType), nullable=False)
    
    # เก็บข้อมูลทั้งหมดไว้อ้างอิง
    full_complaint_data = Column(JSON, nullable=True)
    
    # ข้อมูลเหตุการณ์
    incident_date = Column(DateTime, nullable=True)
    complaint_type = Column(NVARCHAR(100), nullable=True)
    
    # การยอมรับเงื่อนไข
    terms_accepted = Column(Boolean, default=True)
    
    # เวลาที่บันทึก
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ข้อมูลหน่วยงานที่รับผิดชอบ
    assigned_to = Column(NVARCHAR(200), nullable=True, comment="หน่วยงานที่รับผิดชอบ")
    assigned_date = Column(DateTime, nullable=True)
    
    # ข้อมูลการแก้ไขปัญหา
    resolution_summary = Column(NVARCHAR(2000), nullable=True)
    resolved_date = Column(DateTime, nullable=True)
    
    # ผู้สร้างข้อร้องเรียน
    created_by = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True)
    creator = relationship("User", back_populates="complaints")
    
    # เอกสารแนบ
    attachments = relationship("ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan")
    
    # ประวัติสถานะ
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan")

    # ข้อมูลเพิ่มเติมสำหรับเจ้าหน้าที่
    complaint_type_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaint_types.id"), nullable=True)
    complaint_subtype_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaint_subtypes.id"), nullable=True)
    complaint_channel_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaint_channels.id"), nullable=True)
    
    # ข้อมูลเลขที่อ้างอิงจากระบบอื่น
    reference_number = Column(NVARCHAR(100), nullable=True, comment="เลข อปค.")
    reference_number2 = Column(NVARCHAR(100), nullable=True, comment="เลข สตร.")
    reference_number3 = Column(NVARCHAR(100), nullable=True, comment="เลขหนังสือ")
    
    # ข้อมูลวันที่ลงทะเบียน
    registration_date = Column(DateTime, nullable=True)
    
    # ความลับ
    confidentiality_level = Column(String(50), nullable=True, comment="ขั้นความลับ")
    urgency_level = Column(String(50), nullable=True, comment="ความเร่งด่วน")
    
    # หน่วยงานที่ส่งเรื่องมาถึง กค.
    agency_sender = Column(NVARCHAR(200), nullable=True, comment="หน่วยงานที่ส่งเรื่องมาถึง กค.")
    
    # Relationships
    complaint_type_relation = relationship("ComplaintType", back_populates="complaints")
    complaint_subtype_relation = relationship("ComplaintSubType", back_populates="complaints")
    complaint_channel_relation = relationship("ComplaintChannel", back_populates="complaints")

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