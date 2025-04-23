import uuid
from sqlalchemy import Column, DateTime, Boolean, NVARCHAR
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


class Position(Base):
    __tablename__ = "positions"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    name = Column(NVARCHAR(200), nullable=False)
    description = Column(NVARCHAR(500), nullable=True)
    level = Column(NVARCHAR(50), nullable=True)  # ระดับ เช่น ชำนาญการ, ชำนาญการพิเศษ
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์กับผู้ใช้
    users = relationship("UserPosition", back_populates="position")