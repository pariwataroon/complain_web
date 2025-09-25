from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from typing import Optional, Dict
from models.outgoing_reports4 import OutgoingReport4
from models.outside_departments import OutsideDepartment
from models.signature_authorities import SignatureAuthority
from models.user import User

from datetime import datetime, timezone

def get_inspector_report(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    year: Optional[int] = None,
) -> Dict:
    # Join OutgoingReport4, SignatureAuthority, OutsideDepartment, User
    query = db.query(
        OutgoingReport4.outside_department_id,
        OutsideDepartment.name.label("outside_department_name"),
        OutgoingReport4.signature_authority_user_id,
        User.first_name,
        User.last_name,
        func.count(OutgoingReport4.id).label("total_sent"),
        func.sum(
            case((OutgoingReport4.consideration_result.ilike("%ยุติ%"), 1), else_=0)
        ).label("total_closed"),
        func.sum(
            case((OutgoingReport4.consideration_result.isnot(None), 1), else_=0)
        ).label("total_in_progress")
    ).join(
        OutsideDepartment, OutgoingReport4.outside_department_id == OutsideDepartment.id
    ).join(
        User, OutgoingReport4.signature_authority_user_id == User.id
    )

    # filter by year (UTC+00:00)
    if year is None:
        year = datetime.now(timezone.utc).year
    start_date = datetime(year, 1, 1, tzinfo=timezone.utc)
    end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    query = query.filter(OutgoingReport4.created_at >= start_date, OutgoingReport4.created_at < end_date)

    query = query.group_by(
        OutgoingReport4.outside_department_id,
        OutsideDepartment.name,
        OutgoingReport4.signature_authority_user_id,
        User.first_name,
        User.last_name
    )

    if search:
        like = f"%{search}%"
        query = query.filter(or_(User.first_name.ilike(like), User.last_name.ilike(like), OutsideDepartment.name.ilike(like)))

    total = query.count()
    rows = query.offset(skip).limit(limit).all()
    items = []
    for row in rows:
        items.append({
            "outside_department_id": str(row.outside_department_id),
            "outside_department_name": row.outside_department_name,
            "signature_authority_user_id": str(row.signature_authority_user_id),
            "signature_authority_user_name": f"{row.first_name} {row.last_name}",
            "total_sent": row.total_sent,
            "total_closed": row.total_closed,
            "total_in_progress": row.total_in_progress,
        })
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit
    }
