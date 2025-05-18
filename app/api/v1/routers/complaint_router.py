from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
from datetime import datetime

from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.complaint_controller import (
    create_complaint, get_complaints, get_complaint, update_complaint_status, delete_complaint, get_user_complaints, get_user_complaint_detail
)
from app.api.v1.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintListItem, StatusUpdateRequest
from models.comp_complaint import Complaint, ComplaintStatus
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/complaints",
    tags=["complaints"],
)

@router.post("", response_model=FormatResponseModel)
async def create_new_complaint(
    request_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Create a new complaint using the nested structure"""
    try:
        # สร้างข้อมูลอย่างมีประสิทธิภาพ - ส่งข้อมูลต้นฉบับทั้งหมดไปให้ controller
        # ไม่ต้องแยกแยะข้อมูลที่นี่ เพราะมีการประมวลผลเต็มรูปแบบที่ controller แล้ว
        complaint_data = request_data
        
        # Extract complaintType from step3 if present for backward compatibility
        if "step3" in request_data and "general" in request_data["step3"]:
            if "complaintType" in request_data["step3"]["general"]:
                # Ensure complaintType is at the root level as well
                complaint_data = {**request_data}
                complaint_data["complaintType"] = request_data["step3"]["general"]["complaintType"]
        
        # Use the controller function instead of directly creating model instance
        new_complaint = create_complaint(db, complaint_data, UUID(current_user) if current_user else None)
        
        return format_response("0001", {
            "complaint_id": new_complaint.id,
            "complaint_number": new_complaint.complaint_number
        })
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": str(e)})

@router.get("", response_model=FormatResponseModel)
async def read_complaints(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Get a list of complaints with pagination and optional status filter"""
    result = get_complaints(db, skip=skip, limit=limit, status=status)
    return format_response("0000", result)

@router.get("/me", response_model=FormatResponseModel)
async def read_my_complaints(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการข้อร้องเรียนทั้งหมดของผู้ใช้ที่ล็อกอินเข้าระบบ"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # แปลงเป็น UUID
    user_id = UUID(current_user)
    
    # ใช้ฟังก์ชันใหม่
    result = get_user_complaints(db, user_id, skip=skip, limit=limit, status=status)
    return format_response("0000", result)

@router.get("/{complaint_id}", response_model=FormatResponseModel)
async def read_complaint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Get a specific complaint by ID"""
    complaint = get_complaint(db, complaint_id)
    
    if complaint is None:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
    
    return format_response("0000", complaint)

@router.get("/me/{complaint_id}", response_model=FormatResponseModel)
async def read_my_complaint_detail(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายละเอียดข้อร้องเรียนของผู้ใช้ที่ล็อกอินเข้าระบบ"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # แปลงเป็น UUID
    user_id = UUID(current_user)
    
    # ใช้ฟังก์ชันใหม่
    complaint = get_user_complaint_detail(db, user_id, complaint_id)
    
    if complaint is None:
        raise HTTPException(
            status_code=404, 
            detail=f"Complaint with ID {complaint_id} not found or you don't have permission to view it"
        )
    
    return format_response("0000", complaint)

@router.patch("/{complaint_id}/status", response_model=FormatResponseModel)
async def update_status(
    complaint_id: UUID,
    status_update: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaints"))
):
    """Update the status of a complaint"""
    try:
        complaint = update_complaint_status(
            db, 
            complaint_id, 
            status_update.status, 
            status_update.notes, 
            UUID(current_user) if current_user else None
        )
        
        if complaint is None:
            raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
        
        return format_response("0002", {
            "id": complaint_id, 
            "status": complaint.status, 
            "updated_at": complaint.updated_at
        })
    except ValueError as e:
        return format_response("4000", {"error": str(e)})

@router.patch("/{complaint_id}/assign", response_model=FormatResponseModel)
async def assign_complaint(
    complaint_id: UUID,
    assigned_to: str = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaints"))
):
    """Assign complaint to an agency"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if complaint is None:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
    
    # Update assignment info
    complaint.assigned_to = assigned_to
    complaint.assigned_date = datetime.now()
    
    # Update status to SENT_TO_AGENCY
    complaint.status = ComplaintStatus.SENT_TO_AGENCY
    complaint.updated_at = datetime.now()
    
    db.commit()
    db.refresh(complaint)
    
    # Add status history entry
    from models.comp_complaint import ComplaintStatusHistory
    
    status_history = ComplaintStatusHistory(
        complaint_id=complaint_id,
        status=ComplaintStatus.SENT_TO_AGENCY,
        notes=f"Assigned to {assigned_to}",
        changed_by=UUID(current_user) if current_user else None
    )
    
    db.add(status_history)
    db.commit()
    
    return format_response("0002", {
        "id": complaint_id,
        "assigned_to": assigned_to,
        "status": ComplaintStatus.SENT_TO_AGENCY
    })

@router.patch("/{complaint_id}/resolution", response_model=FormatResponseModel)
async def add_resolution(
    complaint_id: UUID,
    resolution_summary: str = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaints"))
):
    """Add resolution details to a complaint"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if complaint is None:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
    
    # Update resolution info
    complaint.resolution_summary = resolution_summary
    complaint.resolved_date = datetime.now()
    
    # Update status to REVIEWED
    complaint.status = ComplaintStatus.REVIEWED
    complaint.updated_at = datetime.now()
    
    db.commit()
    db.refresh(complaint)
    
    # Add status history entry
    from models.comp_complaint import ComplaintStatusHistory
    
    status_history = ComplaintStatusHistory(
        complaint_id=complaint_id,
        status=ComplaintStatus.REVIEWED,
        notes="Resolution provided",
        changed_by=UUID(current_user) if current_user else None
    )
    
    db.add(status_history)
    db.commit()
    
    return format_response("0002", {
        "id": complaint_id,
        "status": ComplaintStatus.REVIEWED
    })

@router.delete("/{complaint_id}", response_model=FormatResponseModel)
async def delete_existing_complaint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_delete("complaints"))
):
    """Delete a complaint"""
    success = delete_complaint(db, complaint_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
    
    return format_response("0003", {"id": complaint_id})

@router.post("/upload-attachment", response_model=FormatResponseModel)
async def upload_attachment(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Upload an attachment for a complaint"""
    from lib.file_upload import save_upload_file
    
    try:
        user_id = UUID(current_user)
        file_info = await save_upload_file(file, f"users/{user_id}")
        
        return format_response("0001", {
            "fileName": file_info["filename"],
            "fileUrl": file_info["file_url"],
            "fileSize": file_info["file_size"],
            "fileType": file_info["file_type"]
        })
    except Exception as e:
        return format_response("5000", {"error": str(e)})

@router.post("/{complaint_id}/attachments", response_model=FormatResponseModel)
async def add_attachment_to_complaint(
    complaint_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Attach a file to a specific complaint"""
    from lib.file_upload import save_upload_file
    from models.comp_complaint import ComplaintAttachment
    
    # Check if complaint exists
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
    
    try:
        # Save file and get info
        file_info = await save_upload_file(file, f"complaints/{complaint_id}")
        
        # Create attachment record
        attachment = ComplaintAttachment(
            complaint_id=complaint_id,
            file_name=file_info["filename"],
            file_size=file_info["file_size"],
            file_url=file_info["file_url"],
            file_type=file_info["file_type"]
        )
        
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        
        return format_response("0001", {
            "complaint_id": complaint_id,
            "attachment_id": attachment.id,
            "fileName": file_info["filename"],
            "fileUrl": file_info["file_url"],
            "fileSize": file_info["file_size"],
            "fileType": file_info["file_type"]
        })
    except Exception as e:
        return format_response("5000", {"error": str(e)})