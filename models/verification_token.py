import uuid
from sqlalchemy import Column, DateTime, Boolean, ForeignKey, NVARCHAR
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base

class VerificationToken(Base):
    __tablename__ = "comp_verification_tokens"
    
    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey("comp_users.id"), nullable=False)
    token = Column(NVARCHAR(100), unique=True, nullable=False, index=True)
    token_type = Column(NVARCHAR(50), nullable=False)  # email_verification, password_reset, etc.
    created_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="verification_tokens")