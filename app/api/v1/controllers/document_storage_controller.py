from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from uuid import UUID
from typing import Dict, Any, Optional, List
import json

from models.comp_complaint import Complaint, ComplaintStatus
from models.comp_complaint_types import ComplaintChannel, ComplaintType, ComplaintSubType
from models.user import User
from models.departments import Department
from models.outgoing_reports import OutgoingReport
from models.outgoing_reports2 import OutgoingReport2
from models.outgoing_reports3 import OutgoingReport3
from models.outgoing_reports4 import OutgoingReport4

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
    """
    ดึงข้อมูลคลังเอกสารแบ่งตามช่องทาง (สำหรับ listing/summary เท่านั้น)
    
    หมายเหตุ: endpoint นี้ให้ข้อมูลสรุปเท่านั้น ไม่รวม all_related เพื่อ performance
    สำหรับรายละเอียดเต็มของแต่ละเรื่อง ให้ใช้ get_document_storage_detail()
    """

def get_parent_chain(db: Session, complaint_id: UUID, visited_ids: set = None) -> List[Dict]:
    """
    ตามหา parent chain แบบ recursive จนถึง master complaint สูงสุด
    Returns: รายการ parent complaints จากใกล้ที่สุดไปไกลที่สุด
    """
    if visited_ids is None:
        visited_ids = set()
    
    # ป้องกัน infinite loop
    if complaint_id in visited_ids:
        return []
    
    visited_ids.add(complaint_id)
    
    # หา parent complaint
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint or not complaint.parent_complaint_id:
        return []
    
    parent = db.query(Complaint).filter(Complaint.id == complaint.parent_complaint_id).first()
    if not parent:
        return []
    
    # สร้างข้อมูล parent
    parent_info = {
        "id": str(parent.id),
        "complaint_number": parent.complaint_number,
        "subject": parent.subject,
        "status": parent.status.value if parent.status else None,
        "is_master": parent.parent_complaint_id is None
    }
    
    # เรียก recursive เพื่อหา parent ของ parent
    grandparents = get_parent_chain(db, parent.id, visited_ids.copy())
    
    # ส่งกลับ parent chain (ใกล้ไปไกล)
    return [parent_info] + grandparents

def get_master_complaint(db: Session, complaint_id: UUID) -> Optional[Dict]:
    """
    หา master complaint สูงสุดของเส้นทาง
    """
    parent_chain = get_parent_chain(db, complaint_id)
    if not parent_chain:
        # ถ้าไม่มี parent แสดงว่าตัวเองคือ master
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if complaint:
            return {
                "id": str(complaint.id),
                "complaint_number": complaint.complaint_number,
                "subject": complaint.subject,
                "status": complaint.status.value if complaint.status else None,
                "is_master": True
            }
        return None
    
    # หา master จากท้าย chain
    for parent in reversed(parent_chain):
        if parent["is_master"]:
            return parent
    
    # ถ้าไม่เจอ master ใน chain ให้ใช้ตัวสุดท้าย
    return parent_chain[-1] if parent_chain else None

