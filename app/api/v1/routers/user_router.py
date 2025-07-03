from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Body, Request , Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.api.middleware.permission_middleware import can_create, can_read, can_delete
from app.api.v1.controllers.user_controller import (DuplicateKeyError,
                                                   create_user, delete_user,
                                                   get_titles, get_users_with_titles,
                                                   update_user, update_user_admin, get_user_with_roles_and_titles)
from app.api.v1.schemas.user import (TitleResponse, UserCreate, UserResponse,
                                    UserUpdate, UserAdminUpdate)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.middleware.jwt_verify import verify_token, verify_token_simple

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.get("", response_model=FormatResponseModel)
async def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    users = get_users_with_titles(db, skip=skip, limit=limit)
    return format_response("0000", users)


@router.get("/{user_id}", response_model=FormatResponseModel)
async def read_user(
    user_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    print(f"Fetching user with ID: {user_id}")
    
    # ตรวจสอบว่าเป็นข้อมูลของตัวเองหรือไม่
    is_own_profile = str(user_id) == current_user
    
    # ถ้าไม่ใช่ข้อมูลของตัวเอง ตรวจสอบสิทธิ์การเข้าถึง
    if not is_own_profile:
        # เรียกใช้ฟังก์ชันตรวจสอบสิทธิ์โดยตรง
        from app.api.v1.controllers.permission_controller import check_permission_by_name
        
        has_permission = check_permission_by_name(db, UUID(current_user), "setting_users", "read")
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view this user's data"
            )
    
    # ดึงข้อมูลผู้ใช้พร้อมกับรายละเอียดบทบาทและคำนำหน้า
    user = get_user_with_roles_and_titles(db, user_id)
    
    if user is None:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    
    return format_response("0000", user)


# POST /api/v1/users/?roles=admin&roles=supervisor
@router.post("", response_model=FormatResponseModel)
async def create_new_user(
    user_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    try:
        # แปลงข้อมูลจาก frontend format เป็น UserCreate format
        processed_data = process_frontend_user_data(user_data)
        
        # สร้าง UserCreate object
        user = UserCreate(**processed_data)
        
        # ดึง roles จากข้อมูลที่ประมวลผลแล้ว
        roles = processed_data.get('processed_roles', ['staff'])
        
        # ดึง position_ids
        position_ids = processed_data.get('position_ids')
        primary_position_id = processed_data.get('primary_position_id')
        
        db_user = create_user(db, user, roles, position_ids, primary_position_id)
        result = UserResponse.model_validate(db_user).model_dump()
        return format_response("0001", result)
    except DuplicateKeyError as e:
        print(f"DuplicateKeyError: {str(e)}")
        return format_response("4090", {"error": str(e)})
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return format_response("5000", {"error": str(e)})

def process_frontend_user_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """แปลงข้อมูลจาก frontend format เป็น backend format"""
    processed = {}
    
    # ข้อมูลพื้นฐาน
    processed['citizen_id'] = data.get('citizen_id')
    processed['title_id'] = data.get('title_id')
    processed['prefix_other'] = data.get('prefix_other')
    processed['first_name'] = data.get('first_name')
    processed['last_name'] = data.get('last_name')
    processed['email'] = data.get('email')
    processed['password'] = data.get('password')
    processed['phone'] = data.get('phone')
    processed['is_active'] = data.get('is_active')
    
    # ที่อยู่
    processed['address'] = data.get('address')
    processed['address_other'] = data.get('address2')  # address2 -> address_other
    processed['sync_address'] = data.get('syncAddress', False)
    processed['profile_image'] = data.get('profileImage')
    processed['group_type'] = data.get('group')  # แก้ไขจาก 'group' เป็น 'group_type' ให้ตรงกับ model
    
    # ประมวลผลข้อมูลภูมิศาสตร์ที่อยู่หลัก
    province = data.get('province', {})
    district = data.get('districts', {})  # frontend ใช้ 'districts'
    subdistrict = data.get('subdistricts', {})
    zipcode = data.get('zipcode', {})
    
    if isinstance(province, dict) and 'value' in province:
        processed['province_id'] = int(province['value']) if province['value'] else None
    
    if isinstance(district, dict) and 'value' in district:
        processed['district_id'] = int(district['value']) if district['value'] else None
    
    if isinstance(subdistrict, dict) and 'value' in subdistrict:
        processed['subdistrict_id'] = str(subdistrict['value']) if subdistrict['value'] else None
    
    if isinstance(zipcode, dict) and 'value' in zipcode:
        processed['zipcode'] = int(zipcode['value']) if zipcode['value'] else None
    
    # ประมวลผลข้อมูลภูมิศาสตร์ที่อยู่อื่น
    province2 = data.get('province2', {})
    district2 = data.get('districts2', {})
    subdistrict2 = data.get('subdistricts2', {})
    zipcode2 = data.get('zipcode2', {})
    
    if isinstance(province2, dict) and 'value' in province2:
        processed['province2_id'] = int(province2['value']) if province2['value'] else None
    
    if isinstance(district2, dict) and 'value' in district2:
        processed['district2_id'] = int(district2['value']) if district2['value'] else None
    
    if isinstance(subdistrict2, dict) and 'value' in subdistrict2:
        processed['subdistrict2_id'] = str(subdistrict2['value']) if subdistrict2['value'] else None
    
    if isinstance(zipcode2, dict) and 'value' in zipcode2:
        processed['zipcode2'] = int(zipcode2['value']) if zipcode2['value'] else None
    
    # ประมวลผลบทบาท
    roles = data.get('roles', [])
    processed_roles = []
    processed_role_ids = []

    if roles:
        for role in roles:
            if isinstance(role, dict) and 'id' in role:
                processed_role_ids.append(role['id'])
            elif isinstance(role, str):
                processed_roles.append(role)

    # เลือกส่ง id ถ้ามี, ถ้าไม่มีให้ส่งชื่อ, ถ้าไม่มีอะไรเลยให้ default
    if processed_role_ids:
        processed['processed_roles'] = processed_role_ids
    elif processed_roles:
        processed['processed_roles'] = processed_roles
    else:
        # ถ้าไม่มี roles มาให้ กำหนด default ตาม group
        group = data.get('group', 'people')
        if group == 'officer':
            processed['processed_roles'] = ['staff']
        else:
            processed['processed_roles'] = ['people']

    # ประมวลผลตำแหน่ง (ถ้ามี)
    processed['position_ids'] = data.get('position_ids')
    processed['primary_position_id'] = data.get('primary_position_id')

    # กรองข้อมูลที่เป็น None ออก (ยกเว้น processed_roles ที่ต้องการส่งไปเสมอ)
    filtered_processed = {}
    for key, value in processed.items():
        if key == 'processed_roles' or value is not None:
            filtered_processed[key] = value

    return filtered_processed


@router.post("/register", response_model=FormatResponseModel)
async def register_new_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    authorization: str = Header(default=None) 
):
    if authorization:
        raise HTTPException(status_code=401, detail="Token should not be provided for public registration")

    try:
        db_user = create_user(db, user, ["people"])
        result = UserResponse.model_validate(db_user).model_dump()
        return format_response("0001", result)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})


