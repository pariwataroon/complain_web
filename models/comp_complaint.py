import uuid
import enum
from sqlalchemy import (NVARCHAR, Boolean, Column, DateTime, 
                      ForeignKey, Integer, JSON, Enum)
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base

# Define complaint status enum
class ComplaintStatus(str, enum.Enum):
    # Based on the tracking diagrams in the images
    SUBMITTED = "submitted"                 # ส่งคำร้อง
    SENT_TO_AGENCY = "sent_to_agency"       # มอบหมายเจ้าหน้าที่
    SENT_TO_EXTERNAL = "sent_to_external"   # ส่งหน่วยงานภายนอก
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

# Define complaint filing type (ประเภทการยื่นเรื่องร้องเรียน)
class ComplaintFilingType(str, enum.Enum):
    NEW = "new"                # เรื่องร้องเรียนใหม่
    ADDITIONAL = "additional"  # เรื่องร้องเรียนเพิ่มเติม
    ANONYMOUS = "anonymous"    # รับเรื่องจากคณะทำงานบัตรสนเท่ห์

# เพิ่ม Enum สำหรับระดับความเร่งด่วนและความลับ
class ConfidentialityLevel(str, enum.Enum):
    NORMAL = "normal"              # ปกติ
    CONFIDENTIAL = "confidential"  # ลับ
    SECRET = "secret"              # ลับมาก
    TOP_SECRET = "top_secret"      # ลับที่สุด

class UrgencyLevel(str, enum.Enum):
    LOW = "low"           # ปกติ
    MEDIUM = "medium"     # เร่งด่วน
    HIGH = "high"         # ด่วน
    URGENT = "urgent"     # ด่วนมาก
    CRITICAL = "critical" # ด่วนที่สุด

class SeverityLevel(str, enum.Enum):
    LOW = "low"           # น้อย
    MEDIUM = "medium"     # ปานกลาง
    HIGH = "high"         # มาก
    CRITICAL = "critical" # รุนแรง