def get_related_complaints(db: Session, complaint_id: UUID) -> Dict:
    """
    หาเรื่องร้องเรียนที่เกี่ยวข้องทั้งหมดในกลุ่มเดียวกัน
    รวมทั้ง master, parent, children, และ siblings
    Returns: {
        "master_complaint": {...},
        "parent_complaint": {...},
        "parent_chain": [...],
        "child_complaints": [...],
        "sibling_complaints": [...],
        "all_related": [...] # เรื่องทั้งหมดในกลุ่ม เรียงตาม complaint_number
    }
    """
    result = {
        "master_complaint": None,
        "parent_complaint": None,
        "parent_chain": [],
        "child_complaints": [],
        "sibling_complaints": [],
        "all_related": []
    }
    
    try:
        current_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not current_complaint:
            return result
        
        # 1. หา master complaint
        master_complaint = get_master_complaint(db, complaint_id)
        result["master_complaint"] = master_complaint
        
        # 2. หา parent chain
        parent_chain = get_parent_chain(db, complaint_id)
        result["parent_chain"] = parent_chain
        
        # 3. หา parent complaint ตรงๆ
        if current_complaint.parent_complaint_id:
            parent = db.query(Complaint).filter(
                Complaint.id == current_complaint.parent_complaint_id
            ).first()
            if parent:
                result["parent_complaint"] = {
                    "id": str(parent.id),
                    "complaint_number": parent.complaint_number,
                    "subject": parent.subject,
                    "status": parent.status.value if parent.status else None,
                    "is_master": parent.parent_complaint_id is None
                }
        
        # 4. หา master complaint ID สำหรับ query
        master_id = None
        if master_complaint:
            master_id = UUID(master_complaint["id"])
        elif current_complaint.parent_complaint_id is None:
            # ตัวเองคือ master
            master_id = complaint_id
        
        if master_id:
            # 5. หา children ของ complaint ปัจจุบัน
            children = db.query(Complaint).filter(
                Complaint.parent_complaint_id == complaint_id
            ).order_by(Complaint.complaint_number).all()
            
            result["child_complaints"] = [
                {
                    "id": str(child.id),
                    "complaint_number": child.complaint_number,
                    "subject": child.subject,
                    "status": child.status.value if child.status else None,
                    "is_master": child.parent_complaint_id is None
                } for child in children
            ]
            
            # 6. หา siblings (เรื่องที่มี parent เดียวกัน)
            if current_complaint.parent_complaint_id:
                siblings = db.query(Complaint).filter(
                    Complaint.parent_complaint_id == current_complaint.parent_complaint_id,
                    Complaint.id != complaint_id  # ไม่รวมตัวเอง
                ).order_by(Complaint.complaint_number).all()
                
                result["sibling_complaints"] = [
                    {
                        "id": str(sibling.id),
                        "complaint_number": sibling.complaint_number,
                        "subject": sibling.subject,
                        "status": sibling.status.value if sibling.status else None,
                        "is_master": sibling.parent_complaint_id is None
                    } for sibling in siblings
                ]
            
            # 7. หาเรื่องทั้งหมดในกลุ่มเดียวกัน (ทั้ง master และ descendants)
            all_related_complaints = []
            
            # เพิ่ม master complaint
            master_complaint_obj = db.query(Complaint).filter(Complaint.id == master_id).first()
            if master_complaint_obj:
                all_related_complaints.append(master_complaint_obj)
            
            # เพิ่ม descendants ทั้งหมดของ master
            def get_all_descendants(parent_id: UUID, visited: set = None):
                if visited is None:
                    visited = set()
                if parent_id in visited:
                    return []
                visited.add(parent_id)
                
                descendants = []
                children = db.query(Complaint).filter(
                    Complaint.parent_complaint_id == parent_id
                ).all()
                
                for child in children:
                    descendants.append(child)
                    # เรียกแบบ recursive เพื่อหา grandchildren
                    descendants.extend(get_all_descendants(child.id, visited.copy()))
                
                return descendants
            
            descendants = get_all_descendants(master_id)
            all_related_complaints.extend(descendants)
            
            # แปลงเป็น dict แบบง่ายๆ ไม่เรียงก่อน
            all_related_list = [
                {
                    "id": str(complaint.id),
                    "complaint_number": complaint.complaint_number,
                    "subject": complaint.subject,
                    "status": complaint.status.value if complaint.status else None,
                    "is_master": complaint.parent_complaint_id is None,
                    "is_current": complaint.id == complaint_id,  # บอกว่าเป็นเรื่องปัจจุบันหรือไม่
                    "parent_complaint_id": str(complaint.parent_complaint_id) if complaint.parent_complaint_id else None,
                    "created_at": complaint.created_at.isoformat() if complaint.created_at else None,
                    "complainant_name": get_complainant_name_from_data(complaint.complainant_data)
                } for complaint in all_related_complaints
            ]
            
            # เก็บไว้ใน result โดยไม่เรียงก่อน - จะเรียงตอน response
            result["all_related"] = all_related_list
    
    except Exception as e:
        logger.error(f"Error getting related complaints for {complaint_id}: {str(e)}")
    
    return result

def get_complainant_name_from_data(complainant_data_str: str) -> str:
    """แยกชื่อผู้ร้องเรียนจาก JSON string"""
    try:
        if complainant_data_str:
            data = json.loads(complainant_data_str)
            return data.get("name", "") or f"{data.get('firstName', '')} {data.get('lastName', '')}".strip()
    except:
        pass
    return ""

