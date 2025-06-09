from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from models.user import User
from datetime import datetime

from app.api.middleware.jwt_verify import verify_token
from app.api.middleware.permission_middleware import can_update, can_delete
from app.api.v1.controllers.complaint_controller import (
    get_complaints, update_complaint_status, delete_complaint, get_user_complaints, update_complaint_details, add_related_complaint, get_my_complaint_by_id, get_complaint_by_id_with_assignment
)
from app.api.v1.schemas.complaint import StatusUpdateRequest
from models.comp_complaint import Complaint, ComplaintStatus, SeverityLevel, SatisfactionRating
from config.database import get_db
from lib.format_data import FormatResponseModel, format_response

router = APIRouter(
    prefix="/complaints",
    tags=["complaints"],
)

@router.post("", response_model=FormatResponseModel)
async def create_new_complaint(
    request_data: Dict[str, Any],
    complaint_channel_id: Optional[UUID] = Query(None, description="UUID ของช่องทางการร้องเรียน"),
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Create a new complaint using queue system only"""
    try:
        if complaint_channel_id:
            from models.comp_complaint_types import ComplaintChannel
            channel = db.query(ComplaintChannel).filter(
                ComplaintChannel.id == complaint_channel_id,
                ComplaintChannel.is_active == True
            ).first()
            
            if not channel:
                return format_response("4000", {
                    "error": "Invalid complaint_channel_id",
                    "message": "ไม่พบช่องทางการร้องเรียนที่ระบุ หรือช่องทางดังกล่าวไม่ได้เปิดใช้งาน"
                })
            
            request_data["complaint_channel_id"] = str(complaint_channel_id)
        
        from config.dotenv import RABBITMQ_URL
        from app.services.complaint_queue_service import ComplaintQueueService
        
        with ComplaintQueueService(RABBITMQ_URL) as queue_service:
            task_id = queue_service.queue_complaint_creation(request_data, current_user)
            
            return format_response("0001", {
                "task_id": task_id,
                "status": "queued",
                "message": "คำร้องเรียนถูกเพิ่มเข้า queue เพื่อประมวลผล",
                "processing_mode": "async",
                "complaint_channel_id": str(complaint_channel_id) if complaint_channel_id else None
            })
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return format_response("5000", {
            "error": "Queue system error", 
            "details": str(e)
        })

@router.get("", response_model=FormatResponseModel)
async def read_complaints(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    complaint_type: Optional[str] = None,
    complaint_subtype: Optional[str] = None,  # เพิ่ม filter
    assignee: Optional[str] = None,
    location: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    complainant_name: Optional[str] = None,   # เพิ่ม filter
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Get a list of complaints with advanced filtering and search"""
    result = get_complaints(
        db, 
        skip=skip, 
        limit=limit, 
        status=status,
        complaint_type=complaint_type,
        complaint_subtype=complaint_subtype,   # ส่งไป controller
        assignee=assignee,
        location=location,
        urgency=urgency,
        search=search,
        complainant_name=complainant_name      # ส่งไป controller
    )
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

@router.get("/assignment-form", response_model=FormatResponseModel)
async def get_complaints_assignment_form(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    complaint_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายการเรื่องร้องเรียนทั้งหมดสำหรับฟอร์ม assignment"""
    try:
        # ดึงข้อมูลเรื่องร้องเรียนทั้งหมด
        query = db.query(Complaint)
        
        # Apply filters
        if status:
            query = query.filter(Complaint.status == status)
        
        if complaint_type:
            query = query.filter(Complaint.complaint_type.ilike(f"%{complaint_type}%"))
        
        if search:
            search_filter = (
                Complaint.complaint_number.ilike(f"%{search}%") |
                Complaint.subject.ilike(f"%{search}%") |
                Complaint.description.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Get total count
        total_count = query.count()
        
        # Get paginated results
        complaints = query.order_by(
            Complaint.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        # จัดรูปแบบข้อมูลเรื่องร้องเรียนทั้งหมด
        complaints_data = []
        
        for complaint in complaints:
            # ดึงข้อมูลผู้ร้องเรียนจาก complainant_data
            citizen_id = None
            complainant_name = None
            
            try:
                import json
                if complaint.complainant_data:
                    # ตรวจสอบว่าเป็น string หรือ dict แล้ว
                    if isinstance(complaint.complainant_data, str):
                        complainant_data = json.loads(complaint.complainant_data)
                    else:
                        complainant_data = complaint.complainant_data
                    
                    # ลองหาข้อมูลในหลายๆ key ที่เป็นไปได้
                    if complaint.complainant_type == "INDIVIDUAL":
                        citizen_id = (
                            complainant_data.get("idCard") or 
                            complainant_data.get("citizen_id") or 
                            complainant_data.get("nationalId") or
                            complainant_data.get("id_card")
                        )
                        complainant_name = (
                            complainant_data.get("name") or 
                            complainant_data.get("fullName") or 
                            complainant_data.get("full_name") or
                            f"{complainant_data.get('firstName', '')} {complainant_data.get('lastName', '')}".strip() or
                            f"{complainant_data.get('first_name', '')} {complainant_data.get('last_name', '')}".strip()
                        )
                    elif complaint.complainant_type == "CORPORATE":
                        citizen_id = (
                            complainant_data.get("idCard") or 
                            complainant_data.get("taxId") or 
                            complainant_data.get("registrationNumber") or
                            complainant_data.get("company_id")
                        )
                        complainant_name = (
                            complainant_data.get("name") or 
                            complainant_data.get("companyName") or 
                            complainant_data.get("company_name") or
                            complainant_data.get("organizationName")
                        )
                        
            except Exception as e:
                pass
            
            # ถ้ายังไม่ได้ข้อมูล ลองดึงจาก User table
            if not citizen_id or not complainant_name:
                if complaint.created_by:
                    user = db.query(User).filter(User.id == complaint.created_by).first()
                    if user:
                        if not citizen_id:
                            citizen_id = user.citizen_id
                        if not complainant_name:
                            complainant_name = f"{user.first_name or ''} {user.last_name or ''}".strip()
                            if not complainant_name:
                                complainant_name = user.email
            
            # จัดรูปแบบข้อมูลเรื่องร้องเรียน - เฉพาะที่ต้องการ
            complaint_data = {
                "id": str(complaint.id),
                "complaint_number": complaint.complaint_number,
                "citizen_id": citizen_id,
                "complainant_name": complainant_name,
                "subject": complaint.subject,
                "reference_number": complaint.reference_number,
                "reference_date": complaint.reference_date.isoformat() if complaint.reference_date else None,
                "reference_number2": complaint.reference_number2,
                "reference_date2": complaint.reference_date2.isoformat() if complaint.reference_date2 else None,
                "reference_number3": complaint.reference_number3,
                "reference_date3": complaint.reference_date3.isoformat() if complaint.reference_date3 else None,
                "reference_number4": complaint.reference_number4,
                "reference_date4": complaint.reference_date4.isoformat() if complaint.reference_date4 else None
            }
            
            complaints_data.append(complaint_data)
        
        return format_response("0000", {
            "data": {
                "complaints": complaints_data,
                "pagination": {
                    "total": total_count,
                    "skip": skip,
                    "limit": limit,
                    "has_more": total_count > (skip + limit)
                }
            },
            "message": "GET_DATA_SUCCESSFULLY"
        })
        
    except Exception as e:
        return format_response("5000", {
            "error": str(e),
            "message": "INTERNAL_SERVER_ERROR"
        })

@router.get("/{complaint_id}", response_model=FormatResponseModel)
async def read_complaint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """Get a specific complaint by ID with assignment form data"""
    try:
        # ใช้ฟังก์ชันใหม่ที่รวม assignment form
        result = get_complaint_by_id_with_assignment(db, complaint_id)
        
        if "error" in result:
            return format_response("4004", {
                "error": result["error"], 
                "message": "COMPLAINT_NOT_FOUND"
            })
        
        return format_response("0000", result)
        
    except Exception as e:
        return format_response("5000", {
            "error": str(e), 
            "message": "INTERNAL_SERVER_ERROR"
        })

@router.get("/me/{complaint_id}", response_model=FormatResponseModel)
async def read_my_complaint_detail(
    complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ดึงรายละเอียดข้อร้องเรียนของผู้ใช้ที่ล็อกอินเข้าระบบ รวมข้อมูล assignment form"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # แปลงเป็น UUID
        user_id = UUID(current_user)
        
        # ใช้ฟังก์ชันใหม่ที่รวม assignment form
        result = get_my_complaint_by_id(db, complaint_id, user_id)
        
        if "error" in result:
            return format_response("4004", {
                "error": result["error"], 
                "message": "COMPLAINT_NOT_FOUND"
            })
        
        return format_response("0000", result)
        
    except Exception as e:
        return format_response("5000", {
            "error": str(e), 
            "message": "INTERNAL_SERVER_ERROR"
        })

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

@router.patch("/{complaint_id}/details", response_model=FormatResponseModel)
async def update_complaint_additional_details(
    complaint_id: UUID,
    update_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaints"))
):
    """อัพเดทข้อมูลเพิ่มเติมของเรื่องร้องเรียน เช่น ความลับ ความเร่งด่วน พื้นที่เกิดเหตุ"""
    try:
        updated_complaint = update_complaint_details(
            db, 
            complaint_id, 
            update_data, 
            UUID(current_user) if current_user else None
        )
        
        if not updated_complaint:
            raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
        
        return format_response("0002", {
            "id": complaint_id,
            "updated_at": updated_complaint.updated_at
        })
    except ValueError as e:
        return format_response("4000", {"error": str(e)})

@router.post("/{complaint_id}/related/{related_complaint_id}", response_model=FormatResponseModel)
async def add_related_complaint_connection(
    complaint_id: UUID,
    related_complaint_id: UUID,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaints"))
):
    """เพิ่มความสัมพันธ์ระหว่างเรื่องร้องเรียน"""
    success = add_related_complaint(db, complaint_id, related_complaint_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="One or both complaints not found")
    
    return format_response("0002", {
        "complaint_id": complaint_id,
        "related_complaint_id": related_complaint_id,
        "status": "linked"
    })

@router.patch("/{complaint_id}/severity", response_model=FormatResponseModel)
async def update_complaint_severity(
    complaint_id: UUID,
    severity_level: SeverityLevel,
    db: Session = Depends(get_db),
    current_user: str = Depends(can_update("complaints"))
):
    """อัพเดทระดับความรุนแรงของเรื่องร้องเรียน"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
    
    complaint.severity_level = severity_level
    complaint.updated_at = datetime.now()
    
    db.commit()
    db.refresh(complaint)
    
    return format_response("0002", {
        "id": complaint_id,
        "severity_level": severity_level.value
    })

@router.patch("/{complaint_id}/satisfaction", response_model=FormatResponseModel)
async def update_complaint_satisfaction(
    complaint_id: UUID,
    rating: SatisfactionRating,
    comment: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """บันทึกคะแนนความพึงพอใจต่อการแก้ไขปัญหา"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint with ID {complaint_id} not found")
    
    # ตรวจสอบว่าผู้ใช้มีสิทธิ์ในการให้คะแนน (ควรเป็นเจ้าของเรื่องร้องเรียน)
    if current_user and complaint.created_by and str(complaint.created_by) != current_user:
        raise HTTPException(status_code=403, detail="You don't have permission to rate this complaint")
    
    complaint.satisfaction_rating = rating
    if comment:
        complaint.satisfaction_comment = comment
    complaint.updated_at = datetime.now()
    
    db.commit()
    db.refresh(complaint)
    
    return format_response("0002", {
        "id": complaint_id,
        "satisfaction_rating": rating.value,
        "has_comment": comment is not None
    })

@router.get("/queue/status/{task_id}", response_model=FormatResponseModel)
async def check_queue_task_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(verify_token)
):
    """ตรวจสอบสถานะการประมวลผล queue task"""
    try:
        from datetime import timedelta
        
        # ค้นหาเรื่องร้องเรียนที่สร้างใหม่ในช่วง 10 นาทีที่ผ่านมา
        recent_time = datetime.now() - timedelta(minutes=10)
        recent_complaints = db.query(Complaint).filter(
            Complaint.created_at >= recent_time,
            Complaint.created_by == UUID(current_user) if current_user else None
        ).order_by(Complaint.created_at.desc()).limit(5).all()
        
        # ถ้ามีเรื่องร้องเรียนที่สร้างใหม่
        if recent_complaints:
            latest_complaint = recent_complaints[0]
            return format_response("0000", {
                "task_id": task_id,
                "status": "completed",
                "message": "Task processed successfully",
                "complaint_id": str(latest_complaint.id),
                "complaint_number": latest_complaint.complaint_number,
                "created_at": latest_complaint.created_at.isoformat()
            })
        
        # ตรวจสอบว่า task ยังอยู่ใน queue หรือไม่
        try:
            from config.dotenv import RABBITMQ_URL
            import pika
            
            connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
            channel = connection.channel()
            
            # ตรวจสอบจำนวน message ใน queue
            method = channel.queue_declare(queue='complaint_processing', passive=True)
            queue_count = method.method.message_count
            connection.close()
            
            if queue_count > 0:
                return format_response("0000", {
                    "task_id": task_id,
                    "status": "processing",
                    "message": f"Task is in queue (position: {queue_count})",
                    "queue_size": queue_count
                })
            else:
                return format_response("0000", {
                    "task_id": task_id,
                    "status": "completed",
                    "message": "Task completed but complaint not found"
                })
                
        except Exception as queue_error:
            # ถ้าเชื่อมต่อ queue ไม่ได้
            return format_response("0000", {
                "task_id": task_id,
                "status": "unknown",
                "message": "Cannot check queue status",
                "error": str(queue_error)
            })
        
    except Exception as e:
        return format_response("5000", {"error": str(e)})