from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from uuid import UUID
from typing import Dict, Any, Optional, List
import json

from models.comp_complaint import Complaint, ComplaintStatus
from models.comp_complaint_types import ComplaintChannel
from models.user import User

import logging
logger = logging.getLogger(__name__)

def get_document_storage_by_channel(
    db: Session,
    page_type: str = "website",  # "website" หรือ "card"
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    complaint_type: Optional[str] = None,
    complaint_subtype: Optional[str] = None,
    assignee: Optional[str] = None,
    location: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    complainant_name: Optional[str] = None
) -> Dict:
    """ดึงข้อมูลคลังเอกสารแบ่งตามช่องทาง"""
    try:
        # กำหนด channel ตาม page_type
        if page_type == "website":
            # ช่องทางเว็บไซต์ - ใช้ channel ที่มี "เว็บไซต์" ในชื่อ
            target_channels = db.query(ComplaintChannel).filter(
                ComplaintChannel.is_active == True,
                or_(
                    ComplaintChannel.name.contains("เว็บไซต์"),
                    ComplaintChannel.description.contains("ร้องเรียนผ่านเว็บไซต์")
                )
            ).all()
        elif page_type == "card":
            # ช่องทางบัตรสนเท่ห์
            target_channels = db.query(ComplaintChannel).filter(
                ComplaintChannel.is_active == True,
                or_(
                    ComplaintChannel.name.contains("บัตรสนเท่ห์"),
                    ComplaintChannel.description.contains("บัตรสนเท่ห์")
                )
            ).all()
        else:
            # Default: แสดงทั้งหมด
            target_channels = db.query(ComplaintChannel).filter(
                ComplaintChannel.is_active == True
            ).all()
        
        # ดึง channel IDs
        channel_ids = [channel.id for channel in target_channels]
        
        if not channel_ids:
            return {
                "items": [],
                "total": 0,
                "page_info": {
                    "current_page": (skip // limit) + 1,
                    "page_size": limit,
                    "total_pages": 0
                },
                "channels": []
            }
        
        # สร้าง base query
        query = db.query(Complaint).filter(
            Complaint.complaint_channel_id.in_(channel_ids)
        )
        
        # Apply filters
        if status:
            query = query.filter(Complaint.status == status)
        
        if complaint_type:
            query = query.filter(Complaint.complaint_type_id == UUID(complaint_type))
        
        if complaint_subtype:
            query = query.filter(Complaint.complaint_subtype_id == UUID(complaint_subtype))
        
        if assignee:
            query = query.filter(
                or_(
                    Complaint.assigned_officer_id == UUID(assignee),
                    Complaint.assigned_to.contains(assignee)
                )
            )
        
        if urgency:
            query = query.filter(Complaint.urgency_level == urgency)
        
        if search:
            query = query.filter(
                or_(
                    Complaint.complaint_number.contains(search),
                    Complaint.subject.contains(search),
                    Complaint.description.contains(search)
                )
            )
        
        if complainant_name:
            query = query.filter(
                Complaint.complainant_data.contains(complainant_name)
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
        
        # Format response
        items = []
        for complaint in complaints:
            # ดึงข้อมูลผู้ร้องเรียน
            complainant_data = {}
            try:
                complainant_data = json.loads(complaint.complainant_data) if complaint.complainant_data else {}
            except:
                complainant_data = {}
            
            # ดึงข้อมูลผู้ถูกร้องเรียน
            respondent_data = {}
            try:
                respondent_data = json.loads(complaint.respondent_data) if complaint.respondent_data else {}
            except:
                respondent_data = {}
            
            # ดึงข้อมูลเจ้าหน้าที่ที่รับผิดชอบ
            assigned_officer = None
            if complaint.assigned_officer_id:
                assigned_officer = db.query(User).filter(User.id == complaint.assigned_officer_id).first()
            
            # ดึงข้อมูล channel
            channel_info = None
            if complaint.complaint_channel_id:
                channel_info = db.query(ComplaintChannel).filter(
                    ComplaintChannel.id == complaint.complaint_channel_id
                ).first()
            
            items.append({
                "วันที่รับ": complaint.created_at.strftime("%d %b %Y") if complaint.created_at else "",
                "หมายเลข": complaint.complaint_number or "",
                "ข้อมูลผู้ร้อง": complainant_data.get("name", "") or f"{complainant_data.get('firstName', '')} {complainant_data.get('lastName', '')}".strip(),
                "เรื่อง": complaint.subject or "",
                "ประเภทเรื่อง": complaint.complaint_type or "",
                "ประเภทเรื่องย่อย": "",  # จะต้องเชื่อมโยงกับ complaint_subtype
                "เจ้าหน้าที่ที่รับผิดชอบ": complaint.assigned_to or "",
                "สถานะเรื่อง": complaint.status.value if complaint.status else "",
                "หมายเหตุ": complaint.assigned_remark or "",
                
                # ข้อมูลเพิ่มเติมสำหรับ API
                "id": str(complaint.id),
                "complaint_id": str(complaint.id),
                "status": complaint.status.value if complaint.status else "",
                "urgency_level": complaint.urgency_level,
                "confidentiality_level": complaint.confidentiality_level,
                "assigned_officer": {
                    "id": str(assigned_officer.id) if assigned_officer else None,
                    "name": f"{assigned_officer.first_name} {assigned_officer.last_name}" if assigned_officer else None
                } if assigned_officer else None,
                "channel": {
                    "id": str(channel_info.id) if channel_info else None,
                    "name": channel_info.name if channel_info else None,
                    "description": channel_info.description if channel_info else None
                } if channel_info else None,
                "complainant": complainant_data,
                "respondent": respondent_data,
                "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
                "updated_at": complaint.updated_at.isoformat() if complaint.updated_at else None,
                "registration_date": complaint.registration_date.isoformat() if complaint.registration_date else None,
                "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None
            })
        
        # Calculate pagination info
        total_pages = (total + limit - 1) // limit
        current_page = (skip // limit) + 1
        
        return {
            "items": items,
            "total": total,
            "page_info": {
                "current_page": current_page,
                "page_size": limit,
                "total_pages": total_pages,
                "has_next": current_page < total_pages,
                "has_prev": current_page > 1
            },
            "channels": [
                {
                    "id": str(channel.id),
                    "name": channel.name,
                    "description": channel.description
                } for channel in target_channels
            ],
            "page_type": page_type
        }
        
    except Exception as e:
        logger.error(f"Error getting document storage: {str(e)}")
        return {
            "items": [],
            "total": 0,
            "page_info": {
                "current_page": 1,
                "page_size": limit,
                "total_pages": 0
            },
            "channels": [],
            "error": str(e)
        }

def get_document_storage_statistics(
    db: Session,
    page_type: str = "website"
) -> Dict:
    """ดึงสถิติคลังเอกสาร"""
    try:
        # กำหนด channel ตาม page_type
        if page_type == "website":
            target_channels = db.query(ComplaintChannel).filter(
                ComplaintChannel.is_active == True,
                or_(
                    ComplaintChannel.name.contains("เว็บไซต์"),
                    ComplaintChannel.description.contains("ร้องเรียนผ่านเว็บไซต์")
                )
            ).all()
        elif page_type == "card":
            target_channels = db.query(ComplaintChannel).filter(
                ComplaintChannel.is_active == True,
                or_(
                    ComplaintChannel.name.contains("บัตรสนเท่ห์"),
                    ComplaintChannel.description.contains("บัตรสนเท่ห์")
                )
            ).all()
        else:
            target_channels = db.query(ComplaintChannel).filter(
                ComplaintChannel.is_active == True
            ).all()
        
        channel_ids = [channel.id for channel in target_channels]
        
        if not channel_ids:
            return {"total": 0, "by_status": {}, "by_urgency": {}, "by_month": {}}
        
        # สถิติรวม
        total_complaints = db.query(Complaint).filter(
            Complaint.complaint_channel_id.in_(channel_ids)
        ).count()
        
        # สถิติตามสถานะ
        status_stats = db.query(
            Complaint.status,
            func.count(Complaint.id).label('count')
        ).filter(
            Complaint.complaint_channel_id.in_(channel_ids)
        ).group_by(Complaint.status).all()
        
        # สถิติตามความเร่งด่วน
        urgency_stats = db.query(
            Complaint.urgency_level,
            func.count(Complaint.id).label('count')
        ).filter(
            Complaint.complaint_channel_id.in_(channel_ids)
        ).group_by(Complaint.urgency_level).all()
        
        # สถิติรายเดือน (6 เดือนล่าสุด)
        from datetime import datetime, timedelta
        six_months_ago = datetime.now() - timedelta(days=180)
        
        monthly_stats = db.query(
            func.date_trunc('month', Complaint.created_at).label('month'),
            func.count(Complaint.id).label('count')
        ).filter(
            Complaint.complaint_channel_id.in_(channel_ids),
            Complaint.created_at >= six_months_ago
        ).group_by(func.date_trunc('month', Complaint.created_at)).all()
        
        return {
            "total": total_complaints,
            "by_status": {str(status): count for status, count in status_stats},
            "by_urgency": {str(urgency): count for urgency, count in urgency_stats if urgency},
            "by_month": {str(month): count for month, count in monthly_stats},
            "page_type": page_type,
            "channels": [
                {
                    "id": str(channel.id),
                    "name": channel.name,
                    "description": channel.description
                } for channel in target_channels
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting document storage statistics: {str(e)}")
        return {"error": str(e)}

def get_document_storage_filters(db: Session) -> Dict:
    """ดึงตัวเลือกสำหรับ filter"""
    try:
        # ดึงสถานะทั้งหมด
        statuses = db.query(Complaint.status).distinct().all()
        
        # ดึงระดับความเร่งด่วน
        urgency_levels = db.query(Complaint.urgency_level).distinct().all()
        
        # ดึงเจ้าหน้าที่ที่มีการมอบหมาย
        assigned_officers = db.query(User).filter(
            User.id.in_(
                db.query(Complaint.assigned_officer_id).filter(
                    Complaint.assigned_officer_id.isnot(None)
                ).distinct()
            )
        ).all()
        
        # ดึง complaint types และ subtypes
        from models.comp_complaint_types import ComplaintType, ComplaintSubType
        complaint_types = db.query(ComplaintType).filter(ComplaintType.is_active == True).all()
        complaint_subtypes = db.query(ComplaintSubType).filter(ComplaintSubType.is_active == True).all()
        
        return {
            "statuses": [
                {"value": status[0].value, "label": get_thai_status(status[0].value)} 
                for status in statuses if status[0]
            ],
            "urgency_levels": [
                {"value": urgency[0], "label": get_thai_urgency(urgency[0])} 
                for urgency in urgency_levels if urgency[0]
            ],
            "assignees": [
                {
                    "value": str(officer.id),
                    "label": f"{officer.first_name} {officer.last_name}".strip()
                } for officer in assigned_officers
            ],
            "complaint_types": [
                {"value": str(ct.id), "label": ct.name} 
                for ct in complaint_types
            ],
            "complaint_subtypes": [
                {"value": str(cst.id), "label": cst.name} 
                for cst in complaint_subtypes
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting document storage filters: {str(e)}")
        return {"error": str(e)}

def get_thai_status(status: str) -> str:
    """แปลงสถานะเป็นภาษาไทย"""
    status_mapping = {
        "submitted": "รับเรื่อง",
        "sent_to_agency": "ส่งหน่วยงาน", 
        "in_process": "กำลังดำเนินการ",
        "in_review": "อยู่ระหว่างพิจารณา",
        "tracking": "ติดตามผล",
        "reviewed": "แจ้งผลการพิจารณา",
        "completed": "เสร็จสิ้น",
        "cancelled": "ยกเลิก"
    }
    return status_mapping.get(status.lower(), status)

def get_thai_urgency(urgency: str) -> str:
    """แปลงระดับความเร่งด่วนเป็นภาษาไทย"""
    urgency_mapping = {
        "low": "ไม่เร่งด่วน",
        "medium": "ปานกลาง",
        "high": "เร่งด่วน",
        "urgent": "ด่วนมาก",
        "critical": "ด่วนที่สุด"
    }
    return urgency_mapping.get(urgency.lower(), urgency)