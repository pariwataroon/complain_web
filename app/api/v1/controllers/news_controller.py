from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc, and_
from typing import List, Optional
from datetime import datetime
import pytz

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
        # ตรวจสอบและจัดการ gallery_images
        gallery_images = news.gallery_images if news.gallery_images else []
        
        # ตรวจสอบและจัดการ additional_links
        additional_links = []
        if news.additional_links:
            additional_links = [link.dict() for link in news.additional_links]
        
        db_news = News(
            title=news.title,
            content=news.content,
            cover_image_url=news.cover_image_url,
            gallery_images=gallery_images,
            additional_links=additional_links,
            is_published=news.is_published,
            display_start_date=news.display_start_date,
            display_end_date=news.display_end_date,
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
        
        # จัดการ gallery_images แยกต่างหาก
        if 'gallery_images' in update_data:
            gallery_images = update_data['gallery_images']
            if gallery_images is None:
                db_news.gallery_images = []
            else:
                db_news.gallery_images = gallery_images
            del update_data['gallery_images']
        
        # จัดการ additional_links แยกต่างหาก
        if 'additional_links' in update_data:
            additional_links = update_data['additional_links']
            if additional_links is None:
                db_news.additional_links = []
            else:
                db_news.additional_links = [link.dict() if hasattr(link, 'dict') else link for link in additional_links]
            del update_data['additional_links']
        
        # อัปเดตฟิลด์อื่นๆ
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


def get_displayable_news(db: Session, skip: int = 0, limit: int = 100, search: str = None) -> List[News]:
    """ดึงข้อมูล News ที่สามารถแสดงได้ในช่วงเวลาปัจจุบัน (เผยแพร่แล้ว + อยู่ในช่วงเวลาที่กำหนด)"""
    query = db.query(News)
    
    # กรองเฉพาะข่าวที่เผยแพร่แล้ว
    query = query.filter(News.is_published == True)
    
    # ตรวจสอบช่วงเวลาการแสดง
    bangkok_tz = pytz.timezone('Asia/Bangkok')
    current_time = datetime.now(bangkok_tz)
    
    # กรองข่าวที่อยู่ในช่วงเวลาแสดง
    display_conditions = []
    
    # ข่าวที่ไม่มีการกำหนดเวลา (แสดงได้ตลอด)
    no_schedule = and_(News.display_start_date.is_(None), News.display_end_date.is_(None))
    display_conditions.append(no_schedule)
    
    # ข่าวที่มีเฉพาะวันเริ่มต้น (ต้องผ่านวันเริ่มต้นแล้ว)
    start_only = and_(News.display_start_date.isnot(None), News.display_end_date.is_(None), News.display_start_date <= current_time)
    display_conditions.append(start_only)
    
    # ข่าวที่มีเฉพาะวันสิ้นสุด (ต้องยังไม่ถึงวันสิ้นสุด)
    end_only = and_(News.display_start_date.is_(None), News.display_end_date.isnot(None), News.display_end_date >= current_time)
    display_conditions.append(end_only)
    
    # ข่าวที่มีทั้งวันเริ่มต้นและสิ้นสุด (ต้องอยู่ในช่วง)
    full_schedule = and_(
        News.display_start_date.isnot(None), 
        News.display_end_date.isnot(None),
        News.display_start_date <= current_time,
        News.display_end_date >= current_time
    )
    display_conditions.append(full_schedule)
    
    query = query.filter(or_(*display_conditions))
    
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


def add_gallery_image(db: Session, news_id: UUID, image_url: str) -> Optional[News]:
    """เพิ่มรูปภาพลงใน gallery"""
    try:
        db_news = get_news_by_id(db, news_id)
        if not db_news:
            return None
        
        # ตรวจสอบว่ามี gallery_images หรือไม่
        if not db_news.gallery_images:
            db_news.gallery_images = []
        
        # เพิ่มรูปใหม่ถ้ายังไม่มี
        if image_url not in db_news.gallery_images:
            db_news.gallery_images.append(image_url)
            
            db.commit()
            db.refresh(db_news)
            logger.info(f"Added gallery image to news {news_id}: {image_url}")
        
        return db_news
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding gallery image to news {news_id}: {str(e)}")
        raise


def remove_gallery_image(db: Session, news_id: UUID, image_url: str) -> Optional[News]:
    """ลบรูปภาพจาก gallery"""
    try:
        db_news = get_news_by_id(db, news_id)
        if not db_news:
            return None
        
        # ตรวจสอบว่ามี gallery_images หรือไม่
        if db_news.gallery_images and image_url in db_news.gallery_images:
            db_news.gallery_images.remove(image_url)
            
            db.commit()
            db.refresh(db_news)
            logger.info(f"Removed gallery image from news {news_id}: {image_url}")
        
        return db_news
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing gallery image from news {news_id}: {str(e)}")
        raise


def update_gallery_images(db: Session, news_id: UUID, image_urls: List[str]) -> Optional[News]:
    """อัปเดต gallery images ทั้งหมด"""
    try:
        db_news = get_news_by_id(db, news_id)
        if not db_news:
            return None
        
        db_news.gallery_images = image_urls
        
        db.commit()
        db.refresh(db_news)
        logger.info(f"Updated gallery images for news {news_id}: {len(image_urls)} images")
        return db_news
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating gallery images for news {news_id}: {str(e)}")
        raise


def add_additional_link(db: Session, news_id: UUID, link_data: dict) -> Optional[News]:
    """เพิ่มลิงก์เพิ่มเติมลงในข่าว"""
    try:
        db_news = get_news_by_id(db, news_id)
        if not db_news:
            return None
        
        # ตรวจสอบว่ามี additional_links หรือไม่
        if not db_news.additional_links:
            db_news.additional_links = []
        
        # ตรวจสอบว่ามีลิงก์ที่มีชื่อเดียวกันหรือไม่
        existing_titles = [link.get('title') for link in db_news.additional_links]
        if link_data['title'] not in existing_titles:
            db_news.additional_links.append(link_data)
            
            db.commit()
            db.refresh(db_news)
            logger.info(f"Added additional link to news {news_id}: {link_data['title']}")
        
        return db_news
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding additional link to news {news_id}: {str(e)}")
        raise


def remove_additional_link(db: Session, news_id: UUID, link_title: str) -> Optional[News]:
    """ลบลิงก์เพิ่มเติมจากข่าว"""
    try:
        db_news = get_news_by_id(db, news_id)
        if not db_news:
            return None
        
        # ตรวจสอบว่ามี additional_links หรือไม่
        if db_news.additional_links:
            db_news.additional_links = [
                link for link in db_news.additional_links 
                if link.get('title') != link_title
            ]
            
            db.commit()
            db.refresh(db_news)
            logger.info(f"Removed additional link from news {news_id}: {link_title}")
        
        return db_news
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing additional link from news {news_id}: {str(e)}")
        raise


def update_additional_links(db: Session, news_id: UUID, links: List[dict]) -> Optional[News]:
    """อัปเดตลิงก์เพิ่มเติมทั้งหมด"""
    try:
        db_news = get_news_by_id(db, news_id)
        if not db_news:
            return None
        
        db_news.additional_links = links
        
        db.commit()
        db.refresh(db_news)
        logger.info(f"Updated additional links for news {news_id}: {len(links)} links")
        return db_news
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating additional links for news {news_id}: {str(e)}")
        raise


def update_display_schedule(db: Session, news_id: UUID, start_date: Optional[datetime], end_date: Optional[datetime]) -> Optional[News]:
    """อัปเดตระยะเวลาการแสดงข่าว"""
    try:
        db_news = get_news_by_id(db, news_id)
        if not db_news:
            return None
        
        db_news.display_start_date = start_date
        db_news.display_end_date = end_date
        
        db.commit()
        db.refresh(db_news)
        logger.info(f"Updated display schedule for news {news_id}")
        return db_news
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating display schedule for news {news_id}: {str(e)}")
        raise


def check_news_displayable(news: News) -> bool:
    """ตรวจสอบว่าข่าวสามารถแสดงได้ในเวลาปัจจุบันหรือไม่"""
    if not news.is_published:
        return False
    
    bangkok_tz = pytz.timezone('Asia/Bangkok')
    current_time = datetime.now(bangkok_tz)
    
    # ถ้าไม่มีการกำหนดเวลา ให้แสดงได้
    if not news.display_start_date and not news.display_end_date:
        return True
    
    # ตรวจสอบวันเริ่มต้น
    if news.display_start_date and current_time < news.display_start_date:
        return False
    
    # ตรวจสอบวันสิ้นสุด
    if news.display_end_date and current_time > news.display_end_date:
        return False
    
    return True
