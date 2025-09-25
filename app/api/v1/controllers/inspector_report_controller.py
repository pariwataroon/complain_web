from typing import Optional, Dict
from datetime import datetime

from sqlalchemy import func, or_, case
from sqlalchemy.orm import Session

from models.outgoing_reports4 import OutgoingReport4
from models.outside_departments import OutsideDepartment
from models.user import User


def get_inspector_report(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    year: Optional[int] = None,
) -> Dict:
    """
    รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจราชการกระทรวงการคลัง

    นับ:
      - total_sent: จำนวนงานทั้งหมดที่ส่งถึงผู้ตรวจ
      - total_closed: consideration_result มีคำว่า 'ยุติ'
      - total_in_progress: consideration_result เป็น NULL หรือ ไม่มีคำว่า 'ยุติ'

    เงื่อนไขสำคัญ:
      - ใช้ช่วงปี (UTC naive) จาก COALESCE(reference_date, document_date, created_at)
      - outerjoin กับ OutsideDepartment และ User เพื่อไม่ตัดแถวที่ค่านั้นเป็น NULL
      - ครอบคลุมงานผู้ตรวจด้วย or_(report_type == 'inspector', signature_authority_user_id IS NOT NULL)
      - MSSQL ต้องมี order_by ก่อน offset/limit
    """
    if year is None:
        year = datetime.utcnow().year

    # ใช้ naive-UTC ให้สอดคล้อง datetime2 ของ MSSQL
    start_date = datetime(year, 1, 1)
    end_date = datetime(year + 1, 1, 1)

    # ใช้วันที่อ้างอิง ถ้าไม่มีค่อย fallback เป็น created_at
    date_expr = func.coalesce(
        OutgoingReport4.reference_date,
        OutgoingReport4.document_date,
        OutgoingReport4.created_at
    )

    q = (
        db.query(
            OutgoingReport4.outside_department_id,
            OutsideDepartment.name.label("outside_department_name"),
            OutgoingReport4.signature_authority_user_id,
            User.first_name,
            User.last_name,
            func.count(OutgoingReport4.id).label("total_sent"),
            func.sum(
                case(
                    (OutgoingReport4.consideration_result.ilike("%ยุติ%"), 1),
                    else_=0,
                )
            ).label("total_closed"),
            func.sum(
                case(
                    (
                        or_(
                            OutgoingReport4.consideration_result.is_(None),
                            ~OutgoingReport4.consideration_result.ilike("%ยุติ%")
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("total_in_progress"),
        )
        .outerjoin(
            OutsideDepartment,
            OutgoingReport4.outside_department_id == OutsideDepartment.id,
        )
        .outerjoin(
            User,
            OutgoingReport4.signature_authority_user_id == User.id,
        )
        .filter(
            or_(
                OutgoingReport4.report_type == "inspector",
                OutgoingReport4.signature_authority_user_id.isnot(None),
            )
        )
        .filter(date_expr >= start_date, date_expr < end_date)
        .group_by(
            OutgoingReport4.outside_department_id,
            OutsideDepartment.name,
            OutgoingReport4.signature_authority_user_id,
            User.first_name,
            User.last_name,
        )
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
            "total_sent": int(r.total_sent or 0),
            "total_closed": int(r.total_closed or 0),
            "total_in_progress": int(r.total_in_progress or 0),
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit,
    }