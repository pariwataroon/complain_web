import uuid
from sqlalchemy import Column, DateTime, NVARCHAR, JSON
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.sql import func
from config.database import Base


class ChatBot(Base):
    __tablename__ = "chat_bot"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(NVARCHAR(500), nullable=False)
    detail = Column(NVARCHAR(1000), nullable=True)
    keyword = Column(JSON, nullable=True)  # เก็บ array ของ keywords
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
