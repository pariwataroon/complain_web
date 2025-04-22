from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.user_controller import (DuplicateKeyError,
                                                   create_user, delete_user,
                                                   get_titles, get_users_with_titles,
                                                   update_user, get_user_with_roles_and_titles)
from app.api.v1.schemas.user import (TitleResponse, UserCreate, UserResponse,
                                    UserUpdate)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response
from app.api.middleware.jwt_verify import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.get("/", response_model=FormatResponseModel)
async def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """ดึงข้อมูลผู้ใช้ทั้งหมด - ต้องมีสิทธิ์อ่านใน setting_users"""
    users = get_users_with_titles(db, skip=skip, limit=limit)
    return format_response("0000", users)


@router.get("/{user_id}", response_model=FormatResponseModel)
async def read_user(
    user_id: UUID, 
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลผู้ใช้ตาม ID - ตัวเองดูได้ หรือต้องมีสิทธิ์ setting_users"""
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
@router.post("/", response_model=FormatResponseModel)
async def create_new_user(
    user: UserCreate, 
    roles: Optional[list[str]] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_users"))
):
    """
    สร้างผู้ใช้ใหม่โดยผู้ดูแลระบบ - ต้องมีสิทธิ์สร้างใน setting_users
    
    สามารถระบุบทบาทได้ผ่าน query parameter roles เช่น ?roles=admin&roles=staff
    หากไม่ระบุบทบาท จะได้รับบทบาท "staff" เป็นค่าเริ่มต้น
    """
    try:
        # ถ้าไม่ได้ระบุบทบาทมา ให้ใช้ staff เป็นค่าเริ่มต้น
        if not roles:
            roles = ["staff"]
        
        db_user = create_user(db, user, roles)
        result = UserResponse.model_validate(db_user).model_dump()
        return format_response("0001", result)
    except DuplicateKeyError as e:
        print(f"DuplicateKeyError: {str(e)}")
        return format_response("4090", {"error": str(e)})


@router.post("/register", response_model=FormatResponseModel)
async def register_new_user(user: UserCreate, db: Session = Depends(get_db)):
    """สมัครสมาชิกใหม่ - ไม่จำเป็นต้องมีสิทธิ์พิเศษ (สำหรับประชาชนทั่วไป)"""
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
    """
    อัปเดตข้อมูลผู้ใช้ - ตัวเองแก้ไขได้ หรือต้องมีสิทธิ์ setting_users
    """
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
    """ลบผู้ใช้ - ต้องมีสิทธิ์ลบใน setting_users"""
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    return format_response("0003", {"id": user_id})


@router.get("/title/details", response_model=FormatResponseModel)
async def get_titles_midleware(db: Session = Depends(get_db)):
    """ดึงข้อมูลคำนำหน้า - ไม่จำเป็นต้องมีสิทธิ์พิเศษ"""
    # ไม่ต้องตรวจสอบสิทธิ์สำหรับ endpoint นี้
    data = get_titles(db)
    titles = [TitleResponse.model_validate(title).model_dump() for title in data]
    return format_response("0000", titles)

@router.get("/search/by-role", response_model=FormatResponseModel)
async def search_users_by_role_endpoint(
    role_name: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """
    ค้นหาผู้ใช้ตามบทบาท (role) - ต้องมีสิทธิ์อ่านใน setting_users
    
    สามารถระบุบทบาทที่ต้องการค้นหาหรือไม่ระบุก็ได้ (ถ้าไม่ระบุจะแสดงผู้ใช้ทั้งหมด)
    รองรับการแบ่งหน้าด้วย skip และ limit
    """
    from app.api.v1.controllers.user_controller import search_users_by_role
    
    users = search_users_by_role(db, role_name=role_name, skip=skip, limit=limit)
    return format_response("0000", users)


@router.get("/stats/by-role", response_model=FormatResponseModel)
async def get_user_counts_by_role(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """
    ดึงข้อมูลสถิติจำนวนผู้ใช้แยกตามบทบาท - ต้องมีสิทธิ์อ่านใน setting_users
    
    คืนค่าเป็นรายการของบทบาทพร้อมจำนวนผู้ใช้ในแต่ละบทบาท
    """
    from app.api.v1.controllers.user_controller import get_users_count_by_roles
    
    role_stats = get_users_count_by_roles(db)
    return format_response("0000", role_stats)

@router.get("/detailed-stats/by-role", response_model=FormatResponseModel)
async def get_detailed_users_by_roles_endpoint(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_users"))
):
    """
    ดึงข้อมูลผู้ใช้ทั้งหมดแยกตามบทบาท - ต้องมีสิทธิ์อ่านใน setting_users
    
    คืนค่าเป็นรายการของบทบาทพร้อมรายละเอียดผู้ใช้ทั้งหมดในแต่ละบทบาท
    """
    from app.api.v1.controllers.user_controller import get_detailed_users_by_roles
    
    detailed_data = get_detailed_users_by_roles(db)
    return format_response("0000", detailed_data)