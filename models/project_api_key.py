import uuid
from sqlalchemy import Column, NVARCHAR, DateTime, Boolean
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from sqlalchemy.sql import func

from config.database import Base


class ProjectApiKey(Base):
    __tablename__ = "comp_project_api_keys"

    id = Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid.uuid4, index=True)
    project_name = Column(NVARCHAR(100), nullable=False)
    api_key = Column(NVARCHAR(256), unique=True, nullable=False, index=True)
    description = Column(NVARCHAR(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    last_used_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<ProjectApiKey(project_name={self.project_name})>"