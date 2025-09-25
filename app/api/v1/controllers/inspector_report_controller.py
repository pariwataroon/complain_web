from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case
from typing import Optional, Dict
from models.outgoing_reports4 import OutgoingReport4
from models.outside_departments import OutsideDepartment
from models.signature_authorities import SignatureAuthority
from models.user import User
from datetime import datetime, timezone

def get_inspector_report(db: Session, skip: int = 0, limit: int = 100,
                         search: Optional[str] = None, year: Optional[int] = None) -> Dict:
    if year is None:
        year = datetime.now(timezone.utc).year
    start_date = datetime(year, 1, 1, tzinfo=timezone.utc)
    end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)

    q = (
        db.query(
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
                case(
                    (or_(OutgoingReport4.consideration_result.is_(None),
                         ~OutgoingReport4.consideration_result.ilike("%ยุติ%")), 1),
                    else_=0
                )
            ).label("total_in_progress"),
        )
        # เปลี่ยนเป็น OUTER JOIN เพื่อไม่ตัดแถวกรณี outside_department_id เป็น NULL
        .outerjoin(OutsideDepartment,
                   OutgoingReport4.outside_department_id == OutsideDepartment.id)
        # เปลี่ยนเป็น OUTER JOIN เพื่อไม่ตัดแถวกรณี user ไม่มีในตาราง user (ถ้ามี)
        .outerjoin(User,
                   OutgoingReport4.signature_authority_user_id == User.id)
        .filter(OutgoingReport4.report_type == "inspector")
        .filter(OutgoingReport4.created_at >= start_date,
                OutgoingReport4.created_at < end_date)
        .group_by(
            OutgoingReport4.outside_department_id,
            OutsideDepartment.name,
            OutgoingReport4.signature_authority_user_id,
            User.first_name,
            User.last_name
        )
    )

    if search:
        like = f"%{search}%"
        q = q.filter(or_(User.first_name.ilike(like),
                         User.last_name.ilike(like),
                         OutsideDepartment.name.ilike(like)))

    # MSSQL ต้องมี order_by ก่อน offset/limit
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
            "total_sent": int(row.total_sent or 0),
            "total_closed": int(row.total_closed or 0),
            "total_in_progress": int(row.total_in_progress or 0),
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit
    }
