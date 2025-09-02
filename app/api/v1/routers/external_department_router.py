"""
External Department API - Complete Implementation
สำหรับหน่วยงานในสังกัดกระทรวงการคลัง (กรมสรรพากร, กรมศุลกากร, กรมบัญชีกลาง ฯลฯ)
"""

from uuid import UUID
from typing import Optional, Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from config.database import get_db
from app.api.middleware.external_department_auth import verify_external_department
from models.comp_complaint import Complaint, ComplaintStatus, ComplaintStatusHistory
from models.outside_departments import OutsideDepartment
from models.outgoing_reports import OutgoingReport
from models.project_api_key import ProjectApiKey
from lib.format_data import FormatResponseModel, format_response
from lib.logger import get_logger

logger = get_logger("external_department_api")

router = APIRouter(
    prefix="/external",
    tags=["external-departments"],
)


@router.post("/auth/test", response_model=FormatResponseModel)
async def test_external_auth(
    request: Request,
    auth_info: Dict = Depends(verify_external_department)
):
    """ทดสอบ external department authentication"""
    return format_response("0000", {
        "message": "Authentication successful",
        "department": auth_info.get("department_name"),
        "project": auth_info.get("project_name"),
        "client_ip": auth_info.get("client_ip")
    })


@router.get("/complaints", response_model=FormatResponseModel)
async def get_department_complaints(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    auth_info: Dict = Depends(verify_external_department),
    db: Session = Depends(get_db)
):
    """ดึงรายการ complaints ที่ส่งมาให้หน่วยงานในสังกัดกระทรวงการคลัง"""
    try:
        department_id = auth_info.get("department_id")
        if not department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API key is not associated with any department"
            )
        
        # สร้าง query หา complaints ที่ส่งให้หน่วยงานนี้
        query = db.query(Complaint).join(OutgoingReport).filter(
            and_(
                Complaint.status == ComplaintStatus.SENT_TO_EXTERNAL,
                OutgoingReport.complaint_id == Complaint.id,
                OutgoingReport.department_id == department_id,
                OutgoingReport.is_active == True
            )
        )
        
        # เพิ่มการกรองตามเงื่อนไข
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(Complaint.created_at >= from_date)
            except ValueError:
                raise HTTPException(400, "Invalid date_from format. Use ISO format.")
        
        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(Complaint.created_at <= to_date)
            except ValueError:
                raise HTTPException(400, "Invalid date_to format. Use ISO format.")
        
        if search:
            query = query.filter(
                or_(
                    Complaint.subject.contains(search),
                    Complaint.description.contains(search),
                    Complaint.complaint_number.contains(search)
                )
            )
        
        # นับจำนวนทั้งหมด
        total = query.count()
        
        # ดึงข้อมูลตาม pagination
        complaints = query.offset(skip).limit(limit).all()
        
        # จัดรูปแบบข้อมูลสำหรับ external department
        result_list = []
        for complaint in complaints:
            # ดึงข้อมูล outgoing report
            outgoing = db.query(OutgoingReport).filter(
                and_(
                    OutgoingReport.complaint_id == complaint.id,
                    OutgoingReport.department_id == department_id
                )
            ).first()
            
            result_list.append({
                "id": str(complaint.id),
                "complaint_number": complaint.complaint_number,
                "subject": complaint.subject,
                "description": complaint.description,
                "status": complaint.status.value if complaint.status else None,
                "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
                "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None,
                "assignment_info": {
                    "sent_at": outgoing.created_at.isoformat() if outgoing and outgoing.created_at else None,
                    "document_number": outgoing.document_number if outgoing else None,
                    "assigned_remark": complaint.assigned_remark
                },
                "progress": {
                    "percentage": complaint.progress_percentage or 0,
                    "notes": complaint.processing_notes
                },
                "priority": {
                    "urgency": complaint.urgency_level.value if complaint.urgency_level else None,
                    "severity": complaint.severity_level.value if complaint.severity_level else None
                },
                "incident": {
                    "date": complaint.incident_date.isoformat() if complaint.incident_date else None,
                    "location": {
                        "province": complaint.incident_province,
                        "district": complaint.incident_district,
                        "subdistrict": complaint.incident_subdistrict
                    }
                }
            })
        
        # บันทึก audit log
        logger.info(f"External department {auth_info.get('department_name')} accessed {len(result_list)} complaints")
        
        return format_response("0000", {
            "complaints": result_list,
            "pagination": {
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_more": (skip + limit) < total
            },
            "department_info": {
                "name": auth_info.get("department_name"),
                "total_assigned": total
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching department complaints: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/complaints/{complaint_id}", response_model=FormatResponseModel)
async def get_complaint_detail(
    complaint_id: UUID,
    auth_info: Dict = Depends(verify_external_department),
    db: Session = Depends(get_db)
):
    """ดึงรายละเอียด complaint เฉพาะที่หน่วยงานมีสิทธิ์เข้าถึง"""
    try:
        department_id = auth_info.get("department_id")
        
        # ตรวจสอบว่าหน่วยงานมีสิทธิ์เข้าถึง complaint นี้
        complaint = db.query(Complaint).join(OutgoingReport).filter(
            and_(
                Complaint.id == complaint_id,
                OutgoingReport.complaint_id == complaint_id,
                OutgoingReport.department_id == department_id,
                OutgoingReport.is_active == True
            )
        ).first()
        
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found or access denied"
            )
        
        # ดึงข้อมูล status history
        status_history = db.query(ComplaintStatusHistory).filter(
            ComplaintStatusHistory.complaint_id == complaint_id
        ).order_by(ComplaintStatusHistory.created_at.asc()).all()
        
        # ดึงข้อมูล outgoing report
        outgoing = db.query(OutgoingReport).filter(
            and_(
                OutgoingReport.complaint_id == complaint_id,
                OutgoingReport.department_id == department_id
            )
        ).first()
        
        # จัดรูปแบบข้อมูลแบบละเอียด
        result = {
            "id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "subject": complaint.subject,
            "description": complaint.description,
            "status": complaint.status.value if complaint.status else None,
            "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
            "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None,
            "assignment_info": {
                "sent_at": outgoing.created_at.isoformat() if outgoing and outgoing.created_at else None,
                "document_number": outgoing.document_number if outgoing else None,
                "assigned_remark": complaint.assigned_remark,
                "assigned_to": complaint.assigned_to
            },
            "progress": {
                "percentage": complaint.progress_percentage or 0,
                "notes": complaint.processing_notes,
                "assigned_officer_id": str(complaint.assigned_officer_id) if complaint.assigned_officer_id else None
            },
            "status_history": [
                {
                    "status": hist.status.value if hist.status else None,
                    "changed_at": hist.created_at.isoformat() if hist.created_at else None,
                    "remark": hist.remark
                }
                for hist in status_history
            ],
            "incident": {
                "date": complaint.incident_date.isoformat() if complaint.incident_date else None,
                "location": {
                    "province": complaint.incident_province,
                    "district": complaint.incident_district,
                    "subdistrict": complaint.incident_subdistrict
                }
            },
            "priority": {
                "urgency": complaint.urgency_level.value if complaint.urgency_level else None,
                "severity": complaint.severity_level.value if complaint.severity_level else None,
                "confidentiality": complaint.confidentiality_level.value if complaint.confidentiality_level else None
            }
        }
        
        return format_response("0000", result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching complaint detail: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.patch("/complaints/{complaint_id}/progress", response_model=FormatResponseModel)
async def update_complaint_progress(
    complaint_id: UUID,
    progress_data: Dict = Body(...),
    auth_info: Dict = Depends(verify_external_department),
    db: Session = Depends(get_db)
):
    """อัพเดทความคืบหน้าการดำเนินงานจากหน่วยงานในสังกัดกระทรวงการคลัง"""
    try:
        department_id = auth_info.get("department_id")
        
        # ตรวจสอบสิทธิ์การเข้าถึง
        complaint = db.query(Complaint).join(OutgoingReport).filter(
            and_(
                Complaint.id == complaint_id,
                OutgoingReport.complaint_id == complaint_id,
                OutgoingReport.department_id == department_id,
                OutgoingReport.is_active == True
            )
        ).first()
        
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found or access denied"
            )
        
        # ตรวจสอบข้อมูลที่ส่งมา
        progress_percentage = progress_data.get("progress_percentage")
        processing_notes = progress_data.get("processing_notes")
        external_status = progress_data.get("external_status")
        
        # อัพเดทข้อมูล
        if progress_percentage is not None:
            if not 0 <= progress_percentage <= 100:
                raise HTTPException(400, "Progress percentage must be between 0 and 100")
            complaint.progress_percentage = progress_percentage
        
        if processing_notes:
            # เพิ่มข้อมูลใหม่ต่อท้าย notes เดิม
            current_notes = complaint.processing_notes or ""
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            dept_name = auth_info.get("department_name", "หน่วยงานภายนอก")
            
            new_note = f"\n[{timestamp}] {dept_name}: {processing_notes}"
            complaint.processing_notes = current_notes + new_note
        
        complaint.updated_at = datetime.now()
        
        # บันทึก status history
        if external_status:
            status_history = ComplaintStatusHistory(
                complaint_id=complaint_id,
                status=complaint.status,
                remark=f"External department update: {external_status}. {processing_notes or ''}",
                created_at=datetime.now()
            )
            db.add(status_history)
        
        db.commit()
        
        # ส่งคืนข้อมูลที่อัพเดทแล้ว
        return format_response("0000", {
            "message": "Progress updated successfully",
            "complaint_id": str(complaint_id),
            "updated_progress": complaint.progress_percentage,
            "updated_at": complaint.updated_at.isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating complaint progress: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/complaints/{complaint_id}/complete", response_model=FormatResponseModel)
async def complete_complaint(
    complaint_id: UUID,
    completion_data: Dict = Body(...),
    auth_info: Dict = Depends(verify_external_department),
    db: Session = Depends(get_db)
):
    """แจ้งผลการดำเนินงานเสร็จสิ้นจากหน่วยงานในสังกัดกระทรวงการคลัง"""
    try:
        department_id = auth_info.get("department_id")
        
        # ตรวจสอบสิทธิ์การเข้าถึง
        complaint = db.query(Complaint).join(OutgoingReport).filter(
            and_(
                Complaint.id == complaint_id,
                OutgoingReport.complaint_id == complaint_id,
                OutgoingReport.department_id == department_id,
                OutgoingReport.is_active == True
            )
        ).first()
        
        if not complaint:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complaint not found or access denied"
            )
        
        # ตรวจสอบว่ายังไม่ได้ mark เป็น completed
        if complaint.status == ComplaintStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Complaint is already completed"
            )
        
        resolution_summary = completion_data.get("resolution_summary")
        completion_notes = completion_data.get("completion_notes")
        outcome = completion_data.get("outcome", "resolved")
        
        if not resolution_summary:
            raise HTTPException(400, "resolution_summary is required")
        
        # อัพเดทข้อมูล
        complaint.resolution_summary = resolution_summary
        complaint.resolved_date = datetime.now()
        complaint.progress_percentage = 100
        
        # อัพเดท processing notes
        current_notes = complaint.processing_notes or ""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        dept_name = auth_info.get("department_name", "หน่วยงานภายนอก")
        
        completion_note = f"\n[{timestamp}] {dept_name} - เสร็จสิ้น: {resolution_summary}"
        if completion_notes:
            completion_note += f"\nหมายเหตุ: {completion_notes}"
        complaint.processing_notes = current_notes + completion_note
        
        # เปลี่ยนสถานะเป็น completed
        complaint.status = ComplaintStatus.COMPLETED
        complaint.updated_at = datetime.now()
        
        # บันทึก status history
        status_history = ComplaintStatusHistory(
            complaint_id=complaint_id,
            status=ComplaintStatus.COMPLETED,
            remark=f"Completed by {dept_name}: {outcome.upper()}",
            created_at=datetime.now()
        )
        db.add(status_history)
        
        db.commit()
        
        logger.info(f"External department {dept_name} completed complaint {complaint_id}")
        
        return format_response("0000", {
            "message": "Complaint completed successfully",
            "complaint_id": str(complaint_id),
            "completion_status": outcome,
            "completed_at": complaint.resolved_date.isoformat(),
            "final_progress": complaint.progress_percentage
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing complaint: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/department/info", response_model=FormatResponseModel)
async def get_department_info(
    auth_info: Dict = Depends(verify_external_department),
    db: Session = Depends(get_db)
):
    """ดึงข้อมูลหน่วยงานและสถิติการทำงาน"""
    try:
        department_id = auth_info.get("department_id")
        
        if not department_id:
            raise HTTPException(403, "API key is not associated with any department")
        
        # ดึงข้อมูลหน่วยงาน
        department = db.query(OutsideDepartment).filter(
            OutsideDepartment.id == department_id
        ).first()
        
        if not department:
            raise HTTPException(404, "Department not found")
        
        # สถิติการทำงาน
        total_assigned = db.query(Complaint).join(OutgoingReport).filter(
            and_(
                OutgoingReport.department_id == department_id,
                OutgoingReport.is_active == True
            )
        ).count()
        
        completed_count = db.query(Complaint).join(OutgoingReport).filter(
            and_(
                OutgoingReport.department_id == department_id,
                OutgoingReport.is_active == True,
                Complaint.status == ComplaintStatus.COMPLETED
            )
        ).count()
        
        in_progress_count = db.query(Complaint).join(OutgoingReport).filter(
            and_(
                OutgoingReport.department_id == department_id,
                OutgoingReport.is_active == True,
                Complaint.status == ComplaintStatus.SENT_TO_EXTERNAL
            )
        ).count()
        
        # API Key info
        api_key_record = db.query(ProjectApiKey).filter(
            and_(
                ProjectApiKey.department_id == department_id,
                ProjectApiKey.api_type == "external_department",
                ProjectApiKey.is_active == True
            )
        ).first()
        
        return format_response("0000", {
            "department": {
                "id": str(department.id),
                "name": department.name,
                "description": department.description,
                "is_active": department.is_active
            },
            "statistics": {
                "total_assigned": total_assigned,
                "completed": completed_count,
                "in_progress": in_progress_count,
                "completion_rate": round((completed_count / max(total_assigned, 1)) * 100, 2)
            },
            "api_access": {
                "project_name": api_key_record.project_name if api_key_record else None,
                "last_used": api_key_record.last_used_at.isoformat() if api_key_record and api_key_record.last_used_at else None,
                "usage_count": api_key_record.usage_count if api_key_record else 0,
                "rate_limit": api_key_record.rate_limit_per_minute if api_key_record else None
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching department info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )