from sqlalchemy.orm import Session
from sqlalchemy import desc, func, distinct
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from uuid import UUID

from models.api_log import ApiLog
from models.user import User
from lib.cache_service import cache


def get_all_logs(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    user_id: Optional[UUID] = None,
    path: Optional[str] = None,
    method: Optional[str] = None,
    status_code: Optional[int] = None,
    client_ip: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
) -> List[ApiLog]:
    """Get all API logs with filtering options"""
    
    query = db.query(ApiLog).order_by(desc(ApiLog.created_at))
    
    # Apply filters if provided
    if user_id:
        query = query.filter(ApiLog.user_id == user_id)
    
    if path:
        query = query.filter(ApiLog.path.like(f"%{path}%"))
    
    if method:
        query = query.filter(ApiLog.method == method)
    
    if status_code:
        query = query.filter(ApiLog.status_code == status_code)
    
    if client_ip:
        query = query.filter(ApiLog.client_ip == client_ip)
    
    if from_date:
        query = query.filter(ApiLog.created_at >= from_date)
    
    if to_date:
        query = query.filter(ApiLog.created_at <= to_date)
    
    # Apply pagination
    logs = query.offset(skip).limit(limit).all()
    
    return logs


def get_log_by_id(db: Session, log_id: UUID) -> Optional[ApiLog]:
    """Get a specific API log by ID"""
    return db.query(ApiLog).filter(ApiLog.id == log_id).first()


def get_log_stats(
    db: Session,
    days: int = 7,
    user_id: Optional[UUID] = None
) -> Dict:
    """Get API log statistics"""
    # Calculate the date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Base query
    query = db.query(ApiLog)
    
    # Filter by date range
    query = query.filter(ApiLog.created_at >= start_date, ApiLog.created_at <= end_date)
    
    # Filter by user_id if provided
    if user_id:
        query = query.filter(ApiLog.user_id == user_id)
    
    # Total requests
    total_requests = query.count()
    
    # Requests by status code
    success_requests = query.filter(ApiLog.status_code < 400).count()
    client_error_requests = query.filter(ApiLog.status_code >= 400, ApiLog.status_code < 500).count()
    server_error_requests = query.filter(ApiLog.status_code >= 500).count()
    
    # Requests by method
    get_requests = query.filter(ApiLog.method == "GET").count()
    post_requests = query.filter(ApiLog.method == "POST").count()
    put_requests = query.filter(ApiLog.method == "PUT").count()
    delete_requests = query.filter(ApiLog.method == "DELETE").count()
    
    # Average response time
    avg_response_time = db.query(func.avg(ApiLog.process_time_ms)).filter(
        ApiLog.created_at >= start_date,
        ApiLog.created_at <= end_date
    ).scalar() or 0
    
    # Most frequently accessed endpoints
    most_accessed_endpoints = db.query(
        ApiLog.path, 
        func.count(ApiLog.id).label("count")
    ).filter(
        ApiLog.created_at >= start_date,
        ApiLog.created_at <= end_date
    ).group_by(ApiLog.path).order_by(desc("count")).limit(10).all()
    
    # Most active users
    most_active_users = db.query(
        ApiLog.user_id,
        User.email,
        User.first_name,
        User.last_name,
        func.count(ApiLog.id).label("count")
    ).join(User, ApiLog.user_id == User.id, isouter=True).filter(
        ApiLog.created_at >= start_date,
        ApiLog.created_at <= end_date,
        ApiLog.user_id != None
    ).group_by(ApiLog.user_id, User.email, User.first_name, User.last_name).order_by(desc("count")).limit(10).all()
    
    # Return statistics
    return {
        "total_requests": total_requests,
        "time_period_days": days,
        "status_codes": {
            "success": success_requests,
            "client_error": client_error_requests,
            "server_error": server_error_requests
        },
        "methods": {
            "GET": get_requests,
            "POST": post_requests,
            "PUT": put_requests,
            "DELETE": delete_requests
        },
        "average_response_time_ms": round(avg_response_time, 2),
        "most_accessed_endpoints": [
            {"path": path, "count": count} for path, count in most_accessed_endpoints
        ],
        "most_active_users": [
            {
                "user_id": str(user_id) if user_id else None,
                "email": email,
                "name": f"{first_name} {last_name}" if first_name and last_name else email,
                "count": count
            } for user_id, email, first_name, last_name, count in most_active_users
        ]
    }


def get_user_activity_logs(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[ApiLog], int]:
    """Get activity logs for a specific user"""
    # Count total logs for this user
    total_count = db.query(ApiLog).filter(ApiLog.user_id == user_id).count()
    
    # Get paginated logs
    logs = db.query(ApiLog).filter(
        ApiLog.user_id == user_id
    ).order_by(desc(ApiLog.created_at)).offset(skip).limit(limit).all()
    
    return logs, total_count


def delete_old_logs(db: Session, days: int = 90) -> int:
    """Delete logs older than specified days"""
    cutoff_date = datetime.now() - timedelta(days=days)
    deleted = db.query(ApiLog).filter(ApiLog.created_at < cutoff_date).delete()
    db.commit()
    return deleted


