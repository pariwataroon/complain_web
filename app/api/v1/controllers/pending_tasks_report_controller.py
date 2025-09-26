from sqlalchemy.orm import aliased, Session
from sqlalchemy import or_, and_, func, case
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
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    department: Optional[str] = None,
    officer_id: Optional[str] = None,
) -> Dict:
    """
    รายงานการติดตามงานค้าง (MSSQL-safe)
    - เลี่ยง NULLS LAST ด้วย CASE
    - เลี่ยง FETCH FIRST/ NEXT ด้วย ROW_NUMBER() paginate
    """
    # base query & filters
    base_q = db.query(Complaint).outerjoin(User, Complaint.assigned_officer_id == User.id)
    base_q = base_q.filter(Complaint.status.in_(PENDING_STATUSES))

    if status:
        from models.comp_complaint import ComplaintStatus as CS
        try:
            base_q = base_q.filter(Complaint.status == CS(status))
        except Exception:
            # ถ้าสตริงไม่ตรง enum ให้คืนผลลัพธ์ว่าง
            base_q = base_q.filter(False)

    if search:
        like = f"%{search}%"
        base_q = base_q.filter(or_(
            Complaint.complaint_number.ilike(like),
            Complaint.subject.ilike(like),
            Complaint.reference_number.ilike(like),
            Complaint.reference_number4.ilike(like)
        ))

    if date_from:
        base_q = base_q.filter(or_(Complaint.assigned_date >= date_from,
                                   Complaint.created_at >= date_from))
    if date_to:
        base_q = base_q.filter(or_(Complaint.assigned_date <= date_to,
                                   Complaint.created_at <= date_to))

    if department:
        base_q = base_q.filter(Complaint.assigned_to == department)

    if officer_id:
        base_q = base_q.filter(Complaint.assigned_officer_id == officer_id)

    total = base_q.count()

    # --- MSSQL-safe ordering (emulate NULLS LAST) ---
    assigned_nulls_last = case((Complaint.assigned_date.is_(None), 1), else_=0).asc()

    # --- Window + paginate with ROW_NUMBER() ---
    ordered_subq = (
        db.query(
            Complaint.id.label("id"),
            Complaint.reference_number4.label("receive_reference_number"),
            (Complaint.reference_number.coalesce(Complaint.reference_number2)
                                      .coalesce(Complaint.reference_number3)).label("reference_number"),
            Complaint.subject.label("subject"),
            Complaint.assigned_date.label("assigned_date"),
            Complaint.director_submission_date.label("director_submission_date"),
            Complaint.assigned_to.label("department_name"),
            Complaint.document_number.label("document_number"),
            Complaint.status.label("status"),
            Complaint.created_at.label("created_at"),
            Complaint.assigned_officer_id.label("assigned_officer_id"),
            func.row_number().over(
                order_by=(assigned_nulls_last, Complaint.assigned_date.desc(), Complaint.created_at.desc())
            ).label("rn"),
        )
        .select_from(Complaint)
        .outerjoin(User, Complaint.assigned_officer_id == User.id)
        .filter(Complaint.status.in_(PENDING_STATUSES))
    )

    # ต้องใส่ฟิลเตอร์ซ้ำให้กับ subquery (เพราะเรา build ใหม่แทน base_q)
    if status:
        from models.comp_complaint import ComplaintStatus as CS
        try:
            ordered_subq = ordered_subq.filter(Complaint.status == CS(status))
        except Exception:
            ordered_subq = ordered_subq.filter(False)

    if search:
        like = f"%{search}%"
        ordered_subq = ordered_subq.filter(or_(
            Complaint.complaint_number.ilike(like),
            Complaint.subject.ilike(like),
            Complaint.reference_number.ilike(like),
            Complaint.reference_number4.ilike(like)
        ))

    if date_from:
        ordered_subq = ordered_subq.filter(or_(Complaint.assigned_date >= date_from,
                                               Complaint.created_at >= date_from))
    if date_to:
        ordered_subq = ordered_subq.filter(or_(Complaint.assigned_date <= date_to,
                                               Complaint.created_at <= date_to))

    if department:
        ordered_subq = ordered_subq.filter(Complaint.assigned_to == department)

    if officer_id:
        ordered_subq = ordered_subq.filter(Complaint.assigned_officer_id == officer_id)

    subq = ordered_subq.subquery()

    page_rows = (
        db.query(subq)
        .filter(subq.c.rn > skip, subq.c.rn <= skip + limit)
        .order_by(subq.c.rn)
        .all()
    )

    # map officer name (ดึงเพิ่มครั้งเดียวแบบ bulk)
    officer_ids = [r.assigned_officer_id for r in page_rows if r.assigned_officer_id]
    officers = {}
    if officer_ids:
        for u in db.query(User.id, User.first_name, User.last_name).filter(User.id.in_(officer_ids)).all():
            officers[str(u.id)] = f"{u.first_name} {u.last_name}".strip()

    now = datetime.now(timezone.utc)
    items = []
    for r in page_rows:
        start_date = r.assigned_date or r.created_at
        items.append({
            "id": str(r.id),
            "receive_reference_number": r.receive_reference_number,
            "reference_number": r.reference_number,
            "subject": r.subject,
            "assigned_date": r.assigned_date,
            "director_submission_date": r.director_submission_date,
            "department_name": r.department_name,
            "document_number": r.document_number,
            "status": r.status.value if hasattr(r.status, "value") else r.status,
            "days_in_progress": (now.date() - (start_date.date() if start_date else now.date())).days,
            "assigned_officer_name": officers.get(str(r.assigned_officer_id)) if r.assigned_officer_id else None,
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit,
    }