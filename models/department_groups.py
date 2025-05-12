import uuid
from sqlalchemy import Column, DateTime, Boolean, NVARCHAR, Integer
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


class DepartmentGroup(Base):
    __tablename__ = "department_groups"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    name = Column(NVARCHAR(100), nullable=False)
    description = Column(NVARCHAR(500), nullable=True)
    order_index = Column(Integer, default=0)  # ลำดับการแสดงผลภายในกลุ่ม
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์กับ Department
    departments = relationship("Department", back_populates="group")