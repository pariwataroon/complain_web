from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from app.api.v1.controllers.complaint_metadata_controller import (
    get_complaint_types, create_complaint_type, get_complaint_type, update_complaint_type, delete_complaint_type,
    get_complaint_subtypes, create_complaint_subtype, get_complaint_subtype, update_complaint_subtype, delete_complaint_subtype,
    get_complaint_channels, create_complaint_channel, get_complaint_channel, update_complaint_channel, delete_complaint_channel,
    get_complaint_types_for_form, search_complaint_types_by_name, validate_complaint_type_name, get_popular_complaint_types,
    get_complaint_subtypes_for_form, get_complaint_channels_for_form
)
from app.api.v1.schemas.complaint_metadata import (
    ComplaintTypeCreate, ComplaintTypeUpdate, ComplaintTypeResponse, ComplaintTypeList,
    ComplaintSubTypeCreate, ComplaintSubTypeUpdate, ComplaintSubTypeResponse, ComplaintSubTypeList,
    ComplaintChannelCreate, ComplaintChannelUpdate, ComplaintChannelResponse, ComplaintChannelList
)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/complaint-metadata",
    tags=["complaint_metadata"],
)

# === ComplaintType Routes ===

@router.get("/types", response_model=FormatResponseModel)
async def read_complaint_types(
    skip: int = 0, 
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการประเภทเรื่องร้องเรียนหลัก"""
    complaint_types = get_complaint_types(db, skip=skip, limit=limit, active_only=active_only)
    result = [ComplaintTypeResponse.from_orm(type_item).dict() for type_item in complaint_types]
    return format_response("0000", result)

@router.post("/types", response_model=FormatResponseModel)
async def create_type(
    type_data: ComplaintTypeCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("complaint_metadata"))  # ✅ แก้ไข permission
):
    """สร้างประเภทเรื่องร้องเรียนหลักใหม่"""
    new_type = create_complaint_type(db, type_data.dict())
    return format_response("0001", ComplaintTypeResponse.from_orm(new_type).dict())

@router.get("/types/{type_id}", response_model=FormatResponseModel)
async def read_complaint_type(
    type_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลประเภทเรื่องร้องเรียนหลัก"""
    complaint_type = get_complaint_type(db, type_id)
    if complaint_type is None:
        raise HTTPException(status_code=404, detail="Complaint type not found")
    return format_response("0000", ComplaintTypeResponse.from_orm(complaint_type).dict())

@router.put("/types/{type_id}", response_model=FormatResponseModel)
async def update_type(
    type_id: UUID,
    type_data: ComplaintTypeUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaint_metadata"))  # ✅ แก้ไข permission
):
    """อัพเดทข้อมูลประเภทเรื่องร้องเรียนหลัก"""
    updated_type = update_complaint_type(db, type_id, type_data.dict(exclude_unset=True))
    if updated_type is None:
        raise HTTPException(status_code=404, detail="Complaint type not found")
    return format_response("0002", ComplaintTypeResponse.from_orm(updated_type).dict())

@router.delete("/types/{type_id}", response_model=FormatResponseModel)
async def delete_type(
    type_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("complaint_metadata"))  # ✅ แก้ไข permission
):
    """ลบประเภทเรื่องร้องเรียนหลัก"""
    success = delete_complaint_type(db, type_id)
    if not success:
        raise HTTPException(status_code=404, detail="Complaint type not found")
    return format_response("0003", {"id": str(type_id)})

# === ComplaintSubType Routes ===

@router.get("/subtypes", response_model=FormatResponseModel)
async def read_complaint_subtypes(  # ✅ แก้ไขชื่อ function
    skip: int = 0, 
    limit: int = 100,
    parent_type_id: Optional[UUID] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการประเภทเรื่องร้องเรียนย่อย"""
    result = get_complaint_subtypes(db, skip=skip, limit=limit, parent_type_id=parent_type_id, active_only=active_only)  # ✅ แก้ไข function call
    return format_response("0000", result)

@router.post("/subtypes", response_model=FormatResponseModel)
async def create_subtype(
    subtype_data: ComplaintSubTypeCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("complaint_metadata"))  # ✅ แก้ไข permission
):
    """สร้างประเภทเรื่องร้องเรียนย่อยใหม่"""
    parent_type = get_complaint_type(db, subtype_data.parent_type_id)
    if parent_type is None:
        raise HTTPException(status_code=404, detail="Parent complaint type not found")
    
    new_subtype = create_complaint_subtype(db, subtype_data.dict())
    return format_response("0001", ComplaintSubTypeResponse.from_orm(new_subtype).dict())

@router.get("/subtypes/{subtype_id}", response_model=FormatResponseModel)
async def read_complaint_subtype(
    subtype_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลประเภทเรื่องร้องเรียนย่อย"""
    complaint_subtype = get_complaint_subtype(db, subtype_id)
    if complaint_subtype is None:
        raise HTTPException(status_code=404, detail="Complaint subtype not found")
    return format_response("0000", ComplaintSubTypeResponse.from_orm(complaint_subtype).dict())

@router.put("/subtypes/{subtype_id}", response_model=FormatResponseModel)
async def update_subtype(
    subtype_id: UUID,
    subtype_data: ComplaintSubTypeUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaint_metadata"))  # ✅ แก้ไข permission
):
    """อัพเดทข้อมูลประเภทเรื่องร้องเรียนย่อย"""
    if subtype_data.parent_type_id:
        parent_type = get_complaint_type(db, subtype_data.parent_type_id)
        if parent_type is None:
            raise HTTPException(status_code=404, detail="Parent complaint type not found")
    
    updated_subtype = update_complaint_subtype(db, subtype_id, subtype_data.dict(exclude_unset=True))
    if updated_subtype is None:
        raise HTTPException(status_code=404, detail="Complaint subtype not found")
    return format_response("0002", ComplaintSubTypeResponse.from_orm(updated_subtype).dict())

@router.delete("/subtypes/{subtype_id}", response_model=FormatResponseModel)
async def delete_subtype(
    subtype_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("complaint_metadata"))  # ✅ แก้ไข permission
):
    """ลบประเภทเรื่องร้องเรียนย่อย"""
    success = delete_complaint_subtype(db, subtype_id)
    if not success:
        raise HTTPException(status_code=404, detail="Complaint subtype not found")
    return format_response("0003", {"id": str(subtype_id)})

