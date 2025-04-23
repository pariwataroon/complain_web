import uuid
from sqlalchemy import Column, String, DateTime, Boolean, NVARCHAR, ForeignKey, Integer
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    name = Column(NVARCHAR(200), nullable=False)
    short_name = Column(NVARCHAR(50), nullable=True)
    code = Column(String(20), nullable=True)  # รหัสหน่วยงาน
    parent_id = Column(UNIQUEIDENTIFIER, ForeignKey("departments.id"), nullable=True)
    group_id = Column(UNIQUEIDENTIFIER, ForeignKey("department_groups.id"), nullable=True)
    order_index = Column(Integer, default=0)  # ลำดับการแสดงผลภายในกลุ่ม
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์แบบ self-referential
    parent = relationship("Department", remote_side=[id], backref="children")
    
    # ความสัมพันธ์กับ DepartmentGroup
    group = relationship("DepartmentGroup", back_populates="departments")