import uuid
from sqlalchemy import Column, DateTime, Boolean, NVARCHAR, ForeignKey, Integer
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


class Venue(Base):
    __tablename__ = "venues"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    name = Column(NVARCHAR(200), nullable=False)
    short_name = Column(NVARCHAR(50), nullable=True)
    code = Column(NVARCHAR(20), nullable=True)  # รหัสสถานที่
    abbreviation = Column(NVARCHAR(20), nullable=True)  # ตัวย่อ (BAM, IAM, SAM)
    color_code = Column(NVARCHAR(10), nullable=True)  # รหัสสี HTML (เช่น #8D3AF6)
    
    # ความสัมพันธ์กับ Department ถ้าสถานที่นี้เกี่ยวข้องกับหน่วยงาน
    department_id = Column(UNIQUEIDENTIFIER, ForeignKey("departments.id"), nullable=False)
    
    # กำหนดกลุ่มของสถานที่ เช่น "รัฐวิสาหกิจ", "ส่วนราชการ", "อื่น ๆ"
    group_name = Column(NVARCHAR(100), nullable=True)
    
    order_index = Column(Integer, default=0)  # ลำดับการแสดงผลภายในกลุ่ม
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์กับ Department
    department = relationship("Department", foreign_keys=[department_id])