from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.schemas.time_setting import TimeSettingCreate, TimeSettingResponse, TimeSettingUpdate
from app.api.v1.controllers.time_setting_controller import (
    get_time_settings, 
    get_time_setting_by_id, 
    get_time_setting_by_key,
    create_time_setting, 
    update_time_setting, 
    delete_time_setting
)

router = APIRouter(
    prefix="/time-settings",
    tags=["time settings"],
)

@router.post("", response_model=FormatResponseModel)
async def create_new_time_setting(
    time_setting: TimeSettingCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_times"))
):
    """สร้างการตั้งค่าระยะเวลาใหม่ - ต้องมีสิทธิ์สร้างใน setting_times"""
    try:
        # ตรวจสอบว่ามี key ซ้ำกันหรือไม่
        existing = get_time_setting_by_key(db, time_setting.key)
        if existing:
            return format_response("4090", {"error": f"Time setting with key '{time_setting.key}' already exists"})
            
        db_time_setting = create_time_setting(db, time_setting)
        result = TimeSettingResponse.model_validate(db_time_setting).model_dump()
        return format_response("0001", result)
    except Exception as e:
        print(f"Error creating time setting: {str(e)}")
        return format_response("5000", {"error": "Error creating time setting"})

@router.get("/", response_model=FormatResponseModel)
async def read_time_settings(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_times"))
):
    """ดึงข้อมูลการตั้งค่าระยะเวลาทั้งหมด - ต้องมีสิทธิ์อ่านใน setting_times"""
    try:
        time_settings = get_time_settings(db, skip=skip, limit=limit)
        result = [TimeSettingResponse.model_validate(setting).model_dump() for setting in time_settings]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching time settings: {str(e)}")
        return format_response("5000", {"error": "Error fetching time settings"})

@router.get("/key/{key}", response_model=FormatResponseModel)
async def read_time_setting_by_key(
    key: str, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_times"))
):
    """ดึงข้อมูลการตั้งค่าระยะเวลาตาม key - ต้องมีสิทธิ์อ่านใน setting_times"""
    try:
        time_setting = get_time_setting_by_key(db, key)
        if not time_setting:
            return format_response("4040", {"error": f"Time setting with key '{key}' not found"})
        
        result = TimeSettingResponse.model_validate(time_setting).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching time setting: {str(e)}")
        return format_response("5000", {"error": "Error fetching time setting"})

@router.get("/{time_setting_id}", response_model=FormatResponseModel)
async def read_time_setting(
    time_setting_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_times"))
):
    """ดึงข้อมูลการตั้งค่าระยะเวลาตาม ID - ต้องมีสิทธิ์อ่านใน setting_times"""
    try:
        time_setting = get_time_setting_by_id(db, time_setting_id)
        if not time_setting:
            return format_response("4040", {"error": f"Time setting with ID {time_setting_id} not found"})
        
        result = TimeSettingResponse.model_validate(time_setting).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching time setting: {str(e)}")
        return format_response("5000", {"error": "Error fetching time setting"})

@router.put("/{time_setting_id}", response_model=FormatResponseModel)
async def update_existing_time_setting(
    time_setting_id: UUID, 
    time_setting_data: TimeSettingUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_times"))
):
    """อัปเดตข้อมูลการตั้งค่าระยะเวลา - ต้องมีสิทธิ์แก้ไขใน setting_times"""
    try:
        updated_time_setting = update_time_setting(db, time_setting_id, time_setting_data)
        if not updated_time_setting:
            return format_response("4040", {"error": f"Time setting with ID {time_setting_id} not found"})
        
        result = TimeSettingResponse.model_validate(updated_time_setting).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error updating time setting: {str(e)}")
        return format_response("5000", {"error": "Error updating time setting"})

@router.delete("/{time_setting_id}", response_model=FormatResponseModel)
async def delete_existing_time_setting(
    time_setting_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_times"))
):
    """ลบการตั้งค่าระยะเวลา - ต้องมีสิทธิ์ลบใน setting_times"""
    try:
        success = delete_time_setting(db, time_setting_id)
        if not success:
            return format_response("4040", {"error": f"Time setting with ID {time_setting_id} not found"})
        
        return format_response("0000", {"message": f"Time setting with ID {time_setting_id} deleted successfully"})
    except Exception as e:
        print(f"Error deleting time setting: {str(e)}")
        return format_response("5000", {"error": "Error deleting time setting"})