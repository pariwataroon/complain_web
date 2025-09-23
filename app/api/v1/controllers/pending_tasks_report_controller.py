from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, Dict
from datetime import datetime, timezone

from models.comp_complaint import Complaint, ComplaintStatus
from models.user import User


PENDING_STATUSES = {
    ComplaintStatus.SUBMITTED,
    ComplaintStatus.SENT_TO_AGENCY,
    ComplaintStatus.SENT_TO_EXTERNAL,
    ComplaintStatus.IN_PROCESS,
    ComplaintStatus.IN_REVIEW,
    ComplaintStatus.TRACKING,
}


def _days_between(start: datetime, end: datetime) -> int:
    if not start or not end:
        return 0
    return (end.date() - start.date()).days


def get_pending_tasks_report(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,  # filter specific status
    date_from: Optional[datetime] = None,  # assigned_date from
    date_to: Optional[datetime] = None,    # assigned_date to
    department: Optional[str] = None,
    officer_id: Optional[str] = None,
) -> Dict:
    """รายงานการติดตามงานค้าง"""
    query = db.query(Complaint).outerjoin(User, Complaint.assigned_officer_id == User.id)

    # only pending statuses
    query = query.filter(Complaint.status.in_(PENDING_STATUSES))

    if status:
        try:
            # allow raw string match for robustness
            from models.comp_complaint import ComplaintStatus as CS
            status_enum = CS(status)
            query = query.filter(Complaint.status == status_enum)
        except Exception:
            query = query.filter(False)

    if search:
        like = f"%{search}%"
        query = query.filter(or_(
            Complaint.complaint_number.ilike(like),
            Complaint.subject.ilike(like),
            Complaint.reference_number.ilike(like),
            Complaint.reference_number4.ilike(like)
        ))

    if date_from:
        query = query.filter(or_(Complaint.assigned_date >= date_from, Complaint.created_at >= date_from))
    if date_to:
        query = query.filter(or_(Complaint.assigned_date <= date_to, Complaint.created_at <= date_to))

    if department:
        query = query.filter(Complaint.assigned_to == department)

    if officer_id:
        query = query.filter(Complaint.assigned_officer_id == officer_id)

    total = query.count()
    complaints = query.order_by(Complaint.assigned_date.desc().nullslast(), Complaint.created_at.desc()).offset(skip).limit(limit).all()

    now = datetime.now(timezone.utc)
    items = []
    for c in complaints:
        officer: User = c.assigned_officer
        start_date = c.assigned_date or c.created_at
        items.append({
            "id": str(c.id),
            "receive_reference_number": c.reference_number4,
            "reference_number": c.reference_number or c.reference_number2 or c.reference_number3,
            "subject": c.subject,
            "assigned_date": c.assigned_date,
            "director_submission_date": c.director_submission_date,
            "department_name": c.assigned_to,
            "document_number": c.document_number,
            "status": c.status.value if hasattr(c.status, 'value') else c.status,
            "days_in_progress": _days_between(start_date, now),
            "assigned_officer_name": f"{officer.first_name} {officer.last_name}" if officer else None,
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit
    }
