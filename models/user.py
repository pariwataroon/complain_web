from sqlalchemy import Column, Integer, String, DateTime, Boolean, NVARCHAR
from sqlalchemy.sql import func
from config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(String(13), unique=True, index=True, nullable=False)
    prefix = Column(NVARCHAR(10))
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    first_name = Column(NVARCHAR(100))
    last_name = Column(NVARCHAR(100))
    phone = Column(String(10))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
