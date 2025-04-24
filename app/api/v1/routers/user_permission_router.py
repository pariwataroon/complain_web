from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Optional

from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.controllers.user_permission_controller import (
    get_user_permissions_by_user,
    delete_user_permission,
    get_resource_user_permissions
)
from app.api.v1.controllers.permission_controller import (create_permission)
from app.api.v1.schemas.permission import PermissionCreate

router = APIRouter(
    tags=["user-permissions"],
)

@router.post("/create", response_model=FormatResponseModel)
async def create_user_permission_endpoint(  # เปลี่ยนชื่อฟังก์ชันเพื่อหลีกเลี่ยงการซ้ำซ้อน
    data: PermissionCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_access"))
):
    """สร้างสิทธิ์เฉพาะสำหรับผู้ใช้ - ต้องมีสิทธิ์สร้างใน setting_access"""
    try:
        # ตรวจสอบว่าข้อมูลถูกต้องหรือไม่
        if not data.user_id:
            return format_response("4000", {"error": "user_id is required for user-permission"})
        
        # สร้างสิทธิ์เฉพาะสำหรับผู้ใช้
        db_permission = create_permission(db, data)
        
        # แปลงข้อมูลเพื่อส่งกลับ
        from app.api.v1.schemas.permission import PermissionResponse
        result = PermissionResponse.model_validate(db_permission).model_dump()
        
        return format_response("0001", result)
    except ValueError as e:
        return format_response("4000", {"error": str(e)})
    except Exception as e:
        error_message = "Error creating user permission"
        if "FK__permissio__user" in str(e):
            error_message = f"The user ID does not exist in the database: {data.user_id}"
        elif "FK__permissio__resource" in str(e):
            error_message = f"The resource ID does not exist in the database: {data.resource_id}"
        
        return format_response("5000", {"error": error_message})


@router.get("/user/{user_id}", response_model=FormatResponseModel)
async def get_user_permissions_endpoint(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """
    ดึงข้อมูลสิทธิ์เฉพาะทั้งหมดของผู้ใช้รายบุคคล
    """
    try:
        result = get_user_permissions_by_user(db, user_id)
        if not result:
            return format_response("4040", {"error": "User not found or no permissions available"})
            
        return format_response("0000", result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": f"Error getting user permissions: {str(e)}"})


@router.delete("/{permission_id}", response_model=FormatResponseModel)
async def delete_user_permission_endpoint(
    permission_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_access"))
):
    """
    ลบสิทธิ์เฉพาะของผู้ใช้รายบุคคล
    """
    try:
        result = delete_user_permission(db, permission_id)
        if not result:
            return format_response("4040", {"error": "Permission not found or not a user permission"})
            
        return format_response("0000", result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": f"Error deleting user permission: {str(e)}"})


@router.get("/resource/{resource_id}", response_model=FormatResponseModel)
async def get_resource_user_permissions_endpoint(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """
    ดึงข้อมูลสิทธิ์เฉพาะของผู้ใช้ทั้งหมดสำหรับทรัพยากรที่ระบุ
    """
    try:
        result = get_resource_user_permissions(db, resource_id)
        if not result:
            return format_response("4040", {"error": "Resource not found"})
            
        return format_response("0000", result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": f"Error getting resource user permissions: {str(e)}"})