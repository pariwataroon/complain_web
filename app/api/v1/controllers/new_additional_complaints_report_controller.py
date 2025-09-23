from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, Dict
from datetime import datetime

from models.comp_complaint import Complaint, ComplaintFilingType
from models.user import User

def _parse_name_from_json(data):
    if not data:
        return None
    import json
    try:
        obj = json.loads(data) if isinstance(data, str) else data
        if isinstance(obj, dict):
            # support possible keys
            return obj.get("name") or obj.get("full_name")
    except Exception:
        return None
    return None


def get_new_additional_complaints_report(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    filing_type: Optional[str] = None,  # new / additional / anonymous / all
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    department: Optional[str] = None,  # match assigned_to (text)
    officer_id: Optional[str] = None,
) -> Dict:
    """ดึงรายงานสรุปเรื่องเข้าใหม่และร้องเพิ่มทั้งหมด"""
    query = db.query(Complaint).outerjoin(User, Complaint.assigned_officer_id == User.id)

    # เฉพาะเรื่องร้องเรียนที่เป็น new หรือ additional (หรือระบุ filing_type)
    if filing_type and filing_type != "all":
        try:
            ft_enum = ComplaintFilingType(filing_type)
            query = query.filter(Complaint.complaint_filing_type == ft_enum)
        except Exception:
            # invalid value -> empty set
            query = query.filter(False)
    else:
        query = query.filter(Complaint.complaint_filing_type.in_([ComplaintFilingType.NEW, ComplaintFilingType.ADDITIONAL]))

    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Complaint.complaint_number.ilike(like),
                Complaint.subject.ilike(like),
                Complaint.reference_number4.ilike(like)
            )
        )

    if date_from:
        query = query.filter(Complaint.created_at >= date_from)
    if date_to:
        query = query.filter(Complaint.created_at <= date_to)

    if department:
        query = query.filter(Complaint.assigned_to == department)

    if officer_id:
        query = query.filter(Complaint.assigned_officer_id == officer_id)

    total = query.count()
    complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for c in complaints:
        officer: User = c.assigned_officer
        complainant_name = _parse_name_from_json(c.complainant_data)
        items.append({
            "id": str(c.id),
            "received_date": c.registration_date or c.created_at,
            "reference_number_sar": c.reference_number4,
            "complaint_number": c.complaint_number,
            "complainant_name": complainant_name,
            "assigned_officer_name": f"{officer.first_name} {officer.last_name}" if officer else None,
            "department_name": c.assigned_to,
            "complaint_type": c.complaint_type,
            "remark": c.assigned_remark,
            "filing_type": c.complaint_filing_type.value if c.complaint_filing_type else None
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit
    }
