from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID


class ChatBotBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    detail: Optional[str] = None
    keyword: Optional[List[str]] = None


class ChatBotCreate(ChatBotBase):
    """Schema สำหรับสร้าง ChatBot ใหม่"""
    pass


class ChatBotUpdate(BaseModel):
    """Schema สำหรับอัปเดต ChatBot"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    detail: Optional[str] = None
    keyword: Optional[List[str]] = None


class ChatBotResponse(ChatBotBase):
    """Schema สำหรับ response ข้อมูล ChatBot"""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatBotInDB(ChatBotResponse):
    """Schema สำหรับข้อมูล ChatBot ในฐานข้อมูล"""
    pass
