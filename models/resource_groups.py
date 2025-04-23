import uuid
from sqlalchemy import Column, Boolean, Integer, NVARCHAR, DateTime
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime

class ResourceGroup(Base):
    """เก็บข้อมูลกลุ่มทรัพยากรในระบบ"""
    __tablename__ = "resource_groups"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(NVARCHAR(50), unique=True, nullable=False, index=True)
    display_name = Column(NVARCHAR(100), nullable=False)
    description = Column(NVARCHAR, nullable=True)
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # เพิ่ม relationship กับ resources
    resources = relationship("Resource", back_populates="group")