from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from uuid import UUID

from models.api_log import ApiLog
from models.user import User


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