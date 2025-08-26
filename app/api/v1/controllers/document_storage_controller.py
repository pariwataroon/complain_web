from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from uuid import UUID
from typing import Dict, Any, Optional, List
import json
import logging

from models.comp_complaint import Complaint
from models.comp_complaint_types import ComplaintChannel, ComplaintType, ComplaintSubType
from models.user import User
from models.departments import Department
from models.outgoing_reports import OutgoingReport
from models.outgoing_reports2 import OutgoingReport2
from models.outgoing_reports3 import OutgoingReport3
from models.outgoing_reports4 import OutgoingReport4
from models.outgoing_reports5 import OutgoingReport5

logger = logging.getLogger(__name__)

# -----------------------
# helpers (ปลอดภัย/กัน field หาย)
# -----------------------
def _user_min(u: Optional[User]) -> Optional[Dict[str, Any]]:
    if not u:
        return None
    return {
        "id": str(getattr(u, "id", None)) if getattr(u, "id", None) else None,
        "name": f"{getattr(u, 'first_name', '')} {getattr(u, 'last_name', '')}".strip() or None,
        "email": getattr(u, "email", None),
    }

def _dept_min(d) -> Optional[Dict[str, Any]]:
    if not d:
        return None
    return {
        "id": str(getattr(d, "id", None)) if getattr(d, "id", None) else None,
        "name": getattr(d, "name", None),
    }

def _serialize_attachments(report_obj) -> List[Dict[str, Any]]:
    atts = []
    try:
        for a in (getattr(report_obj, "attachments", None) or []):
            atts.append({
                "id": str(getattr(a, "id", None)) if getattr(a, "id", None) else None,
                "file_name": getattr(a, "file_name", None) or getattr(a, "filename", None),
                "file_path": getattr(a, "file_path", None) or getattr(a, "path", None),
                "file_size": getattr(a, "file_size", None),
                "file_type": getattr(a, "file_type", None) or getattr(a, "mimetype", None),
                "uploaded_at": getattr(a, "created_at", None).isoformat() if getattr(a, "created_at", None) else None,
            })
    except Exception as e:
        logger.warning(f"serialize attachments error: {e}")
    return atts

def _iso(dt) -> Optional[str]:
    return dt.isoformat() if dt else None

def _fmt_bkk(dt_utc) -> str:
    if not dt_utc:
        return "ไม่ระบุ"
    bangkok_tz = timezone(timedelta(hours=7))
    try:
        return dt_utc.replace(tzinfo=timezone.utc).astimezone(bangkok_tz).strftime("%d %b %Y")
    except Exception:
        return dt_utc.strftime("%d %b %Y")

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
            
            # สร้าง lookup dictionary สำหรับหา complaint_number ของ parent
            complaints_lookup = {c.id: c for c in all_related_complaints}
            
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
                    "parent_complaint_number": complaints_lookup.get(complaint.parent_complaint_id).complaint_number if complaint.parent_complaint_id and complaint.parent_complaint_id in complaints_lookup else None,
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
                    "parent_complaint_number": complaints_by_id.get(c.parent_complaint_id).complaint_number if c.parent_complaint_id and c.parent_complaint_id in complaints_by_id else None,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                    "complainant_name": get_complainant_name_from_data(c.complainant_data)
                } for c in all_related
            ],
            
            "parent_chain": []  # จะเพิ่มทีหลังถ้าจำเป็น
        }
    
    return result

