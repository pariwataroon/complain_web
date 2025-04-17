from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TimeSettingBase(BaseModel):
    key: str
    name: str
    value: int
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: bool = True

class TimeSettingCreate(TimeSettingBase):
    pass

class TimeSettingUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[int] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None

class TimeSettingResponse(TimeSettingBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True