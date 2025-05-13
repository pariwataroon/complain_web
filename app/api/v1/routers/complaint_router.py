from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
from datetime import datetime

from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import permission_required, can_create, can_read, can_update, can_delete
from app.api.v1.controllers.complaint_controller import (
    create_complaint, get_complaints, get_complaint, update_complaint_status, delete_complaint
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
        corporate_data = step1.get("corporate", {})
        signer_data = step1.get("signer", {})
        
        # Determine complainant type
        complainant_type = "general"
        if corporate_data and any(corporate_data.values()):
            complainant_type = "corporate"
        
        # Step 2: Respondent data
        step2 = request_data.get("step2", {}).get("general", {})
        # Determine respondent type (individual, corporate, government)
        respondent_type = "individual"
        respondent_data = {}
        if "individual" in step2 and step2.get("individual") and any(step2.get("individual", {}).values()):
            respondent_type = "individual"
            respondent_data = step2.get("individual", {})
        elif "corporate" in step2 and step2.get("corporate") and any(step2.get("corporate", {}).values()):
            respondent_type = "corporate"
            respondent_data = step2.get("corporate", {})
        elif "government" in step2 and step2.get("government") and any(step2.get("government", {}).values()):
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
            "complainant_type": complainant_type,
            "complainant_data": {
                "general": general_data,
                "corporate": corporate_data,
                "delegate": delegate_data if delegate_data and any(delegate_data.values()) else None,
                "signer": signer_data if signer_data and any(signer_data.values()) else None
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

@router.get("", response_model=FormatResponseModel)
async def read_complaints(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Get a list of complaints with optional status filter"""
    complaints = get_complaints(db, skip=skip, limit=limit, status=status)
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