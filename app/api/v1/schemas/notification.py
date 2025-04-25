from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class NotificationBase(BaseModel):
    title: str
    message: str
    role_seeking_group: str = Field(description="Comma-separated role names (e.g. 'admin,staff,supervisor')")
    redirect_url: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationUpdate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: UUID
    created_at: datetime
    target_roles: List[str]  # แปลงจาก role_seeking_group ที่เป็น string
    seen_count: int
    seen_by_users: List[dict]

    class Config:
        from_attributes = True