# ---------------------------------
# ฟังก์ชันหลักที่ปรับปรุง (DROP-IN)
# ---------------------------------
def get_document_storage_detail(db: Session, complaint_id: UUID) -> Dict:
    """
    ดึงรายละเอียดเต็มของ complaint เดียว รวมความสัมพันธ์และรายงานออกทั้งหมด
    ครบตาม UI: ผู้รับผิดชอบ, ผู้ร้อง, chain master/parent/child/sibling,
    OutgoingReport 1–5, status timeline และ initial_process_summary
    """
    try:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return {"error": "Complaint not found", "detail": None}

        # ใช้ helper ที่อยู่ในไฟล์เดียวกัน
        related_info = get_related_complaints(db, complaint_id)  # noqa: F821

        def _safe_json(s):
            try:
                return json.loads(s) if s else {}
            except Exception:
                return {}

        complainant_data = _safe_json(getattr(complaint, "complainant_data", None))
        respondent_data  = _safe_json(getattr(complaint, "respondent_data", None))

        # ผู้รับผิดชอบ / ผู้สร้าง / ช่องทาง
        assigned_officer = db.query(User).filter(User.id == complaint.assigned_officer_id).first() \
            if getattr(complaint, "assigned_officer_id", None) else None
        creator      = db.query(User).filter(User.id == complaint.created_by).first() if complaint.created_by else None
        channel_info = db.query(ComplaintChannel).filter(ComplaintChannel.id == complaint.complaint_channel_id).first() \
            if complaint.complaint_channel_id else None

        # status history
        status_history = []
        try:
            from models.comp_complaint import ComplaintStatusHistory  # มีในโปรเจกต์
            rows = (db.query(ComplaintStatusHistory)
                      .filter(ComplaintStatusHistory.complaint_id == complaint_id)
                      .order_by(ComplaintStatusHistory.changed_at.desc()).all())
            for r in rows:
                changed_by_user = db.query(User).filter(User.id == r.changed_by).first() if r.changed_by else None
                status_history.append({
                    "status": r.status.value if hasattr(r.status, "value") else str(r.status),
                    "changed_at": _iso(r.changed_at),
                    "changed_by": str(r.changed_by) if r.changed_by else None,
                    "changed_by_name": (_user_min(changed_by_user) or {}).get("name") if changed_by_user else "ระบบ",
                    "remark": getattr(r, "notes", "") or getattr(r, "remark", "") or ""
                })
        except Exception:
            if complaint.created_at:
                status_history = [{
                    "status": getattr(complaint.status, "value", "submitted") or "submitted",
                    "changed_at": _iso(complaint.created_at),
                    "changed_by": str(complaint.created_by) if complaint.created_by else None,
                    "changed_by_name": (_user_min(creator) or {}).get("name") if creator else "ระบบ",
                    "remark": "เรื่องร้องเรียนถูกสร้างขึ้น"
                }]

        # confirmation text
        if complaint.confirm_assigned_status is True:
            confirmation_status = "ยืนยันรับงานแล้ว"
        elif complaint.confirm_assigned_status is False:
            confirmation_status = "ปฏิเสธรับงาน"
        elif complaint.assigned_officer_id:
            confirmation_status = "รอการยืนยัน"
        else:
            confirmation_status = "ยังไม่ได้รับงาน"

        # ประเภท/ย่อย/หมวดหมู่
        complaint_type_name = ""
        if complaint.complaint_type_id:
            ct = db.query(ComplaintType).filter(ComplaintType.id == complaint.complaint_type_id).first()
            complaint_type_name = getattr(ct, "name", "") if ct else ""

        complaint_subtype_name = ""
        if complaint.complaint_subtype_id:
            cst = db.query(ComplaintSubType).filter(ComplaintSubType.id == complaint.complaint_subtype_id).first()
            complaint_subtype_name = getattr(cst, "name", "") if cst else ""

        if getattr(complaint, "group_work", False):
            complaint_category = "รับเรื่องจากคณะบัตรสนเท่ห์"
        elif getattr(complaint, "add_more_complaint_to_ref", False):
            complaint_category = "เรื่องร้องเรียนเพิ่มเติม"
        else:
            complaint_category = "เรื่องร้องเรียนใหม่"

        # ===== OutgoingReports (1–4) =====
        outgoing_reports_data: Dict[str, List[Dict[str, Any]]] = \
            {"type1": [], "type2": [], "type3": [], "type4": []}

        # type1
        for r in db.query(OutgoingReport).filter(OutgoingReport.complaint_id == complaint_id,
                                                 OutgoingReport.is_active == True).all():
            atts = _serialize_attachments(r)
            outgoing_reports_data["type1"].append({
                "id": str(getattr(r, "id", "")),
                "reference_number": getattr(r, "reference_number", None),
                "reference_date": _iso(getattr(r, "reference_date", None)),
                "subject": getattr(r, "subject", None),
                "complaint_number": getattr(r, "complaint_number", None),
                "complaint_number_date": _iso(getattr(r, "complaint_number_date", None)),
                "confidentiality_level": getattr(r, "confidentiality_level", None),
                "urgency_level": getattr(r, "urgency_level", None),
                "remarks": getattr(r, "remarks", None),
                "created_at": _iso(getattr(r, "created_at", None)),
                "department": _dept_min(getattr(r, "department", None)),
                "signature_authority_user": _user_min(getattr(r, "signature_authority_user", None)),
                "attachments": atts,
                "attachments_count": len(atts),
                "type_description": "รายงานส่งหน่วยงานที่เกี่ยวข้อง",
            })

        # type2
        for r in db.query(OutgoingReport2).filter(OutgoingReport2.complaint_id == complaint_id,
                                                  OutgoingReport2.is_active == True).all():
            atts = _serialize_attachments(r)
            outgoing_reports_data["type2"].append({
                "id": str(getattr(r, "id", "")),
                "complaint_number": getattr(r, "complaint_number", None),
                "complaint_number_date": _iso(getattr(r, "complaint_number_date", None)),
                "subject": getattr(r, "subject", None),
                "confidentiality_level": getattr(r, "confidentiality_level", None),
                "urgency_level": getattr(r, "urgency_level", None),
                "remarks": getattr(r, "remarks", None),
                "created_at": _iso(getattr(r, "created_at", None)),
                "department": _dept_min(getattr(r, "department", None)),
                "recipient_user": _user_min(getattr(r, "to_user", None) or getattr(r, "user", None)),
                "attachments": atts,
                "attachments_count": len(atts),
                "type_description": "แจ้งผู้ร้องเรียน/ส่วนราชการที่ส่งเรื่องมาให้ทราบ",
            })

        # type3
        for r in db.query(OutgoingReport3).filter(OutgoingReport3.complaint_id == complaint_id,
                                                  OutgoingReport3.is_active == True).all():
            atts = _serialize_attachments(r)
            outgoing_reports_data["type3"].append({
                "id": str(getattr(r, "id", "")),
                "complaint_number": getattr(r, "complaint_number", None),
                "complaint_number_date": _iso(getattr(r, "complaint_number_date", None)),
                "subject": getattr(r, "subject", None),
                "confidentiality_level": getattr(r, "confidentiality_level", None),
                "urgency_level": getattr(r, "urgency_level", None),
                "remarks": getattr(r, "remarks", None),
                "created_at": _iso(getattr(r, "created_at", None)),
                "department": _dept_min(getattr(r, "department", None)),
                "attachments": atts,
                "attachments_count": len(atts),
                "type_description": "รายงานผลจากหน่วยงาน/ความคืบหน้า",
            })

        # type4
        for r in db.query(OutgoingReport4).filter(OutgoingReport4.complaint_id == complaint_id,
                                                  OutgoingReport4.is_active == True).all():
            atts = _serialize_attachments(r)
            outgoing_reports_data["type4"].append({
                "id": str(getattr(r, "id", "")),
                "reference_number": getattr(r, "reference_number", None),
                "reference_date": _iso(getattr(r, "reference_date", None)),
                "subject": getattr(r, "subject", None),
                "proposal_purpose": getattr(r, "proposal_purpose", None),
                "consideration_result": getattr(r, "consideration_result", None),
                "confidentiality_level": getattr(r, "confidentiality_level", None),
                "urgency_level": getattr(r, "urgency_level", None),
                "remarks": getattr(r, "remarks", None),
                "created_at": _iso(getattr(r, "created_at", None)),
                "department": _dept_min(getattr(r, "department", None)),
                "signature_authority_user": _user_min(getattr(r, "signature_authority_user", None)),
                "attachments": atts,
                "attachments_count": len(atts),
                "type_description": "หนังสือแจ้งผลการพิจารณางาน",
            })

        # ===== type5: แจ้งผลการให้ผู้เกี่ยวข้องทราบ =====
        type5_list: List[Dict[str, Any]] = []
        for r in db.query(OutgoingReport5).filter(OutgoingReport5.complaint_id == complaint_id,
                                                  OutgoingReport5.is_active == True).all():
            atts = _serialize_attachments(r)
            type5_list.append({
                "id": str(getattr(r, "id", "")),
                "receive_number": getattr(r, "receive_number", None),
                "receive_date": _iso(getattr(r, "receive_date", None)),
                "subject": getattr(r, "subject", None),
                "complaint_number": getattr(r, "complaint_number", None),
                "complaint_number_date": _iso(getattr(r, "complaint_number_date", None)),
                "agency_reference_number": getattr(r, "agency_reference_number", None),
                "agency_reference_date": _iso(getattr(r, "agency_reference_date", None)),
                "internal_register_number": getattr(r, "internal_register_number", None),
                "internal_register_date": _iso(getattr(r, "internal_register_date", None)),
                "present_to_director_date": _iso(getattr(r, "present_to_director_date", None)),
                "document_number": getattr(r, "document_number", None),
                "document_date": _iso(getattr(r, "document_date", None)),
                "confidentiality_level": getattr(r, "confidentiality_level", None),
                "urgency_level": getattr(r, "urgency_level", None),
                "remarks": getattr(r, "remarks", None),
                "created_at": _iso(getattr(r, "created_at", None)),
                "department": _dept_min(getattr(r, "department", None)),
                "signature_authority_user": _user_min(getattr(r, "signature_authority_user", None)),
                "user": _user_min(getattr(r, "user", None)),
                "attachments": atts,
                "attachments_count": len(atts),
                "type_description": "แจ้งผลการให้ผู้เกี่ยวข้องทราบ",
            })

        # รวม all + sort ใหม่สุดก่อน
        all_out = (outgoing_reports_data["type1"]
                   + outgoing_reports_data["type2"]
                   + outgoing_reports_data["type3"]
                   + outgoing_reports_data["type4"]
                   + type5_list)
        def _key_when(x: Dict[str, Any]) -> datetime:
            for k in ("created_at", "reference_date", "receive_date", "document_date",
                      "complaint_number_date", "agency_reference_date", "internal_register_date"):
                if x.get(k):
                    try:
                        return datetime.fromisoformat(x[k])
                    except Exception:
                        pass
            return datetime.min
        all_out.sort(key=_key_when, reverse=True)

        outgoing_reports = {
            **outgoing_reports_data,
            "type5": type5_list,
            "all": all_out,
            "total_count": len(all_out),
        }

        # ===== สรุป "ขั้นตอนการดำเนินการครั้งแรก" (initial_process_summary) =====
        this_no = getattr(complaint, "complaint_number", None)
        master = related_info.get("master_complaint") or {}
        parent = related_info.get("parent_complaint") or {}

        children_numbers = [c.get("complaint_number") for c in related_info.get("child_complaints", []) if c.get("complaint_number")]
        sibling_numbers  = [s.get("complaint_number") for s in related_info.get("sibling_complaints", []) if s.get("complaint_number")]
        all_related_numbers = [r.get("complaint_number") for r in related_info.get("all_related", []) if r.get("complaint_number")]

        latest_status = status_history[0]["status"] if status_history else (complaint.status.value if complaint.status else "submitted")

        initial_process_summary = {
            "complaintNumber": this_no,
            "is_master": complaint.parent_complaint_id is None,
            "has_parent": parent.get("id") is not None,
            "master_complaint_number": master.get("complaint_number"),
            "parent_complaint_number": parent.get("complaint_number"),
            "children_numbers": children_numbers,
            "siblings_numbers": sibling_numbers,
            "all_related_numbers": all_related_numbers,
            "first_step_status": "รับเรื่องราวร้องทุกข์",
            "latest_status": latest_status,
        }

        # ===== ชื่อหน่วยงานหัวการ์ด (ฉลาดขึ้น + null-safe) =====
        agency_name = getattr(complaint, "agency_sender", None) or ""
        if not agency_name:
            try:
                first_t1 = outgoing_reports_data["type1"][0] if outgoing_reports_data["type1"] else None
                if first_t1 and first_t1.get("department", {}).get("name"):
                    agency_name = first_t1["department"]["name"]
            except Exception:
                pass

        # ===== detail =====
        responsible_officer_display = (_user_min(assigned_officer) or {}).get("name") if assigned_officer else (complaint.assigned_to or "")

        detail = {
            "receiveDate": _fmt_bkk(complaint.created_at),
            "agency": agency_name,
            "complaintNumber": getattr(complaint, "complaint_number", None),
            "claimantName": complainant_data.get("name", "") or f"{complainant_data.get('firstName', '')} {complainant_data.get('lastName', '')}".strip(),
            "issue": complaint.subject or "",
            "description": complaint.description or "",
            "issueType": complaint_type_name,
            "subIssueType": complaint_subtype_name,
            "responsibleOfficer": responsible_officer_display,
            "status": complaint.status.value if complaint.status else "",
            "confirmationStatus": confirmation_status,
            "complaintCategory": complaint_category,
            "note": getattr(complaint, "assigned_remark", None) or "",
            "id": str(complaint.id),
            "complaint_id": str(complaint.id),
            "urgency_level": getattr(complaint, "urgency_level", None),
            "confidentiality_level": getattr(complaint, "confidentiality_level", None),
            "is_master": complaint.parent_complaint_id is None,
            "assigned_officer": _user_min(assigned_officer),
            "creator": _user_min(creator),
            "channel": ({
                "id": str(getattr(channel_info, "id", "")),
                "name": getattr(channel_info, "name", None),
                "description": getattr(channel_info, "description", None)
            } if channel_info else None),
            "complainant": complainant_data,
            "respondent": respondent_data,
            "created_at": _iso(complaint.created_at),
            "updated_at": _iso(complaint.updated_at),
            "registration_date": _iso(getattr(complaint, "registration_date", None)),
            "assigned_date": _iso(getattr(complaint, "assigned_date", None)),
            "confirm_assigned_status": getattr(complaint, "confirm_assigned_status", None),
            "confirm_assigned_date": _iso(getattr(complaint, "confirm_assigned_date", None)),
            "confirm_assigned_remark": getattr(complaint, "confirm_assigned_remark", None),
            "confirm_assigned_by": str(getattr(complaint, "confirm_assigned_by", "")) if getattr(complaint, "confirm_assigned_by", None) else None,
            "complaint_type_flags": {
                "new_complaint": getattr(complaint, "new_complaint", False),
                "add_more_complaint_to_ref": getattr(complaint, "add_more_complaint_to_ref", False),
                "group_work": getattr(complaint, "group_work", False)
            },
            "status_history": status_history,
            "initial_process_summary": initial_process_summary,  # ✅ บล็อกใหม่
        }

        # ===== relationships =====
        def _parse_dt(s):
            try:
                return datetime.fromisoformat((s or "").replace('T', ' ').replace('Z', ''))
            except Exception:
                return datetime.min

        relationships = {
            "parent_complaint": related_info.get("parent_complaint"),
            "parent_chain": related_info.get("parent_chain", []),
            "master_complaint": related_info.get("master_complaint"),
            "child_complaints": related_info.get("child_complaints", []),
            "sibling_complaints": related_info.get("sibling_complaints", []),
            "all_related": sorted(related_info.get("all_related", []), key=lambda x: _parse_dt(x.get("created_at")), reverse=True),
            "total_related_count": len(related_info.get("all_related", [])),
            "relationship_summary": {
                "is_master": complaint.parent_complaint_id is None,
                "has_parent": related_info.get("parent_complaint") is not None,
                "children_count": len(related_info.get("child_complaints", [])),
                "siblings_count": len(related_info.get("sibling_complaints", [])),
                "total_in_group": len(related_info.get("all_related", []))
            }
        }

        return {
            "detail": detail,
            "relationships": relationships,
            "outgoing_reports": outgoing_reports,
        }

    except Exception as e:
        logger.error(f"Error getting document storage detail for {complaint_id}: {e}")
        return {"error": str(e), "detail": None, "relationships": None}

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