from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
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
    """
    เรื่องค้างการพิจารณา:
    - pending_count: ค้างพิจารณาระหว่างปี (ปี-1 ถึง ปี) = consideration_result IS NULL หรือ ไม่ใช่ 'ยุติ'
    - inprogress_count: กำลังดำเนินการในปีนี้ (ปี ถึง ปี+1) โดยใช้เงื่อนไขเดียวกับ pending แต่ช่วงเวลาปีนี้
    - เฉพาะ report_type='inspector'
    - กรองปีแบบ UTC+00:00 (default = ปีปัจจุบัน)
    - ค้นหาได้ที่ชื่อผู้ตรวจ/หน่วยงาน
    """

    # ปี (UTC)
    if year is None:
        year = datetime.now(timezone.utc).year
    start_this_year = datetime(year, 1, 1, tzinfo=timezone.utc)
    end_this_year = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    start_prev_year = datetime(year - 1, 1, 1, tzinfo=timezone.utc)
    end_prev_year = start_this_year

    # เรื่องค้างพิจารณาระหว่างปีก่อนหน้าและปีนี้
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
            or_(
                OutgoingReport4.consideration_result.is_(None),
                ~OutgoingReport4.consideration_result.ilike("%ยุติ%")
            ),
        )
        .group_by(
            OutgoingReport4.outside_department_id,
            OutgoingReport4.signature_authority_user_id,
        )
        .subquery()
    )

    # เรื่องที่กำลังดำเนินการในปีนี้
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
            or_(
                OutgoingReport4.consideration_result.is_(None),
                ~OutgoingReport4.consideration_result.ilike("%ยุติ%")
            ),
        )
        .group_by(
            OutgoingReport4.outside_department_id,
            OutgoingReport4.signature_authority_user_id,
        )
        .subquery()
    )

    # Base: หน่วยงาน
    q = (
        db.query(
            OutsideDepartment.id.label("outside_department_id"),
            OutsideDepartment.name.label("outside_department_name"),
            User.id.label("signature_authority_user_id"),
            User.first_name,
            User.last_name,
            func.coalesce(pending_subq.c.pending_count, 0).label("pending_count"),
            func.coalesce(inprogress_subq.c.inprogress_count, 0).label("inprogress_count"),
        )
        # join หน่วยงานกับ pending
        .outerjoin(
            pending_subq,
            pending_subq.c.od_id == OutsideDepartment.id,
        )
        # join หน่วยงานกับ inprogress
        .outerjoin(
            inprogress_subq,
            inprogress_subq.c.od_id == OutsideDepartment.id,
        )
        # join ผู้ตรวจ: ผูกกับ user_id จากสอง subquery (กรณีใดกรณีก็ได้)
        .outerjoin(
            User,
            or_(
                User.id == pending_subq.c.user_id,
                User.id == inprogress_subq.c.user_id,
            ),
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

    # MSSQL: ต้อง order_by ก่อน offset/limit
    q = q.order_by(OutsideDepartment.name.asc(),
                   User.first_name.asc(),
                   User.last_name.asc())

    total = q.count()
    rows = q.offset(skip).limit(limit).all()

    items = []
    for row in rows:
        # ข้ามกรณีที่ไม่มีผู้ตรวจ (user_id เป็น None) เพื่อให้ข้อมูลมีความหมาย
        if row.signature_authority_user_id is None:
            continue
        items.append({
            "outside_department_id": str(row.outside_department_id),
            "outside_department_name": row.outside_department_name,
            "signature_authority_user_id": str(row.signature_authority_user_id),
            "signature_authority_user_name": f"{row.first_name} {row.last_name}",
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
