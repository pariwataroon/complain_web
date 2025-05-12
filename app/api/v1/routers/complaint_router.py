from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import datetime

from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.complaint_controller import (
    create_complaint, get_complaints, get_complaint, update_complaint_status, delete_complaint
)
from app.api.v1.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintListItem
from models.comp_complaint import Complaint  # Add this import for the Complaint model
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/complaints",
    tags=["complaints"],
)

@router.post("/", response_model=FormatResponseModel)
async def create_new_complaint(
    request_data: Dict[str, Any],  # Accept any JSON structure
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Create a new complaint using the nested structure"""
    try:
        # Extract data from nested structure
        # Step 1: Complainant data
        step1 = request_data.get("step1", {}).get("general", {})
        general_data = step1.get("general", {})
        delegate_data = step1.get("delegate", {})
        
        # Step 2: Respondent data
        step2 = request_data.get("step2", {}).get("general", {})
        # Determine respondent type (individual, corporate, government)
        respondent_type = "individual"
        respondent_data = {}
        if "individual" in step2:
            respondent_type = "individual"
            respondent_data = step2.get("individual", {})
        elif "corporate" in step2:
            respondent_type = "corporate"
            respondent_data = step2.get("corporate", {})
        elif "government" in step2:
            respondent_type = "government"
            respondent_data = step2.get("government", {})
        
        # Step 3: Incident details
        step3 = request_data.get("step3", {}).get("general", {})
        
        # Step 4: Acceptance
        step4 = request_data.get("step4", {}).get("general", {})
        
        # Create data structure for controller
        complaint_data = {
            "subject": step3.get("subject", ""),
            "description": step3.get("description", ""),
            "complainant_data": {
                "general": general_data,
                "delegate": delegate_data if delegate_data else None
            },
            "respondent_data": {
                respondent_type: respondent_data
            },
            "incident_data": step3,
            "accepted": step4.get("accepted", True),
        }
        
        # Use the controller function instead of directly creating model instance
        new_complaint = create_complaint(db, complaint_data, UUID(current_user) if current_user else None)
        
        return format_response("0001", {
            "complaint_id": new_complaint.id,
            "complaint_number": new_complaint.complaint_number
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {"error": str(e)})

def generate_complaint_number(db):
    # Generate a unique complaint number (format: CMPL-YYYYMMDD-XXXXX)
    today = datetime.datetime.now()
    date_part = today.strftime("%Y%m%d")
    
    # Get the count of complaints created today to generate a sequential number
    today_start = datetime.datetime.combine(today.date(), datetime.time.min)
    today_end = datetime.datetime.combine(today.date(), datetime.time.max)
    
    today_count = db.query(Complaint).filter(
        Complaint.created_at.between(today_start, today_end)
    ).count()
    
    sequence = str(today_count + 1).zfill(5)
    return f"CMPL-{date_part}-{sequence}"

@router.get("/", response_model=FormatResponseModel)
async def read_complaints(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Get a list of complaints"""
    complaints = get_complaints(db, skip=skip, limit=limit)
    return format_response("0000", complaints)

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

@router.patch("/{complaint_id}/status", response_model=FormatResponseModel)
async def update_status(
    complaint_id: UUID,
    status: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaints"))
):
    """Update the status of a complaint"""
    complaint = update_complaint_status(db, complaint_id, status)
    
    if complaint is None:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
    
    return format_response("0002", {"id": complaint_id, "status": status})

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
    from utils.file_upload import save_upload_file
    
    try:
        file_info = await save_upload_file(file, "complaints")
        
        return format_response("0001", {
            "fileName": file_info["filename"],
            "fileUrl": file_info["file_url"],
            "fileSize": file_info["file_size"],
            "fileType": file_info["file_type"]
        })
    except Exception as e:
        return format_response("5000", {"error": str(e)})