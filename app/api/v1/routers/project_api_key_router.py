from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.schemas.project_api_key import (
    ProjectApiKeyCreate, ProjectApiKeyResponse, ProjectApiKeyUpdate
)
from app.api.v1.controllers.project_api_key_controller import (
    create_project_api_key,
    get_all_project_api_keys,
    get_project_api_key_by_id,
    update_project_api_key,
    delete_project_api_key,
    regenerate_api_key
)
from app.api.middleware.jwt_verify import verify_token

router = APIRouter(
    prefix="/project-api-keys",
    tags=["project-api-keys"],
)

# สร้าง API Key ใหม่
@router.post("", response_model=FormatResponseModel)
async def create_new_project_api_key(
    project_data: ProjectApiKeyCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_access"))
):
    """
    สร้าง API Key ใหม่สำหรับโปรเจค - ต้องมีสิทธิ์สร้างใน setting_access
    
    API Key จะถูกสร้างโดยอัตโนมัติ และจะถูกส่งกลับมาในการตอบกลับเพียงครั้งเดียวเท่านั้น
    กรุณาจดบันทึก API Key ไว้ เนื่องจากจะไม่สามารถดู API Key แบบเต็มได้อีก
    """
    try:
        result = create_project_api_key(db, project_data)
        return format_response("0001", result)
    except ValueError as e:
        return format_response("4000", {"error": str(e)})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": f"Error creating project API key: {str(e)}"})

# ดึงรายการ API Key ทั้งหมด
@router.get("", response_model=FormatResponseModel)
async def list_project_api_keys(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """
    ดึงรายการ API Key ทั้งหมดในระบบ - ต้องมีสิทธิ์อ่านใน setting_access
    
    หมายเหตุ: API Key จะถูกปกปิดบางส่วนเพื่อความปลอดภัย
    """
    try:
        result = get_all_project_api_keys(db, skip=skip, limit=limit)
        return format_response("0000", result)
    except Exception as e:
        return format_response("5000", {"error": f"Error fetching project API keys: {str(e)}"})

# ดึงข้อมูล API Key ตาม ID
@router.get("/{api_key_id}", response_model=FormatResponseModel)
async def get_project_api_key(
    api_key_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """
    ดึงข้อมูล API Key ตาม ID - ต้องมีสิทธิ์อ่านใน setting_access
    """
    try:
        result = get_project_api_key_by_id(db, api_key_id)
        if not result:
            return format_response("4040", {"error": f"Project API key with ID {api_key_id} not found"})
        return format_response("0000", result)
    except Exception as e:
        return format_response("5000", {"error": f"Error fetching project API key: {str(e)}"})

# อัปเดตข้อมูล API Key
@router.put("/{api_key_id}", response_model=FormatResponseModel)
async def update_project_api_key_endpoint(
    api_key_id: UUID,
    api_key_data: ProjectApiKeyUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_access"))
):
    """
    อัปเดตข้อมูล API Key - ต้องมีสิทธิ์แก้ไขใน setting_access
    
    สามารถอัปเดตชื่อโปรเจค คำอธิบาย และสถานะการใช้งาน
    """
    try:
        result = update_project_api_key(db, api_key_id, api_key_data)
        if not result:
            return format_response("4040", {"error": f"Project API key with ID {api_key_id} not found"})
        return format_response("0000", result)
    except Exception as e:
        return format_response("5000", {"error": f"Error updating project API key: {str(e)}"})

# ลบ API Key
@router.delete("/{api_key_id}", response_model=FormatResponseModel)
async def delete_project_api_key_endpoint(
    api_key_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_access"))
):
    """
    ลบ API Key - ต้องมีสิทธิ์ลบใน setting_access
    
    คำเตือน: การลบ API Key จะทำให้โปรเจคที่ใช้ key นี้ไม่สามารถเข้าถึง API ได้ทันที
    """
    try:
        success = delete_project_api_key(db, api_key_id)
        if not success:
            return format_response("4040", {"error": f"Project API key with ID {api_key_id} not found"})
        return format_response("0000", {"message": f"Project API key with ID {api_key_id} deleted successfully"})
    except Exception as e:
        return format_response("5000", {"error": f"Error deleting project API key: {str(e)}"})

# สร้าง API Key ใหม่สำหรับโปรเจคที่มีอยู่แล้ว
@router.post("/{api_key_id}/regenerate", response_model=FormatResponseModel)
async def regenerate_project_api_key_endpoint(
    api_key_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_access"))
):
    """
    สร้าง API Key ใหม่สำหรับโปรเจคที่มีอยู่แล้ว - ต้องมีสิทธิ์แก้ไขใน setting_access
    
    คำเตือน: API Key เดิมจะถูกยกเลิกทันที และไม่สามารถใช้งานได้อีก
    API Key ใหม่จะถูกส่งกลับมาในการตอบกลับเพียงครั้งเดียวเท่านั้น
    """
    try:
        result = regenerate_api_key(db, api_key_id)
        if not result:
            return format_response("4040", {"error": f"Project API key with ID {api_key_id} not found"})
        return format_response("0000", result)
    except Exception as e:
        return format_response("5000", {"error": f"Error regenerating API key: {str(e)}"})