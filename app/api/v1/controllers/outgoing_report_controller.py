from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from uuid import UUID
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, UploadFile
import os
import shutil

from models.outgoing_reports import OutgoingReport, OutgoingReportAttachment
from models.comp_complaint import Complaint  # 🔥 เปิดใช้งาน Complaint import
from models.user import User
from models.position import Position
from models.departments import Department
from models.signature_authorities import SignatureAuthority
from models.user_positions import UserPosition
from app.api.v1.schemas.outgoing_report import OutgoingReportCreate, OutgoingReportUpdate
from lib.logger import get_logger

logger = get_logger("outgoing_report_controller")

class DuplicateKeyError(Exception):
    pass

def get_outgoing_reports(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    position_id: Optional[UUID] = None,
    department_id: Optional[UUID] = None,
    signature_authority_user_id: Optional[UUID] = None,
    urgency_level: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> Dict:
    """ดึงรายการรายงานส่งออก"""
    try:
        # 🔥 Base query with complaint relationship
        query = db.query(OutgoingReport).options(
            joinedload(OutgoingReport.position),
            joinedload(OutgoingReport.signature_authority_user),
            joinedload(OutgoingReport.department),
            joinedload(OutgoingReport.creator),
            joinedload(OutgoingReport.complaint),  # 🔥 เปิดใช้งาน
            joinedload(OutgoingReport.attachments)
        ).filter(OutgoingReport.is_active == True)
        
        # Apply filters
        if search:
            query = query.filter(
                or_(
                    OutgoingReport.reference_number.ilike(f"%{search}%"),
                    OutgoingReport.subject.ilike(f"%{search}%"),
                    OutgoingReport.complaint_number.ilike(f"%{search}%"),
                    OutgoingReport.remarks.ilike(f"%{search}%")
                )
            )
        
        if position_id:
            query = query.filter(OutgoingReport.position_id == position_id)
        
        if department_id:
            query = query.filter(OutgoingReport.department_id == department_id)
        
        if signature_authority_user_id:
            query = query.filter(OutgoingReport.signature_authority_user_id == signature_authority_user_id)
        
        if urgency_level:
            query = query.filter(OutgoingReport.urgency_level == urgency_level)
        
        if date_from:
            query = query.filter(OutgoingReport.reference_date >= date_from)
        
        if date_to:
            query = query.filter(OutgoingReport.reference_date <= date_to)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and order
        reports = query.order_by(OutgoingReport.created_at.desc()).offset(skip).limit(limit).all()
        
        # Format response
        items = []
        for report in reports:
            # ดึงข้อมูลตำแหน่งของผู้สร้าง
            creator_position = None
            if report.creator:
                try:
                    user_position = db.query(UserPosition).filter(
                        UserPosition.user_id == report.created_by,
                        UserPosition.is_primary == True,
                        UserPosition.end_date == None
                    ).options(joinedload(UserPosition.position)).first()
                    
                    if user_position and user_position.position:
                        creator_position = {
                            "position_name": user_position.position.name,
                            "position_level": user_position.position.level,
                            "position_description": user_position.position.description
                        }
                except Exception as e:
                    logger.warning(f"Could not get creator position: {e}")
            
            # 🔥 ใช้ relationship แทน raw SQL
            related_complaint = None
            if report.complaint:
                try:
                    related_complaint = {
                        "id": str(report.complaint.id),
                        "complaint_number": report.complaint.complaint_number,
                        "subject": report.complaint.subject,
                        "status": report.complaint.status.value if report.complaint.status else None
                    }
                except Exception as e:
                    logger.warning(f"Could not get complaint data: {e}")
            
            item = {
                "id": str(report.id),
                
                # ข้อมูลตำแหน่ง
                "position": {
                    "id": str(report.position_id),
                    "name": report.position.name if report.position else "N/A",
                    "level": report.position.level if report.position else None
                },
                
                "reference_number": report.reference_number,
                "reference_date": report.reference_date.isoformat(),
                "subject": report.subject,
                
                "complaint_number": report.complaint_number,
                "complaint_number_date": report.complaint_number_date.isoformat(),
                
                # ข้อมูลผู้มีอำนาจลงนาม
                "signature_authority_user": {
                    "id": str(report.signature_authority_user_id),
                    "name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else "N/A",
                    "email": report.signature_authority_user.email if report.signature_authority_user else "N/A"
                },
                
                # ข้อมูลหน่วยงาน
                "department": {
                    "id": str(report.department_id),
                    "name": report.department.name if report.department else "N/A",
                    "code": report.department.code if report.department else "N/A"
                },
                
                "confidentiality_level": report.confidentiality_level,
                "urgency_level": report.urgency_level,
                "remarks": report.remarks,
                
                "complaint_id": str(report.complaint_id) if report.complaint_id else None,
                "created_at": report.created_at.isoformat(),
                "updated_at": report.updated_at.isoformat() if report.updated_at else None,
                
                # ข้อมูลผู้สร้าง
                "creator": {
                    "id": str(report.creator.id) if report.creator else None,
                    "name": f"{report.creator.first_name} {report.creator.last_name}" if report.creator else "N/A",
                    "email": report.creator.email if report.creator else "N/A",
                    "position": creator_position
                },
                
                # ข้อมูลข้อร้องเรียนที่เกี่ยวข้อง
                "related_complaint": related_complaint,
                
                # ไฟล์แนบ
                "attachments": [
                    {
                        "id": str(att.id),
                        "file_name": att.file_name,
                        "file_size": att.file_size,
                        "file_type": att.file_type,
                        "created_at": att.created_at.isoformat()
                    } for att in report.attachments if att.is_active
                ],
                
                "attachment_count": len([att for att in report.attachments if att.is_active])
            }
            items.append(item)
        
        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1,
            "size": limit,
            "total_pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Error getting outgoing reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def create_outgoing_report(
    db: Session,
    report_data: OutgoingReportCreate,
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None
) -> Dict:
    """สร้างรายงานส่งออกใหม่"""
    try:
        # ตรวจสอบ reference_number ซ้ำ
        existing = db.query(OutgoingReport).filter(
            OutgoingReport.reference_number == report_data.reference_number,
            OutgoingReport.is_active == True
        ).first()
        
        if existing:
            raise DuplicateKeyError(f"เลข สป.กค {report_data.reference_number} มีอยู่แล้ว")
        
        # ตรวจสอบ position
        position = db.query(Position).filter(
            Position.id == report_data.position_id,
            Position.is_active == True
        ).first()
        if not position:
            raise HTTPException(status_code=404, detail="ไม่พบตำแหน่งที่ระบุ")
        
        # ตรวจสอบ signature authority user
        signature_user = db.query(User).filter(
            User.id == report_data.signature_authority_user_id,
            User.is_active == True
        ).first()
        if not signature_user:
            raise HTTPException(status_code=404, detail="ไม่พบผู้มีอำนาจลงนามที่ระบุ")
        
        # ตรวจสอบ department
        department = db.query(Department).filter(
            Department.id == report_data.department_id,
            Department.is_active == True
        ).first()
        if not department:
            raise HTTPException(status_code=404, detail="ไม่พบหน่วยงานที่ระบุ")
        
        # 🔥 ตรวจสอบข้อร้องเรียนด้วย ORM (ถ้ามี)
        if report_data.complaint_id:
            complaint = db.query(Complaint).filter(Complaint.id == report_data.complaint_id).first()
            if not complaint:
                raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")
        
        # สร้างรายงานใหม่
        db_report = OutgoingReport(
            **report_data.model_dump(exclude={"attachments"}),
            created_by=current_user_id
        )
        
        db.add(db_report)
        db.flush()  # เพื่อให้ได้ ID
        
        # อัปโหลดไฟล์ (ถ้ามี)
        if files:
            upload_dir = f"uploads/outgoing_reports/{str(db_report.id)}"
            os.makedirs(upload_dir, exist_ok=True)
            
            for file in files:
                # บันทึกไฟล์
                file_path = os.path.join(upload_dir, file.filename)
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                
                # สร้างข้อมูลไฟล์แนบ
                attachment = OutgoingReportAttachment(
                    outgoing_report_id=db_report.id,
                    file_name=file.filename,
                    file_path=file_path,
                    file_size=f"{file.size} bytes" if hasattr(file, 'size') else None,
                    file_type=file.content_type if hasattr(file, 'content_type') else None
                )
                db.add(attachment)
        
        db.commit()
        db.refresh(db_report)
        
        logger.info(f"Created outgoing report: {db_report.reference_number}")
        
        # 🔥 Return ข้อมูลง่ายๆ
        return {
            "id": str(db_report.id),
            "reference_number": db_report.reference_number,
            "reference_date": db_report.reference_date.isoformat(),
            "subject": db_report.subject,
            "complaint_number": db_report.complaint_number,
            "confidentiality_level": db_report.confidentiality_level,
            "urgency_level": db_report.urgency_level,
            "created_at": db_report.created_at.isoformat(),
            "message": "สร้างรายงานส่งออกเรียบร้อยแล้ว"
        }
        
    except DuplicateKeyError:
        db.rollback()
        raise
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating outgoing report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report_options(db: Session) -> Dict:
    """ดึงตัวเลือกสำหรับ dropdown ต่างๆ"""
    try:
        # ดึงรายการตำแหน่ง
        positions = db.query(Position).filter(Position.is_active == True).order_by(Position.name).all()
        
        # ดึงรายการหน่วยงาน
        departments = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
        
        # ดึงรายการผู้มีอำนาจลงนาม
        signature_authorities = db.query(SignatureAuthority).options(
            joinedload(SignatureAuthority.user),
            joinedload(SignatureAuthority.department)
        ).filter(SignatureAuthority.is_active == True).all()
        
        # จัดกลุ่มผู้มีอำนาจลงนามตามหน่วยงาน
        signature_authorities_by_dept = {}
        for auth in signature_authorities:
            dept_id = str(auth.department_id)
            if dept_id not in signature_authorities_by_dept:
                signature_authorities_by_dept[dept_id] = {
                    "department_id": dept_id,
                    "department_name": auth.department.name if auth.department else "ไม่ระบุ",
                    "users": []
                }
            
            signature_authorities_by_dept[dept_id]["users"].append({
                "user_id": str(auth.user_id),
                "user_name": f"{auth.user.first_name} {auth.user.last_name}" if auth.user else "ไม่ระบุ",
                "authority_id": str(auth.id)
            })
        
        return {
            "positions": [
                {
                    "id": str(pos.id),
                    "name": pos.name,
                    "level": pos.level,
                    "description": pos.description
                } for pos in positions
            ],
            
            "departments": [
                {
                    "id": str(dept.id),
                    "name": dept.name,
                    "code": dept.code,
                    "short_name": dept.short_name
                } for dept in departments
            ],
            
            # รายการผู้มีอำนาจลงนามจัดกลุ่มตามหน่วยงาน
            "signature_authorities": list(signature_authorities_by_dept.values()),
            
            # ค่าคงที่
            "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
            "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"]
        }
        
    except Exception as e:
        logger.error(f"Error getting outgoing report options: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report_by_id(db: Session, report_id: UUID) -> Dict:
    """ดึงรายงานส่งออกตาม ID"""
    try:
        report = db.query(OutgoingReport).options(
            joinedload(OutgoingReport.position),
            joinedload(OutgoingReport.signature_authority_user),
            joinedload(OutgoingReport.department),
            joinedload(OutgoingReport.creator),
            joinedload(OutgoingReport.updater),
            joinedload(OutgoingReport.complaint),
            joinedload(OutgoingReport.attachments)
        ).filter(
            OutgoingReport.id == report_id,
            OutgoingReport.is_active == True
        ).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")
        
        # 🔥 ดึงข้อมูลตำแหน่งของผู้สร้างอย่างปลอดภัย
        creator_position = None
        if report.creator and report.created_by:
            try:
                user_position = db.query(UserPosition).filter(
                    UserPosition.user_id == report.created_by,
                    UserPosition.is_primary == True,
                    UserPosition.end_date == None
                ).options(joinedload(UserPosition.position)).first()
                
                if user_position and user_position.position:
                    creator_position = {
                        "position_name": user_position.position.name,
                        "position_level": user_position.position.level,
                        "position_description": user_position.position.description
                    }
            except Exception as e:
                logger.warning(f"Could not get creator position: {e}")
                creator_position = None
        
        # 🔥 สร้าง response อย่างปลอดภัย
        response_data = {
            "id": str(report.id),
            
            # ข้อมูลตำแหน่ง
            "position": {
                "id": str(report.position_id) if report.position_id else None,
                "name": report.position.name if report.position else "N/A",
                "level": report.position.level if report.position else None,
                "description": report.position.description if report.position else None
            } if report.position else {
                "id": str(report.position_id) if report.position_id else None,
                "name": "N/A",
                "level": None,
                "description": None
            },
            
            "reference_number": report.reference_number,
            "reference_date": report.reference_date.isoformat() if report.reference_date else None,
            "subject": report.subject,
            
            "complaint_number": report.complaint_number,
            "complaint_number_date": report.complaint_number_date.isoformat() if report.complaint_number_date else None,
            
            # ข้อมูลผู้มีอำนาจลงนาม
            "signature_authority_user": {
                "id": str(report.signature_authority_user_id) if report.signature_authority_user_id else None,
                "name": f"{report.signature_authority_user.first_name} {report.signature_authority_user.last_name}" if report.signature_authority_user else "N/A",
                "email": report.signature_authority_user.email if report.signature_authority_user else "N/A"
            } if report.signature_authority_user else {
                "id": str(report.signature_authority_user_id) if report.signature_authority_user_id else None,
                "name": "N/A",
                "email": "N/A"
            },
            
            # ข้อมูลหน่วยงาน
            "department": {
                "id": str(report.department_id) if report.department_id else None,
                "name": report.department.name if report.department else "N/A",
                "code": report.department.code if report.department else "N/A",
                "short_name": report.department.short_name if report.department else "N/A"
            } if report.department else {
                "id": str(report.department_id) if report.department_id else None,
                "name": "N/A",
                "code": "N/A",
                "short_name": "N/A"
            },
            
            "confidentiality_level": report.confidentiality_level,
            "urgency_level": report.urgency_level,
            "remarks": report.remarks,
            
            "complaint_id": str(report.complaint_id) if report.complaint_id else None,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "updated_at": report.updated_at.isoformat() if report.updated_at else None,
            
            # ข้อมูลผู้สร้าง
            "creator": {
                "id": str(report.creator.id) if report.creator and hasattr(report.creator, 'id') else None,
                "name": f"{report.creator.first_name} {report.creator.last_name}" if report.creator and hasattr(report.creator, 'first_name') else "N/A",
                "email": report.creator.email if report.creator and hasattr(report.creator, 'email') else "N/A",
                "position": creator_position
            } if report.creator else {
                "id": str(report.created_by) if report.created_by else None,
                "name": "N/A",
                "email": "N/A",
                "position": None
            },
            
            # ข้อมูลผู้แก้ไข
            "updater": {
                "id": str(report.updater.id) if report.updater and hasattr(report.updater, 'id') else None,
                "name": f"{report.updater.first_name} {report.updater.last_name}" if report.updater and hasattr(report.updater, 'first_name') else None,
                "email": report.updater.email if report.updater and hasattr(report.updater, 'email') else None
            } if report.updater else None,
            
            # ข้อมูลข้อร้องเรียนที่เกี่ยวข้อง - ใช้ try-catch
            "related_complaint": None,
            
            # ไฟล์แนบ
            "attachments": []
        }
        
        # 🔥 ดึงข้อมูล complaint แยกด้วย try-catch
        try:
            if report.complaint and hasattr(report.complaint, 'id'):
                response_data["related_complaint"] = {
                    "id": str(report.complaint.id),
                    "complaint_number": report.complaint.complaint_number if hasattr(report.complaint, 'complaint_number') else "N/A",
                    "subject": report.complaint.subject if hasattr(report.complaint, 'subject') else "N/A",
                    "status": report.complaint.status.value if hasattr(report.complaint, 'status') and report.complaint.status else None,
                    "created_at": report.complaint.created_at.isoformat() if hasattr(report.complaint, 'created_at') and report.complaint.created_at else None,
                    "reference_number": report.complaint.reference_number if hasattr(report.complaint, 'reference_number') else None,
                    "reference_date": report.complaint.reference_date.isoformat() if hasattr(report.complaint, 'reference_date') and report.complaint.reference_date else None
                }
        except Exception as e:
            logger.warning(f"Could not get complaint data: {e}")
            response_data["related_complaint"] = None
        
        # 🔥 ดึงข้อมูล attachments แยกด้วย try-catch
        try:
            if report.attachments:
                response_data["attachments"] = [
                    {
                        "id": str(att.id) if hasattr(att, 'id') else None,
                        "file_name": att.file_name if hasattr(att, 'file_name') else "N/A",
                        "file_path": att.file_path if hasattr(att, 'file_path') else "N/A",
                        "file_size": att.file_size if hasattr(att, 'file_size') else None,
                        "file_type": att.file_type if hasattr(att, 'file_type') else None,
                        "created_at": att.created_at.isoformat() if hasattr(att, 'created_at') and att.created_at else None
                    } for att in report.attachments if hasattr(att, 'is_active') and att.is_active
                ]
        except Exception as e:
            logger.warning(f"Could not get attachments data: {e}")
            response_data["attachments"] = []
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting outgoing report by ID: {str(e)}")
        logger.error(f"Report ID: {report_id}")
        logger.error(f"Error type: {type(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def auto_fill_from_complaint(db: Session, complaint_id: UUID) -> Dict:
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")
        
        return {
            "complaint_id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "complaint_number_date": complaint.created_at.isoformat(),
            "reference_number": complaint.reference_number,
            "reference_date": complaint.reference_date.isoformat() if complaint.reference_date else None,
            "subject": complaint.subject,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto filling from complaint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

# เพิ่มฟังก์ชันอื่นๆ ที่จำเป็น...