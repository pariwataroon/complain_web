"""
Controller สำหรับรายงานการรับงานของเจ้าหน้าที่
Staff Notification Report Controller
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import Optional, List, Dict
from datetime import datetime
import json
import logging

from models.comp_complaint import Complaint, ComplaintStatusHistory
from models.user import User
from app.api.v1.schemas.staff_notification_report import (
    StaffNotificationItem,
    StaffNotificationReportResponse
)
from app.api.v1.controllers.time_setting_controller import get_time_setting_by_key

logger = logging.getLogger(__name__)


def _get_complainant_name(complaint: Complaint) -> str:
    """ดึงชื่อผู้ร้องเรียนจาก JSON"""
    try:
        if complaint.complainant_data:
            if isinstance(complaint.complainant_data, str):
                data = json.loads(complaint.complainant_data)
            else:
                data = complaint.complainant_data

            # ลองหาชื่อจาก field ต่างๆ
            name = (
                data.get('full_name') or
                data.get('name') or
                f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or
                data.get('company_name') or
                data.get('organization_name')
            )
            return name if name else "ไม่ระบุชื่อ"
    except Exception as e:
        logger.debug(f"Error parsing complainant_data: {e}")

    return "ไม่ระบุชื่อ"


def _get_officer_name(user: User) -> str:
    """ดึงชื่อเจ้าหน้าที่พร้อม prefix"""
    if not user:
        return "ไม่ระบุ"

    try:
        prefix = ""
        if hasattr(user, 'title') and user.title and hasattr(user.title, 'short_name'):
            prefix = user.title.short_name
        elif hasattr(user, 'prefix_other') and user.prefix_other:
            prefix = user.prefix_other

        first_name = getattr(user, 'first_name', '') or ''
        last_name = getattr(user, 'last_name', '') or ''

        full_name = f"{prefix} {first_name} {last_name}".strip()
        return full_name if full_name else "ไม่ระบุ"
    except Exception as e:
        logger.debug(f"Error getting officer name: {e}")
        return "ไม่ระบุ"


def _format_thai_date(dt: Optional[datetime]) -> Optional[str]:
    """แปลงวันที่เป็นรูปแบบภาษาไทย เช่น 01 ต.ค. 2568"""
    if not dt:
        return None

    thai_months = {
        1: "ม.ค.", 2: "ก.พ.", 3: "มี.ค.", 4: "เม.ย.", 5: "พ.ค.", 6: "มิ.ย.",
        7: "ก.ค.", 8: "ส.ค.", 9: "ก.ย.", 10: "ต.ค.", 11: "พ.ย.", 12: "ธ.ค."
    }

    try:
        day = dt.day
        month = thai_months.get(dt.month, str(dt.month))
        year = dt.year + 543  # แปลงเป็น พ.ศ.
        return f"{day:02d} {month} {year}"
    except Exception as e:
        logger.debug(f"Error formatting date: {e}")
        return None


def _get_issue_type_label(complaint: Complaint) -> str:
    """กำหนดประเภทเรื่องตามสถานะ"""
    status_labels = {
        "submitted": "เรื่องร้องเรียนใหม่",
        "sent_to_agency": "มอบหมายเจ้าหน้าที่",
        "sent_to_external": "ส่งหน่วยงานที่เกี่ยวข้อง",
        "in_process": "อยู่ระหว่างดำเนินการ",
        "in_review": "อยู่ระหว่างการพิจารณา",
        "tracking": "ติดตามผลการพิจารณา",
        "reviewed": "แจ้งผลการพิจารณา",
        "completed": "เสร็จสิ้น",
        "cancelled": "ยกเลิก"
    }

    status = getattr(complaint, 'status', None)
    if status:
        if hasattr(status, 'value'):
            return status_labels.get(status.value, str(status.value))
        return status_labels.get(str(status), str(status))

    return "ไม่ระบุ"


def _get_time_settings_dict(db: Session) -> dict:
    """ดึงค่า time settings ทั้งหมด เป็น dict {key: value_in_days}"""
    keys = [
        "new_complaint_days",
        "complaint_response_days",
        "department_response_days",
        "review_response_days",
    ]
    settings = {}
    defaults = {
        "new_complaint_days": 3,
        "complaint_response_days": 15,
        "department_response_days": 30,
        "review_response_days": 7,
    }
    for key in keys:
        ts = get_time_setting_by_key(db, key)
        settings[key] = ts.value if ts and ts.is_active else defaults[key]
    return settings


def _calculate_time_status(reference_date: datetime, time_limit_days: int) -> dict:
    """คำนวณสถานะเวลาจาก reference_date เทียบกับปัจจุบัน"""
    if not reference_date or not time_limit_days:
        return {"time_status": None, "days_remaining": None}

    try:
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("Asia/Bangkok"))
    except Exception:
        now = datetime.now()

    ref_aware = reference_date.replace(tzinfo=None) if reference_date.tzinfo else reference_date
    now_naive = now.replace(tzinfo=None) if now.tzinfo else now

    elapsed = (now_naive - ref_aware).days
    days_remaining = time_limit_days - elapsed

    if days_remaining <= 0:
        time_status = "overdue"
    elif days_remaining <= 2:
        time_status = "warning"
    else:
        time_status = "normal"

    return {"time_status": time_status, "days_remaining": days_remaining}


def _determine_time_params(
    complaint: Complaint,
    status_str: str,
    time_settings: dict,
    status_change_dates: Dict
) -> dict:
    """กำหนด reference_date, time_limit, และ label สำหรับ complaint แต่ละรายการ"""
    confirm_status = complaint.confirm_assigned_status

    # รอเจ้าหน้าที่ยืนยัน
    if confirm_status is None:
        ref_date = complaint.assigned_date or complaint.created_at
        return {
            "reference_date": ref_date,
            "time_limit_days": time_settings["new_complaint_days"],
            "time_limit_label": "ระยะเวลายืนยันรับงาน",
        }

    # เจ้าหน้าที่ปฏิเสธ
    if confirm_status is False:
        return {
            "reference_date": None,
            "time_limit_days": None,
            "time_limit_label": None,
        }

    # ยืนยันแล้ว + กำลังดำเนินการ
    processing_statuses = {"sent_to_agency", "in_process"}
    if status_str in processing_statuses:
        return {
            "reference_date": complaint.confirm_assigned_date or complaint.assigned_date,
            "time_limit_days": time_settings["department_response_days"],
            "time_limit_label": "ระยะเวลาดำเนินการ",
        }

    # อยู่ระหว่างพิจารณา/ติดตามผล
    review_statuses = {"in_review", "tracking"}
    if status_str in review_statuses:
        key = (str(complaint.id), status_str)
        ref_date = status_change_dates.get(
            key,
            complaint.confirm_assigned_date or complaint.assigned_date
        )
        return {
            "reference_date": ref_date,
            "time_limit_days": time_settings["review_response_days"],
            "time_limit_label": "ระยะเวลาพิจารณา",
        }

    # เสร็จสิ้น/ยกเลิก/แจ้งผลแล้ว
    terminal_statuses = {"completed", "reviewed", "cancelled"}
    if status_str in terminal_statuses:
        return {
            "reference_date": None,
            "time_limit_days": None,
            "time_limit_label": None,
        }

    # fallback (submitted, sent_to_external)
    return {
        "reference_date": complaint.created_at,
        "time_limit_days": time_settings["new_complaint_days"],
        "time_limit_label": "ระยะเวลารับเรื่อง",
    }


def get_staff_notification_report(
    db: Session,
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    confirm_status: Optional[bool] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    show_alerts_only: bool = False,
    skip: int = 0,
    limit: int = 100
) -> StaffNotificationReportResponse:
    """
    ดึงรายงานการรับงานของเจ้าหน้าที่

    Args:
        db: Database session
        user_id: กรองตาม user_id เฉพาะ (ถ้าไม่ระบุจะดึงทุกคน)
        status: กรองตามสถานะงาน (submitted, sent_to_agency, etc.)
        confirm_status: กรองตามสถานะการยืนยัน (True=ยืนยัน, False=ปฏิเสธ, None=รอ)
        date_from: วันที่เริ่มต้น
        date_to: วันที่สิ้นสุด
        search: ค้นหาเลขที่เรื่อง หรือ subject
        show_alerts_only: แสดงเฉพาะรายการที่ต้องเตือน (warning/overdue)
        skip: เริ่มต้นที่ record
        limit: จำนวน records

    Returns:
        StaffNotificationReportResponse
    """
    try:
        # ดึง time settings ทั้งหมด
        time_settings = _get_time_settings_dict(db)

        # Query หลัก: เรื่องร้องเรียนที่มีการมอบหมายเจ้าหน้าที่
        # Eager load relationship to avoid N+1 queries
        query = db.query(Complaint).options(
            joinedload(Complaint.assigned_officer)
        ).filter(
            Complaint.assigned_officer_id.isnot(None)  # ต้องมีการมอบหมายเจ้าหน้าที่
        )

        # Filter: user_id
        if user_id:
            query = query.filter(Complaint.assigned_officer_id == user_id)

        # Filter: status
        if status:
            query = query.filter(Complaint.status == status)

        # Filter: confirm_status
        if confirm_status is not None:
            if confirm_status is True:
                query = query.filter(Complaint.confirm_assigned_status == True)
            elif confirm_status is False:
                query = query.filter(Complaint.confirm_assigned_status == False)
        else:
            # ถ้าไม่ระบุ อาจต้องการเฉพาะที่ยังไม่ได้ยืนยัน
            # แต่ปล่อยไว้ query ทั้งหมดก่อน
            pass

        # Filter: date range (ใช้ confirm_assigned_date หรือ assigned_date)
        if date_from:
            query = query.filter(
                or_(
                    Complaint.confirm_assigned_date >= date_from,
                    and_(
                        Complaint.confirm_assigned_date.is_(None),
                        Complaint.assigned_date >= date_from
                    )
                )
            )

        if date_to:
            query = query.filter(
                or_(
                    Complaint.confirm_assigned_date <= date_to,
                    and_(
                        Complaint.confirm_assigned_date.is_(None),
                        Complaint.assigned_date <= date_to
                    )
                )
            )

        # Filter: search
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Complaint.complaint_number.like(search_pattern),
                    Complaint.subject.like(search_pattern),
                    Complaint.reference_number.like(search_pattern)
                )
            )

        # เรียงตามวันที่ใหม่สุดก่อน
        query = query.order_by(
            func.coalesce(Complaint.confirm_assigned_date, Complaint.assigned_date).desc()
        )

        # ดึงข้อมูลทั้งหมดเพื่อ group by complaint_number
        all_complaints = query.all()

        # Group by complaint_number และนับจำนวนครั้ง
        from collections import defaultdict
        complaint_groups = defaultdict(list)

        for complaint in all_complaints:
            if complaint.complaint_number:
                complaint_groups[complaint.complaint_number].append(complaint)

        # แปลงเป็น list และเรียงตามวันที่
        grouped_items = []
        for complaint_number, complaints_list in complaint_groups.items():
            # เอา complaint ล่าสุด (หรือแรก) เป็นตัวแทน
            representative = complaints_list[0]
            count_times = len(complaints_list)  # นับจำนวนครั้งที่ซ้ำ

            grouped_items.append({
                'complaint': representative,
                'count_times': count_times,
                'receive_date': representative.confirm_assigned_date or representative.assigned_date
            })

        # เรียงตามวันที่ใหม่สุดก่อน
        grouped_items.sort(key=lambda x: x['receive_date'] if x['receive_date'] else datetime.min, reverse=True)

        # นับสถานะทั้งหมด (จาก grouped items)
        stats = {"confirmed": 0, "pending": 0, "rejected": 0, "overdue": 0, "warning": 0, "normal": 0}

        # Batch query status change dates สำหรับ in_review/tracking
        review_tracking_ids = [
            str(item['complaint'].id) for item in grouped_items
            if str(item['complaint'].status.value if hasattr(item['complaint'].status, 'value') else item['complaint'].status)
            in {"in_review", "tracking"}
        ]
        status_change_dates = {}
        if review_tracking_ids:
            history_rows = db.query(
                ComplaintStatusHistory.complaint_id,
                ComplaintStatusHistory.status,
                ComplaintStatusHistory.changed_at
            ).filter(
                ComplaintStatusHistory.complaint_id.in_(review_tracking_ids)
            ).all()
            for row in history_rows:
                key = (str(row.complaint_id), str(row.status.value if hasattr(row.status, 'value') else row.status))
                if key not in status_change_dates or row.changed_at > status_change_dates[key]:
                    status_change_dates[key] = row.changed_at

        for item in grouped_items:
            complaint = item['complaint']
            if complaint.confirm_assigned_status is True:
                stats["confirmed"] += 1
            elif complaint.confirm_assigned_status is False:
                stats["rejected"] += 1
            else:
                stats["pending"] += 1

            status_str = str(complaint.status.value) if hasattr(complaint.status, 'value') else str(complaint.status)
            time_params = _determine_time_params(complaint, status_str, time_settings, status_change_dates)
            if time_params["reference_date"] and time_params["time_limit_days"]:
                ts = _calculate_time_status(time_params["reference_date"], time_params["time_limit_days"])
                item['time_result'] = ts
                if ts["time_status"] == "overdue":
                    stats["overdue"] += 1
                elif ts["time_status"] == "warning":
                    stats["warning"] += 1
                else:
                    stats["normal"] += 1
            else:
                item['time_result'] = {"time_status": None, "days_remaining": None}

        # กรองเฉพาะรายการที่ต้องเตือน (warning/overdue)
        if show_alerts_only:
            grouped_items = [
                item for item in grouped_items
                if item.get('time_result', {}).get('time_status') in ("warning", "overdue")
            ]

        # Pagination หลังจาก group
        total = len(grouped_items)
        paginated_items = grouped_items[skip:skip + limit]

        # แปลงเป็น response items
        items: List[StaffNotificationItem] = []

        for item_data in paginated_items:
            complaint = item_data['complaint']
            count_times = item_data['count_times']

            # หาชื่อผู้ร้องเรียน
            claimant_name = _get_complainant_name(complaint)

            # หาชื่อเจ้าหน้าที่
            officer_name = "ไม่ระบุ"
            if complaint.assigned_officer:
                officer_name = _get_officer_name(complaint.assigned_officer)

            # วันที่ที่เจ้าหน้าที่รับงาน (confirm_assigned_date หรือ assigned_date)
            receive_date = complaint.confirm_assigned_date or complaint.assigned_date
            receive_date_thai = _format_thai_date(receive_date)

            # ประเภทเรื่อง
            issue_type = _get_issue_type_label(complaint)

            # คำนวณสถานะเวลา
            status_str = str(complaint.status.value) if hasattr(complaint.status, 'value') else str(complaint.status)
            time_params = _determine_time_params(complaint, status_str, time_settings, status_change_dates)
            time_result = item_data.get('time_result', {"time_status": None, "days_remaining": None})
            if time_result.get("time_status") is None and time_params["reference_date"] and time_params["time_limit_days"]:
                time_result = _calculate_time_status(time_params["reference_date"], time_params["time_limit_days"])

            # สร้าง item
            item = StaffNotificationItem(
                id=str(complaint.id),
                complaint_number=complaint.complaint_number,
                claimant_name=claimant_name,
                issue=complaint.subject or "ไม่ระบุเรื่อง",
                responsible_officer=officer_name,
                receipt_number=getattr(complaint, 'reference_number', None),
                officer_receive_date=receive_date_thai,
                officer_receive_date_iso=receive_date,
                issue_type=issue_type,
                count_times=count_times,
                status=status_str,
                assigned_date=complaint.assigned_date,
                confirm_assigned_status=complaint.confirm_assigned_status,
                created_at=complaint.created_at,
                time_status=time_result["time_status"],
                days_remaining=time_result["days_remaining"],
                time_limit_days=time_params["time_limit_days"],
                time_limit_label=time_params["time_limit_label"],
            )
            items.append(item)

        # สร้าง response
        response = StaffNotificationReportResponse(
            total=total,
            items=items,
            total_confirmed=stats["confirmed"],
            total_pending=stats["pending"],
            total_rejected=stats["rejected"],
            total_overdue=stats["overdue"],
            total_warning=stats["warning"],
            total_normal=stats["normal"],
            time_settings=time_settings,
        )

        return response

    except Exception as e:
        logger.error(f"Error in get_staff_notification_report: {e}", exc_info=True)
        raise
