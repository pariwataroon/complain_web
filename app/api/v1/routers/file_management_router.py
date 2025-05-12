from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Optional, List

from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import can_admin
from lib.format_data import FormatResponseModel, format_response
from lib.file_upload import (
    get_storage_usage,
    cleanup_expired_files,
    list_files_by_date_range,
    move_storage_location,
    update_retention_policy
)

router = APIRouter(
    prefix="/file-management",
    tags=["file-management"],
)

@router.get("/usage", response_model=FormatResponseModel)
async def get_usage_stats(
    current_user: str = Depends(can_admin("system"))
):
    """Get storage usage statistics"""
    stats = get_storage_usage()
    return format_response("0000", stats)

@router.post("/cleanup", response_model=FormatResponseModel)
async def cleanup_files(
    folder: Optional[str] = Body(None),
    current_user: str = Depends(can_admin("system"))
):
    """Manually run file cleanup process"""
    stats = cleanup_expired_files(folder)
    return format_response("0000", stats)

@router.get("/list-by-date", response_model=FormatResponseModel)
async def list_files_by_date(
    start_date: datetime = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: Optional[datetime] = Query(None, description="End date (YYYY-MM-DD), defaults to start_date"),
    folder: Optional[str] = Query(None, description="Optional folder to search in"),
    current_user: str = Depends(can_admin("system"))
):
    """List files within a specific date range"""
    if end_date is None:
        end_date = start_date
    
    files = list_files_by_date_range(start_date, end_date, folder)
    return format_response("0000", {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "folder": folder,
        "file_count": len(files),
        "files": files
    })

@router.post("/move-storage", response_model=FormatResponseModel)
async def move_storage(
    new_location: str = Body(..., embed=True),
    current_user: str = Depends(can_admin("system"))
):
    """Move all uploaded files to a new storage location"""
    stats = move_storage_location(new_location)
    
    if stats.get("status") == "error":
        return format_response("5000", stats)
    
    return format_response("0000", stats)

@router.post("/update-retention", response_model=FormatResponseModel)
async def update_retention(
    days: int = Body(..., ge=0, embed=True),
    current_user: str = Depends(can_admin("system"))
):
    """Update the global file retention policy"""
    config = update_retention_policy(days)
    return format_response("0000", config)