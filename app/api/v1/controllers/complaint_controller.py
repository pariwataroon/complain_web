import uuid
import json
from datetime import datetime
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any, Optional

from models.comp_complaint import Complaint, ComplaintStatus, ComplaintStatusHistory
from app.api.v1.schemas.complaint import ComplaintListItem

def create_complaint(db: Session, complaint_data: Dict[str, Any], user_id: Optional[UUID] = None) -> Complaint:
    """
    Create a new complaint record
    """
    # Generate a unique complaint number
    complaint_number = generate_complaint_number(db)
    
    # Extract data from the dictionary
    subject = complaint_data.get("subject", "")
    description = complaint_data.get("description", "")
    complainant_data = complaint_data.get("complainant_data", {})
    respondent_data = complaint_data.get("respondent_data", {})
    incident_data = complaint_data.get("incident_data", {})
    accepted = complaint_data.get("accepted", True)
    
    # Extract complainant type
    complainant_type = "general"
    if "corporate" in complainant_data:
        complainant_type = "corporate"
    
    # Extract respondent type
    respondent_type = ""
    for key in respondent_data:
        respondent_type = key
        break
    
    # Extract incident details
    incident_date = None
    if "incidentDate" in incident_data:
        try:
            incident_date = datetime.fromisoformat(incident_data["incidentDate"].replace('Z', '+00:00'))
        except:
            incident_date = datetime.now()
    
    complaint_type = incident_data.get("complaintType", "")
    
    # Create new complaint
    new_complaint = Complaint(
        complaint_number=complaint_number,
        subject=subject,
        description=description,
        status=ComplaintStatus.SUBMITTED,  # Initial status using enum
        complainant_data=complainant_data.get("general", {}),
        delegate_data=complainant_data.get("delegate"),
        complainant_type=complainant_type,
        respondent_data=respondent_data.get(respondent_type, {}),
        respondent_type=respondent_type,
        incident_date=incident_date,
        complaint_type=complaint_type,
        terms_accepted=accepted,
        created_by=user_id
    )
    
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    # Add initial status history entry
    status_history = ComplaintStatusHistory(
        complaint_id=new_complaint.id,
        status=ComplaintStatus.SUBMITTED,
        notes="Complaint submitted",
        changed_by=user_id
    )
    
    db.add(status_history)
    db.commit()
    
    return new_complaint

def generate_complaint_number(db: Session) -> str:
    """Generate a unique complaint number"""
    today = datetime.now()
    date_part = today.strftime("%Y%m%d")
    
    # Get the count of complaints created today to generate a sequential number
    today_start = datetime.combine(today.date(), datetime.min.time())
    today_end = datetime.combine(today.date(), datetime.max.time())
    
    today_count = db.query(Complaint).filter(
        Complaint.created_at.between(today_start, today_end)
    ).count()
    
    sequence = str(today_count + 1).zfill(5)
    return f"CMPL-{date_part}-{sequence}"

