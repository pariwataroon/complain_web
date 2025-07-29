from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from app.api.middleware.api_key_verify import verify_api_key_or_token
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.schemas.news import (
    NewsCreate, NewsResponse, NewsUpdate, NewsListResponse,
    GalleryImageAdd, GalleryImageRemove, GalleryImagesUpdate,
    AdditionalLinkAdd, AdditionalLinkRemove, AdditionalLinksUpdate,
    NewsDisplaySchedule
)
from app.api.v1.controllers.news_controller import (
    get_news_list,
    get_news_by_id,
    create_news,
    update_news,
    delete_news,
    increment_view_count,
    get_published_news,
    get_displayable_news,
    add_gallery_image,
    remove_gallery_image,
    update_gallery_images,
    add_additional_link,
    remove_additional_link,
    update_additional_links,
    update_display_schedule,
    check_news_displayable
)

router = APIRouter(
    prefix="/news",
    tags=["news"],
)


@router.get("", response_model=FormatResponseModel)
async def read_news_list(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="ค้นหาใน title หรือ content"),
    is_published: Optional[bool] = Query(None, description="กรองตามสถานะการเผยแพร่"),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("homepage_news"))
):
    """ดึงข้อมูล News ทั้งหมด (สำหรับผู้ดูแลระบบ) - ต้องมีสิทธิ์อ่านใน news"""
    try:
        news_list = get_news_list(db, skip=skip, limit=limit, search=search, is_published=is_published)
        result = [NewsListResponse.model_validate(news).model_dump() for news in news_list]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching news: {str(e)}")
        return format_response("5000", {"error": "Error fetching news"})


@router.get("/public", response_model=FormatResponseModel)
async def read_published_news(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="ค้นหาใน title หรือ content"),
    db: Session = Depends(get_db),
):
    """ดึงข้อมูล News ที่เผยแพร่แล้ว (สำหรับผู้ใช้ทั่วไป) - ไม่ต้องมีสิทธิ์"""
    try:
        # ตรวจสอบ API Key หรือ Token
        is_authenticated = await verify_api_key_or_token(request, db)
        
        if not is_authenticated:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid API key/token"
            )
            
        news_list = get_published_news(db, skip=skip, limit=limit, search=search)
        result = [NewsListResponse.model_validate(news).model_dump() for news in news_list]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching published news: {str(e)}")
        return format_response("5000", {"error": "Error fetching published news"})


@router.get("/public/displayable", response_model=FormatResponseModel)
async def read_displayable_news(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="ค้นหาใน title หรือ content"),
    db: Session = Depends(get_db),
):
    """ดึงข้อมูล News ที่สามารถแสดงได้ในเวลาปัจจุบัน (เผยแพร่ + อยู่ในช่วงเวลาที่กำหนด) - ไม่ต้องมีสิทธิ์"""
    try:
        # ตรวจสอบ API Key หรือ Token
        is_authenticated = await verify_api_key_or_token(request, db)
        
        if not is_authenticated:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid API key/token"
            )
            
        news_list = get_displayable_news(db, skip=skip, limit=limit, search=search)
        result = [NewsListResponse.model_validate(news).model_dump() for news in news_list]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching displayable news: {str(e)}")
        return format_response("5000", {"error": "Error fetching displayable news"})


