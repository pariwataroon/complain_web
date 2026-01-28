from typing import Optional, Dict
from datetime import datetime
import json
import logging

from sqlalchemy import func, cast, or_
from sqlalchemy.orm import Session
from sqlalchemy.dialects.mssql import DATETIME2

from models.outgoing_reports4 import OutgoingReport4
from models.outgoing_reports import OutgoingReport
from models.departments import Department
from models.comp_complaint import Complaint
from models.user import User

logger = logging.getLogger(__name__)


# Thai months for date formatting
THAI_MONTHS = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
]


def format_thai_date(date_obj: Optional[datetime]) -> str:
    """Format datetime to Thai date string (e.g., '01 ก.พ. 2568')"""
    if not date_obj:
        return "-"
    try:
        day = date_obj.day
        month = THAI_MONTHS[date_obj.month - 1]
        year = date_obj.year + 543  # Convert to Buddhist year
        return f"{day:02d} {month} {year}"
    except Exception:
        return "-"


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
    รายงานสรุปเรื่องร้องเร้อยเรียนของหน่วยงาน
    แสดงรายละเอียดเรื่องร้องเร้อยเรียนแต่ละเรื่องพร้อมหน่วยงานและเจ้าหน้าที่รับผิดชอบ
    """
    try:
        logger.info(f"[AGENCY_COMPLAINT_REPORT] Fetching report - year:{year}, date_from:{date_from}, date_to:{date_to}, agency:{agency}, status:{status}")

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

        # Query หลักจาก OutgoingReport4 แล้ว join กับข้อมูลอื่นๆ
        q = (
            db.query(OutgoingReport4)
            .outerjoin(
                Department,
                or_(
                    OutgoingReport4.department_id == Department.id,
                    OutgoingReport4.outside_department_id == Department.id
                )
            )
            .outerjoin(
                OutgoingReport,
                OutgoingReport4.complaint_number == OutgoingReport.complaint_number,
            )
            .outerjoin(
                Complaint,
                or_(
                    OutgoingReport.complaint_id == Complaint.id,
                    OutgoingReport4.complaint_id == Complaint.id
                )
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
            q = q.filter(
                or_(
                    OutgoingReport4.department_id == department_id,
                    OutgoingReport4.outside_department_id == department_id
                )
            )

        # Filter by agency name (filter on both direct department_id and joined department)
        if agency:
            q = q.filter(
                func.coalesce(Department.name, '').ilike(f"%{agency}%")
            )

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

        # Filter by claimant name (search in both subject and complainant data)
        if claimant_name:
            q = q.filter(
                func.coalesce(Complaint.subject, OutgoingReport4.subject, '').ilike(f"%{claimant_name}%")
            )

        q = q.order_by(OutgoingReport4.created_at.desc())

        total = q.count()
        logger.info(f"[AGENCY_COMPLAINT_REPORT] Total records: {total}")
        rows = q.offset(skip).limit(limit).all()
        logger.info(f"[AGENCY_COMPLAINT_REPORT] Fetched {len(rows)} rows")

        items = []
        for r in rows:
            or4 = r  # ตอนนี้เรา query แค่ OutgoingReport4 เพราะใช้ outerjoin

            # ดึงข้อมูลจาก relation
            dept = None
            complaint = None
            user = None

            # พยายามดึงข้อมูลเพิ่มเติม
            if hasattr(r, 'Department'):
                dept = r.Department
            if hasattr(r, 'Complaint'):
                complaint = r.Complaint
            if hasattr(r, 'User'):
                user = r.User

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

            # Format date to Thai format
            receive_date = format_thai_date(or4.document_date or or4.created_at)

            # Get claimant name - ใช้ subject เป็นหลัก
            claimant_name_val = or4.subject or complaint.subject if complaint else "-"

            # Get agency name
            agency_val = dept.name if dept else "ไม่ระบุ"

            # Get issue
            issue_val = or4.subject or (complaint.subject if complaint else "-")

            # Get issue type
            issue_type_val = "-"
            if complaint:
                if hasattr(complaint, 'complaint_type_relation') and complaint.complaint_type_relation:
                    issue_type_val = complaint.complaint_type_relation.name or complaint.complaint_type or "-"
                elif complaint.complaint_type:
                    issue_type_val = complaint.complaint_type

            # Get responsible officer
            officer_val = "-"
            if user:
                officer_val = f"{user.first_name} {user.last_name}"
            elif hasattr(or4, 'assigned_to'):
                officer_val = or4.assigned_to or "-"

            # Get note/remarks
            note_val = or4.remarks or "-"

            items.append({
                "id": str(or4.id),
                "claimantName": claimant_name_val or "-",
                "receiptNumber": or4.complaint_number or "-",
                "receiveDate": receive_date,
                "agency": agency_val,
                "issue": issue_val,
                "issueType": issue_type_val,
                "note": note_val,
                "responsibleOfficer": officer_val,
                "status": status_text,
                "workingDays": working_days,
            })

        logger.info(f"[AGENCY_COMPLAINT_REPORT] Returning {len(items)} items")

        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "size": limit,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
        }
    except Exception as e:
        logger.error(f"[AGENCY_COMPLAINT_REPORT] Error: {str(e)}", exc_info=True)
        raise
