import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Unicode, UnicodeText
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base

class Resource(Base):
    __tablename__ = "resources"
    __table_args__ = {'extend_existing': True}
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    path = Column(String(255), unique=True, nullable=False)
    # เปลี่ยนเป็น Unicode สำหรับเก็บคำอธิบายภาษาไทย
    description = Column(Unicode(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์
    permissions = relationship("Permission", back_populates="resource")