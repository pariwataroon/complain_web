from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from typing import List, Optional

from models.news import News
from app.api.v1.schemas.news import NewsCreate, NewsUpdate
from lib.logger import get_logger

logger = get_logger("news_controller", console_output=False)


def get_news_list(db: Session, skip: int = 0, limit: int = 100, search: str = None, is_published: bool = None) -> List[News]:
    """ดึงข้อมูล News ทั้งหมด พร้อมฟีเจอร์ค้นหา"""
    query = db.query(News)
    
    # กรองตามสถานะการเผยแพร่
    if is_published is not None:
        query = query.filter(News.is_published == is_published)
    
    # ถ้ามีการค้นหา ให้ค้นหาใน title และ content
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                News.title.like(search_term),
                News.content.like(search_term)
            )
        )
    
    return query.order_by(desc(News.created_at)).offset(skip).limit(limit).all()


def get_news_by_id(db: Session, news_id: UUID) -> Optional[News]:
    """ดึงข้อมูล News ตาม ID"""
    return db.query(News).filter(News.id == news_id).first()


def create_news(db: Session, news: NewsCreate) -> News:
    """สร้าง News ใหม่"""
    try:
        db_news = News(
            title=news.title,
            content=news.content,
            image_url=news.image_url,
            is_published=news.is_published,
            view_count="0"
        )
        db.add(db_news)
        db.commit()
        db.refresh(db_news)
        logger.info(f"Created new news: {db_news.id}")
        return db_news
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating news: {str(e)}")
        raise


def update_news(db: Session, news_id: UUID, news_data: NewsUpdate) -> Optional[News]:
    """อัปเดต News"""
    try:
        db_news = get_news_by_id(db, news_id)
        if not db_news:
            return None
        
        update_data = news_data.model_dump(exclude_unset=True, exclude_none=True)
        
        for key, value in update_data.items():
            setattr(db_news, key, value)
        
        db.commit()
        db.refresh(db_news)
        logger.info(f"Updated news: {news_id}")
        return db_news
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating news {news_id}: {str(e)}")
        raise


def delete_news(db: Session, news_id: UUID) -> bool:
    """ลบ News"""
    try:
        db_news = get_news_by_id(db, news_id)
        if not db_news:
            return False
        
        db.delete(db_news)
        db.commit()
        logger.info(f"Deleted news: {news_id}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting news {news_id}: {str(e)}")
        raise


def increment_view_count(db: Session, news_id: UUID) -> Optional[News]:
    """เพิ่มจำนวนผู้ชม"""
    try:
        db_news = get_news_by_id(db, news_id)
        if not db_news:
            return None
        
        # แปลง view_count เป็น int เพื่อเพิ่มค่า แล้วแปลงกลับเป็น string
        current_views = int(db_news.view_count) if db_news.view_count.isdigit() else 0
        db_news.view_count = str(current_views + 1)
        
        db.commit()
        db.refresh(db_news)
        logger.info(f"Incremented view count for news: {news_id}, new count: {db_news.view_count}")
        return db_news
    except Exception as e:
        db.rollback()
        logger.error(f"Error incrementing view count for news {news_id}: {str(e)}")
        raise


def get_published_news(db: Session, skip: int = 0, limit: int = 100, search: str = None) -> List[News]:
    """ดึงข้อมูล News ที่เผยแพร่แล้วเท่านั้น (สำหรับผู้ใช้ทั่วไป)"""
    return get_news_list(db, skip=skip, limit=limit, search=search, is_published=True)
