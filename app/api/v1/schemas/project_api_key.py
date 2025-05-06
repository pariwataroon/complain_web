from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class ProjectApiKeyBase(BaseModel):
    project_name: str = Field(..., description="ชื่อโปรเจค")
    description: Optional[str] = Field(None, description="คำอธิบายเกี่ยวกับโปรเจคและวัตถุประสงค์การใช้งาน API")
    is_active: bool = Field(True, description="สถานะการใช้งาน API Key")

class ProjectApiKeyCreate(ProjectApiKeyBase):
    pass

class ProjectApiKeyUpdate(BaseModel):
    project_name: Optional[str] = Field(None, description="ชื่อโปรเจค")
    description: Optional[str] = Field(None, description="คำอธิบายเกี่ยวกับโปรเจคและวัตถุประสงค์การใช้งาน API")
    is_active: Optional[bool] = Field(None, description="สถานะการใช้งาน API Key")

class ProjectApiKeyResponse(ProjectApiKeyBase):
    id: UUID
    api_key: str = Field(..., description="API Key (แบบปกปิดบางส่วน)")
    created_at: datetime
    updated_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True