import uuid
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID

from models.user import User
from models.role import Role
from models.permission import Permission
from models.resource import Resource
from models.user_role import UserRole
from lib.logger import get_logger

from app.api.v1.schemas.permission import (ResourceResponse, PermissionCreate)

logger = get_logger("permission_controller")

def get_user_permissions(db: Session, user_id: UUID, resource_path: str) -> Optional[dict]:
    """
    ดึงข้อมูลสิทธิ์ของผู้ใช้สำหรับทรัพยากรที่ระบุ โดยพิจารณาทั้งสิทธิ์จากบทบาทและสิทธิ์เฉพาะบุคคล
    """
    # ดึงทรัพยากรจาก path
    resource = db.query(Resource).filter(Resource.path == resource_path, Resource.is_active == True).first()
    if not resource:
        logger.info(f"Resource with path '{resource_path}' not found")
        return None
    
    # เตรียมสิทธิ์เริ่มต้น
    combined_permissions = {
        "can_create": False,
        "can_read": False,
        "can_update": False,
        "can_delete": False
    }
    
    # ดึงสิทธิ์เฉพาะบุคคล (user-based permission)
    user_permissions = db.query(Permission).filter(
        Permission.user_id == user_id,
        Permission.resource_id == resource.id
    ).all()
    
    # ถ้ามีสิทธิ์เฉพาะบุคคลที่ override บทบาท ให้ใช้สิทธิ์นั้นเลย
    override_permissions = [p for p in user_permissions if p.override_role]
    if override_permissions:
        for perm in override_permissions:
            combined_permissions["can_create"] |= perm.can_create
            combined_permissions["can_read"] |= perm.can_read
            combined_permissions["can_update"] |= perm.can_update
            combined_permissions["can_delete"] |= perm.can_delete
        
        logger.info(f"Using override user permissions for user {user_id} on resource {resource_path}")
        return combined_permissions
    
    # ถ้าไม่มีสิทธิ์ override บทบาท ให้ใช้ทั้งสิทธิ์จากบทบาทและสิทธิ์เฉพาะบุคคลรวมกัน
    
    # ดึงบทบาทของผู้ใช้
    user_roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()
    
    # ถ้าไม่มีบทบาทและไม่มีสิทธิ์เฉพาะบุคคล
    if not user_roles and not user_permissions:
        logger.info(f"User {user_id} has no roles and no specific permissions for {resource_path}")
        return None
    
    # ดึงสิทธิ์จากบทบาท
    if user_roles:
        role_ids = [ur.role_id for ur in user_roles]
        
        role_permissions = db.query(Permission).filter(
            Permission.role_id.in_(role_ids),
            Permission.resource_id == resource.id
        ).all()
        
        # รวมสิทธิ์จากบทบาท
        for perm in role_permissions:
            combined_permissions["can_create"] |= perm.can_create
            combined_permissions["can_read"] |= perm.can_read
            combined_permissions["can_update"] |= perm.can_update
            combined_permissions["can_delete"] |= perm.can_delete
    
    # เพิ่มสิทธิ์เฉพาะบุคคล (ที่ไม่ override)
    for perm in user_permissions:
        combined_permissions["can_create"] |= perm.can_create
        combined_permissions["can_read"] |= perm.can_read
        combined_permissions["can_update"] |= perm.can_update
        combined_permissions["can_delete"] |= perm.can_delete
    
    logger.info(f"Combined permissions for user {user_id} on resource {resource_path}: {combined_permissions}")
    return combined_permissions

def check_permission(db: Session, user_id: UUID, resource_path: str, action: str) -> bool:
    """
    ตรวจสอบว่าผู้ใช้มีสิทธิ์ในการทำงานที่ระบุหรือไม่
    
    Args:
        db: Session ฐานข้อมูล
        user_id: ID ของผู้ใช้
        resource_path: เส้นทางของทรัพยากร เช่น "/api/v1/users"
        action: การกระทำ ("create", "read", "update", "delete")
        
    Returns:
        bool: True หากมีสิทธิ์, False หากไม่มีสิทธิ์
    """
    permissions = get_user_permissions(db, user_id, resource_path)
    if not permissions:
        return False
    
    permission_map = {
        "create": "can_create",
        "read": "can_read",
        "update": "can_update",
        "delete": "can_delete"
    }
    
    has_permission = permissions.get(permission_map.get(action, ""), False)
    logger.info(f"Permission check for user {user_id} on {resource_path}, action {action}: {has_permission}")
    
    return has_permission

