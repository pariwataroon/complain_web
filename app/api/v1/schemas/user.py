from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, validator

class UserBase(BaseModel):
    email: EmailStr
    citizen_id: str = Field(..., min_length=13, max_length=13)
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    citizen_id: str
    password: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    title_id: int
    prefix_other: Optional[str] = None

    @validator('citizen_id')
    def validate_citizen_id(cls, v):
        if not v or len(v) != 13:
            raise ValueError('Citizen ID must be 13 digits')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and (len(v) < 9 or len(v) > 10):
            raise ValueError('Phone number must be 9-10 digits')
        return v

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    title_id: int
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
    title_id: int
    prefix_other: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserResponse(UserInDB):
    pass

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
