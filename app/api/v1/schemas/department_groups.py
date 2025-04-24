from typing import Optional, List, Union, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

# Pydantic models
class DepartmentGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: Optional[int] = 0
    is_active: Optional[bool] = True

class DepartmentGroupCreate(DepartmentGroupBase):
    pass

class DepartmentGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None

class DepartmentGroup(DepartmentGroupBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

class DepartmentGroupWithDepartments(DepartmentGroup):
    departments: List[Dict[str, Any]] = []
    total_departments: int = 0