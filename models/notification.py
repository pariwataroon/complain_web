from sqlalchemy import Column, NVARCHAR, DateTime, Boolean
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from config.database import Base

# Import the association table
from models.association_tables import notification_seen_table

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(NVARCHAR(255), nullable=False)
    message = Column(NVARCHAR(1024), nullable=False)
    role_seeking_group = Column(NVARCHAR(255), nullable=False)  # e.g., "admin,staff,supervisor"
    redirect_url = Column(NVARCHAR(512), nullable=True)  # URL or route to redirect
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # ใช้ตัวแปรโดยตรง (ไม่ใช้ string)
    seen_by_users = relationship( "User", secondary=notification_seen_table, back_populates="seen_notifications")