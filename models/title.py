from sqlalchemy import Column, Integer, String, DateTime, Boolean, NVARCHAR
from sqlalchemy.sql import func
from config.database import Base


class Title(Base):
    __tablename__ = "titles"

    title_id = Column(Integer, primary_key=True, index=True)
    short_name = Column(NVARCHAR(50), nullable=True)
    title_name = Column(NVARCHAR(100), nullable=True)
    category = Column(NVARCHAR(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Title(title_id={self.title_id})>"
