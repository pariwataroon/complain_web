from sqlalchemy import Column, ForeignKey, DateTime, Table
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from datetime import datetime
from config.database import Base

# Association table for tracking which users have seen the notification
notification_seen_table = Table(
    "notification_seen",
    Base.metadata,
    Column("notification_id", UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("notifications.id"), primary_key=True),
    Column("user_id", UNIQUEIDENTIFIER(as_uuid=True), ForeignKey("comp_users.id"), primary_key=True),
    Column("seen_at", DateTime, default=datetime.utcnow),
)