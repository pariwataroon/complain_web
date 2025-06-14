import time
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, text
from uuid import UUID
from models.notification import Notification
from models.user import User
from models.association_tables import notification_seen_table  
from app.api.v1.schemas.notification import NotificationCreate, NotificationResponse
from datetime import datetime
from lib.logger import get_logger

_recent_admin_notifications = {}
_NOTIFICATION_THROTTLE_SECONDS = 300  # 5 นาที

logger = get_logger("notification_controller", console_output=False)

class NotificationError(Exception):
    """Base exception for notification operations"""
    pass

def create_notification(db: Session, notification_data: NotificationCreate):
    """Create a new notification in the database"""
    try:
        # Convert Pydantic model to dict using model_dump() (new method)
        data = notification_data.model_dump()
        
        # role_seeking_group สามารถเป็น comma-separated string ได้: "admin,staff,supervisor"
        notification = Notification(**data)
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # Convert to response format
        return format_notification_data(notification)
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise NotificationError("Could not create notification")
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating notification: {str(e)}")
        raise

def get_user_notifications(db: Session, user_id: UUID, include_role_notifications: bool = True, skip: int = 0, limit: int = 10):
    """ดึงการแจ้งเตือนสำหรับผู้ใช้คนหนึ่ง รวมทั้ง notification ส่วนบุคคลและตาม role"""
    try:
        from app.api.v1.controllers.permission_controller import get_user_roles
        
        conditions = []
        
        # ✅ 1. User-specific notifications
        user_pattern = f"user_{user_id}"
        user_match_sql = f"""
            (
                role_seeking_group = '{user_pattern}' OR
                role_seeking_group LIKE '{user_pattern},%' OR
                role_seeking_group LIKE '%,{user_pattern},%' OR
                role_seeking_group LIKE '%,{user_pattern}'
            )
        """
        conditions.append(text(user_match_sql))
        
        # ✅ 2. Role-based notifications (ถ้าต้องการ)
        if include_role_notifications:
            user_roles = get_user_roles(db, user_id)
            for user_role in user_roles:
                role = user_role.name
                role_match_sql = f"""
                    (
                        role_seeking_group = '{role}' OR 
                        role_seeking_group LIKE '{role},%' OR
                        role_seeking_group LIKE '%,{role},%' OR
                        role_seeking_group LIKE '%,{role}'
                    )
                """
                conditions.append(text(role_match_sql))
        
        # สร้าง query
        query = db.query(Notification)
        
        if conditions:
            query = query.filter(or_(*conditions))
        else:
            # ถ้าไม่มีเงื่อนไขใด ๆ ให้ return empty
            return []
        
        # ทำการ join, order และจำกัดจำนวน 
        notifications = query.options(
            joinedload(Notification.seen_by_users)
        ).order_by(
            Notification.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        # แปลงข้อมูลก่อนส่งคืน
        return [format_notification_data(notification, user_id) for notification in notifications]
        
    except Exception as e:
        logger.error(f"Error fetching user notifications: {str(e)}")
        raise

def get_notifications_by_role(db: Session, role: str, exclusive: bool = False, current_user_id: UUID = None, skip: int = 0, limit: int = 10):
    """ดึงการแจ้งเตือนตามบทบาท (role) และการแจ้งเตือนส่วนบุคคล"""
    try:
        # สร้าง base query
        query = db.query(Notification)
        
        # ✅ เพิ่มการค้นหา notification ส่วนบุคคล
        user_specific_pattern = f"user_{current_user_id}" if current_user_id else None
        
        if exclusive:
            # เฉพาะการแจ้งเตือนที่มีบทบาทนี้เท่านั้น (ไม่รวมส่วนบุคคล)
            query = query.filter(Notification.role_seeking_group == role)
        else:
            # ค้นหาทั้ง role และ notification ส่วนบุคคล
            conditions = []
            
            # Role-based notifications
            role_match_sql = f"""
                (
                    role_seeking_group = '{role}' OR 
                    role_seeking_group LIKE '{role},%' OR
                    role_seeking_group LIKE '%,{role},%' OR
                    role_seeking_group LIKE '%,{role}'
                )
            """
            conditions.append(text(role_match_sql))
            
            # ✅ User-specific notifications
            if user_specific_pattern:
                user_match_sql = f"""
                    (
                        role_seeking_group = '{user_specific_pattern}' OR
                        role_seeking_group LIKE '{user_specific_pattern},%' OR
                        role_seeking_group LIKE '%,{user_specific_pattern},%' OR
                        role_seeking_group LIKE '%,{user_specific_pattern}'
                    )
                """
                conditions.append(text(user_match_sql))
            
            # รวมเงื่อนไขด้วย OR
            from sqlalchemy import or_, text
            if len(conditions) > 1:
                query = query.filter(or_(*conditions))
            elif len(conditions) == 1:
                query = query.filter(conditions[0])
        
        # ทำการ join, order และจำกัดจำนวน 
        notifications = query.options(
            joinedload(Notification.seen_by_users)
        ).order_by(
            Notification.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        # แปลงข้อมูลก่อนส่งคืน
        return [format_notification_data(notification, current_user_id) for notification in notifications]
    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        raise

def mark_notification_as_seen(db: Session, notification_id: UUID, user_id: UUID):
    """Mark a notification as seen by a specific user"""
    try:
        # Check if the notification exists
        notification = db.query(Notification).filter(
            Notification.id == notification_id
        ).options(
            joinedload(Notification.seen_by_users)
        ).first()
        
        if not notification:
            logger.warning(f"Notification {notification_id} not found")
            return None

        # Check if already seen
        existing = db.query(notification_seen_table).filter(
            notification_seen_table.c.notification_id == notification_id,
            notification_seen_table.c.user_id == user_id
        ).first()
        
        # If user hasn't seen it yet, add the record
        if not existing:
            logger.info(f"User {user_id} marking notification {notification_id} as seen")
            db.execute(
                notification_seen_table.insert().values(
                    notification_id=notification_id, 
                    user_id=user_id,
                    seen_at=datetime.utcnow()
                )
            )
            db.commit()
            # Refresh notification to get updated seen_by_users
            db.refresh(notification)
        else:
            logger.info(f"Notification {notification_id} already marked as seen by user {user_id}")
        
        # Format data before returning
        return format_notification_data(notification)
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise NotificationError("Could not mark notification as seen")
    except Exception as e:
        db.rollback()
        logger.error(f"Error marking notification as seen: {str(e)}")
        raise

def format_notification_data(notification, current_user_id=None):
    """
    Format notification data for API response
    
    Args:
        notification: Notification object
        current_user_id: UUID ของผู้ใช้ปัจจุบัน (ถ้ามี) เพื่อตรวจสอบว่าอ่านแล้วหรือยัง
    """
    # คำนวณข้อมูลพื้นฐาน
    notification_data = {
        "id": notification.id,
        "title": notification.title,
        "message": notification.message,
        "role_seeking_group": notification.role_seeking_group,
        "redirect_url": notification.redirect_url,
        "created_at": notification.created_at,
        "seen_count": len(notification.seen_by_users) if notification.seen_by_users else 0,
        # แปลงเป็น array สำหรับความสะดวกในการใช้งานของ frontend
        "target_roles": notification.role_seeking_group.split(",") if notification.role_seeking_group else []
    }
    
    # เพิ่มฟิลด์ is_read เพื่อบอกว่าผู้ใช้ปัจจุบันอ่านแล้วหรือยัง
    if current_user_id and notification.seen_by_users:
        notification_data["is_read"] = any(
            str(user.id) == str(current_user_id) 
            for user in notification.seen_by_users
        )
    else:
        notification_data["is_read"] = False
    
    # ไม่ส่งข้อมูล seen_by_users กลับไป
    
    return notification_data

def should_notify_admin(user_id):
    """ตรวจสอบว่าควรแจ้งเตือน admin เกี่ยวกับผู้ใช้นี้หรือไม่"""
    current_time = time.time()
    
    if str(user_id) in _recent_admin_notifications:
        last_sent = _recent_admin_notifications[str(user_id)]
        if current_time - last_sent < _NOTIFICATION_THROTTLE_SECONDS:
            logger.info(f"Admin notification throttled: {user_id} (sent {current_time - last_sent:.1f}s ago)")
            return False
    
    # อัพเดตเวลาส่งล่าสุด
    _recent_admin_notifications[str(user_id)] = current_time
    return True

def notify_admin_new_user(db: Session, user):
    """
    สร้างการแจ้งเตือนสำหรับ admin เมื่อมีผู้ใช้ใหม่ลงทะเบียนสำเร็จ
    
    Args:
        db: Database session
        user: User object ของผู้ใช้ที่ลงทะเบียน
    """
    if not should_notify_admin(user.id):
        logger.info(f"Skipping duplicate admin notification for user {user.id}")
        return False
    
    try:
        # สร้างข้อมูลการแจ้งเตือน
        notification_data = NotificationCreate(
            title="มีผู้ใช้ลงทะเบียนใหม่",
            message=f"ผู้ใช้ {user.first_name} {user.last_name} ได้ลงทะเบียนและยืนยันอีเมลเรียบร้อยแล้ว",
            role_seeking_group="admin",
            redirect_url=f"/users/{user.id}"
        )
        
        # สร้างการแจ้งเตือนในระบบ
        create_notification(db, notification_data)
        logger.info(f"Admin notification created for new user: {user.id}")
        return True
    except Exception as e:
        logger.error(f"Error creating admin notification: {str(e)}")
        return False