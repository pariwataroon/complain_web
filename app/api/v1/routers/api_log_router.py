from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from uuid import UUID

from app.api.middleware.permission_middleware import can_read
from app.api.v1.controllers.api_log_controller import (
    get_all_logs,
    get_log_by_id,
    get_log_stats,
    get_user_activity_logs,
    delete_old_logs
)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

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
    current_user: str = Depends(can_read("setting_access"))
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
            "created_at": log.created_at,
        }
        formatted_logs.append(formatted_log)
    
    return format_response("0000", formatted_logs)


@router.get("/details/{log_id}", response_model=FormatResponseModel)
async def read_api_log_details(
    log_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """Get detailed information for a specific API log"""
    log = get_log_by_id(db, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
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
        "request_body": log.request_body,
        "request_headers": log.request_headers,
        "user_id": log.user_id,
        "created_at": log.created_at,
    }
    
    return format_response("0000", log_data)


@router.get("/stats", response_model=FormatResponseModel)
async def read_api_log_statistics(
    days: int = Query(7, ge=1, le=90),
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
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
    current_user: str = Depends(can_read("setting_access"))
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
    current_user: str = Depends(can_read("setting_access"))
):
    """Delete logs older than specified days"""
    deleted_count = delete_old_logs(db, days)
    return format_response("0000", {"deleted_count": deleted_count})