@router.get("/{news_id}", response_model=FormatResponseModel)
async def read_news(
    news_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("homepage_news"))
):
    """ดึงข้อมูล News ตาม ID - ต้องมีสิทธิ์อ่านใน news"""
    try:
        news = get_news_by_id(db, news_id)
        if not news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        result = NewsResponse.model_validate(news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching news: {str(e)}")
        return format_response("5000", {"error": "Error fetching news"})


@router.get("/public/{news_id}", response_model=FormatResponseModel)
async def read_published_news_by_id(
    request: Request,
    news_id: UUID,
    db: Session = Depends(get_db),
):
    """ดึงข้อมูล News ตาม ID (สำหรับผู้ใช้ทั่วไป) และเพิ่มจำนวนผู้ชม - ไม่ต้องมีสิทธิ์"""
    try:
        # ตรวจสอบ API Key หรือ Token
        is_authenticated = await verify_api_key_or_token(request, db)
        
        if not is_authenticated:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid API key/token"
            )
            
        news = get_news_by_id(db, news_id)
        if not news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        # ตรวจสอบว่าข่าวเผยแพร่แล้วหรือไม่
        if not news.is_published:
            return format_response("4040", {"error": "News not published"})
        
        # เพิ่มจำนวนผู้ชม
        updated_news = increment_view_count(db, news_id)
        
        result = NewsResponse.model_validate(updated_news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching published news: {str(e)}")
        return format_response("5000", {"error": "Error fetching published news"})


@router.post("", response_model=FormatResponseModel)
async def create_new_news(
    news: NewsCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("homepage_news"))
):
    """สร้าง News ใหม่ - ต้องมีสิทธิ์สร้างใน news"""
    try:
        db_news = create_news(db, news)
        result = NewsResponse.model_validate(db_news).model_dump()
        return format_response("0001", result)
    except Exception as e:
        print(f"Error creating news: {str(e)}")
        return format_response("5000", {"error": "Error creating news"})


@router.put("/{news_id}", response_model=FormatResponseModel)
async def update_existing_news(
    news_id: UUID,
    news_data: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("homepage_news"))
):
    """อัปเดตข้อมูล News - ต้องมีสิทธิ์แก้ไขใน news"""
    try:
        updated_news = update_news(db, news_id, news_data)
        if not updated_news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        result = NewsResponse.model_validate(updated_news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error updating news: {str(e)}")
        return format_response("5000", {"error": "Error updating news"})


@router.delete("/{news_id}", response_model=FormatResponseModel)
async def delete_existing_news(
    news_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("homepage_news"))
):
    """ลบ News - ต้องมีสิทธิ์ลบใน news"""
    try:
        success = delete_news(db, news_id)
        if not success:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        return format_response("0000", {"message": f"News with ID {news_id} deleted successfully"})
    except Exception as e:
        print(f"Error deleting news: {str(e)}")
        return format_response("5000", {"error": "Error deleting news"})


