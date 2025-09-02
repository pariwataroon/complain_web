"""
External Department API Key Management
เครื่องมือสำหรับสร้างและจัดการ API Keys สำหรับหน่วยงานภายนอก
รองรับ Enhanced Security Features
"""

import secrets
import hashlib
import uuid
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from models.project_api_key import ProjectApiKey
from models.outside_departments import OutsideDepartment
from lib.logger import get_logger

logger = get_logger("external_api_key_manager")


class ExternalApiKeyManager:
    """จัดการ API Keys สำหรับหน่วยงานภายนอก"""
    
    @staticmethod
    def generate_secure_api_key(prefix: str = "ext_dept") -> str:
        """สร้าง API Key ที่ปลอดภัย"""
        # สร้าง random bytes แล้วแปลงเป็น base64
        random_bytes = secrets.token_bytes(32)  # 256 bits
        key_suffix = base64.urlsafe_b64encode(random_bytes).decode('utf-8').rstrip('=')
        
        # เพิ่ม timestamp เพื่อให้ unique
        timestamp = str(int(datetime.now().timestamp()))
        
        return f"{prefix}_{timestamp}_{key_suffix}"
    
    @staticmethod
    def generate_secure_secret() -> str:
        """สร้าง Secret Key สำหรับ HMAC"""
        # สร้าง secret ขนาด 64 bytes (512 bits)
        secret_bytes = secrets.token_bytes(64)
        return base64.urlsafe_b64encode(secret_bytes).decode('utf-8').rstrip('=')
    
    @staticmethod
    def create_department_api_key(
        db: Session,
        department_id: uuid.UUID,
        project_name: str,
        description: str = None,
        expires_days: int = 365,
        allowed_ips: List[str] = None,
        rate_limit_per_minute: int = 30,
        allowed_endpoints: List[str] = None
    ) -> Dict:
        """
        สร้าง API Key สำหรับหน่วยงานภายนอก
        
        Args:
            department_id: ID ของหน่วยงานภายนอก
            project_name: ชื่อโปรเจค/ระบบที่จะใช้
            expires_days: จำนวนวันที่ API key จะหมดอายุ
            allowed_ips: รายการ IP ที่อนุญาต
            rate_limit_per_minute: จำกัดจำนวน requests ต่อนาที
            allowed_endpoints: endpoints ที่อนุญาตให้เข้าถึง
        """
        try:
            # ตรวจสอบว่าหน่วยงานมีอยู่จริง
            department = db.query(OutsideDepartment).filter(
                OutsideDepartment.id == department_id,
                OutsideDepartment.is_active == True
            ).first()
            
            if not department:
                raise ValueError("Department not found or inactive")
            
            # สร้าง API Key และ Secret
            api_key = ExternalApiKeyManager.generate_secure_api_key("ext_dept")
            api_secret = ExternalApiKeyManager.generate_secure_secret()
            
            # กำหนด endpoints ที่อนุญาตโดยเริ่มต้น
            if allowed_endpoints is None:
                allowed_endpoints = [
                    "/api/v1/external/complaints",
                    "/api/v1/external/complaints/*",
                    "/api/v1/external/department/info",
                    "/api/v1/external/auth/test"
                ]
            
            # สร้าง record ในฐานข้อมูล
            api_key_record = ProjectApiKey(
                project_name=project_name,
                api_key=api_key,
                api_secret=api_secret,
                description=description or f"API access for {department.name}",
                api_type="external_department",
                department_id=department_id,
                allowed_ips=",".join(allowed_ips) if allowed_ips else None,
                rate_limit_per_minute=rate_limit_per_minute,
                expires_at=datetime.now() + timedelta(days=expires_days),
                allowed_endpoints=",".join(allowed_endpoints),
                usage_count=0,
                is_active=True
            )
            
            db.add(api_key_record)
            db.commit()
            
            logger.info(f"Created API key for department {department.name} (ID: {department_id})")
            
            return {
                "api_key_id": str(api_key_record.id),
                "api_key": api_key,
                "api_secret": api_secret,
                "department_name": department.name,
                "project_name": project_name,
                "expires_at": api_key_record.expires_at.isoformat(),
                "rate_limit_per_minute": rate_limit_per_minute,
                "allowed_endpoints": allowed_endpoints,
                "allowed_ips": allowed_ips,
                "usage_instructions": {
                    "authentication_method": "HMAC-SHA256",
                    "required_headers": [
                        "X-API-Key: {api_key}",
                        "X-API-Timestamp: {unix_timestamp}",
                        "X-API-Signature: {hmac_signature}"
                    ],
                    "signature_calculation": "HMAC-SHA256(api_secret, api_key + timestamp + request_body)"
                }
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create API key: {str(e)}")
            raise
    
    @staticmethod
    def regenerate_secret(db: Session, api_key_id: uuid.UUID) -> Dict:
        """สร้าง Secret ใหม่สำหรับ API Key ที่มีอยู่"""
        try:
            api_key_record = db.query(ProjectApiKey).filter(
                ProjectApiKey.id == api_key_id,
                ProjectApiKey.api_type == "external_department"
            ).first()
            
            if not api_key_record:
                raise ValueError("API key not found")
            
            # สร้าง secret ใหม่
            new_secret = ExternalApiKeyManager.generate_secure_secret()
            api_key_record.api_secret = new_secret
            api_key_record.updated_at = datetime.now()
            
            db.commit()
            
            logger.info(f"Regenerated secret for API key: {api_key_record.project_name}")
            
            return {
                "api_key": api_key_record.api_key,
                "api_secret": new_secret,
                "updated_at": api_key_record.updated_at.isoformat(),
                "message": "Secret regenerated successfully. Please update your application configuration."
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to regenerate secret: {str(e)}")
            raise
    
    @staticmethod
    def update_security_settings(
        db: Session,
        api_key_id: uuid.UUID,
        allowed_ips: List[str] = None,
        rate_limit_per_minute: int = None,
        allowed_endpoints: List[str] = None,
        expires_days: int = None
    ) -> Dict:
        """อัพเดทการตั้งค่าความปลอดภัย"""
        try:
            api_key_record = db.query(ProjectApiKey).filter(
                ProjectApiKey.id == api_key_id,
                ProjectApiKey.api_type == "external_department"
            ).first()
            
            if not api_key_record:
                raise ValueError("API key not found")
            
            # อัพเดทการตั้งค่า
            if allowed_ips is not None:
                api_key_record.allowed_ips = ",".join(allowed_ips) if allowed_ips else None
            
            if rate_limit_per_minute is not None:
                api_key_record.rate_limit_per_minute = rate_limit_per_minute
            
            if allowed_endpoints is not None:
                api_key_record.allowed_endpoints = ",".join(allowed_endpoints) if allowed_endpoints else None
            
            if expires_days is not None:
                api_key_record.expires_at = datetime.now() + timedelta(days=expires_days)
            
            api_key_record.updated_at = datetime.now()
            db.commit()
            
            return {
                "message": "Security settings updated successfully",
                "updated_at": api_key_record.updated_at.isoformat(),
                "settings": {
                    "allowed_ips": allowed_ips,
                    "rate_limit_per_minute": api_key_record.rate_limit_per_minute,
                    "allowed_endpoints": allowed_endpoints,
                    "expires_at": api_key_record.expires_at.isoformat() if api_key_record.expires_at else None
                }
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update security settings: {str(e)}")
            raise
    
    @staticmethod
    def get_department_api_keys(db: Session, department_id: uuid.UUID) -> List[Dict]:
        """ดึงรายการ API Keys ของหน่วยงาน"""
        try:
            api_keys = db.query(ProjectApiKey).filter(
                ProjectApiKey.department_id == department_id,
                ProjectApiKey.api_type == "external_department"
            ).all()
            
            result = []
            for key in api_keys:
                # ซ่อน secret key เพื่อความปลอดภัย
                masked_secret = key.api_secret[:8] + "..." + key.api_secret[-8:] if key.api_secret else None
                
                result.append({
                    "id": str(key.id),
                    "project_name": key.project_name,
                    "api_key": key.api_key,
                    "api_secret_masked": masked_secret,
                    "description": key.description,
                    "is_active": key.is_active,
                    "created_at": key.created_at.isoformat(),
                    "expires_at": key.expires_at.isoformat() if key.expires_at else None,
                    "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
                    "usage_count": key.usage_count,
                    "rate_limit_per_minute": key.rate_limit_per_minute,
                    "allowed_ips": key.allowed_ips.split(",") if key.allowed_ips else [],
                    "allowed_endpoints": key.allowed_endpoints.split(",") if key.allowed_endpoints else []
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get department API keys: {str(e)}")
            raise
    
    @staticmethod
    def generate_usage_report(db: Session, api_key_id: uuid.UUID, days: int = 30) -> Dict:
        """สร้างรายงานการใช้งาน API"""
        try:
            from models.api_log import ApiLog
            
            api_key_record = db.query(ProjectApiKey).filter(
                ProjectApiKey.id == api_key_id
            ).first()
            
            if not api_key_record:
                raise ValueError("API key not found")
            
            # ดึงข้อมูล usage logs (ถ้ามี)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # สร้างรายงาน
            report = {
                "api_key_info": {
                    "project_name": api_key_record.project_name,
                    "department_id": str(api_key_record.department_id) if api_key_record.department_id else None,
                    "created_at": api_key_record.created_at.isoformat(),
                    "total_usage_count": api_key_record.usage_count
                },
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "days": days
                },
                "security_status": {
                    "is_active": api_key_record.is_active,
                    "expires_at": api_key_record.expires_at.isoformat() if api_key_record.expires_at else None,
                    "is_expired": api_key_record.expires_at < datetime.now() if api_key_record.expires_at else False,
                    "last_used_at": api_key_record.last_used_at.isoformat() if api_key_record.last_used_at else None,
                    "last_used_ip": api_key_record.last_used_ip
                },
                "configuration": {
                    "rate_limit_per_minute": api_key_record.rate_limit_per_minute,
                    "allowed_ips": api_key_record.allowed_ips.split(",") if api_key_record.allowed_ips else [],
                    "allowed_endpoints": api_key_record.allowed_endpoints.split(",") if api_key_record.allowed_endpoints else []
                }
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate usage report: {str(e)}")
            raise


# Sample usage และ migration script
class ExternalDepartmentSetup:
    """ตัวอย่างการตั้งค่าระบบสำหรับหน่วยงานภายนอก"""
    
    @staticmethod
    def setup_department_with_api_access(
        db: Session,
        department_name: str,
        department_description: str,
        api_project_name: str,
        contact_ips: List[str] = None
    ) -> Dict:
        """
        ตั้งค่าหน่วยงานภายนอกพร้อม API access
        """
        try:
            # 1. สร้างหน่วยงานภายนอก (ถ้ายังไม่มี)
            department = db.query(OutsideDepartment).filter(
                OutsideDepartment.name == department_name
            ).first()
            
            if not department:
                department = OutsideDepartment(
                    name=department_name,
                    description=department_description,
                    is_active=True
                )
                db.add(department)
                db.flush()  # เพื่อให้ได้ ID
            
            # 2. สร้าง API Key
            api_key_result = ExternalApiKeyManager.create_department_api_key(
                db=db,
                department_id=department.id,
                project_name=api_project_name,
                description=f"API access for {department_name}",
                expires_days=365,
                allowed_ips=contact_ips,
                rate_limit_per_minute=30
            )
            
            db.commit()
            
            return {
                "department": {
                    "id": str(department.id),
                    "name": department.name,
                    "description": department.description
                },
                "api_access": api_key_result,
                "setup_completed": True
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to setup department: {str(e)}")
            raise