# เพิ่ม Enum สำหรับความพึงพอใจ
class SatisfactionRating(int, enum.Enum):
    VERY_DISSATISFIED = 1  # ไม่พอใจมาก
    DISSATISFIED = 2       # ไม่พอใจ
    NEUTRAL = 3            # เฉยๆ
    SATISFIED = 4          # พอใจ
    VERY_SATISFIED = 5     # พอใจมาก

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
        index=True,
        comment="สถานะการร้องเรียน: submitted=ส่งคำร้อง, sent_to_agency=มอบหมายเจ้าหน้าที่, sent_to_external=ส่งหน่วยงานภายนอก, in_process=อยู่ระหว่างดำเนินการ, in_review=อยู่ระหว่างการพิจารณา, tracking=ติดตามผลการพิจารณา, reviewed=แจ้งผลการพิจารณา, completed=เสร็จสิ้น, cancelled=ยกเลิก"
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
    created_at = Column(DateTime, default=func.now(), index=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ข้อมูลหน่วยงานที่รับผิดชอบ
    assigned_to = Column(NVARCHAR(200), nullable=True, comment="หน่วยงานที่รับผิดชอบ")
    assigned_date = Column(DateTime, nullable=True)
    assigned_remark = Column(NVARCHAR(2000), nullable=True, comment="หมายเหตุการมอบหมาย/ข้อความส่งต่อ")
    
    # ข้อมูลการยืนยันการรับงาน
    confirm_assigned_date = Column(DateTime, nullable=True, comment="วันที่เจ้าหน้าที่ยืนยันรับงาน")
    confirm_assigned_by = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True, comment="เจ้าหน้าที่ที่ยืนยันรับงาน")
    confirm_assigned_status = Column(Boolean, nullable=True, comment="สถานะการยืนยันรับงาน: True=ยืนยัน, False=ปฏิเสธ, NULL=รอการตอบรับ")
    confirm_assigned_remark = Column(NVARCHAR(1000), nullable=True, comment="หมายเหตุการยืนยัน/ปฏิเสธรับงาน")

    # ข้อมูลการแก้ไขปัญหา
    resolution_summary = Column(NVARCHAR(2000), nullable=True)
    resolved_date = Column(DateTime, nullable=True)
    
    # ผู้สร้างข้อร้องเรียน
    created_by = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True)
    creator = relationship("User", back_populates="complaints", foreign_keys=[created_by])
    
    # เอกสารแนบ
    attachments = relationship("ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan")
    
    # ประวัติสถานะ
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan")

    # ข้อมูลเพิ่มเติมสำหรับเจ้าหน้าที่
    complaint_type_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaint_types.id"), nullable=True)
    complaint_subtype_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaint_subtypes.id"), nullable=True)
    complaint_channel_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaint_channels.id"), nullable=True)
    
    new_complaint = Column(Boolean, default=True, comment='ร้องเรียนใหม่')
    add_more_complaint_to_ref = Column(Boolean, default=False, comment='ร้องเรียนเพิ่มเติม')
    group_work = Column(Boolean, default=False, comment='รับเรื่องจากคณะบัตรสนเท่ห์')
    regulation_reference = Column(NVARCHAR(1000), nullable=True, comment='อ้างอิงกฎหมาย/ระเบียบที่เกี่ยวข้อง')

    # ข้อมูลเลขที่อ้างอิงจากระบบอื่น
    reference_number = Column(NVARCHAR(100), nullable=True, comment="เลข สป.กค.")
    reference_date = Column(DateTime, nullable=True, comment="วันที่เลข สป.กค.")
    reference_number2 = Column(NVARCHAR(100), nullable=True, comment="เลข สป.สร.")  # แก้ไขจาก "เลข สตร."
    reference_date2 = Column(DateTime, nullable=True, comment="วันที่เลข สป.สร.")
    reference_number3 = Column(NVARCHAR(100), nullable=True, comment="เลข สตป.")
    reference_date3 = Column(DateTime, nullable=True, comment="วันที่เลข สตป.")
    reference_number4 = Column(NVARCHAR(100), nullable=True, comment="เลข สรร. (สารบัญ)")  # แก้จาก สรจ. เป็น สรร.
    reference_date4 = Column(DateTime, nullable=True, comment="วันที่เลข สรร. (สารบัญ)")  # แก้จาก สรจ. เป็น สรร.
    
    # เลขที่หนังสือ (แยกต่างหากจาก reference_number3)
    document_number = Column(NVARCHAR(100), nullable=True, comment="เลขที่หนังสือ")
    document_date = Column(DateTime, nullable=True, comment="วันที่หนังสือ")
    # วันที่เสนอผู้อำนวยการ
    director_submission_date = Column(DateTime, nullable=True, comment="วันที่เสนอผู้อำนวยการ")
    
    # ข้อมูลวันที่ลงทะเบียน
    registration_date = Column(DateTime, nullable=True)
    
    # ความลับ
    confidentiality_level = Column(Enum(ConfidentialityLevel), nullable=True, 
                                  default=ConfidentialityLevel.NORMAL,
                                  comment="ขั้นความลับ: normal=ปกติ, confidential=ลับ, secret=ลับมาก, top_secret=ลับที่สุด")
    urgency_level = Column(Enum(UrgencyLevel), nullable=True, 
                          default=UrgencyLevel.LOW,
                          comment="ความเร่งด่วน: low=ปกติ, medium=เร่งด่วน, high=ด่วน, urgent=ด่วนมาก, critical=ด่วนที่สุด")
    
    # หน่วยงานที่ส่งเรื่องมาถึง กค.
    agency_sender = Column(NVARCHAR(200), nullable=True, comment="หน่วยงานที่ส่งเรื่องมาถึง กค.")
    
    # ประเภทการร้องเรียน (เรื่องใหม่/เพิ่มเติม/จากคณะทำงานบัตรสนเท่ห์)
    complaint_filing_type = Column(Enum(ComplaintFilingType), default=ComplaintFilingType.NEW, nullable=False, 
        comment="ประเภทการร้องเรียน: new=เรื่องใหม่, additional=เรื่องเพิ่มเติม, anonymous=รับเรื่องจากคณะทำงานบัตรสนเท่ห์")
    
    # เลขที่อ้างอิงเพิ่มเติม
    additional_reference_number1 = Column(NVARCHAR(100), nullable=True, comment="เลขที่อ้างอิง(เลข สรร.สารบัญ) 1")  # แก้จาก สรจ. เป็น สรร.
    additional_reference_date1 = Column(DateTime, nullable=True, comment="วันที่อ้างอิง(เลข สรร.สารบัญ) 1")  # แก้จาก สรจ. เป็น สรร.
    additional_reference_number2 = Column(NVARCHAR(100), nullable=True, comment="เลขที่อ้างอิง(เลข สรร.สารบัญ) 2")  # แก้จาก สรจ. เป็น สรร.
    additional_reference_date2 = Column(DateTime, nullable=True, comment="วันที่อ้างอิง(เลข สรร.สารบัญ) 2")  # แก้จาก สรจ. เป็น สรร.
    
    # เพิ่มฟิลด์สำหรับข้อมูลที่ตั้งเหตุการณ์
    incident_province_id = Column(Integer, nullable=True, comment="รหัสจังหวัดที่เกิดเหตุ")
    incident_province = Column(NVARCHAR(100), nullable=True, comment="จังหวัดที่เกิดเหตุ")
    incident_district_id = Column(Integer, nullable=True, comment="รหัสอำเภอที่เกิดเหตุ") 
    incident_district = Column(NVARCHAR(100), nullable=True, comment="อำเภอที่เกิดเหตุ")
    incident_subdistrict_id = Column(NVARCHAR(100), nullable=True, comment="รหัสตำบลที่เกิดเหตุ")
    incident_subdistrict = Column(NVARCHAR(100), nullable=True, comment="ตำบลที่เกิดเหตุ")
    
    # เพิ่มฟิลด์สำหรับข้อมูลการดำเนินงานละเอียด
    assigned_officer_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True, comment="ผู้รับผิดชอบเรื่อง")
    progress_percentage = Column(Integer, nullable=True, default=0, comment="ร้อยละความคืบหน้าของการดำเนินการ")
    processing_notes = Column(NVARCHAR(4000), nullable=True, comment="บันทึกการดำเนินงาน/การแจ้งกลับ")
    
    # เพิ่มฟิลด์สำหรับข้อมูลการประเมิน
    severity_level = Column(Enum(SeverityLevel), nullable=True, comment="ระดับความรุนแรง/ความสำคัญของเรื่อง")
    satisfaction_rating = Column(Enum(SatisfactionRating), nullable=True, comment="คะแนนความพึงพอใจต่อการแก้ไข")
    satisfaction_comment = Column(NVARCHAR(2000), nullable=True, comment="ความคิดเห็นต่อการแก้ไข")
    
    # เพิ่มฟิลด์สำหรับความสัมพันธ์ระหว่างเรื่องร้องเรียน
    parent_complaint_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaints.id"), nullable=True, comment="เรื่องร้องเรียนต้นเรื่อง")
    related_complaints = Column(JSON, nullable=True, comment="เรื่องร้องเรียนที่เกี่ยวข้อง")
    
    # Relationships
    parent_complaint = relationship("Complaint", remote_side=[id], backref="child_complaints", foreign_keys=[parent_complaint_id])
    assigned_officer = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_officer_id])
    confirm_assigned_officer = relationship("User", back_populates="confirmed_assignments", foreign_keys=[confirm_assigned_by])

    # Relationships
    complaint_type_relation = relationship("ComplaintType", back_populates="complaints")
    complaint_subtype_relation = relationship("ComplaintSubType", back_populates="complaints")
    complaint_channel_relation = relationship("ComplaintChannel", back_populates="complaints")
    outgoing_reports = relationship("OutgoingReport", back_populates="complaint") # แบบรายงานส่งหน่วยงานที่เกี่ยวข้อง
    outgoing_reports2 = relationship("OutgoingReport2", back_populates="complaint") # แบบรายงานแจ้งผู้ร้องเรียน / ส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น
    outgoing_reports3 = relationship("OutgoingReport3", back_populates="complaint") # แบบรายงานขอทราบผลการพิจารณา / ผลความคืบหน้า
    outgoing_reports4 = relationship("OutgoingReport4", back_populates="complaint") # แบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ
    outgoing_reports5 = relationship("OutgoingReport5", back_populates="complaint") # แบบรับเรื่องรายงานผลการพิจารณาจากหน่วยงาน

class ComplaintAttachment(Base):
    __tablename__ = "comp_complaint_attachments"
    
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaints.id"), nullable=False)
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
    complaint_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaints.id"), nullable=False)
    status = Column(Enum(ComplaintStatus), nullable=False)
    notes = Column(NVARCHAR(1000), nullable=True)
    changed_by = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), nullable=True)
    changed_at = Column(DateTime, default=func.now())
    
    # Relationships
    complaint = relationship("Complaint", back_populates="status_history")
    user = relationship("User")