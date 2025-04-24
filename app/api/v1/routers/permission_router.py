from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.v1.schemas.permission import (
    RoleCreate, RoleResponse, RoleUpdate,
    ResourceCreate, ResourceResponse, ResourceUpdate,
    PermissionCreate, PermissionResponse, PermissionUpdate, 
    UserRoleCreate, ResourceOrderUpdate
)
from app.api.v1.controllers.permission_controller import (
    create_role, get_roles, update_role, delete_role,
    create_resource, get_resources, get_resources_by_group, update_resource, delete_resource,
    create_permission, get_permissions, update_permission, delete_permission,
    assign_role_to_user, remove_role_from_user, get_user_roles, get_resource_by_id
)
from app.api.v1.routers.user_permission_router import router as user_permission_router
from models.role import Role
from models.resource import Resource
from models.permission import Permission

router = APIRouter(
    prefix="/permissions",
    tags=["permissions"],
)

router.include_router(user_permission_router, prefix="/user-permissions")

# =================== Role Endpoints ===================
@router.post("/roles", response_model=FormatResponseModel)
async def create_new_role(
    role: RoleCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_access"))
):
    """สร้างบทบาทใหม่ - ต้องมีสิทธิ์สร้างใน setting_access"""
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
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงข้อมูลบทบาททั้งหมด - ต้องมีสิทธิ์อ่านใน setting_access"""
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
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงข้อมูลบทบาทตาม ID - ต้องมีสิทธิ์อ่านใน setting_access"""
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
    current_user: str = Depends(can_update("setting_access"))
):
    """อัปเดตข้อมูลบทบาท - ต้องมีสิทธิ์แก้ไขใน setting_access"""
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
    current_user: str = Depends(can_delete("setting_access"))
):
    """ลบบทบาท - ต้องมีสิทธิ์ลบใน setting_access"""
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
    current_user: str = Depends(can_create("setting_access"))
):
    """สร้างทรัพยากรใหม่ - ต้องมีสิทธิ์สร้างใน setting_access"""
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
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงข้อมูลทรัพยากรทั้งหมด - ต้องมีสิทธิ์อ่านใน setting_access"""
    try:
        resources = get_resources(db, skip=skip, limit=limit)
        result = [ResourceResponse.model_validate(resource).model_dump() for resource in resources]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching resources: {str(e)}")
        return format_response("5000", {"error": "Error fetching resources"})

@router.get("/resources-bygroup", response_model=FormatResponseModel)
async def read_resources_by_group(
    group_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงข้อมูลทรัพยากรตามกลุ่ม - ต้องมีสิทธิ์อ่านใน setting_access"""
    try:
        # ฟังก์ชัน get_resources_by_group คืนค่าเป็นลิสต์ของกลุ่มที่มีทรัพยากรอยู่แล้ว
        # แต่ละกลุ่มมี resources ที่ผ่านการแปลงเป็น dict ด้วย ResourceResponse แล้ว
        result = get_resources_by_group(db, group_id=group_id, skip=skip, limit=limit)
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching resources by group: {str(e)}")
        import traceback
        traceback.print_exc()  # เพิ่ม traceback เพื่อให้เห็นข้อผิดพลาดทั้งหมด
        return format_response("5000", {"error": "Error fetching resources by group"})

