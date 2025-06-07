import uuid
import enum
from sqlalchemy import (NVARCHAR, Boolean, Column, DateTime, 
                      ForeignKey, Integer, Text, JSON)
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base

class ComplaintType(Base):
    """ประเภทเรื่องร้องเรียนหลัก"""
    __tablename__ = "comp_complaint_types"
    
    
    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(NVARCHAR(200), nullable=False, comment="ชื่อประเภทเรื่องร้องเรียนหลัก")
    description = Column(NVARCHAR(500), nullable=True, comment="คำอธิบายเพิ่มเติม")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    subtypes = relationship("ComplaintSubType", back_populates="parent_type", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="complaint_type_relation")

class ComplaintSubType(Base):
    """ประเภทเรื่องร้องเรียนย่อย"""
    __tablename__ = "comp_complaint_subtypes"
    
    
    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_type_id = Column(UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_complaint_types.id"), nullable=False)
    name = Column(NVARCHAR(200), nullable=False, comment="ชื่อประเภทเรื่องร้องเรียนย่อย")
    description = Column(NVARCHAR(500), nullable=True, comment="คำอธิบายเพิ่มเติม")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    parent_type = relationship("ComplaintType", back_populates="subtypes")
    complaints = relationship("Complaint", back_populates="complaint_subtype_relation")

class ComplaintChannel(Base):
    """ช่องทางการร้องเรียน"""
    __tablename__ = "comp_complaint_channels"
    
    
    id = Column(UNIQUEIDENTIFIER(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(NVARCHAR(200), nullable=False, comment="ชื่อช่องทางการร้องเรียน เช่น โทรศัพท์, อีเมล, เว็บไซต์")
    description = Column(NVARCHAR(500), nullable=True, comment="คำอธิบายเพิ่มเติม")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    complaints = relationship("Complaint", back_populates="complaint_channel_relation")