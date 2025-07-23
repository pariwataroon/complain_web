from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session


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
        logger = get_logger("api_key")
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
