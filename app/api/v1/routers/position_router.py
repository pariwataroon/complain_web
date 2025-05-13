from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from app.api.v1.controllers.position_controller import (
    DuplicateKeyError, create_position, update_position, delete_position,
    get_positions, get_position_by_id, search_positions_by_name,
    assign_position_to_user, get_user_positions, get_primary_position,
    update_user_position, remove_position_from_user
)
from app.api.v1.schemas.positions import PositionCreate, PositionUpdate, UserPositionCreate, UserPositionUpdate
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/positions",
    tags=["positions"],
)

# ======== ส่วนจัดการตำแหน่ง (Position) ========
@router.get("", response_model=FormatResponseModel)
async def read_positions(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการตำแหน่งทั้งหมด"""
    positions_data = get_positions(db, skip=skip, limit=limit)
    return format_response("0000", positions_data)

@router.get("/{position_id}", response_model=FormatResponseModel)
async def read_position(
    position_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงข้อมูลตำแหน่งตาม ID"""
    position = get_position_by_id(db, position_id=position_id)
    if position is None:
        raise HTTPException(status_code=404, detail=f"Position with ID {position_id} not found")
    return format_response("0000", position)

@router.get("/search/by-name", response_model=FormatResponseModel)
async def search_positions_by_name_endpoint(
    search_term: str,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ค้นหาตำแหน่งตามชื่อหรือคำอธิบาย"""
    positions = search_positions_by_name(db, search_term=search_term, skip=skip, limit=limit)
    return format_response("0000", positions)

@router.post("", response_model=FormatResponseModel)
async def create_position_endpoint(
    position: PositionCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """สร้างตำแหน่งใหม่"""
    try:
        position_data = position.model_dump()
        db_position = create_position(db, position_data)
        return format_response("0001", db_position)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.put("/{position_id}", response_model=FormatResponseModel)
async def update_position_endpoint(
    position_id: UUID, 
    position: PositionUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_users"))
):
    """อัปเดตข้อมูลตำแหน่ง"""
    try:
        position_data = {k: v for k, v in position.model_dump().items() if v is not None}
        db_position = update_position(db, position_id=position_id, position_data=position_data)
        
        if db_position is None:
            raise HTTPException(status_code=404, detail=f"Position with ID {position_id} not found")
            
        return format_response("0002", db_position)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.delete("/{position_id}", response_model=FormatResponseModel)
async def delete_position_endpoint(
    position_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_users"))
):
    """ลบตำแหน่ง (soft delete)"""
    success = delete_position(db, position_id=position_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Position with ID {position_id} not found")
    return format_response("0003", {"id": str(position_id)})

# ======== ส่วนจัดการตำแหน่งของผู้ใช้ (UserPosition) ========
@router.get("/user/{user_id}", response_model=FormatResponseModel)
async def read_user_positions(
    user_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงข้อมูลตำแหน่งทั้งหมดของผู้ใช้"""
    positions = get_user_positions(db, user_id=user_id)
    return format_response("0000", positions)

@router.get("/user/{user_id}/primary", response_model=FormatResponseModel)
async def read_user_primary_position(
    user_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงข้อมูลตำแหน่งหลักของผู้ใช้"""
    position = get_primary_position(db, user_id=user_id)
    return format_response("0000", position)

@router.post("/user/assign", response_model=FormatResponseModel)
async def assign_position_to_user_endpoint(
    user_position: UserPositionCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_users"))
):
    """กำหนดตำแหน่งให้กับผู้ใช้"""
    try:
        data = user_position.model_dump()
        
        # แปลงวันที่ในรูปแบบ str เป็น datetime ถ้ามีการระบุ
        start_date = None
        if "start_date" in data and data["start_date"]:
            if isinstance(data["start_date"], str):
                start_date = datetime.fromisoformat(data["start_date"].replace('Z', '+00:00'))
            else:
                start_date = data["start_date"]
        
        db_user_position = assign_position_to_user(
            db, 
            user_id=data["user_id"], 
            position_id=data["position_id"],
            is_primary=data.get("is_primary", False),
            start_date=start_date
        )
        
        return format_response("0001", db_user_position)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.put("/user/{user_position_id}", response_model=FormatResponseModel)
async def update_user_position_endpoint(
    user_position_id: UUID, 
    user_position: UserPositionUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_users"))
):
    """อัปเดตข้อมูลตำแหน่งของผู้ใช้"""
    try:
        position_data = {k: v for k, v in user_position.model_dump().items() if v is not None}
        
        # แปลงวันที่ในรูปแบบ str เป็น datetime
        for date_field in ["start_date", "end_date"]:
            if date_field in position_data and isinstance(position_data[date_field], str):
                position_data[date_field] = datetime.fromisoformat(position_data[date_field].replace('Z', '+00:00'))
        
        db_user_position = update_user_position(db, user_position_id=user_position_id, data=position_data)
        
        if db_user_position is None:
            raise HTTPException(status_code=404, detail=f"User position with ID {user_position_id} not found")
            
        return format_response("0002", db_user_position)
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.delete("/user/{user_position_id}", response_model=FormatResponseModel)
async def remove_position_from_user_endpoint(
    user_position_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_users"))
):
    """ลบตำแหน่งออกจากผู้ใช้"""
    success = remove_position_from_user(db, user_position_id=user_position_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User position with ID {user_position_id} not found")
    return format_response("0003", {"id": str(user_position_id)})