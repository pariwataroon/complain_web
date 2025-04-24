from typing import Optional, List, Union, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

from app.api.v1.schemas.department_groups import DepartmentGroup

# Pydantic models
class DepartmentBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    code: Optional[str] = None
    parent_id: Optional[UUID] = None
    group_id: Optional[UUID] = None
    order_index: Optional[int] = 0
    is_active: Optional[bool] = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    code: Optional[str] = None
    parent_id: Optional[UUID] = None
    group_id: Optional[UUID] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None

class Department(DepartmentBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    parent: Optional['Department'] = None
    children: Optional[List['Department']] = None
    group: Optional[DepartmentGroup] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

# Recursive model references
Department.model_rebuild()

class DepartmentWithVenues(Department):
    venues: List[Dict[str, Any]] = []
    total_venues: int = 0

class DepartmentGroup(BaseModel):
    group_id: UUID
    group_name: str
    departments: List[Department] = []
    total_departments: int = 0