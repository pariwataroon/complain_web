from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional

from models.chat_bot import ChatBot
from app.api.v1.schemas.chat_bot import ChatBotCreate, ChatBotUpdate
from lib.logger import get_logger

logger = get_logger("chat_bot_controller", console_output=False)


def get_chat_bots(db: Session, skip: int = 0, limit: int = 100, search: str = None) -> List[ChatBot]:
    """ดึงข้อมูล ChatBot ทั้งหมด พร้อมฟีเจอร์ค้นหา"""
    query = db.query(ChatBot)
    
    # ถ้ามีการค้นหา ให้ค้นหาใน title, detail และ keyword
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                ChatBot.title.like(search_term),
                ChatBot.detail.like(search_term),
                func.json_value(ChatBot.keyword, '$').like(search_term)  # ค้นหาใน JSON array
            )
        )
    
    return query.order_by(ChatBot.created_at.desc()).offset(skip).limit(limit).all()


def get_chat_bot_by_id(db: Session, chat_bot_id: UUID) -> Optional[ChatBot]:
    """ดึงข้อมูล ChatBot ตาม ID"""
    return db.query(ChatBot).filter(ChatBot.id == chat_bot_id).first()


def create_chat_bot(db: Session, chat_bot: ChatBotCreate) -> ChatBot:
    """สร้าง ChatBot ใหม่"""
    try:
        db_chat_bot = ChatBot(
            title=chat_bot.title,
            detail=chat_bot.detail,
            keyword=chat_bot.keyword
        )
        db.add(db_chat_bot)
        db.commit()
        db.refresh(db_chat_bot)
        logger.info(f"Created new chat bot: {db_chat_bot.id}")
        return db_chat_bot
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating chat bot: {str(e)}")
        raise


def update_chat_bot(db: Session, chat_bot_id: UUID, chat_bot_data: ChatBotUpdate) -> Optional[ChatBot]:
    """อัปเดต ChatBot"""
    try:
        db_chat_bot = get_chat_bot_by_id(db, chat_bot_id)
        if not db_chat_bot:
            return None
        
        update_data = chat_bot_data.model_dump(exclude_unset=True, exclude_none=True)
        
        for key, value in update_data.items():
            setattr(db_chat_bot, key, value)
        
        db.commit()
        db.refresh(db_chat_bot)
        logger.info(f"Updated chat bot: {chat_bot_id}")
        return db_chat_bot
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating chat bot {chat_bot_id}: {str(e)}")
        raise


def delete_chat_bot(db: Session, chat_bot_id: UUID) -> bool:
    """ลบ ChatBot"""
    try:
        db_chat_bot = get_chat_bot_by_id(db, chat_bot_id)
        if not db_chat_bot:
            return False
        
        db.delete(db_chat_bot)
        db.commit()
        logger.info(f"Deleted chat bot: {chat_bot_id}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting chat bot {chat_bot_id}: {str(e)}")
        raise


def search_chat_bot_by_keywords(db: Session, keywords: List[str], skip: int = 0, limit: int = 100) -> List[ChatBot]:
    """ค้นหา ChatBot ตาม keywords"""
    if not keywords:
        return []
    
    # สร้างเงื่อนไขค้นหาสำหรับแต่ละ keyword
    conditions = []
    for keyword in keywords:
        search_term = f"%{keyword}%"
        conditions.append(
            or_(
                ChatBot.title.like(search_term),
                ChatBot.detail.like(search_term),
                func.json_value(ChatBot.keyword, '$').like(search_term)
            )
        )
    
    # รวมเงื่อนไขด้วย OR
    final_condition = or_(*conditions) if len(conditions) > 1 else conditions[0]
    
    return db.query(ChatBot).filter(final_condition)\
        .order_by(ChatBot.created_at.desc())\
        .offset(skip).limit(limit).all()
