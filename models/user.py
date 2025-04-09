from sqlalchemy import Column, Integer, String, DateTime, Boolean, NVARCHAR, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(String(13), unique=True, index=True, nullable=False)
    
    # Foreign key อ้างอิงไปยัง title_id ของตาราง titles
    title_id = Column(Integer, ForeignKey("titles.title_id"), nullable=True)
    
    # คงเก็บ prefix_other ไว้สำหรับกรณีที่เลือก "อื่น ๆ"
    prefix_other = Column(NVARCHAR(100), nullable=True)
    
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    first_name = Column(NVARCHAR(100))
    last_name = Column(NVARCHAR(100))
    phone = Column(String(10))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # เพิ่ม relationship เพื่อให้เข้าถึง title ได้ง่าย (มีเพียงอันเดียว)
    title = relationship("Title", foreign_keys=[title_id], back_populates="users")
