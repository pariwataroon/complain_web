import uuid
from sqlalchemy import Column, DateTime, NVARCHAR, TEXT, Boolean, JSON
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.sql import func
from config.database import Base


class News(Base):
    __tablename__ = "news"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(NVARCHAR(500), nullable=False)  # หัวข้อข่าวสาร
    content = Column(TEXT, nullable=True)  # เนื้อหาข่าวสาร
    cover_image_url = Column(NVARCHAR(1000), nullable=True)  # URL รูปปกหลัก
    gallery_images = Column(JSON, nullable=True)  # เก็บ array ของ URL รูปย่อย
    additional_links = Column(JSON, nullable=True)  # เก็บ array ของลิงก์เพิ่มเติม {title, url, description}
    is_published = Column(Boolean, default=True, nullable=False)  # สถานะการเผยแพร่
    display_start_date = Column(DateTime, nullable=True)  # วันที่เริ่มแสดงข่าว (Bangkok timezone)
    display_end_date = Column(DateTime, nullable=True)  # วันที่สิ้นสุดการแสดงข่าว (Bangkok timezone)
    view_count = Column(NVARCHAR(50), default="0", nullable=False)  # จำนวนผู้ชม
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
