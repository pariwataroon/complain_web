from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.schemas.chat_bot import ChatBotCreate, ChatBotResponse, ChatBotUpdate
from app.api.v1.controllers.chat_bot_controller import (
    get_chat_bots,
    get_chat_bot_by_id,
    create_chat_bot,
    update_chat_bot,
    delete_chat_bot,
    search_chat_bot_by_keywords
)

router = APIRouter(
    prefix="/chat_bot",
    tags=["chat bot"],
)


@router.get("", response_model=FormatResponseModel)
async def read_chat_bots(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="ค้นหาใน title, detail หรือ keyword"),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("homepage_chatbot"))
):
    """ดึงข้อมูล ChatBot ทั้งหมด (tensor flow user) - ต้องมีสิทธิ์อ่านใน chat_bot"""
    try:
        chat_bots = get_chat_bots(db, skip=skip, limit=limit, search=search)
        result = [ChatBotResponse.model_validate(chat_bot).model_dump() for chat_bot in chat_bots]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching chat bots: {str(e)}")
        return format_response("5000", {"error": "Error fetching chat bots"})


@router.get("/{chat_bot_id}", response_model=FormatResponseModel)
async def read_chat_bot(
    chat_bot_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("homepage_chatbot"))
):
    """ดึงข้อมูล ChatBot ตาม ID - ต้องมีสิทธิ์อ่านใน chat_bot"""
    try:
        chat_bot = get_chat_bot_by_id(db, chat_bot_id)
        if not chat_bot:
            return format_response("4040", {"error": f"Chat bot with ID {chat_bot_id} not found"})
        
        result = ChatBotResponse.model_validate(chat_bot).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching chat bot: {str(e)}")
        return format_response("5000", {"error": "Error fetching chat bot"})


@router.post("", response_model=FormatResponseModel)
async def create_new_chat_bot(
    chat_bot: ChatBotCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("homepage_chatbot"))
):
    """สร้าง ChatBot ใหม่ - ต้องมีสิทธิ์สร้างใน chat_bot"""
    try:
        db_chat_bot = create_chat_bot(db, chat_bot)
        result = ChatBotResponse.model_validate(db_chat_bot).model_dump()
        return format_response("0001", result)
    except Exception as e:
        print(f"Error creating chat bot: {str(e)}")
        return format_response("5000", {"error": "Error creating chat bot"})


@router.put("/{chat_bot_id}", response_model=FormatResponseModel)
async def update_existing_chat_bot(
    chat_bot_id: UUID,
    chat_bot_data: ChatBotUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("homepage_chatbot"))
):
    """อัปเดตข้อมูล ChatBot - ต้องมีสิทธิ์แก้ไขใน chat_bot"""
    try:
        updated_chat_bot = update_chat_bot(db, chat_bot_id, chat_bot_data)
        if not updated_chat_bot:
            return format_response("4040", {"error": f"Chat bot with ID {chat_bot_id} not found"})
        
        result = ChatBotResponse.model_validate(updated_chat_bot).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error updating chat bot: {str(e)}")
        return format_response("5000", {"error": "Error updating chat bot"})


@router.delete("/{chat_bot_id}", response_model=FormatResponseModel)
async def delete_existing_chat_bot(
    chat_bot_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("homepage_chatbot"))
):
    """ลบ ChatBot - ต้องมีสิทธิ์ลบใน chat_bot"""
    try:
        success = delete_chat_bot(db, chat_bot_id)
        if not success:
            return format_response("4040", {"error": f"Chat bot with ID {chat_bot_id} not found"})
        
        return format_response("0000", {"message": f"Chat bot with ID {chat_bot_id} deleted successfully"})
    except Exception as e:
        print(f"Error deleting chat bot: {str(e)}")
        return format_response("5000", {"error": "Error deleting chat bot"})


@router.get("/search/by-keywords", response_model=FormatResponseModel)
async def search_chat_bots_by_keywords(
    keywords: List[str] = Query(..., description="รายการ keywords ที่ต้องการค้นหา"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("homepage_chatbot"))
):
    """ค้นหา ChatBot ตาม keywords - ต้องมีสิทธิ์อ่านใน chat_bot"""
    try:
        chat_bots = search_chat_bot_by_keywords(db, keywords, skip=skip, limit=limit)
        result = [ChatBotResponse.model_validate(chat_bot).model_dump() for chat_bot in chat_bots]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error searching chat bots by keywords: {str(e)}")
        return format_response("5000", {"error": "Error searching chat bots by keywords"})