def get_bulk_related_complaints(db: Session, complaint_ids: List[UUID]) -> Dict[UUID, Dict]:
    """
    ดึงข้อมูล related complaints แบบ bulk เพื่อลด database queries
    Returns: {complaint_id: related_info_dict}
    """
    if not complaint_ids:
        return {}
    
    # ดึงข้อมูล complaints ทั้งหมดที่เกี่ยวข้อง
    all_complaints = db.query(Complaint).filter(
        or_(
            Complaint.id.in_(complaint_ids),
            Complaint.parent_complaint_id.in_(complaint_ids)
        )
    ).all()
    
    # สร้าง lookup dictionaries
    complaints_by_id = {c.id: c for c in all_complaints}
    children_by_parent = {}
    
    # จัดกลุ่ม children ตาม parent
    for complaint in all_complaints:
        if complaint.parent_complaint_id:
            if complaint.parent_complaint_id not in children_by_parent:
                children_by_parent[complaint.parent_complaint_id] = []
            children_by_parent[complaint.parent_complaint_id].append(complaint)
    
    # สำหรับหา master complaints ของแต่ละกลุ่ม
    master_lookup = {}
    
    def find_master_for_complaint(complaint_id: UUID) -> Optional[Complaint]:
        """หา master complaint ของ complaint_id ที่กำหนด"""
        if complaint_id in master_lookup:
            return master_lookup[complaint_id]
            
        complaint = complaints_by_id.get(complaint_id)
        if not complaint:
            return None
            
        # ถ้าไม่มี parent = เป็น master
        if not complaint.parent_complaint_id:
            master_lookup[complaint_id] = complaint
            return complaint
            
        # หา master แบบ recursive
        master = find_master_for_complaint(complaint.parent_complaint_id)
        master_lookup[complaint_id] = master
        return master
    
    # สร้าง result สำหรับแต่ละ complaint
    result = {}
    
    for complaint_id in complaint_ids:
        complaint = complaints_by_id.get(complaint_id)
        if not complaint:
            continue
            
        # หา master complaint
        master_complaint = find_master_for_complaint(complaint_id)
        
        # หา parent ตรงๆ
        parent_complaint = None
        if complaint.parent_complaint_id:
            parent_complaint = complaints_by_id.get(complaint.parent_complaint_id)
        
        # หา children
        children = children_by_parent.get(complaint_id, [])
        
        # หา siblings (เฉพาะที่มี parent เดียวกัน)
        siblings = []
        if complaint.parent_complaint_id:
            all_siblings = children_by_parent.get(complaint.parent_complaint_id, [])
            siblings = [s for s in all_siblings if s.id != complaint_id]
        
        # หา all_related (รวมทั้งกลุ่ม)
        all_related = []
        if master_complaint:
            # เริ่มจาก master
            all_related.append(master_complaint)
            
            # เพิ่ม descendants ทั้งหมด
            def collect_descendants(parent_id: UUID):
                descendants = []
                for child in children_by_parent.get(parent_id, []):
                    descendants.append(child)
                    descendants.extend(collect_descendants(child.id))
                return descendants
            
            descendants = collect_descendants(master_complaint.id)
            all_related.extend(descendants)
            
            # เรียงตาม complaint_number
            all_related.sort(key=lambda x: x.complaint_number or "")
        
        # จัดรูปแบบข้อมูล
        result[complaint_id] = {
            "master_complaint": {
                "id": str(master_complaint.id),
                "complaint_number": master_complaint.complaint_number,
                "subject": master_complaint.subject,
                "status": master_complaint.status.value if master_complaint.status else None,
                "is_master": True
            } if master_complaint else None,
            
            "parent_complaint": {
                "id": str(parent_complaint.id),
                "complaint_number": parent_complaint.complaint_number,
                "subject": parent_complaint.subject,
                "status": parent_complaint.status.value if parent_complaint.status else None,
                "is_master": parent_complaint.parent_complaint_id is None
            } if parent_complaint else None,
            
            "child_complaints": [
                {
                    "id": str(child.id),
                    "complaint_number": child.complaint_number,
                    "subject": child.subject,
                    "status": child.status.value if child.status else None,
                    "is_master": False
                } for child in children
            ],
            
            "sibling_complaints": [
                {
                    "id": str(sibling.id),
                    "complaint_number": sibling.complaint_number,
                    "subject": sibling.subject,
                    "status": sibling.status.value if sibling.status else None,
                    "is_master": False
                } for sibling in siblings
            ],
            
            # สร้าง all_related แบบง่ายๆ ไม่เรียงก่อน - จะเรียงตอน response
            "all_related": [
                {
                    "id": str(c.id),
                    "complaint_number": c.complaint_number,
                    "subject": c.subject,
                    "status": c.status.value if c.status else None,
                    "is_master": c.parent_complaint_id is None,
                    "is_current": c.id == complaint_id,
                    "parent_complaint_id": str(c.parent_complaint_id) if c.parent_complaint_id else None,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                    "complainant_name": get_complainant_name_from_data(c.complainant_data)
                } for c in all_related
            ],
            
            "parent_chain": []  # จะเพิ่มทีหลังถ้าจำเป็น
        }
    
    return result

