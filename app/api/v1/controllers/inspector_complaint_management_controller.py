from typing import Optional, Dict, List
from datetime import datetime

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from models.outgoing_reports4 import OutgoingReport4
from models.outgoing_reports import OutgoingReport
from models.comp_complaint import Complaint
from models.outside_departments import OutsideDepartment
from models.comp_provinces import Province
from models.user import User


def get_inspector_complaint_management_report(
    db: Session,
    year: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    inspector_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 1000,
) -> Dict:
    """
    รายงานผลการจัดการเรื่องร้องเรียนของผู้ตรวจราชการกระทรวงการคลัง
    แสดงข้อมูลแยกตามผู้ตรวจราชการ พร้อมหน่วยงานภายนอก และจังหวัด
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
            Complaint,
            OutsideDepartment,
            Province,
            User,
        )
        .join(
            OutgoingReport,
            OutgoingReport4.complaint_number == OutgoingReport.complaint_number,
        )
        .outerjoin(
            Complaint,
            OutgoingReport.complaint_id == Complaint.id,
        )
        .outerjoin(
            OutsideDepartment,
            OutgoingReport4.outside_department_id == OutsideDepartment.id,
        )
        .outerjoin(
            Province,
            Complaint.incident_province_id == Province.id,
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

    # Filter by inspector
    if inspector_id:
        q = q.filter(Complaint.assigned_officer_id == inspector_id)

    q = q.order_by(OutgoingReport4.created_at.desc())

    total = q.count()
    rows = q.offset(skip).limit(limit).all()

    # Group by inspector
    inspector_data = {}

    for r in rows:
        or4, or1, complaint, outside_dept, province, user = r

        if not user:
            continue

        inspector_key = str(user.id)
        inspector_name = f"{user.first_name} {user.last_name}"

        if inspector_key not in inspector_data:
            inspector_data[inspector_key] = {
                "inspector_id": inspector_key,
                "inspector_name": inspector_name,
                "items": []
            }

        # Format date
        date_str = ""
        if or4.complaint_number:
            date_str = or4.complaint_number.split("/")[0] if "/" in (or4.complaint_number or "") else ""

        if or4.document_date:
            thai_date = or4.document_date.strftime("%d %b %y")
            # แปลงเดือนเป็นภาษาไทย (ย่อ)
            month_map = {
                "Jan": "ม.ค.", "Feb": "ก.พ.", "Mar": "มี.ค.", "Apr": "เม.ย.",
                "May": "พ.ค.", "Jun": "มิ.ย.", "Jul": "ก.ค.", "Aug": "ส.ค.",
                "Sep": "ก.ย.", "Oct": "ต.ค.", "Nov": "พ.ย.", "Dec": "ธ.ค."
            }
            for en, th in month_map.items():
                thai_date = thai_date.replace(en, th)
            date_str = f"{date_str}\n{thai_date}" if date_str else thai_date

        # Subject (เรื่อง)
        subject = complaint.subject if complaint else or4.subject or "-"

        # หน่วยงานภายนอก (Outside Departments)
        # Note: ต้องมีการ group หลายๆ outside_dept ต่อ 1 complaint
        # แต่ในที่นี้เราจะแสดงแค่ outside_dept ที่ current row
        agency_name = outside_dept.name if outside_dept else ""

        # ประเภทเรื่อง (Issue Types) - ต้องดูจาก complaint_type
        # จากหน้าบ้าน: agencyMoney, agencyNoMoney, personalMoney, personalNoMoney
        issue_type = complaint.complaint_type if complaint else ""

        # จังหวัด (Province)
        # ถ้าเป็น "กรุงเทพมหานคร" ให้ใส่ใน bkk
        # ถ้าไม่ใช่ ให้ใส่ชื่อย่อใน regional
        province_name = ""
        is_bangkok = False
        if province:
            province_name = province.name_th
            is_bangkok = "กรุงเทพ" in province_name
        elif complaint and complaint.incident_province:
            province_name = complaint.incident_province
            is_bangkok = "กรุงเทพ" in province_name

        # สถานะ (Status)
        # จาก consideration_result
        status = or4.consideration_result if or4 else ""

        # คำนวณจำนวนครั้งประสาน (coordination) - ต้องนับจาก OutgoingReport ทั้งหมดของ complaint นี้
        coordination_count = 0
        if complaint:
            coordination_count = db.query(OutgoingReport4).filter(
                OutgoingReport4.complaint_id == complaint.id
            ).count()

        # คำนวณระยะเวลาดำเนินการ
        elapsed_days = 0
        elapsed_text = ""
        if or4.created_at:
            delta = datetime.now() - or4.created_at
            elapsed_days = delta.days

            # แปลงเป็น "XดYว" (X วัน Y สัปดาห์)
            weeks = elapsed_days // 7
            days = elapsed_days % 7
            if weeks > 0:
                elapsed_text = f"{weeks}ด{days}ว"
            else:
                elapsed_text = f"{days}ว"

        # Check ว่ายุติแล้วหรือไม่
        is_terminated = status and ("ยุติ" in status or "เสร็จสิ้น" in status or "completed" in status.lower())

        inspector_data[inspector_key]["items"].append({
            "id": str(or4.id),
            "order": len(inspector_data[inspector_key]["items"]) + 1,
            "date": date_str,
            "subject": subject,
            "agency_name": agency_name,  # ชื่อหน่วยงานภายนอก
            "issue_type": issue_type,
            "province_name": province_name,
            "is_bangkok": is_bangkok,
            "coordination_count": coordination_count,
            "is_ongoing": not is_terminated,
            "is_terminated": is_terminated,
            "elapsed_text": elapsed_text if is_terminated else "",
            "status": status,
            "remark": or4.remarks or "",
        })

    # Convert to list
    result = []
    for key, data in inspector_data.items():
        result.append(data)

    return {
        "items": result,
        "total": total,
        "page": (skip // limit) + 1 if limit > 0 else 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit if limit > 0 else 1,
    }
