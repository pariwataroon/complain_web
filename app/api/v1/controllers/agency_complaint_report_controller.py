from typing import Optional, Dict
from datetime import datetime
import json
import logging

from sqlalchemy import func, cast, or_
from sqlalchemy.orm import Session
from sqlalchemy.dialects.mssql import DATETIME2

from models.outgoing_reports import OutgoingReport
from models.outgoing_reports4 import OutgoingReport4
from models.departments import Department
from models.comp_complaint import Complaint
from models.user import User as UserModel
from sqlalchemy.orm import aliased

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

        # ใช้วันที่อ้างอิงจาก Complaint (วันที่ร้องเรียน) หรือ OutgoingReport
        date_expr = func.coalesce(
            Complaint.created_at,
            Complaint.reference_date4,
            OutgoingReport.created_at
        )

        # Query หลักจาก OutgoingReport (เฉพาะเรื่องที่ส่งหนังสือไปหน่วยงาน) join กับ Complaint เพื่อดึงข้อมูลเรื่องร้องเรียน
        AssignedOfficer = aliased(UserModel)
        SignatureUser = aliased(UserModel)

        q = (
            db.query(OutgoingReport)
            .join(
                Complaint,
                OutgoingReport.complaint_id == Complaint.id,
            )
            .outerjoin(
                OutgoingReport4,
                OutgoingReport.complaint_number == OutgoingReport4.complaint_number,
            )
            .outerjoin(
                AssignedOfficer,
                Complaint.assigned_officer_id == AssignedOfficer.id,
            )
            .outerjoin(
                Department,
                OutgoingReport.department_id == Department.id,
            )
            .outerjoin(
                SignatureUser,
                OutgoingReport.signature_authority_user_id == SignatureUser.id,
            )
            .filter(
                date_expr >= date_from,
                date_expr < date_to
            )
        )

        # Filter by department (ตรวจสอบจาก OutgoingReport.department_id)
        if department_id:
            q = q.filter(
                OutgoingReport.department_id == department_id
            )

        # Filter by agency name (ค้นหาจาก Complaint.assigned_to หรือ Department.name)
        if agency:
            q = q.filter(
                or_(
                    Complaint.assigned_to.ilike(f"%{agency}%"),
                    func.coalesce(Department.name, '').ilike(f"%{agency}%")
                )
            )

        # Filter by status (consideration_result) - ดึงจาก OutgoingReport4
        if status:
            # Map Thai status to database values
            status_map = {
                "ทั้งหมด": "",
                "ทราบ": "รับทราบ",
                "ทราบไว้ชั้นหนึ่ง": "อนุมัติ",
                "ยุติเรื่องได้": "ยุติเรื่อง",
                "เห็นชอบ": "เพิ่มเติม",
                "อยู่ระหว่างดำเนินการ": "ดำเนินการ",
            }
            db_status = status_map.get(status, status)
            if db_status:  # ถ้าไม่ใช่ "ทั้งหมด"
                q = q.filter(OutgoingReport4.consideration_result.ilike(f"%{db_status}%"))

        # Filter by responsible officer (จาก Complaint.assigned_officer)
        if responsible_officer:
            q = q.filter(
                func.concat(AssignedOfficer.first_name, ' ', AssignedOfficer.last_name).ilike(f"%{responsible_officer}%")
            )

        # Filter by claimant name (ค้นหาจาก Complaint.subject)
        if claimant_name:
            q = q.filter(
                Complaint.subject.ilike(f"%{claimant_name}%")
            )

        q = q.order_by(OutgoingReport.created_at.desc())

        total = q.count()
        logger.info(f"[AGENCY_COMPLAINT_REPORT] Total records: {total}")
        rows = q.offset(skip).limit(limit).all()
        logger.info(f"[AGENCY_COMPLAINT_REPORT] Fetched {len(rows)} rows")

        items = []
        for r in rows:
            outgoing = r  # Query หลักจาก OutgoingReport (เฉพาะเรื่องที่ส่งหนังสือไปหน่วยงาน)

            # ดึงข้อมูลจาก relation
            complaint = None  # Complaint - เรื่องร้องเรียน
            dept = None  # Department - หน่วยงานที่ส่งไป
            assigned_officer = None  # User - เจ้าหน้าที่ผู้รับผิดชอบเรื่อง
            signature_user = None  # User - คนลงนาม
            or4 = None  # OutgoingReport4 - สถานะเรื่อง

            # พยายามดึงข้อมูลเพิ่มเติม
            if hasattr(r, 'Complaint'):
                complaint = r.Complaint
            if hasattr(r, 'Department'):
                dept = r.Department
            # User relations เรียงตามลำดับการ join (ลำดับสุดท้ายคือ signature_user)
            user_relations = getattr(r, 'User', [])
            if user_relations:
                if len(user_relations) >= 2:
                    assigned_officer = user_relations[0]  # AssignedOfficer
                    signature_user = user_relations[1]  # SignatureUser
                elif len(user_relations) == 1:
                    # ตรวจสอบว่าเป็น assigned_officer หรือ signature_user
                    u = user_relations[0]
                    if complaint and complaint.assigned_officer_id == u.id:
                        assigned_officer = u
                    else:
                        signature_user = u
            if hasattr(r, 'OutgoingReport4'):
                or4 = r.OutgoingReport4

            # คำนวณระยะเวลาดำเนินการ (จากวันที่สร้าง OutgoingReport)
            working_days = 0
            if outgoing.created_at:
                delta = datetime.now() - outgoing.created_at
                working_days = delta.days

            # แปลง consideration_result เป็น status label ไทย (ดึงจาก OutgoingReport4)
            consideration_result = or4.consideration_result if or4 else None
            status_text = consideration_result or "อยู่ระหว่างดำเนินการ"
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

            # Format date to Thai format (ลงวันที่ = วันที่ร้องเรียนจาก Complaint)
            receive_date = format_thai_date(complaint.created_at) if complaint else format_thai_date(outgoing.created_at)

            # Get claimant name - ดึงจาก Complaint.complainant_data (ชื่อผู้ร้องจริงๆ) เป็นหลัก
            claimant_name_val = "-"
            if complaint:
                # เริ่มด้วยจาก complainant_data
                if complaint.complainant_data:
                    try:
                        complainant_info = json.loads(complaint.complainant_data) if isinstance(complaint.complainant_data, str) else complaint.complainant_data
                        # ลองดึงชื่อจากหลายที่เป็นไปได้
                        if complainant_info.get('name'):
                            claimant_name_val = complainant_info['name']
                        elif complainant_info.get('complainant_name'):
                            claimant_name_val = complainant_info['complainant_name']
                        elif complainant_info.get('complainantFirstName'):
                            first_name = complainant_info.get('complainantFirstName', '')
                            last_name = complainant_info.get('complainantLastName', '')
                            claimant_name_val = f"{first_name} {last_name}".strip() or "-"
                        elif complainant_info.get('firstName'):
                            first_name = complainant_info.get('firstName', '')
                            last_name = complainant_info.get('lastName', '')
                            claimant_name_val = f"{first_name} {last_name}".strip() or "-"
                    except:
                        pass
                # ถ้าไม่มใน complainant_data ใช้ subject แทน
                if claimant_name_val == "-" or claimant_name_val == "":
                    claimant_name_val = complaint.subject or "-"

            # Get agency name - ดึงจาก Department.name (หน่วยงานที่ส่งหนังสือไป) เป็นหลัก
            agency_val = dept.name if dept else (complaint.assigned_to if complaint else "-")

            # Get issue - ใช้ subject จาก Complaint
            issue_val = complaint.subject if complaint else (outgoing.subject or "-")

            # Get issue type - ดึงจาก Complaint.complaint_type_relation หรือ complaint_type
            issue_type_val = "-"
            if complaint:
                if hasattr(complaint, 'complaint_type_relation') and complaint.complaint_type_relation:
                    issue_type_val = complaint.complaint_type_relation.name or complaint.complaint_type or "-"
                elif complaint.complaint_type:
                    issue_type_val = complaint.complaint_type

            # Get responsible officer - ดึงจาก Complaint.assigned_officer (เจ้าหน้าที่ผู้รับผิดชอบเรื่อง)
            officer_val = "-"
            if assigned_officer:
                officer_val = f"{assigned_officer.first_name} {assigned_officer.last_name}"

            # Get note/remarks - แสดงเลขที่หนังสือ + วันที่ที่ส่งหน่วยงาน (จาก OutgoingReport)
            letter_number = outgoing.document_number or "-"
            letter_date = format_thai_date(outgoing.document_date) if outgoing.document_date else "-"
            note_val = f"{letter_number} {letter_date}" if letter_number != "-" and letter_date != "-" else (letter_number if letter_number != "-" else (letter_date if letter_date != "-" else "-"))

            items.append({
                "id": str(complaint.id) if complaint else str(outgoing.id),
                "claimantName": claimant_name_val or "-",
                "receiptNumber": complaint.complaint_number if complaint else (outgoing.complaint_number or "-"),
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
