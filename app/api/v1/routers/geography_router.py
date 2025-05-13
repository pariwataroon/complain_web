from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.geography_controller import (
    DuplicateKeyError, get_geographies, get_geography_by_id, create_geography, update_geography, delete_geography,
    get_provinces, get_province_by_id, get_provinces_by_geography, create_province, update_province, delete_province,
    get_amphures, get_amphure_by_id, get_amphures_by_province, create_amphure, update_amphure, delete_amphure,
    get_districts, get_district_by_id, get_districts_by_amphure, create_district, update_district, delete_district,
    get_geography_stats, get_locations_by_zipcode, get_locations_by_province_name,
    get_locations_by_amphure_name, get_locations_by_district_name
)
from app.api.middleware.jwt_verify import verify_token
from app.api.v1.schemas.geography import (
    Geography, GeographyCreate, GeographyUpdate, 
    Province, ProvinceCreate, ProvinceUpdate,
    Amphure, AmphureCreate, AmphureUpdate,
    District, DistrictCreate, DistrictUpdate
)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/geography",
    tags=["geography"],
)

# Geography routes
@router.get("/regions", response_model=FormatResponseModel)
async def read_geographies(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการภูมิภาคทั้งหมด"""
    geographies_data = get_geographies(db, skip=skip, limit=limit)
    return format_response("0000", geographies_data)

@router.get("/regions/{geography_id}", response_model=FormatResponseModel)
async def read_geography(
    geography_id: int, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลภูมิภาคตาม ID"""
    geography = get_geography_by_id(db, geography_id=geography_id)
    if geography is None:
        raise HTTPException(status_code=404, detail=f"Geography with ID {geography_id} not found")
    return format_response("0000", geography)

@router.post("/regions", response_model=FormatResponseModel)
async def create_geography_endpoint(
    geography: GeographyCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """สร้างภูมิภาคใหม่"""
    try:
        geography_data = geography.model_dump()
        db_geography = create_geography(db, geography_data)
        return format_response("0001", db_geography)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.put("/regions/{geography_id}", response_model=FormatResponseModel)
async def update_geography_endpoint(
    geography_id: int, 
    geography: GeographyUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_users"))
):
    """อัปเดตข้อมูลภูมิภาค"""
    try:
        geography_data = {k: v for k, v in geography.model_dump().items() if v is not None}
        db_geography = update_geography(db, geography_id=geography_id, geography_data=geography_data)
        
        if db_geography is None:
            raise HTTPException(status_code=404, detail=f"Geography with ID {geography_id} not found")
            
        return format_response("0002", db_geography)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.delete("/regions/{geography_id}", response_model=FormatResponseModel)
async def delete_geography_endpoint(
    geography_id: int, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_users"))
):
    """ลบภูมิภาค"""
    success = delete_geography(db, geography_id=geography_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Geography with ID {geography_id} not found")
    return format_response("0003", {"id": geography_id})

# Province routes
@router.get("/provinces", response_model=FormatResponseModel)
async def read_provinces_endpoint(
    skip: int = 0, 
    limit: int = 100, 
    geography_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการจังหวัดทั้งหมด หรือตามภูมิภาค"""
    if geography_id:
        provinces_data = get_provinces_by_geography(db, geography_id=geography_id, skip=skip, limit=limit)
    else:
        provinces_data = get_provinces(db, skip=skip, limit=limit)
    return format_response("0000", provinces_data)

@router.get("/provinces/{province_id}", response_model=FormatResponseModel)
async def read_province_endpoint(
    province_id: int, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลจังหวัดตาม ID"""
    province = get_province_by_id(db, province_id=province_id)
    if province is None:
        raise HTTPException(status_code=404, detail=f"Province with ID {province_id} not found")
    return format_response("0000", province)

@router.post("/provinces", response_model=FormatResponseModel)
async def create_province_endpoint(
    province: ProvinceCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """สร้างจังหวัดใหม่"""
    try:
        province_data = province.model_dump()
        db_province = create_province(db, province_data)
        return format_response("0001", db_province)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.put("/provinces/{province_id}", response_model=FormatResponseModel)
async def update_province_endpoint(
    province_id: int, 
    province: ProvinceUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_users"))
):
    """อัปเดตข้อมูลจังหวัด"""
    try:
        province_data = {k: v for k, v in province.model_dump().items() if v is not None}
        db_province = update_province(db, province_id=province_id, province_data=province_data)
        
        if db_province is None:
            raise HTTPException(status_code=404, detail=f"Province with ID {province_id} not found")
            
        return format_response("0002", db_province)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.delete("/provinces/{province_id}", response_model=FormatResponseModel)
async def delete_province_endpoint(
    province_id: int, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_users"))
):
    """ลบจังหวัด"""
    success = delete_province(db, province_id=province_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Province with ID {province_id} not found")
    return format_response("0003", {"id": province_id})

# Amphure routes
@router.get("/amphures", response_model=FormatResponseModel)
async def read_amphures_endpoint(
    skip: int = 0, 
    limit: int = 100, 
    province_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการอำเภอทั้งหมด หรือตามจังหวัด"""
    if province_id:
        amphures_data = get_amphures_by_province(db, province_id=province_id, skip=skip, limit=limit)
    else:
        amphures_data = get_amphures(db, skip=skip, limit=limit)
    return format_response("0000", amphures_data)

@router.get("/amphures/{amphure_id}", response_model=FormatResponseModel)
async def read_amphure_endpoint(
    amphure_id: int, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลอำเภอตาม ID"""
    amphure = get_amphure_by_id(db, amphure_id=amphure_id)
    if amphure is None:
        raise HTTPException(status_code=404, detail=f"Amphure with ID {amphure_id} not found")
    return format_response("0000", amphure)

@router.post("/amphures", response_model=FormatResponseModel)
async def create_amphure_endpoint(
    amphure: AmphureCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """สร้างอำเภอใหม่"""
    try:
        amphure_data = amphure.model_dump()
        db_amphure = create_amphure(db, amphure_data)
        return format_response("0001", db_amphure)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.put("/amphures/{amphure_id}", response_model=FormatResponseModel)
async def update_amphure_endpoint(
    amphure_id: int, 
    amphure: AmphureUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_users"))
):
    """อัปเดตข้อมูลอำเภอ"""
    try:
        amphure_data = {k: v for k, v in amphure.model_dump().items() if v is not None}
        db_amphure = update_amphure(db, amphure_id=amphure_id, amphure_data=amphure_data)
        
        if db_amphure is None:
            raise HTTPException(status_code=404, detail=f"Amphure with ID {amphure_id} not found")
            
        return format_response("0002", db_amphure)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.delete("/amphures/{amphure_id}", response_model=FormatResponseModel)
async def delete_amphure_endpoint(
    amphure_id: int, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_users"))
):
    """ลบอำเภอ"""
    success = delete_amphure(db, amphure_id=amphure_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Amphure with ID {amphure_id} not found")
    return format_response("0003", {"id": amphure_id})

# District routes
@router.get("/districts", response_model=FormatResponseModel)
async def read_districts_endpoint(
    skip: int = 0, 
    limit: int = 100, 
    amphure_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการตำบลทั้งหมด หรือตามอำเภอ"""
    if amphure_id:
        districts_data = get_districts_by_amphure(db, amphure_id=amphure_id, skip=skip, limit=limit)
    else:
        districts_data = get_districts(db, skip=skip, limit=limit)
    return format_response("0000", districts_data)

@router.get("/districts/{district_id}", response_model=FormatResponseModel)
async def read_district_endpoint(
    district_id: str, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลตำบลตาม ID"""
    district = get_district_by_id(db, district_id=district_id)
    if district is None:
        raise HTTPException(status_code=404, detail=f"District with ID {district_id} not found")
    return format_response("0000", district)

@router.post("/districts", response_model=FormatResponseModel)
async def create_district_endpoint(
    district: DistrictCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """สร้างตำบลใหม่"""
    try:
        district_data = district.model_dump()
        db_district = create_district(db, district_data)
        return format_response("0001", db_district)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.put("/districts/{district_id}", response_model=FormatResponseModel)
async def update_district_endpoint(
    district_id: str, 
    district: DistrictUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_users"))
):
    """อัปเดตข้อมูลตำบล"""
    try:
        district_data = {k: v for k, v in district.model_dump().items() if v is not None}
        db_district = update_district(db, district_id=district_id, district_data=district_data)
        
        if db_district is None:
            raise HTTPException(status_code=404, detail=f"District with ID {district_id} not found")
            
        return format_response("0002", db_district)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except HTTPException as e:
        return format_response(f"{e.status_code}", {"error": e.detail})

@router.delete("/districts/{district_id}", response_model=FormatResponseModel)
async def delete_district_endpoint(
    district_id: str, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_users"))
):
    """ลบตำบล"""
    success = delete_district(db, district_id=district_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"District with ID {district_id} not found")
    return format_response("0003", {"id": district_id})

# Additional utility routes
@router.get("/stats", response_model=FormatResponseModel)
async def get_geography_stats_endpoint(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงข้อมูลสถิติของข้อมูลภูมิศาสตร์"""
    stats = get_geography_stats(db)
    return format_response("0000", stats)

@router.get("/search/by-zipcode/{zipcode}", response_model=FormatResponseModel)
async def search_by_zipcode_endpoint(
    zipcode: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ค้นหาสถานที่ตามรหัสไปรษณีย์"""
    locations = get_locations_by_zipcode(db, zipcode)
    return format_response("0000", locations)

# เพิ่ม route สำหรับค้นหาตามชื่อจังหวัด
@router.get("/search/by-province/{name}", response_model=FormatResponseModel)
async def search_by_province_name(
    name: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ค้นหาข้อมูลจังหวัดตามชื่อ (ภาษาไทยหรืออังกฤษ) - รองรับการค้นหาแบบบางส่วนของชื่อ"""
    locations = get_locations_by_province_name(db, name)
    return format_response("0000", locations)

# เพิ่ม route สำหรับค้นหาตามชื่ออำเภอ
@router.get("/search/by-amphure/{name}", response_model=FormatResponseModel)
async def search_by_amphure_name(
    name: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ค้นหาข้อมูลอำเภอตามชื่อ (ภาษาไทยหรืออังกฤษ) - รองรับการค้นหาแบบบางส่วนของชื่อ"""
    locations = get_locations_by_amphure_name(db, name)
    return format_response("0000", locations)

# เพิ่ม route สำหรับค้นหาตามชื่อตำบล
@router.get("/search/by-district/{name}", response_model=FormatResponseModel)
async def search_by_district_name(
    name: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ค้นหาข้อมูลตำบลตามชื่อ (ภาษาไทยหรืออังกฤษ) - รองรับการค้นหาแบบบางส่วนของชื่อ"""
    locations = get_locations_by_district_name(db, name)
    return format_response("0000", locations)