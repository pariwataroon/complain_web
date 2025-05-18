from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from .pagination import PaginatedResponse

# === ComplaintType Schemas ===

class ComplaintTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ComplaintTypeCreate(ComplaintTypeBase):
    pass

class ComplaintTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ComplaintTypeResponse(ComplaintTypeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ComplaintTypeList(PaginatedResponse[ComplaintTypeResponse]):
    pass

# === ComplaintSubType Schemas ===

class ComplaintSubTypeBase(BaseModel):
    parent_type_id: UUID
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ComplaintSubTypeCreate(ComplaintSubTypeBase):
    pass

class ComplaintSubTypeUpdate(BaseModel):
    parent_type_id: Optional[UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ComplaintSubTypeResponse(ComplaintSubTypeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ComplaintSubTypeWithParent(ComplaintSubTypeResponse):
    parent_type: ComplaintTypeResponse
    
    class Config:
        from_attributes = True

class ComplaintSubTypeList(PaginatedResponse[ComplaintSubTypeResponse]):
    pass

# === ComplaintChannel Schemas ===

class ComplaintChannelBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ComplaintChannelCreate(ComplaintChannelBase):
    pass

class ComplaintChannelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ComplaintChannelResponse(ComplaintChannelBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ComplaintChannelList(PaginatedResponse[ComplaintChannelResponse]):
    pass