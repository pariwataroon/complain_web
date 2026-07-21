from typing import Optional, Dict
from datetime import datetime

from sqlalchemy import func, or_, and_, select, case
from sqlalchemy.orm import Session

from models.outgoing_reports import OutgoingReport
from models.departments import Department
from models.user import User
from models.signature_authorities import SignatureAuthority
from models.group_signature_authorities import GroupSignatureAuthority
from models.comp_complaint import Complaint, ComplaintStatus


def get_inspector_pending_report(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    year: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict:
    """
    เรื่องค้างการพิจารณา — ใช้ OutgoingReport + Complaint.status เหมือน /reports/inspector

    นับ:
      - pending_count: ค้างพิจารณา (ยังไม่ยุติ) ตามช่วงวันที่ "ก่อน"
      - inprogress_count: กำลังดำเนินการ (ยังไม่ยุติ) ตามช่วงวันที่ "ภายใน"

    3 โหมด:
      1. ไม่มี filter (year=None, ไม่มี date_from/date_to):
         → ดึงเรื่องค้างทั้งหมด (ไม่จำกัดปี)
      2. มี date_from/date_to:
         → pending = ค้างก่อน date_from, inprogress = อยู่ระหว่าง date_from → date_to
      3. มี year เท่านั้น:
         → pending = ปีก่อนหน้า → ปีนี้, inprogress = ปีนี้ → ปีหน้า

    เงื่อนไขสำคัญ:
      - ใช้ OutgoingReport (เหมือน /reports/inspector) — ไม่ใช้ OutgoingReport4
      - ยังไม่ยุติ = Complaint.status != 'completed' (รวม NULL)
      - ดึงเฉพาะรายการที่มี signature_authority_user_id
      - MSSQL ต้องมี order_by ก่อน offset/limit
    """

    # ── กำหนดช่วงวันที่ ──
    if date_from and date_to:
        # โหมด 2: มี date_from/date_to
        pending_start = None                          # pending: ไม่จำกัดล่าง
        pending_end = datetime.strptime(date_from, "%Y-%m-%d")
        inprogress_start = pending_end                 # inprogress: >= date_from
        inprogress_end = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    elif year is not None:
        # โหมด 3: มี year
        pending_start = datetime(year - 1, 1, 1)
        pending_end = datetime(year, 1, 1)
        inprogress_start = pending_end
        inprogress_end = datetime(year + 1, 1, 1)
    else:
        # โหมด 1: ไม่มี filter → pending นับทั้งหมด, inprogress = 0
        pending_start = None
        pending_end = None
        inprogress_start = datetime(2090, 1, 1)  # ช่วงไกลมาก → ไม่มีข้อมูล
        inprogress_end = datetime(2091, 1, 1)

    date_expr = func.coalesce(
        OutgoingReport.reference_date,
        OutgoingReport.document_date,
        OutgoingReport.created_at,
    )

    # ── Subquery: หา order ของกลุ่มผู้มีสิทธิ์เซ็น ──
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

    # ── Base filter: เฉพาะ inspector + ยังไม่ยุติ (เหมือน /reports/inspector) ──
    base_filter = [
        OutgoingReport.signature_authority_user_id.isnot(None),
        or_(
            Complaint.status.is_(None),
            Complaint.status != ComplaintStatus.COMPLETED,
        ),
    ]

    # ── Pending subquery: ค้างพิจารณาก่อนช่วง filter ──
    pending_filter = list(base_filter)
    if pending_start is not None:
        pending_filter.append(date_expr >= pending_start)
    if pending_end is not None:
        pending_filter.append(date_expr < pending_end)

    pending_subq = (
        db.query(
            OutgoingReport.department_id.label("dept_id"),
            OutgoingReport.signature_authority_user_id.label("user_id"),
            func.count(OutgoingReport.id).label("pending_count"),
        )
        .outerjoin(Complaint, OutgoingReport.complaint_id == Complaint.id)
        .filter(*pending_filter)
        .group_by(
            OutgoingReport.department_id,
            OutgoingReport.signature_authority_user_id,
        )
        .subquery()
    )

    # ── Inprogress subquery: อยู่ระหว่างดำเนินการในช่วง filter ──
    inprogress_filter = list(base_filter)
    if inprogress_start is not None:
        inprogress_filter.append(date_expr >= inprogress_start)
    if inprogress_end is not None:
        inprogress_filter.append(date_expr < inprogress_end)

    inprogress_subq = (
        db.query(
            OutgoingReport.department_id.label("dept_id"),
            OutgoingReport.signature_authority_user_id.label("user_id"),
            func.count(OutgoingReport.id).label("inprogress_count"),
        )
        .outerjoin(Complaint, OutgoingReport.complaint_id == Complaint.id)
        .filter(*inprogress_filter)
        .group_by(
            OutgoingReport.department_id,
            OutgoingReport.signature_authority_user_id,
        )
        .subquery()
    )

    # ── รวม keys (dept_id, user_id) จากทั้งสอง subquery ──
    keys_subq = (
        select(pending_subq.c.dept_id, pending_subq.c.user_id)
        .union_all(select(inprogress_subq.c.dept_id, inprogress_subq.c.user_id))
        .subquery()
    )
    keys_distinct = (
        db.query(keys_subq.c.dept_id.label("dept_id"), keys_subq.c.user_id.label("user_id"))
        .group_by(keys_subq.c.dept_id, keys_subq.c.user_id)
        .subquery()
    )

    # ฟังก์ชันช่วย NULL-safe equality
    def null_safe_eq(a, b):
        return or_(a == b, and_(a.is_(None), b.is_(None)))

    # ── Main query ──
    q = (
        db.query(
            keys_distinct.c.dept_id.label("department_id"),
            Department.name.label("department_name"),
            keys_distinct.c.user_id.label("signature_authority_user_id"),
            User.first_name,
            User.last_name,
            sa_group_pick_subq.c.group_order_index,
            sa_group_pick_subq.c.group_name,
            func.coalesce(pending_subq.c.pending_count, 0).label("pending_count"),
            func.coalesce(inprogress_subq.c.inprogress_count, 0).label("inprogress_count"),
        )
        .outerjoin(
            pending_subq,
            and_(
                null_safe_eq(pending_subq.c.dept_id, keys_distinct.c.dept_id),
                null_safe_eq(pending_subq.c.user_id, keys_distinct.c.user_id),
            ),
        )
        .outerjoin(
            inprogress_subq,
            and_(
                null_safe_eq(inprogress_subq.c.dept_id, keys_distinct.c.dept_id),
                null_safe_eq(inprogress_subq.c.user_id, keys_distinct.c.user_id),
            ),
        )
        .outerjoin(Department, keys_distinct.c.dept_id == Department.id)
        .outerjoin(User, keys_distinct.c.user_id == User.id)
        .outerjoin(sa_group_pick_subq, sa_group_pick_subq.c.user_id == keys_distinct.c.user_id)
        .order_by(
            case((sa_group_pick_subq.c.group_order_index.is_(None), 1), else_=0).asc(),
            sa_group_pick_subq.c.group_order_index.asc(),
            Department.name.asc(),
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
                Department.name.ilike(like),
            )
        )

    total = q.count()
    rows = q.offset(skip).limit(limit).all()

    items = []
    for r in rows:
        items.append({
            "department_id": str(r.department_id) if r.department_id else None,
            "department_name": r.department_name or "ไม่ระบุหน่วยงาน",
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
