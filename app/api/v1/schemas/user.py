from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    citizen_id: str = Field(..., min_length=13, max_length=13)
    first_name: str
    last_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    title_id: Optional[int] = None
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
    email: Optional[EmailStr] = None
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
    id: int
    email: EmailStr
    citizen_id: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    title_id: Optional[int] = None
    prefix_other: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
    # เพิ่ม computed field เพื่อให้ไม่ต้องแก้ไข frontend
    @property
    def title_name(self) -> Optional[str]:
        """ดึงค่า title_name จากข้อมูลที่มี"""
        # ถูกดึงจาก User model อัตโนมัติเนื่องจากมี from_attributes = True
        return None  # เติมโดยอัตโนมัติจาก ORM

class UserResponse(UserInDB):
    # เพิ่ม property เพื่อให้ frontend สามารถใช้งานได้สะดวก
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_title(self) -> str:
        """แสดงคำนำหน้าที่ควรใช้จริง"""
        if self.title_id == 3 and self.prefix_other:  # ถ้าเป็น "อื่น ๆ" และมีข้อมูล prefix_other
            return self.prefix_other
        # จะได้รับจาก property title_name ของ User model โดยอัตโนมัติ
        return self.title_name or ""
    
    @property
    def full_name_with_title(self) -> str:
        """แสดงชื่อเต็มพร้อมคำนำหน้า"""
        title = self.display_title
        return f"{title}{' ' if title else ''}{self.first_name} {self.last_name}"

class TitleSchema(BaseModel):
    title_id: int
    short_name: Optional[str] = None
    title_name: Optional[str] = None
    category: Optional[str] = None

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