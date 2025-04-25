import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

import app.api.v1.controllers.auth_controller as auth_controller
import app.api.v1.controllers.user_controller as user_controller
import app.api.v1.schemas.user as schemas
import lib.format_data as format_data
from config.database import get_db
from app.api.middleware.jwt_verify import verify_token
from uuid import UUID

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
LOGIN_URL = f"{FRONTEND_URL}/login"

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

@router.post("/login", response_model=format_data.FormatResponseModel)
async def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    result = auth_controller.authenticate_user(db, user.citizen_id, user.password)
    db_user, error_type = result

    if not db_user:
        if error_type == "email_not_verified":
            return format_data.format_response("4010", {
                "error": "Email not verified", 
                "message": "โปรดยืนยันอีเมลของคุณก่อนเข้าสู่ระบบ ตรวจสอบกล่องจดหมายของคุณสำหรับลิงก์ยืนยัน"
            })
        else:  # invalid_credentials
            return format_data.format_response("4010", {"error": "Invalid credentials"})
    
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

@router.get("/me", response_model=format_data.FormatResponseModel)
async def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """
    ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่ในปัจจุบัน
    รวมถึงข้อมูลส่วนตัว บทบาท และสิทธิ์ต่างๆ
    """
    try:
        # แปลง current_user จาก string เป็น UUID
        user_id = UUID(current_user)
        
        # ดึงข้อมูลผู้ใช้พร้อมบทบาทและคำนำหน้า
        user_data = user_controller.get_user_with_roles_and_titles(db, user_id)
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User profile not found")
            
        # เพิ่มข้อมูลสิทธิ์การเข้าถึงของผู้ใช้ (ถ้าต้องการ)
        # ดึงข้อมูลจาก permission_controller
        from app.api.v1.controllers.permission_controller import get_all_user_permissions
        
        # ดึงสิทธิ์ทั้งหมดของผู้ใช้นี้ (ทั้งจากบทบาทและสิทธิ์เฉพาะบุคคล)
        permissions = get_all_user_permissions(db, user_id)
        user_data["permissions"] = permissions
        
        return format_data.format_response("0000", user_data)
    except Exception as e:
        print(f"Error fetching user profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return format_data.format_response("5000", {"error": "Error fetching user profile"})

@router.get("/verify-email")
async def verify_email_endpoint(
    token: str,
    db: Session = Depends(get_db)
):
    """ยืนยันอีเมลโดยใช้ token ที่ส่งไปยังอีเมลของผู้ใช้ และ redirect ไปยังหน้า login"""
    try:
        from app.api.v1.controllers.email_controller import verify_email
        
        user_id = verify_email(db, token)
        
        if not user_id:
            # ถ้า token ไม่ถูกต้อง ให้ redirect ไปยังหน้า login พร้อมแสดง error message
            return RedirectResponse(f"{LOGIN_URL}?error=invalid_token", status_code=302)
        
        # ถ้ายืนยันสำเร็จ ให้ redirect ไปยังหน้า login พร้อมแสดง success message
        return RedirectResponse(f"{LOGIN_URL}?verified=true", status_code=302)
    except Exception as e:
        # กรณีเกิด error ให้ redirect ไปยังหน้า login พร้อมแสดง error message
        return RedirectResponse(f"{LOGIN_URL}?error=verification_failed", status_code=302)

@router.post("/resend-verification", response_model=format_data.FormatResponseModel)
async def resend_verification_endpoint(
    request: schemas.ResendVerificationEmail,
    db: Session = Depends(get_db)
):
    """ส่งอีเมลยืนยันใหม่ในกรณีที่อีเมลเดิมหมดอายุหรือได้รับไม่ถึง"""
    from app.api.v1.controllers.email_controller import resend_verification_email
    
    success, message, error_code = resend_verification_email(
        db=db, 
        email=request.email
    )
    
    if not success and error_code:
        return format_data.format_response(error_code, {
            "error": "Email already verified",
            "message": message
        })
    
    return format_data.format_response("0000", {
        "message": message
    })