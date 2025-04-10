from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from models.user import User
from models.role import Role
from models.permission import Permission
from models.resource import Resource
from models.user_role import UserRole

def get_user_permissions(db: Session, user_id: UUID, resource_path: str) -> Optional[dict]:
    """
    ดึงข้อมูลสิทธิ์ของผู้ใช้สำหรับทรัพยากรที่ระบุ
    """
    # ดึงทรัพยากรจาก path
    resource = db.query(Resource).filter(Resource.path == resource_path, Resource.is_active == True).first()
    if not resource:
        return None
    
    # ดึงบทบาทของผู้ใช้
    user_roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()
    if not user_roles:
        return None
    
    role_ids = [ur.role_id for ur in user_roles]
    
    # ดึงสิทธิ์ของบทบาทต่อทรัพยากร
    permissions = db.query(Permission).filter(
        Permission.role_id.in_(role_ids),
        Permission.resource_id == resource.id
    ).all()
    
    if not permissions:
        return None
    
    # รวมสิทธิ์จากทุกบทบาท (หากมีสิทธิ์ใน role ใด ก็จะได้รับสิทธิ์นั้น)
    combined_permissions = {
        "can_create": False,
        "can_read": False,
        "can_update": False,
        "can_delete": False
    }
    
    for perm in permissions:
        combined_permissions["can_create"] |= perm.can_create
        combined_permissions["can_read"] |= perm.can_read
        combined_permissions["can_update"] |= perm.can_update
        combined_permissions["can_delete"] |= perm.can_delete
    
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
    
    return permissions.get(permission_map.get(action, ""), False)

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
    return db.query(Role).offset(skip).limit(limit).all()

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
        description=resource_data.description
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource

def get_resources(db: Session, skip: int = 0, limit: int = 100):
    """ดึงข้อมูลทรัพยากรทั้งหมด"""
    return db.query(Resource).offset(skip).limit(limit).all()

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

def create_permission(db: Session, permission_data):
    """สร้างสิทธิ์ใหม่"""
    permission = Permission(
        role_id=permission_data.role_id,
        resource_id=permission_data.resource_id,
        can_create=permission_data.can_create,
        can_read=permission_data.can_read,
        can_update=permission_data.can_update,
        can_delete=permission_data.can_delete
    )
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission

def get_permissions(db: Session, role_id: UUID = None, resource_id: UUID = None):
    """ดึงข้อมูลสิทธิ์ตามเงื่อนไข"""
    query = db.query(Permission)
    
    if role_id:
        query = query.filter(Permission.role_id == role_id)
    
    if resource_id:
        query = query.filter(Permission.resource_id == resource_id)
    
    return query.all()

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
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
    
    return roles