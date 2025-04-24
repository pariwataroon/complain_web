from sqlalchemy.orm import Session
from typing import Optional, Dict, List
from uuid import UUID

from models.user import User
from models.resource import Resource
from models.permission import Permission
from models.role import Role
from models.user_role import UserRole
from lib.logger import get_logger

logger = get_logger("user_permission_controller")

def create_user_permission(db: Session, user_id: UUID, resource_id: UUID, permission_data: Dict) -> Optional[Dict]:
    """
    เพิ่มหรืออัปเดตสิทธิ์เฉพาะให้กับผู้ใช้รายบุคคล
    
    Args:
        db: Session ของฐานข้อมูล
        user_id: ID ของผู้ใช้
        resource_id: ID ของทรัพยากร
        permission_data: ข้อมูลสิทธิ์ที่ต้องการกำหนด
        
    Returns:
        Dict: ข้อมูลสิทธิ์ที่สร้างหรืออัปเดต หรือ None ถ้าไม่สำเร็จ
    """
    try:
        # ตรวจสอบว่ามีผู้ใช้และทรัพยากรตาม ID ที่ระบุหรือไม่
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"User with ID {user_id} not found")
            return None
            
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            logger.warning(f"Resource with ID {resource_id} not found")
            return None
        
        # ตรวจสอบว่ามีสิทธิ์นี้อยู่แล้วหรือไม่
        existing_permission = db.query(Permission).filter(
            Permission.resource_id == resource_id,
            Permission.user_id == user_id
        ).first()
        
        # ดึงข้อมูลบทบาทของผู้ใช้
        user_roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()
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
        
        if existing_permission:
            # อัปเดตสิทธิ์ที่มีอยู่
            existing_permission.can_create = permission_data.get("can_create", False)
            existing_permission.can_read = permission_data.get("can_read", False)
            existing_permission.can_update = permission_data.get("can_update", False)
            existing_permission.can_delete = permission_data.get("can_delete", False)
            existing_permission.override_role = permission_data.get("override_role", False)
            
            db.commit()
            db.refresh(existing_permission)
            
            result = {
                "id": str(existing_permission.id),
                "user_id": str(user_id),
                "resource_id": str(resource_id),
                "can_create": existing_permission.can_create,
                "can_read": existing_permission.can_read,
                "can_update": existing_permission.can_update,
                "can_delete": existing_permission.can_delete,
                "override_role": existing_permission.override_role,
                "message": "User permission updated successfully",
                "user_info": {
                    "full_name": f"{user.first_name} {user.last_name if user.last_name else ''}",
                    "email": user.email,
                    "roles": roles_info
                },
                "resource_info": {
                    "name": resource.name,
                    "path": resource.path,
                    "description": resource.description
                }
            }
            
            logger.info(f"Updated permission for user {user_id} on resource {resource_id}")
            return result
        else:
            # สร้างสิทธิ์ใหม่
            new_permission = Permission(
                user_id=user_id,
                resource_id=resource_id,
                can_create=permission_data.get("can_create", False),
                can_read=permission_data.get("can_read", False),
                can_update=permission_data.get("can_update", False),
                can_delete=permission_data.get("can_delete", False),
                override_role=permission_data.get("override_role", False)
            )
            
            db.add(new_permission)
            db.commit()
            db.refresh(new_permission)
            
            result = {
                "id": str(new_permission.id),
                "user_id": str(user_id),
                "resource_id": str(resource_id),
                "can_create": new_permission.can_create,
                "can_read": new_permission.can_read,
                "can_update": new_permission.can_update,
                "can_delete": new_permission.can_delete,
                "override_role": new_permission.override_role,
                "message": "User permission created successfully",
                "user_info": {
                    "full_name": f"{user.first_name} {user.last_name if user.last_name else ''}",
                    "email": user.email,
                    "roles": roles_info
                },
                "resource_info": {
                    "name": resource.name,
                    "path": resource.path,
                    "description": resource.description
                }
            }
            
            logger.info(f"Created new permission for user {user_id} on resource {resource_id}")
            return result
    except Exception as e:
        logger.error(f"Error creating/updating user permission: {str(e)}")
        db.rollback()
        return None


def get_user_permissions_by_user(db: Session, user_id: UUID) -> Optional[Dict]:
    """
    ดึงข้อมูลสิทธิ์เฉพาะทั้งหมดของผู้ใช้รายบุคคล
    
    Args:
        db: Session ของฐานข้อมูล
        user_id: ID ของผู้ใช้
        
    Returns:
        Dict: ข้อมูลผู้ใช้พร้อมสิทธิ์ทั้งหมด หรือ None ถ้าไม่พบผู้ใช้
    """
    try:
        # ตรวจสอบว่ามีผู้ใช้ตาม ID ที่ระบุหรือไม่
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"User with ID {user_id} not found")
            return None
        
        # ดึงข้อมูลสิทธิ์ทั้งหมดของผู้ใช้
        user_permissions = db.query(Permission).filter(
            Permission.user_id == user_id
        ).all()
        
        # ดึงข้อมูลบทบาทของผู้ใช้
        user_roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()
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
        
        permissions_result = []
        for permission in user_permissions:
            resource = db.query(Resource).filter(Resource.id == permission.resource_id).first()
            if resource:
                permission_data = {
                    "id": str(permission.id),
                    "user_id": str(user_id),
                    "resource_id": str(permission.resource_id),
                    "can_create": permission.can_create,
                    "can_read": permission.can_read,
                    "can_update": permission.can_update,
                    "can_delete": permission.can_delete,
                    "override_role": permission.override_role,
                    "resource_info": {
                        "name": resource.name,
                        "path": resource.path,
                        "description": resource.description
                    }
                }
                permissions_result.append(permission_data)
        
        user_info = {
            "user_id": str(user.id),
            "full_name": f"{user.first_name} {user.last_name if user.last_name else ''}",
            "email": user.email,
            "roles": roles_info,
            "permissions": permissions_result,
            "total_permissions": len(permissions_result)
        }
        
        logger.info(f"Retrieved {len(permissions_result)} permissions for user {user_id}")
        return user_info
    except Exception as e:
        logger.error(f"Error getting user permissions: {str(e)}")
        return None


