from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, Optional
from datetime import datetime

from config.database import get_db
from models.user import User
from app.api.middleware.permission_middleware import can_read, can_create, can_update
from lib.format_data import format_response, FormatResponseModel
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
    get_complaint_assignment_history,
    get_complaints_by_page_type_with_assignment_form,
    confirm_assignment
)
import lib.format_data as format_data

router = APIRouter(prefix="/complaints-assignment", tags=["complaint_assignment"])

@router.get("/{complaint_id}/assignment-form", response_model=FormatResponseModel)
async def get_assignment_form(
    complaint_id: UUID,
    current_user: str = Depends(can_read("dashboard")),
    db: Session = Depends(get_db)
):
    """ดึงข้อมูลสำหรับฟอร์ม Assignment"""
    try:
        result = get_assignment_form_data(db, complaint_id)
        
        if "error" in result:
            return format_response("4004", {
                "error": result["error"], 
                "message": "COMPLAINT_NOT_FOUND"
            })
        
        return format_response("0000", result)
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e), 
            "message": "INTERNAL_SERVER_ERROR"
        })

# (Removed broken duplicate update endpoint block above)

@router.put("/{complaint_id}/complainant")
async def update_complainant(
    complaint_id: UUID,
    complainant_data: Dict[str, Any],
    current_user: str = Depends(can_update("dashboard")),
    db: Session = Depends(get_db)
):
    """อัพเดทข้อมูลผู้ร้องเรียน"""
    try:
        result = update_complainant_data(
            db=db,
            complaint_id=complaint_id,
            complainant_data=complainant_data,
            updated_by=UUID(current_user)  # ← แปลงเป็น UUID
        )
        
        if result.get("success"):
            return format_data.format_response("0000", {
                "data": result,
                "message": "UPDATE_SUCCESS"
            })
        else:
            return format_data.format_response("4000", {
                "error": result.get("message"),
                "message": "UPDATE_FAILED"
            })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })

@router.put("/{complaint_id}/respondent")
async def update_respondent(
    complaint_id: UUID,
    respondent_data: Dict[str, Any],
    current_user: str = Depends(can_update("dashboard")),
    db: Session = Depends(get_db)
):
    """อัพเดทข้อมูลผู้ถูกร้องเรียน"""
    try:
        result = update_respondent_data(
            db=db,
            complaint_id=complaint_id,
            respondent_data=respondent_data,
            updated_by=UUID(current_user)  # ← แปลงเป็น UUID
        )
        
        if result.get("success"):
            return format_data.format_response("0000", {
                "data": result,
                "message": "UPDATE_SUCCESS"
            })
        else:
            return format_data.format_response("4000", {
                "error": result.get("message"),
                "message": "UPDATE_FAILED"
            })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })

# @router.get("/search-for-reference")
# async def search_for_reference(
#     q: str = Query(..., description="คำค้นหา"),
#     limit: int = Query(10, description="จำนวนผลลัพธ์"),
#     current_user: str = Depends(can_read("dashboard")),
#     db: Session = Depends(get_db)
# ):
#     """ค้นหาเรื่องร้องเรียนสำหรับการอ้างอิง"""
#     try:
#         results = search_complaint_for_reference(
#             db=db,
#             search_term=q,
#             limit=limit
#         )
        
#         return format_data.format_response("0000", {
#             "data": results,
#             "message": "SEARCH_SUCCESS"
#         })
        
#     except Exception as e:
#         return format_data.format_response("5000", {
#             "error": str(e),
#             "message": "INTERNAL_SERVER_ERROR"
#         })

# @router.post("/{complaint_id}/additional-reference")
# async def add_additional_reference(
#     complaint_id: UUID,
#     reference_data: Dict[str, Any],
#     current_user: str = Depends(can_create("dashboard")),
#     db: Session = Depends(get_db)
# ):
#     """เพิ่มเลขอ้างอิงเรื่องเพิ่มเติม"""
#     try:
#         result = add_additional_complaint_reference(
#             db=db,
#             complaint_id=complaint_id,
#             reference_complaint_id=reference_data.get("reference_complaint_id"),
#             reference_complaint_number=reference_data.get("reference_complaint_number"),
#             updated_by=UUID(current_user)  # ← แปลงเป็น UUID
#         )
        
#         if result.get("success"):
#             return format_data.format_response("0000", {
#                 "data": result,
#                 "message": "ADD_REFERENCE_SUCCESS"
#             })
#         else:
#             return format_data.format_response("4000", {
#                 "error": result.get("message"),
#                 "message": "ADD_REFERENCE_FAILED"
#             })
        
#     except Exception as e:
#         return format_data.format_response("5000", {
#             "error": str(e),
#             "message": "INTERNAL_SERVER_ERROR"
#         })

