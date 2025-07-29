import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from models.news import News
from config.database import get_db
from lib.logger import get_logger

logger = get_logger("news_seeder")


def load_news_seed_data():
    """โหลดข้อมูล seed จากไฟล์ JSON"""
    try:
        with open('seed/news_seed.json', 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        logger.error("News seed file not found")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing news seed JSON: {e}")
        return []


def seed_news(db: Session):
    """เพิ่มข้อมูล News ลงในฐานข้อมูล"""
    try:
        # ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
        existing_count = db.query(News).count()
        if existing_count > 0:
            logger.info(f"News table already has {existing_count} records. Skipping seed.")
            return

        # โหลดข้อมูล seed
        news_data = load_news_seed_data()
        if not news_data:
            logger.warning("No news seed data to insert")
            return

        # เพิ่มข้อมูลลงในฐานข้อมูล
        for news_item in news_data:
            db_news = News(
                id=uuid.uuid4(),
                title=news_item['title'],
                content=news_item['content'],
                image_url=news_item['image_url'],
                is_published=news_item['is_published'],
                view_count="0",
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(db_news)

        db.commit()
        logger.info(f"Successfully seeded {len(news_data)} news records")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding news data: {e}")
        raise


def main():
    """ฟังก์ชันหลักสำหรับรัน seeder"""
    db = next(get_db())
    try:
        seed_news(db)
        print("News seeding completed successfully!")
    except Exception as e:
        print(f"Error during news seeding: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
