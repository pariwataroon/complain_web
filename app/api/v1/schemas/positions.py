from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

class PositionBase(BaseModel):
    name: str
    description: Optional[str] = None
    level: Optional[str] = None
    is_active: bool = True

class PositionCreate(PositionBase):
    pass

class PositionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    is_active: Optional[bool] = None

class Position(PositionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserPositionBase(BaseModel):
    user_id: UUID
    position_id: UUID
    is_primary: bool = False
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class UserPositionCreate(UserPositionBase):
    pass

class UserPositionUpdate(BaseModel):
    is_primary: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class UserPosition(UserPositionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    position: Optional[Position] = None

    class Config:
        from_attributes = True