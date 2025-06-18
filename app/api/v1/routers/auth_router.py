import os
from fastapi import APIRouter, Depends, HTTPException, Request
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
            return RedirectResponse(f"{LOGIN_URL}?error=invalid_token", status_code=302)
        
        # ถ้ายืนยันสำเร็จ ให้ redirect ไปยังหน้า login พร้อมแสดง success message
        return RedirectResponse(f"{LOGIN_URL}?verified=true", status_code=302)
    except Exception as e:
        # กรณีเกิด error ให้ redirect ไปยangหน้า login พร้อมแสดง error message
        return RedirectResponse(f"{LOGIN_URL}?error=verification_failed", status_code=302)

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
    verify_request: schemas.VerifyEmployeeRequest, 
    db: Session = Depends(get_db)
):
    """
    ตรวจสอบว่าผู้ใช้ที่เข้าสู่ระบบด้วย ThaiID จากระบบอื่นเป็นพนักงาน/เจ้าหน้าที่ในระบบนี้หรือไม่
    
    - ตรวจสอบ API Key ของโปรเจคที่ส่งคำขอมา
    - รับเลขบัตรประชาชน หรือข้อมูลอื่นๆ ที่ได้จาก ThaiID เพื่อตรวจสอบ
    - ตรวจสอบว่ามีผู้ใช้ในระบบที่มีเลขบัตรประชาชนตรงกัน
    - ตรวจสอบว่าผู้ใช้นั้นมีบทบาทที่ไม่ใช่แค่ "people" (คือเป็นพนักงานหรือเจ้าหน้าที่)
    """
    # นำเข้าตัวควบคุม API Key
    from app.api.v1.controllers.project_api_key_controller import verify_project_api_key
    
    # ตรวจสอบ API Key ของโปรเจค
    if not verify_project_api_key(db, verify_request.project_api_key):
        return format_data.format_response("4030", {
            "error": "Invalid or inactive project API key",
            "message": "API key ไม่ถูกต้องหรือไม่มีสิทธิ์ในการเข้าถึงข้อมูล"
        })
    
    # ตรวจสอบว่ามีผู้ใช้ที่มีเลขบัตรประชาชนตรงกัน
    user = user_controller.get_user_by_pid(db, verify_request.citizen_id)
    
    if not user:
        return format_data.format_response("0000", {
            "is_employee": False,
            "message": "ไม่พบข้อมูลพนักงาน/เจ้าหน้าที่ในระบบ"
        })
    
    # ตรวจสอบว่าเป็นพนักงาน/เจ้าหน้าที่หรือไม่ โดยดูจากบทบาท
    user_with_roles = user_controller.get_user_with_roles_and_titles(db, user.id)
    
    # ดึงรายการบทบาทของผู้ใช้
    roles = []
    if 'roles' in user_with_roles:
        roles = [role.get('role_name') for role in user_with_roles['roles']]
    
    # ตรวจสอบว่าผู้ใช้มีบทบาทนอกเหนือจาก "people" หรือไม่
    # หรือมีบทบาทเฉพาะที่ระบุว่าเป็นพนักงาน
    employee_roles = [role for role in roles if role != "people"]
    is_employee = len(employee_roles) > 0
    
    # ข้อมูลตำแหน่งงานที่จะส่งกลับ (ถ้ามี)
    position_info = None
    if is_employee and user_with_roles.get('primary_position'):
        position_info = {
            "position_name": user_with_roles['primary_position'].get('position_name', ''),
            "position_level": user_with_roles['primary_position'].get('position_level', ''),
        }
    
    # ส่งข้อมูลกลับ
    return format_data.format_response("0000", {
        "is_employee": is_employee,
        "user_info": {
            "id": str(user.id),
            "full_name": user_with_roles.get('full_name_with_title', ''),
            "email": user.email,
            "roles": employee_roles,
            "position": position_info
        } if is_employee else None
    })