from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from sqlalchemy.orm import Session
import lib.format_data as format_data

from app.api.v1.controllers.thaid_controller import validate_thaid_token, get_or_create_user_from_thaid, process_thaid_auth_code
from app.api.v1.schemas.thaid import ThaiIDTokenResponse, ThaiIDLoginResponse, ThaiIDAuthCode
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/thaid",
    tags=["thai digital id"],
)

# @router.post("/login", response_model=FormatResponseModel)
# async def thaid_login(thaid_data: ThaiIDTokenResponse, db: Session = Depends(get_db)):
#     """
#     รับข้อมูลจาก Thai Digital ID และสร้าง JWT token สำหรับระบบเรา
#     """
#     try:
#         # ตรวจสอบความถูกต้องของ Thai Digital ID token
#         if not validate_thaid_token(thaid_data):
#             return format_response("4010", {"error": "Invalid Thai Digital ID token"})
        
#         # ค้นหาหรือสร้างผู้ใช้จากข้อมูล Thai Digital ID
#         result = get_or_create_user_from_thaid(db, thaid_data)
        
#         # สร้าง response
#         response_data = {
#             "is_new_user": result["is_new_user"],
#             "access_token": result["access_token"],
#             "refresh_token": result["refresh_token"]
#         }
        
#         # ถ้าเป็นผู้ใช้ใหม่ ส่งรหัส 0001 (CREATED_SUCCESSFULLY)
#         # ถ้าเป็นผู้ใช้เดิม ส่งรหัส 0000 (GET_DATA_SUCCESSFULLY)
#         res_code = "0001" if result["is_new_user"] else "0000"
        
#         return format_response(res_code, response_data)
    
#     except Exception as e:
#         # จัดการข้อผิดพลาด
#         print(f"Thai ID login error: {str(e)}")
#         return format_response("5000", {"error": "Internal server error"})

# เพิ่ม endpoint ใหม่
@router.post("/auth", response_model=format_data.FormatResponseModel)
async def thaid_authentication(
    request: Request,
    auth_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """ThaiID Authentication endpoint - ต้องมี API Key เพื่อความปลอดภัย"""
    try:
        # Get API Key from headers
        api_key = (request.headers.get("X-API-Key") or 
                   request.headers.get("X-Project-Key"))
        if not api_key:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("ApiKey "):
                api_key = auth_header[7:]
        
        if not api_key or not verify_thaid_api_key(api_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid API key for ThaiID integration"
            )
        
        # Validate citizen_id
        citizen_id = auth_data.get("citizen_id", "").strip()
        if not citizen_id or len(citizen_id) != 13 or not citizen_id.isdigit():
            return format_data.format_response("4000", {
                "error": "Invalid citizen_id format",
                "message": "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก"
            })
        
        return format_data.format_response("0000", {
            "message": "ThaiID authentication successful",
            "citizen_id": citizen_id[:3] + "****" + citizen_id[-3:]
        })
        
    except HTTPException:
        raise
    except Exception as e:
        from lib.logger import get_logger
        logger = get_logger("thaid")
        logger.error(f"Error in ThaiID auth: {str(e)}")
        return format_data.format_response("5000", {
            "error": "ThaiID authentication failed",
            "message": "เกิดข้อผิดพลาดในการยืนยันตัวตนผ่าน ThaiID"
        })

def verify_thaid_api_key(api_key: str) -> bool:
    """ตรวจสอบ API Key สำหรับ ThaiID integration"""
    import os
    
    allowed_keys = [
        os.getenv("THAID_API_KEY", "thaid_integration_key_2025@mof"),
        os.getenv("FRONTEND_API_KEY", "cap_mof_live_frontend_web_2025@minerta"),
        "thaid_integration_key_2025@mof",
        "cap_mof_live_frontend_web_2025@minerta",
    ]
    
    return api_key in [k for k in allowed_keys if k and k.strip()]