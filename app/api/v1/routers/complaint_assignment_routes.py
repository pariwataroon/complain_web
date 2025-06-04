from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any

from config.database import get_db
from models.user import User
from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.complaint_assignment_controller import (
    update_complaint_assignment_data,
    get_assignment_form_data,
    link_related_complaint,
    update_complainant_data, 
    update_respondent_data, 
    search_complaint_for_reference
)
import lib.format_data as format_data

router = APIRouter(prefix="/complaints", tags=["complaint-assignment"])

@router.get("/{complaint_id}/assignment-form")
async def get_assignment_form(
    complaint_id: UUID,
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """ดึงข้อมูลสำหรับฟอร์ม Assignment"""
    try:
        result = get_assignment_form_data(db, complaint_id)
        
        if "error" in result:
            return format_data.format_response("4004", {"error": result["error"], "message": "COMPLAINT_NOT_FOUND"})
        
        return format_data.format_response("0000", {"data": result, "message": "GET_DATA_SUCCESSFULLY"})
        
    except Exception as e:
        return format_data.format_response("5000", {"error": str(e), "message": "INTERNAL_SERVER_ERROR"})

@router.put("/{complaint_id}/assignment")
async def update_assignment(
    complaint_id: UUID,
    assignment_data: Dict[str, Any],
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """อัพเดทข้อมูลการมอบหมายตามฟอร์ม"""
    try:
        result = update_complaint_assignment_data(
            db=db,
            complaint_id=complaint_id,
            assignment_data=assignment_data,
            updated_by=UUID(current_user) if isinstance(current_user, str) else current_user.id
        )
        
        if result["success"]:
            return format_data.format_response("0000", {"data": result, "message": "UPDATE_SUCCESS"})
        else:
            return format_data.format_response("4000", {"error": result["message"], "message": "UPDATE_FAILED"})
            
    except Exception as e:
        return format_data.format_response("5000", {"error": str(e), "message": "INTERNAL_SERVER_ERROR"})

@router.post("/{complaint_id}/link-related")
async def link_related_complaint_route(
    complaint_id: UUID,
    link_data: Dict[str, Any],
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """เชื่อมโยงเรื่องร้องเรียนเพิ่มเติม"""
    try:
        related_complaint_number = link_data.get("related_complaint_number")
        
        if not related_complaint_number:
            return format_data.format_response("4000", {"error": "กรุณาระบุเลขที่เรื่องร้องเรียนที่ต้องการเชื่อมโยง", "message": "MISSING_REQUIRED_FIELD"})
        
        result = link_related_complaint(
            db=db,
            main_complaint_id=complaint_id,
            related_complaint_number=related_complaint_number,
            updated_by=UUID(current_user) if isinstance(current_user, str) else current_user.id
        )
        
        if result["success"]:
            return format_data.format_response("0000", {"data": result, "message": "LINK_SUCCESS"})
        else:
            return format_data.format_response("4000", {"error": result["message"], "message": "LINK_FAILED"})
            
    except Exception as e:
        return format_data.format_response("5000", {"error": str(e), "message": "INTERNAL_SERVER_ERROR"})

@router.put("/{complaint_id}/complainant")
async def update_complainant(
    complaint_id: UUID,
    complainant_data: Dict[str, Any],
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """อัพเดทข้อมูลผู้ร้องเรียนและผู้ลงนาม"""
    try:
        result = update_complainant_data(
            db=db,
            complaint_id=complaint_id,
            complainant_data=complainant_data,
            updated_by=UUID(current_user) if isinstance(current_user, str) else current_user.id
        )
        
        if result["success"]:
            return format_data.format_response("0000", {"data": result, "message": "UPDATE_COMPLAINANT_SUCCESS"})
        else:
            return format_data.format_response("4000", {"error": result["message"], "message": "UPDATE_COMPLAINANT_FAILED"})
            
    except Exception as e:
        return format_data.format_response("5000", {"error": str(e), "message": "INTERNAL_SERVER_ERROR"})

@router.put("/{complaint_id}/respondent")
async def update_respondent(
    complaint_id: UUID,
    respondent_data: Dict[str, Any],
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """อัพเดทข้อมูลผู้ถูกร้องเรียน"""
    try:
        result = update_respondent_data(
            db=db,
            complaint_id=complaint_id,
            respondent_data=respondent_data,
            updated_by=UUID(current_user) if isinstance(current_user, str) else current_user.id
        )
        
        if result["success"]:
            return format_data.format_response("0000", {"data": result, "message": "UPDATE_RESPONDENT_SUCCESS"})
        else:
            return format_data.format_response("4000", {"error": result["message"], "message": "UPDATE_RESPONDENT_FAILED"})
            
    except Exception as e:
        return format_data.format_response("5000", {"error": str(e), "message": "INTERNAL_SERVER_ERROR"})

@router.get("/search-for-reference")
async def search_complaints_for_reference(
    q: str,
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """ค้นหาเรื่องร้องเรียนสำหรับการอ้างอิง"""
    try:
        results = search_complaint_for_reference(db, q)
        
        return format_data.format_response("0000", {"complaints": results, "message": "SEARCH_SUCCESS"})
        
    except Exception as e:
        return format_data.format_response("5000", {"error": str(e), "message": "INTERNAL_SERVER_ERROR"})