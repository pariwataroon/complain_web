from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

from app.api.v1.schemas.department import Department


class VenueBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    code: Optional[str] = None
    abbreviation: Optional[str] = None  # ตัวย่อสถานที่
    color_code: Optional[str] = None  # รหัสสี
    department_id: Optional[UUID] = None
    group_name: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class VenueCreate(VenueBase):
    pass


class VenueUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    code: Optional[str] = None
    abbreviation: Optional[str] = None
    color_code: Optional[str] = None
    department_id: Optional[UUID] = None
    group_name: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None


class Venue(VenueBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    department: Optional[Department] = None

    class Config:
        from_attributes = True


class VenueList(BaseModel):
    venues: List[Venue]


# ใช้สำหรับการแสดงข้อมูลในรูปแบบเป็นกลุ่ม
class VenueGroupWithItems(BaseModel):
    group_name: str
    venues: List[Venue]