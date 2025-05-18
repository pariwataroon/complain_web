from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import can_update
from app.api.v1.controllers.complaint_registration_controller import register_complaint, get_complaint_registration_data
from app.api.v1.schemas.complaint_registration import ComplaintRegistrationRequest
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/complaints",
    tags=["complaint_registration"],
)

@router.post("/{complaint_id}/register", response_model=FormatResponseModel)
async def register_complaint_endpoint(
    complaint_id: UUID,
    registration_data: ComplaintRegistrationRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaints"))
):
    """บันทึกข้อมูลลงทะเบียนเรื่องร้องเรียนโดยเจ้าหน้าที่"""
    user_id = UUID(current_user) if current_user else None
    
    complaint = register_complaint(db, complaint_id, registration_data.dict(), user_id)
    
    if complaint is None:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
    
    return format_response("0002", {
        "id": complaint_id,
        "complaint_number": complaint.complaint_number,
        "registration_date": complaint.registration_date
    })

@router.get("/{complaint_id}/registration", response_model=FormatResponseModel)
async def get_registration_data(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงข้อมูลลงทะเบียนเรื่องร้องเรียน"""
    registration_data = get_complaint_registration_data(db, complaint_id)
    
    if registration_data is None:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
    
    return format_response("0000", registration_data)