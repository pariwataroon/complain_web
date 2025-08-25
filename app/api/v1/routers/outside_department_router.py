from uuid import UUID
from typing import List, Dict, Any
import bleach
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from app.api.v1.controllers.outside_department_controller import (
    DuplicateKeyError,
    get_outside_departments,
    get_outside_department_by_id,
    search_outside_departments_by_name,
    create_outside_department,
    update_outside_department,
    delete_outside_department,
    get_outside_departments_dropdown,
)
from app.api.v1.schemas.outside_departments import (
    OutsideDepartmentCreate,
    OutsideDepartmentUpdate,
)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/outside-departments",
    tags=["outside_departments"],
)

@router.get("", response_model=FormatResponseModel)
async def read_outside_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงรายการ outside_department ทั้งหมด"""
    data = get_outside_departments(db, skip=skip, limit=limit)
    return format_response("0000", data)

@router.get("/dropdown", response_model=FormatResponseModel)
async def read_outside_departments_dropdown(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงรายการเฉพาะ id/name สำหรับ dropdown"""
    data = get_outside_departments_dropdown(db)
    return format_response("0000", data)

@router.get("/{outside_department_id}", response_model=FormatResponseModel)
async def read_outside_department(
    outside_department_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงข้อมูลตาม ID"""
    row = get_outside_department_by_id(db, outside_department_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"OutsideDepartment with ID {outside_department_id} not found")
    return format_response("0000", row)

@router.get("/search/by-name", response_model=FormatResponseModel)
async def search_outside_departments_by_name_endpoint(
    search_term: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ค้นหาตามชื่อ"""
    rows = search_outside_departments_by_name(db, search_term=search_term, skip=skip, limit=limit)
    return format_response("0000", rows)

@router.post("", response_model=FormatResponseModel)
async def create_outside_department_endpoint(
    payload: OutsideDepartmentCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_department"))
):
    """สร้างรายการใหม่"""
    try:
        data = payload.model_dump()
        data["name"] = bleach.clean(data.get("name", ""), tags=[], attributes={})
        created = create_outside_department(db, data)
        return format_response("0001", created)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})

@router.put("/{outside_department_id}", response_model=FormatResponseModel)
async def update_outside_department_endpoint(
    outside_department_id: UUID,
    payload: OutsideDepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_department"))
):
    """อัปเดตข้อมูล"""
    try:
        data = {k: v for k, v in payload.model_dump().items() if v is not None}
        if "name" in data:
            data["name"] = bleach.clean(data["name"], tags=[], attributes={})
        updated = update_outside_department(db, outside_department_id, data)
        if updated is None:
            raise HTTPException(status_code=404, detail=f"OutsideDepartment with ID {outside_department_id} not found")
        return format_response("0002", updated)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})

@router.delete("/{outside_department_id}", response_model=FormatResponseModel)
async def delete_outside_department_endpoint(
    outside_department_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_department"))
):
    """ลบ (soft delete)"""
    ok = delete_outside_department(db, outside_department_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"OutsideDepartment with ID {outside_department_id} not found")
    return format_response("0003", {"id": str(outside_department_id)})
