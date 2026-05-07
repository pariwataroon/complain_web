"""
Service กลางสำหรับดึงสถิติเรื่องร้องเรียนแยกตามหน่วยงาน
ใช้ร่วมกันระหว่าง Dashboard และ รายงานสรุปประจำปี
เพื่อให้ตัวเลขตรงกันทุกหน้า

หลักการ:
- UNION outgoing_reports(1-4) เพื่อครอบคลุมทุกประเภทรายงาน
- DISTINCT(complaint_id, department_id) กันนับซ้ำ
- ใช้ BKK timezone -> UTC ก่อน query
- นับ COUNT(DISTINCT Complaint.id) เพื่อไม่นับเรื่องซ้ำ
"""

from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, distinct, select, union_all
from sqlalchemy.orm import Session

from models.comp_complaint import Complaint, ComplaintStatus
from models.departments import Department
from models.outgoing_reports import OutgoingReport
from models.outgoing_reports2 import OutgoingReport2
from models.outgoing_reports3 import OutgoingReport3
from models.outgoing_reports4 import OutgoingReport4

try:
    from zoneinfo import ZoneInfo
except Exception:
    ZoneInfo = None


def _get_bkk_tz():
    """คืน ZoneInfo ของ Asia/Bangkok หรือ None"""
    return ZoneInfo("Asia/Bangkok") if ZoneInfo else None


def _build_union_link():
    """
    สร้าง subquery ที่ UNION outgoing_reports 1-4
    และ DISTINCT(complaint_id, department_id) เพื่อกันนับซ้ำ
    """
    r1 = select(OutgoingReport.complaint_id.label("complaint_id"),
                OutgoingReport.department_id.label("department_id"))
    r2 = select(OutgoingReport2.complaint_id.label("complaint_id"),
                OutgoingReport2.department_id.label("department_id"))
    r3 = select(OutgoingReport3.complaint_id.label("complaint_id"),
                OutgoingReport3.department_id.label("department_id"))
    r4 = select(OutgoingReport4.complaint_id.label("complaint_id"),
                OutgoingReport4.department_id.label("department_id"))

    union_q = union_all(r1, r2, r3, r4).subquery("rep_union")
    link_q = select(
        distinct(union_q.c.complaint_id).label("complaint_id"),
        union_q.c.department_id.label("department_id")
    ).subquery("link_distinct")

    return link_q


def bkk_year_to_utc_range(year: int):
    """
    แปลงปี (ค.ศ.) เป็นช่วงวันที่แบบ BKK -> UTC
    คืน (bkk_start, bkk_end, utc_start, utc_end)
    """
    tz_bkk = _get_bkk_tz()
    bkk_start = datetime(year, 1, 1, 0, 0, 0, tzinfo=tz_bkk) if tz_bkk else datetime(year, 1, 1)
    bkk_end = datetime(year, 12, 31, 23, 59, 59, 999999, tzinfo=tz_bkk) if tz_bkk else datetime(year, 12, 31, 23, 59, 59, 999999)
    utc_start = bkk_start.astimezone(timezone.utc) if bkk_start.tzinfo else bkk_start
    utc_end = bkk_end.astimezone(timezone.utc) if bkk_end.tzinfo else bkk_end
    return bkk_start, bkk_end, utc_start, utc_end


def parse_bkk_date_to_utc(date_str: Optional[str], end_of_day: bool = False):
    """
    แปลงวันที่ string (รองรับ ISO, d/m/Y, พ.ศ.) เป็น UTC datetime
    """
    if not date_str:
        return None

    s = date_str.strip()
    tz_bkk = _get_bkk_tz()

    # ลอง ISO
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            if end_of_day and dt.hour == 0 and dt.minute == 0 and dt.second == 0:
                dt = datetime(dt.year, dt.month, dt.day, 23, 59, 59, 999999)
            dt = dt.replace(tzinfo=tz_bkk)
        utc = dt.astimezone(timezone.utc)
        return utc
    except Exception:
        pass

    # ลอง d/m/Y, d-m-Y
    for fmt in ("%d/%m/%Y", "%d-%m-%Y"):
        try:
            d = datetime.strptime(s, fmt)
            year = d.year
            if year > 2400:
                year -= 543
            if end_of_day:
                d = datetime(year, d.month, d.day, 23, 59, 59, 999999, tzinfo=tz_bkk)
            else:
                d = datetime(year, d.month, d.day, 0, 0, 0, 0, tzinfo=tz_bkk)
            return d.astimezone(timezone.utc)
        except Exception:
            continue

    return None


