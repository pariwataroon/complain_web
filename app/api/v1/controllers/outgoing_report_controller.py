import logging
import traceback
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from uuid import UUID
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, UploadFile
import os
import shutil

from models.outgoing_reports import OutgoingReport, OutgoingReportAttachment
from models.comp_complaint import Complaint
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

def create_outgoing_report(
    db: Session,
    report_data: OutgoingReportCreate,
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None
) -> Dict:
    """สร้างรายงานส่งออกใหม่"""
    
    db_report = None
    
    try:
        logger.info(f"=== START CREATE OUTGOING REPORT ===")
        logger.info(f"Report data: {report_data}")
        logger.info(f"Current user ID: {current_user_id} (type: {type(current_user_id)})")
        
        # ตรวจสอบและเก็บ objects สำหรับ response
        position = None
        signature_user = None
        department = None
        complaint = None
        
        # ตรวจสอบ reference_number ซ้ำ
        logger.info("Checking duplicate reference number...")
        existing = db.query(OutgoingReport).filter(
            OutgoingReport.reference_number == report_data.reference_number,
            OutgoingReport.is_active == True
        ).first()
        
        if existing:
            logger.error(f"Duplicate reference number: {report_data.reference_number}")
            raise DuplicateKeyError(f"เลข สป.กค {report_data.reference_number} มีอยู่แล้ว")
        
        logger.info("Reference number OK - no duplicates")
        
        # ตรวจสอบ position
        logger.info(f"Validating position_id: {report_data.position_id}")
        position = db.query(Position).filter(
            Position.id == report_data.position_id,
            Position.is_active == True
        ).first()
        
        if not position:
            logger.error(f"Position not found: {report_data.position_id}")
            raise HTTPException(status_code=404, detail="ไม่พบตำแหน่งที่ระบุ")
        
        logger.info(f"Position found: {position.name}")
        
        # ตรวจสอบ signature authority user
        logger.info(f"Validating signature_authority_user_id: {report_data.signature_authority_user_id}")
        signature_user = db.query(User).filter(
            User.id == report_data.signature_authority_user_id,
            User.is_active == True
        ).first()
        
        if not signature_user:
            logger.error(f"Signature user not found: {report_data.signature_authority_user_id}")
            raise HTTPException(status_code=404, detail="ไม่พบผู้มีอำนาจลงนามที่ระบุ")
        
        logger.info(f"Signature user found: {signature_user.first_name} {signature_user.last_name}")
        
        # ตรวจสอบ department
        logger.info(f"Validating department_id: {report_data.department_id}")
        department = db.query(Department).filter(
            Department.id == report_data.department_id,
            Department.is_active == True
        ).first()
        
        if not department:
            logger.error(f"Department not found: {report_data.department_id}")
            raise HTTPException(status_code=404, detail="ไม่พบหน่วยงานที่ระบุ")
        
        logger.info(f"Department found: {department.name}")
        
        # ตรวจสอบข้อร้องเรียน (ถ้ามี)
        if report_data.complaint_id:
            logger.info(f"Validating complaint_id: {report_data.complaint_id}")
            try:
                complaint = db.query(Complaint).filter(
                    Complaint.id == report_data.complaint_id
                ).first()
                
                if complaint:
                    logger.info(f"Complaint found: {complaint.complaint_number}")
                else:
                    logger.warning(f"Complaint not found: {report_data.complaint_id}")
            except Exception as e:
                logger.warning(f"Could not verify complaint: {e}")
        else:
            logger.info("No complaint_id provided")
        
        # สร้าง OutgoingReport object
        logger.info("Creating OutgoingReport object...")
        try:
            db_report = OutgoingReport(
                position_id=report_data.position_id,
                reference_number=report_data.reference_number,
                reference_date=report_data.reference_date,
                subject=report_data.subject,
                complaint_number=report_data.complaint_number,
                complaint_number_date=report_data.complaint_number_date,
                signature_authority_user_id=report_data.signature_authority_user_id,
                department_id=report_data.department_id,
                confidentiality_level=report_data.confidentiality_level,
                urgency_level=report_data.urgency_level,
                remarks=report_data.remarks,
                complaint_id=report_data.complaint_id,
                created_by=current_user_id
            )
            logger.info("OutgoingReport object created successfully")
            
        except Exception as e:
            logger.error(f"Error creating OutgoingReport object: {e}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            raise
        
        # เพิ่ม object ลงใน session
        logger.info("Adding object to session...")
        try:
            db.add(db_report)
            logger.info("Object added to session successfully")
        except Exception as e:
            logger.error(f"Error adding to session: {e}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            raise
        
        # Flush เพื่อให้ได้ ID
        logger.info("Flushing session to get ID...")
        try:
            db.flush()
            logger.info(f"Flushed successfully, got ID: {db_report.id}")
        except Exception as e:
            logger.error(f"Error during flush: {e}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            raise
        
        # จัดการไฟล์แนบ (ถ้ามี)
        attachment_list = []
        if files:
            logger.info(f"Processing {len(files)} files...")
            upload_dir = f"uploads/outgoing_reports/{str(db_report.id)}"
            os.makedirs(upload_dir, exist_ok=True)
            
            for i, file in enumerate(files):
                try:
                    logger.info(f"Processing file {i+1}: {file.filename}")
                    
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
                    attachment_list.append(attachment)
                    logger.info(f"File {i+1} processed successfully")
                    
                except Exception as e:
                    logger.warning(f"Could not save file {file.filename}: {e}")
        
        # Commit transaction
        logger.info("Committing transaction...")
        try:
            db.commit()
            logger.info("Transaction committed successfully")
        except Exception as e:
            logger.error(f"Error during commit: {e}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            raise
        
        # Refresh objects
        logger.info("Refreshing objects...")
        try:
            db.refresh(db_report)
            for att in attachment_list:
                db.refresh(att)
            logger.info("Objects refreshed successfully")
        except Exception as e:
            logger.error(f"Error during refresh: {e}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            # ไม่ raise เพราะ object สร้างสำเร็จแล้ว
        
        logger.info(f"Successfully created outgoing report: {db_report.reference_number}")
        
        # 🔥 สร้าง response ที่สมบูรณ์
        logger.info("Creating complete response...")
        try:
            result = {
                "id": str(db_report.id),
                "position": {
                    "id": str(position.id),
                    "name": position.name,
                    "level": position.level,
                    "description": position.description
                },
                "reference_number": db_report.reference_number,
                "reference_date": db_report.reference_date.isoformat() if db_report.reference_date else None,
                "subject": db_report.subject,
                "complaint_number": db_report.complaint_number,
                "complaint_number_date": db_report.complaint_number_date.isoformat() if db_report.complaint_number_date else None,
                
                # ข้อมูลผู้มีอำนาจลงนาม
                "signature_authority_user": {
                    "id": str(signature_user.id),
                    "name": f"{signature_user.first_name} {signature_user.last_name}".strip(),
                    "email": signature_user.email if signature_user.email else "N/A"
                },
                
                # ข้อมูลหน่วยงาน
                "department": {
                    "id": str(department.id),
                    "name": department.name,
                    "code": department.code,
                    "short_name": department.short_name
                },
                
                "confidentiality_level": db_report.confidentiality_level,
                "urgency_level": db_report.urgency_level,
                "remarks": db_report.remarks,
                
                # ข้อมูลข้อร้องเรียนที่เกี่ยวข้อง
                "related_complaint": {
                    "id": str(complaint.id),
                    "complaint_number": complaint.complaint_number,
                    "subject": complaint.subject,
                    "status": complaint.status.value if hasattr(complaint, 'status') and complaint.status else None
                } if complaint else None,
                
                "complaint_id": str(db_report.complaint_id) if db_report.complaint_id else None,
                "created_at": db_report.created_at.isoformat() if db_report.created_at else None,
                "updated_at": db_report.updated_at.isoformat() if db_report.updated_at else None,
                
                # ข้อมูลไฟล์แนบ
                "attachments": [
                    {
                        "id": str(att.id),
                        "file_name": att.file_name,
                        "file_size": att.file_size,
                        "file_type": att.file_type,
                        "created_at": att.created_at.isoformat()
                    } for att in attachment_list
                ],
                "attachment_count": len(attachment_list),
                
                "message": "สร้างรายงานส่งออกเรียบร้อยแล้ว"
            }
            
            logger.info(f"Response created: {result}")
            logger.info("=== END CREATE OUTGOING REPORT (SUCCESS) ===")
            return result
            
        except Exception as e:
            logger.error(f"Error creating response: {e}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            # ถ้า response ไม่ได้ ให้ return ข้อมูลพื้นฐาน
            return {
                "id": str(db_report.id) if db_report and db_report.id else "unknown",
                "message": "สร้างรายงานส่งออกเรียบร้อยแล้ว แต่มีปัญหาในการสร้าง response"
            }
        
    except DuplicateKeyError as e:
        logger.error(f"=== DUPLICATE KEY ERROR ===")
        logger.error(f"Error: {e}")
        db.rollback()
        raise
        
    except HTTPException as e:
        logger.error(f"=== HTTP EXCEPTION ===")
        logger.error(f"Status: {e.status_code}, Detail: {e.detail}")
        db.rollback()
        raise
        
    except Exception as e:
        logger.error(f"=== UNEXPECTED ERROR ===")
        logger.error(f"Error: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error args: {e.args}")
        logger.error(f"Full stack trace: {traceback.format_exc()}")
        
        # ถ้ามี object ให้ log ข้อมูล
        if db_report:
            logger.error(f"OutgoingReport object exists: ID={getattr(db_report, 'id', 'None')}")
        
        db.rollback()
        logger.error("=== END CREATE OUTGOING REPORT (ERROR) ===")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_report_by_id(db: Session, report_id: UUID) -> Dict:
    """ดึงรายงานส่งออกตาม ID"""
    try:
        # 🔥 Load relationships พร้อมกัน
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
        
        # 🔥 สร้าง response แบบสมบูรณ์
        response_data = {
            "id": str(report.id),
            
            # ข้อมูลตำแหน่ง
            "position": {
                "id": str(report.position_id),
                "name": report.position.name if report.position else "N/A",
                "level": report.position.level if report.position else None,
                "description": report.position.description if report.position else None
            },
            
            "reference_number": report.reference_number,
            "reference_date": report.reference_date.isoformat() if report.reference_date else None,
            "subject": report.subject,
            "complaint_number": report.complaint_number,
            "complaint_number_date": report.complaint_number_date.isoformat() if report.complaint_number_date else None,
            
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
                "code": report.department.code if report.department else "N/A",
                "short_name": report.department.short_name if report.department else "N/A"
            },
            
            "confidentiality_level": report.confidentiality_level,
            "urgency_level": report.urgency_level,
            "remarks": report.remarks,
            "complaint_id": str(report.complaint_id) if report.complaint_id else None,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "updated_at": report.updated_at.isoformat() if report.updated_at else None,
            
            # ข้อมูลผู้สร้าง
            "creator": {
                "id": str(report.creator.id) if report.creator else None,
                "name": f"{report.creator.first_name} {report.creator.last_name}" if report.creator else "N/A",
                "email": report.creator.email if report.creator else "N/A"
            },
            
            # ข้อมูลผู้แก้ไข
            "updater": {
                "id": str(report.updater.id) if report.updater else None,
                "name": f"{report.updater.first_name} {report.updater.last_name}" if report.updater else None,
                "email": report.updater.email if report.updater else None
            } if report.updater else None,
            
            # ข้อมูลข้อร้องเรียนที่เกี่ยวข้อง
            "related_complaint": {
                "id": str(report.complaint.id),
                "complaint_number": report.complaint.complaint_number,
                "subject": report.complaint.subject,
                "status": report.complaint.status.value if hasattr(report.complaint, 'status') and report.complaint.status else None
            } if report.complaint else None,
            
            # ไฟล์แนบ
            "attachments": [
                {
                    "id": str(att.id),
                    "file_name": att.file_name,
                    "file_path": att.file_path,
                    "file_size": att.file_size,
                    "file_type": att.file_type,
                    "created_at": att.created_at.isoformat()
                } for att in report.attachments if att.is_active
            ],
            "attachment_count": len([att for att in report.attachments if att.is_active])
        }
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting outgoing report by ID: {str(e)}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

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
        # 🔥 Load relationships พร้อมกัน
        query = db.query(OutgoingReport).options(
            joinedload(OutgoingReport.position),
            joinedload(OutgoingReport.signature_authority_user),
            joinedload(OutgoingReport.department),
            joinedload(OutgoingReport.creator),
            joinedload(OutgoingReport.complaint),
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
        
        # 🔥 Format response แบบสมบูรณ์
        items = []
        for report in reports:
            item = {
                "id": str(report.id),
                
                # ข้อมูลตำแหน่ง
                "position": {
                    "id": str(report.position_id),
                    "name": report.position.name if report.position else "N/A",
                    "level": report.position.level if report.position else None
                },
                
                "reference_number": report.reference_number,
                "reference_date": report.reference_date.isoformat() if report.reference_date else None,
                "subject": report.subject,
                "complaint_number": report.complaint_number,
                "complaint_number_date": report.complaint_number_date.isoformat() if report.complaint_number_date else None,
                
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
                "created_at": report.created_at.isoformat() if report.created_at else None,
                "updated_at": report.updated_at.isoformat() if report.updated_at else None,
                
                # ข้อมูลผู้สร้าง
                "creator": {
                    "id": str(report.creator.id) if report.creator else None,
                    "name": f"{report.creator.first_name} {report.creator.last_name}" if report.creator else "N/A",
                    "email": report.creator.email if report.creator else "N/A"
                },
                
                # ข้อมูลข้อร้องเรียนที่เกี่ยวข้อง
                "related_complaint": {
                    "id": str(report.complaint.id),
                    "complaint_number": report.complaint.complaint_number,
                    "subject": report.complaint.subject,
                    "status": report.complaint.status.value if hasattr(report.complaint, 'status') and report.complaint.status else None
                } if report.complaint else None,
                
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
    

def get_outgoing_report_options(db: Session) -> Dict:
    """ดึงตัวเลือกสำหรับ dropdown ต่างๆ"""
    try:
        logger.info("Getting outgoing report options...")
        
        # ดึงรายการตำแหน่ง
        positions = db.query(Position).filter(Position.is_active == True).order_by(Position.name).all()
        logger.info(f"Found {len(positions)} positions")
        
        # ดึงรายการหน่วยงาน
        departments = db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()
        logger.info(f"Found {len(departments)} departments")
        
        # ดึงรายการผู้มีอำนาจลงนาม - ใช้ Users ที่ active
        signature_list = []
        try:
            users = db.query(User).filter(User.is_active == True).order_by(User.first_name).all()
            for user in users:
                signature_list.append({
                    "id": str(user.id),
                    "user_id": str(user.id),
                    "name": f"{user.first_name} {user.last_name}".strip(),
                    "email": user.email if user.email else "N/A"
                })
            logger.info(f"Found {len(signature_list)} signature authorities")
        except Exception as e:
            logger.warning(f"Could not load signature authorities: {e}")
        
        result = {
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
            
            "signature_authorities": signature_list,
            
            "confidentiality_levels": ["ปกติ", "ลับ", "ลับมาก", "ลับที่สุด"],
            "urgency_levels": ["ปกติ", "เร่งด่วน", "เร่งด่วนมาก", "เร่งด่วนที่สุด"]
        }
        
        logger.info("Options retrieved successfully")
        return result
        
    except Exception as e:
        logger.error(f"Error getting outgoing report options: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def auto_fill_from_complaint(db: Session, complaint_id: UUID) -> Dict:
    """ดึงข้อมูลจากข้อร้องเรียนมาเติมในฟอร์ม"""
    try:
        logger.info(f"Auto filling from complaint: {complaint_id}")
        
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            logger.error(f"Complaint not found: {complaint_id}")
            raise HTTPException(status_code=404, detail="ไม่พบข้อร้องเรียนที่ระบุ")
        
        logger.info(f"Found complaint: {complaint.complaint_number}")
        
        result = {
            "complaint_id": str(complaint.id),
            "complaint_number": complaint.complaint_number,
            "complaint_number_date": complaint.created_at.isoformat() if complaint.created_at else None,
            "reference_number": complaint.reference_number if hasattr(complaint, 'reference_number') else None,
            "reference_date": complaint.reference_date.isoformat() if hasattr(complaint, 'reference_date') and complaint.reference_date else None,
            "subject": complaint.subject,
        }
        
        logger.info(f"Auto fill data: {result}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error auto filling from complaint: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def update_outgoing_report(
    db: Session,
    report_id: UUID,
    report_data: OutgoingReportUpdate,
    current_user_id: UUID,
    files: Optional[List[UploadFile]] = None
) -> Dict:
    """แก้ไขรายงานส่งออก"""
    try:
        logger.info(f"=== START UPDATE OUTGOING REPORT: {report_id} ===")
        
        # ค้นหารายงานที่ต้องการแก้ไข
        report = db.query(OutgoingReport).filter(
            OutgoingReport.id == report_id,
            OutgoingReport.is_active == True
        ).first()
        
        if not report:
            logger.error(f"Report not found: {report_id}")
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")
        
        logger.info(f"Found report: {report.reference_number}")
        
        # ตรวจสอบ reference_number ซ้ำ (ถ้ามีการเปลี่ยน)
        if hasattr(report_data, 'reference_number') and report_data.reference_number != report.reference_number:
            existing = db.query(OutgoingReport).filter(
                OutgoingReport.reference_number == report_data.reference_number,
                OutgoingReport.is_active == True,
                OutgoingReport.id != report_id
            ).first()
            
            if existing:
                logger.error(f"Duplicate reference number: {report_data.reference_number}")
                raise DuplicateKeyError(f"เลข สป.กค {report_data.reference_number} มีอยู่แล้ว")
        
        # อัปเดตข้อมูล
        update_data = report_data.dict(exclude_unset=True)
        update_data['updated_by'] = current_user_id
        
        for field, value in update_data.items():
            if hasattr(report, field):
                setattr(report, field, value)
        
        db.commit()
        db.refresh(report)
        
        logger.info(f"Updated report: {report.reference_number}")
        
        # ใช้ get_outgoing_report_by_id เพื่อ return ข้อมูลที่สมบูรณ์
        return get_outgoing_report_by_id(db, report_id)
        
    except DuplicateKeyError:
        db.rollback()
        raise
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating outgoing report: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def delete_outgoing_report(db: Session, report_id: UUID, current_user_id: UUID) -> Dict:
    """ลบรายงานส่งออก (soft delete)"""
    try:
        logger.info(f"=== START DELETE OUTGOING REPORT: {report_id} ===")
        
        # ค้นหารายงานที่ต้องการลบ
        report = db.query(OutgoingReport).filter(
            OutgoingReport.id == report_id,
            OutgoingReport.is_active == True
        ).first()
        
        if not report:
            logger.error(f"Report not found: {report_id}")
            raise HTTPException(status_code=404, detail="ไม่พบรายงานที่ระบุ")
        
        logger.info(f"Found report: {report.reference_number}")
        
        # Soft delete
        report.is_active = False
        report.updated_by = current_user_id
        
        # ลบไฟล์แนบด้วย
        for attachment in report.attachments:
            attachment.is_active = False
        
        db.commit()
        
        logger.info(f"Deleted report: {report.reference_number}")
        
        return {
            "id": str(report_id),
            "message": "ลบรายงานส่งออกเรียบร้อยแล้ว"
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting outgoing report: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาด: {str(e)}")

def get_outgoing_tracking(
    db: Session,
    complaint_id: UUID,
    report_type: Optional[str] = None  # "outgoing_report" | "outgoing_report3" | "status_history"
) -> Dict[str, Any]:
    """
    ติดตามสถานะหลังส่งหนังสือออก (OutgoingReport → OutgoingReport3)
    - สรุป Complaint + status_history
    - รวม OutgoingReport (ส่งหน่วยงาน) และ OutgoingReport3 (ผลพิจารณา)
    - คืน derived.suggested_next_status (ไม่แก้ DB)
    - รองรับการกรองประเภท timeline ด้วย report_type
    """

    # ---- helpers ----
    def _iso(dt):
        return dt.isoformat() if dt else None

    def _enum_str(v):
        if v is None:
            return None
        return getattr(v, "value", str(v))

    def _safe_str(v):
        return str(v) if v is not None else None

    # label ไทยของสถานะเรื่องร้องเรียน (ฝั่งเรามี enum อยู่แล้ว)
    status_th_map = {
        "submitted": "ส่งคำร้อง",
        "sent_to_agency": "ส่งหน่วยงาน",
        "in_process": "อยู่ระหว่างดำเนินการ",
        "in_review": "อยู่ระหว่างการพิจารณา",
        "tracking": "ติดตามผลการพิจารณา",
        "reviewed": "แจ้งผลการพิจารณา",
        "completed": "เสร็จสิ้น",
        "cancelled": "ยกเลิก",
    }
    # label ไทยของผลพิจารณา/แนวโน้ม
    decision_th_map = {
        "completed": "เสร็จสิ้น",
        "tracking": "ติดตามต่อ",
        "reviewed": "มีผลพิจารณา",
        "sent_to_agency": "ส่งหน่วยงานแล้ว",
    }

    # ---- fetch base complaint + history ----
    complaint = (
        db.query(Complaint)
        .options(joinedload(Complaint.status_history))
        .filter(Complaint.id == complaint_id)
        .first()
    )
    if not complaint:
        return {"error": "COMPLAINT_NOT_FOUND"}

    # ---- fetch OutgoingReport (การส่งหนังสือออก) ----
    outgoing_list: List[OutgoingReport] = (
        db.query(OutgoingReport)
        .filter(
            OutgoingReport.is_active == True,
            OutgoingReport.complaint_id == complaint_id
        )
        .order_by(OutgoingReport.created_at.asc())
        .all()
    )

    # ---- fetch OutgoingReport3 (ผลพิจารณาจากหน่วยงาน) ถ้ามีโมเดลนี้ ----
    decision_list = []
    OR3Model = None
    try:
        from models.outgoing_reports3 import OutgoingReport3 as OR3Model  # type: ignore
    except Exception:
        OR3Model = None

    if OR3Model:
        decision_list = (
            db.query(OR3Model)
            .filter(
                OR3Model.is_active == True,
                OR3Model.complaint_id == complaint_id
            )
            .order_by(OR3Model.created_at.asc())
            .all()
        )

    # ---- build timeline ----
    timeline: List[Dict[str, Any]] = []

    # 1) status history ของ complaint
    try:
        for h in (complaint.status_history or []):
            st = _enum_str(getattr(h, "status", None))
            timeline.append({
                "type": "status_history",
                "at": _iso(getattr(h, "created_at", None)),
                "status": st,
                "status_label": status_th_map.get(st, st),
                "note": getattr(h, "note", None) or getattr(h, "remark", None),
                "by": _safe_str(getattr(h, "updated_by", None))
            })
    except Exception:
        pass

    # 2) OutgoingReport (ส่งหนังสือออก)
    for r in outgoing_list:
        timeline.append({
            "type": "outgoing_report",
            "at": _iso(getattr(r, "created_at", None)),
            "reference_number": getattr(r, "reference_number", None),
            "reference_date": _iso(getattr(r, "reference_date", None)),
            "subject": getattr(r, "subject", None),
            "department_id": _safe_str(getattr(r, "department_id", None)),
            "confidentiality": _enum_str(getattr(r, "confidentiality_level", None)),
            "urgency": _enum_str(getattr(r, "urgency_level", None)),
            "by": _safe_str(getattr(r, "created_by", None)),
            "id": _safe_str(getattr(r, "id", None))
        })

    # 3) OutgoingReport3 (ผลพิจารณาที่ตอบกลับ)
    latest_decision: Optional[Dict[str, Any]] = None
    for d in decision_list:
        result_raw = (
            getattr(d, "result", None)
            or getattr(d, "outcome", None)
            or getattr(d, "decision_status", None)
        )
        item = {
            "type": "outgoing_report3",
            "at": _iso(getattr(d, "created_at", None)),
            "decision_subject": getattr(d, "subject", None),
            "decision_note": getattr(d, "remarks", None) or getattr(d, "note", None),
            "reference_number": getattr(d, "reference_number", None),
            "reference_date": _iso(getattr(d, "reference_date", None)),
            "by": _safe_str(getattr(d, "created_by", None)),
            "id": _safe_str(getattr(d, "id", None)),
            "result": result_raw,
            # label ไทยแบบหยาบจากข้อความผลลัพธ์
            "result_label": None,
        }
        timeline.append(item)
        latest_decision = item  # ตัวท้ายสุดคืออันล่าสุด

    # ---- latest sent (OutgoingReport ล่าสุด) ----
    latest_sent = None
    if outgoing_list:
        r = outgoing_list[-1]
        latest_sent = {
            "id": _safe_str(getattr(r, "id", None)),
            "reference_number": getattr(r, "reference_number", None),
            "reference_date": _iso(getattr(r, "reference_date", None)),
            "subject": getattr(r, "subject", None),
            "department_id": _safe_str(getattr(r, "department_id", None)),
            "created_at": _iso(getattr(r, "created_at", None)),
        }

    # ---- derive suggested_next_status (ไม่เขียน DB) + label ไทย ----
    current_status = _enum_str(getattr(complaint, "status", None))
    suggested_next = None

    if latest_decision:
        decision_text = (latest_decision.get("result") or "")
        decision_text_l = decision_text.lower()
        if any(k in decision_text_l for k in ["complete", "completed", "success", "สำเร็จ", "เสร็จ", "ปิดเรื่อง"]):
            suggested_next = "completed"
        elif any(k in decision_text_l for k in ["ติดตาม", "ต่อเนื่อง", "follow", "follow-up", "รอ", "pending", "review"]):
            suggested_next = "tracking"
        else:
            suggested_next = "reviewed"
        # ใส่ label ไทยของผลลัพธ์ใน timeline อันล่าสุด
        latest_decision["result_label"] = decision_th_map.get(suggested_next, suggested_next)
    elif latest_sent:
        suggested_next = "sent_to_agency"

    # ---- filter timeline ตาม report_type (ถ้ามี) ----
    if report_type in {"outgoing_report", "outgoing_report3", "status_history"}:
        timeline = [t for t in timeline if t.get("type") == report_type]

    # ---- sort timeline (ISO พร้อมเรียง) ----
    def _ts(x: Dict[str, Any]):
        return x.get("at") or x.get("reference_date") or x.get("created_at") or ""
    timeline.sort(key=_ts)

    # ---- response ----
    return {
        "complaint": {
            "id": _safe_str(getattr(complaint, "id", None)),
            "complaint_number": getattr(complaint, "complaint_number", None),
            "subject": getattr(complaint, "subject", None),
            "status": current_status,
            "status_label": status_th_map.get(current_status, current_status),
            "created_at": _iso(getattr(complaint, "created_at", None)),
            "updated_at": _iso(getattr(complaint, "updated_at", None)),
        },
        "counts": {
            "outgoing_reports": len(outgoing_list),
            "decisions": len(decision_list),
        },
        "latest": {
            "sent": latest_sent,
            "decision": latest_decision,
        },
        "history": timeline,
        "derived": {
            "current_status": current_status,
            "current_status_label": status_th_map.get(current_status, current_status),
            "suggested_next_status": suggested_next,
            "suggested_next_status_label": decision_th_map.get(suggested_next, suggested_next),
        }
    }