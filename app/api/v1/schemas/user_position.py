from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel

from app.api.v1.schemas.positions import Position

class UserPositionBase(BaseModel):
    position_id: UUID
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_primary: bool = True

class UserPositionCreate(UserPositionBase):
    user_id: UUID

class UserPositionUpdate(BaseModel):
    position_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_primary: Optional[bool] = None

class UserPosition(UserPositionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    position: Optional[Position] = None  # ข้อมูลตำแหน่งแบบ nested

    class Config:
        from_attributes = True