def get_document_storage_detail(db: Session, complaint_id: UUID) -> Dict:
    """
    ดึงรายละเอียดเต็มของ complaint เดียว รวมถึงข้อมูลความสัมพันธ์ทั้งหมด
    ใช้สำหรับ detail view ที่ต้องการข้อมูลครบถ้วน
    """
    try:
        # ดึงข้อมูล complaint หลัก
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"error": "Complaint not found", "detail": None}
        
        # ดึงข้อมูลความสัมพันธ์ทั้งหมด
        related_info = get_related_complaints(db, complaint_id)
        
        # ดึงข้อมูลผู้ร้องเรียน
        complainant_data = {}
        try:
            complainant_data = json.loads(complaint.complainant_data) if complaint.complainant_data else {}
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Error parsing complainant_data for complaint {complaint.id}: {str(e)}")
            complainant_data = {}
        
        # ดึงข้อมูลผู้ถูกร้องเรียน
        respondent_data = {}
        try:
            respondent_data = json.loads(complaint.respondent_data) if complaint.respondent_data else {}
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Error parsing respondent_data for complaint {complaint.id}: {str(e)}")
            respondent_data = {}
        
        # ดึงข้อมูลเจ้าหน้าที่ที่รับผิดชอบ
        assigned_officer = None
        if complaint.assigned_officer_id:
            assigned_officer = db.query(User).filter(User.id == complaint.assigned_officer_id).first()
        
        # ดึงข้อมูลผู้สร้างเรื่องร้องเรียน
        creator = None
        if complaint.created_by:
            creator = db.query(User).filter(User.id == complaint.created_by).first()
        
        # ดึงข้อมูล channel
        channel_info = None
        if complaint.complaint_channel_id:
            channel_info = db.query(ComplaintChannel).filter(
                ComplaintChannel.id == complaint.complaint_channel_id
            ).first()
        
        # 🔥 ดึงข้อมูลประวัติสถานะของเรื่องร้องเรียน
        status_history = []
        try:
            # ดึงจาก table comp_complaint_status_history โดยตรง
            from models.comp_complaint import ComplaintStatusHistory
            status_history_records = db.query(ComplaintStatusHistory).filter(
                ComplaintStatusHistory.complaint_id == complaint_id
            ).order_by(ComplaintStatusHistory.changed_at.desc()).all()
            
            if status_history_records:
                # แปลงจาก SQLAlchemy objects เป็น dictionaries
                status_history = []
                for record in status_history_records:
                    # ดึงข้อมูลผู้ทำการเปลี่ยนแปลง
                    changed_by_user = None
                    if record.changed_by:
                        changed_by_user = db.query(User).filter(User.id == record.changed_by).first()
                    
                    status_history.append({
                        "status": record.status.value if hasattr(record.status, 'value') else str(record.status),
                        "changed_at": record.changed_at.isoformat() if record.changed_at else None,
                        "changed_by": str(record.changed_by) if record.changed_by else None,
                        "changed_by_name": f"{changed_by_user.first_name} {changed_by_user.last_name}".strip() if changed_by_user else "ระบบ",
                        "remark": record.notes or ""
                    })
            
            # ถ้าไม่มีข้อมูลในตาราง status_history ให้ fallback
            elif hasattr(complaint, 'status_history') and complaint.status_history:
                # ถ้ามี status_history field ใน model และเป็น relationship
                if isinstance(complaint.status_history, list):
                    # ถ้าเป็น SQLAlchemy relationship objects ให้แปลงเป็น dict
                    status_history = []
                    for history_item in complaint.status_history:
                        try:
                            status_history.append({
                                "status": history_item.status.value if hasattr(history_item.status, 'value') else str(history_item.status),
                                "changed_at": history_item.changed_at.isoformat() if history_item.changed_at else None,
                                "changed_by": str(history_item.changed_by) if history_item.changed_by else None,
                                "remark": history_item.remark or ""
                            })
                        except Exception as e:
                            logger.warning(f"Error converting status history item: {str(e)}")
                            continue
                elif isinstance(complaint.status_history, str):
                    # ถ้าเป็น JSON string
                    try:
                        status_history = json.loads(complaint.status_history)
                    except (json.JSONDecodeError, TypeError) as e:
                        logger.warning(f"Error parsing status_history JSON for complaint {complaint.id}: {str(e)}")
                        status_history = []
                else:
                    # ถ้าเป็น object อื่นๆ ให้ลองแปลง
                    try:
                        status_history = list(complaint.status_history) if complaint.status_history else []
                    except Exception as e:
                        logger.warning(f"Error converting status_history for complaint {complaint.id}: {str(e)}")
                        status_history = []
            else:
                # ถ้าไม่มี status_history field ให้สร้างประวัติเบื้องต้นจากข้อมูลที่มี
                status_history = []
                
                # 1. เรื่องถูกสร้างขึ้น
                if complaint.created_at:
                    status_history.append({
                        "status": "submitted",
                        "changed_at": complaint.created_at.isoformat(),
                        "changed_by": str(complaint.created_by) if complaint.created_by else None,
                        "remark": "เรื่องร้องเรียนถูกสร้างขึ้น"
                    })
                
                # 2. ถ้ามีการมอบหมายงาน
                if complaint.assigned_date and complaint.assigned_officer_id:
                    status_history.append({
                        "status": "assigned",
                        "changed_at": complaint.assigned_date.isoformat(),
                        "changed_by": None,  # ระบบมอบหมายงาน
                        "remark": f"มอบหมายงานให้ {complaint.assigned_to or 'เจ้าหน้าที่'}"
                    })
                
                # 3. ถ้ามีการยืนยัน/ปฏิเสธรับงาน
                if complaint.confirm_assigned_date and complaint.confirm_assigned_status == True:
                    status_history.append({
                        "status": "confirmed",
                        "changed_at": complaint.confirm_assigned_date.isoformat(),
                        "changed_by": str(complaint.confirm_assigned_by) if complaint.confirm_assigned_by else None,
                        "remark": "ยืนยันรับงาน"
                    })
                elif complaint.confirm_assigned_status == False:
                    status_history.append({
                        "status": "rejected",
                        "changed_at": complaint.confirm_assigned_date.isoformat() if complaint.confirm_assigned_date else None,
                        "changed_by": str(complaint.confirm_assigned_by) if complaint.confirm_assigned_by else None,
                        "remark": "ปฏิเสธรับงาน"
                    })
                
                # 4. สถานะปัจจุบัน (ถ้าแตกต่างจาก submitted)
                if complaint.status and complaint.status.value != "submitted":
                    status_history.append({
                        "status": complaint.status.value,
                        "changed_at": complaint.updated_at.isoformat() if complaint.updated_at else complaint.created_at.isoformat(),
                        "changed_by": None,
                        "remark": f"สถานะปัจจุบัน: {get_thai_status(complaint.status.value)}"
                    })
                
                # ถ้าไม่มี status_history เลย ให้สร้างอย่างน้อย 1 รายการ
                if not status_history and complaint.created_at:
                    status_history.append({
                        "status": complaint.status.value if complaint.status else "unknown",
                        "changed_at": complaint.created_at.isoformat(),
                        "changed_by": str(complaint.created_by) if complaint.created_by else None,
                        "remark": "เรื่องร้องเรียนในระบบ"
                    })
        except Exception as e:
            logger.warning(f"Error building status_history for complaint {complaint.id}: {str(e)}")
            status_history = []
        
        # 🔥 ดึงข้อมูล outgoing reports ที่เกี่ยวข้องกับ complaint นี้
        outgoing_reports_data = {}
        try:
            # ดึง outgoing reports ประเภทที่ 1 (ส่งหน่วยงานที่เกี่ยวข้อง)
            outgoing_reports1 = db.query(OutgoingReport).filter(
                OutgoingReport.complaint_id == complaint_id,
                OutgoingReport.is_active == True
            ).all()
            
            outgoing_reports_data["type1"] = []
            for report in outgoing_reports1:
                outgoing_reports_data["type1"].append({
                    "id": str(report.id),
                    "reference_number": report.reference_number,
                    "reference_date": report.reference_date.isoformat() if report.reference_date else None,
                    "subject": report.subject,
                    "complaint_number": report.complaint_number,
                    "complaint_number_date": report.complaint_number_date.isoformat() if report.complaint_number_date else None,
                    "confidentiality_level": report.confidentiality_level,
                    "urgency_level": report.urgency_level,
                    "remarks": report.remarks,
                    "created_at": report.created_at.isoformat() if report.created_at else None,
                    "type_description": "รายงานส่งหน่วยงานที่เกี่ยวข้อง"
                })
            
            # ดึง outgoing reports ประเภทที่ 2 (แจ้งผู้ร้องเรียน)
            outgoing_reports2 = db.query(OutgoingReport2).filter(
                OutgoingReport2.complaint_id == complaint_id,
                OutgoingReport2.is_active == True
            ).all()
            
            outgoing_reports_data["type2"] = []
            for report in outgoing_reports2:
                outgoing_reports_data["type2"].append({
                    "id": str(report.id),
                    "complaint_number": report.complaint_number,
                    "complaint_number_date": report.complaint_number_date.isoformat() if report.complaint_number_date else None,
                    "subject": report.subject,
                    "confidentiality_level": report.confidentiality_level,
                    "urgency_level": report.urgency_level,
                    "remarks": report.remarks,
                    "created_at": report.created_at.isoformat() if report.created_at else None,
                    "type_description": "รายงานแจ้งผู้ร้องเรียน"
                })
            
            # ดึง outgoing reports ประเภทที่ 3 (ขอทราบผลการพิจารณา)
            outgoing_reports3 = db.query(OutgoingReport3).filter(
                OutgoingReport3.complaint_id == complaint_id,
                OutgoingReport3.is_active == True
            ).all()
            
            outgoing_reports_data["type3"] = []
            for report in outgoing_reports3:
                outgoing_reports_data["type3"].append({
                    "id": str(report.id),
                    "complaint_number": report.complaint_number,
                    "complaint_number_date": report.complaint_number_date.isoformat() if report.complaint_number_date else None,
                    "subject": report.subject,
                    "confidentiality_level": report.confidentiality_level,
                    "urgency_level": report.urgency_level,
                    "remarks": report.remarks,
                    "created_at": report.created_at.isoformat() if report.created_at else None,
                    "type_description": "รายงานขอทราบผลการพิจารณา"
                })
            
            # ดึง outgoing reports ประเภทที่ 4 (แจ้งผลการให้ผู้เกี่ยวข้องทราบ)
            outgoing_reports4 = db.query(OutgoingReport4).filter(
                OutgoingReport4.complaint_id == complaint_id,
                OutgoingReport4.is_active == True
            ).all()
            
            outgoing_reports_data["type4"] = []
            for report in outgoing_reports4:
                outgoing_reports_data["type4"].append({
                    "id": str(report.id),
                    "reference_number": report.reference_number,
                    "reference_date": report.reference_date.isoformat() if report.reference_date else None,
                    "subject": report.subject,
                    "proposal_purpose": report.proposal_purpose,
                    "consideration_result": report.consideration_result,
                    "confidentiality_level": report.confidentiality_level,
                    "urgency_level": report.urgency_level,
                    "remarks": report.remarks,
                    "created_at": report.created_at.isoformat() if report.created_at else None,
                    "type_description": "รายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบ"
                })
            
            # รวม outgoing reports ทั้งหมด
            all_outgoing_reports = []
            for report_type, reports in outgoing_reports_data.items():
                all_outgoing_reports.extend(reports)
            
            # เรียงตาม created_at (ใหม่สุดก่อน)
            all_outgoing_reports.sort(
                key=lambda x: datetime.fromisoformat(x["created_at"]) if x.get("created_at") else datetime.min,
                reverse=True
            )
            
            outgoing_reports_data["all"] = all_outgoing_reports
            outgoing_reports_data["total_count"] = len(all_outgoing_reports)
            
        except Exception as e:
            logger.warning(f"Error getting outgoing reports for complaint {complaint.id}: {str(e)}")
            outgoing_reports_data = {
                "type1": [],
                "type2": [],
                "type3": [],
                "type4": [],
                "all": [],
                "total_count": 0
            }
        
        # วันที่ร้อง (created_at)
        received_date = ""
        if complaint.created_at:
            # Convert to Bangkok timezone (+07:00)
            bangkok_tz = timezone(timedelta(hours=7))
            bangkok_time = complaint.created_at.replace(tzinfo=timezone.utc).astimezone(bangkok_tz)
            received_date = bangkok_time.strftime("%d %b %Y")
        else:
            received_date = "ไม่ระบุ"
        
        # สถานะการยืนยันรับงาน
        confirmation_status = "ยังไม่ได้รับงาน"
        if complaint.confirm_assigned_status == True:
            confirmation_status = "ยืนยันรับงานแล้ว"
        elif complaint.confirm_assigned_status == False:
            confirmation_status = "ปฏิเสธรับงาน"
        elif complaint.assigned_officer_id:
            confirmation_status = "รอการยืนยัน"
        
        # ประเภทการร้องเรียน
        complaint_category = "เรื่องร้องเรียนใหม่"
        if complaint.group_work:
            complaint_category = "รับเรื่องจากคณะบัตรสนเท่ห์"
        elif complaint.add_more_complaint_to_ref:
            complaint_category = "เรื่องร้องเรียนเพิ่มเติม"
        elif complaint.new_complaint:
            complaint_category = "เรื่องร้องเรียนใหม่"
        
        # ดึงข้อมูลประเภทเรื่องและประเภทเรื่องย่อย
        complaint_type_name = ""
        complaint_subtype_name = ""
        
        if complaint.complaint_type_id:
            complaint_type_obj = db.query(ComplaintType).filter(ComplaintType.id == complaint.complaint_type_id).first()
            complaint_type_name = complaint_type_obj.name if complaint_type_obj else ""
        
        if complaint.complaint_subtype_id:
            complaint_subtype_obj = db.query(ComplaintSubType).filter(ComplaintSubType.id == complaint.complaint_subtype_id).first()
            complaint_subtype_name = complaint_subtype_obj.name if complaint_subtype_obj else ""
        
        # ดึงข้อมูลหน่วยงานจาก outgoing_reports
        agency_name = ""
        try:
            outgoing_report = db.query(OutgoingReport).filter(
                OutgoingReport.complaint_id == complaint_id,
                OutgoingReport.is_active == True
            ).first()
            
            if outgoing_report and outgoing_report.department:
                agency_name = outgoing_report.department.name
        except Exception as e:
            logger.warning(f"Error getting agency name from outgoing_reports: {str(e)}")
        
        # จัดรูปแบบผลลัพธ์
        result = {
            "detail": {
                "receiveDate": received_date,
                "agency": agency_name,
                "claimantName": complainant_data.get("name", "") or f"{complainant_data.get('firstName', '')} {complainant_data.get('lastName', '')}".strip(),
                "issue": complaint.subject or "",
                "description": complaint.description or "",
                "issueType": complaint_type_name,
                "subIssueType": complaint_subtype_name,
                "responsibleOfficer": complaint.assigned_to or "",
                "status": complaint.status.value if complaint.status else "",
                "confirmationStatus": confirmation_status,
                "complaintCategory": complaint_category,
                "creator": f"{creator.first_name} {creator.last_name}".strip() if creator else "ไม่ระบุ",
                "note": complaint.assigned_remark or "",
                
                # ข้อมูลเพิ่มเติมสำหรับ API
                "id": str(complaint.id),
                "complaint_id": str(complaint.id),
                "status": complaint.status.value if complaint.status else "",
                "urgency_level": complaint.urgency_level,
                "confidentiality_level": complaint.confidentiality_level,
                "is_master": complaint.parent_complaint_id is None,
                "assigned_officer": {
                    "id": str(assigned_officer.id) if assigned_officer else None,
                    "name": f"{assigned_officer.first_name} {assigned_officer.last_name}" if assigned_officer else None,
                    "email": assigned_officer.email if assigned_officer else None
                } if assigned_officer else None,
                "creator": {
                    "id": str(creator.id) if creator else None,
                    "name": f"{creator.first_name} {creator.last_name}".strip() if creator else None,
                    "email": creator.email if creator else None
                } if creator else None,
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
                "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None,
                
                # ข้อมูลการยืนยันรับงาน
                "confirm_assigned_status": complaint.confirm_assigned_status,
                "confirm_assigned_date": complaint.confirm_assigned_date.isoformat() if complaint.confirm_assigned_date else None,
                "confirm_assigned_remark": complaint.confirm_assigned_remark,
                "confirm_assigned_by": str(complaint.confirm_assigned_by) if complaint.confirm_assigned_by else None,
                
                "complaint_type_flags": {
                    "new_complaint": complaint.new_complaint,
                    "add_more_complaint_to_ref": complaint.add_more_complaint_to_ref,
                    "group_work": complaint.group_work
                },
                
                # 🔥 ประวัติการเปลี่ยนแปลงสถานะ (สำหรับเจ้าหน้าที่ดูประวัติ)
                "status_history": status_history
            },
            
            # 🔥 ข้อมูลความสัมพันธ์เต็มรูปแบบ (เฉพาะใน detail endpoint)
            "relationships": {
                "parent_complaint": related_info.get("parent_complaint"),
                "parent_chain": related_info.get("parent_chain", []),
                "master_complaint": related_info.get("master_complaint"),
                "child_complaints": related_info.get("child_complaints", []),
                "sibling_complaints": related_info.get("sibling_complaints", []),
                "all_related": related_info.get("all_related", []),  # 🔥 ข้อมูลเต็มสำหรับ detail
                "total_related_count": len(related_info.get("all_related", [])),
                "relationship_summary": {
                    "is_master": complaint.parent_complaint_id is None,
                    "has_parent": related_info.get("parent_complaint") is not None,
                    "children_count": len(related_info.get("child_complaints", [])),
                    "siblings_count": len(related_info.get("sibling_complaints", [])),
                    "total_in_group": len(related_info.get("all_related", []))
                }
            },
            
            # 🔥 ข้อมูล outgoing reports ที่เกี่ยวข้อง
            "outgoing_reports": outgoing_reports_data
        }
        
        # 🔥 เรียงลำดับ all_related ตาม created_at (ใหม่สุดก่อน) โดยไม่ย้าย current ไปด้านบน
        if result.get("relationships") and result["relationships"].get("all_related"):
            all_related = result["relationships"]["all_related"]
            
            # เรียงทั้งหมดตาม created_at (ใหม่สุดก่อน)
            def parse_datetime(date_str):
                if not date_str:
                    return datetime.min
                try:
                    return datetime.fromisoformat(date_str.replace('T', ' ').replace('Z', ''))
                except:
                    return datetime.min
            
            all_related.sort(key=lambda x: parse_datetime(x.get("created_at", "")), reverse=True)
            
            result["relationships"]["all_related"] = all_related
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting document storage detail for {complaint_id}: {str(e)}")
        return {
            "error": str(e),
            "detail": None,
            "relationships": None
        }

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
    """ดึงข้อมูลคลังเอกสารแบ่งตามช่องทาง (สำหรับ listing - ข้อมูลสรุป)"""
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
        
        # � สำหรับ summary listing ไม่ต้องโหลด relationships เพื่อ performance
        # สำหรับ detail ให้ใช้ get_document_storage_detail() แทน
        
        # Format response
        items = []
        for complaint in complaints:
            # ดึงข้อมูลผู้ร้องเรียน
            complainant_data = {}
            try:
                complainant_data = json.loads(complaint.complainant_data) if complaint.complainant_data else {}
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"Error parsing complainant_data for complaint {complaint.id}: {str(e)}")
                complainant_data = {}
            
            # ดึงข้อมูลผู้ถูกร้องเรียน
            respondent_data = {}
            try:
                respondent_data = json.loads(complaint.respondent_data) if complaint.respondent_data else {}
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"Error parsing respondent_data for complaint {complaint.id}: {str(e)}")
                respondent_data = {}
            
            # ดึงข้อมูลเจ้าหน้าที่ที่รับผิดชอบ
            assigned_officer = None
            if complaint.assigned_officer_id:
                assigned_officer = db.query(User).filter(User.id == complaint.assigned_officer_id).first()
            
            # ดึงข้อมูลผู้สร้างเรื่องร้องเรียน (created_by)
            creator = None
            if complaint.created_by:
                creator = db.query(User).filter(User.id == complaint.created_by).first()
            
            # 📝 สำหรับ summary: ข้อมูลพื้นฐานเท่านั้น ไม่รวม detailed relationships
            # หาก parent/master พื้นฐานเพื่อแสดงสถานะ is_master
            has_parent = complaint.parent_complaint_id is not None
            parent_complaint_basic = None
            master_complaint_basic = None
            
            if has_parent:
                # ดึงข้อมูล parent พื้นฐาน
                parent = db.query(Complaint).filter(Complaint.id == complaint.parent_complaint_id).first()
                if parent:
                    parent_complaint_basic = {
                        "id": str(parent.id),
                        "complaint_number": parent.complaint_number,
                        "subject": parent.subject,
                        "status": parent.status.value if parent.status else None,
                        "is_master": parent.parent_complaint_id is None
                    }
                    
                    # หา master ถ้า parent ไม่ใช่ master
                    if parent.parent_complaint_id is not None:
                        # ถ้า parent ไม่ใช่ master ให้หา master ต่อไป (แค่ 1 ระดับเพื่อ performance)
                        master = db.query(Complaint).filter(Complaint.id == parent.parent_complaint_id).first()
                        if master and master.parent_complaint_id is None:
                            master_complaint_basic = {
                                "id": str(master.id),
                                "complaint_number": master.complaint_number,
                                "subject": master.subject,
                                "status": master.status.value if master.status else None,
                                "is_master": True
                            }
                    else:
                        master_complaint_basic = parent_complaint_basic
            else:
                # ตัวเองเป็น master
                master_complaint_basic = {
                    "id": str(complaint.id),
                    "complaint_number": complaint.complaint_number,
                    "subject": complaint.subject,
                    "status": complaint.status.value if complaint.status else None,
                    "is_master": True
                }
            
            # ดึงจำนวน children พื้นฐาน (แค่นับ ไม่ดึงรายละเอียด)
            children_count = db.query(Complaint).filter(Complaint.parent_complaint_id == complaint.id).count()
            child_complaints_basic = []
            if children_count > 0:
                children = db.query(Complaint).filter(
                    Complaint.parent_complaint_id == complaint.id
                ).order_by(Complaint.complaint_number).all()
                child_complaints_basic = [
                    {
                        "id": str(child.id),
                        "complaint_number": child.complaint_number,
                        "subject": child.subject,
                        "status": child.status.value if child.status else None,
                        "is_master": False
                    } for child in children
                ]
            
            # หา siblings พื้นฐาน (ถ้ามี parent เดียวกัน)
            sibling_complaints_basic = []
            if has_parent:
                siblings = db.query(Complaint).filter(
                    Complaint.parent_complaint_id == complaint.parent_complaint_id,
                    Complaint.id != complaint.id
                ).order_by(Complaint.complaint_number).all()
                sibling_complaints_basic = [
                    {
                        "id": str(sibling.id),
                        "complaint_number": sibling.complaint_number,
                        "subject": sibling.subject,
                        "status": sibling.status.value if sibling.status else None,
                        "is_master": False
                    } for sibling in siblings
                ]
            
            # ดึงข้อมูล channel
            channel_info = None
            if complaint.complaint_channel_id:
                channel_info = db.query(ComplaintChannel).filter(
                    ComplaintChannel.id == complaint.complaint_channel_id
                ).first()
            
            # 🔥 วันที่ร้อง = วันที่สร้างเรื่องร้องเรียน (created_at)
            received_date = ""
            if complaint.created_at:
                # Convert to Bangkok timezone (+07:00)
                bangkok_tz = timezone(timedelta(hours=7))
                bangkok_time = complaint.created_at.replace(tzinfo=timezone.utc).astimezone(bangkok_tz)
                received_date = bangkok_time.strftime("%d %b %Y")
            else:
                received_date = "ไม่ระบุ"
            
            # 🔥 เพิ่มสถานะการยืนยันรับงาน
            confirmation_status = "ยังไม่ได้รับงาน"
            if complaint.confirm_assigned_status == True:
                confirmation_status = "ยืนยันรับงานแล้ว"
            elif complaint.confirm_assigned_status == False:
                confirmation_status = "ปฏิเสธรับงาน"
            elif complaint.assigned_officer_id:
                confirmation_status = "รอการยืนยัน"
            
            # ประเภทการร้องเรียน
            complaint_category = "เรื่องร้องเรียนใหม่"  # default
            if complaint.group_work:
                complaint_category = "รับเรื่องจากคณะบัตรสนเท่ห์"
            elif complaint.add_more_complaint_to_ref:
                complaint_category = "เรื่องร้องเรียนเพิ่มเติม"
            elif complaint.new_complaint:
                complaint_category = "เรื่องร้องเรียนใหม่"
            
            # ดึงข้อมูลประเภทเรื่องและประเภทเรื่องย่อย
            complaint_type_name = ""
            complaint_subtype_name = ""
            
            if complaint.complaint_type_id:
                complaint_type_obj = db.query(ComplaintType).filter(ComplaintType.id == complaint.complaint_type_id).first()
                complaint_type_name = complaint_type_obj.name if complaint_type_obj else ""
            
            if complaint.complaint_subtype_id:
                complaint_subtype_obj = db.query(ComplaintSubType).filter(ComplaintSubType.id == complaint.complaint_subtype_id).first()
                complaint_subtype_name = complaint_subtype_obj.name if complaint_subtype_obj else ""
            
            # ดึงข้อมูลหน่วยงานจาก outgoing_reports
            agency_name = ""
            try:
                outgoing_report = db.query(OutgoingReport).filter(
                    OutgoingReport.complaint_id == complaint.id,
                    OutgoingReport.is_active == True
                ).first()
                
                if outgoing_report and outgoing_report.department:
                    agency_name = outgoing_report.department.name
            except Exception as e:
                logger.warning(f"Error getting agency name from outgoing_reports: {str(e)}")
            
            items.append({
                "receiveDate": received_date,  # 🔥 วันที่ร้อง (created_at)
                "agency": agency_name,
                "claimantName": complainant_data.get("name", "") or f"{complainant_data.get('firstName', '')} {complainant_data.get('lastName', '')}".strip(),
                "issue": complaint.subject or "",
                "issueType": complaint_type_name,
                "subIssueType": complaint_subtype_name,
                "responsibleOfficer": complaint.assigned_to or "",
                "status": complaint.status.value if complaint.status else "",
                "confirmationStatus": confirmation_status,  # 🔥 เพิ่มสถานะการยืนยัน
                "complaintCategory": complaint_category,  # 🔥 เพิ่มประเภทการร้องเรียน
                "creator": f"{creator.first_name} {creator.last_name}".strip() if creator else "ไม่ระบุ",
                "note": complaint.assigned_remark or "",
                
                # ข้อมูลเพิ่มเติมสำหรับ API
                "id": str(complaint.id),
                "complaint_id": str(complaint.id),
                "status": complaint.status.value if complaint.status else "",
                "urgency_level": complaint.urgency_level,
                "confidentiality_level": complaint.confidentiality_level,
                "is_master": complaint.parent_complaint_id is None,
                "assigned_officer": {
                    "id": str(assigned_officer.id) if assigned_officer else None,
                    "name": f"{assigned_officer.first_name} {assigned_officer.last_name}" if assigned_officer else None
                } if assigned_officer else None,
                "creator": {
                    "id": str(creator.id) if creator else None,
                    "name": f"{creator.first_name} {creator.last_name}".strip() if creator else None,
                    "email": creator.email if creator else None
                } if creator else None,
                "parent_complaint": parent_complaint_basic,
                "master_complaint": master_complaint_basic,
                "child_complaints": child_complaints_basic,
                "sibling_complaints": sibling_complaints_basic,
                # 📝 หมายเหตุ: ลบ all_related ออกจาก listing เพื่อ performance 
                # ใช้ GET /document-storage/{complaint_id} สำหรับข้อมูลครบถ้วน
                "complaint_type_flags": {
                    "new_complaint": complaint.new_complaint,
                    "add_more_complaint_to_ref": complaint.add_more_complaint_to_ref,
                    "group_work": complaint.group_work
                },
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
                "assigned_date": complaint.assigned_date.isoformat() if complaint.assigned_date else None,
                
                # 🔥 เพิ่มข้อมูลการยืนยันรับงาน
                "confirm_assigned_status": complaint.confirm_assigned_status,
                "confirm_assigned_date": complaint.confirm_assigned_date.isoformat() if complaint.confirm_assigned_date else None,
                "confirm_assigned_remark": complaint.confirm_assigned_remark,
                "confirm_assigned_by": str(complaint.confirm_assigned_by) if complaint.confirm_assigned_by else None
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
            "page_type": page_type,
            "legend": {
                "receiveDate": "วันที่ยื่นเรื่องร้องเรียน (วันที่สร้างเรื่อง)",
                "confirmationStatus": {
                    "ยืนยันรับงานแล้ว": "เจ้าหน้าที่ยืนยันรับงานแล้ว",
                    "ปฏิเสธรับงาน": "เจ้าหน้าที่ปฏิเสธรับงาน",
                    "รอการยืนยัน": "มอบหมายแล้วแต่ยังไม่ได้ยืนยัน",
                    "ยังไม่ได้รับงาน": "ยังไม่ได้มอบหมายให้ใคร"
                }
            },
            "performance_note": "📝 นี่คือ summary listing ที่ปรับปรุงแล้วเพื่อ performance - ไม่รวม all_related ครบถ้วน ใช้ GET /document-storage/{complaint_id} สำหรับรายละเอียดเต็ม"
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
        "sent_to_agency": "มอบหมายเจ้าหน้าที่", 
        "sent_to_external": "ส่งหน่วยงานภายนอก", 
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