from sqlalchemy import (NVARCHAR, Boolean, Column, DateTime, ForeignKey,
                        Integer, String)
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


class Token(Base):
    __tablename__ = "comp_tokens"
    user_id = Column(UNIQUEIDENTIFIER, ForeignKey( "comp_users.id"), primary_key=True, index=True)
    access_token = Column(String(255), index=True, unique=True, nullable=False)
    refresh_token = Column(String(255), index=True, unique=True, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    users = relationship("User", back_populates="tokens", foreign_keys=[user_id])

    def __repr__(self):
        return f"<Title(user_id={self.user_id})>"
