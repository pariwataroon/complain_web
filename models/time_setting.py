from sqlalchemy import Column, Integer, Boolean, DateTime, func, NVARCHAR
from uuid import uuid4

from config.database import Base

class TimeSetting(Base):
    __tablename__ = "time_settings"
    
    # แก้ไขขนาดให้เป็นค่าที่แน่นอน เช่น 36 สำหรับ UUID
    id = Column(NVARCHAR(36), primary_key=True, default=lambda: str(uuid4()))
    # กำหนดค่าสูงสุดสำหรับ key (ไม่ใช้ max)
    key = Column(NVARCHAR(100), unique=True, nullable=False)
    # กำหนดค่าสูงสุดสำหรับ name
    name = Column(NVARCHAR(255), nullable=False)
    value = Column(Integer, nullable=False)
    # กำหนดค่าสูงสุดสำหรับ description หรือใช้ Text ถ้าต้องการขนาดใหญ่มาก
    description = Column(NVARCHAR(1000), nullable=True)
    # กำหนดค่าสูงสุดสำหรับ icon
    icon = Column(NVARCHAR(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())