@router.put("/{user_id}", response_model=FormatResponseModel)
async def update_existing_user(
    user_id: UUID, 
    user: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    # ตรวจสอบว่าเป็นข้อมูลของตัวเองหรือไม่
    is_own_profile = str(user_id) == current_user
    
    # ถ้าไม่ใช่ข้อมูลของตัวเอง ตรวจสอบสิทธิ์การเข้าถึง
    if not is_own_profile:
        from app.api.v1.controllers.permission_controller import check_permission_by_name
        
        has_permission = check_permission_by_name(db, UUID(current_user), "setting_users", "update")
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update this user's data"
            )
            
    try:
        db_user = update_user(db, user_id, user)
        if db_user is None:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

        updated_user = UserResponse.model_validate(db_user).model_dump()
        return format_response("0002", updated_user)
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})


@router.delete("/{user_id}", response_model=FormatResponseModel)
async def delete_existing_user(
    user_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_users"))
):
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    return format_response("0003", {"id": user_id})


@router.get("/title/details", response_model=FormatResponseModel)
async def get_titles_midleware(request: Request, db: Session = Depends(get_db)):
    """
    ดึงข้อมูลคำนำหน้าชื่อทั้งหมด
    - ต้องมี Project API Key หรือ Valid Token
    - มี rate limiting ผ่าน middleware
    """
    try:
        # ตรวจสอบ API Key หรือ Token
        is_authenticated = await verify_api_key_or_token(request, db)
        
        if not is_authenticated:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid API key/token"
            )
        
        data = get_titles(db)
        titles = [TitleResponse.model_validate(title).model_dump() for title in data]
        return format_response("0000", titles)
    except HTTPException:
        raise  # ส่งต่อ HTTP exceptions
    except Exception as e:
        from lib.logger import get_logger
        logger = get_logger("user")
        logger.error(f"Error fetching titles: {str(e)}")
        return format_response("5000", {
            "error": "Service temporarily unavailable",
            "message": "เกิดข้อผิดพลาดในการดึงข้อมูล"
        })

