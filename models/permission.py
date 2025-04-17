import uuid
from sqlalchemy import Column, ForeignKey, Boolean, String, DateTime
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base

class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = {'extend_existing': True}
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    role_id = Column(UNIQUEIDENTIFIER, ForeignKey("roles.id"), nullable=True)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=True)
    resource_id = Column(UNIQUEIDENTIFIER, ForeignKey("resources.id"), nullable=False)
    can_create = Column(Boolean, default=False)
    can_read = Column(Boolean, default=False)
    can_update = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์กับตาราง roles และ resources
    role = relationship("Role", back_populates="permissions")
    resource = relationship("Resource", back_populates="permissions")