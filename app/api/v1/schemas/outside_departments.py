from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

class OutsideDepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: Optional[int] = 0
    is_active: bool = True

class OutsideDepartmentCreate(OutsideDepartmentBase):
    pass

class OutsideDepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None

class OutsideDepartment(OutsideDepartmentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
