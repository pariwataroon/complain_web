import os
from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

import app.api.v1.controllers.auth_controller as auth_controller
import app.api.v1.controllers.user_controller as user_controller
import app.api.v1.schemas.user as schemas
import lib.format_data as format_data
from config.database import get_db
from app.api.middleware.jwt_verify import verify_token
from uuid import UUID

# FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
# LOGIN_URL = f"{FRONTEND_URL}/login"
LOGIN_URL = "https://complaint.minertatech.com/register/?method=CardID"

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

@router.post("/login", response_model=format_data.FormatResponseModel)
async def login(request: Request, user: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        result = auth_controller.authenticate_user(db, user.citizen_id, user.password)
        db_user, error_type = result

        if not db_user:
            if error_type == "email_not_verified":
                return format_data.format_response("4010", {
                    "error": "Email verification required",
                    "message": "โปรดยืนยันอีเมลของคุณก่อนเข้าสู่ระบบ"
                })
            else:
                return format_data.format_response("4010", {
                    "error": "Invalid credentials",
                    "message": "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง"
                })
        
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
        
        return format_data.format_response("0000", {
            "access_token": access_token, 
            "refresh_token": refresh_token
        })
        
    except Exception as e:
        # Log detailed error but return generic message
        from lib.logger import get_logger
        logger = get_logger("auth")
        logger.error(f"Login error for user {user.citizen_id}: {str(e)}")
        
        # Return generic error message
        return format_data.format_response("5000", {
            "error": "Service temporarily unavailable",
            "message": "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง"
        })

@router.get("/me", response_model=format_data.FormatResponseModel)
async def get_current_user_profile(
    request: Request,
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
    request: Request,
    token: str,
    db: Session = Depends(get_db)
):
    """ยืนยันอีเมลโดยใช้ token ที่ส่งไปยังอีเมลของผู้ใช้ และ redirect ไปยังหน้า login"""
    try:
        from app.api.v1.controllers.email_controller import verify_email
        
        user_id = verify_email(db, token)
        
        if not user_id:
            # ถ้า token ไม่ถูกต้อง ให้ redirect ไปยังหน้า login พร้อมแสดง error message
            return RedirectResponse(f"{LOGIN_URL}&error=invalid_token", status_code=302)
        
        # ถ้ายืนยันสำเร็จ ให้ redirect ไปยังหน้า login พร้อมแสดง success message
        return RedirectResponse(f"{LOGIN_URL}&verified=true", status_code=302)
    except Exception as e:
        # กรณีเกิด error ให้ redirect ไปยangหน้า login พร้อมแสดง error message
        return RedirectResponse(f"{LOGIN_URL}&error=verification_failed", status_code=302)

@router.post("/resend-verification", response_model=format_data.FormatResponseModel)
async def resend_verification_endpoint(
    request: Request,
    email_request: schemas.ResendVerificationEmail,
    db: Session = Depends(get_db)
):
    """ส่งอีเมลยืนยันใหม่ในกรณีที่อีเมลเดิมหมดอายุหรือได้รับไม่ถึง"""
    from app.api.v1.controllers.email_controller import resend_verification_email
    
    success, message, error_code = resend_verification_email(
        db=db, 
        email=email_request.email
    )
    
    if not success and error_code:
        return format_data.format_response(error_code, {
            "error": "Email already verified",
            "message": message
        })
    
    return format_data.format_response("0000", {
        "message": message
    })

@router.post("/forgot-password", response_model=format_data.FormatResponseModel)
async def forgot_password_endpoint(
    request: Request, 
    forgot_request: schemas.ForgotPasswordRequest, 
    db: Session = Depends(get_db)
):
    """ส่งอีเมลลิงก์รีเซ็ตรหัสผ่านให้กับผู้ใช้"""
    from app.api.v1.controllers.email_controller import send_password_reset_email
    
    success, message = send_password_reset_email(db, forgot_request.email)
    
    if not success:
        return format_data.format_response("5000", {"error": message})
    
    return format_data.format_response("0000", {"message": message})

@router.post("/reset-password", response_model=format_data.FormatResponseModel)
async def reset_password_endpoint(
    request: Request,
    reset_request: schemas.ResetPasswordRequest, 
    db: Session = Depends(get_db)
):
    """รีเซ็ตรหัสผ่านโดยใช้ token"""
    from app.api.v1.controllers.email_controller import reset_password_with_token
    
    success, message = reset_password_with_token(db, reset_request.token, reset_request.new_password)
    
    if not success:
        return format_data.format_response("4000", {"error": message})
    
    return format_data.format_response("0000", {"message": message})

@router.get("/verify-reset-token", response_model=format_data.FormatResponseModel)
async def verify_reset_token_endpoint(
    request: Request,
    token: str, 
    db: Session = Depends(get_db)
):
    """ตรวจสอบว่า token รีเซ็ตรหัสผ่านยังใช้งานได้หรือไม่"""
    from app.api.v1.controllers.email_controller import verify_reset_token
    
    user_id = verify_reset_token(db, token)
    
    if not user_id:
        return format_data.format_response("4000", {
            "valid": False,
            "message": "Token ไม่ถูกต้องหรือหมดอายุแล้ว (token มีอายุ 30 นาที)"
        })
    
    return format_data.format_response("0000", {
        "valid": True,
        "message": "Token ถูกต้องและยังไม่หมดอายุ"
    })

@router.post("/verify-employee", response_model=format_data.FormatResponseModel)
async def verify_employee(
    request: Request,
    verify_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """ตรวจสอบว่าผู้ใช้เป็นพนักงาน/เจ้าหน้าที่หรือไม่ - ต้องมี API Key เพื่อความปลอดภัย"""
    try:
        # Get API Key from headers
        api_key = (request.headers.get("X-API-Key") or 
                   request.headers.get("X-Project-Key"))
        if not api_key:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("ApiKey "):
                api_key = auth_header[7:]
        
        if not api_key or not verify_employee_api_key(api_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid API key for employee verification"
            )
        
        # Validate citizen_id
        citizen_id = verify_data.get("citizen_id", "").strip()
        if not citizen_id or len(citizen_id) != 13 or not citizen_id.isdigit():
            return format_data.format_response("4000", {
                "error": "Invalid citizen_id format",
                "message": "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก"
            })
        
        # ตรวจสอบพนักงาน
        user = user_controller.get_user_by_pid(db, citizen_id)
        
        if not user:
            return format_data.format_response("0000", {
                "is_employee": False,
                "message": "ไม่พบข้อมูลพนักงานในระบบ"
            })
        
        # ตรวจสอบบทบาท
        user_with_roles = user_controller.get_user_with_roles_and_titles(db, user.id)
        roles = [role.get('role_name') for role in user_with_roles.get('roles', [])]
        employee_roles = [role for role in roles if role != "people"]
        is_employee = len(employee_roles) > 0
        
        return format_data.format_response("0000", {
            "is_employee": is_employee,
            "user_info": {
                "id": str(user.id),
                "full_name": user_with_roles.get('full_name_with_title', ''),
                "email": user.email,
                "roles": employee_roles
            } if is_employee else None
        })
        
    except HTTPException:
        raise
    except Exception as e:
        from lib.logger import get_logger
        logger = get_logger("auth")
        logger.error(f"Error verifying employee: {str(e)}")
        return format_data.format_response("5000", {
            "error": "Employee verification failed",
            "message": "เกิดข้อผิดพลาดในการตรวจสอบข้อมูลพนักงาน"
        })

def verify_employee_api_key(api_key: str) -> bool:
    """ตรวจสอบ API Key สำหรับ employee verification"""
    import os
    
    allowed_keys = [
        os.getenv("FRONTEND_API_KEY", "cap_mof_live_frontend_web_2025@minerta"),
        os.getenv("MOBILE_API_KEY", "cap_mof_live_mobile_app_2025@minerta"),
        os.getenv("EXTERNAL_API_KEY", "cap_mof_live_external_api_2025@minerta"),
        "cap_mof_live_frontend_web_2025@minerta",
        "cap_mof_live_mobile_app_2025@minerta",
    ]
    
    return api_key in [k for k in allowed_keys if k and k.strip()]