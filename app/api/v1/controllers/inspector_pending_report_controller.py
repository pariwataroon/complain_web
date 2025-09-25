from typing import Optional, Dict
from datetime import datetime

from sqlalchemy import func, or_, and_, select
from sqlalchemy.orm import Session

from models.outgoing_reports4 import OutgoingReport4
from models.outside_departments import OutsideDepartment
from models.user import User


def get_inspector_pending_report(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    year: Optional[int] = None,
) -> Dict:
    """
    เรื่องค้างการพิจารณา

    นับ:
      - pending_count: ค้างพิจารณาระหว่างปีก่อนหน้า → ปีนี้
      - inprogress_count: กำลังดำเนินการในปีนี้

    เงื่อนไขสำคัญ:
      - ใช้ช่วงปี (UTC naive) จาก COALESCE(reference_date, document_date, created_at)
      - ยังไม่ยุติ = consideration_result IS NULL หรือ ไม่ ILIKE '%ยุติ%'
      - ครอบคลุมงานผู้ตรวจด้วย or_(report_type == 'inspector', signature_authority_user_id IS NOT NULL)
      - รวม keys (od_id, user_id) จากสองช่วงเวลา เพื่อไม่ทำหายแม้ department/user จะ NULL
      - MSSQL ต้องมี order_by ก่อน offset/limit
    """
    if year is None:
        year = datetime.utcnow().year

    # ช่วงเวลา (UTC-naive)
    start_this_year = datetime(year, 1, 1)
    end_this_year = datetime(year + 1, 1, 1)
    start_prev_year = datetime(year - 1, 1, 1)

    date_expr = func.coalesce(
        OutgoingReport4.reference_date,
        OutgoingReport4.document_date,
        OutgoingReport4.created_at
    )

    # ค้างพิจารณาระหว่างปีที่แล้ว → ปีนี้ (ยังไม่ยุติ)
    pending_subq = (
        db.query(
            OutgoingReport4.outside_department_id.label("od_id"),
            OutgoingReport4.signature_authority_user_id.label("user_id"),
            func.count(OutgoingReport4.id).label("pending_count"),
        )
        .filter(
            or_(
                OutgoingReport4.report_type == "inspector",
                OutgoingReport4.signature_authority_user_id.isnot(None),
            ),
            date_expr >= start_prev_year,
            date_expr < end_this_year,
            or_(
                OutgoingReport4.consideration_result.is_(None),
                ~OutgoingReport4.consideration_result.ilike("%ยุติ%"),
            ),
        )
        .group_by(
            OutgoingReport4.outside_department_id,
            OutgoingReport4.signature_authority_user_id,
        )
        .subquery()
    )

    # กำลังดำเนินการในปีนี้ (ยังไม่ยุติ)
    inprogress_subq = (
        db.query(
            OutgoingReport4.outside_department_id.label("od_id"),
            OutgoingReport4.signature_authority_user_id.label("user_id"),
            func.count(OutgoingReport4.id).label("inprogress_count"),
        )
        .filter(
            or_(
                OutgoingReport4.report_type == "inspector",
                OutgoingReport4.signature_authority_user_id.isnot(None),
            ),
            date_expr >= start_this_year,
            date_expr < end_this_year,
            or_(
                OutgoingReport4.consideration_result.is_(None),
                ~OutgoingReport4.consideration_result.ilike("%ยุติ%"),
            ),
        )
        .group_by(
            OutgoingReport4.outside_department_id,
            OutgoingReport4.signature_authority_user_id,
        )
        .subquery()
    )

    # รวม keys (od_id, user_id) จากทั้งสองช่วง (อาจมีค่า NULL ได้)
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
            User.first_name,
            User.last_name,
            func.coalesce(pending_subq.c.pending_count, 0).label("pending_count"),
            func.coalesce(inprogress_subq.c.inprogress_count, 0).label("inprogress_count"),
        )
        .outerjoin(
            pending_subq,
            and_(
                pending_subq.c.od_id == keys_distinct.c.od_id,
                pending_subq.c.user_id == keys_distinct.c.user_id,
            ),
        )
        .outerjoin(
            inprogress_subq,
            and_(
                inprogress_subq.c.od_id == keys_distinct.c.od_id,
                inprogress_subq.c.user_id == keys_distinct.c.user_id,
            ),
        )
        .outerjoin(OutsideDepartment, keys_distinct.c.od_id == OutsideDepartment.id)
        .outerjoin(User, keys_distinct.c.user_id == User.id)
        .order_by(
            OutsideDepartment.name.asc(),
            User.first_name.asc(),
            User.last_name.asc(),
        )
    )

    if search:
        like = f"%{search}%"
        q = q.filter(
            or_(
                User.first_name.ilike(like),
                User.last_name.ilike(like),
                OutsideDepartment.name.ilike(like),
            )
        )

    total = q.count()
    rows = q.offset(skip).limit(limit).all()

    items = []
    for r in rows:
        items.append({
            "outside_department_id": str(r.outside_department_id) if r.outside_department_id else None,
            "outside_department_name": r.outside_department_name or "ไม่ระบุหน่วยงาน",
            "signature_authority_user_id": str(r.signature_authority_user_id) if r.signature_authority_user_id else None,
            "signature_authority_user_name": (f"{r.first_name or ''} {r.last_name or ''}").strip() or "N/A",
            "pending_count": int(r.pending_count or 0),
            "inprogress_count": int(r.inprogress_count or 0),
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit,
    }