@router.get("/resources/{resource_id}", response_model=FormatResponseModel)
async def read_resource(
    resource_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงข้อมูลทรัพยากรตาม ID - ต้องมีสิทธิ์อ่านใน setting_access"""
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
    current_user: str = Depends(can_update("setting_access"))
):
    """อัปเดตข้อมูลทรัพยากร - ต้องมีสิทธิ์แก้ไขใน setting_access"""
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
    current_user: str = Depends(can_delete("setting_access"))
):
    """ลบทรัพยากร - ต้องมีสิทธิ์ลบใน setting_access"""
    try:
        success = delete_resource(db, resource_id)
        if not success:
            return format_response("4040", {"error": f"Resource with ID {resource_id} not found"})
        
        return format_response("0000", {"message": f"Resource with ID {resource_id} deleted successfully"})
    except Exception as e:
        print(f"Error deleting resource: {str(e)}")
        return format_response("5000", {"error": "Error deleting resource"})

# =================== Permission Endpoints ===================
@router.post("/create", response_model=FormatResponseModel)
async def create_new_permission(
    permission: PermissionCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_access"))
):
    """สร้างสิทธิ์ใหม่ (รองรับทั้ง role-based และ user-based) - ต้องมีสิทธิ์สร้างใน setting_access"""
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
        error_message = "Error creating permission"
        if "FK__permissio__role" in str(e):
            error_message = f"The role ID does not exist in the database: {permission.role_id}"
        elif "FK__permissio__user" in str(e):
            error_message = f"The user ID does not exist in the database: {permission.user_id}"
        elif "FK__permissio__resource" in str(e):
            error_message = f"The resource ID does not exist in the database: {permission.resource_id}"
            
        return format_response("5000", {"error": error_message})

@router.get("/list", response_model=FormatResponseModel)
async def read_permissions(
    role_id: Optional[UUID] = None, 
    resource_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงข้อมูลสิทธิ์ทั้งหมดหรือกรองตามบทบาท, ทรัพยากร, หรือผู้ใช้ - ต้องมีสิทธิ์อ่านใน setting_access"""
    try:
        permissions = get_permissions(db, role_id=role_id, resource_id=resource_id, user_id=user_id)
        result = [PermissionResponse.model_validate(permission).model_dump() for permission in permissions]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching permissions: {str(e)}")
        return format_response("5000", {"error": "Error fetching permissions"})
    

# เพิ่ม endpoint ใหม่เพื่อแสดงข้อมูลสิทธิ์ทั้งหมดของทุก resource
@router.get("/resources-permissions", response_model=FormatResponseModel)
async def get_all_resources_with_permissions(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """
    ดึงข้อมูลทรัพยากรทั้งหมดพร้อมรายละเอียดสิทธิ์ - ต้องมีสิทธิ์อ่านใน setting_access
    
    แสดงรายละเอียดว่าแต่ละทรัพยากรมี role และ user ใดบ้างที่มีสิทธิ์เข้าถึง
    พร้อมสถานะการตรวจสอบ (tracking) สำหรับทุกบทบาท
    """
    try:
        # เรียกใช้ฟังก์ชันที่ปรับปรุงใหม่
        from app.api.v1.controllers.permission_controller import get_all_resources_with_permissions_by_roles
        result = get_all_resources_with_permissions_by_roles(db, skip=skip, limit=limit)
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching resources with permissions: {str(e)}")
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": "Error fetching resources with permissions"})


@router.get("/{permission_id}", response_model=FormatResponseModel)
async def read_permission(
    permission_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงข้อมูลสิทธิ์ตาม ID - ต้องมีสิทธิ์อ่านใน setting_access"""
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
    current_user: str = Depends(can_update("setting_access"))
):
    """อัปเดตข้อมูลสิทธิ์ - ต้องมีสิทธิ์แก้ไขใน setting_access"""
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
    current_user: str = Depends(can_delete("setting_access"))
):
    """ลบสิทธิ์ - ต้องมีสิทธิ์ลบใน setting_access"""
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
    current_user: str = Depends(can_create("setting_access"))
):
    """กำหนดบทบาทให้กับผู้ใช้ - ต้องมีสิทธิ์สร้างใน setting_access"""
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
    current_user: str = Depends(can_delete("setting_access"))
):
    """ลบบทบาทออกจากผู้ใช้ - ต้องมีสิทธิ์ลบใน setting_access"""
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
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงข้อมูลบทบาทของผู้ใช้ - ต้องมีสิทธิ์อ่านใน setting_access"""
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
    current_user: str = Depends(can_read("setting_access"))
):
    """
    ดึงข้อมูลสิทธิ์รวมของผู้ใช้สำหรับทรัพยากรที่ระบุ - ต้องมีสิทธิ์อ่านใน setting_access
    
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


# เพิ่ม endpoint สำหรับดูรายละเอียด permissions ของ resource ที่ระบุ
@router.get("/resources/{resource_id}/permissions", response_model=FormatResponseModel)
async def get_resource_permissions(
    resource_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """
    ดึงข้อมูลสิทธิ์ทั้งหมดของทรัพยากรที่ระบุ - ต้องมีสิทธิ์อ่านใน setting_access
    
    แสดงรายละเอียดว่าทรัพยากรนี้มีการกำหนดสิทธิ์ให้กับ role และ user ใดบ้าง
    """
    try:
        # ตรวจสอบว่า resource นี้มีอยู่หรือไม่
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return format_response("4040", {"error": f"Resource with ID {resource_id} not found"})
        
        # ดึงข้อมูล permission ทั้งหมดที่เกี่ยวข้องกับ resource นี้
        permissions = db.query(Permission).filter(Permission.resource_id == resource_id).all()
        
        # แยกเป็น role-based permissions และ user-based permissions
        role_permissions = []
        user_permissions = []
        
        for permission in permissions:
            permission_data = PermissionResponse.model_validate(permission).model_dump()
            
            if permission.role_id:
                # ดึงข้อมูล role
                role = db.query(Role).filter(Role.id == permission.role_id).first()
                if role:
                    permission_data["role_name"] = role.name
                    permission_data["role_description"] = role.description
                    
                    # ดึงจำนวนผู้ใช้ที่มีบทบาทนี้
                    from models.user_role import UserRole
                    user_count = db.query(UserRole).filter(UserRole.role_id == role.id).count()
                    permission_data["user_count"] = user_count
                    
                    role_permissions.append(permission_data)
            
            elif permission.user_id:
                # ดึงข้อมูล user
                from models.user import User
                user = db.query(User).filter(User.id == permission.user_id).first()
                if user:
                    permission_data["user_full_name"] = f"{user.first_name} {user.last_name}"
                    permission_data["user_email"] = user.email
                    user_permissions.append(permission_data)
        
        # สร้างข้อมูลผลลัพธ์
        result = {
            "resource": ResourceResponse.model_validate(resource).model_dump(),
            "role_permissions": role_permissions,
            "user_permissions": user_permissions,
            "total_role_permissions": len(role_permissions),
            "total_user_permissions": len(user_permissions)
        }
        
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching resource permissions: {str(e)}")
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": "Error fetching resource permissions"})


# เพิ่ม endpoint สำหรับค้นหา resource ตามชื่อหรือคำอธิบาย
@router.get("/resources/search", response_model=FormatResponseModel)
async def search_resources(
    query: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """
    ค้นหาทรัพยากรตามชื่อหรือคำอธิบาย - ต้องมีสิทธิ์อ่านใน setting_access
    """
    try:
        # ค้นหา resources ที่ชื่อหรือคำอธิบายมีคำที่ต้องการค้นหา
        from sqlalchemy import or_
        resources = db.query(Resource).filter(
            or_(
                Resource.name.ilike(f"%{query}%"),
                Resource.description.ilike(f"%{query}%"),
                Resource.path.ilike(f"%{query}%")
            )
        ).all()
        
        result = [ResourceResponse.model_validate(resource).model_dump() for resource in resources]
        return format_response("0000", result)
    except Exception as e:
        print(f"Error searching resources: {str(e)}")
        return format_response("5000", {"error": "Error searching resources"})


# เพิ่ม endpoint ใหม่สำหรับดูข้อมูลผู้ใช้ที่มีสิทธิ์เข้าถึง resource ที่ระบุ
@router.get("/resources/{resource_id}/users", response_model=FormatResponseModel)
async def get_users_with_access_to_resource(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """
    ดึงข้อมูลผู้ใช้ทั้งหมดที่มีสิทธิ์เข้าถึงทรัพยากรที่ระบุ - ต้องมีสิทธิ์อ่านใน setting_access
    
    รวมทั้งผู้ใช้ที่ได้รับสิทธิ์โดยตรงและผู้ใช้ที่ได้รับสิทธิ์ผ่านบทบาท
    """
    try:
        # ตรวจสอบว่า resource นี้มีอยู่หรือไม่
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return format_response("4040", {"error": f"Resource with ID {resource_id} not found"})
        
        # ดึงข้อมูลผู้ใช้ที่มีสิทธิ์เข้าถึง resource โดยตรง
        from models.user import User
        direct_user_ids = db.query(Permission.user_id).filter(
            Permission.resource_id == resource_id,
            Permission.user_id != None
        ).distinct().all()
        direct_user_ids = [user_id[0] for user_id in direct_user_ids]
        
        users_with_direct_access = []
        if direct_user_ids:
            direct_users = db.query(User).filter(User.id.in_(direct_user_ids)).all()
            for user in direct_users:
                # ดึงสิทธิ์ของผู้ใช้สำหรับ resource นี้
                permission = db.query(Permission).filter(
                    Permission.resource_id == resource_id,
                    Permission.user_id == user.id
                ).first()
                
                user_data = {
                    "id": str(user.id),
                    "full_name": f"{user.first_name} {user.last_name}",
                    "email": user.email,
                    "access_type": "direct",
                    "can_create": permission.can_create if permission else False,
                    "can_read": permission.can_read if permission else False,
                    "can_update": permission.can_update if permission else False,
                    "can_delete": permission.can_delete if permission else False,
                    "override_role": permission.override_role if permission else False
                }
                users_with_direct_access.append(user_data)
        
        # ดึงข้อมูลผู้ใช้ที่มีสิทธิ์เข้าถึง resource ผ่านบทบาท
        from models.user_role import UserRole
        
        # ดึง role_ids ที่มีสิทธิ์เข้าถึง resource นี้
        role_ids = db.query(Permission.role_id).filter(
            Permission.resource_id == resource_id,
            Permission.role_id != None
        ).distinct().all()
        role_ids = [role_id[0] for role_id in role_ids]
        
        users_with_role_access = []
        if role_ids:
            # ดึงข้อมูลผู้ใช้ที่มี role เหล่านี้
            from sqlalchemy.orm import joinedload
            user_roles = db.query(UserRole).filter(UserRole.role_id.in_(role_ids)).options(
                joinedload(UserRole.user),
                joinedload(UserRole.role)
            ).all()
            
            for user_role in user_roles:
                if user_role.user and user_role.role:
                    # ข้ามผู้ใช้ที่มีสิทธิ์โดยตรงอยู่แล้ว
                    if user_role.user_id in direct_user_ids:
                        continue
                        
                    # ดึงสิทธิ์ของ role สำหรับ resource นี้
                    permission = db.query(Permission).filter(
                        Permission.resource_id == resource_id,
                        Permission.role_id == user_role.role_id
                    ).first()
                    
                    user_data = {
                        "id": str(user_role.user.id),
                        "full_name": f"{user_role.user.first_name} {user_role.user.last_name}",
                        "email": user_role.user.email,
                        "access_type": "role",
                        "role_name": user_role.role.name,
                        "role_id": str(user_role.role.id),
                        "can_create": permission.can_create if permission else False,
                        "can_read": permission.can_read if permission else False,
                        "can_update": permission.can_update if permission else False,
                        "can_delete": permission.can_delete if permission else False
                    }
                    users_with_role_access.append(user_data)
        
        # สร้างข้อมูลผลลัพธ์
        result = {
            "resource": ResourceResponse.model_validate(resource).model_dump(),
            "users_with_direct_access": users_with_direct_access,
            "users_with_role_access": users_with_role_access,
            "total_users": len(users_with_direct_access) + len(users_with_role_access)
        }
        
        return format_response("0000", result)
    except Exception as e:
        print(f"Error fetching users with access to resource: {str(e)}")
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": "Error fetching users with access to resource"})
    
@router.put("/order", response_model=FormatResponseModel)
async def update_resources_order(
    resources: List[ResourceOrderUpdate],
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_access"))
):
    """อัปเดตลำดับการแสดงผลของทรัพยากร"""
    result = []
    
    for item in resources:
        resource = get_resource_by_id(db, resource_id=item.id)
        if not resource:
            continue
            
        update_data = {"order_index": item.order_index}
        updated_resource = update_resource(db, resource_id=item.id, resource_data=update_data)
        
        if updated_resource:
            result.append({"id": updated_resource.id, "order_index": updated_resource.order_index})
    
    return format_response("0002", result)