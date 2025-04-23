from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

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

class PositionResponse(Position):
    pass

class PositionList(BaseModel):
    positions: List[Position]