def get_utc_range(year: Optional[int], date_from_str: Optional[str], date_to_str: Optional[str]):
    """
    คำนวณช่วง UTC จาก year หรือ date strings
    ถ้ามี date_from/date_to ให้ใช้ช่วงนั้น, ถ้าไม่มีให้ใช้ทั้งปี
    คืน (utc_start, utc_end)
    """
    if date_from_str and date_to_str:
        utc_from = parse_bkk_date_to_utc(date_from_str, end_of_day=False)
        utc_to = parse_bkk_date_to_utc(date_to_str, end_of_day=True)
        if utc_from and utc_to:
            return utc_from, utc_to

    # fallback: ใช้ปี
    tz_bkk = _get_bkk_tz()
    now_bkk = datetime.now(tz_bkk) if tz_bkk else datetime.now()
    target_year = year if year else now_bkk.year
    _, _, utc_start, utc_end = bkk_year_to_utc_range(target_year)
    return utc_start, utc_end


def get_department_complaint_stats(
    db: Session,
    utc_start: datetime,
    utc_end: datetime,
) -> List[Dict[str, Any]]:
    """
    ดึงสถิติเรื่องร้องเรียนแยกตามหน่วยงาน (service กลาง)

    - UNION outgoing_reports(1-4) -> DISTINCT(complaint_id, department_id)
    - กรองช่วงเวลาจาก Complaint.created_at
    - นับ COUNT(DISTINCT Complaint.id) ต่อ department
    - แยกสถานะ completed/ongoing จาก Complaint.status

    คืน list of dict:
    [
        {
            "id": "<department_id>" or None,
            "agency": "<department_name>" or "ไม่ระบุหน่วยงาน",
            "total": <int>,
            "closed": <int>,
            "ongoing": <int>,
        },
        ...
    ]
    """
    link_q = _build_union_link()

    completed_set = [ComplaintStatus.COMPLETED, ComplaintStatus.REVIEWED]

    # Query นับ total, closed, ongoing ต่อ department
    rows = (
        db.query(
            link_q.c.department_id.label("dept_id"),
            Department.name.label("dept_name"),
            func.count(distinct(Complaint.id)).label("total"),
            func.sum(
                func.iif(Complaint.status.in_(completed_set), 1, 0)
            ).label("closed"),
            func.sum(
                func.iif(Complaint.status.in_(completed_set), 0, 1)
            ).label("ongoing"),
        )
        .join(Complaint, Complaint.id == link_q.c.complaint_id)
        .outerjoin(Department, Department.id == link_q.c.department_id)
        .filter(Complaint.created_at.between(utc_start, utc_end))
        .group_by(link_q.c.department_id, Department.name)
        .order_by(Department.name.asc())
        .all()
    )

    items = []
    for r in rows:
        items.append({
            "id": str(r.dept_id) if r.dept_id else None,
            "agency": r.dept_name or "ไม่ระบุหน่วยงาน",
            "total": int(r.total or 0),
            "closed": int(r.closed or 0),
            "ongoing": int(r.ongoing or 0),
        })

    return items


def get_department_complaint_ranking(
    db: Session,
    utc_start: datetime,
    utc_end: datetime,
) -> List[Dict[str, Any]]:
    """
    ดึง ranking หน่วยงานตามจำนวนเรื่องร้องเรียน (service กลาง)

    เหมือน get_department_complaint_stats แต่คืนแค่ department_id, name, count
    เรียงจากมากไปน้อย

    ใช้สำหรับ Dashboard ranking
    """
    link_q = _build_union_link()

    rows = (
        db.query(
            link_q.c.department_id.label("dept_id"),
            Department.name.label("dept_name"),
            func.count(distinct(Complaint.id)).label("cnt"),
        )
        .join(Complaint, Complaint.id == link_q.c.complaint_id)
        .outerjoin(Department, Department.id == link_q.c.department_id)
        .filter(Complaint.created_at.between(utc_start, utc_end))
        .group_by(link_q.c.department_id, Department.name)
        .all()
    )

    result = []
    for r in rows:
        result.append({
            "department_id": r.dept_id,
            "department_name": r.dept_name or "ไม่ระบุ",
            "count": int(r.cnt or 0),
        })

    result.sort(key=lambda x: x["count"], reverse=True)
    return result
