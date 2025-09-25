from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, select, union_all
from typing import Optional, Dict
from models.outgoing_reports4 import OutgoingReport4
from models.outside_departments import OutsideDepartment
from models.user import User
from datetime import datetime, timezone

def get_inspector_pending_report(db: Session, skip: int = 0, limit: int = 100,
                                 search: Optional[str] = None, year: Optional[int] = None) -> Dict:
    if year is None:
        year = datetime.now(timezone.utc).year
    start_this_year = datetime(year, 1, 1, tzinfo=timezone.utc)
    end_this_year = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    start_prev_year = datetime(year - 1, 1, 1, tzinfo=timezone.utc)

    pending_subq = (
        db.query(
            OutgoingReport4.outside_department_id.label("od_id"),
            OutgoingReport4.signature_authority_user_id.label("user_id"),
            func.count(OutgoingReport4.id).label("pending_count"),
        )
        .filter(
            OutgoingReport4.report_type == "inspector",
            OutgoingReport4.created_at >= start_prev_year,
            OutgoingReport4.created_at < end_this_year,
            or_(OutgoingReport4.consideration_result.is_(None),
                ~OutgoingReport4.consideration_result.ilike("%ยุติ%")),
        )
        .group_by(OutgoingReport4.outside_department_id,
                  OutgoingReport4.signature_authority_user_id)
        .subquery()
    )

    inprogress_subq = (
        db.query(
            OutgoingReport4.outside_department_id.label("od_id"),
            OutgoingReport4.signature_authority_user_id.label("user_id"),
            func.count(OutgoingReport4.id).label("inprogress_count"),
        )
        .filter(
            OutgoingReport4.report_type == "inspector",
            OutgoingReport4.created_at >= start_this_year,
            OutgoingReport4.created_at < end_this_year,
            or_(OutgoingReport4.consideration_result.is_(None),
                ~OutgoingReport4.consideration_result.ilike("%ยุติ%")),
        )
        .group_by(OutgoingReport4.outside_department_id,
                  OutgoingReport4.signature_authority_user_id)
        .subquery()
    )

    # รวม keys (od_id, user_id) จากทั้งสอง subquery (รองรับ od_id = NULL)
    keys_subq = (
        select(pending_subq.c.od_id, pending_subq.c.user_id)
        .union_all(select(inprogress_subq.c.od_id, inprogress_subq.c.user_id))
        .subquery()
    )

    # รวม keys ให้เหลือคู่ที่ไม่ซ้ำ
    keys_distinct = (
        db.query(keys_subq.c.od_id.label("od_id"),
                 keys_subq.c.user_id.label("user_id"))
        .group_by(keys_subq.c.od_id, keys_subq.c.user_id)
        .subquery()
    )

    q = (
        db.query(
            keys_distinct.c.od_id.label("outside_department_id"),
            OutsideDepartment.name.label("outside_department_name"),
            keys_distinct.c.user_id.label("signature_authority_user_id"),
            User.first_name,
            User.last_name,
            func.coalesce(pending_subq.c.pending_count, 0).label("pending_count"),
            func.coalesce(inprogress_subq.c.inprogress_count, 0).label("inprogress_count"),
        )
        # LEFT JOIN counts กลับมาด้วย keys
        .outerjoin(pending_subq, and_(pending_subq.c.od_id == keys_distinct.c.od_id,
                                      pending_subq.c.user_id == keys_distinct.c.user_id))
        .outerjoin(inprogress_subq, and_(inprogress_subq.c.od_id == keys_distinct.c.od_id,
                                         inprogress_subq.c.user_id == keys_distinct.c.user_id))
        # LEFT JOIN lookup โดยไม่บังคับให้ od_id/user_id ต้องมีค่า
        .outerjoin(OutsideDepartment, keys_distinct.c.od_id == OutsideDepartment.id)
        .outerjoin(User, keys_distinct.c.user_id == User.id)
    )

    if search:
        like = f"%{search}%"
        q = q.filter(or_(User.first_name.ilike(like),
                         User.last_name.ilike(like),
                         OutsideDepartment.name.ilike(like)))

    q = q.order_by(OutsideDepartment.name.asc(),
                   User.first_name.asc(),
                   User.last_name.asc())

    total = q.count()
    rows = q.offset(skip).limit(limit).all()

    items = []
    for row in rows:
        items.append({
            "outside_department_id": str(row.outside_department_id) if row.outside_department_id else None,
            "outside_department_name": row.outside_department_name or "ไม่ระบุหน่วยงาน",
            "signature_authority_user_id": str(row.signature_authority_user_id) if row.signature_authority_user_id else None,
            "signature_authority_user_name": ("{} {}".format(row.first_name or "", row.last_name or "")).strip() or "N/A",
            "pending_count": int(row.pending_count or 0),
            "inprogress_count": int(row.inprogress_count or 0),
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit
    }