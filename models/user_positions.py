import uuid
from sqlalchemy import Column, ForeignKey, DateTime, NVARCHAR, Boolean
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


class UserPosition(Base):
    __tablename__ = "user_positions"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=False, index=True)
    position_id = Column(UNIQUEIDENTIFIER, ForeignKey("positions.id"), nullable=False, index=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)  # สำหรับเก็บประวัติตำแหน่ง
    is_primary = Column(Boolean, default=True)  # ตำแหน่งหลักหรือไม่
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์
    user = relationship("User", back_populates="positions")
    position = relationship("Position", back_populates="users")