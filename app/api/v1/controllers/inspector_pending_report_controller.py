from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, select, union_all
from typing import Optional, Dict
from models.outgoing_reports4 import OutgoingReport4
from models.outside_departments import OutsideDepartment
from models.user import User
from datetime import datetime, timezone

def get_inspector_pending_report(db: Session, skip=0, limit=100, search=None, year=None):
    if year is None:
        year = datetime.utcnow().year
    start_this_year = datetime(year, 1, 1)
    end_this_year   = datetime(year + 1, 1, 1)
    start_prev_year = datetime(year - 1, 1, 1)

    date_expr = func.coalesce(
        OutgoingReport4.reference_date,
        OutgoingReport4.document_date,
        OutgoingReport4.created_at
    )

    # ค้างระหว่างปีที่แล้ว→ปีนี้
    pending_subq = (
        db.query(
            OutgoingReport4.outside_department_id.label("od_id"),
            OutgoingReport4.signature_authority_user_id.label("user_id"),
            func.count(OutgoingReport4.id).label("pending_count"),
        )
        .filter(
            or_(OutgoingReport4.report_type == "inspector",
                OutgoingReport4.signature_authority_user_id.isnot(None)),
            date_expr >= start_prev_year, date_expr < end_this_year,
            or_(OutgoingReport4.consideration_result.is_(None),
                ~OutgoingReport4.consideration_result.ilike("%ยุติ%")),
        )
        .group_by(OutgoingReport4.outside_department_id, OutgoingReport4.signature_authority_user_id)
        .subquery()
    )

    # กำลังดำเนินการปีนี้
    inprogress_subq = (
        db.query(
            OutgoingReport4.outside_department_id.label("od_id"),
            OutgoingReport4.signature_authority_user_id.label("user_id"),
            func.count(OutgoingReport4.id).label("inprogress_count"),
        )
        .filter(
            or_(OutgoingReport4.report_type == "inspector",
                OutgoingReport4.signature_authority_user_id.isnot(None)),
            date_expr >= start_this_year, date_expr < end_this_year,
            or_(OutgoingReport4.consideration_result.is_(None),
                ~OutgoingReport4.consideration_result.ilike("%ยุติ%")),
        )
        .group_by(OutgoingReport4.outside_department_id, OutgoingReport4.signature_authority_user_id)
        .subquery()
    )

    keys_subq = (
        select(pending_subq.c.od_id, pending_subq.c.user_id)
        .union_all(select(inprogress_subq.c.od_id, inprogress_subq.c.user_id))
        .subquery()
    )

    keys_distinct = (
        db.query(keys_subq.c.od_id.label("od_id"), keys_subq.c.user_id.label("user_id"))
        .group_by(keys_subq.c.od_id, keys_subq.c.user_id)
        .subquery()
    )

    q = (
        db.query(
            keys_distinct.c.od_id.label("outside_department_id"),
            OutsideDepartment.name.label("outside_department_name"),
            keys_distinct.c.user_id.label("signature_authority_user_id"),
            User.first_name, User.last_name,
            func.coalesce(pending_subq.c.pending_count, 0).label("pending_count"),
            func.coalesce(inprogress_subq.c.inprogress_count, 0).label("inprogress_count"),
        )
        .outerjoin(pending_subq, and_(pending_subq.c.od_id == keys_distinct.c.od_id,
                                      pending_subq.c.user_id == keys_distinct.c.user_id))
        .outerjoin(inprogress_subq, and_(inprogress_subq.c.od_id == keys_distinct.c.od_id,
                                         inprogress_subq.c.user_id == keys_distinct.c.user_id))
        .outerjoin(OutsideDepartment, keys_distinct.c.od_id == OutsideDepartment.id)
        .outerjoin(User, keys_distinct.c.user_id == User.id)
        .order_by(OutsideDepartment.name.asc(), User.first_name.asc(), User.last_name.asc())
    )

    if search:
        like = f"%{search}%"
        q = q.filter(or_(User.first_name.ilike(like), User.last_name.ilike(like), OutsideDepartment.name.ilike(like)))

    total = q.count()
    rows = q.offset(skip).limit(limit).all()

    items = [{
        "outside_department_id": str(r.outside_department_id) if r.outside_department_id else None,
        "outside_department_name": r.outside_department_name or "ไม่ระบุหน่วยงาน",
        "signature_authority_user_id": str(r.signature_authority_user_id) if r.signature_authority_user_id else None,
        "signature_authority_user_name": (f"{r.first_name or ''} {r.last_name or ''}").strip() or "N/A",
        "pending_count": int(r.pending_count or 0),
        "inprogress_count": int(r.inprogress_count or 0),
    } for r in rows]

    return {"items": items, "total": total, "page": (skip // limit) + 1, "size": limit, "total_pages": (total + limit - 1) // limit