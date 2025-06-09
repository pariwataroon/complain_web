import uuid

from sqlalchemy import (NVARCHAR, Boolean, Column, DateTime, ForeignKey, Integer)
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base
from models.association_tables import notification_seen_table


class User(Base):
    __tablename__ = "comp_users"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    citizen_id = Column(NVARCHAR(13), unique=True, index=True, nullable=False)

    # Foreign key อ้างอิงไปยัง title_id ของตาราง titles
    title_id = Column(Integer, ForeignKey("comp_titles.title_id"), nullable=True)

    # คงเก็บ prefix_other ไว้สำหรับกรณีที่เลือก "อื่น ๆ"
    prefix_other = Column(NVARCHAR(100), nullable=True)

    email = Column(NVARCHAR(100), unique=True, index=True, nullable=False)
    hashed_password = Column(NVARCHAR(100), nullable=False)
    first_name = Column(NVARCHAR(100))
    last_name = Column(NVARCHAR(100))
    phone = Column(NVARCHAR(10))
    address = Column(NVARCHAR(1024))
    address_other = Column(NVARCHAR(1024))
    
    # ✅ แก้ไขฟิลด์ภูมิศาสตร์ให้อ้างอิงถูกต้อง
    province_id = Column(Integer, nullable=True)  # ไม่ใช้ FK ก่อน
    district_id = Column(Integer, nullable=True)   # ไม่ใช้ FK ก่อน
    subdistrict_id = Column(NVARCHAR(10), nullable=True)  # ไม่ใช้ FK ก่อน
    zipcode = Column(Integer, nullable=True)
    
    # เพิ่มฟิลด์ภูมิศาสตร์สำหรับที่อยู่อื่น
    province2_id = Column(Integer, nullable=True)
    district2_id = Column(Integer, nullable=True)
    subdistrict2_id = Column(NVARCHAR(10), nullable=True)
    zipcode2 = Column(Integer, nullable=True)
    
    # ฟิลด์เพิ่มเติม
    profile_image = Column(NVARCHAR(255), nullable=True)
    sync_address = Column(Boolean, default=False)
    group_type = Column(NVARCHAR(50), nullable=True)  # officer, people, etc.
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    tokens = relationship("Token", back_populates="users", cascade="all, delete-orphan")
    title = relationship("Title", back_populates="users", foreign_keys=[title_id])
    roles = relationship("UserRole", back_populates="user", lazy="selectin")
    positions = relationship("UserPosition", back_populates="user", lazy="selectin")

    # เพิ่มความสัมพันธ์กับการแจ้งเตือนที่ผู้ใช้ได้เห็น
    seen_notifications = relationship("Notification", secondary=notification_seen_table, back_populates="seen_by_users")
    # เพิ่มความสัมพันธ์กับ VerificationToken
    verification_tokens = relationship("VerificationToken", back_populates="user", cascade="all, delete-orphan")

    complaints = relationship("Complaint", back_populates="creator", foreign_keys="[Complaint.created_by]")
    assigned_complaints = relationship("Complaint", back_populates="assigned_officer", foreign_keys="[Complaint.assigned_officer_id]")
    
    api_logs = relationship("ApiLog", back_populates="user", lazy="dynamic")