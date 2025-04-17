from functools import wraps
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Union

from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.permission_controller import check_permission, check_permission_by_name
from config.database import get_db
from lib.logger import get_logger

logger = get_logger("permission_middleware")

def permission_required(resource: Union[str, dict], action: str):
    """
    Middleware ตรวจสอบสิทธิ์การเข้าถึง resource
    
    Args:
        resource: สามารถใช้ได้ 2 รูปแบบ:
            - str: เส้นทางของ resource เช่น "/api/v1/users" หรือชื่อ resource เช่น "user_profile"
            - dict: dictionary ที่มีข้อมูล name หรือ path เช่น {"name": "user_profile"} หรือ {"path": "/api/v1/users"}
        action (str): การกระทำที่ต้องการ ("create", "read", "update", "delete")
        
    Returns:
        function: Dependency function สำหรับ FastAPI
    """
    def dependency(db: Session = Depends(get_db), current_user_id: str = Depends(verify_token)):
        # ตรวจสอบรูปแบบของ resource
        resource_name = None
        resource_path = None
        
        if isinstance(resource, dict):
            resource_name = resource.get("name")
            resource_path = resource.get("path")
        elif isinstance(resource, str):
            # ถ้าเริ่มต้นด้วย / ถือว่าเป็น path ไม่ใช่ name
            if resource.startswith('/'):
                resource_path = resource
            else:
                resource_name = resource
        
        # Log การตรวจสอบสิทธิ์
        log_info = f"Checking permission for user {current_user_id} to {action} on "
        log_info += f"resource_name: {resource_name}" if resource_name else f"resource_path: {resource_path}"
        logger.info(log_info)
        
        try:
            has_permission = False
            
            # ตรวจสอบสิทธิ์ตามรูปแบบที่กำหนด
            if resource_name:
                has_permission = check_permission_by_name(db, UUID(current_user_id), resource_name, action)
            elif resource_path:
                has_permission = check_permission(db, UUID(current_user_id), resource_path, action)
            else:
                logger.error("Neither resource name nor path provided for permission check")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Resource identifier not provided"
                )
            
            if not has_permission:
                logger.warning(f"Access denied: user {current_user_id} to {action} on {resource_name or resource_path}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
                
            logger.info(f"Access granted: user {current_user_id} to {action} on {resource_name or resource_path}")
            return current_user_id
            
        except HTTPException:
            # Re-raise HTTP exceptions (like 403) as is
            raise
        except Exception as e:
            logger.error(f"Error checking permission: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error while checking permissions"
            )
    
    return dependency

# ฟังก์ชัน helper สำหรับการใช้งานที่สะดวกขึ้น
def can_create(resource_name: str):
    return permission_required(resource_name, "create")

def can_read(resource_name: str):
    return permission_required(resource_name, "read")

def can_update(resource_name: str):
    return permission_required(resource_name, "update")

def can_delete(resource_name: str):
    return permission_required(resource_name, "delete")