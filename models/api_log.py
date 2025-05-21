import uuid
from sqlalchemy import Column, DateTime, Integer, NVARCHAR, Float
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.sql import func
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from config.database import Base

class ApiLog(Base):
    __tablename__ = "api_logs"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    request_id = Column(NVARCHAR(100), index=True)
    method = Column(NVARCHAR(10))
    path = Column(NVARCHAR(255))
    # เปลี่ยนจาก Text เป็น NVARCHAR(max)
    query_params = Column(NVARCHAR('max'), nullable=True)  
    client_ip = Column(NVARCHAR(50))
    status_code = Column(Integer)
    process_time_ms = Column(Float)
    # เปลี่ยนจาก Text เป็น NVARCHAR(max)
    request_body = Column(NVARCHAR('max'), nullable=True)  
    request_headers = Column(NVARCHAR('max'), nullable=True)
    
    # User tracking when authenticated
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=True)
    user = relationship("User", back_populates="api_logs")
    
    created_at = Column(DateTime, default=func.now())