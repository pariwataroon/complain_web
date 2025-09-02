"""
Admin Router สำหรับจัดการ External Department API Keys
ใช้สำหรับ MOF Admin ในการสร้าง/จัดการ API Keys สำหรับหน่วยงานภายนอก
"""

from uuid import UUID
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from config.database import get_db
from app.api.middleware.permission_middleware import can_create, can_read, can_update, can_delete
from lib.external_api_key_manager import ExternalApiKeyManager, ExternalDepartmentSetup
from models.project_api_key import ProjectApiKey
from models.outside_departments import OutsideDepartment
from lib.format_data import FormatResponseModel, format_response
from lib.logger import get_logger

logger = get_logger("external_department_admin")

router = APIRouter(
    prefix="/admin/external-departments",
    tags=["admin-external-departments"],
)


# =================== Department API Key Management ===================

@router.post("/setup", response_model=FormatResponseModel)
async def setup_department_with_api_access(
    setup_data: Dict = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_access"))
):
    """
    ตั้งค่าหน่วยงานภายนอกพร้อม API access แบบครบชุด
    
    Body format:
    {
        "department_name": "กรมสรรพากร",
        "department_description": "กรมสรรพากร กระทรวงการคลัง",
        "api_project_name": "Tax Department API Access",
        "contact_ips": ["203.154.123.45", "203.154.123.46"],
        "expires_days": 365,
        "rate_limit_per_minute": 30
    }
    """
    try:
        department_name = setup_data.get("department_name")
        department_description = setup_data.get("department_description")
        api_project_name = setup_data.get("api_project_name")
        contact_ips = setup_data.get("contact_ips", [])
        expires_days = setup_data.get("expires_days", 365)
        rate_limit = setup_data.get("rate_limit_per_minute", 30)
        
        if not all([department_name, api_project_name]):
            raise HTTPException(400, "department_name and api_project_name are required")
        
        # ใช้ setup utility
        result = ExternalDepartmentSetup.setup_department_with_api_access(
            db=db,
            department_name=department_name,
            department_description=department_description or "",
            api_project_name=api_project_name,
            contact_ips=contact_ips
        )
        
        logger.info(f"Admin {current_user} set up external department: {department_name}")
        
        return format_response("0001", {
            "message": "Department and API access created successfully",
            "setup_result": result,
            "next_steps": [
                "แจ้ง API Key และ Secret ให้หน่วยงาน (ผ่านช่องทางปลอดภัย)",
                "ส่งเอกสาร API Documentation",
                "กำหนดวันทดสอบระบบ",
                "ตั้งค่า monitoring และ alerts"
            ]
        })
        
    except Exception as e:
        logger.error(f"Failed to setup department: {str(e)}")
        raise HTTPException(500, f"Setup failed: {str(e)}")


@router.post("/departments/{department_id}/api-keys", response_model=FormatResponseModel)
async def create_department_api_key(
    department_id: UUID,
    api_key_data: Dict = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_create("setting_access"))
):
    """
    สร้าง API Key ใหม่สำหรับหน่วยงานที่มีอยู่แล้ว
    
    Body format:
    {
        "project_name": "Tax Department - Production Access",
        "description": "API access for production system",
        "expires_days": 365,
        "allowed_ips": ["203.154.123.45"],
        "rate_limit_per_minute": 30,
        "allowed_endpoints": ["/api/v1/external/complaints", "/api/v1/external/complaints/*"]
    }
    """
    try:
        project_name = api_key_data.get("project_name")
        description = api_key_data.get("description", "")
        expires_days = api_key_data.get("expires_days", 365)
        allowed_ips = api_key_data.get("allowed_ips", [])
        rate_limit = api_key_data.get("rate_limit_per_minute", 30)
        allowed_endpoints = api_key_data.get("allowed_endpoints")
        
        if not project_name:
            raise HTTPException(400, "project_name is required")
        
        result = ExternalApiKeyManager.create_department_api_key(
            db=db,
            department_id=department_id,
            project_name=project_name,
            description=description,
            expires_days=expires_days,
            allowed_ips=allowed_ips,
            rate_limit_per_minute=rate_limit,
            allowed_endpoints=allowed_endpoints
        )
        
        logger.info(f"Admin {current_user} created API key for department {department_id}")
        
        return format_response("0001", {
            "message": "API key created successfully",
            "api_key_info": result,
            "security_notice": "⚠️ API Secret จะแสดงครั้งเดียวนี้เท่านั้น กรุณาเก็บรักษาอย่างปลอดภัย"
        })
        
    except Exception as e:
        logger.error(f"Failed to create API key: {str(e)}")
        raise HTTPException(500, f"API key creation failed: {str(e)}")


