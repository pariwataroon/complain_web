from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, Callable, List

from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.permission_controller import check_permission
from config.database import get_db
from lib.format_data import format_response

def permission_required(action: str):
    """
    Dependency ที่ใช้ตรวจสอบสิทธิ์ของผู้ใช้ก่อนเข้าถึง endpoint
    
    Args:
        action: การกระทำที่ต้องการตรวจสอบ ("create", "read", "update", "delete")
    """
    def check_user_permission(request: Request, token: str = Depends(verify_token), db: Session = Depends(get_db)):
        try:
            # ดึง user_id จาก token
            user_id = token
            
            # ดึง resource_path จาก request
            resource_path = request.url.path
            
            # ตรวจสอบสิทธิ์
            has_permission = check_permission(db, user_id, resource_path, action)
            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            
            return user_id
        except Exception as e:
            # Log the exception (you should have proper logging)
            print(f"Permission check error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error checking permissions"
            )
    
    return check_user_permission