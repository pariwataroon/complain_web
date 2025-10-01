from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from uuid import UUID

from app.api.middleware.api_key_verify import verify_api_key_or_token
from app.api.middleware.permission_middleware import can_read
from app.api.v1.controllers.api_log_controller import (
    get_all_logs,
    get_log_by_id,
    get_log_stats,
    get_user_activity_logs,
    delete_old_logs,
    get_user_counter_from_chatbot_logs,
    force_refresh_user_counter
)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from lib.mask_sensitive import mask_sensitive
from lib.cache_service import cache
from lib.counter_service import counter_service

router = APIRouter(
    prefix="/api-logs",
    tags=["api-logs"],
)


@router.get("", response_model=FormatResponseModel)
async def read_api_logs(
    skip: int = 0, 
    limit: int = 100,
    user_id: Optional[str] = None,
    path: Optional[str] = None,
    method: Optional[str] = None,
    status_code: Optional[int] = None,
    client_ip: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("admin_logs"))
):
    """Get API logs with optional filters"""
    # Convert user_id string to UUID if provided
    user_id_uuid = UUID(user_id) if user_id else None
    
    logs = get_all_logs(
        db, 
        skip=skip, 
        limit=limit,
        user_id=user_id_uuid,
        path=path,
        method=method,
        status_code=status_code,
        client_ip=client_ip,
        from_date=from_date,
        to_date=to_date
    )
    
    # Format logs for response
    formatted_logs = []
    for log in logs:
        user_name = None
        if log.user and log.user.first_name and log.user.last_name:
            user_name = f"{log.user.first_name} {log.user.last_name}"
        
        formatted_log = {
            "id": log.id,
            "request_id": log.request_id,
            "method": log.method,
            "path": log.path,
            "query_params": log.query_params,
            "client_ip": log.client_ip,
            "status_code": log.status_code,
            "process_time_ms": log.process_time_ms,
            "user_id": log.user_id,
            "user_name": user_name,
            "created_at": log.created_at,
        }
        formatted_logs.append(formatted_log)
    
    return format_response("0000", formatted_logs)


@router.get("/details/{log_id}", response_model=FormatResponseModel)
async def read_api_log_details(
    log_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("admin_logs"))
):
    """Get detailed information for a specific API log"""
    log = get_log_by_id(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    user_name = None
    if log.user and log.user.first_name and log.user.last_name:
        user_name = f"{log.user.first_name} {log.user.last_name}"
    
    # Format log for response with all details
    log_data = {
        "id": log.id,
        "request_id": log.request_id,
        "method": log.method,
        "path": log.path,
        "query_params": log.query_params,
        "client_ip": log.client_ip,
        "status_code": log.status_code,
        "process_time_ms": log.process_time_ms,
        "request_body": mask_sensitive(log.request_body),
        "request_headers": mask_sensitive(log.request_headers),
        "user_id": log.user_id,
        "user_name": user_name,
        "created_at": log.created_at,
    }
    
    return format_response("0000", log_data)


@router.get("/stats", response_model=FormatResponseModel)
async def read_api_log_statistics(
    days: int = Query(7, ge=1, le=90),
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("admin_logs"))
):
    """Get statistics for API logs"""
    # Convert user_id string to UUID if provided
    user_id_uuid = UUID(user_id) if user_id else None
    
    stats = get_log_stats(db, days=days, user_id=user_id_uuid)
    return format_response("0000", stats)


@router.get("/user-activity/{user_id}", response_model=FormatResponseModel)
async def read_user_activity_logs(
    user_id: UUID,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("admin_logs"))
):
    """Get activity logs for a specific user"""
    logs, total_count = get_user_activity_logs(db, user_id, skip, limit)
    
    # Format logs for response
    formatted_logs = []
    for log in logs:
        formatted_log = {
            "id": log.id,
            "request_id": log.request_id,
            "method": log.method,
            "path": log.path,
            "client_ip": log.client_ip,
            "status_code": log.status_code,
            "process_time_ms": log.process_time_ms,
            "created_at": log.created_at,
        }
        formatted_logs.append(formatted_log)
    
    return format_response("0000", {
        "total_count": total_count,
        "logs": formatted_logs
    })


@router.delete("/cleanup", response_model=FormatResponseModel)
async def cleanup_old_logs(
    days: int = Query(90, ge=30),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("admin_logs"))
):
    """Delete logs older than specified days"""
    deleted_count = delete_old_logs(db, days)
    return format_response("0000", {"deleted_count": deleted_count})


@router.get("/counter", response_model=FormatResponseModel)
async def get_user_counter(
    request: Request,
    refresh: bool = Query(False, description="บังคับ refresh ข้อมูลใหม่ (ไม่ใช้ cache)"),
    db: Session = Depends(get_db),
    # current_user: str = Depends(can_read("admin_logs"))
):
    """
    นับจำนวนผู้เข้าใช้งานระบบจาก chat_bot path
    - ใช้ cache 1 นาทีเพื่อความเร็ว
    - สามารถ refresh ข้อมูลใหม่ได้ด้วย parameter refresh=true
    - ช่วงเวลาแบบมาตรฐาน:
        - today: ตั้งแต่ 00:00 วันนี้ ถึงเวลาปัจจุบัน
        - week: ย้อนหลัง 7 วันแบบ rolling
        - month: ย้อนหลัง 30 วันแบบ rolling
    """
    try:
        # ตรวจสอบ API Key หรือ Token
        is_authenticated = await verify_api_key_or_token(request, db)
        
        if not is_authenticated:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid API key/token"
            )
        
        if refresh:
            counter_data = force_refresh_user_counter(db)
        else:
            counter_data = get_user_counter_from_chatbot_logs(db)
        
        return format_response("0000", counter_data)
    
    except Exception as e:
        return format_response("5000", {
            "error": f"Failed to get user counter: {str(e)}",
            "total_unique_users": 0,
            "today_unique_users": 0,
            "week_unique_users": 0,
            "month_unique_users": 0,
            "total_requests": 0,
            "today_requests": 0,
            "total_week_requests": 0,
            "total_month_requests": 0,
            "last_updated": datetime.now().isoformat()
        })


@router.get("/counter/status", response_model=FormatResponseModel)
async def get_counter_status(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("admin_logs"))
):
    """
    ดูสถานะของ counter service และ cache
    """
    try:
        counter_status = counter_service.get_status()
        cache_stats = cache.get_stats()
        
        status_data = {
            "counter_service": counter_status,
            "cache": cache_stats,
            "endpoints": {
                "counter": "/api-logs/counter",
                "counter_with_refresh": "/api-logs/counter?refresh=true",
                "status": "/api-logs/counter/status"
            }
        }
        
        return format_response("0000", status_data)
    
    except Exception as e:
        return format_response("5000", {
            "error": f"Failed to get status: {str(e)}"
        })