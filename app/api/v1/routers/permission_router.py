from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import permission_required
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.schemas.permission import (
    RoleCreate, RoleResponse, RoleUpdate,
    ResourceCreate, ResourceResponse, ResourceUpdate,
    PermissionCreate, PermissionResponse, PermissionUpdate, 
    UserRoleCreate
)
from app.api.v1.controllers.permission_controller import (
    create_role, get_roles, update_role, delete_role,
    create_resource, get_resources, update_resource, delete_resource,
    create_permission, get_permissions, update_permission, delete_permission,
    assign_role_to_user, remove_role_from_user, get_user_roles
)
from models.role import Role
from models.resource import Resource
from models.permission import Permission
from models.user import User

router = APIRouter(
    prefix="/permissions",
    tags=["permissions"],
)

# =================== Role Endpoints ===================
@router.post("/roles", response_model=FormatResponseModel)
async def create_new_role(
    role: RoleCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """สร้างบทบาทใหม่"""
    try:
        db_role = create_role(db, role)
        result = RoleResponse.model_validate(db_role).model_dump()
        return format_response("0001", result)
    except Exception as e:
        print(f"Error creating role: {str(e)}")
        return format_response("5000", {"error": "Error creating role"})

@router.get("/roles", response_model=FormatResponseModel)
async def read_roles(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลบทบาททั้งหมด"""
    try:
        roles = get_roles(db, skip=skip, limit=limit)
        result = [RoleResponse.model_validate(role).model_dump() for role in roles]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching roles: {str(e)}")
        return format_response("5000", {"error": "Error fetching roles"})

@router.get("/roles/{role_id}", response_model=FormatResponseModel)
async def read_role(
    role_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลบทบาทตาม ID"""
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return format_response("4040", {"error": f"Role with ID {role_id} not found"})
        
        result = RoleResponse.model_validate(role).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching role: {str(e)}")
        return format_response("5000", {"error": "Error fetching role"})

@router.put("/roles/{role_id}", response_model=FormatResponseModel)
async def update_existing_role(
    role_id: UUID, 
    role_data: RoleUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """อัปเดตข้อมูลบทบาท"""
    try:
        updated_role = update_role(db, role_id, role_data)
        if not updated_role:
            return format_response("4040", {"error": f"Role with ID {role_id} not found"})
        
        result = RoleResponse.model_validate(updated_role).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error updating role: {str(e)}")
        return format_response("5000", {"error": "Error updating role"})

@router.delete("/roles/{role_id}", response_model=FormatResponseModel)
async def delete_existing_role(
    role_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ลบบทบาท"""
    try:
        success = delete_role(db, role_id)
        if not success:
            return format_response("4040", {"error": f"Role with ID {role_id} not found"})
        
        return format_response("0000", {"message": f"Role with ID {role_id} deleted successfully"})
    except Exception as e:
        print(f"Error deleting role: {str(e)}")
        return format_response("5000", {"error": "Error deleting role"})

# =================== Resource Endpoints ===================
@router.post("/resources", response_model=FormatResponseModel)
async def create_new_resource(
    resource: ResourceCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """สร้างทรัพยากรใหม่"""
    try:
        db_resource = create_resource(db, resource)
        result = ResourceResponse.model_validate(db_resource).model_dump()
        return format_response("0001", result)
    except Exception as e:
        print(f"Error creating resource: {str(e)}")
        return format_response("5000", {"error": "Error creating resource"})

@router.get("/resources", response_model=FormatResponseModel)
async def read_resources(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลทรัพยากรทั้งหมด"""
    try:
        resources = get_resources(db, skip=skip, limit=limit)
        result = [ResourceResponse.model_validate(resource).model_dump() for resource in resources]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching resources: {str(e)}")
        return format_response("5000", {"error": "Error fetching resources"})

@router.get("/resources/{resource_id}", response_model=FormatResponseModel)
async def read_resource(
    resource_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลทรัพยากรตาม ID"""
    try:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return format_response("4040", {"error": f"Resource with ID {resource_id} not found"})
        
        result = ResourceResponse.model_validate(resource).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching resource: {str(e)}")
        return format_response("5000", {"error": "Error fetching resource"})

@router.put("/resources/{resource_id}", response_model=FormatResponseModel)
async def update_existing_resource(
    resource_id: UUID, 
    resource_data: ResourceUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """อัปเดตข้อมูลทรัพยากร"""
    try:
        updated_resource = update_resource(db, resource_id, resource_data)
        if not updated_resource:
            return format_response("4040", {"error": f"Resource with ID {resource_id} not found"})
        
        result = ResourceResponse.model_validate(updated_resource).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error updating resource: {str(e)}")
        return format_response("5000", {"error": "Error updating resource"})

@router.delete("/resources/{resource_id}", response_model=FormatResponseModel)
async def delete_existing_resource(
    resource_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ลบทรัพยากร"""
    try:
        success = delete_resource(db, resource_id)
        if not success:
            return format_response("4040", {"error": f"Resource with ID {resource_id} not found"})
        
        return format_response("0000", {"message": f"Resource with ID {resource_id} deleted successfully"})
    except Exception as e:
        print(f"Error deleting resource: {str(e)}")
        return format_response("5000", {"error": "Error deleting resource"})

# =================== Permission Endpoints ===================
@router.post("/", response_model=FormatResponseModel)
async def create_new_permission(
    permission: PermissionCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """สร้างสิทธิ์ใหม่ (รองรับทั้ง role-based และ user-based)"""
    try:
        # ตรวจสอบว่าข้อมูลถูกต้องหรือไม่
        if permission.role_id is None and permission.user_id is None:
            return format_response("4000", {"error": "Permission must be associated with either a role or a user"})
        
        if permission.role_id is not None and permission.user_id is not None:
            return format_response("4000", {"error": "Permission must be associated with either a role or a user, not both"})
            
        db_permission = create_permission(db, permission)
        result = PermissionResponse.model_validate(db_permission).model_dump()
        return format_response("0001", result)
    except ValueError as e:
        return format_response("4000", {"error": str(e)})
    except Exception as e:
        print(f"Error creating permission: {str(e)}")
        return format_response("5000", {"error": "Error creating permission"})

@router.get("/", response_model=FormatResponseModel)
async def read_permissions(
    role_id: Optional[UUID] = None, 
    resource_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลสิทธิ์ทั้งหมดหรือกรองตามบทบาท, ทรัพยากร, หรือผู้ใช้"""
    try:
        permissions = get_permissions(db, role_id=role_id, resource_id=resource_id, user_id=user_id)
        result = [PermissionResponse.model_validate(permission).model_dump() for permission in permissions]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching permissions: {str(e)}")
        return format_response("5000", {"error": "Error fetching permissions"})

@router.get("/{permission_id}", response_model=FormatResponseModel)
async def read_permission(
    permission_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลสิทธิ์ตาม ID"""
    try:
        permission = db.query(Permission).filter(Permission.id == permission_id).first()
        if not permission:
            return format_response("4040", {"error": f"Permission with ID {permission_id} not found"})
        
        result = PermissionResponse.model_validate(permission).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching permission: {str(e)}")
        return format_response("5000", {"error": "Error fetching permission"})

@router.put("/{permission_id}", response_model=FormatResponseModel)
async def update_existing_permission(
    permission_id: UUID, 
    permission_data: PermissionUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """อัปเดตข้อมูลสิทธิ์"""
    try:
        updated_permission = update_permission(db, permission_id, permission_data)
        if not updated_permission:
            return format_response("4040", {"error": f"Permission with ID {permission_id} not found"})
        
        result = PermissionResponse.model_validate(updated_permission).model_dump()
        return format_response("0000", result)
    except Exception as e:
        print(f"Error updating permission: {str(e)}")
        return format_response("5000", {"error": "Error updating permission"})

@router.delete("/{permission_id}", response_model=FormatResponseModel)
async def delete_existing_permission(
    permission_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ลบสิทธิ์"""
    try:
        success = delete_permission(db, permission_id)
        if not success:
            return format_response("4040", {"error": f"Permission with ID {permission_id} not found"})
        
        return format_response("0000", {"message": f"Permission with ID {permission_id} deleted successfully"})
    except Exception as e:
        print(f"Error deleting permission: {str(e)}")
        return format_response("5000", {"error": "Error deleting permission"})

# =================== User-Role Assignment Endpoints ===================
@router.post("/user-roles", response_model=FormatResponseModel)
async def assign_role_to_user_endpoint(
    user_role: UserRoleCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """กำหนดบทบาทให้กับผู้ใช้"""
    try:
        result = assign_role_to_user(db, user_role.user_id, user_role.role_id)
        return format_response("0001", {"message": "Role assigned successfully"})
    except Exception as e:
        print(f"Error assigning role to user: {str(e)}")
        return format_response("5000", {"error": "Error assigning role to user"})

@router.delete("/user-roles", response_model=FormatResponseModel)
async def remove_role_from_user_endpoint(
    user_role: UserRoleCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ลบบทบาทออกจากผู้ใช้"""
    try:
        success = remove_role_from_user(db, user_role.user_id, user_role.role_id)
        if not success:
            return format_response("4040", {"error": "User-role assignment not found"})
        
        return format_response("0000", {"message": "Role removed from user successfully"})
    except Exception as e:
        print(f"Error removing role from user: {str(e)}")
        return format_response("5000", {"error": "Error removing role from user"})

@router.get("/user-roles/{user_id}", response_model=FormatResponseModel)
async def get_roles_for_user_endpoint(
    user_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลบทบาทของผู้ใช้"""
    try:
        roles = get_user_roles(db, user_id)
        result = [RoleResponse.model_validate(role).model_dump() for role in roles]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching roles for user: {str(e)}")
        return format_response("5000", {"error": "Error fetching roles for user"})
    
    
# =================== Combined User Permission Endpoint ===================
@router.get("/combined/{user_id}", response_model=FormatResponseModel)
async def get_combined_permissions(
    user_id: UUID,
    resource_path: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """
    ดึงข้อมูลสิทธิ์รวมของผู้ใช้สำหรับทรัพยากรที่ระบุ
    
    คำนวณจากทั้งบทบาทที่ผู้ใช้มีและสิทธิ์เฉพาะบุคคล โดยคำนึงถึงการ override
    """
    try:
        from app.api.v1.controllers.permission_controller import get_user_permissions
        
        combined_permissions = get_user_permissions(db, user_id, resource_path)
        
        if not combined_permissions:
            return format_response("4040", {"error": f"No permissions found for user {user_id} on resource {resource_path}"})
        
        return format_response("0000", combined_permissions)
    except Exception as e:
        print(f"Error getting combined permissions: {str(e)}")
        return format_response("5000", {"error": "Error getting combined permissions"})