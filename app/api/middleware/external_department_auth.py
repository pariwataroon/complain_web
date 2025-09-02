"""
Enhanced Authentication Middleware for External Departments
รองรับ API Key + Secret Key, IP Whitelist, Rate Limiting, และ Endpoint Access Control
"""

import hashlib
import hmac
import time
import json
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_

from config.database import get_db
from models.project_api_key import ProjectApiKey
from models.outside_departments import OutsideDepartment
from models.api_log import ApiLog
from lib.logger import get_logger

logger = get_logger("external_department_auth")


class ExternalDepartmentAuth:
    """Authentication handler สำหรับหน่วยงานภายนอก"""
    
    def __init__(self):
        self.rate_limit_cache = {}  # {api_key: {"count": int, "reset_time": timestamp}}
    
    def verify_hmac_signature(self, 
                            api_key: str, 
                            api_secret: str, 
                            timestamp: str, 
                            body: str, 
                            signature: str) -> bool:
        """ตรวจสอบ HMAC signature เพื่อความปลอดภัย"""
        try:
            # สร้าง message สำหรับ HMAC
            message = f"{api_key}{timestamp}{body}"
            
            # คำนวณ HMAC-SHA256
            expected_signature = hmac.new(
                api_secret.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # เปรียบเทียบ signature
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"HMAC verification error: {str(e)}")
            return False
    
    def check_timestamp(self, timestamp: str, tolerance_minutes: int = 5) -> bool:
        """ตรวจสอบ timestamp เพื่อป้องกัน replay attack"""
        try:
            request_time = datetime.fromtimestamp(int(timestamp))
            current_time = datetime.now()
            time_diff = abs((current_time - request_time).total_seconds())
            
            return time_diff <= (tolerance_minutes * 60)
        except:
            return False
    
    def check_ip_whitelist(self, client_ip: str, allowed_ips: str) -> bool:
        """ตรวจสอบ IP whitelist"""
        if not allowed_ips:
            return True  # ไม่จำกัด IP
        
        allowed_list = [ip.strip() for ip in allowed_ips.split(',')]
        return client_ip in allowed_list
    
    def check_rate_limit(self, api_key: str, limit_per_minute: int) -> bool:
        """ตรวจสอบ rate limiting"""
        current_time = int(time.time())
        minute_key = current_time // 60  # แบ่งเป็นช่วงนาที
        
        cache_key = f"{api_key}_{minute_key}"
        
        if cache_key not in self.rate_limit_cache:
            self.rate_limit_cache[cache_key] = 0
        
        self.rate_limit_cache[cache_key] += 1
        
        # ลบ cache เก่า (เก็บไว้แค่ 2 นาที)
        old_keys = [k for k in self.rate_limit_cache.keys() 
                   if int(k.split('_')[1]) < minute_key - 1]
        for old_key in old_keys:
            del self.rate_limit_cache[old_key]
        
        return self.rate_limit_cache[cache_key] <= limit_per_minute
    
    def check_endpoint_access(self, endpoint: str, allowed_endpoints: str) -> bool:
        """ตรวจสอบการเข้าถึง endpoint"""
        if not allowed_endpoints:
            return True  # ไม่จำกัด endpoint
        
        allowed_list = [ep.strip() for ep in allowed_endpoints.split(',')]
        
        # ตรวจสอบ exact match หรือ pattern match
        for allowed in allowed_list:
            if allowed.endswith('*'):
                # Wildcard pattern
                if endpoint.startswith(allowed[:-1]):
                    return True
            elif endpoint == allowed:
                # Exact match
                return True
        
        return False
    
    async def authenticate_external_department(self, 
                                             request: Request, 
                                             db: Session) -> Dict:
        """Main authentication function สำหรับหน่วยงานภายนอก"""
        
        # 1. ดึง headers ที่จำเป็น
        api_key = request.headers.get("X-API-Key")
        api_signature = request.headers.get("X-API-Signature")
        api_timestamp = request.headers.get("X-API-Timestamp")
        
        if not all([api_key, api_signature, api_timestamp]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing required headers: X-API-Key, X-API-Signature, X-API-Timestamp"
            )
        
        # 2. ดึงข้อมูล API Key จากฐานข้อมูล
        api_key_record = db.query(ProjectApiKey).filter(
            and_(
                ProjectApiKey.api_key == api_key,
                ProjectApiKey.is_active == True,
                ProjectApiKey.api_type == "external_department"
            )
        ).first()
        
        if not api_key_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or inactive API key"
            )
        
        # 3. ตรวจสอบ expiration
        if api_key_record.expires_at and api_key_record.expires_at < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired"
            )
        
        # 4. ตรวจสอบ timestamp (ป้องกัน replay attack)
        if not self.check_timestamp(api_timestamp):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid timestamp or request too old"
            )
        
        # 5. ตรวจสอบ IP whitelist
        client_ip = request.client.host
        if not self.check_ip_whitelist(client_ip, api_key_record.allowed_ips):
            logger.warning(f"IP access denied: {client_ip} for API key: {api_key}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="IP address not allowed"
            )
        
        # 6. ตรวจสอบ rate limiting
        if not self.check_rate_limit(api_key, api_key_record.rate_limit_per_minute):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )
        
        # 7. ตรวจสอบ endpoint access
        endpoint_path = request.url.path
        if not self.check_endpoint_access(endpoint_path, api_key_record.allowed_endpoints):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Endpoint access not allowed"
            )
        
        # 8. ตรวจสอบ HMAC signature
        body = await request.body()
        body_str = body.decode('utf-8') if body else ""
        
        if not self.verify_hmac_signature(
            api_key, 
            api_key_record.api_secret, 
            api_timestamp, 
            body_str, 
            api_signature
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )
        
        # 9. อัพเดทข้อมูลการใช้งาน
        api_key_record.last_used_at = datetime.now()
        api_key_record.last_used_ip = client_ip
        api_key_record.usage_count += 1
        db.commit()
        
        # 10. บันทึก audit log
        try:
            audit_log = ApiLog(
                user_id=None,  # ไม่ใช่ user ปกติ
                endpoint=endpoint_path,
                method=request.method,
                status_code=200,
                response_time=0,  # จะอัพเดทภายหลัง
                user_agent=request.headers.get("User-Agent"),
                ip_address=client_ip,
                request_data={"api_key_id": str(api_key_record.id), "department_id": str(api_key_record.department_id)},
                created_at=datetime.now()
            )
            db.add(audit_log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log API usage: {str(e)}")
        
        # 11. ส่งคืนข้อมูล authentication
        department = None
        if api_key_record.department_id:
            department = db.query(OutsideDepartment).filter(
                OutsideDepartment.id == api_key_record.department_id
            ).first()
        
        return {
            "api_key_id": api_key_record.id,
            "project_name": api_key_record.project_name,
            "department_id": api_key_record.department_id,
            "department_name": department.name if department else None,
            "api_type": api_key_record.api_type,
            "client_ip": client_ip
        }


# สร้าง instance ของ authentication handler
external_auth = ExternalDepartmentAuth()


# Dependency function สำหรับใช้ใน FastAPI routes
async def verify_external_department(
    request: Request,
    db: Session = Depends(get_db)
) -> Dict:
    """FastAPI dependency สำหรับ external department authentication"""
    return await external_auth.authenticate_external_department(request, db)


# Decorator สำหรับ endpoints ที่ต้องการ authentication แบบผสม
def require_external_or_internal_auth():
    """Decorator ที่อนุญาตทั้ง external department auth และ JWT auth"""
    
    async def dependency(request: Request, db: Session = Depends(get_db)):
        # ลองใช้ external department auth ก่อน
        api_key = request.headers.get("X-API-Key")
        authorization = request.headers.get("Authorization")
        
        if api_key and request.headers.get("X-API-Signature"):
            # ใช้ external department authentication
            try:
                return await external_auth.authenticate_external_department(request, db)
            except HTTPException:
                # ถ้า external auth ล้มเหลว ให้ลอง JWT
                pass
        
        if authorization and authorization.startswith("Bearer "):
            # ใช้ JWT authentication
            from app.api.middleware.jwt_verify import verify_token
            try:
                user_id = verify_token(authorization.replace("Bearer ", ""), db)
                return {
                    "auth_type": "jwt",
                    "user_id": user_id,
                    "department_id": None,
                    "department_name": None
                }
            except HTTPException:
                pass
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid authentication required (API Key + Signature or JWT Token)"
        )
    
    return dependency
