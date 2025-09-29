from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List


class GroupSignatureAuthorityBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    order_index: Optional[int] = Field(0, ge=0, description="ลำดับการแสดงผลของกลุ่ม")


class GroupSignatureAuthorityCreate(GroupSignatureAuthorityBase):
    pass


class GroupSignatureAuthorityUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    order_index: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class GroupSignatureAuthority(GroupSignatureAuthorityBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GroupSignatureAuthorityWithMembers(GroupSignatureAuthority):
    """กลุ่มผู้ลงนามพร้อมสมาชิกและหน่วยงาน"""
    total_members: int = 0
    total_departments: int = 0
    members: List[dict] = []
    departments: List[dict] = []


class BulkSignatureAuthorityCreate(BaseModel):
    """สำหรับสร้างกลุ่มผู้ลงนามพร้อมสมาชิกหลายคน"""
    group_name: str = Field(..., min_length=1, max_length=200)
    group_description: Optional[str] = Field(None, max_length=500)
    user_ids: List[UUID] = Field(..., min_items=1)
    department_ids: List[UUID] = Field(..., min_items=1)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class GroupSignatureCreate(BaseModel):
    """สร้างกลุ่มผู้ลงนาม - รูปแบบยืดหยุ่น"""
    group_name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    assignments: List[dict] = Field(..., min_items=1)
