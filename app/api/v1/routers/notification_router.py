from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from uuid import UUID
from models.notification import Notification 

from config.database import get_db
from app.api.v1.schemas.notification import NotificationCreate, NotificationResponse
from app.api.v1.controllers.notification_controller import (
    create_notification,
    get_notifications_by_role,
    get_user_notifications,
    mark_notification_as_seen,
)
from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)

@router.get("", response_model=FormatResponseModel)
async def get_notifications(
    exclusive: bool = False,
    include_seen: bool = True,
    include_personal: bool = True,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("initial_notification"))
):
    try:
        user_id = UUID(current_user)
        if include_personal:
            notifications = get_user_notifications(
                db, user_id, 
                include_role_notifications=not exclusive,
                skip=skip, 
                limit=limit
            )
        else:
            from app.api.v1.controllers.permission_controller import get_user_roles
            user_role_objects = get_user_roles(db, user_id)
            
            if not user_role_objects:
                return format_response("4030", {"error": "No roles found for current user"})
            
            user_role = user_role_objects[0]
            role = user_role.name
            
            notifications = get_notifications_by_role(db, role, exclusive, user_id, skip, limit)

        if not include_seen:
            filtered_notifications = []
            for notification in notifications:
                if not notification.get("is_read", False):
                    filtered_notifications.append(notification)
            notifications = filtered_notifications
        
        return format_response("0000", notifications)
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.put("/{notification_id}/seen", response_model=FormatResponseModel)
async def mark_as_seen(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ทำเครื่องหมายว่าแจ้งเตือนนี้ถูกเห็นแล้วโดยผู้ใช้ที่กำลัง login"""
    try:
        user_id = UUID(current_user)
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        
        if not notification:
            return format_response("4040", {"error": "Notification not found"})
        
        can_access = False
        user_pattern = f"user_{user_id}"
        notification_roles = notification.role_seeking_group.split(",")
        
        if user_pattern in notification_roles:
            can_access = True
        else:
            from app.api.v1.controllers.permission_controller import get_user_roles
            user_role_objects = get_user_roles(db, user_id)
            
            if user_role_objects:
                user_role_names = [role.name for role in user_role_objects]
                role_matches = any(role in notification_roles for role in user_role_names)
                if role_matches:
                    can_access = True
        
        if not can_access:
            return format_response("4030", {
                "error": "You don't have permission to access this notification"
            })

        notification_data = mark_notification_as_seen(db, notification_id, user_id)
        return format_response("0002", notification_data)
    except ValueError as e:
        return format_response("4000", {"error": "Invalid user ID format"})
    except Exception as e:
        return format_response("5000", {"error": str(e)})