from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# =================== Role Schemas ===================
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class RoleResponse(RoleBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# =================== Resource Schemas ===================
class ResourceBase(BaseModel):
    name: str
    path: str
    description: Optional[str] = None
    group_id: Optional[UUID] = None
    order_index: int = 0

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    group_id: Optional[UUID] = None
    order_index: Optional[int] = None

class ResourceResponse(ResourceBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# =================== Permission Schemas ===================
class PermissionBase(BaseModel):
    resource_id: UUID
    can_create: bool = False
    can_read: bool = False
    can_update: bool = False
    can_delete: bool = False
    override_role: bool = False

class PermissionCreate(BaseModel):
    role_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    resource_id: UUID
    can_create: bool = False
    can_read: bool = False
    can_update: bool = False
    can_delete: bool = False
    override_role: bool = False

class PermissionUpdate(BaseModel):
    can_create: Optional[bool] = None
    can_read: Optional[bool] = None
    can_update: Optional[bool] = None
    can_delete: Optional[bool] = None
    override_role: Optional[bool] = None

class PermissionResponse(BaseModel):
    id: UUID
    role_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    resource_id: UUID
    can_create: bool
    can_read: bool
    can_update: bool
    can_delete: bool
    override_role: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# =================== User-Role Assignment Schema ===================
class UserRoleCreate(BaseModel):
    user_id: UUID
    role_id: UUID

# =================== User-Role Assignment Order Index Update Schema ===================
class ResourceOrderUpdate(BaseModel):
    id: UUID
    order_index: int