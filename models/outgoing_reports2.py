import uuid
from sqlalchemy import Column, ForeignKey, DateTime, NVARCHAR, Boolean
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base

class OutgoingReport2(Base):
    __tablename__ = "outgoing_reports2" # แบบรายงานแจ้งผู้ร้องเรียน / ส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    
    position_id = Column(UNIQUEIDENTIFIER, ForeignKey("positions.id"), nullable=False)
    # กรณีเลือกตำแหน่งเป็น "อื่นๆ" ให้ระบุข้อความตำแหน่งที่นี่
    position_other_text = Column(NVARCHAR(255), nullable=True)
    complaint_number = Column(NVARCHAR(50), nullable=False)
    complaint_number_date = Column(DateTime, nullable=False)
    subject = Column(NVARCHAR(500), nullable=False)
    department_id = Column(UNIQUEIDENTIFIER, ForeignKey("departments.id"), nullable=True)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=True)
    signature_authority_user_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=False)
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
    user = relationship("User", foreign_keys=[user_id])
    complaint = relationship("Complaint", back_populates="outgoing_reports2", foreign_keys=[complaint_id])
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    
    attachments = relationship("OutgoingReportAttachment2", back_populates="outgoing_report2", cascade="all, delete-orphan")

class OutgoingReportAttachment2(Base):
    __tablename__ = "outgoing_report_attachments2"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    outgoing_report_id = Column(UNIQUEIDENTIFIER, ForeignKey("outgoing_reports2.id"), nullable=False)
    
    file_name = Column(NVARCHAR(255), nullable=False)
    file_path = Column(NVARCHAR(500), nullable=False)
    file_size = Column(NVARCHAR(50), nullable=True)
    file_type = Column(NVARCHAR(100), nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)
    
    outgoing_report2 = relationship("OutgoingReport2", back_populates="attachments")