from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Optional

from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.controllers.user_permission_controller import (
    create_user_permission,
    get_user_permissions_by_user,
    delete_user_permission,
    get_resource_user_permissions
)

router = APIRouter(
    # prefix="/user-permissions",
    tags=["user-permissions"],
)

@router.post("/", response_model=FormatResponseModel)
async def create_user_permission_endpoint(
    permission_data: Dict,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_access"))
):
    """
    เพิ่มหรืออัปเดตสิทธิ์เฉพาะให้กับผู้ใช้รายบุคคล
    
    ตัวอย่าง body:
    {
        "user_id": "69bcfed5-5af5-4340-a653-672a43b82567",
        "resource_id": "00dd62d0-4964-440c-b9c7-30ce6526bc46",
        "can_create": true,
        "can_read": true,
        "can_update": false, 
        "can_delete": false,
        "override_role": true
    }
    """
    try:
        user_id = permission_data.get("user_id")
        resource_id = permission_data.get("resource_id")
        
        if not user_id or not resource_id:
            return format_response("4000", {"error": "Both user_id and resource_id are required"})
        
        result = create_user_permission(db, user_id, resource_id, permission_data)
        if not result:
            return format_response("4040", {"error": "Failed to create/update user permission"})
            
        return format_response("0000", result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": f"Error creating/updating user permission: {str(e)}"})


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