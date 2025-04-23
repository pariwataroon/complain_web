import uuid
from sqlalchemy import Column, Boolean, DateTime, NVARCHAR, Integer
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base

class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {'extend_existing': True}
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    name = Column(NVARCHAR(100), unique=True, nullable=False)
    description = Column(NVARCHAR(255), nullable=True)
    order_index = Column(Integer, default=0) 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์กับตาราง user_roles
    users = relationship("UserRole", back_populates="role")
    # ความสัมพันธ์กับตาราง permissions
    permissions = relationship("Permission", back_populates="role")