def get_user_counter_from_chatbot_logs(db: Session, use_cache: bool = True) -> Dict:
    """
    นับจำนวนผู้เข้าใช้งานระบบจาก path /chat_bot
    ใช้ cache เพื่อความเร็ว cache 1 นาที

    มาตรฐานช่วงเวลา (standardized periods):
    - today: ตั้งแต่ 00:00 วันนี้ ถึงเวลาปัจจุบัน
    - week: ย้อนหลัง 7 วันแบบ rolling (รวมวันนี้)
    - month: ย้อนหลัง 30 วันแบบ rolling (รวมวันนี้)
    - total: ทั้งหมดตั้งแต่เริ่มบันทึก
    """
    cache_key = "user_counter_chatbot"
    
    # ตรวจสอบ cache ก่อน
    if use_cache:
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
    
    try:
        # นับผู้ใช้งานทั้งหมดที่เคยเข้า chat_bot
        total_users_query = db.query(distinct(ApiLog.user_id)).filter(
            ApiLog.path.like('%/chat_bot%'),
            ApiLog.user_id.isnot(None)
        )
        total_unique_users = total_users_query.count()
        
        # นับผู้ใช้งานวันนี้
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_users_query = db.query(distinct(ApiLog.user_id)).filter(
            ApiLog.path.like('%/chat_bot%'),
            ApiLog.user_id.isnot(None),
            ApiLog.created_at >= today_start
        )
        today_unique_users = today_users_query.count()
        
        # นับผู้ใช้งาน 7 วันที่ผ่านมา
        week_start = datetime.now() - timedelta(days=7)
        week_users_query = db.query(distinct(ApiLog.user_id)).filter(
            ApiLog.path.like('%/chat_bot%'),
            ApiLog.user_id.isnot(None),
            ApiLog.created_at >= week_start
        )
        week_unique_users = week_users_query.count()
        
        # นับผู้ใช้งาน 30 วันที่ผ่านมา
        month_start = datetime.now() - timedelta(days=30)
        month_users_query = db.query(distinct(ApiLog.user_id)).filter(
            ApiLog.path.like('%/chat_bot%'),
            ApiLog.user_id.isnot(None),
            ApiLog.created_at >= month_start
        )
        month_unique_users = month_users_query.count()
        
        # นับจำนวนครั้งที่เข้าใช้งาน (Total requests)
        total_requests = db.query(ApiLog).filter(
            ApiLog.path.like('%/chat_bot%')
        ).count()
        
        # นับจำนวนครั้งที่เข้าใช้งานวันนี้
        today_requests = db.query(ApiLog).filter(
            ApiLog.path.like('%/chat_bot%'),
            ApiLog.created_at >= today_start
        ).count()

        # นับจำนวนครั้งที่เข้าใช้งาน 7 วันที่ผ่านมา (rolling 7 days)
        week_requests = db.query(ApiLog).filter(
            ApiLog.path.like('%/chat_bot%'),
            ApiLog.created_at >= week_start
        ).count()

        # นับจำนวนครั้งที่เข้าใช้งาน 30 วันที่ผ่านมา (rolling 30 days)
        month_requests = db.query(ApiLog).filter(
            ApiLog.path.like('%/chat_bot%'),
            ApiLog.created_at >= month_start
        ).count()
        
        # สร้างผลลัพธ์
        result = {
            "total_unique_users": total_unique_users,
            "today_unique_users": today_unique_users,
            "week_unique_users": week_unique_users,
            "month_unique_users": month_unique_users,
            "total_requests": total_requests,
            "today_requests": today_requests,
            # เพิ่มค่านับตามช่วงเวลาแบบ rolling
            "total_week_requests": week_requests,
            "total_month_requests": month_requests,
            "last_updated": datetime.now().isoformat(),
            "cached": False
        }
        
        # เก็บใน cache เป็นเวลา 60 วินาที
        if use_cache:
            cache.set(cache_key, result, ttl_seconds=600)
        
        return result
        
    except Exception as e:
        print(f"Error getting user counter: {e}")
        # ถ้าเกิดข้อผิดพลาด ให้ลองดึงจาก cache
        cached_result = cache.get(cache_key)
        if cached_result:
            cached_result["error"] = f"Database error, showing cached data: {str(e)}"
            return cached_result
        
        # ถ้าไม่มีใน cache ให้ return ค่าเริ่มต้น
        return {
            "total_unique_users": 0,
            "today_unique_users": 0,
            "week_unique_users": 0,
            "month_unique_users": 0,
            "total_requests": 0,
            "today_requests": 0,
            "total_week_requests": 0,
            "total_month_requests": 0,
            "last_updated": datetime.now().isoformat(),
            "cached": False,
            "error": f"Database error: {str(e)}"
        }


def force_refresh_user_counter(db: Session) -> Dict:
    """
    บังคับ refresh counter โดยไม่ใช้ cache
    ใช้สำหรับกรณีต้องการข้อมูลล่าสุด
    """
    return get_user_counter_from_chatbot_logs(db, use_cache=False)