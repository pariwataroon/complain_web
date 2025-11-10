from typing import Optional, Dict
from datetime import datetime

from sqlalchemy import func, or_, case, and_
from sqlalchemy.orm import Session

from models.outgoing_reports4 import OutgoingReport4
from models.outgoing_reports import OutgoingReport
from models.departments import Department
from models.user import User


def get_annual_complaint_summary(
    db: Session,
    year: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> Dict:
    """
    รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ (Hierarchical)
    แสดงหน่วยงานหลักและหน่วยงานย่อย พร้อมจำนวนเรื่อง
    """
    if year is None:
        year = datetime.now().year

    # ใช้ช่วงเวลา
    if date_from is None:
        date_from = datetime(year, 1, 1)
    if date_to is None:
        date_to = datetime(year + 1, 1, 1)

    # ใช้วันที่อ้างอิง
    date_expr = func.coalesce(
        OutgoingReport4.reference_date,
        OutgoingReport4.document_date,
        OutgoingReport4.created_at
    )

    # Query นับจำนวนต่อหน่วยงาน
    q = (
        db.query(
            OutgoingReport.department_id,
            Department.name.label("department_name"),
            func.count(OutgoingReport4.id).label("total"),
            func.sum(
                case(
                    (OutgoingReport4.consideration_result.ilike("%ยุติ%"), 1),
                    else_=0,
                )
            ).label("closed"),
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
            ).label("ongoing"),
        )
        .join(
            OutgoingReport,
            OutgoingReport4.complaint_number == OutgoingReport.complaint_number,
        )
        .outerjoin(
            Department,
            OutgoingReport.department_id == Department.id,
        )
        .filter(
            date_expr >= date_from,
            date_expr < date_to
        )
        .group_by(
            OutgoingReport.department_id,
            Department.name,
        )
        .order_by(
            Department.name.asc(),
        )
    )

    rows = q.all()

    # จัดเตรียมข้อมูล hierarchical
    items = []
    for r in rows:
        items.append({
            "id": str(r.department_id) if r.department_id else None,
            "agency": r.department_name or "ไม่ระบุหน่วยงาน",
            "total": int(r.total or 0),
            "closed": int(r.closed or 0),
            "ongoing": int(r.ongoing or 0),
            "children": []  # TODO: ถ้าต้องการหน่วยงานย่อยต้องเพิ่ม logic
        })

    return {
        "items": items,
        "total": len(items),
    }


def get_annual_complaint_details(
    db: Session,
    year: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Dict:
    """
    รายละเอียดเรื่องร้องเรียนแต่ละเรื่อง
    แสดงรายการเรื่องร้องเรียนทั้งหมดพร้อมรายละเอียด
    """
    if year is None:
        year = datetime.now().year

    # ใช้ช่วงเวลา
    if date_from is None:
        date_from = datetime(year, 1, 1)
    if date_to is None:
        date_to = datetime(year + 1, 1, 1)

    # ใช้วันที่อ้างอิง
    date_expr = func.coalesce(
        OutgoingReport4.reference_date,
        OutgoingReport4.document_date,
        OutgoingReport4.created_at
    )

    q = (
        db.query(
            OutgoingReport4,
            OutgoingReport,
            Department,
            User,
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
        .filter(
            date_expr >= date_from,
            date_expr < date_to
        )
    )

    # Filter by department
    if department_id:
        q = q.filter(OutgoingReport.department_id == department_id)

    # Filter by status
    if status:
        if status == "ยุติ":
            q = q.filter(OutgoingReport4.consideration_result.ilike("%ยุติ%"))
        elif status == "อยู่ระหว่างดำเนินการ":
            q = q.filter(
                or_(
                    OutgoingReport4.consideration_result.is_(None),
                    ~OutgoingReport4.consideration_result.ilike("%ยุติ%")
                )
            )

    q = q.order_by(OutgoingReport4.created_at.desc())

    total = q.count()
    rows = q.offset(skip).limit(limit).all()

    items = []
    for r in rows:
        or4, or1, dept, user = r

        # คำนวณระยะเวลาดำเนินการ
        elapsed_time = ""
        if or4.created_at:
            delta = datetime.now() - or4.created_at
            days = delta.days
            if days >= 365:
                elapsed_time = f"{days // 365} ปี"
            elif days >= 30:
                elapsed_time = f"{days // 30} เดือน"
            elif days >= 7:
                elapsed_time = f"{days // 7} สัปดาห์"
            else:
                elapsed_time = f"{days} วัน"

        # กำหนดสถานะ
        if or4.consideration_result and "ยุติ" in or4.consideration_result:
            status_text = "ยุติ"
        else:
            status_text = "อยู่ระหว่างดำเนินการ"

        items.append({
            "id": str(or4.id),
            "agency": dept.name if dept else "ไม่ระบุ",
            "receiptNumber": or4.complaint_number or "-",
            "receiptDate": or4.document_date.strftime("%d/%m/%Y") if or4.document_date else "-",
            "complainant": "-",  # TODO: ต้องดึงจาก Complaint table
            "complaint": or4.subject or "-",
            "issueType": "-",  # TODO: ต้องดึงจากประเภทเรื่อง
            "letterRef": or1.reference_number if or1 else "-",
            "letterDate": or1.reference_date.strftime("%d/%m/%Y") if or1 and or1.reference_date else "-",
            "responsibleOfficer": f"{user.first_name} {user.last_name}" if user else "-",
            "status": status_text,
            "elapsedTime": elapsed_time,
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit,
    }
