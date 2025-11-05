# models/outgoing_reports5.py
import uuid
from sqlalchemy import Column, NVARCHAR, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base

class OutgoingReport5(Base):
    """
    รับเรื่องรายงานผลการพิจารณาจากหน่วยงาน (Incoming acknowledgement of agency's decision/result)
    เน้นความยืดหยุ่น: ข้อมูลอ้างอิงจากหน่วยงาน/ทะเบียนภายในเป็น optional
    """
    __tablename__ = "outgoing_reports5"

    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # เพิ่มฟิลด์ตำแหน่ง (สอดคล้องรุ่น 1-3)
    position_id = Column(UNIQUEIDENTIFIER, ForeignKey("positions.id"), nullable=True)
    position_other_text = Column(NVARCHAR(255), nullable=True)

    # คีย์/วันรับเรื่องจากหน่วยงาน
    receive_number = Column(NVARCHAR(100), nullable=False, comment="เลขรับเรื่องผลการพิจารณา (ภายใน กค.)")
    receive_date = Column(DateTime, nullable=False, comment="วันที่รับเรื่องผลการพิจารณา")

    # อ้างอิงเอกสารจากหน่วยงานต้นทาง (optional)
    agency_reference_number = Column(NVARCHAR(100), nullable=True, comment="เลขอ้างอิงจากหน่วยงานต้นทาง")
    agency_reference_date = Column(DateTime, nullable=True, comment="วันที่เลขอ้างอิงจากหน่วยงานต้นทาง")

    # ทะเบียนภายใน/เลขสารบรรณอื่น ๆ (optional)
    internal_register_number = Column(NVARCHAR(100), nullable=True, comment="เลขทะเบียนรับภายใน")
    internal_register_date = Column(DateTime, nullable=True, comment="วันที่ทะเบียนรับภายใน")
    present_to_director_date = Column(DateTime, nullable=True, comment="วันที่เสนอ ผอ./ผู้มีอำนาจ")

    # เรื่องร้องเรียนที่เกี่ยวข้อง
    complaint_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaints.id"), nullable=True)
    complaint_number = Column(NVARCHAR(100), nullable=False)
    complaint_number_date = Column(DateTime, nullable=False)

    # เนื้อหา
    subject = Column(NVARCHAR(500), nullable=False)
    document_number = Column(NVARCHAR(100), nullable=False)
    document_date = Column(DateTime, nullable=False)
    remarks = Column(NVARCHAR(2000), nullable=True)

    # ผู้ลงนาม/หน่วยงาน/ผู้ปฏิบัติ (ตามโครงเดิม)
    signature_authority_user_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True)
    department_id = Column(UNIQUEIDENTIFIER, ForeignKey("departments.id"), nullable=True)
    user_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True)

    # ระดับความลับ/ความเร่งด่วน
    confidentiality_level = Column(NVARCHAR(50), nullable=True)
    urgency_level = Column(NVARCHAR(50), nullable=True)

    # ✅ ขั้นตอนการดำเนินการ
    process_step = Column(NVARCHAR(255), nullable=True, comment="ขั้นตอนการดำเนินการ")

    # audit
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True)
    updated_by = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True)
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # relationships
    department = relationship("Department", foreign_keys=[department_id])
    user = relationship("User", foreign_keys=[user_id])
    signature_authority_user = relationship("User", foreign_keys=[signature_authority_user_id])
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

    complaint = relationship("Complaint", back_populates="outgoing_reports5")

    attachments = relationship(
        "OutgoingReportAttachment5",
        back_populates="outgoing_report",
        cascade="all, delete-orphan"
    )


class OutgoingReportAttachment5(Base):
    __tablename__ = "outgoing_report_attachments5"

    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    outgoing_report_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("outgoing_reports5.id"), nullable=False)

    file_name = Column(NVARCHAR(255), nullable=False)
    file_path = Column(NVARCHAR(1024), nullable=True)
    file_url = Column(NVARCHAR(1024), nullable=True)
    file_type = Column(NVARCHAR(100), nullable=True)
    file_size = Column(NVARCHAR(100), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=func.now(), index=True)

    outgoing_report = relationship("OutgoingReport5", back_populates="attachments")