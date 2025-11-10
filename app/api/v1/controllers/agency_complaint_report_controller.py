from typing import Optional, Dict
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.outgoing_reports4 import OutgoingReport4
from models.outgoing_reports import OutgoingReport
from models.departments import Department
from models.comp_complaint import Complaint
from models.user import User


def get_agency_complaint_report(
    db: Session,
    year: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    agency: Optional[str] = None,
    responsible_officer: Optional[str] = None,
    claimant_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Dict:
    """
    รายงานสรุปเรื่องร้องเรียนของหน่วยงาน
    แสดงรายละเอียดเรื่องร้องเรียนแต่ละเรื่องพร้อมหน่วยงานและเจ้าหน้าที่รับผิดชอบ
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
            Complaint,
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
            Complaint,
            OutgoingReport.complaint_id == Complaint.id,
        )
        .outerjoin(
            User,
            Complaint.assigned_officer_id == User.id,
        )
        .filter(
            date_expr >= date_from,
            date_expr < date_to
        )
    )

    # Filter by department
    if department_id:
        q = q.filter(OutgoingReport.department_id == department_id)

    # Filter by agency name
    if agency:
        q = q.filter(Department.name.ilike(f"%{agency}%"))

    # Filter by status (consideration_result)
    if status:
        # Map Thai status to database values
        status_map = {
            "ทราบ": "รับทราบ",
            "ทราบไว้ชั้นหนึ่ง": "อนุมัติ",
            "ยุติเรื่องได้": "ยุติเรื่อง",
            "เห็นชอบ": "เพิ่มเติม",
            "อยู่ระหว่างดำเนินการ": "ดำเนินการ",
        }
        db_status = status_map.get(status, status)
        q = q.filter(OutgoingReport4.consideration_result.ilike(f"%{db_status}%"))

    # Filter by responsible officer
    if responsible_officer:
        q = q.filter(
            func.concat(User.first_name, ' ', User.last_name).ilike(f"%{responsible_officer}%")
        )

    # Filter by claimant name
    if claimant_name:
        q = q.filter(Complaint.subject.ilike(f"%{claimant_name}%"))

    q = q.order_by(OutgoingReport4.created_at.desc())

    total = q.count()
    rows = q.offset(skip).limit(limit).all()

    items = []
    for r in rows:
        or4, or1, dept, complaint, user = r

        # คำนวณระยะเวลาดำเนินการ
        working_days = 0
        if or4.created_at:
            delta = datetime.now() - or4.created_at
            working_days = delta.days

        # แปลง consideration_result เป็น status label ไทย
        status_text = or4.consideration_result or "อยู่ระหว่างดำเนินการ"
        status_map_reverse = {
            "รับทราบ": "ทราบ",
            "อนุมัติ": "ทราบไว้ชั้นหนึ่ง",
            "ยุติเรื่อง": "ยุติเรื่องได้",
            "เพิ่มเติม": "เห็นชอบ",
            "ดำเนินการ": "อยู่ระหว่างดำเนินการ",
        }
        for key, val in status_map_reverse.items():
            if key in status_text:
                status_text = val
                break

        # Format date
        receive_date = ""
        if or4.document_date:
            receive_date = or4.document_date.strftime("%d/%m/%Y")
        elif or4.created_at:
            receive_date = or4.created_at.strftime("%d/%m/%Y")

        items.append({
            "id": str(or4.id),
            "claimantName": complaint.subject if complaint else or4.subject or "-",
            "receiptNumber": or4.complaint_number or "-",
            "receiveDate": receive_date,
            "agency": dept.name if dept else "ไม่ระบุ",
            "issue": or4.subject or complaint.subject if complaint else "-",
            "issueType": complaint.complaint_type if complaint else "-",
            "note": or4.remarks or "-",
            "responsibleOfficer": f"{user.first_name} {user.last_name}" if user else "-",
            "status": status_text,
            "workingDays": working_days,
        })

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
    }
