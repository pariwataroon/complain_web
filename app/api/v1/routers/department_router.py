from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import bleach

from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.department_controller import (
    DuplicateKeyError, create_department, delete_department,
    get_departments, get_department_by_id, update_department,
    get_departments_stats, update_department_order_batch,
    get_departments_with_venues, get_departments_by_group,
    search_departments_by_name
)
from app.api.v1.schemas.department import Department, DepartmentCreate, DepartmentUpdate, DepartmentWithVenues
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/departments",
    tags=["departments"],
)

@router.get("", response_model=FormatResponseModel)
async def read_departments(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงรายการหน่วยงานทั้งหมด"""
    departments_data = get_departments(db, skip=skip, limit=limit)
    return format_response("0000", departments_data)

@router.get("/grouped", response_model=FormatResponseModel)
async def read_departments_by_group(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงข้อมูลหน่วยงานแบ่งตามกลุ่ม"""
    grouped_data = get_departments_by_group(db, skip=skip, limit=limit)
    return format_response("0000", grouped_data)

@router.get("/with-venues", response_model=FormatResponseModel)
async def read_departments_with_venues(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงข้อมูลหน่วยงานพร้อมสถานที่"""
    departments_with_venues = get_departments_with_venues(db, skip=skip, limit=limit)
    return format_response("0000", departments_with_venues)

@router.get("/{department_id}", response_model=FormatResponseModel)
async def read_department(
    department_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงข้อมูลหน่วยงานตาม ID"""
    department = get_department_by_id(db, department_id=department_id)
    if department is None:
        raise HTTPException(status_code=404, detail=f"Department with ID {department_id} not found")
    return format_response("0000", department)

@router.get("/search/by-name", response_model=FormatResponseModel)
async def search_departments_by_name_endpoint(
    search_term: str,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ค้นหาหน่วยงานตามชื่อ รหัส หรือตัวย่อ"""
    departments = search_departments_by_name(db, search_term=search_term, skip=skip, limit=limit)
    return format_response("0000", departments)

@router.post("", response_model=FormatResponseModel)
async def create_department_endpoint(
    department: DepartmentCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_department"))
):
    try:
        data = department.model_dump()
        data["name"] = bleach.clean(data.get("name", ""), tags=[], attributes={})

        db_dept = create_department(db, data)

        return format_response("0001", {
            "id": db_dept.id,
            "code": db_dept.code,
            "created_at": db_dept.created_at
        })

    except DuplicateKeyError as e:
        return format_response("4090", {"error": "ชื่อหน่วยงานซ้ำ"})

@router.put("/{department_id}", response_model=FormatResponseModel)
async def update_department_endpoint(
    department_id: UUID, 
    department: DepartmentUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_department"))
):
    """อัปเดตข้อมูลหน่วยงาน"""
    try:
        department_data = {k: v for k, v in department.model_dump().items() if v is not None}

        if "name" in department_data:
            department_data["name"] = bleach.clean(department_data["name"], tags=[], attributes={})

        db_department = update_department(db, department_id=department_id, department_data=department_data)

        if db_department is None:
            raise HTTPException(status_code=404, detail=f"Department with ID {department_id} not found")

        response_data = {
            "id": db_department.id,
            "code": db_department.code,
            "updated_at": db_department.updated_at
        }

        return format_response("0002", response_data)

    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.delete("/{department_id}", response_model=FormatResponseModel)
async def delete_department_endpoint(
    department_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_department"))
):
    """ลบหน่วยงาน (soft delete)"""
    success = delete_department(db, department_id=department_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Department with ID {department_id} not found")
    return format_response("0003", {"id": department_id})

@router.get("/stats/overview", response_model=FormatResponseModel)
async def get_departments_stats_endpoint(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_department"))
):
    """ดึงข้อมูลสถิติสำหรับหน่วยงาน"""
    stats = get_departments_stats(db)
    return format_response("0000", stats)

@router.post("/batch-update-order", response_model=FormatResponseModel)
async def update_department_order_batch_endpoint(
    order_data: List[Dict[str, Any]] = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_department"))
):
    """อัปเดตลำดับของหน่วยงานหลายรายการพร้อมกัน"""
    updated_departments = update_department_order_batch(db, order_data)
    return format_response("0002", updated_departments)