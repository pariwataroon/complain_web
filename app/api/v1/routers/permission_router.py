from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import permission_required
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.schemas.permission import (
    RoleCreate, RoleResponse, ResourceCreate, ResourceResponse,
    PermissionCreate, PermissionResponse, UserRoleCreate
)
from app.api.v1.controllers.permission_controller import (
    create_role, get_roles, update_role, delete_role,
    create_resource, get_resources, update_resource, delete_resource,
    create_permission, get_permissions, update_permission, delete_permission,
    assign_role_to_user, remove_role_from_user, get_user_roles
)

router = APIRouter(
    prefix="/permissions",
    tags=["permissions"],
)

# Role endpoints
@router.post("/roles", response_model=FormatResponseModel)
async def create_new_role(
    role: RoleCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(permission_required("create"))
):
    db_role = create_role(db, role)
    result = RoleResponse.model_validate(db_role).model_dump()
    return format_response("0001", result)

@router.get("/roles", response_model=FormatResponseModel)
async def read_roles(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(permission_required("read"))
):
    roles = get_roles(db, skip=skip, limit=limit)
    result = [RoleResponse.model_validate(role).model_dump() for role in roles]
    return format_response("0000", result)

# เพิ่ม endpoints สำหรับการจัดการ resources และ permissions ตามต้องการ

# User-Role assignment endpoints
@router.post("/user-roles", response_model=FormatResponseModel)
async def assign_role(
    user_role: UserRoleCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(permission_required("create"))
):
    result = assign_role_to_user(db, user_role.user_id, user_role.role_id)
    return format_response("0001", result)

@router.get("/user-roles/{user_id}", response_model=FormatResponseModel)
async def get_roles_for_user(
    user_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(permission_required("read"))
):
    roles = get_user_roles(db, user_id)
    result = [RoleResponse.model_validate(role).model_dump() for role in roles]
    return format_response("0000", result)