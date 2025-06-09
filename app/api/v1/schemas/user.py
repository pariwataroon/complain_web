from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, validator
from uuid import UUID

from app.api.v1.schemas.user_position import UserPosition

class UserBase(BaseModel):
    email: EmailStr
    citizen_id: str = Field(..., min_length=13, max_length=13)
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    address_other: Optional[str] = None

class UserLogin(BaseModel):
    citizen_id: str
    password: str

class UserCreate(BaseModel):
    citizen_id: str
    title_id: Optional[int] = None
    prefix_other: Optional[str] = None
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    
    # เพิ่มฟิลด์ที่อยู่
    address: Optional[str] = None
    address_other: Optional[str] = None  # address2 จาก frontend
    
    # เพิ่มข้อมูลภูมิศาสตร์ที่อยู่หลัก
    province_id: Optional[int] = None
    district_id: Optional[int] = None
    subdistrict_id: Optional[str] = None
    zipcode: Optional[int] = None
    
    # เพิ่มข้อมูลภูมิศาสตร์ที่อยู่อื่น
    province2_id: Optional[int] = None
    district2_id: Optional[int] = None
    subdistrict2_id: Optional[str] = None
    zipcode2: Optional[int] = None
    
    # เพิ่มฟิลด์อื่นๆ
    profile_image: Optional[str] = None
    sync_address: Optional[bool] = False
    group: Optional[str] = None
    
    # เพิ่มฟิลด์สำหรับตำแหน่ง
    position_ids: Optional[List[UUID]] = None
    primary_position_id: Optional[UUID] = None
    
    # เพิ่มฟิลด์สำหรับบทบาท (รองรับทั้ง format เก่าและใหม่)
    roles: Optional[List[Dict[str, Any]]] = None

    @validator('roles', pre=True)
    def parse_roles(cls, v):
        """Parse roles from different formats"""
        if not v:
            return None
        
        # ถ้าเป็น list ของ dict ที่มี id
        if isinstance(v, list) and len(v) > 0:
            if isinstance(v[0], dict) and 'id' in v[0]:
                return [role['id'] for role in v]
            elif isinstance(v[0], str):
                return v
        
        return v

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    title_id: Optional[int] = None
    prefix_other: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)

    class Config:
        extra = "forbid"  # ไม่อนุญาตให้มีฟิลด์อื่นนอกเหนือจากที่กำหนด

class UserInDB(BaseModel):
    id: UUID
    email: EmailStr
    citizen_id: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    address_other: Optional[str] = None
    title_id: int
    prefix_other: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserResponse(UserInDB):
    positions: Optional[List[UserPosition]] = None  # เพิ่มข้อมูลตำแหน่ง

class TitleSchema(BaseModel):
    title_id: int
    short_name: Optional[str] = None
    title_name: Optional[str] = None
    # category: Optional[str] = None

    class Config:
        from_attributes = True

class TitleResponse(TitleSchema):
    pass

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

class ResendVerificationEmail(BaseModel):
    """Schema สำหรับการร้องขอส่งอีเมลยืนยันใหม่"""
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: str
    
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class VerifyEmployeeRequest(BaseModel):
    """Schema for verifying if a user is an employee based on their citizen ID"""
    citizen_id: str
    project_api_key: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "citizen_id": "1234567890123",
                "project_api_key": "comp_mof_1a2b3c4d5e6f7g8h9i0j"
            }
        }