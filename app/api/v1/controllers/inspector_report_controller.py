from typing import Optional, Dict
from datetime import datetime

from sqlalchemy import func, or_, case, and_
from sqlalchemy.orm import Session

from models.outgoing_reports4 import OutgoingReport4
from models.outgoing_reports import OutgoingReport
from models.departments import Department
from models.user import User
from models.signature_authorities import SignatureAuthority
from models.group_signature_authorities import GroupSignatureAuthority


def get_inspector_report(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    year: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    department_id: Optional[str] = None,
    inspector_id: Optional[str] = None,
    status: Optional[str] = None,
) -> Dict:
    """
    รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจราชการกระทรวงการคลัง

    นับ:
      - total_sent: จำนวนงานทั้งหมดที่ส่งถึงผู้ตรวจ
      - total_closed: consideration_result มีคำว่า 'ยุติ'
      - total_in_progress: consideration_result เป็น NULL หรือ ไม่มีคำว่า 'ยุติ'

    เงื่อนไขสำคัญ:
      - ใช้ช่วงปี (UTC naive) จาก COALESCE(reference_date, document_date, created_at)
      - รองรับ date_from/date_to แทนการใช้ปี ถ้าระบุ
      - outerjoin กับ OutsideDepartment และ User เพื่อไม่ตัดแถวที่ค่านั้นเป็น NULL
      - ครอบคลุมงานผู้ตรวจด้วย or_(report_type == 'inspector', signature_authority_user_id IS NOT NULL)
      - MSSQL ต้องมี order_by ก่อน offset/limit
    """
    # Determine date range: date_from/date_to take precedence over year
    if date_from:
        start_date = datetime.fromisoformat(date_from.replace('Z', '+00:00').replace('+00:00', ''))
        start_date = datetime(start_date.year, start_date.month, start_date.day)
    elif year is not None:
        start_date = datetime(year, 1, 1)
    else:
        start_date = datetime(datetime.utcnow().year, 1, 1)

    if date_to:
        end_date = datetime.fromisoformat(date_to.replace('Z', '+00:00').replace('+00:00', ''))
        end_date = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59)
    elif year is not None:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(datetime.utcnow().year + 1, 1, 1)

    # ใช้วันที่อ้างอิง ถ้าไม่มีค่อย fallback เป็น created_at
    date_expr = func.coalesce(
        OutgoingReport4.reference_date,
        OutgoingReport4.document_date,
        OutgoingReport4.created_at
    )

    # เตรียม subquery หา order ของกลุ่มผู้มีสิทธิ์เซ็นต่อผู้ใช้ โดยใช้ค่าน้อยสุดเป็นตัวแทน
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

    # ผูกชื่อกลุ่มสำหรับ order_index ที่ต่ำสุดต่อผู้ใช้
    sa_group_pick_subq = (
        db.query(
            sa_group_order_subq.c.user_id.label("user_id"),
            sa_group_order_subq.c.group_order_index,
            func.min(GroupSignatureAuthority.name).label("group_name"),
        )
        .join(
            SignatureAuthority,
            SignatureAuthority.user_id == sa_group_order_subq.c.user_id,
        )
        .join(
            GroupSignatureAuthority,
            SignatureAuthority.group_signature_authorities_id == GroupSignatureAuthority.id,
        )
        .filter(GroupSignatureAuthority.order_index == sa_group_order_subq.c.group_order_index)
        .group_by(sa_group_order_subq.c.user_id, sa_group_order_subq.c.group_order_index)
        .subquery()
    )

    q = (
        db.query(
            OutgoingReport.department_id,
            Department.name.label("department_name"),
            OutgoingReport4.signature_authority_user_id,
            User.first_name,
            User.last_name,
            sa_group_pick_subq.c.group_order_index,
            sa_group_pick_subq.c.group_name,
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
        .join(
            OutgoingReport,
            OutgoingReport4.complaint_number == OutgoingReport.complaint_number,
        )
        .outerjoin(
            Department,
            OutgoingReport.department_id == Department.id,
        )
        .outerjoin(
            User,
            OutgoingReport4.signature_authority_user_id == User.id,
        )
        .outerjoin(
            sa_group_pick_subq,
            sa_group_pick_subq.c.user_id == OutgoingReport4.signature_authority_user_id,
        )
        .filter(
            or_(
                OutgoingReport4.report_type == "inspector",
                OutgoingReport4.signature_authority_user_id.isnot(None),
            )
        )
        .filter(date_expr >= start_date, date_expr < end_date)
        .group_by(
            OutgoingReport.department_id,
            Department.name,
            OutgoingReport4.signature_authority_user_id,
            User.first_name,
            User.last_name,
            sa_group_pick_subq.c.group_order_index,
            sa_group_pick_subq.c.group_name,
        )
        .order_by(
            # nulls last: ถ้าไม่มีค่า order ให้ไปท้ายสุด
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

    # Filter by department_id
    if department_id:
        q = q.filter(OutgoingReport.department_id == department_id)

    # Filter by inspector_id
    if inspector_id:
        q = q.filter(OutgoingReport4.signature_authority_user_id == inspector_id)

    # Filter by status
    if status == "closed":
        q = q.filter(OutgoingReport4.consideration_result.ilike("%ยุติ%"))
    elif status == "in_progress":
        q = q.filter(
            or_(
                OutgoingReport4.consideration_result.is_(None),
                ~OutgoingReport4.consideration_result.ilike("%ยุติ%")
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
            "signature_group_name": r.group_name,
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