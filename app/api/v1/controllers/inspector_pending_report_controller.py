from sqlalchemy.orm import Session
from sqlalchemy import func, or_, case, and_
from typing import Optional, Dict
from models.outgoing_reports4 import OutgoingReport4
from models.outside_departments import OutsideDepartment
from models.user import User
from datetime import datetime, timezone

def get_inspector_pending_report(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    year: Optional[int] = None,
) -> Dict:
    # ปีนี้
    if year is None:
        year = datetime.now(timezone.utc).year
    start_this_year = datetime(year, 1, 1, tzinfo=timezone.utc)
    end_this_year = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    start_prev_year = datetime(year - 1, 1, 1, tzinfo=timezone.utc)
    end_prev_year = start_this_year

    # เรื่องค้างพิจารณาระหว่างปีก่อนหน้าและปีนี้ (consideration_result is NULL หรือไม่ยุติ)
    pending_subq = db.query(
        OutgoingReport4.outside_department_id,
        OutgoingReport4.signature_authority_user_id,
        func.count(OutgoingReport4.id).label("pending_count")
    ).filter(
        OutgoingReport4.created_at >= start_prev_year,
        OutgoingReport4.created_at < end_this_year,
        or_(OutgoingReport4.consideration_result.is_(None), ~OutgoingReport4.consideration_result.ilike("%ยุติ%"))
    ).group_by(
        OutgoingReport4.outside_department_id,
        OutgoingReport4.signature_authority_user_id
    ).subquery()

    # เรื่องที่ดำเนินการในปีนี้ (consideration_result is NULL หรือไม่ยุติ, created_at ปีนี้)
    inprogress_subq = db.query(
        OutgoingReport4.outside_department_id,
        OutgoingReport4.signature_authority_user_id,
        func.count(OutgoingReport4.id).label("inprogress_count")
    ).filter(
        OutgoingReport4.created_at >= start_this_year,
        OutgoingReport4.created_at < end_this_year,
        or_(OutgoingReport4.consideration_result.is_(None), ~OutgoingReport4.consideration_result.ilike("%ยุติ%"))
    ).group_by(
        OutgoingReport4.outside_department_id,
        OutgoingReport4.signature_authority_user_id
    ).subquery()

    # Join เพื่อดึงชื่อหน่วยงานและชื่อผู้ตรวจ
    query = db.query(
        OutsideDepartment.id.label("outside_department_id"),
        OutsideDepartment.name.label("outside_department_name"),
        User.id.label("signature_authority_user_id"),
        User.first_name,
        User.last_name,
        func.coalesce(pending_subq.c.pending_count, 0).label("pending_count"),
        func.coalesce(inprogress_subq.c.inprogress_count, 0).label("inprogress_count")
    ).join(
        pending_subq,
        and_(
            pending_subq.c.outside_department_id == OutsideDepartment.id,
            pending_subq.c.signature_authority_user_id == User.id
        ),
        isouter=True
    ).join(
        inprogress_subq,
        and_(
            inprogress_subq.c.outside_department_id == OutsideDepartment.id,
            inprogress_subq.c.signature_authority_user_id == User.id
        ),
        isouter=True
    ).join(
        User,
        True
    ).group_by(
        OutsideDepartment.id,
        OutsideDepartment.name,
        User.id,
        User.first_name,
        User.last_name,
        pending_subq.c.pending_count,
        inprogress_subq.c.inprogress_count
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
            "pending_count": row.pending_count,
            "inprogress_count": row.inprogress_count,
        })
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit
    }
