from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from datetime import datetime

from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.document_storage_controller import (
    get_document_storage_by_channel,
    get_document_storage_statistics,
    get_document_storage_filters,
    get_document_storage_detail
)
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/document-storage",
    tags=["document_storage"],
)

@router.get("", response_model=FormatResponseModel)
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
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลคลังเอกสารแบ่งตามช่องทาง (แบบสรุป - สำหรับ listing)
    
    หมายเหตุ: endpoint นี้ให้ข้อมูลสรุปเท่านั้น ไม่รวม all_related เพื่อ performance
    สำหรับรายละเอียดเต็มของแต่ละเรื่อง ให้ใช้ GET /document-storage/{complaint_id}
    """
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
        
        return format_response("0000", result)
        
    except Exception as e:
        return format_response("5000", {
            "error": str(e)
        })

@router.get("/statistics", response_model=FormatResponseModel)
async def get_statistics(
    page_type: str = Query("website", description="ประเภทหน้า: 'website' หรือ 'card'"),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงสถิติคลังเอกสาร"""
    try:
        result = get_document_storage_statistics(db=db, page_type=page_type)
        return format_response("0000", result)
        
    except Exception as e:
        return format_response("5000", {
            "error": str(e)
        })

@router.get("/filters", response_model=FormatResponseModel)
async def get_filters(
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงตัวเลือกสำหรับ filter"""
    try:
        result = get_document_storage_filters(db=db)
        return format_response("0000", result)
        
    except Exception as e:
        return format_response("5000", {
            "error": str(e)
        })

@router.get("/{complaint_id}", response_model=FormatResponseModel)
async def get_document_storage_detail_by_id(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายละเอียดเต็มของ complaint เดียว รวมถึงความสัมพันธ์ทั้งหมด"""
    try:
        result = get_document_storage_detail(db=db, complaint_id=complaint_id)
        
        if "error" in result and result["detail"] is None:
            return format_response("4000", {
                "error": result["error"],
                "message": "ไม่พบข้อมูลเรื่องร้องเรียนที่ระบุ"
            })
        
        return format_response("0000", result)
        
    except Exception as e:
        return format_response("5000", {
            "error": str(e)
        })