def create_role(db: Session, role_data):
    """สร้างบทบาทใหม่"""
    role = Role(
        name=role_data.name,
        description=role_data.description
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

def get_roles(db: Session, skip: int = 0, limit: int = 100):
    """ดึงข้อมูลบทบาททั้งหมด"""
    return db.query(Role).order_by(Role.order_index).offset(skip).limit(limit).all()

def update_role(db: Session, role_id: UUID, role_data):
    """อัปเดตข้อมูลบทบาท"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        return None
        
    for key, value in role_data.dict(exclude_unset=True).items():
        setattr(role, key, value)
    
    db.commit()
    db.refresh(role)
    return role

def delete_role(db: Session, role_id: UUID):
    """ลบบทบาท"""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        return False
        
    db.delete(role)
    db.commit()
    return True

def create_resource(db: Session, resource_data):
    """สร้างทรัพยากรใหม่"""
    resource = Resource(
        name=resource_data.name,
        path=resource_data.path,
        description=resource_data.description,
        group_id=resource_data.group_id,
        order_index=resource_data.order_index,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource

def get_resources(db: Session, skip: int = 0, limit: int = 100):
    """Get all resources"""
    return db.query(Resource).filter(
        Resource.is_active == True
    ).order_by(Resource.order_index).offset(skip).limit(limit).all()

def get_resources_by_group(db: Session, group_id: Optional[UUID] = None, skip: int = 0, limit: int = 100):
    """Get resources grouped by resource_group"""
    from models.resource_groups import ResourceGroup
    from app.api.v1.schemas.permission import ResourceResponse
    
    # Get all active resource groups ordered by order_index
    groups_query = db.query(ResourceGroup).filter(
        ResourceGroup.is_active == True
    )
    
    # Filter by group_id if provided
    if group_id:
        groups_query = groups_query.filter(ResourceGroup.id == group_id)
    
    groups = groups_query.order_by(ResourceGroup.order_index).all()
    
    result = []
    for group in groups:
        # Get resources for this group, ordered by order_index
        resources = db.query(Resource).filter(
            Resource.group_id == group.id,
            Resource.is_active == True
        ).order_by(Resource.order_index).all()
        
        if resources:
            # แปลง SQLAlchemy objects เป็น Pydantic models และแปลงเป็น dictionaries
            resource_dicts = [ResourceResponse.model_validate(resource).model_dump() for resource in resources]
            
            group_data = {
                "group_id": str(group.id),  # แปลง UUID เป็น string
                "group_name": group.name,
                "display_name": group.display_name,
                "order_index": group.order_index,
                "resources": resource_dicts,
                "total_resources": len(resource_dicts)
            }
            result.append(group_data)
    
    return result

def get_resources_by_group_name(db: Session, group_name: str, skip: int = 0, limit: int = 100):
    """Get resources by group name"""
    from models.resource_groups import ResourceGroup
    from app.api.v1.schemas.permission import ResourceResponse
    
    # Find the group by name
    group = db.query(ResourceGroup).filter(
        ResourceGroup.name == group_name,
        ResourceGroup.is_active == True
    ).first()
    
    if not group:
        return {
            "group_id": None,
            "group_name": None,
            "display_name": None,
            "resources": [],
            "total_resources": 0
        }
    
    # Get resources for this group, ordered by order_index
    resources = db.query(Resource).filter(
        Resource.group_id == group.id,
        Resource.is_active == True
    ).order_by(Resource.order_index).offset(skip).limit(limit).all()
    
    # แปลง SQLAlchemy objects เป็น Pydantic models และแปลงเป็น dictionaries
    resource_dicts = [ResourceResponse.model_validate(resource).model_dump() for resource in resources]
    
    result = {
        "group_id": str(group.id),
        "group_name": group.name,
        "display_name": group.display_name,
        "order_index": group.order_index,
        "resources": resource_dicts,
        "total_resources": len(resource_dicts)
    }
    
    return result

def update_resource(db: Session, resource_id: UUID, resource_data):
    """อัปเดตข้อมูลทรัพยากร"""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        return None
        
    for key, value in resource_data.dict(exclude_unset=True).items():
        setattr(resource, key, value)
    
    db.commit()
    db.refresh(resource)
    return resource

def delete_resource(db: Session, resource_id: UUID):
    """ลบทรัพยากร"""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        return False
        
    db.delete(resource)
    db.commit()
    return True

def create_permission(db: Session, permission: PermissionCreate):
    try:
        # เพิ่มการตรวจสอบว่า role_id มีอยู่จริงในฐานข้อมูลหรือไม่
        if permission.role_id:
            role = db.query(Role).filter(Role.id == permission.role_id).first()
            if not role:
                raise ValueError(f"Role with ID {permission.role_id} not found")
            
            # ตรวจสอบว่ามี permission สำหรับ role และ resource นี้อยู่แล้วหรือไม่
            existing_permission = db.query(Permission).filter(
                Permission.role_id == permission.role_id,
                Permission.resource_id == permission.resource_id
            ).first()
            
            if existing_permission:
                raise ValueError(f"Permission for role {permission.role_id} and resource {permission.resource_id} already exists")
                
        # เพิ่มการตรวจสอบว่า user_id มีอยู่จริงในฐานข้อมูลหรือไม่
        if permission.user_id:
            from models.user import User
            user = db.query(User).filter(User.id == permission.user_id).first()
            if not user:
                raise ValueError(f"User with ID {permission.user_id} not found")
            
            # ตรวจสอบว่ามี permission สำหรับ user และ resource นี้อยู่แล้วหรือไม่
            existing_permission = db.query(Permission).filter(
                Permission.user_id == permission.user_id,
                Permission.resource_id == permission.resource_id
            ).first()
            
            if existing_permission:
                raise ValueError(f"Permission for user {permission.user_id} and resource {permission.resource_id} already exists")
                
        # เพิ่มการตรวจสอบว่า resource_id มีอยู่จริงในฐานข้อมูลหรือไม่
        resource = db.query(Resource).filter(Resource.id == permission.resource_id).first()
        if not resource:
            raise ValueError(f"Resource with ID {permission.resource_id} not found")
            
        # สร้าง permission ใหม่
        new_permission = Permission(
            id=uuid.uuid4(),
            role_id=permission.role_id,
            user_id=permission.user_id,
            resource_id=permission.resource_id,
            can_create=permission.can_create,
            can_read=permission.can_read,
            can_update=permission.can_update,
            can_delete=permission.can_delete,
            override_role=permission.override_role
        )
        
        db.add(new_permission)
        db.commit()
        db.refresh(new_permission)
        
        return new_permission
    except Exception as e:
        db.rollback()
        raise

def get_permissions(db: Session, role_id: UUID = None, resource_id: UUID = None, user_id: UUID = None):
    """ดึงข้อมูลสิทธิ์ตามเงื่อนไข"""
    query = db.query(Permission)
    
    if role_id:
        query = query.filter(Permission.role_id == role_id)
    
    if resource_id:
        query = query.filter(Permission.resource_id == resource_id)
    
    if user_id:
        query = query.filter(Permission.user_id == user_id)
    
    return query.order_by(Permission.id).all()

def update_permission(db: Session, permission_id: UUID, permission_data):
    """อัปเดตข้อมูลสิทธิ์"""
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        return None
        
    for key, value in permission_data.dict(exclude_unset=True).items():
        setattr(permission, key, value)
    
    db.commit()
    db.refresh(permission)
    return permission

def delete_permission(db: Session, permission_id: UUID):
    """ลบสิทธิ์"""
    permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not permission:
        return False
        
    db.delete(permission)
    db.commit()
    return True

def assign_role_to_user(db: Session, user_id: UUID, role_id: UUID):
    """กำหนดบทบาทให้กับผู้ใช้"""
    # ตรวจสอบว่ามีบทบาทนี้อยู่แล้วหรือไม่
    existing = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role_id
    ).first()
    
    if existing:
        return existing
    
    user_role = UserRole(user_id=user_id, role_id=role_id)
    db.add(user_role)
    db.commit()
    db.refresh(user_role)
    return user_role

def remove_role_from_user(db: Session, user_id: UUID, role_id: UUID):
    """ลบบทบาทออกจากผู้ใช้"""
    user_role = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role_id
    ).first()
    
    if not user_role:
        return False
    
    db.delete(user_role)
    db.commit()
    return True

def get_user_roles(db: Session, user_id: UUID):
    """ดึงข้อมูลบทบาทของผู้ใช้"""
    user_roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()
    
    if not user_roles:
        return []
    
    role_ids = [ur.role_id for ur in user_roles]
    roles = db.query(Role).filter(Role.id.in_(role_ids)).order_by(Role.order_index).all()
    
    return roles

def check_permission_by_name(db: Session, user_id: UUID, resource_name: str, action: str) -> bool:
    """
    ตรวจสอบว่าผู้ใช้มีสิทธิ์ในการทำการกระทำที่ระบุกับทรัพยากรที่มีชื่อที่ระบุหรือไม่
    
    Args:
        db: Session ฐานข้อมูล
        user_id: ID ของผู้ใช้ที่ต้องการตรวจสอบสิทธิ์
        resource_name: ชื่อของทรัพยากรที่ต้องการตรวจสอบสิทธิ์
        action: การกระทำที่ต้องการตรวจสอบ ("create", "read", "update", "delete")
        
    Returns:
        bool: True ถ้ามีสิทธิ์, False ถ้าไม่มี
    """
    # 1. ค้นหา resource จากชื่อ
    resource = db.query(Resource).filter(Resource.name == resource_name, Resource.is_active == True).first()
    
    if not resource:
        # ถ้าไม่พบทรัพยากรที่ระบุ ให้ถือว่าไม่มีสิทธิ์
        return False
    
    # 2. ใช้ฟังก์ชันที่มีอยู่แล้วเพื่อตรวจสอบสิทธิ์ตาม resource path
    return check_permission(db, user_id, resource.path, action)

# เพิ่มฟังก์ชันใหม่

def get_all_user_permissions(db: Session, user_id: UUID):
    """
    รวบรวมสิทธิ์การเข้าถึงทั้งหมดของผู้ใช้
    ทั้งจากบทบาทที่ได้รับและสิทธิ์เฉพาะบุคคล
    
    คืนค่าผลลัพธ์โดยใช้ resource_name เป็นคีย์
    """
    # ดึงบทบาททั้งหมดของผู้ใช้
    user_roles = get_user_roles(db, user_id)
    role_ids = [role.id for role in user_roles]
    
    # ดึงทรัพยากรทั้งหมดที่มีในระบบ
    resources = db.query(Resource).all()
    
    results = {}
    
    for resource in resources:
        # ดึงสิทธิ์จากบทบาท
        role_permissions = []
        if role_ids:
            role_perms = db.query(Permission).filter(
                Permission.resource_id == resource.id,
                Permission.role_id.in_(role_ids)
            ).all()
            for perm in role_perms:
                role = db.query(Role).filter(Role.id == perm.role_id).first()
                if role:
                    role_permissions.append({
                        "role_id": str(role.id),
                        "role_name": role.name,
                        "can_create": perm.can_create,
                        "can_read": perm.can_read,
                        "can_update": perm.can_update,
                        "can_delete": perm.can_delete
                    })
        
        # ดึงสิทธิ์เฉพาะของผู้ใช้
        user_permission = db.query(Permission).filter(
            Permission.resource_id == resource.id,
            Permission.user_id == user_id
        ).first()
        
        # รวมสิทธิ์ทั้งหมด โดยพิจารณาการ override ถ้ามี
        final_permission = {
            "resource_id": str(resource.id),
            "resource_name": resource.name,
            "resource_path": resource.path,
            "can_create": False,
            "can_read": False,
            "can_update": False,
            "can_delete": False,
            "from_roles": [],
            "has_direct_permission": False
        }
        
        # เพิ่มสิทธิ์จากบทบาท
        for role_perm in role_permissions:
            if role_perm["can_create"]:
                final_permission["can_create"] = True
            if role_perm["can_read"]:
                final_permission["can_read"] = True
            if role_perm["can_update"]:
                final_permission["can_update"] = True
            if role_perm["can_delete"]:
                final_permission["can_delete"] = True
            
            final_permission["from_roles"].append(role_perm["role_name"])
        
        # เพิ่มหรือ override สิทธิ์จากสิทธิ์เฉพาะของผู้ใช้
        if user_permission:
            final_permission["has_direct_permission"] = True
            
            if user_permission.override_role:
                # ถ้ามีการ override ก็ใช้สิทธิ์เฉพาะของผู้ใช้แทน
                final_permission["can_create"] = user_permission.can_create
                final_permission["can_read"] = user_permission.can_read
                final_permission["can_update"] = user_permission.can_update
                final_permission["can_delete"] = user_permission.can_delete
            else:
                # ถ้าไม่มีการ override ก็เพิ่มสิทธิ์เฉพาะของผู้ใช้เข้าไป
                if user_permission.can_create:
                    final_permission["can_create"] = True
                if user_permission.can_read:
                    final_permission["can_read"] = True
                if user_permission.can_update:
                    final_permission["can_update"] = True
                if user_permission.can_delete:
                    final_permission["can_delete"] = True
        
        # เพิ่มข้อมูลสิทธิ์ลงในผลลัพธ์ โดยใช้ resource_name เป็น key
        results[resource.name] = final_permission
    
    return results

def get_resource_by_id(db: Session, resource_id: UUID):
    """ดึงข้อมูลทรัพยากรตาม ID"""
    return db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.is_active == True
    ).first()

def update_resource_order_batch(db: Session, order_data: List[Dict[str, any]]) -> List[Resource]:
    """Update order_index for multiple resources in batch"""
    results = []
    
    for item in order_data:
        resource_id = item.get("id")
        order_index = item.get("order_index")
        
        if not resource_id or order_index is None:
            continue
            
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            continue
            
        resource.order_index = order_index
        results.append(resource)
    
    db.commit()
    return results

def get_all_resources_with_permissions_by_roles(db: Session, skip: int = 0, limit: int = 100):
    """
    ดึงข้อมูลทรัพยากรทั้งหมดพร้อมสิทธิ์ของแต่ละบทบาท
    และจัดกลุ่มตาม resource_group
    
    Returns:
        - ข้อมูลทรัพยากรพร้อมรายละเอียดสิทธิ์ของแต่ละบทบาท (role)
        - ข้อมูลการติดตาม (tracking) ว่ามีบทบาทใดไม่ถูกกำหนดสิทธิ์
        - จัดกลุ่มตาม resource_group
    """
    # ดึงข้อมูล resource_groups ทั้งหมด
    from models.resource_groups import ResourceGroup
    resource_groups = db.query(ResourceGroup).filter(
        ResourceGroup.is_active == True
    ).order_by(ResourceGroup.order_index).all()
    
    # ดึงข้อมูล roles ทั้งหมด
    roles = db.query(Role).order_by(Role.order_index).all()
    
    result = []
    
    # สร้าง list เพื่อเก็บผลลัพธ์แยกตาม resource_group
    for group in resource_groups:
        # ดึงข้อมูล resources ทั้งหมดในกลุ่มนี้
        resources = db.query(Resource).filter(
            Resource.group_id == group.id,
            Resource.is_active == True
        ).order_by(Resource.order_index).offset(skip).limit(limit).all()
        
        if not resources:
            continue
            
        resources_data = []
        
        for resource in resources:
            resource_data = ResourceResponse.model_validate(resource).model_dump()
            
            # ตรวจสอบสิทธิ์สำหรับแต่ละบทบาท
            roles_tracking = {}
            
            # เริ่มด้วยการตั้งค่าเริ่มต้นให้ tracking ของทุกบทบาทเป็น False
            for role in roles:
                roles_tracking[role.name] = {
                    "role_id": str(role.id),
                    "role_name": role.name,
                    "permission_id": "",
                    "role_description": role.description, 
                    "found": False,
                    "can_create": False,
                    "can_read": False,
                    "can_update": False,
                    "can_delete": False
                }
            
            # ดึงข้อมูลสิทธิ์ทั้งหมดของ resource นี้
            permissions = db.query(Permission).filter(Permission.resource_id == resource.id).all()
            
            role_permission_count = 0
            for permission in permissions:
                if permission.role_id:
                    # กรณีเป็น role-based permission
                    role = db.query(Role).filter(Role.id == permission.role_id).first()
                    if role:
                        # ปรับปรุง tracking ให้เป็น True
                        if role.name in roles_tracking:
                            roles_tracking[role.name]["permission_id"] = str(permission.id)
                            roles_tracking[role.name]["found"] = True
                            roles_tracking[role.name]["can_create"] = permission.can_create
                            roles_tracking[role.name]["can_read"] = permission.can_read
                            roles_tracking[role.name]["can_update"] = permission.can_update
                            roles_tracking[role.name]["can_delete"] = permission.can_delete
                            role_permission_count += 1
            
            # ดึงข้อมูลสิทธิ์เฉพาะบุคคล
            user_permissions = []
            for permission in permissions:
                if permission.user_id:
                    # กรณีเป็น user-based permission
                    from models.user import User
                    from models.user_role import UserRole
                    
                    user = db.query(User).filter(User.id == permission.user_id).first()
                    if user:
                        # ดึงข้อมูลบทบาทของผู้ใช้
                        user_roles = db.query(UserRole).filter(UserRole.user_id == user.id).all()
                        role_ids = [ur.role_id for ur in user_roles]
                        user_roles_data = db.query(Role).filter(Role.id.in_(role_ids)).all() if role_ids else []
                        
                        # สร้างข้อมูลรายละเอียดบทบาท
                        roles_info = []
                        for role in user_roles_data:
                            roles_info.append({
                                "role_id": str(role.id),
                                "role_name": role.name,
                                "role_description": role.description
                            })

                        user_info = {
                            "user_id": str(user.id),
                            "full_name": f"{user.first_name} {user.last_name if user.last_name else ''}",
                            "email": user.email,
                            "roles": roles_info,  # เพิ่มข้อมูลบทบาทของผู้ใช้
                            "permission_id": str(permission.id),  # เพิ่ม id ของสิทธิ์เพื่อให้สามารถอ้างอิงได้
                            "can_create": permission.can_create,
                            "can_read": permission.can_read,
                            "can_update": permission.can_update,
                            "can_delete": permission.can_delete,
                            "override_role": permission.override_role
                        }
                        user_permissions.append(user_info)
            
            # แปลง roles_tracking จาก dict เป็น list
            roles_tracking_list = list(roles_tracking.values())
            
            # เพิ่มข้อมูลสิทธิ์เข้าไปใน resource data
            resource_data["user_permissions"] = user_permissions
            resource_data["roles_tracking"] = roles_tracking_list
            resource_data["total_roles_with_permissions"] = role_permission_count  
            resource_data["total_roles_missing"] = len([r for r in roles_tracking_list if not r["found"]])
            resource_data["total_users"] = len(user_permissions)
            
            # เพิ่ม resource นี้เข้าไปในรายการ resources ของกลุ่ม
            resources_data.append(resource_data)
        
        # สร้าง group data พร้อมรายการ resources
        group_data = {
            "group_id": str(group.id),
            "group_name": group.name,
            "display_name": group.display_name,
            "order_index": group.order_index,
            "resources": resources_data,
            "total_resources": len(resources_data)
        }
        
        # เพิ่ม group นี้เข้าไปในผลลัพธ์
        result.append(group_data)
    
    return result