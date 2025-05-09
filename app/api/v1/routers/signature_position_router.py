from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from models import Position

from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.signature_position_controller import (
    DuplicateKeyError, create_signature_position, delete_signature_position,
    get_signature_positions, get_signature_position_by_id, update_signature_position,
    get_signature_positions_by_department, assign_signature_authority
)
from app.api.v1.schemas.signature_positions import (
    SignaturePosition, SignaturePositionCreate, SignaturePositionUpdate, 
    SignatureAuthorityCreate, SignatureAuthority, SignaturePositionWithAuthorities
)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/signature-positions",
    tags=["signature_positions"],
)

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

@router.get("/available-positions", response_model=FormatResponseModel)
async def read_available_positions(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงรายการตำแหน่งทั่วไปที่สามารถใช้อ้างอิงได้"""
    positions = db.query(Position).filter(
        Position.is_active == True
    ).order_by(Position.name).offset(skip).limit(limit).all()
    result = []
    for pos in positions:
        result.append({
            "id": pos.id,
            "name": pos.name,
            "description": pos.description,
            "level": pos.level
        })
    
    return format_response("0000", result)

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

@router.get("/{position_id}", response_model=FormatResponseModel)
async def read_signature_position(
    position_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงข้อมูลตำแหน่งผู้มีอำนาจลงนามตาม ID"""
    position = get_signature_position_by_id(db, position_id=position_id)
    if position is None:
        raise HTTPException(status_code=404, detail=f"Signature position with ID {position_id} not found")
    return format_response("0000", position)

@router.post("/", response_model=FormatResponseModel)
async def create_signature_position_endpoint(
    position: SignaturePositionCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """สร้างตำแหน่งผู้มีอำนาจลงนามใหม่"""
    try:
        # แปลง schema เป็น dictionary
        position_data = position.model_dump(exclude_none=True)
        
        # Log ข้อมูลที่ได้รับเพื่อดูค่าที่แท้จริง
        print(f"Received position data: {position_data}")
        
        # ตรวจสอบว่า department_id และ position_id เป็น UUID จริงๆ
        from uuid import UUID
        
        # ตรวจสอบและแปลง department_id
        if "department_id" in position_data:
            try:
                if not isinstance(position_data["department_id"], UUID):
                    position_data["department_id"] = UUID(str(position_data["department_id"]))
            except ValueError:
                return format_response("4000", {"error": "Invalid department_id, must be a valid UUID"})
            
        # ตรวจสอบและแปลง position_id
        if "position_id" in position_data:
            try:
                if not isinstance(position_data["position_id"], UUID):
                    position_data["position_id"] = UUID(str(position_data["position_id"]))
            except ValueError:
                return format_response("4000", {"error": "Invalid position_id, must be a valid UUID"})
        
        # สร้างตำแหน่งใหม่
        db_position = create_signature_position(db, position_data)
        return format_response("0001", db_position)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})

@router.put("/{position_id}", response_model=FormatResponseModel)
async def update_signature_position_endpoint(
    position_id: UUID, 
    position: SignaturePositionUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_users"))
):
    """อัปเดตข้อมูลตำแหน่งผู้มีอำนาจลงนาม"""
    try:
        position_data = {k: v for k, v in position.model_dump(exclude_none=True).items()}
        
        # แปลง UUID ถ้าจำเป็น
        if "department_id" in position_data and position_data["department_id"]:
            if not isinstance(position_data["department_id"], UUID):
                try:
                    position_data["department_id"] = UUID(str(position_data["department_id"]))
                except ValueError:
                    return format_response("4000", {"error": "Invalid department_id format"})
                
        if "position_id" in position_data and position_data["position_id"]:
            if not isinstance(position_data["position_id"], UUID):
                try:
                    position_data["position_id"] = UUID(str(position_data["position_id"]))
                except ValueError:
                    return format_response("4000", {"error": "Invalid position_id format"})
                
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

@router.post("/assign-authority", response_model=FormatResponseModel)
async def assign_signature_authority_endpoint(
    authority_data: SignatureAuthorityCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """กำหนดสิทธิการลงนามให้กับผู้ใช้"""
    try:
        # แปลง schema เป็น dictionary
        auth_data = authority_data.model_dump(exclude_none=True)
        
        # แปลง UUID ถ้าจำเป็น
        if "user_id" in auth_data:
            try:
                if not isinstance(auth_data["user_id"], UUID):
                    auth_data["user_id"] = UUID(str(auth_data["user_id"]))
            except ValueError:
                return format_response("4000", {"error": "Invalid user_id format"})
                
        if "position_id" in auth_data:
            try:
                if not isinstance(auth_data["position_id"], UUID):
                    auth_data["position_id"] = UUID(str(auth_data["position_id"]))
            except ValueError:
                return format_response("4000", {"error": "Invalid position_id format"})
                
        result = assign_signature_authority(db, auth_data)
        return format_response("0001", result)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return format_response("5000", {"error": str(e)})