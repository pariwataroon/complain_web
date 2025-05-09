import uuid
from sqlalchemy import Column, DateTime, Boolean, NVARCHAR, ForeignKey, Integer
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base

class SignaturePosition(Base):
    __tablename__ = "signature_positions"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    title = Column(NVARCHAR(200), nullable=False)
    department_id = Column(UNIQUEIDENTIFIER, ForeignKey("departments.id"), nullable=False)
    # เปลี่ยนเป็นฟิลด์บังคับ
    position_id = Column(UNIQUEIDENTIFIER, ForeignKey("positions.id"), nullable=False)
    description = Column(NVARCHAR(500), nullable=True)
    order_index = Column(Integer, default=0)  # ลำดับการแสดงผล
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์กับ Department
    department = relationship("Department", backref="signature_positions")
    
    # ความสัมพันธ์กับ Position (ตำแหน่งงานทั่วไป)
    position = relationship("Position", backref="signature_positions")
    
    # ความสัมพันธ์กับ SignatureAuthority
    authorities = relationship("SignatureAuthority", back_populates="position")

class SignatureAuthority(Base):
    __tablename__ = "signature_authorities"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=False)
    position_id = Column(UNIQUEIDENTIFIER, ForeignKey("signature_positions.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์กับ User และ SignaturePosition 
    user = relationship("User", foreign_keys=[user_id])
    position = relationship("SignaturePosition", back_populates="authorities")