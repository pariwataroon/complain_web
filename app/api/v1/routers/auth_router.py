from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import app.api.v1.controllers.auth_controller as auth_controller
import app.api.v1.controllers.user_controller as user_controller
import app.api.v1.schemas.user as schemas
import lib.format_data as format_data
from config.database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

@router.post("/login", response_model=format_data.FormatResponseModel)
async def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = auth_controller.authenticate_user(db, user.citizen_id, user.password)
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # ดึงข้อมูลผู้ใช้พร้อมบทบาท
    user_with_roles = user_controller.get_user_with_roles_and_titles(db, db_user.id)
    
    # ดึงข้อมูลบทบาทของผู้ใช้
    roles = []
    if 'roles' in user_with_roles:
        roles = [role.get('role_name') for role in user_with_roles['roles']]
    
    # สร้าง token payload ที่มีข้อมูลเพิ่มเติม
    token_data = {
        "sub": str(db_user.id),
        "first_name": user_with_roles.get('first_name') or db_user.first_name,
        "last_name": user_with_roles.get('last_name') or db_user.last_name,
        "roles": roles
    }
    
    # สร้าง JWT token สำหรับผู้ใช้
    access_token = auth_controller.create_access_token(data=token_data)
    refresh_token = auth_controller.create_refresh_token(data=token_data)
    
    # บันทึก token ลงฐานข้อมูล
    auth_controller.refresh_access_token_mapping(db, db_user.id, access_token, refresh_token)
    
    return format_data.format_response("0000", {"access_token": access_token, "refresh_token": refresh_token})
