from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID


class NewsBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: Optional[str] = None
    cover_image_url: Optional[str] = Field(None, max_length=1000, description="URL รูปปกหลัก")
    gallery_images: Optional[List[str]] = Field(None, description="รายการ URL รูปย่อย")
    is_published: bool = Field(default=True)


class NewsCreate(NewsBase):
    """Schema สำหรับสร้าง News ใหม่"""
    pass


class NewsUpdate(BaseModel):
    """Schema สำหรับอัปเดต News"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = None
    cover_image_url: Optional[str] = Field(None, max_length=1000, description="URL รูปปกหลัก")
    gallery_images: Optional[List[str]] = Field(None, description="รายการ URL รูปย่อย")
    is_published: Optional[bool] = None


class NewsResponse(NewsBase):
    """Schema สำหรับ response ข้อมูล News"""
    id: UUID
    view_count: str
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
