from functools import wraps
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.permission_controller import check_permission
from config.database import get_db
from lib.logger import get_logger

logger = get_logger("permission_middleware")

def permission_required(resource_path: str, action: str):
    """
    Middleware ตรวจสอบสิทธิ์การเข้าถึง resource
    
    Args:
        resource_path (str): เส้นทางของ resource เช่น "/api/v1/users"
        action (str): การกระทำที่ต้องการ ("create", "read", "update", "delete")
        
    Returns:
        function: Dependency function สำหรับ FastAPI
    """
    def dependency(db: Session = Depends(get_db), current_user_id: str = Depends(verify_token)):
        logger.info(f"Checking permission for user {current_user_id} to {action} on {resource_path}")
        
        try:
            has_permission = check_permission(db, UUID(current_user_id), resource_path, action)
            
            if not has_permission:
                logger.warning(f"Access denied: user {current_user_id} to {action} on {resource_path}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
                
            logger.info(f"Access granted: user {current_user_id} to {action} on {resource_path}")
            return current_user_id
            
        except Exception as e:
            logger.error(f"Error checking permission: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error while checking permissions"
            )
    
    return dependency