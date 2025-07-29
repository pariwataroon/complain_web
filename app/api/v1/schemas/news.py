from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from uuid import UUID
import pytz


class AdditionalLink(BaseModel):
    """Schema สำหรับลิงก์เพิ่มเติม"""
    title: str = Field(..., min_length=1, max_length=200, description="ชื่อลิงก์")
    url: str = Field(..., max_length=1000, description="URL ลิงก์")
    description: Optional[str] = Field(None, max_length=500, description="คำอธิบายลิงก์")


class NewsBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: Optional[str] = None
    cover_image_url: Optional[str] = Field(None, max_length=1000, description="URL รูปปกหลัก")
    gallery_images: Optional[List[str]] = Field(None, description="รายการ URL รูปย่อย")
    additional_links: Optional[List[AdditionalLink]] = Field(None, description="ลิงก์เพิ่มเติม")
    is_published: bool = Field(default=True)
    display_start_date: Optional[datetime] = Field(None, description="วันที่เริ่มแสดงข่าว (Bangkok timezone)")
    display_end_date: Optional[datetime] = Field(None, description="วันที่สิ้นสุดการแสดงข่าว (Bangkok timezone)")

    @validator('display_start_date', 'display_end_date', pre=True)
    def validate_datetime_timezone(cls, v):
        """ตรวจสอบและแปลง timezone เป็น Bangkok timezone"""
        if v is None:
            return v
        
        if isinstance(v, str):
            # แปลง string เป็น datetime
            try:
                v = datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError("Invalid datetime format")
        
        if isinstance(v, datetime):
            bangkok_tz = pytz.timezone('Asia/Bangkok')
            if v.tzinfo is None:
                # ถ้าไม่มี timezone ให้ถือว่าเป็น Bangkok timezone
                v = bangkok_tz.localize(v)
            else:
                # แปลงเป็น Bangkok timezone
                v = v.astimezone(bangkok_tz)
        
        return v

    @validator('display_end_date')
    def validate_end_date_after_start_date(cls, v, values):
        """ตรวจสอบว่าวันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น"""
        if v and 'display_start_date' in values and values['display_start_date']:
            if v <= values['display_start_date']:
                raise ValueError("Display end date must be after start date")
        return v


class NewsCreate(NewsBase):
    """Schema สำหรับสร้าง News ใหม่"""
    pass


class NewsUpdate(BaseModel):
    """Schema สำหรับอัปเดต News"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = None
    cover_image_url: Optional[str] = Field(None, max_length=1000, description="URL รูปปกหลัก")
    gallery_images: Optional[List[str]] = Field(None, description="รายการ URL รูปย่อย")
    additional_links: Optional[List[AdditionalLink]] = Field(None, description="ลิงก์เพิ่มเติม")
    is_published: Optional[bool] = None
    display_start_date: Optional[datetime] = Field(None, description="วันที่เริ่มแสดงข่าว (Bangkok timezone)")
    display_end_date: Optional[datetime] = Field(None, description="วันที่สิ้นสุดการแสดงข่าว (Bangkok timezone)")

    @validator('display_start_date', 'display_end_date', pre=True)
    def validate_datetime_timezone(cls, v):
        """ตรวจสอบและแปลง timezone เป็น Bangkok timezone"""
        if v is None:
            return v
        
        if isinstance(v, str):
            try:
                v = datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError("Invalid datetime format")
        
        if isinstance(v, datetime):
            bangkok_tz = pytz.timezone('Asia/Bangkok')
            if v.tzinfo is None:
                v = bangkok_tz.localize(v)
            else:
                v = v.astimezone(bangkok_tz)
        
        return v

    @validator('display_end_date')
    def validate_end_date_after_start_date(cls, v, values):
        """ตรวจสอบว่าวันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น"""
        if v and 'display_start_date' in values and values['display_start_date']:
            if v <= values['display_start_date']:
                raise ValueError("Display end date must be after start date")
        return v


class NewsResponse(NewsBase):
    """Schema สำหรับ response ข้อมูล News"""
    id: UUID
    view_count: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NewsListResponse(BaseModel):
    """Schema สำหรับ response ข้อมูล News ในรายการ (สำหรับแสดงผลหน้าแรก)"""
    id: UUID
    title: str
    cover_image_url: Optional[str] = None
    view_count: str
    is_published: bool
    display_start_date: Optional[datetime] = None
    display_end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NewsInDB(NewsResponse):
    """Schema สำหรับข้อมูล News ในฐานข้อมูล"""
    pass


class GalleryImageAdd(BaseModel):
    """Schema สำหรับเพิ่มรูปใน gallery"""
    image_url: str = Field(..., max_length=1000, description="URL รูปภาพที่ต้องการเพิ่ม")


class GalleryImageRemove(BaseModel):
    """Schema สำหรับลบรูปจาก gallery"""
    image_url: str = Field(..., max_length=1000, description="URL รูปภาพที่ต้องการลบ")


class GalleryImagesUpdate(BaseModel):
    """Schema สำหรับอัปเดต gallery images ทั้งหมด"""
    image_urls: List[str] = Field(..., description="รายการ URL รูปภาพทั้งหมด")


class AdditionalLinkAdd(BaseModel):
    """Schema สำหรับเพิ่มลิงก์เพิ่มเติม"""
    link: AdditionalLink = Field(..., description="ลิงก์ที่ต้องการเพิ่ม")


class AdditionalLinkRemove(BaseModel):
    """Schema สำหรับลบลิงก์เพิ่มเติม"""
    link_title: str = Field(..., description="ชื่อลิงก์ที่ต้องการลบ")


class AdditionalLinksUpdate(BaseModel):
    """Schema สำหรับอัปเดตลิงก์เพิ่มเติมทั้งหมด"""
    links: List[AdditionalLink] = Field(..., description="รายการลิงก์ทั้งหมด")


class NewsDisplaySchedule(BaseModel):
    """Schema สำหรับกำหนดระยะเวลาการแสดงข่าว"""
    display_start_date: Optional[datetime] = Field(None, description="วันที่เริ่มแสดงข่าว (Bangkok timezone)")
    display_end_date: Optional[datetime] = Field(None, description="วันที่สิ้นสุดการแสดงข่าว (Bangkok timezone)")

    @validator('display_start_date', 'display_end_date', pre=True)
    def validate_datetime_timezone(cls, v):
        """ตรวจสอบและแปลง timezone เป็น Bangkok timezone"""
        if v is None:
            return v
        
        if isinstance(v, str):
            try:
                v = datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError("Invalid datetime format")
        
        if isinstance(v, datetime):
            bangkok_tz = pytz.timezone('Asia/Bangkok')
            if v.tzinfo is None:
                v = bangkok_tz.localize(v)
            else:
                v = v.astimezone(bangkok_tz)
        
        return v

    @validator('display_end_date')
    def validate_end_date_after_start_date(cls, v, values):
        """ตรวจสอบว่าวันที่สิ้นสุดต้องมากกว่าวันที่เริ่มต้น"""
        if v and 'display_start_date' in values and values['display_start_date']:
            if v <= values['display_start_date']:
                raise ValueError("Display end date must be after start date")
        return v
