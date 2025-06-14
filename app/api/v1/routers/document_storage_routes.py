from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from config.database import get_db
from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.document_storage_controller import (
    get_document_storage_by_channel,
    get_document_storage_statistics,
    get_document_storage_filters
)
import lib.format_data as format_data

router = APIRouter(prefix="/document-storage", tags=["document_storage"])

@router.get("")
async def get_document_storage(
    page_type: str = Query("website", description="ประเภทหน้า: 'website' หรือ 'card'"),
    skip: int = Query(0, description="จำนวนที่ข้าม"),
    limit: int = Query(100, description="จำนวนต่อหน้า"),
    status: Optional[str] = Query(None, description="สถานะ"),
    complaint_type: Optional[str] = Query(None, description="ประเภทเรื่องร้องเรียน"),
    complaint_subtype: Optional[str] = Query(None, description="ประเภทเรื่องร้องเรียนย่อย"),
    assignee: Optional[str] = Query(None, description="ผู้รับผิดชอบ"),
    location: Optional[str] = Query(None, description="สถานที่"),
    urgency: Optional[str] = Query(None, description="ความเร่งด่วน"),
    search: Optional[str] = Query(None, description="คำค้นหา"),
    complainant_name: Optional[str] = Query(None, description="ชื่อผู้ร้องเรียน"),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """ดึงข้อมูลคลังเอกสารแบ่งตามช่องทาง"""
    try:
        result = get_document_storage_by_channel(
            db=db,
            page_type=page_type,
            skip=skip,
            limit=limit,
            status=status,
            complaint_type=complaint_type,
            complaint_subtype=complaint_subtype,
            assignee=assignee,
            location=location,
            urgency=urgency,
            search=search,
            complainant_name=complainant_name
        )
        
        if "error" in result:
            return format_data.format_response("5000", {
                "error": result["error"],
                "message": "INTERNAL_SERVER_ERROR"
            })
        
        return format_data.format_response("0000", {
            "data": result,
            "message": "GET_DATA_SUCCESSFULLY"
        })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })

@router.get("/statistics")
async def get_statistics(
    page_type: str = Query("website", description="ประเภทหน้า: 'website' หรือ 'card'"),
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """ดึงสถิติคลังเอกสาร"""
    try:
        result = get_document_storage_statistics(db=db, page_type=page_type)
        
        if "error" in result:
            return format_data.format_response("5000", {
                "error": result["error"],
                "message": "INTERNAL_SERVER_ERROR"
            })
        
        return format_data.format_response("0000", {
            "data": result,
            "message": "GET_STATISTICS_SUCCESSFULLY"
        })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })

@router.get("/filters")
async def get_filters(
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """ดึงตัวเลือกสำหรับ filter"""
    try:
        result = get_document_storage_filters(db=db)
        
        if "error" in result:
            return format_data.format_response("5000", {
                "error": result["error"],
                "message": "INTERNAL_SERVER_ERROR"
            })
        
        return format_data.format_response("0000", {
            "data": result,
            "message": "GET_FILTERS_SUCCESSFULLY"
        })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })