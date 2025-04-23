import uuid

from sqlalchemy import (NVARCHAR, Boolean, Column, DateTime, ForeignKey, Integer)
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    tokens = relationship("Token", back_populates="users", cascade="all, delete-orphan")

    # เพิ่ม relationship เพื่อให้เข้าถึง title ได้ง่าย (มีเพียงอันเดียว)
    title = relationship("Title", back_populates="users", foreign_keys=[title_id])

    # เพิ่มความสัมพันธ์กับ UserRole
    roles = relationship("UserRole", back_populates="user")
    
    # เพิ่มความสัมพันธ์กับตำแหน่ง
    positions = relationship("UserPosition", back_populates="user")