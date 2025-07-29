import uuid
from sqlalchemy import Column, DateTime, NVARCHAR, TEXT, Boolean
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.sql import func
from config.database import Base


class News(Base):
    __tablename__ = "news"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(NVARCHAR(500), nullable=False)  # หัวข้อข่าวสาร
    content = Column(TEXT, nullable=True)  # เนื้อหาข่าวสาร
    image_url = Column(NVARCHAR(1000), nullable=True)  # URL รูปภาพ
    is_published = Column(Boolean, default=True, nullable=False)  # สถานะการเผยแพร่
    view_count = Column(NVARCHAR(50), default="0", nullable=False)  # จำนวนผู้ชม
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