def delete_user_permission(db: Session, permission_id: UUID) -> Optional[Dict]:
    """
    ลบสิทธิ์เฉพาะของผู้ใช้รายบุคคล
    
    Args:
        db: Session ของฐานข้อมูล
        permission_id: ID ของสิทธิ์ที่ต้องการลบ
        
    Returns:
        Dict: ข้อมูลสิทธิ์ที่ถูกลบ หรือ None ถ้าไม่สำเร็จ
    """
    try:
        permission = db.query(Permission).filter(Permission.id == permission_id).first()
        
        if not permission:
            logger.warning(f"Permission with ID {permission_id} not found")
            return None
        
        # ตรวจสอบว่าเป็นสิทธิ์ของผู้ใช้จริงหรือไม่
        if not permission.user_id:
            logger.warning(f"Permission with ID {permission_id} is not a user permission")
            return None
        
        # เก็บข้อมูลก่อนลบเพื่อส่งกลับ
        user_id = permission.user_id
        resource_id = permission.resource_id
        
        # ลบสิทธิ์
        db.delete(permission)
        db.commit()
        
        result = {
            "id": str(permission_id),
            "user_id": str(user_id),
            "resource_id": str(resource_id),
            "message": "User permission deleted successfully"
        }
        
        logger.info(f"Deleted permission ID {permission_id} for user {user_id}")
        return result
    except Exception as e:
        logger.error(f"Error deleting user permission: {str(e)}")
        db.rollback()
        return None


def get_resource_user_permissions(db: Session, resource_id: UUID) -> Optional[Dict]:
    """
    ดึงข้อมูลสิทธิ์เฉพาะของผู้ใช้ทั้งหมดสำหรับทรัพยากรที่ระบุ
    
    Args:
        db: Session ของฐานข้อมูล
        resource_id: ID ของทรัพยากร
        
    Returns:
        Dict: ข้อมูลทรัพยากรพร้อมสิทธิ์ของผู้ใช้ทั้งหมด หรือ None ถ้าไม่พบทรัพยากร
    """
    try:
        # ตรวจสอบว่ามีทรัพยากรตาม ID ที่ระบุหรือไม่
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            logger.warning(f"Resource with ID {resource_id} not found")
            return None
        
        # ดึงข้อมูลสิทธิ์เฉพาะของผู้ใช้ทั้งหมดสำหรับทรัพยากรนี้
        permissions = db.query(Permission).filter(
            Permission.resource_id == resource_id,
            Permission.user_id.isnot(None)  # เฉพาะสิทธิ์ของผู้ใช้เท่านั้น
        ).all()
        
        user_permissions = []
        for permission in permissions:
            user = db.query(User).filter(User.id == permission.user_id).first()
            if user:
                # ดึงข้อมูลบทบาทของผู้ใช้
                user_roles = db.query(UserRole).filter(UserRole.user_id == user.id).all()
                role_ids = [ur.role_id for ur in user_roles]
                roles = db.query(Role).filter(Role.id.in_(role_ids)).all() if role_ids else []
                
                # สร้างข้อมูลรายละเอียดบทบาท
                roles_info = []
                for role in roles:
                    roles_info.append({
                        "role_id": str(role.id),
                        "role_name": role.name,
                        "role_description": role.description
                    })
                
                user_permission = {
                    "permission_id": str(permission.id),
                    "user_id": str(permission.user_id),
                    "can_create": permission.can_create,
                    "can_read": permission.can_read,
                    "can_update": permission.can_update,
                    "can_delete": permission.can_delete,
                    "override_role": permission.override_role,
                    "user_info": {
                        "full_name": f"{user.first_name} {user.last_name if user.last_name else ''}",
                        "email": user.email,
                        "roles": roles_info
                    }
                }
                user_permissions.append(user_permission)
        
        result = {
            "resource_id": str(resource_id),
            "resource_name": resource.name,
            "resource_path": resource.path,
            "resource_description": resource.description,
            "user_permissions": user_permissions,
            "total_user_permissions": len(user_permissions)
        }
        
        logger.info(f"Retrieved {len(user_permissions)} user permissions for resource {resource_id}")
        return result
    except Exception as e:
        logger.error(f"Error getting resource user permissions: {str(e)}")
        return None