def get_complaints(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    """Get list of complaints with pagination"""
    query = db.query(Complaint)
    
    if status:
        query = query.filter(Complaint.status == status)
    
    # Add ORDER BY clause to fix MSSQL pagination issue
    query = query.order_by(Complaint.created_at.desc())

    complaints = query.offset(skip).limit(limit).all()
    
    result = []
    for complaint in complaints:
        # Extract complainant name based on type
        complainant_name = ""
        if complaint.complainant_type == "general":
            complainant_name = complaint.complainant_data.get("name", "")
        else:
            complainant_name = complaint.complainant_data.get("name", "")
        
        # Extract respondent name based on type
        respondent_name = ""
        if complaint.respondent_type == "individual":
            respondent_name = complaint.respondent_data.get("name", "")
        elif complaint.respondent_type == "corporate":
            respondent_name = complaint.respondent_data.get("companyName", "")
        elif complaint.respondent_type == "government":
            respondent_name = complaint.respondent_data.get("agencyName", "")
        
        list_item = ComplaintListItem(
            id=complaint.id,
            complaint_number=complaint.complaint_number,
            subject=complaint.subject,
            complaint_type=complaint.complaint_type,
            status=complaint.status,
            created_at=complaint.created_at,
            complainant_name=complainant_name,
            respondent_name=respondent_name
        )
        result.append(list_item)
    
    return result

def get_complaint(db: Session, complaint_id: uuid.UUID):
    """Get a single complaint by ID with full details"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return None
    
    # Get attachments
    attachment_list = []
    for attachment in complaint.attachments:
        attachment_list.append({
            "fileName": attachment.file_name,
            "fileSize": attachment.file_size,
            "fileUrl": attachment.file_url,
            "fileType": attachment.file_type
        })
    
    # Get status history
    status_history = []
    for history in db.query(ComplaintStatusHistory).filter(
        ComplaintStatusHistory.complaint_id == complaint_id
    ).order_by(ComplaintStatusHistory.changed_at).all():
        status_history.append({
            "status": history.status,
            "notes": history.notes,
            "changed_at": history.changed_at,
            "changed_by": history.changed_by
        })
    
    # Reconstruct the response based on the schema
    step1_data = {"general": {}, "delegate": None, "corporate": {}, "signer": None}
    step2_data = {"individual": None, "corporate": None, "government": None}
    
    # Handle complainant data
    if complaint.complainant_type == "general":
        step1_data["general"] = complaint.complainant_data
        if "signer" in complaint.complainant_data:
            step1_data["signer"] = complaint.complainant_data.pop("signer")
    else:
        step1_data["corporate"] = complaint.complainant_data
        if "signer" in complaint.complainant_data:
            step1_data["signer"] = complaint.complainant_data.pop("signer")
    
    # Handle delegate data
    if complaint.delegate_data:
        step1_data["delegate"] = complaint.delegate_data
    
    # Handle respondent data
    if complaint.respondent_type == "individual":
        step2_data["individual"] = complaint.respondent_data
    elif complaint.respondent_type == "corporate":
        step2_data["corporate"] = complaint.respondent_data
    elif complaint.respondent_type == "government":
        step2_data["government"] = complaint.respondent_data
    
    # Create response object
    response_data = {
        "id": complaint.id,
        "complaint_number": complaint.complaint_number,
        "step1": step1_data,
        "step2": step2_data,
        "step3": {
            "incidentDate": complaint.incident_date,
            "complaintType": complaint.complaint_type,
            "subject": complaint.subject,
            "description": complaint.description,
            "attachment": attachment_list
        },
        "step4": {
            "accepted": complaint.terms_accepted
        },
        "status": complaint.status,
        "status_history": status_history,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "assigned_to": complaint.assigned_to,
        "assigned_date": complaint.assigned_date,
        "resolution_summary": complaint.resolution_summary,
        "resolved_date": complaint.resolved_date
    }
    
    return response_data

def update_complaint_status(db: Session, complaint_id: uuid.UUID, new_status: ComplaintStatus, notes: Optional[str] = None, user_id: Optional[UUID] = None):
    """Update the status of a complaint"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return None
    
    # Update complaint status
    complaint.status = new_status
    complaint.updated_at = datetime.now()
    
    # If status is completed, set resolved date
    if new_status == ComplaintStatus.COMPLETED:
        complaint.resolved_date = datetime.now()
    
    # Add status history entry
    status_history = ComplaintStatusHistory(
        complaint_id=complaint_id,
        status=new_status,
        notes=notes,
        changed_by=user_id
    )
    
    db.add(status_history)
    db.commit()
    db.refresh(complaint)
    
    return complaint

def delete_complaint(db: Session, complaint_id: uuid.UUID):
    """Delete a complaint"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        return False
    
    db.delete(complaint)
    db.commit()
    
    return True