@router.get("/departments/{department_id}/api-keys", response_model=FormatResponseModel)
async def get_department_api_keys(
    department_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงรายการ API Keys ของหน่วยงาน"""
    try:
        api_keys = ExternalApiKeyManager.get_department_api_keys(db, department_id)
        
        # ดึงข้อมูลหน่วยงาน
        department = db.query(OutsideDepartment).filter(
            OutsideDepartment.id == department_id
        ).first()
        
        if not department:
            raise HTTPException(404, "Department not found")
        
        return format_response("0000", {
            "department": {
                "id": str(department.id),
                "name": department.name,
                "description": department.description
            },
            "api_keys": api_keys,
            "total_keys": len(api_keys)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get API keys: {str(e)}")
        raise HTTPException(500, "Failed to retrieve API keys")


@router.put("/api-keys/{api_key_id}/security", response_model=FormatResponseModel)
async def update_api_key_security_settings(
    api_key_id: UUID,
    security_data: Dict = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_access"))
):
    """
    อัพเดทการตั้งค่าความปลอดภัยของ API Key
    
    Body format:
    {
        "allowed_ips": ["203.154.123.45", "203.154.123.46"],
        "rate_limit_per_minute": 60,
        "allowed_endpoints": ["/api/v1/external/complaints", "/api/v1/external/complaints/*"],
        "expires_days": 730
    }
    """
    try:
        allowed_ips = security_data.get("allowed_ips")
        rate_limit = security_data.get("rate_limit_per_minute")
        allowed_endpoints = security_data.get("allowed_endpoints")
        expires_days = security_data.get("expires_days")
        
        result = ExternalApiKeyManager.update_security_settings(
            db=db,
            api_key_id=api_key_id,
            allowed_ips=allowed_ips,
            rate_limit_per_minute=rate_limit,
            allowed_endpoints=allowed_endpoints,
            expires_days=expires_days
        )
        
        logger.info(f"Admin {current_user} updated security settings for API key {api_key_id}")
        
        return format_response("0002", result)
        
    except Exception as e:
        logger.error(f"Failed to update security settings: {str(e)}")
        raise HTTPException(500, f"Security update failed: {str(e)}")


@router.post("/api-keys/{api_key_id}/regenerate-secret", response_model=FormatResponseModel)
async def regenerate_api_secret(
    api_key_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_access"))
):
    """สร้าง API Secret ใหม่ (ใช้เมื่อ Secret รั่วไหลหรือต้องการเปลี่ยน)"""
    try:
        result = ExternalApiKeyManager.regenerate_secret(db, api_key_id)
        
        logger.warning(f"Admin {current_user} regenerated secret for API key {api_key_id}")
        
        return format_response("0002", {
            "message": "API Secret regenerated successfully",
            "secret_info": result,
            "important_notice": "⚠️ Secret เก่าจะใช้งานไม่ได้ทันที กรุณาแจ้งหน่วยงานให้อัพเดทการตั้งค่า"
        })
        
    except Exception as e:
        logger.error(f"Failed to regenerate secret: {str(e)}")
        raise HTTPException(500, f"Secret regeneration failed: {str(e)}")


@router.patch("/api-keys/{api_key_id}/status", response_model=FormatResponseModel)
async def toggle_api_key_status(
    api_key_id: UUID,
    status_data: Dict = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("setting_access"))
):
    """เปิด/ปิดการใช้งาน API Key"""
    try:
        is_active = status_data.get("is_active")
        if is_active is None:
            raise HTTPException(400, "is_active field is required")
        
        api_key_record = db.query(ProjectApiKey).filter(
            ProjectApiKey.id == api_key_id,
            ProjectApiKey.api_type == "external_department"
        ).first()
        
        if not api_key_record:
            raise HTTPException(404, "API key not found")
        
        api_key_record.is_active = is_active
        api_key_record.updated_at = datetime.now()
        db.commit()
        
        action = "activated" if is_active else "deactivated"
        logger.info(f"Admin {current_user} {action} API key {api_key_id}")
        
        return format_response("0002", {
            "message": f"API key {action} successfully",
            "api_key_id": str(api_key_id),
            "is_active": is_active,
            "updated_at": api_key_record.updated_at.isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle API key status: {str(e)}")
        raise HTTPException(500, "Status update failed")


@router.get("/api-keys/{api_key_id}/usage-report", response_model=FormatResponseModel)
async def get_api_key_usage_report(
    api_key_id: UUID,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """สร้างรายงานการใช้งาน API Key"""
    try:
        report = ExternalApiKeyManager.generate_usage_report(db, api_key_id, days)
        
        return format_response("0000", {
            "usage_report": report,
            "generated_by": current_user,
            "generated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to generate usage report: {str(e)}")
        raise HTTPException(500, "Report generation failed")


# =================== Bulk Operations ===================

@router.get("/all-api-keys", response_model=FormatResponseModel)
async def get_all_external_api_keys(
    skip: int = 0,
    limit: int = 50,
    is_active: Optional[bool] = None,
    department_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงรายการ API Keys ทั้งหมดของหน่วยงานภายนอก"""
    try:
        query = db.query(ProjectApiKey).filter(
            ProjectApiKey.api_type == "external_department"
        )
        
        if is_active is not None:
            query = query.filter(ProjectApiKey.is_active == is_active)
        
        if department_name:
            query = query.join(OutsideDepartment).filter(
                OutsideDepartment.name.contains(department_name)
            )
        
        total = query.count()
        api_keys = query.offset(skip).limit(limit).all()
        
        result_list = []
        for key in api_keys:
            department = db.query(OutsideDepartment).filter(
                OutsideDepartment.id == key.department_id
            ).first() if key.department_id else None
            
            result_list.append({
                "id": str(key.id),
                "project_name": key.project_name,
                "api_key": key.api_key,
                "department": {
                    "id": str(department.id) if department else None,
                    "name": department.name if department else None
                },
                "is_active": key.is_active,
                "created_at": key.created_at.isoformat(),
                "expires_at": key.expires_at.isoformat() if key.expires_at else None,
                "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
                "usage_count": key.usage_count,
                "rate_limit": key.rate_limit_per_minute
            })
        
        return format_response("0000", {
            "api_keys": result_list,
            "pagination": {
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_more": (skip + limit) < total
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to get all API keys: {str(e)}")
        raise HTTPException(500, "Failed to retrieve API keys")


@router.post("/bulk-operations/expire-unused", response_model=FormatResponseModel)
async def expire_unused_api_keys(
    operation_data: Dict = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("setting_access"))
):
    """
    ปิดการใช้งาน API Keys ที่ไม่ได้ใช้เป็นเวลานาน
    
    Body format:
    {
        "unused_days": 90,
        "dry_run": true
    }
    """
    try:
        unused_days = operation_data.get("unused_days", 90)
        dry_run = operation_data.get("dry_run", True)
        
        cutoff_date = datetime.now() - timedelta(days=unused_days)
        
        unused_keys = db.query(ProjectApiKey).filter(
            ProjectApiKey.api_type == "external_department",
            ProjectApiKey.is_active == True,
            or_(
                ProjectApiKey.last_used_at < cutoff_date,
                ProjectApiKey.last_used_at.is_(None)
            )
        ).all()
        
        affected_keys = []
        for key in unused_keys:
            department = db.query(OutsideDepartment).filter(
                OutsideDepartment.id == key.department_id
            ).first()
            
            affected_keys.append({
                "api_key_id": str(key.id),
                "project_name": key.project_name,
                "department_name": department.name if department else "Unknown",
                "last_used_at": key.last_used_at.isoformat() if key.last_used_at else "Never",
                "created_at": key.created_at.isoformat()
            })
            
            if not dry_run:
                key.is_active = False
                key.updated_at = datetime.now()
        
        if not dry_run:
            db.commit()
            logger.warning(f"Admin {current_user} expired {len(unused_keys)} unused API keys")
        
        return format_response("0002" if not dry_run else "0000", {
            "message": f"{'Would expire' if dry_run else 'Expired'} {len(unused_keys)} unused API keys",
            "affected_keys": affected_keys,
            "criteria": f"Unused for more than {unused_days} days",
            "dry_run": dry_run
        })
        
    except Exception as e:
        logger.error(f"Failed to expire unused API keys: {str(e)}")
        if not dry_run:
            db.rollback()
        raise HTTPException(500, "Bulk operation failed")


# =================== Monitoring & Analytics ===================

@router.get("/statistics", response_model=FormatResponseModel)
async def get_external_department_statistics(
    db: Session = Depends(get_db),
    current_user: str = Depends(can_read("setting_access"))
):
    """ดึงสถิติการใช้งานของหน่วยงานภายนอกทั้งหมด"""
    try:
        # สถิติ API Keys
        total_keys = db.query(ProjectApiKey).filter(
            ProjectApiKey.api_type == "external_department"
        ).count()
        
        active_keys = db.query(ProjectApiKey).filter(
            ProjectApiKey.api_type == "external_department",
            ProjectApiKey.is_active == True
        ).count()
        
        # สถิติหน่วยงาน
        total_departments = db.query(OutsideDepartment).filter(
            OutsideDepartment.is_active == True
        ).count()
        
        departments_with_api = db.query(ProjectApiKey).filter(
            ProjectApiKey.api_type == "external_department",
            ProjectApiKey.department_id.isnot(None)
        ).distinct(ProjectApiKey.department_id).count()
        
        # สถิติการใช้งาน
        total_usage = db.query(func.sum(ProjectApiKey.usage_count)).filter(
            ProjectApiKey.api_type == "external_department"
        ).scalar() or 0
        
        # API Keys ที่ใช้งานล่าสุด
        recent_usage = db.query(ProjectApiKey).filter(
            ProjectApiKey.api_type == "external_department",
            ProjectApiKey.last_used_at.isnot(None)
        ).order_by(ProjectApiKey.last_used_at.desc()).limit(5).all()
        
        recent_list = []
        for key in recent_usage:
            department = db.query(OutsideDepartment).filter(
                OutsideDepartment.id == key.department_id
            ).first()
            
            recent_list.append({
                "project_name": key.project_name,
                "department_name": department.name if department else "Unknown",
                "last_used_at": key.last_used_at.isoformat(),
                "usage_count": key.usage_count
            })
        
        return format_response("0000", {
            "api_keys": {
                "total": total_keys,
                "active": active_keys,
                "inactive": total_keys - active_keys
            },
            "departments": {
                "total": total_departments,
                "with_api_access": departments_with_api,
                "without_api_access": total_departments - departments_with_api
            },
            "usage": {
                "total_api_calls": total_usage,
                "average_per_key": round(total_usage / max(total_keys, 1), 2)
            },
            "recent_activity": recent_list,
            "generated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Failed to generate statistics: {str(e)}")
        raise HTTPException(500, "Statistics generation failed")
