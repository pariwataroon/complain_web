from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from models.notification import Notification 

from config.database import get_db
from app.api.v1.schemas.notification import NotificationCreate, NotificationResponse
from app.api.v1.controllers.notification_controller import (
    create_notification,
    get_notifications_by_role,
    mark_notification_as_seen,
)
from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
)

# @router.post("", response_model=FormatResponseModel)
# async def create_new_notification(
#     notification: NotificationCreate,
#     db: Session = Depends(get_db),
#     current_user: str = Depends(can_create("initial_notification"))
# ):
#     """สร้างการแจ้งเตือนใหม่"""
#     try:
#         result = create_notification(db, notification)
#         return format_response("0001", result)
#     except Exception as e:
#         return format_response("5000", {"error": str(e)})

@router.get("/", response_model=FormatResponseModel)
async def get_notifications(
    exclusive: bool = False,
    include_seen: bool = True,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("initial_notification"))
):
    try:
        # แปลง current_user จาก string เป็น UUID
        user_id = UUID(current_user)
        
        # ดึงบทบาทของผู้ใช้
        from app.api.v1.controllers.permission_controller import get_user_roles
        user_role_objects = get_user_roles(db, user_id)
        
        if not user_role_objects:
            return format_response("4030", {"error": "No roles found for current user"})
        
        # ใช้บทบาทแรกของผู้ใช้เสมอ (จาก token)
        user_role = user_role_objects[0]
        role = user_role.name
        
        # ดึงข้อมูลการแจ้งเตือนตามบทบาทที่ผู้ใช้มีสิทธิ์
        notifications = get_notifications_by_role(db, role, exclusive, user_id, skip, limit)
        
        # ถ้าไม่ต้องการรวมการแจ้งเตือนที่เคยเห็นแล้ว ให้กรองออก
        if not include_seen:
            filtered_notifications = []
            for notification in notifications:
                # ตรวจสอบว่า user_id ปัจจุบันอยู่ใน seen_by_users หรือไม่
                user_has_seen = any(
                    str(user["user_id"]) == str(user_id) 
                    for user in notification["seen_by_users"]
                )
                if not user_has_seen:
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
        # แปลง current_user จาก string เป็น UUID
        user_id = UUID(current_user)
        
        # ดึงข้อมูลการแจ้งเตือน
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        
        if not notification:
            return format_response("4040", {"error": "Notification not found"})
        
        # ดึงบทบาทของผู้ใช้
        from app.api.v1.controllers.permission_controller import get_user_roles
        user_role_objects = get_user_roles(db, user_id)
        
        if not user_role_objects:
            return format_response("4030", {"error": "No roles found for current user"})
        
        # ตรวจสอบว่าผู้ใช้มีบทบาทที่สามารถเข้าถึงการแจ้งเตือนนี้ได้หรือไม่
        user_role_names = [role.name for role in user_role_objects]
        notification_roles = notification.role_seeking_group.split(",")
        
        # ตรวจสอบว่ามีบทบาทของผู้ใช้อยู่ใน role_seeking_group หรือไม่
        role_matches = any(role in notification_roles for role in user_role_names)
        
        if not role_matches:
            return format_response("4030", {
                "error": f"You don't have permission to access this notification",
                "user_roles": user_role_names,
                "notification_for": notification_roles
            })
        
        # ถ้ามีสิทธิ์ ให้ทำเครื่องหมายว่าอ่านแล้ว
        notification_data = mark_notification_as_seen(db, notification_id, user_id)
        return format_response("0002", notification_data)
    except ValueError as e:
        return format_response("4000", {"error": "Invalid user ID format"})
    except Exception as e:
        return format_response("5000", {"error": str(e)})