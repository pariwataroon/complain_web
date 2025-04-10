from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ResourceBase(BaseModel):
    name: str
    path: str
    description: Optional[str] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceResponse(ResourceBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PermissionBase(BaseModel):
    role_id: UUID
    resource_id: UUID
    can_create: bool = False
    can_read: bool = False
    can_update: bool = False
    can_delete: bool = False

class PermissionCreate(PermissionBase):
    pass

class PermissionResponse(PermissionBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserRoleCreate(BaseModel):
    user_id: UUID
    role_id: UUID