# === ComplaintChannel Routes ===

@router.get("/channels", response_model=FormatResponseModel)
async def read_complaint_channels(  # ✅ แก้ไขชื่อ function
    skip: int = 0, 
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการช่องทางการร้องเรียน"""
    result = get_complaint_channels(db, skip=skip, limit=limit, active_only=active_only)  # ✅ แก้ไข function call
    return format_response("0000", result)

@router.post("/channels", response_model=FormatResponseModel)
async def create_channel(
    channel_data: ComplaintChannelCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("complaint_metadata"))  # ✅ แก้ไข permission
):
    """สร้างช่องทางการร้องเรียนใหม่"""
    new_channel = create_complaint_channel(db, channel_data.dict())
    return format_response("0001", ComplaintChannelResponse.from_orm(new_channel).dict())

@router.get("/channels/{channel_id}", response_model=FormatResponseModel)
async def read_complaint_channel(
    channel_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลช่องทางการร้องเรียน"""
    channel = get_complaint_channel(db, channel_id)
    if channel is None:
        raise HTTPException(status_code=404, detail="Complaint channel not found")
    return format_response("0000", ComplaintChannelResponse.from_orm(channel).dict())

@router.put("/channels/{channel_id}", response_model=FormatResponseModel)
async def update_channel(
    channel_id: UUID,
    channel_data: ComplaintChannelUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaint_metadata"))  # ✅ แก้ไข permission
):
    """อัพเดทข้อมูลช่องทางการร้องเรียน"""
    updated_channel = update_complaint_channel(db, channel_id, channel_data.dict(exclude_unset=True))
    if updated_channel is None:
        raise HTTPException(status_code=404, detail="Complaint channel not found")
    return format_response("0002", ComplaintChannelResponse.from_orm(updated_channel).dict())

@router.delete("/channels/{channel_id}", response_model=FormatResponseModel)
async def delete_channel(
    channel_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("complaint_metadata"))  # ✅ แก้ไข permission
):
    """ลบช่องทางการร้องเรียน"""
    success = delete_complaint_channel(db, channel_id)
    if not success:
        raise HTTPException(status_code=404, detail="Complaint channel not found")
    return format_response("0003", {"id": str(channel_id)})

# === Form Support Routes ===

@router.get("/types/for-form", response_model=FormatResponseModel)
async def read_complaint_types_for_form(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการประเภทเรื่องร้องเรียนหลักสำหรับใช้ใน form (รูปแบบ value, label)"""
    complaint_types = get_complaint_types_for_form(db, active_only=active_only)
    return format_response("0000", complaint_types)

@router.get("/types/search", response_model=FormatResponseModel)
async def search_complaint_types(
    search: Optional[str] = Query(None, description="ค้นหาตามชื่อประเภทเรื่องร้องเรียน"),
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ค้นหาประเภทเรื่องร้องเรียนตามชื่อ"""
    result = search_complaint_types_by_name(db, search=search, active_only=active_only)
    return format_response("0000", result)

@router.get("/types/validate", response_model=FormatResponseModel)
async def validate_complaint_type_endpoint(
    type_name: str = Query(..., description="ชื่อประเภทเรื่องร้องเรียนที่ต้องการตรวจสอบ"),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ตรวจสอบว่าประเภทเรื่องร้องเรียนที่ระบุมีอยู่ในระบบหรือไม่"""
    result = validate_complaint_type_name(db, type_name)
    return format_response("0000", result)

@router.get("/types/popular", response_model=FormatResponseModel)
async def read_popular_complaint_types(
    limit: int = Query(10, description="จำนวนประเภทที่ได้รับความนิยมสูงสุด"),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการประเภทเรื่องร้องเรียนที่ได้รับความนิยมสูงสุด"""
    result = get_popular_complaint_types(db, limit=limit)
    return format_response("0000", result)

@router.get("/subtypes/for-form", response_model=FormatResponseModel)
async def read_complaint_subtypes_for_form(  # ✅ แก้ไขชื่อ function
    parent_type_id: Optional[UUID] = Query(None, description="ID ของประเภทเรื่องร้องเรียนหลัก"),
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการประเภทเรื่องร้องเรียนย่อยสำหรับใช้ใน form"""
    result = get_complaint_subtypes_for_form(db, parent_type_id=parent_type_id, active_only=active_only)  # ✅ แก้ไข function call
    return format_response("0000", result)

@router.get("/channels/for-form", response_model=FormatResponseModel)
async def read_complaint_channels_for_form(  # ✅ แก้ไขชื่อ function
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการช่องทางการร้องเรียนสำหรับใช้ใน form"""
    result = get_complaint_channels_for_form(db, active_only=active_only)  # ✅ แก้ไข function call
    return format_response("0000", result)