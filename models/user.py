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

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', name='{self.first_name} {self.last_name}')>"
    
    # เพิ่ม property เพื่อดึงค่า title_name จาก relationship
    @property
    def title_name(self):
        """รับค่า title_name จาก relationship หรือ prefix_other"""
        if self.title_id == 3 and self.prefix_other:  # ถ้าเป็น "อื่น ๆ" และมีค่า prefix_other
            return self.prefix_other
        elif self.title:  # ถ้ามี title ให้ดึงค่า title_name จาก relationship
            return self.title.title_name
        return None
    
    # เพิ่ม property สำหรับแสดงชื่อเต็ม (รวมคำนำหน้า)
    @property
    def full_name_with_title(self):
        """แสดงชื่อเต็มพร้อมคำนำหน้า"""
        prefix = self.title_name or ""
        return f"{prefix}{' ' if prefix else ''}{self.first_name} {self.last_name}".strip()