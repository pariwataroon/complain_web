import uuid
from sqlalchemy import Column, DateTime, Boolean, NVARCHAR, Integer
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


class GroupSignatureAuthority(Base):
    __tablename__ = "group_signature_authorities"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4)
    name = Column(NVARCHAR(200), nullable=False)
    description = Column(NVARCHAR(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # ความสัมพันธ์กับ SignatureAuthority
    signature_authorities = relationship("SignatureAuthority", back_populates="group")
