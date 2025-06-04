from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, Optional
from datetime import datetime

from config.database import get_db
from models.user import User
from app.api.middleware.jwt_verify import verify_token
from app.api.v1.controllers.complaint_assignment_controller import (
    update_complaint_assignment_data,
    get_assignment_form_data,
    link_related_complaint,
    update_complainant_data, 
    update_respondent_data, 
    search_complaint_for_reference,
    add_additional_complaint_reference,
    get_assignment_statistics,
    auto_assign_complaint,
    validate_officer_assignment,
    get_complaint_assignment_history
)
import lib.format_data as format_data

router = APIRouter(prefix="/complaints", tags=["complaint-assignment"])

@router.get("/{complaint_id}/assignment-form")
async def get_assignment_form(
    complaint_id: UUID,
    current_user: User = Depends(verify_token),
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
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """อัพเดทข้อมูลการมอบหมายตามฟอร์ม"""
    try:
        # ✅ แก้ไข: ตรวจสอบ UUID format ก่อน
        try:
            updated_by_uuid = UUID(current_user)
        except ValueError:
            return format_data.format_response("4000", {"error": "Invalid user ID format", "message": "INVALID_USER_ID"})
        
        result = update_complaint_assignment_data(
            db=db,
            complaint_id=complaint_id,
            assignment_data=assignment_data,
            updated_by=current_user.id
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

@router.get("/{complaint_id}/history")
async def get_assignment_history(
    complaint_id: UUID,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """ดูประวัติการเปลี่ยนแปลงในการมอบหมายงาน"""
    try:
        results = get_complaint_assignment_history(
            db=db,
            complaint_id=complaint_id,
            limit=20
        )
        
        return format_data.format_response("0000", {
            "data": results,
            "message": "GET_HISTORY_SUCCESS"
        })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })

@router.post("/{complaint_id}/additional-reference")
async def add_additional_reference(
    complaint_id: UUID,
    reference_data: Dict[str, Any],
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """เพิ่มเลขอ้างอิงสำหรับเรื่องร้องเรียนเพิ่มเติม"""
    try:
        reference_complaint_id = reference_data.get("reference_complaint_id")
        reference_complaint_number = reference_data.get("reference_complaint_number")
        
        if not reference_complaint_id and not reference_complaint_number:
            return format_data.format_response("4000", {
                "error": "กรุณาระบุ ID หรือเลขที่เรื่องร้องเรียนอ้างอิง",
                "message": "MISSING_REFERENCE"
            })
        
        result = add_additional_complaint_reference(
            db=db,
            complaint_id=complaint_id,
            reference_complaint_id=reference_complaint_id,
            reference_complaint_number=reference_complaint_number,
            updated_by=UUID(current_user)
        )
        
        if result["success"]:
            return format_data.format_response("0000", {
                "data": result,
                "message": "ADDITIONAL_REFERENCE_ADDED"
            })
        else:
            return format_data.format_response("4000", {
                "error": result["message"],
                "message": "ADD_REFERENCE_FAILED"
            })
            
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })
    
@router.post("/bulk-assignment")
async def bulk_assignment(
    assignment_data: Dict[str, Any],
    current_user: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """มอบหมายงานแบบ bulk หลายเรื่องพร้อมกัน"""
    try:
        complaint_ids = assignment_data.get("complaint_ids", [])
        officer_id = assignment_data.get("assigned_officer_id")
        
        if not complaint_ids:
            return format_data.format_response("4000", {
                "error": "กรุณาเลือกเรื่องร้องเรียน",
                "message": "NO_COMPLAINTS_SELECTED"
            })
        
        success_count = 0
        failed_count = 0
        results = []
        
        for complaint_id in complaint_ids:
            try:
                result = update_complaint_assignment_data(
                    db=db,
                    complaint_id=UUID(complaint_id),
                    assignment_data={"assigned_officer_id": officer_id},
                    updated_by=UUID(current_user)
                )
                
                if result["success"]:
                    success_count += 1
                else:
                    failed_count += 1
                
                results.append({
                    "complaint_id": complaint_id,
                    "success": result["success"],
                    "message": result["message"]
                })
                
            except Exception as e:
                failed_count += 1
                results.append({
                    "complaint_id": complaint_id,
                    "success": False,
                    "message": str(e)
                })
        
        return format_data.format_response("0000", {
            "summary": {
                "total": len(complaint_ids),
                "success": success_count,
                "failed": failed_count
            },
            "details": results,
            "message": "BULK_ASSIGNMENT_COMPLETED"
        })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })
    
@router.get("/statistics")
async def get_assignment_statistics(
    date_from: Optional[str] = Query(None, description="วันที่เริ่มต้น (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="วันที่สิ้นสุด (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token)
):
    """ดูสถิติการมอบหมายงาน"""
    try:
        date_from_obj = None
        date_to_obj = None
        
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from)
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to)
        
        results = get_assignment_statistics(
            db=db,
            date_from=date_from_obj,
            date_to=date_to_obj
        )
        
        return format_data.format_response("0000", {
            "data": results,
            "message": "GET_STATISTICS_SUCCESS"
        })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })

@router.post("/{complaint_id}/auto-assign")
async def auto_assign_complaint_route(
    complaint_id: UUID,
    assignment_rules: Dict[str, Any] = {},
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token)
):
    """มอบหมายงานอัตโนมัติ"""
    try:
        result = auto_assign_complaint(
            db=db,
            complaint_id=complaint_id,
            assignment_rules=assignment_rules
        )
        
        if result.get("success"):
            return format_data.format_response("0000", {
                "data": result,
                "message": "AUTO_ASSIGN_SUCCESS"
            })
        else:
            return format_data.format_response("4000", {
                "error": result.get("message"),
                "message": "AUTO_ASSIGN_FAILED"
            })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })

@router.post("/validate-officer")
async def validate_officer_assignment_route(  # ← เปลี่ยนชื่อ function
    officer_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_token)
):
    """ตรวจสอบความเหมาะสมของการมอบหมายเจ้าหน้าที่"""
    try:
        result = validate_officer_assignment(
            db=db,
            officer_id=UUID(officer_data.get("officer_id")),
            complaint_type=officer_data.get("complaint_type"),
            urgency_level=officer_data.get("urgency_level")
        )
        
        return format_data.format_response("0000", {
            "data": result,
            "message": "VALIDATE_OFFICER_SUCCESS"
        })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })