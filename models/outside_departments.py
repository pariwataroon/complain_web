import uuid
from sqlalchemy import Column, DateTime, Boolean, NVARCHAR, Integer
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.sql import func
from config.database import Base

class OutsideDepartment(Base):
    __tablename__ = "outside_departments"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    name = Column(NVARCHAR(200), nullable=False)         # ชื่อที่จะแสดงใน dropdown
    description = Column(NVARCHAR(500), nullable=True)   # อธิบายเพิ่มเติม (ถ้าอยากใช้)
    order_index = Column(Integer, default=0)             # ไว้จัดลำดับ dropdown
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())