@router.get("/{complaint_id}/history")
async def get_assignment_history(
    complaint_id: UUID,
    limit: int = Query(20, description="จำนวนประวัติที่แสดง"),
    current_user: str = Depends(can_read("dashboard")),
    db: Session = Depends(get_db)
):
    """ดูประวัติการเปลี่ยนแปลงการมอบหมาย"""
    try:
        # ใช้ direct query แทนการเรียก controller function ที่ยังไม่มี
        from models.comp_complaint import ComplaintStatusHistory
        
        histories = db.query(ComplaintStatusHistory).filter(
            ComplaintStatusHistory.complaint_id == complaint_id
        ).order_by(ComplaintStatusHistory.changed_at.desc()).limit(limit).all()
        
        result = []
        for history in histories:
            # ดึงข้อมูลผู้เปลี่ยนแปลง
            changed_by_user = None
            if history.changed_by:
                changed_by_user = db.query(User).filter(User.id == history.changed_by).first()
            
            result.append({
                "id": str(history.id),
                "status": history.status,
                "notes": history.notes,
                "changed_at": history.changed_at.isoformat(),
                "changed_by": {
                    "id": str(history.changed_by) if history.changed_by else None,
                    "name": f"{changed_by_user.first_name} {changed_by_user.last_name}" if changed_by_user else "ระบบ"
                }
            })
        
        return format_data.format_response("0000", {
            "data": result,
            "message": "GET_HISTORY_SUCCESS"
        })
        
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })

@router.put("/{complaint_id}/assignment", response_model=FormatResponseModel)
async def update_assignment(
    complaint_id: UUID,
    assignment_data: Dict[str, Any],
    current_user: str = Depends(can_update("dashboard")),
    db: Session = Depends(get_db)
):
    """อัพเดทการมอบหมายงาน"""
    try:
        # ✅ แปลง string เป็น UUID
        try:
            updated_by_uuid = UUID(current_user)
        except ValueError:
            return format_response("4000", {
                "error": "Invalid user ID format",
                "message": "INVALID_USER_ID"
            })

        result = update_complaint_assignment_data(
            db=db,
            complaint_id=complaint_id,
            assignment_data=assignment_data,
            updated_by=updated_by_uuid,
        )

        if result.get("success"):
            return format_response("0002", result)
        else:
            code = result.get("code", "4000")
            return format_response(code, {"error": result.get("message", "UPDATE_FAILED")})

    except Exception as e:
        return format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })

@router.get("/by-page-type")
async def get_complaints_by_page_type(
    page_type: Optional[str] = Query(
        None,
        description="ประเภทหน้า: 'website', 'card' หรือเว้นว่างเพื่อดึงทุกช่องทาง"
    ),
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
    current_user: str = Depends(can_read("dashboard")),
    db: Session = Depends(get_db)
):
    """ดึงข้อมูลเรื่องร้องเรียนแบ่งตามประเภทหน้า (website/card) ในรูปแบบ assignment form - เฉพาะงานที่ได้รับมอบหมาย"""
    try:
        # ✅ แปลง current_user เป็น UUID
        current_user_id = UUID(current_user)
        
        result = get_complaints_by_page_type_with_assignment_form(
            db=db,
            current_user_id=current_user_id,
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
            return format_data.format_response("5000", result["error"])
        
        return format_data.format_response("0000", result)
        
    except ValueError:
        return format_data.format_response("4000", {"error": "Invalid user ID format"})
    except Exception as e:
        return format_data.format_response("5000", str(e))
    
@router.post("/{complaint_id}/confirm-assignment")
async def confirm_assignment_endpoint(
    complaint_id: UUID,
    confirm_data: Dict[str, Any],
    current_user: str = Depends(can_create("dashboard")),
    db: Session = Depends(get_db)
):
    """ยืนยันรับงานที่ได้รับมอบหมาย"""
    try:
        current_user_id = UUID(current_user)
        
        # ตรวจสอบข้อมูลที่จำเป็น
        if "confirm_status" not in confirm_data:
            return format_data.format_response("4000", {
                "error": "กรุณาระบุสถานะการยืนยัน (confirm_status)",
                "message": "MISSING_CONFIRM_STATUS"
            })
        
        result = confirm_assignment(
            db=db,
            complaint_id=complaint_id,
            current_user_id=current_user_id,
            confirm_status=confirm_data["confirm_status"],
            remark=confirm_data.get("remark")
        )
        
        if result.get("success"):
            return format_data.format_response("0000", {
                "data": result,
                "message": "CONFIRM_ASSIGNMENT_SUCCESS"
            })
        else:
            return format_data.format_response("4000", {
                "error": result.get("message"),
                "message": "CONFIRM_ASSIGNMENT_FAILED"
            })
        
    except ValueError:
        return format_data.format_response("4000", {
            "error": "Invalid user ID format",
            "message": "INVALID_USER_ID"
        })
    except Exception as e:
        return format_data.format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })