from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from config.database import get_db
from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.consolidated_report_controller import (
    get_consolidated_reports,
    get_consolidated_report_by_id,
    get_consolidated_report_options,
    get_complaint_document_timeline
)
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/consolidated-reports",
    tags=["consolidated_reports"],
)

@router.get("", response_model=FormatResponseModel)
def get_all_consolidated_reports(
    skip: int = Query(0, ge=0, description="จำนวนรายการที่ข้าม"),
    limit: int = Query(100, ge=1, le=1000, description="จำนวนรายการต่อหน้า"),
    search: Optional[str] = Query(None, description="ค้นหาจากหมายเลขข้อร้องเรียน, เรื่อง, เลขอ้างอิง"),
    status: Optional[str] = Query(None, description="สถานะเรื่องร้องเรียน"),
    department_id: Optional[UUID] = Query(None, description="หน่วยงาน (UUID)"),
    report_type: Optional[str] = Query(None, description="ประเภทรายงาน (all, with_reports, with_additional_refs)"),
    date_from: Optional[str] = Query(None, description="วันที่เริ่มต้น (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="วันที่สิ้นสุด (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    ดึงรายการรายงานรวมทั้งหมด - รวมเรื่องร้องเรียน, เอกสารส่งออก, และเลขอ้างอิงเพิ่มเติม
    
    **Filter Options:**
    - search: ค้นหาจากหมายเลขข้อร้องเรียน, เรื่อง, เลขอ้างอิงเพิ่มเติม
    - status: กรองตามสถานะเรื่องร้องเรียน
    - department_id: กรองตามหน่วยงาน
    - report_type: กรองตามประเภทรายงาน
      - all: ทั้งหมด
      - with_reports: เฉพาะที่มีเอกสารส่งออก
      - with_additional_refs: เฉพาะที่มีเลขอ้างอิงเพิ่มเติม
    - date_from/date_to: กรองตามช่วงวันที่
    """
    try:
        # แปลงวันที่
        date_from_obj = None
        date_to_obj = None
        
        if date_from:
            date_from_obj = datetime.strptime(date_from, "%Y-%m-%d")
        if date_to:
            date_to_obj = datetime.strptime(date_to, "%Y-%m-%d")
        
        result = get_consolidated_reports(
            db=db,
            skip=skip,
            limit=limit,
            search=search,
            status=status,
            department_id=department_id,
            report_type=report_type,
            date_from=date_from_obj,
            date_to=date_to_obj
        )
        
        return format_response(
            "ดึงรายการรายงานรวมสำเร็จ",
            result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

@router.get("/options", response_model=FormatResponseModel)
def get_consolidated_report_filter_options(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    ดึงตัวเลือกสำหรับ dropdown ต่างๆ ในหน้ากรองข้อมูล
    
    **Returns:**
    - departments: รายการหน่วยงาน
    - users: รายการผู้ใช้
    - statuses: รายการสถานะ
    - report_types: รายการประเภทรายงาน
    """
    try:
        result = get_consolidated_report_options(db)
        
        return format_response(
            "ดึงตัวเลือกสำเร็จ",
            result
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

@router.get("/{complaint_id}", response_model=FormatResponseModel)
def get_consolidated_report_detail(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    ดึงรายละเอียดรายงานรวมตาม ID เรื่องร้องเรียน
    
    **Returns:**
    - complaint: ข้อมูลเรื่องร้องเรียนหลัก
    - outgoing_reports: รายการเอกสารส่งออกทั้งหมด (4 ประเภท)
    - additional_references: เลขอ้างอิงเพิ่มเติม
    - related_complaints: เรื่องร้องเรียนที่เกี่ยวข้อง
    - total_documents: จำนวนเอกสารทั้งหมด
    """
    try:
        result = get_consolidated_report_by_id(db, complaint_id)
        
        return format_response(
            "ดึงรายละเอียดรายงานรวมสำเร็จ",
            result
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

@router.get("/{complaint_id}/timeline", response_model=FormatResponseModel)
def get_complaint_timeline(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    ดึง Timeline ของเอกสารทั้งหมดที่เกี่ยวข้องกับเรื่องร้องเรียน
    
    **Returns:**
    - complaint_id: ID เรื่องร้องเรียน
    - complaint_number: หมายเลขเรื่องร้องเรียน
    - timeline: รายการเอกสารเรียงตามวันที่ (ใหม่ล่าสุดก่อน)
    - total_documents: จำนวนเอกสารทั้งหมด
    
    **Timeline Items:**
    - date: วันที่สร้างเอกสาร
    - type: ประเภทเอกสาร (complaint, outgoing_report1-4)
    - title: หัวข้อเอกสาร
    - description: รายละเอียด
    - document_number: หมายเลขเอกสาร
    - id: ID ของเอกสาร
    """
    try:
        result = get_complaint_document_timeline(db, complaint_id)
        
        return format_response(
            "ดึง Timeline เอกสารสำเร็จ",
            result
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")