async def verify_api_key_or_token(request: Request, db: Session) -> bool:
    """
    ตรวจสอบ API Key หรือ Token
    รองรับหลายรูปแบบ:
    1. X-API-Key header
    2. X-Project-Key header  
    3. Authorization: Bearer <token>
    4. Authorization: ApiKey <key>
    """
    try:
        # ตรวจสอบ API Key headers
        api_key = (
            request.headers.get("X-API-Key") or 
            request.headers.get("X-Project-Key") or
            request.headers.get("X-Client-Key")
        )
        
        if api_key:
            # ตรวจสอบ API key กับรายการที่อนุญาต
            return verify_project_api_key(api_key)
        
        # ตรวจสอบ Authorization header
        auth_header = request.headers.get("Authorization", "")
        
        if auth_header.startswith("ApiKey "):
            api_key = auth_header.replace("ApiKey ", "")
            return verify_project_api_key(api_key)
        
        elif auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            # ตรวจสอบ JWT token (ถ้าเป็น valid JWT)
            return await verify_jwt_token(token, db)
        
        return False
        
    except Exception as e:
        from lib.logger import get_logger
        logger = get_logger("user")
        logger.warning(f"Error verifying API key/token: {str(e)}")
        return False

def verify_project_api_key(api_key: str) -> bool:
    """
    ตรวจสอบ Project API Key แบบง่าย
    """
    # รายการ API Keys ที่อนุญาต (ในอนาคตอาจเก็บในฐานข้อมูล)
    allowed_api_keys = [
        "cap_mof_live_frontend_web_2025@minerta",
        "thaid_integration_key_2025@mof",
        # เพิ่ม keys ตามต้องการ
    ]
    
    return api_key in allowed_api_keys

async def verify_jwt_token(token: str, db: Session) -> bool:
    """
    ตรวจสอบ JWT Token (optional)
    """
    try:
        from app.api.middleware.jwt_verify import verify_token_simple
        
        # ใช้ฟังก์ชันตรวจสอบ token ที่มีอยู่แล้ว
        user_id = verify_token_simple(token)
        return user_id is not None
        
    except Exception:
        return False
    
@router.get("/search/by-role", response_model=FormatResponseModel)
async def search_users_by_role_endpoint(
    role_name: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    from app.api.v1.controllers.user_controller import search_users_by_role
    
    users = search_users_by_role(db, role_name=role_name, skip=skip, limit=limit)
    return format_response("0000", users)


@router.get("/stats/by-role", response_model=FormatResponseModel)
async def get_user_counts_by_role(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    from app.api.v1.controllers.user_controller import get_users_count_by_roles
    
    role_stats = get_users_count_by_roles(db)
    return format_response("0000", role_stats)

@router.get("/detailed-stats/by-role", response_model=FormatResponseModel)
async def get_detailed_users_by_roles_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    from app.api.v1.controllers.user_controller import get_detailed_users_by_roles
    
    detailed_data = get_detailed_users_by_roles(db, skip=skip, limit=limit)
    return format_response("0000", detailed_data)

@router.put("/admin/{user_id}", response_model=FormatResponseModel)
async def admin_update_user(
    user_id: UUID,
    user_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))  # ใช้สิทธิ์ create เนื่องจาก admin level
):
    """
    Admin endpoint to update user with full privileges including roles and positions
    Similar to POST /users but for updating existing users
    """
    try:
        # แปลงข้อมูลจาก frontend format เป็น backend format
        processed_data = process_frontend_user_data(user_data)
        
        # แยกข้อมูลสำหรับ roles และ positions
        roles = processed_data.pop('processed_roles', None)
        position_ids = processed_data.pop('position_ids', None)
        primary_position_id = processed_data.pop('primary_position_id', None)
        
        # เรียกใช้ฟังก์ชัน admin update
        updated_user = update_user_admin(
            db=db, 
            user_id=user_id, 
            user_data=processed_data,
            roles=roles,
            position_ids=position_ids,
            primary_position_id=primary_position_id
        )
        
        if updated_user is None:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

        return format_response("0002", updated_user)
        
    except DuplicateKeyError as e:
        return format_response("4090", {"error": str(e)})
    except Exception as e:
        return format_response("5000", {"error": f"Failed to update user: {str(e)}"})

@router.patch("/restore/{user_id}", response_model=FormatResponseModel)
async def restore_existing_user(
    user_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))  # ใช้สิทธิ์ create เนื่องจากเป็นการ restore
):
    """Restore soft deleted user"""
    from app.api.v1.controllers.user_controller import restore_user
    
    success = restore_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found or already active")
    return format_response("0002", {"id": user_id, "message": "User restored successfully"})