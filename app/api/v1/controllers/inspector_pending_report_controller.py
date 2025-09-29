from typing import Optional, Dict
from datetime import datetime

from sqlalchemy import func, or_, and_, select, case
from sqlalchemy.orm import Session

from models.outgoing_reports4 import OutgoingReport4
from models.outside_departments import OutsideDepartment
from models.user import User
from models.signature_authorities import SignatureAuthority
from models.group_signature_authorities import GroupSignatureAuthority


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
      - pending_count: ค้างพิจารณาระหว่างปีก่อนหน้า → ปีนี้ (ยังไม่ยุติ)
      - inprogress_count: กำลังดำเนินการในปีนี้ (ยังไม่ยุติ)

    เงื่อนไขสำคัญ:
      - ใช้ช่วงปี (UTC naive) จาก COALESCE(reference_date, document_date, created_at)
      - ยังไม่ยุติ = consideration_result IS NULL หรือ ไม่ ILIKE '%ยุติ%'
      - ครอบคลุมงานผู้ตรวจด้วย or_(report_type == 'inspector', signature_authority_user_id IS NOT NULL)
      - รวม keys (od_id, user_id) แล้วทำ NULL-safe join เพื่อให้กรณี od_id = NULL ไม่นับตก
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

    # รวม keys (od_id, user_id) จากทั้งสองช่วงเวลา
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

    # ฟังก์ชันช่วยทำ NULL-safe equality: (a = b) OR (a IS NULL AND b IS NULL)
    def null_safe_eq(a, b):
        return or_(a == b, and_(a.is_(None), b.is_(None)))

    # สร้าง subquery หา order ของกลุ่มผู้มีสิทธิ์เซ็นต่อผู้ใช้
    sa_group_order_subq = (
        db.query(
            SignatureAuthority.user_id.label("user_id"),
            func.min(GroupSignatureAuthority.order_index).label("group_order_index"),
        )
        .outerjoin(
            GroupSignatureAuthority,
            SignatureAuthority.group_signature_authorities_id == GroupSignatureAuthority.id,
        )
        .filter(SignatureAuthority.is_active == True)
        .group_by(SignatureAuthority.user_id)
        .subquery()
    )

    sa_group_pick_subq = (
        db.query(
            sa_group_order_subq.c.user_id.label("user_id"),
            sa_group_order_subq.c.group_order_index,
            func.min(GroupSignatureAuthority.name).label("group_name"),
        )
        .join(SignatureAuthority, SignatureAuthority.user_id == sa_group_order_subq.c.user_id)
        .join(GroupSignatureAuthority, SignatureAuthority.group_signature_authorities_id == GroupSignatureAuthority.id)
        .filter(GroupSignatureAuthority.order_index == sa_group_order_subq.c.group_order_index)
        .group_by(sa_group_order_subq.c.user_id, sa_group_order_subq.c.group_order_index)
        .subquery()
    )

    q = (
        db.query(
            keys_distinct.c.od_id.label("outside_department_id"),
            OutsideDepartment.name.label("outside_department_name"),
            keys_distinct.c.user_id.label("signature_authority_user_id"),
            User.first_name,
            User.last_name,
            sa_group_pick_subq.c.group_order_index,
            sa_group_pick_subq.c.group_name,
            func.coalesce(pending_subq.c.pending_count, 0).label("pending_count"),
            func.coalesce(inprogress_subq.c.inprogress_count, 0).label("inprogress_count"),
        )
        # NULL-safe join กลับไปหาจำนวน
        .outerjoin(
            pending_subq,
            and_(
                null_safe_eq(pending_subq.c.od_id, keys_distinct.c.od_id),
                null_safe_eq(pending_subq.c.user_id, keys_distinct.c.user_id),
            ),
        )
        .outerjoin(
            inprogress_subq,
            and_(
                null_safe_eq(inprogress_subq.c.od_id, keys_distinct.c.od_id),
                null_safe_eq(inprogress_subq.c.user_id, keys_distinct.c.user_id),
            ),
        )
        # lookup ชื่อหน่วยงาน/ผู้ตรวจ (ไม่บังคับต้องมี)
        .outerjoin(OutsideDepartment, keys_distinct.c.od_id == OutsideDepartment.id)
        .outerjoin(User, keys_distinct.c.user_id == User.id)
        .outerjoin(sa_group_pick_subq, sa_group_pick_subq.c.user_id == keys_distinct.c.user_id)
        .order_by(
            case((sa_group_pick_subq.c.group_order_index.is_(None), 1), else_=0).asc(),
            sa_group_pick_subq.c.group_order_index.asc(),
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
            "signature_group_order_index": int(r.group_order_index) if r.group_order_index is not None else None,
            "signature_group_name": r.group_name if hasattr(r, "group_name") else None,
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