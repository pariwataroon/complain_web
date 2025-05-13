from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.department_group_controller import (
    DuplicateKeyError, create_department_group, delete_department_group,
    get_department_groups, get_department_group_by_id, update_department_group,
    get_department_groups_with_departments
)
from app.api.v1.schemas.department_groups import DepartmentGroup, DepartmentGroupCreate, DepartmentGroupUpdate
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/department-groups",
    tags=["department_groups"],
)

@router.get("/", response_model=FormatResponseModel)
async def read_department_groups(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงรายการกลุ่มหน่วยงานทั้งหมด"""
    groups_data = get_department_groups(db, skip=skip, limit=limit)
    return format_response("0000", groups_data)

@router.get("/with-departments", response_model=FormatResponseModel)
async def read_department_groups_with_departments(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงรายการกลุ่มหน่วยงานพร้อมหน่วยงานที่อยู่ในกลุ่ม"""
    groups_with_departments = get_department_groups_with_departments(db, skip=skip, limit=limit)
    return format_response("0000", groups_with_departments)

@router.get("/{group_id}", response_model=FormatResponseModel)
async def read_department_group(
    group_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงข้อมูลกลุ่มหน่วยงานตาม ID"""
    group = get_department_group_by_id(db, group_id=group_id)
    if group is None:
        raise HTTPException(status_code=404, detail=f"Department group with ID {group_id} not found")
    return format_response("0000", group)

@router.post("", response_model=FormatResponseModel)
async def create_department_group_endpoint(
    group: DepartmentGroupCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_department"))
):
    """สร้างกลุ่มหน่วยงานใหม่"""
    try:
        group_data = group.model_dump()
        db_group = create_department_group(db, group_data)
        return format_response("0001", db_group)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})

@router.put("/{group_id}", response_model=FormatResponseModel)
async def update_department_group_endpoint(
    group_id: UUID, 
    group: DepartmentGroupUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_department"))
):
    """อัปเดตข้อมูลกลุ่มหน่วยงาน"""
    try:
        group_data = {k: v for k, v in group.model_dump().items() if v is not None}
        db_group = update_department_group(db, group_id=group_id, group_data=group_data)
        
        if db_group is None:
            raise HTTPException(status_code=404, detail=f"Department group with ID {group_id} not found")
            
        return format_response("0002", db_group)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.delete("/{group_id}", response_model=FormatResponseModel)
async def delete_department_group_endpoint(
    group_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_department"))
):
    """ลบกลุ่มหน่วยงาน (soft delete)"""
    try:
        success = delete_department_group(db, group_id=group_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Department group with ID {group_id} not found")
        return format_response("0003", {"id": group_id})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})