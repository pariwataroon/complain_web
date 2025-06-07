from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.api.middleware.jwt_verify import verify_token
from models.comp_complaint_types import ComplaintType, ComplaintSubType, ComplaintChannel
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/complaint-references",
    tags=["complaint_references"],
)

@router.get("/complaint-channels")
async def get_complaint_channels(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """ดึงรายการช่องทางการร้องเรียนทั้งหมด"""
    try:
        channels = db.query(ComplaintChannel).filter(
            ComplaintChannel.is_active == True
        ).order_by(ComplaintChannel.name).all()
        
        # ✅ แก้ไขให้ใช้รูปแบบเดียวกับ router อื่นๆ
        items_data = [
            {
                "id": str(channel.id),
                "name": channel.name,
                "description": channel.description,
                "is_active": channel.is_active,
                "created_at": channel.created_at.isoformat() if channel.created_at else None,
                "updated_at": channel.updated_at.isoformat() if channel.updated_at else None
            } for channel in channels
        ]
        
        return format_response(
            "0000",  # ✅ ใช้รูปแบบเดียวกับ router อื่นๆ
            {
                "items": items_data,
                "total": len(channels)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting complaint channels: {str(e)}")
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดในการดึงข้อมูล")

@router.get("/complaint-types")
async def get_complaint_types(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """ดึงรายการประเภทเรื่องร้องเรียนทั้งหมด"""
    try:
        types = db.query(ComplaintType).filter(
            ComplaintType.is_active == True
        ).order_by(ComplaintType.name).all()
        
        # ✅ แก้ไขให้ใช้รูปแบบเดียวกับ router อื่นๆ
        items_data = [
            {
                "id": str(type.id),
                "name": type.name,
                "description": type.description,
                "is_active": type.is_active,
                "created_at": type.created_at.isoformat() if type.created_at else None,
                "updated_at": type.updated_at.isoformat() if type.updated_at else None
            } for type in types
        ]
        
        return format_response(
            "0000",  # ✅ ใช้รูปแบบเดียวกับ router อื่นๆ
            {
                "items": items_data,
                "total": len(types)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting complaint types: {str(e)}")
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดในการดึงข้อมูล")

@router.get("/complaint-subtypes")
async def get_complaint_subtypes(
    parent_type_id: Optional[UUID] = Query(None, description="UUID ของประเภทหลัก"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """ดึงรายการประเภทย่อยเรื่องร้องเรียน (ตัวกรองตาม parent_type_id ได้)"""
    try:
        query = db.query(ComplaintSubType).filter(ComplaintSubType.is_active == True)
        
        if parent_type_id:
            query = query.filter(ComplaintSubType.parent_type_id == parent_type_id)
            
        subtypes = query.order_by(ComplaintSubType.name).all()
        
        # ✅ แก้ไขให้ใช้รูปแบบเดียวกับ router อื่นๆ
        items_data = [
            {
                "id": str(subtype.id),
                "parent_type_id": str(subtype.parent_type_id),
                "parent_type": {
                    "id": str(subtype.parent_type.id),
                    "name": subtype.parent_type.name
                } if subtype.parent_type else None,
                "name": subtype.name,
                "description": subtype.description,
                "is_active": subtype.is_active,
                "created_at": subtype.created_at.isoformat() if subtype.created_at else None,
                "updated_at": subtype.updated_at.isoformat() if subtype.updated_at else None
            } for subtype in subtypes
        ]
        
        return format_response(
            "0000",  # ✅ ใช้รูปแบบเดียวกับ router อื่นๆ
            {
                "items": items_data,
                "total": len(subtypes)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting complaint subtypes: {str(e)}")
        raise HTTPException(status_code=500, detail="เกิดข้อผิดพลาดในการดึงข้อมูล")