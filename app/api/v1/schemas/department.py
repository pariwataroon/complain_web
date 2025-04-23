from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel


class DepartmentGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class DepartmentGroup(DepartmentGroupBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DepartmentBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    code: Optional[str] = None
    parent_id: Optional[UUID] = None
    group_id: Optional[UUID] = None
    order_index: int = 0
    is_active: bool = True


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
    created_at: datetime
    updated_at: datetime
    group: Optional[DepartmentGroup] = None

    class Config:
        from_attributes = True
        
        # แก้ไขปัญหา circular import
        populate_by_name = True


# สำหรับแสดงเป็นลำดับชั้น
class DepartmentWithChildren(Department):
    children: Optional[List["DepartmentWithChildren"]] = None


# สำหรับข้อมูลแบบรายการ
class DepartmentList(BaseModel):
    departments: List[Department]


# สำหรับแสดงข้อมูลตามกลุ่ม
class DepartmentGroupWithItems(BaseModel):
    group_id: UUID
    group_name: str
    departments: List[Department]