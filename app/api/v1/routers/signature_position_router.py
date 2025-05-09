from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.signature_position_controller import (
    DuplicateKeyError, create_signature_position, delete_signature_position,
    get_signature_positions, get_signature_position_by_id, update_signature_position,
    get_signature_positions_by_department, assign_signature_authority,
    get_available_users, get_available_departments, get_positions_with_authorities
)
from app.api.v1.schemas.signature_positions import (
    SignaturePosition, SignaturePositionCreate, SignaturePositionUpdate, 
    SignatureAuthorityCreate, SignatureAuthority
)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/signature-positions",
    tags=["signature_positions"],
)

# Endpoint to get all signature positions
@router.get("/", response_model=FormatResponseModel)
async def read_signature_positions(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการตำแหน่งผู้มีอำนาจลงนามทั้งหมด"""
    positions_data = get_signature_positions(db, skip=skip, limit=limit)
    return format_response("0000", positions_data)

# Important endpoint: List positions with assigned authorities
@router.get("/list-positions-with-authorities", response_model=FormatResponseModel)
async def list_positions_with_authorities_endpoint(
    department_id: Optional[str] = Query(None, description="Department UUID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการตำแหน่งผู้มีอำนาจลงนามพร้อมข้อมูลผู้ลงนาม"""
    try:
        # Convert department_id to UUID if specified
        uuid_department_id = None
        if department_id:
            try:
                uuid_department_id = UUID(department_id)
            except ValueError:
                return format_response("4000", {"error": "Invalid department_id format"})
                
        result = get_positions_with_authorities(db, department_id=uuid_department_id, skip=skip, limit=limit)
        return format_response("0000", result)
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

# Get available users that can be assigned as signatories
@router.get("/available-users", response_model=FormatResponseModel)
async def get_available_users_endpoint(
    position_id: Optional[str] = Query(None, description="Filter users by position"),
    department_id: Optional[str] = Query(None, description="Filter users by department"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการผู้ใช้ที่สามารถกำหนดเป็นผู้มีอำนาจลงนามได้ (กรองตามตำแหน่งหรือหน่วยงานได้)"""
    try:
        # Here you would implement filtering by position or department
        # This functionality needs to be added to the controller
        result = get_available_users(db, skip=skip, limit=limit)
        return format_response("0000", result)
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

# Get available departments for signature positions
@router.get("/available-departments", response_model=FormatResponseModel)
async def get_available_departments_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการหน่วยงานที่สามารถกำหนดตำแหน่งผู้มีอำนาจลงนามได้"""
    try:
        result = get_available_departments(db, skip=skip, limit=limit)
        return format_response("0000", result)
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

# Create a new signature position
@router.post("/", response_model=FormatResponseModel)
async def create_signature_position_endpoint(
    position: SignaturePositionCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """สร้างตำแหน่งผู้มีอำนาจลงนามใหม่"""
    try:
        position_data = position.model_dump(exclude_none=True)
        db_position = create_signature_position(db, position_data)
        return format_response("0001", db_position)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

# Assign user to a signature position (grant signing authority)
@router.post("/assign-authority", response_model=FormatResponseModel)
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

# Get signature positions for a specific department
@router.get("/department/{department_id}", response_model=FormatResponseModel)
async def read_signature_positions_by_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการตำแหน่งผู้มีอำนาจลงนามตามหน่วยงาน"""
    try:
        positions_data = get_signature_positions_by_department(db, department_id=department_id)
        return format_response("0000", positions_data)
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

# Get a specific signature position by ID
@router.get("/{position_id}", response_model=FormatResponseModel)
async def read_signature_position(
    position_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงข้อมูลตำแหน่งผู้มีอำนาจลงนามตาม ID"""
    position = get_signature_position_by_id(db, position_id=position_id)
    if position is None:
        return format_response("4042", {"error": f"Signature position with ID {position_id} not found"})
    return format_response("0000", position)

# Update a signature position
@router.put("/{position_id}", response_model=FormatResponseModel)
async def update_signature_position_endpoint(
    position_id: UUID, 
    position: SignaturePositionUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_users"))
):
    """อัปเดตข้อมูลตำแหน่งผู้มีอำนาจลงนาม"""
    try:
        position_data = position.model_dump(exclude_none=True)
        db_position = update_signature_position(db, position_id=position_id, position_data=position_data)
        
        if db_position is None:
            return format_response("4042", {"error": f"Signature position with ID {position_id} not found"})
            
        return format_response("0002", db_position)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

# Delete a signature position
@router.delete("/{position_id}", response_model=FormatResponseModel)
async def delete_signature_position_endpoint(
    position_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_users"))
):
    """ลบตำแหน่งผู้มีอำนาจลงนาม (soft delete)"""
    try:
        success = delete_signature_position(db, position_id=position_id)
        if not success:
            return format_response("4042", {"error": f"Signature position with ID {position_id} not found"})
        return format_response("0003", {"id": position_id})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})