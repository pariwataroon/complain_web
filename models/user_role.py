import uuid
from sqlalchemy import Column, ForeignKey, DateTime, Index
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base

class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (
        Index('ix_user_role_userid_roleid', "user_id", "role_id"),
        {'extend_existing': True},
    )
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    # แก้ไขชื่อตารางให้ตรงกับ User model
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=False)
    # ตรวจสอบว่า roles.id ใช้ UNIQUEIDENTIFIER เช่นกัน
    role_id = Column(UNIQUEIDENTIFIER, ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    # ระบุความสัมพันธ์
    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")