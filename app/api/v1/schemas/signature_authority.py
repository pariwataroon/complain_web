from typing import Optional, List, Union, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

# Pydantic models
class SignaturePositionBase(BaseModel):
    title: str
    description: Optional[str] = None
    department_id: UUID
    position_id: UUID
    order_index: Optional[int] = 0
    is_active: Optional[bool] = True

class SignaturePositionCreate(SignaturePositionBase):
    pass

class SignaturePositionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[UUID] = None
    position_id: Optional[UUID] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None

class SignaturePosition(SignaturePositionBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    department_name: Optional[str] = None
    position_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class SignatureAuthorityBase(BaseModel):
    user_id: UUID
    department_id: UUID
    is_active: Optional[bool] = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SignatureAuthorityCreate(BaseModel):
    user_id: UUID
    department_id: UUID
    is_active: bool = True
    start_date: datetime
    end_date: Optional[datetime] = None

class SignatureAuthorityUpdate(BaseModel):
    user_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SignatureAuthority(BaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    department_id: UUID
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SignaturePositionWithAuthorities(SignaturePosition):
    authorities: List[SignatureAuthority] = []