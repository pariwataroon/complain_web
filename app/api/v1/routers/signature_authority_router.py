from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.signature_authority_controller import (
    DuplicateKeyError, assign_signature_authority,
    get_signature_authorities, get_authorities_by_department,
    get_available_users, get_available_departments,
    remove_signature_authority, get_users_with_signature_by_department_group,
    create_bulk_signature_authorities, get_signature_authority_groups
)
from app.api.v1.schemas.signature_authority import (
    SignatureAuthorityCreate, SignatureAuthority, SignatureAuthorityUpdate
)
from app.api.v1.schemas.group_signature_authority import (
    BulkSignatureAuthorityCreate,
    GroupSignatureAuthorityCreate,
    GroupSignatureAuthorityUpdate
)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/signature-authorities",
    tags=["signature_authorities"],
)

# Endpoint to get all signature authorities
@router.get("", response_model=FormatResponseModel)
async def read_signature_authorities(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการผู้มีอำนาจลงนามทั้งหมด"""
    authorities_data = get_signature_authorities(db, skip=skip, limit=limit)
    return format_response("0000", authorities_data)

# Get available users that can be assigned as signatories
@router.get("/available-users", response_model=FormatResponseModel)
async def get_available_users_endpoint(
    department_id: Optional[str] = Query(None, description="Filter users by department"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการผู้ใช้ที่สามารถกำหนดเป็นผู้มีอำนาจลงนามได้ (กรองตามหน่วยงานได้)"""
    try:
        # Here you would implement filtering by department if needed
        result = get_available_users(db, skip=skip, limit=limit)
        return format_response("0000", result)
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

# Get available departments for signature authorities
@router.get("/available-departments", response_model=FormatResponseModel)
async def get_available_departments_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการหน่วยงานที่สามารถกำหนดผู้มีอำนาจลงนามได้"""
    try:
        result = get_available_departments(db, skip=skip, limit=limit)
        return format_response("0000", result)
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

# Assign signature authority to a user
@router.post("", response_model=FormatResponseModel)
async def assign_signature_authority_endpoint(
    authority_data: SignatureAuthorityCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """กำหนดสิทธิการลงนามให้กับผู้ใช้"""
    try:
        auth_data = authority_data.model_dump(exclude_none=True)
        result = assign_signature_authority(db, auth_data)
        return format_response("0001", result)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

# Get signature authorities for a specific department
@router.get("/department/{department_id}", response_model=FormatResponseModel)
async def read_signature_authorities_by_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการผู้มีอำนาจลงนามตามหน่วยงาน"""
    try:
        authorities_data = get_authorities_by_department(db, department_id=department_id)
        return format_response("0000", authorities_data)
    except HTTPException as e:
        # แก้ไขรหัสตอบกลับให้สอดคล้องกับรูปแบบที่กำหนด (3 หลัก)
        status_code = str(e.status_code)
        if len(status_code) == 3:
            status_code = status_code
        else:
            status_code = "500"
        return format_response(status_code, {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("500", {"error": str(e)})

# เพิ่มฟังก์ชันสำหรับลบสิทธิ์การลงนาม - แก้ไขให้สมบูรณ์
@router.delete("/{authority_id}", response_model=FormatResponseModel)
async def remove_signature_authority_endpoint(
    authority_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_users"))
):
    """ยกเลิกสิทธิการลงนามของผู้ใช้"""
    try:
        success = remove_signature_authority(db, authority_id=authority_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Signature authority with ID {authority_id} not found")
        return format_response("0003", {"id": str(authority_id)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})
    
@router.get("/users-and-departments", response_model=FormatResponseModel)
async def get_users_with_signature_by_department_group_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการผู้ใช้ที่มีอำนาจลงนามจัดกลุ่มตามกลุ่มหน่วยงาน"""
    try:
        result = get_users_with_signature_by_department_group(db, skip=skip, limit=limit)
        return format_response("0000", result)
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

# เพิ่ม endpoints สำหรับ group signature authorities
@router.get("/groups", response_model=FormatResponseModel)
async def get_signature_authority_groups_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการกลุ่มผู้มีอำนาจลงนามทั้งหมด"""
    try:
        result = get_signature_authority_groups(db, skip=skip, limit=limit)
        return format_response("0000", result)
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.post("/bulk", response_model=FormatResponseModel)
async def create_bulk_signature_authorities_endpoint(
    bulk_data: BulkSignatureAuthorityCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """สร้างกลุ่มผู้ลงนามพร้อมสมาชิกหลายคนในครั้งเดียว"""
    try:
        data = bulk_data.model_dump(exclude_none=True)
        result = create_bulk_signature_authorities(db, data)
        return format_response("0001", result)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        return format_response("5000", {"error": str(e)})