@router.patch("/{news_id}/view", response_model=FormatResponseModel)
async def increment_news_view_count(
    request: Request,
    news_id: UUID,
    db: Session = Depends(get_db),
):
    """เพิ่มจำนวนผู้ชม News - ไม่ต้องมีสิทธิ์"""
    try:
        # ตรวจสอบ API Key หรือ Token
        is_authenticated = await verify_api_key_or_token(request, db)
        
        if not is_authenticated:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid API key/token"
            )
            
        updated_news = increment_view_count(db, news_id)
        if not updated_news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        result = NewsResponse.model_validate(updated_news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error incrementing view count: {str(e)}")
        return format_response("5000", {"error": "Error incrementing view count"})


@router.post("/{news_id}/gallery", response_model=FormatResponseModel)
async def add_gallery_image_to_news(
    news_id: UUID,
    image_data: GalleryImageAdd,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("homepage_news"))
):
    """เพิ่มรูปภาพลงใน gallery - ต้องมีสิทธิ์แก้ไขใน news"""
    try:
        updated_news = add_gallery_image(db, news_id, image_data.image_url)
        if not updated_news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        result = NewsResponse.model_validate(updated_news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error adding gallery image: {str(e)}")
        return format_response("5000", {"error": "Error adding gallery image"})


@router.delete("/{news_id}/gallery", response_model=FormatResponseModel)
async def remove_gallery_image_from_news(
    news_id: UUID,
    image_data: GalleryImageRemove,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("homepage_news"))
):
    """ลบรูปภาพจาก gallery - ต้องมีสิทธิ์แก้ไขใน news"""
    try:
        updated_news = remove_gallery_image(db, news_id, image_data.image_url)
        if not updated_news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        result = NewsResponse.model_validate(updated_news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error removing gallery image: {str(e)}")
        return format_response("5000", {"error": "Error removing gallery image"})


@router.put("/{news_id}/gallery", response_model=FormatResponseModel)
async def update_news_gallery_images(
    news_id: UUID,
    gallery_data: GalleryImagesUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("homepage_news"))
):
    """อัปเดต gallery images ทั้งหมด - ต้องมีสิทธิ์แก้ไขใน news"""
    try:
        updated_news = update_gallery_images(db, news_id, gallery_data.image_urls)
        if not updated_news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        result = NewsResponse.model_validate(updated_news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error updating gallery images: {str(e)}")
        return format_response("5000", {"error": "Error updating gallery images"})


@router.post("/{news_id}/links", response_model=FormatResponseModel)
async def add_additional_link_to_news(
    news_id: UUID,
    link_data: AdditionalLinkAdd,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("homepage_news"))
):
    """เพิ่มลิงก์เพิ่มเติมลงในข่าว - ต้องมีสิทธิ์แก้ไขใน news"""
    try:
        updated_news = add_additional_link(db, news_id, link_data.link.dict())
        if not updated_news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        result = NewsResponse.model_validate(updated_news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error adding additional link: {str(e)}")
        return format_response("5000", {"error": "Error adding additional link"})


@router.delete("/{news_id}/links", response_model=FormatResponseModel)
async def remove_additional_link_from_news(
    news_id: UUID,
    link_data: AdditionalLinkRemove,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("homepage_news"))
):
    """ลบลิงก์เพิ่มเติมจากข่าว - ต้องมีสิทธิ์แก้ไขใน news"""
    try:
        updated_news = remove_additional_link(db, news_id, link_data.link_title)
        if not updated_news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        result = NewsResponse.model_validate(updated_news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error removing additional link: {str(e)}")
        return format_response("5000", {"error": "Error removing additional link"})


@router.put("/{news_id}/links", response_model=FormatResponseModel)
async def update_news_additional_links(
    news_id: UUID,
    links_data: AdditionalLinksUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("homepage_news"))
):
    """อัปเดตลิงก์เพิ่มเติมทั้งหมด - ต้องมีสิทธิ์แก้ไขใน news"""
    try:
        links = [link.dict() for link in links_data.links]
        updated_news = update_additional_links(db, news_id, links)
        if not updated_news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        result = NewsResponse.model_validate(updated_news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error updating additional links: {str(e)}")
        return format_response("5000", {"error": "Error updating additional links"})


@router.put("/{news_id}/schedule", response_model=FormatResponseModel)
async def update_news_display_schedule(
    news_id: UUID,
    schedule_data: NewsDisplaySchedule,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("homepage_news"))
):
    """อัปเดตระยะเวลาการแสดงข่าว - ต้องมีสิทธิ์แก้ไขใน news"""
    try:
        updated_news = update_display_schedule(
            db, news_id, 
            schedule_data.display_start_date, 
            schedule_data.display_end_date
        )
        if not updated_news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        result = NewsResponse.model_validate(updated_news).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error updating display schedule: {str(e)}")
        return format_response("5000", {"error": "Error updating display schedule"})


@router.get("/{news_id}/displayable", response_model=FormatResponseModel)
async def check_news_displayable_status(
    request: Request,
    news_id: UUID,
    db: Session = Depends(get_db),
):
    """ตรวจสอบว่าข่าวสามารถแสดงได้ในเวลาปัจจุบันหรือไม่ - ไม่ต้องมีสิทธิ์"""
    try:
        # ตรวจสอบ API Key หรือ Token
        is_authenticated = await verify_api_key_or_token(request, db)
        
        if not is_authenticated:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid API key/token"
            )
            
        news = get_news_by_id(db, news_id)
        if not news:
            return format_response("4040", {"error": f"News with ID {news_id} not found"})
        
        is_displayable = check_news_displayable(news)
        result = {
            "news_id": str(news_id),
            "is_displayable": is_displayable,
            "is_published": news.is_published,
            "display_start_date": news.display_start_date.isoformat() if news.display_start_date else None,
            "display_end_date": news.display_end_date.isoformat() if news.display_end_date else None
        }
        return format_response("0000", result)
    except Exception as e:
        print(f"Error checking displayable status: {str(e)}")
        return format_response("5000", {"error": "Error checking displayable status"})
