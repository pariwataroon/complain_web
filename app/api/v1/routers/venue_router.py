from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import bleach

from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.venue_controller import (
    DuplicateKeyError, create_venue, delete_venue,
    get_venues, get_venue_by_id, get_venues_by_group,
    search_venues_by_department, search_venues_by_name,
    update_venue, get_venues_stats, update_venue_order_batch,
    get_venues_grouped_by_department
)
from app.api.v1.schemas.venues import Venue, VenueCreate, VenueUpdate, VenueGroupWithItems
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/venues",
    tags=["venues"],
)

@router.get("", response_model=FormatResponseModel)
async def read_venues(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงรายการสถานที่ทั้งหมด"""
    venues_data = get_venues(db, skip=skip, limit=limit)
    return format_response("0000", venues_data)

@router.get("/grouped", response_model=FormatResponseModel)
async def read_venues_by_group(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงข้อมูลสถานที่แบ่งตามกลุ่ม"""
    grouped_data = get_venues_by_group(db, skip=skip, limit=limit)
    return format_response("0000", grouped_data)

@router.get("/grouped/department", response_model=FormatResponseModel)
async def read_venues_by_department(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงข้อมูลสถานที่แบ่งตามหน่วยงาน และจัดกลุ่มภายในอีกที"""
    grouped_data = get_venues_grouped_by_department(db, skip=skip, limit=limit)
    return format_response("0000", grouped_data)

@router.get("/{venue_id}", response_model=FormatResponseModel)
async def read_venue(
    venue_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงข้อมูลสถานที่ตาม ID"""
    venue = get_venue_by_id(db, venue_id=venue_id)
    if venue is None:
        raise HTTPException(status_code=404, detail=f"Venue with ID {venue_id} not found")
    return format_response("0000", venue)

@router.get("/search/by-department", response_model=FormatResponseModel)
async def search_venues_by_department_endpoint(
    department_id: UUID,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ค้นหาสถานที่ตามหน่วยงาน"""
    venues = search_venues_by_department(db, department_id=department_id, skip=skip, limit=limit)
    return format_response("0000", venues)

@router.get("/search/by-name", response_model=FormatResponseModel)
async def search_venues_by_name_endpoint(
    search_term: str,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ค้นหาสถานที่ตามชื่อ รหัส หรือตัวย่อ"""
    venues = search_venues_by_name(db, search_term=search_term, skip=skip, limit=limit)
    return format_response("0000", venues)

@router.post("", response_model=FormatResponseModel)
async def create_venue_endpoint(
    venue: VenueCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_department"))
):
    """สร้างสถานที่ใหม่"""
    try:
        venue_data = venue.model_dump()

        if "name" in venue_data:
            venue_data["name"] = bleach.clean(venue_data["name"], tags=[], attributes={})

        db_venue = create_venue(db, venue_data)

        response_data = {
            "id": db_venue.id,
            "code": db_venue.code,
            "created_at": db_venue.created_at
        }

        return format_response("0001", response_data)

    except DuplicateKeyError as e:
        return format_response("4090", {"error": "ชื่อสถานที่ซ้ำ"})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.put("/{venue_id}", response_model=FormatResponseModel)
async def update_venue_endpoint(
    venue_id: UUID, 
    venue: VenueUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_department"))
):
    """อัปเดตข้อมูลสถานที่"""
    try:
        venue_data = {k: v for k, v in venue.model_dump().items() if v is not None}

        if "name" in venue_data:
            venue_data["name"] = bleach.clean(venue_data["name"], tags=[], attributes={})

        db_venue = update_venue(db, venue_id=venue_id, venue_data=venue_data)

        if db_venue is None:
            raise HTTPException(status_code=404, detail=f"Venue with ID {venue_id} not found")

        response_data = {
            "id": db_venue.id,
            "code": db_venue.code,
            "updated_at": db_venue.updated_at
        }

        return format_response("0002", response_data)

    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})


@router.delete("/{venue_id}", response_model=FormatResponseModel)
async def delete_venue_endpoint(
    venue_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_department"))
):
    """ลบสถานที่ (soft delete)"""
    success = delete_venue(db, venue_id=venue_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Venue with ID {venue_id} not found")
    return format_response("0003", {"id": venue_id})

@router.get("/stats/overview", response_model=FormatResponseModel)
async def get_venues_stats_endpoint(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงข้อมูลสถิติสำหรับสถานที่"""
    stats = get_venues_stats(db)
    return format_response("0000", stats)

# เพิ่ม endpoint ใหม่สำหรับการอัปเดตลำดับหลายรายการพร้อมกัน
@router.post("/batch-update-order", response_model=FormatResponseModel)
async def update_venue_order_batch_endpoint(
    order_data: List[Dict[str, Any]] = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_department"))
):
    """อัปเดตลำดับของสถานที่หลายรายการพร้อมกัน"""
    updated_venues = update_venue_order_batch(db, order_data)
    return format_response("0002", updated_venues)