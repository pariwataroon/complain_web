import uuid
from sqlalchemy import Column, ForeignKey, DateTime, NVARCHAR, Boolean
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from config.database import Base

class OutgoingReport(Base):
    __tablename__ = "outgoing_reports" # แบบรายงานส่งหน่วยงานที่เกี่ยวข้อง
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    
    position_id = Column(UNIQUEIDENTIFIER, ForeignKey("positions.id"), nullable=False)
    reference_number = Column(NVARCHAR(50), nullable=False)
    reference_date = Column(DateTime, nullable=False)
    subject = Column(NVARCHAR(500), nullable=False)
    complaint_number = Column(NVARCHAR(50), nullable=False)
    complaint_number_date = Column(DateTime, nullable=False)
    signature_authority_user_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=False)
    department_id = Column(UNIQUEIDENTIFIER, ForeignKey("departments.id"), nullable=False)
    confidentiality_level = Column(NVARCHAR(50), nullable=False)
    urgency_level = Column(NVARCHAR(50), nullable=False)
    document_number = Column(NVARCHAR(100), nullable=False)
    document_date = Column(DateTime, nullable=False)
    remarks = Column(NVARCHAR(1000), nullable=True)
    complaint_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_complaints.id"), nullable=True)
    
    created_by = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=False)
    updated_by = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    position = relationship("Position", foreign_keys=[position_id])
    signature_authority_user = relationship("User", foreign_keys=[signature_authority_user_id])
    department = relationship("Department", foreign_keys=[department_id])
    complaint = relationship("Complaint", back_populates="outgoing_reports", foreign_keys=[complaint_id])
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    
    attachments = relationship("OutgoingReportAttachment", back_populates="outgoing_report", cascade="all, delete-orphan")

class OutgoingReportAttachment(Base):
    __tablename__ = "outgoing_report_attachments"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    outgoing_report_id = Column(UNIQUEIDENTIFIER, ForeignKey("outgoing_reports.id"), nullable=False)
    
    file_name = Column(NVARCHAR(255), nullable=False)
    file_path = Column(NVARCHAR(500), nullable=False)
    file_size = Column(NVARCHAR(50), nullable=True)
    file_type = Column(NVARCHAR(100), nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)
    
    outgoing_report = relationship("OutgoingReport", back_populates="attachments")