import uuid
from sqlalchemy import Column, NVARCHAR, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from config.database import Base


class ProjectApiKey(Base):
    __tablename__ = "comp_project_api_keys"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    project_name = Column(NVARCHAR(100), nullable=False)
    api_key = Column(NVARCHAR(256), unique=True, nullable=False, index=True)
    api_secret = Column(NVARCHAR(512), nullable=True)  # เพิ่ม secret key สำหรับ HMAC
    description = Column(NVARCHAR(500), nullable=True)
    
    # เพิ่มฟิลด์สำหรับการจำกัดการใช้งาน
    api_type = Column(NVARCHAR(50), default="general")  # "general", "external_department", "mobile", "webhook"
    department_id = Column(UNIQUEIDENTIFIER, ForeignKey("departments.id"), nullable=True)  # ผูกกับหน่วยงาน
    allowed_ips = Column(NVARCHAR(1000), nullable=True)  # IP whitelist (comma separated)
    rate_limit_per_minute = Column(Integer, default=60)  # จำกัด requests ต่อนาที
    
    # เพิ่มฟิลด์สำหรับ security
    expires_at = Column(DateTime, nullable=True)  # API key expiration
    allowed_endpoints = Column(NVARCHAR(2000), nullable=True)  # จำกัด endpoints ที่เข้าถึงได้
    
    # เพิ่มฟิลด์สำหรับ audit
    usage_count = Column(Integer, default=0)  # นับจำนวนการใช้งาน
    last_used_ip = Column(NVARCHAR(45), nullable=True)  # IP ล่าสุดที่ใช้
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_used_at = Column(DateTime, nullable=True)

    # ความสัมพันธ์กับหน่วยงานภายนอก
    department = relationship("Department", foreign_keys=[department_id])

    def __repr__(self):
        return f"<ProjectApiKey(project_name={self.project_name}, type={self.api_type})>"