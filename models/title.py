from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from config.database import Base


class Title(Base):
    __tablename__ = "titles"

    title_id = Column(Integer, primary_key=True, index=True)
    short_name = Column(String(50), nullable=False, unique=True)
    title_name = Column(String(100), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Title(id={self.id})>"
