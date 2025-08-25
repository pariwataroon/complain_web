from uuid import UUID
from sqlalchemy import func, and_, or_, literal, text, distinct, exists, select, union_all
from sqlalchemy.orm import Session, joinedload, aliased
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta, timezone

import os, json
from pathlib import Path
import logging

from models.comp_complaint import Complaint, ComplaintStatus, ComplaintStatusHistory
from models.comp_complaint_types import ComplaintType, ComplaintChannel
from models.user import User
from models.role import Role
from models.departments import Department
from models.outgoing_reports import OutgoingReport
from models.outgoing_reports2 import OutgoingReport2
from models.outgoing_reports3 import OutgoingReport3
from models.outgoing_reports4 import OutgoingReport4
from app.api.v1.controllers.user_controller import get_user_with_roles_and_titles

# สร้าง logger
logger = logging.getLogger(__name__)

# Cache สำหรับข้อมูลผู้ใช้
_user_info_cache = {}

# เพิ่ม role ที่ถือว่าเป็นเจ้าหน้าที่ทุกประเภท
STAFF_ROLES = [
    "staff", "admin", "admin_home", "supervisor", "department"
]
# role ที่แสดงใน staff-workload (เฉพาะผู้ปฏิบัติงาน)
WORKLOAD_STAFF_ROLES = [
    "staff", "admin"
]
EXCLUDED_ROLES = ["people"]
MAP_JSON_PATH = os.getenv("THAI_MAP_JSON_PATH", os.path.join("seed", "map.json"))

BE_START = 2567
BE_END   = 2577
CE_START = BE_START - 543  # 2024
CE_END   = BE_END   - 543  # 2034

try:
    from zoneinfo import ZoneInfo  # Python 3.9+
except Exception:
    ZoneInfo = None

def _is_be(y: int) -> bool:
    return y >= 2400  # heuristic พ.ศ.

def _is_be_year(y_str: str) -> bool:
    try:
        return int(y_str) >= 2500
    except:
        return False

def list_years_be(start_be: int = BE_START, end_be: int = BE_END) -> Dict[str, Any]:
    years = []
    for be in range(start_be, end_be + 1):
        ce = be - 543
        years.append({"value": be, "label": str(be), "be": be, "ce": ce})
    # เรียงจากมากไปน้อย
    years.sort(key=lambda x: x["value"], reverse=True)
    return {
        "years": years,
        "range": {"be_start": start_be, "be_end": end_be, "ce_start": CE_START, "ce_end": CE_END},
    }

def convert_year_pair(year: int) -> Dict[str, int]:
    """
    รับปี (พ.ศ. หรือ ค.ศ.) แล้วคืนคู่ค่า {"be": พ.ศ., "ce": ค.ศ.}
    จำกัดช่วง: พ.ศ. 2567–2577 (เทียบเท่า ค.ศ. 2024–2034)
    """
    if _is_be(year):
        be, ce = year, year - 543
    else:
        be, ce = year + 543, year

    if not (BE_START <= be <= BE_END and CE_START <= ce <= CE_END):
        raise ValueError(f"year out of allowed range: BE {BE_START}-{BE_END} / CE {CE_START}-{CE_END}")

    return {"be": be, "ce": ce}

def get_years_api(year: Optional[int] = None) -> Dict[str, Any]:
    """
    - year=None → คืน list ปี พ.ศ. 2567–2577
    - year=<BE หรือ CE> → คืนคู่ค่า {"be":..,"ce":..}
    """
    if year is None:
        return list_years_be()
    pair = convert_year_pair(int(year))
    return {"input": int(year), **pair}

def _series_to_counts(series: List[Dict[str, Any]]) -> Dict[str, int]:
    # แปลง list [{"hc-key":..,"value":..}] -> dict {hckey: value}
    out: Dict[str, int] = {}
    for item in series or []:
        k = (item.get("hc-key") or "").strip()
        if not k:
            continue
        out[k] = int(item.get("value", 0) or 0)
    return out

def _get_user_info(db: Session, staff_id: str) -> Dict:
    """
    Helper function สำหรับดึงข้อมูลผู้ใช้โดยใช้ cache
    """
    if staff_id in _user_info_cache:
        return _user_info_cache[staff_id]
    
    staff_info = {}
    try:
        staff_uuid = UUID(staff_id)
        user_data = get_user_with_roles_and_titles(db, staff_uuid)
        if user_data:
            # ดึงข้อมูล roles
            roles = []
            if user_data.get("roles"):
                roles = [
                    {
                        "role_name": role.get("role_name", ""),
                        "role_description": role.get("role_description", "")
                    }
                    for role in user_data.get("roles", [])
                ]
            
            staff_info = {
                "id": staff_id,
                "name": user_data.get("full_name_with_title", ""),
                "position": user_data.get("primary_position", {}).get("position_name", "") if user_data.get("primary_position") else "",
                "email": user_data.get("email", ""),
                "avatar": None,
                "roles": roles
            }
        else:
            staff_info = {
                "id": staff_id,
                "name": f"เจ้าหน้าที่ {staff_id[:8]}",
                "position": "",
                "email": "",
                "roles": []
            }
    except ValueError:
        staff_info = {
            "id": staff_id,
            "name": staff_id,
            "position": "หน่วยงานภายนอก",
            "email": "",
            "roles": []
        }
    
    _user_info_cache[staff_id] = staff_info
    return staff_info

def _get_staff_list(db: Session) -> List[str]:
    """
    ดึงรายชื่อเจ้าหน้าที่ทุกคนที่มี role ตาม STAFF_ROLES แม้ไม่มีงาน
    """
    from models.user_role import UserRole
    from models.role import Role

    staff_users = db.query(User.id).join(UserRole, User.id == UserRole.user_id)\
        .join(Role, UserRole.role_id == Role.id)\
        .filter(Role.name.in_(STAFF_ROLES))\
        .distinct().all()
    staff_ids = [str(u.id) for u in staff_users]

    excluded_users = db.query(User.id).join(UserRole, User.id == UserRole.user_id)\
        .join(Role, UserRole.role_id == Role.id)\
        .filter(Role.name.in_(EXCLUDED_ROLES)).distinct().all()
    excluded_ids = set(str(u.id) for u in excluded_users)

    staff_ids = [uid for uid in staff_ids if uid not in excluded_ids]
    return staff_ids

def _get_workload_staff_list(db: Session) -> List[str]:
    """
    ดึงรายชื่อเจ้าหน้าที่เฉพาะผู้ปฏิบัติงาน (admin, staff) สำหรับ staff-workload
    """
    from models.user_role import UserRole
    from models.role import Role

    staff_users = db.query(User.id).join(UserRole, User.id == UserRole.user_id)\
        .join(Role, UserRole.role_id == Role.id)\
        .filter(Role.name.in_(WORKLOAD_STAFF_ROLES))\
        .distinct().all()
    staff_ids = [str(u.id) for u in staff_users]

    excluded_users = db.query(User.id).join(UserRole, User.id == UserRole.user_id)\
        .join(Role, UserRole.role_id == Role.id)\
        .filter(Role.name.in_(EXCLUDED_ROLES)).distinct().all()
    excluded_ids = set(str(u.id) for u in excluded_users)

    staff_ids = [uid for uid in staff_ids if uid not in excluded_ids]
    return staff_ids

def get_staff_workload(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    date_from: Optional[str] = None, 
    date_to: Optional[str] = None,
    year: Optional[int] = None
):
    """
    ดึงข้อมูลภาระงานของเจ้าหน้าที่แต่ละคน แยกตามสถานะของเรื่องร้องทุกข์
    สามารถระบุช่วงเวลาหรือปีงบประมาณได้
    """
    # ถ้าเลือกปี ให้ใช้ช่วงวันที่ของปีงบประมาณนั้น
    if year:
        # ปีงบประมาณไทย: ต.ค. ปีที่แล้ว - ก.ย. ปีนี้
        start_date = datetime(year - 1, 10, 1)
        end_date = datetime(year, 9, 30, 23, 59, 59)
    else:
        try:
            if date_from:
                start_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            else:
                current_year = datetime.now().year
                start_date = datetime(current_year, 1, 1)
            if date_to:
                end_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            else:
                end_date = datetime.now()
        except ValueError:
            current_year = datetime.now().year
            start_date = datetime(current_year, 1, 1)
            end_date = datetime.now()

    # 1. ดึงรายชื่อเจ้าหน้าที่เฉพาะผู้ปฏิบัติงาน (admin, staff)
    staff_ids = _get_workload_staff_list(db)

    # 2. ดึงจำนวนเรื่องตามสถานะแยกตามเจ้าหน้าที่ (รวมคนที่ไม่มีงาน)
    status_counts = db.query(
        Complaint.assigned_to,
        Complaint.assigned_officer_id,
        Complaint.status,
        func.count(Complaint.id).label('count')
    ).filter(
        or_(
            Complaint.assigned_to.in_(staff_ids),
            Complaint.assigned_officer_id.in_([UUID(sid) for sid in staff_ids])
        ),
        Complaint.assigned_date.between(start_date, end_date)
    ).group_by(
        Complaint.assigned_to,
        Complaint.assigned_officer_id,
        Complaint.status
    ).all()

    # เตรียม dict สำหรับทุก staff_id
    status_counts_by_staff = {staff_id: {status.value: 0 for status in ComplaintStatus} for staff_id in staff_ids}
    for assigned_to, assigned_officer_id, status, count in status_counts:
        for staff_id in staff_ids:
            if (assigned_to == staff_id) or (str(assigned_officer_id) == staff_id):
                status_counts_by_staff[staff_id][status.value] += count

    # 3. ดึงข้อมูลเรื่องล่าสุด (5 เรื่อง) ของแต่ละเจ้าหน้าที่
    latest_complaints_by_staff = {}
    for staff_id in staff_ids:
        latest_complaints = db.query(Complaint).filter(
            or_(
                Complaint.assigned_to == staff_id,
                Complaint.assigned_officer_id == UUID(staff_id)
            ),
            Complaint.assigned_date.between(start_date, end_date)
        ).order_by(Complaint.updated_at.desc()).limit(5).all()
        latest_list = []
        for complaint in latest_complaints:
            latest_list.append({
                "id": str(complaint.id),
                "complaint_number": complaint.complaint_number,
                "subject": complaint.subject,
                "status": complaint.status,
                "updated_at": complaint.updated_at,
                "created_at": complaint.created_at
            })
        latest_complaints_by_staff[staff_id] = latest_list

    # 4. สรุปข้อมูลรวม
    total_count = db.query(func.count(Complaint.id)).filter(
        Complaint.created_at.between(start_date, end_date)
    ).scalar()
    status_counts_query = db.query(
        Complaint.status,
        func.count(Complaint.id).label('count')
    ).filter(
        Complaint.created_at.between(start_date, end_date)
    ).group_by(Complaint.status).all()
    summary_status_counts = {status.value: 0 for status in ComplaintStatus}
    for status, count in status_counts_query:
        summary_status_counts[status.value] = count

    # 5. สร้างข้อมูล staff_data
    staff_data = []
    for staff_id in staff_ids:
        staff_info = _get_user_info(db, staff_id)
        staff_status_counts = status_counts_by_staff.get(staff_id, {})
        total_assigned = sum(staff_status_counts.values())
        completed_count = staff_status_counts.get(ComplaintStatus.COMPLETED.value, 0)
        reviewed_count = staff_status_counts.get(ComplaintStatus.REVIEWED.value, 0)
        progress_percentage = round(((completed_count + reviewed_count) / total_assigned * 100), 2) if total_assigned > 0 else 0
        staff_data.append({
            "staff_info": staff_info,
            "workload": {
                "total_assigned": total_assigned,
                "workload_percentage": round((total_assigned / total_count * 100), 2) if total_count > 0 else 0,
                "progress_percentage": progress_percentage,
                "status_counts": staff_status_counts
            },
            "latest_complaints": latest_complaints_by_staff.get(staff_id, [])
        })

    # เรียงลำดับตามจำนวนงานที่รับผิดชอบ (มากไปน้อย)
    staff_data.sort(key=lambda x: x["workload"]["total_assigned"], reverse=True)
    staff_data = staff_data[skip:skip+limit]

    return {
        "date_range": {
            "from": start_date.isoformat(),
            "to": end_date.isoformat()
        },
        "summary": {
            "total_staff": len(staff_ids),
            "total_complaints": total_count,
            "status_counts": summary_status_counts
        },
        "staff_data": staff_data
    }

def get_staff_performance(db: Session, date_from: Optional[str] = None, date_to: Optional[str] = None):
    """
    ดึงข้อมูลประสิทธิภาพการทำงานของเจ้าหน้าที่
    แสดงจำนวนเรื่องที่จัดการสำเร็จ ระยะเวลาเฉลี่ยในการจัดการเรื่องร้องทุกข์
    """
    # แปลงวันที่
    try:
        if date_from:
            start_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        else:
            # ถ้าไม่ระบุ ใช้ 30 วันย้อนหลัง
            start_date = datetime.now() - timedelta(days=30)
            
        if date_to:
            end_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        else:
            end_date = datetime.now()
    except ValueError as e:
        logger.error(f"Invalid date format: {str(e)}")
        start_date = datetime.now() - timedelta(days=30)
        end_date = datetime.now()
    
    # 1. ดึงรายชื่อเจ้าหน้าที่ที่มีการมอบหมายงาน
    staff_assignments = db.query(distinct(Complaint.assigned_to)).filter(
        and_(
            Complaint.assigned_to.isnot(None),
            Complaint.assigned_date.between(start_date, end_date)
        )
    ).all()
    
    staff_ids = [assignment[0] for assignment in staff_assignments]
    
    # 2. สร้างผลลัพธ์
    result = {
        "date_range": {
            "from": start_date,
            "to": end_date
        },
        "summary": {
            "total_staff": len(staff_ids),
            "total_complaints_period": 0,
            "avg_resolution_days": 0
        },
        "performance_data": []
    }
    
    # 3. คำนวณสถิติโดยรวม
    total_period = db.query(func.count(Complaint.id)).filter(
        Complaint.created_at.between(start_date, end_date)
    ).scalar()
    result["summary"]["total_complaints_period"] = total_period
    
    # 4. คำนวณระยะเวลาเฉลี่ยในการจัดการเรื่อง
    avg_resolution_days = db.query(
        func.avg(
            func.datediff(
                text('day'),
                Complaint.created_at, 
                Complaint.resolved_date
            )
        )
    ).filter(
        and_(
            Complaint.status.in_([ComplaintStatus.COMPLETED.value, ComplaintStatus.REVIEWED.value]),
            Complaint.created_at.between(start_date, end_date),
            Complaint.resolved_date.isnot(None)
        )
    ).scalar()
    
    result["summary"]["avg_resolution_days"] = round(avg_resolution_days or 0, 1)
    
    # 5. ดึงข้อมูลสถานะเรื่องทั้งหมดในคราวเดียว
    status_counts_query = db.query(
        Complaint.assigned_to,
        Complaint.status,
        func.count(Complaint.id).label('count')
    ).filter(
        and_(
            Complaint.assigned_to.in_(staff_ids),
            Complaint.assigned_date.between(start_date, end_date)
        )
    ).group_by(
        Complaint.assigned_to,
        Complaint.status
    ).all()
    
    status_counts_by_staff = {}
    for staff_id in staff_ids:
        status_counts_by_staff[staff_id] = {status.value: 0 for status in ComplaintStatus}
    
    for assigned_to, status, count in status_counts_query:
        if assigned_to in status_counts_by_staff:
            status_counts_by_staff[assigned_to][status.value] = count
    
    # 6. ดึงข้อมูลเรื่องที่เสร็จสิ้นและระยะเวลาเฉลี่ย
    completed_by_staff = db.query(
        Complaint.assigned_to,
        func.count(Complaint.id).label('completed_count')
    ).filter(
        and_(
            Complaint.assigned_to.in_(staff_ids),
            Complaint.status.in_([ComplaintStatus.COMPLETED.value, ComplaintStatus.REVIEWED.value]),
            Complaint.resolved_date.between(start_date, end_date)
        )
    ).group_by(
        Complaint.assigned_to
    ).all()
    
    completed_counts = {staff_id: 0 for staff_id in staff_ids}
    for assigned_to, count in completed_by_staff:
        completed_counts[assigned_to] = count
    
    # 7. ดึงระยะเวลาเฉลี่ยในการจัดการเรื่องของแต่ละคน
    avg_resolution_days_by_staff = db.query(
        Complaint.assigned_to,
        func.avg(
            func.datediff(
                text('day'),
                Complaint.assigned_date, 
                Complaint.resolved_date
            )
        ).label('avg_days')
    ).filter(
        and_(
            Complaint.assigned_to.in_(staff_ids),
            Complaint.status.in_([ComplaintStatus.COMPLETED.value, ComplaintStatus.REVIEWED.value]),
            Complaint.resolved_date.isnot(None),
            Complaint.assigned_date.between(start_date, end_date)
        )
    ).group_by(
        Complaint.assigned_to
    ).all()
    
    resolution_days = {staff_id: 0 for staff_id in staff_ids}
    for assigned_to, avg_days in avg_resolution_days_by_staff:
        resolution_days[assigned_to] = round(avg_days or 0, 1)
    
    # 8. จำนวนเรื่องที่รับผิดชอบ
    assigned_counts = db.query(
        Complaint.assigned_to,
        func.count(Complaint.id).label('assigned_count')
    ).filter(
        and_(
            Complaint.assigned_to.in_(staff_ids),
            Complaint.assigned_date.between(start_date, end_date)
        )
    ).group_by(
        Complaint.assigned_to
    ).all()
    
    assignment_counts = {staff_id: 0 for staff_id in staff_ids}
    for assigned_to, count in assigned_counts:
        assignment_counts[assigned_to] = count
    
    # 9. สร้างข้อมูลแต่ละเจ้าหน้าที่
    for staff_id in staff_ids:
        try:
            # ข้อมูลพื้นฐาน
            staff_info = _get_user_info(db, staff_id)
            
            # ประสิทธิภาพ
            assigned_count = assignment_counts.get(staff_id, 0)
            completed_count = completed_counts.get(staff_id, 0)
            avg_resolution_days = resolution_days.get(staff_id, 0)
            
            # คำนวณประสิทธิภาพ
            efficiency = round((completed_count / assigned_count * 100), 1) if assigned_count > 0 else 0
            
            staff_data = {
                "staff_info": staff_info,
                "performance": {
                    "assigned_count": assigned_count,
                    "completed_count": completed_count,
                    "efficiency_percentage": efficiency,
                    "avg_resolution_days": avg_resolution_days,
                    "status_counts": status_counts_by_staff.get(staff_id, {})
                }
            }
            
            result["performance_data"].append(staff_data)
            
        except Exception as e:
            logger.error(f"Error processing performance for staff {staff_id}: {str(e)}")
            continue
    
    # 10. เรียงลำดับตามประสิทธิภาพ (สูงไปต่ำ)
    result["performance_data"].sort(key=lambda x: x["performance"]["efficiency_percentage"], reverse=True)
    
    return result

def _resolve_path(p: str) -> Path:
    cand = Path(p)
    if cand.is_absolute() and cand.exists():
        return cand
    cwd_cand = Path.cwd() / p
    if cwd_cand.exists():
        return cwd_cand
    here_cand = Path(__file__).resolve().parent / p
    if here_cand.exists():
        return here_cand
    return cwd_cand

def _load_raw_map_json(path: Optional[str] = None) -> Dict[str, Any]:
    file_path = _resolve_path(path or MAP_JSON_PATH)
    if not file_path.is_file():
        raise FileNotFoundError(f"ไม่พบไฟล์แผนที่: {file_path}")

    raw = file_path.read_text(encoding="utf-8").strip()

    # ลอง parse ปกติก่อน (ไฟล์ก้อนเดียว)
    try:
        obj = json.loads(raw)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass

    # โหมดหลวม: parse หลายก้อน -> merge
    dec = json.JSONDecoder()
    idx = 0
    length = len(raw)

    merged: Dict[str, Any] = {}
    merged_hc: Dict[str, str] = {}
    merged_pv: Dict[str, List[Dict[str, Any]]] = {}
    merged_year_options: List[Dict[str, str]] = []

    while idx < length:
        # ข้ามช่องว่าง
        while idx < length and raw[idx].isspace():
            idx += 1
        if idx >= length:
            break
        obj, next_idx = dec.raw_decode(raw, idx)
        idx = next_idx

        if not isinstance(obj, dict):
            continue

        # เก็บตามคีย์สำคัญที่ frontend ใช้
        if "hcKeyToThaiName" in obj and isinstance(obj["hcKeyToThaiName"], dict):
            merged_hc.update(obj["hcKeyToThaiName"])

        if "provinceValues" in obj and isinstance(obj["provinceValues"], dict):
            # รวมปี: ปีซ้ำให้ข้อมูลจากก้อนหลังทับ
            for y, arr in obj["provinceValues"].items():
                merged_pv[str(y)] = arr or []

        if "yearOptions" in obj and isinstance(obj["yearOptions"], list):
            # ถ้าก้อนหลังมี yearOptions ให้ทับทั้งชุด (ตรงตามไฟล์ seed ปัจจุบัน)
            merged_year_options = obj["yearOptions"]

        # เก็บคีย์อื่นที่อาจมี (ปัจจุบันไม่ใช้)
        for k, v in obj.items():
            if k not in ("hcKeyToThaiName", "provinceValues", "yearOptions"):
                merged[k] = v

    # ประกอบกลับ
    result = {
        "hcKeyToThaiName": merged_hc,
        "provinceValues": merged_pv
    }
    if merged_year_options:
        result["yearOptions"] = merged_year_options

    if not merged_hc and not merged_pv and not merged_year_options:
        raise json.JSONDecodeError("Invalid JSON or empty after loose-parse", raw, 0)

    return result

def _invert_thai_to_hckey(mapping: Dict[str, str]) -> Dict[str, str]:
    """
    กลับ mapping เป็น: ชื่อจังหวัดไทย -> hc-key
    ถ้าซ้ำ ให้บังคับกรุงเทพฯ เป็น th-bk (มาตรฐาน Highcharts Thailand)
    """
    rev = {}
    for hckey, thname in (mapping or {}).items():
        if thname:
            rev.setdefault(thname.strip(), hckey)
    if "กรุงเทพมหานคร" in rev:
        rev["กรุงเทพมหานคร"] = "th-bk"
    return rev

def _zero_fill_series(all_keys: List[str], counts: Dict[str, int]) -> List[Dict[str, Any]]:
    return [{"hc-key": k, "value": int(counts.get(k, 0))} for k in sorted(all_keys)]

def get_full_map_json_from_db(
    db: Session,
    json_path: Optional[str] = None,
    year: Optional[int] = None,          # ปี ค.ศ. ที่ต้องการ (ถ้า None ใช้ปีปัจจุบัน BKK)
    only_year: bool = False,             # ถ้า True จะส่งเฉพาะปีที่เลือก (ไม่รวม seed)
    base_year_gregorian: int = 2025,     # รักษา signature เดิมกันกระทบ
    years_forward: int = 0
) -> Dict[str, Any]:
    # 1) โหลด seed (รองรับไฟล์หลายก้อนและ merge ให้แล้ว)
    data_seed = _load_raw_map_json(json_path)
    hckey_to_th: Dict[str, str] = data_seed.get("hcKeyToThaiName", {}) or {}
    if not hckey_to_th:
        return {"hcKeyToThaiName": {}, "provinceValues": {}, "yearOptions": []}

    all_hc_keys = sorted(list(hckey_to_th.keys()))
    th_to_hckey = _invert_thai_to_hckey(hckey_to_th)

    # 2) คำนวณปีที่ใช้ (BKK)
    tz_bkk = ZoneInfo("Asia/Bangkok") if ZoneInfo else None
    now_bkk = datetime.now(tz_bkk) if tz_bkk else datetime.now()
    year_g = int(year) if year else now_bkk.year         # ค.ศ.
    year_be = year_g + 543                               # พ.ศ.

    # 3) ช่วงเวลา BKK -> แปลง UTC สำหรับคิวรี DB
    bkk_start = datetime(year_g, 1, 1, 0, 0, 0, tzinfo=tz_bkk) if tz_bkk else datetime(year_g, 1, 1)
    bkk_end   = datetime(year_g, 12, 31, 23, 59, 59, 999999, tzinfo=tz_bkk) if tz_bkk else datetime(year_g, 12, 31, 23, 59, 59, 999999)
    utc_start = bkk_start.astimezone(timezone.utc) if bkk_start.tzinfo else bkk_start
    utc_end   = bkk_end.astimezone(timezone.utc) if bkk_end.tzinfo else bkk_end

    # 4) ดึงค่าจริงตามจังหวัดจาก DB (ช่วงปีที่เลือก)
    rows = (
        db.query(
            Complaint.incident_province,
            func.count(Complaint.id).label("c")
        )
        .filter(Complaint.created_at.between(utc_start, utc_end))
        .group_by(Complaint.incident_province)
        .all()
    )

    counts_this_year: Dict[str, int] = {}
    for th_name, c in rows:
        if not th_name:
            continue
        name = th_name.strip()
        hckey = th_to_hckey.get(name)
        if hckey:
            counts_this_year[hckey] = counts_this_year.get(hckey, 0) + int(c or 0)

    real_series = _zero_fill_series(all_hc_keys, counts_this_year)

    # 5) ประกอบ provinceValues
    province_values_be: Dict[str, List[Dict[str, Any]]] = {}
    if not only_year:
        # รวมปีจาก seed เฉพาะ "พ.ศ." และ zero-fill ให้ครบ
        for y_str, series in (data_seed.get("provinceValues") or {}).items():
            if _is_be_year(y_str):
                province_values_be[str(y_str)] = _zero_fill_series(all_hc_keys, _series_to_counts(series))
    # ใส่/ทับปีที่เลือก (พ.ศ.) ด้วยค่าจริง
    province_values_be[str(year_be)] = real_series

    # 6) yearOptions
    if only_year:
        year_options = [{"value": str(year_be), "label": str(year_be)}]
    else:
        seed_year_opts = data_seed.get("yearOptions")
        if seed_year_opts and isinstance(seed_year_opts, list):
            be_keys = set(province_values_be.keys())
            year_options = [
                {"value": y.get("value"), "label": y.get("label")}
                for y in seed_year_opts
                if y and _is_be_year(str(y.get("value"))) and str(y.get("value")) in be_keys
            ]
            if str(year_be) not in {str(o["value"]) for o in year_options}:
                year_options.append({"value": str(year_be), "label": str(year_be)})
            year_options = sorted(year_options, key=lambda o: int(o["value"]))
        else:
            year_options = [{"value": y, "label": y} for y in sorted(province_values_be.keys(), key=lambda s: int(s))]

    return {
        "hcKeyToThaiName": hckey_to_th,
        "provinceValues": province_values_be,
        "yearOptions": year_options
    }

def _calc_yoy_label_and_values(curr: int, prev: int) -> Dict[str, Any]:
    """
    - prev == 0:
        - curr == 0 -> 0%
        - curr > 0  -> 100++%
    - จำกัดการแสดงผลไม่ให้เกิน 100% หรือ ต่ำกว่า -100%
      (label: >100 -> "100++%", < -100 -> "-100%")
    """
    diff = curr - prev

    if prev == 0:
        if curr == 0:
            return {
                "previous": prev, "current": curr, "diff": diff,
                "pct_change_raw": 0.0, "pct_change_capped": 0.0,
                "pct_change_label": "0%"
            }
        else:
            return {
                "previous": prev, "current": curr, "diff": diff,
                "pct_change_raw": None, "pct_change_capped": None,
                "pct_change_label": "100++%"
            }

    pct_raw = ((curr - prev) / prev) * 100.0
    pct_capped = max(-100.0, min(100.0, pct_raw))

    if pct_raw > 100.0:
        label = "100++%"
    elif pct_raw < -100.0:
        label = "-100%"
    else:
        label = f"{pct_raw:.2f}%"

    return {
        "previous": prev, "current": curr, "diff": diff,
        "pct_change_raw": round(pct_raw, 6),
        "pct_change_capped": round(pct_capped, 6),
        "pct_change_label": label
    }

def get_complaint_summary_bkk_year(db: Session) -> Dict[str, Any]:
    """
    Summary complaint ที่อิงช่วงเวลาแบบเดียวกับ get_full_map_json_from_db:
    - ใช้ปีปัจจุบันตาม Asia/Bangkok (BKK-year) แล้วแปลงเป็น UTC ก่อนคิวรี
    - นับ: total, in_progress, completed
    - เทียบ YoY กับปีก่อนหน้า (label ตามนโยบาย 100++%, -100%, ฯลฯ)
    - แนบกราฟ 'เดือนล่าสุด' แยกตามหน่วยงาน (department) จากการผูก outgoing_reports(1–4)
    """
    # ---------- 1) เวลาไทย -> กรอบปีปัจจุบัน ----------
    tz_bkk = ZoneInfo("Asia/Bangkok") if ZoneInfo else None
    now_bkk = datetime.now(tz_bkk) if tz_bkk else datetime.now()
    current_year_g = now_bkk.year

    bkk_start = datetime(current_year_g, 1, 1, 0, 0, 0, tzinfo=tz_bkk) if tz_bkk else datetime(current_year_g, 1, 1, 0, 0, 0)
    bkk_end   = datetime(current_year_g, 12, 31, 23, 59, 59, 999999, tzinfo=tz_bkk) if tz_bkk else datetime(current_year_g, 12, 31, 23, 59, 59, 999999)
    utc_start = bkk_start.astimezone(timezone.utc) if bkk_start.tzinfo else bkk_start
    utc_end   = bkk_end.astimezone(timezone.utc)   if bkk_end.tzinfo   else bkk_end

    # ---------- 2) กรอบ "ปีก่อนหน้า" ----------
    prev_year = current_year_g - 1
    bkk_prev_start = datetime(prev_year, 1, 1, 0, 0, 0, tzinfo=tz_bkk) if tz_bkk else datetime(prev_year, 1, 1, 0, 0, 0)
    bkk_prev_end   = datetime(prev_year, 12, 31, 23, 59, 59, 999999, tzinfo=tz_bkk) if tz_bkk else datetime(prev_year, 12, 31, 23, 59, 59, 999999)
    utc_prev_start = bkk_prev_start.astimezone(timezone.utc) if bkk_prev_start.tzinfo else bkk_prev_start
    utc_prev_end   = bkk_prev_end.astimezone(timezone.utc)   if bkk_prev_end.tzinfo   else bkk_prev_end

    # ---------- 3) กลุ่มสถานะ ----------
    completed_set = [ComplaintStatus.COMPLETED, ComplaintStatus.REVIEWED]
    in_progress_set = [
        ComplaintStatus.SUBMITTED,
        ComplaintStatus.SENT_TO_AGENCY,
        ComplaintStatus.SENT_TO_EXTERNAL,
        ComplaintStatus.IN_PROCESS,
        ComplaintStatus.IN_REVIEW,
        ComplaintStatus.TRACKING,
    ]

    # ---------- 4) คิวรีนับ "ปีนี้" ----------
    total_cur = db.query(func.count(Complaint.id))\
        .filter(Complaint.created_at.between(utc_start, utc_end))\
        .scalar() or 0

    in_progress_cur = db.query(func.count(Complaint.id))\
        .filter(
            Complaint.created_at.between(utc_start, utc_end),
            Complaint.status.in_(in_progress_set)
        ).scalar() or 0

    completed_cur = db.query(func.count(Complaint.id))\
        .filter(
            Complaint.created_at.between(utc_start, utc_end),
            Complaint.status.in_(completed_set)
        ).scalar() or 0

    # ---------- 5) คิวรีนับ "ปีก่อน" ----------
    total_prev = db.query(func.count(Complaint.id))\
        .filter(Complaint.created_at.between(utc_prev_start, utc_prev_end))\
        .scalar() or 0

    in_progress_prev = db.query(func.count(Complaint.id))\
        .filter(
            Complaint.created_at.between(utc_prev_start, utc_prev_end),
            Complaint.status.in_(in_progress_set)
        ).scalar() or 0

    completed_prev = db.query(func.count(Complaint.id))\
        .filter(
            Complaint.created_at.between(utc_prev_start, utc_prev_end),
            Complaint.status.in_(completed_set)
        ).scalar() or 0

    # ---------- 6) คำนวณ YoY ----------
    yoy_total      = _calc_yoy_label_and_values(int(total_cur), int(total_prev))
    yoy_inprogress = _calc_yoy_label_and_values(int(in_progress_cur), int(in_progress_prev))
    yoy_completed  = _calc_yoy_label_and_values(int(completed_cur), int(completed_prev))

    # ---------- 7) เดือนล่าสุด (ตามเวลาไทย) แยกตาม department ----------
    cur_month = now_bkk.month
    cur_year  = now_bkk.year

    bkk_month_start = datetime(cur_year, cur_month, 1, 0, 0, 0, tzinfo=tz_bkk) if tz_bkk else datetime(cur_year, cur_month, 1, 0, 0, 0)
    # first day of next month
    if cur_month == 12:
        nm_year, nm_month = cur_year + 1, 1
    else:
        nm_year, nm_month = cur_year, cur_month + 1
    bkk_next_month_start = datetime(nm_year, nm_month, 1, 0, 0, 0, tzinfo=tz_bkk) if tz_bkk else datetime(nm_year, nm_month, 1, 0, 0, 0)
    # end of current month (ไทย)
    bkk_month_end = bkk_next_month_start - timedelta(microseconds=1)

    utc_month_start = bkk_month_start.astimezone(timezone.utc) if bkk_month_start.tzinfo else bkk_month_start
    utc_month_end   = bkk_month_end.astimezone(timezone.utc)   if bkk_month_end.tzinfo   else bkk_month_end

    # ผูก complaint_id ↔ department_id จาก outgoing_reports(1–4) แล้ว distinct กันซ้ำ
    r1 = select(OutgoingReport.complaint_id.label("complaint_id"),
                OutgoingReport.department_id.label("department_id"))
    r2 = select(OutgoingReport2.complaint_id.label("complaint_id"),
                OutgoingReport2.department_id.label("department_id"))
    r3 = select(OutgoingReport3.complaint_id.label("complaint_id"),
                OutgoingReport3.department_id.label("department_id"))
    r4 = select(OutgoingReport4.complaint_id.label("complaint_id"),
                OutgoingReport4.department_id.label("department_id"))

    rep_union = union_all(r1, r2, r3, r4).subquery("rep_union")
    link_distinct = select(
        distinct(rep_union.c.complaint_id).label("complaint_id"),
        rep_union.c.department_id.label("department_id")
    ).subquery("link_distinct")

    month_rows = (
        db.query(
            link_distinct.c.department_id.label("dept_id"),
            Department.name.label("dept_name"),
            func.count(distinct(Complaint.id)).label("cnt")
        )
        .join(Complaint, Complaint.id == link_distinct.c.complaint_id)
        .outerjoin(Department, Department.id == link_distinct.c.department_id)
        .filter(Complaint.created_at.between(utc_month_start, utc_month_end))
        .group_by(link_distinct.c.department_id, Department.name)
        .all()
    )

    month_total = sum(int(r.cnt or 0) for r in month_rows)
    month_items = []
    for r in month_rows:
        cnt = int(r.cnt or 0)
        pct = (cnt / month_total * 100.0) if month_total else 0.0
        month_items.append({
            "id": str(r.dept_id) if r.dept_id else None,
            "name": r.dept_name or "ไม่ระบุ",
            "value": cnt,
            "percent": round(pct, 2)
        })
    month_items.sort(key=lambda x: x["value"], reverse=True)

    # ---------- 8) ส่งผลลัพธ์ ----------
    return {
        "date_range_utc": {
            "from": utc_start.isoformat(),
            "to": utc_end.isoformat()
        },
        "date_range_bangkok": {
            "from": bkk_start.isoformat(),
            "to": bkk_end.isoformat()
        },
        "summary": {
            "total": int(total_cur),
            "in_progress": int(in_progress_cur),
            "completed": int(completed_cur),
            "yoy": {
                "compare_with_year": prev_year,
                "total": yoy_total,
                "in_progress": yoy_inprogress,
                "completed": yoy_completed
            }
        },
        "latest_month_by_department": {
            "date_range_bangkok": {
                "from": bkk_month_start.isoformat(),
                "to": bkk_month_end.isoformat()
            },
            "date_range_utc": {
                "from": utc_month_start.isoformat(),
                "to": utc_month_end.isoformat()
            },
            "total": int(month_total),
            "items": month_items
        }
    }

# ---------- helper: BKK-year → UTC range ----------
def _bkk_year_to_utc_range(year: int):
    tz_bkk = ZoneInfo("Asia/Bangkok") if ZoneInfo else None
    bkk_start = datetime(year, 1, 1, 0, 0, 0, tzinfo=tz_bkk) if tz_bkk else datetime(year, 1, 1, 0, 0, 0)
    bkk_end   = datetime(year, 12, 31, 23, 59, 59, 999999, tzinfo=tz_bkk) if tz_bkk else datetime(year, 12, 31, 23, 59, 59, 999999)
    utc_start = bkk_start.astimezone(timezone.utc) if bkk_start.tzinfo else bkk_start
    utc_end   = bkk_end.astimezone(timezone.utc)   if bkk_end.tzinfo   else bkk_end
    return bkk_start, bkk_end, utc_start, utc_end


# ---------- helper: department filter by any outgoing_reports(1–4) ----------
def _filter_by_department(query, department_id):
    """
    จำกัดเรื่องร้องเรียนให้อยู่ในแผนกที่ได้รับมอบหมาย ‘ใดๆ’ ผ่านรายงานส่งออก 1–4
    ใช้ exists() เพื่อกันการนับซ้ำ (ไม่ join แบบเกิด row duplication)
    """
    if not department_id:
        return query  # ไม่กรอง

    any_report_of_dept = or_(
        exists().where(OutgoingReport.complaint_id == Complaint.id).where(OutgoingReport.department_id == department_id),
        exists().where(OutgoingReport2.complaint_id == Complaint.id).where(OutgoingReport2.department_id == department_id),
        exists().where(OutgoingReport3.complaint_id == Complaint.id).where(OutgoingReport3.department_id == department_id),
        exists().where(OutgoingReport4.complaint_id == Complaint.id).where(OutgoingReport4.department_id == department_id),
    )
    return query.filter(any_report_of_dept)


def get_donut_by_complaint_types(db: Session, year: Optional[int] = None, department_id: Optional[str] = None) -> Dict[str, Any]:
    """
    โดนัท 1: แยกตาม 'ประเภทเรื่องร้องทุกข์' (comp_complaint_types)
    - กรองปีตาม BKK-year → คิวรีด้วย UTC
    - option: department_id (แผนกที่ได้รับมอบหมายผ่าน outgoing_reports 1–4)
    """
    # ปีเป้าหมาย
    if not year:
        tz_bkk = ZoneInfo("Asia/Bangkok") if ZoneInfo else None
        now_bkk = datetime.now(tz_bkk) if tz_bkk else datetime.now()
        year = now_bkk.year

    bkk_start, bkk_end, utc_start, utc_end = _bkk_year_to_utc_range(year)

    # Base query: เงื่อนไขช่วงเวลา
    base_q = db.query(Complaint).filter(Complaint.created_at.between(utc_start, utc_end))
    # กรองตาม department จาก reports ใดๆ
    base_q = _filter_by_department(base_q, department_id)

    # รวมทั้งหมด (distinct ID กันซ้ำเผื่อมีเงื่อนไขอื่นในอนาคต)
    total = db.query(func.count(Complaint.id))\
        .filter(Complaint.created_at.between(utc_start, utc_end))
    total = _filter_by_department(total, department_id).scalar() or 0

    # นับตาม complaint_type_id (ต่อให้ไม่ join ชื่อ ก็ใช้ id ได้)
    rows = db.query(
        Complaint.complaint_type_id.label("type_id"),
        func.count(Complaint.id).label("count")
    ).filter(Complaint.created_at.between(utc_start, utc_end))\
     .group_by(Complaint.complaint_type_id)

    rows = _filter_by_department(rows, department_id).all()

    # เตรียม items
    items: List[Dict[str, Any]] = []
    for r in rows:
        # ถ้ามีโมเดล ComplaintType และ field name: เติม label จริงได้
        # name = db.query(ComplaintType.name).filter(ComplaintType.id == r.type_id).scalar() if r.type_id else "ไม่ระบุ"
        name = "ไม่ระบุ" if r.type_id is None else str(r.type_id)  # fallback ปลอดภัย
        pct = (r.count / total * 100.0) if total else 0.0
        items.append({
            "id": str(r.type_id) if r.type_id else None,
            "label": name,
            "value": int(r.count),
            "percent": round(pct, 2)
        })

    return {
        "filters": {
            "year": year,
            "department_id": department_id
        },
        "date_range_bangkok": {"from": bkk_start.isoformat(), "to": bkk_end.isoformat()},
        "date_range_utc": {"from": utc_start.isoformat(), "to": utc_end.isoformat()},
        "total": int(total),
        "items": items
    }

def get_donut_types_grouped_by_department(
    db: Session,
    year: Optional[int] = None,
    department_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    โดนัท: แยกตาม Department แล้วแตกย่อยตามประเภทเรื่อง (ComplaintType)
    - ปี: กรอบ BKK-year -> คิวรีด้วย UTC
    - ถ้าระบุ department_id -> คืนเฉพาะหน่วยงานนั้น
      ไม่ระบุ -> รวมทุกหน่วยงาน (คืนหลายก้อน)
    การผูก Department ใช้ OutgoingReport(1–4) กับ Complaint
    """
    # ปีเป้าหมาย
    if not year:
        tz_bkk = ZoneInfo("Asia/Bangkok") if ZoneInfo else None
        now_bkk = datetime.now(tz_bkk) if tz_bkk else datetime.now()
        year = now_bkk.year

    bkk_start, bkk_end, utc_start, utc_end = _bkk_year_to_utc_range(year)

    # ----- union รายงานส่งออกทั้งหมด → (complaint_id, department_id)
    r1 = select(OutgoingReport.complaint_id.label("complaint_id"),
                OutgoingReport.department_id.label("department_id"))
    r2 = select(OutgoingReport2.complaint_id.label("complaint_id"),
                OutgoingReport2.department_id.label("department_id"))
    r3 = select(OutgoingReport3.complaint_id.label("complaint_id"),
                OutgoingReport3.department_id.label("department_id"))
    r4 = select(OutgoingReport4.complaint_id.label("complaint_id"),
                OutgoingReport4.department_id.label("department_id"))

    union_q = union_all(r1, r2, r3, r4).subquery("rep_union")
    # distinct กันซ้ำ (บางเรื่องมีหลายเรคอร์ดในหลายตาราง)
    link_q = select(distinct(union_q.c.complaint_id).label("complaint_id"),
                    union_q.c.department_id.label("department_id")).subquery("link_distinct")

    # ----- นับจำนวนต่อ department x complaint_type
    q = (
        db.query(
            link_q.c.department_id.label("dept_id"),
            Department.name.label("dept_name"),
            Complaint.complaint_type_id.label("type_id"),
            ComplaintType.name.label("type_name"),
            func.count(distinct(Complaint.id)).label("cnt")
        )
        .join(Complaint, Complaint.id == link_q.c.complaint_id)
        .outerjoin(Department, Department.id == link_q.c.department_id)
        .outerjoin(ComplaintType, ComplaintType.id == Complaint.complaint_type_id)
        .filter(Complaint.created_at.between(utc_start, utc_end))
    )

    if department_id:
        q = q.filter(link_q.c.department_id == department_id)

    rows = q.group_by(
        link_q.c.department_id, Department.name,
        Complaint.complaint_type_id, ComplaintType.name
    ).all()

    # ----- รวม total ต่อ department
    total_q = (
        db.query(
            link_q.c.department_id.label("dept_id"),
            func.count(distinct(Complaint.id)).label("cnt")
        )
        .join(Complaint, Complaint.id == link_q.c.complaint_id)
        .filter(Complaint.created_at.between(utc_start, utc_end))
    )
    if department_id:
        total_q = total_q.filter(link_q.c.department_id == department_id)

    total_rows = total_q.group_by(link_q.c.department_id).all()
    total_by_dept = {str(dept_id) if dept_id else None: int(c or 0) for dept_id, c in total_rows}

    # ----- จัดรูปผลลัพธ์
    buckets: Dict[str, Dict[str, Any]] = {}
    for dept_id, dept_name, type_id, type_name, cnt in rows:
        key = str(dept_id) if dept_id else "null"
        if key not in buckets:
            buckets[key] = {
                "department": {
                    "id": str(dept_id) if dept_id else None,
                    "name": dept_name or "ไม่ระบุ"
                },
                "total": total_by_dept.get(str(dept_id) if dept_id else None, 0),
                "items": []
            }
        total = buckets[key]["total"] or 0
        pct = (cnt / total * 100.0) if total else 0.0
        buckets[key]["items"].append({
            "id": str(type_id) if type_id else None,
            "name": type_name or "ไม่ระบุ",
            "value": int(cnt or 0),
            "percent": round(pct, 2)
        })

    # เผื่อมี dept ที่ total > 0 แต่ไม่มีแถว rows (เช่น type_id = NULL อย่างเดียว)
    for k, v in list(total_by_dept.items()):
        key = k if k is not None else "null"
        if key not in buckets:
            # เติมก้อนเปล่า (จะแสดงรวม 0 รายการ)
            dept_obj = db.query(Department.name).filter(Department.id == k).scalar() if k else None
            buckets[key] = {
                "department": {
                    "id": k,
                    "name": dept_obj or "ไม่ระบุ"
                },
                "total": int(v or 0),
                "items": []
            }

    # รวมยอดทั้งระบบสำหรับ header
    grand_total = sum([b["total"] for b in buckets.values()])

    # เรียงก้อนตามจำนวนมาก → น้อย
    departments_payload = sorted(buckets.values(), key=lambda x: x["total"], reverse=True)

    return {
        "filters": {
            "year": year,
            "department_id": department_id
        },
        "date_range_bangkok": {"from": bkk_start.isoformat(), "to": bkk_end.isoformat()},
        "date_range_utc": {"from": utc_start.isoformat(), "to": utc_end.isoformat()},
        "total": int(grand_total),
        "departments": departments_payload
    }

def get_donut_by_channels(db: Session, year: Optional[int] = None) -> Dict[str, Any]:
    """
    โดนัท: แยกตาม 'ช่องทางการร้องเรียน' (ComplaintChannel) พร้อมชื่อ
    - ปี: กรอบ BKK-year -> คิวรีด้วย UTC
    """
    if not year:
        tz_bkk = ZoneInfo("Asia/Bangkok") if ZoneInfo else None
        now_bkk = datetime.now(tz_bkk) if tz_bkk else datetime.now()
        year = now_bkk.year

    bkk_start, bkk_end, utc_start, utc_end = _bkk_year_to_utc_range(year)

    total = db.query(func.count(Complaint.id))\
        .filter(Complaint.created_at.between(utc_start, utc_end))\
        .scalar() or 0

    rows = (
        db.query(
            Complaint.complaint_channel_id.label("channel_id"),
            ComplaintChannel.name.label("channel_name"),
            func.count(Complaint.id).label("cnt")
        )
        .outerjoin(ComplaintChannel, ComplaintChannel.id == Complaint.complaint_channel_id)
        .filter(Complaint.created_at.between(utc_start, utc_end))
        .group_by(Complaint.complaint_channel_id, ComplaintChannel.name)
        .all()
    )

    items: List[Dict[str, Any]] = []
    for channel_id, channel_name, cnt in rows:
        name = channel_name or "ไม่ระบุ"
        pct = (cnt / total * 100.0) if total else 0.0
        items.append({
            "id": str(channel_id) if channel_id else None,
            "name": name,
            "value": int(cnt or 0),
            "percent": round(pct, 2)
        })

    return {
        "filters": {"year": year},
        "date_range_bangkok": {"from": bkk_start.isoformat(), "to": bkk_end.isoformat()},
        "date_range_utc": {"from": utc_start.isoformat(), "to": utc_end.isoformat()},
        "total": int(total),
        "items": items
    }

def _parse_bkk_date(date_str: Optional[str], end_of_day: bool = False) -> Optional[datetime]:
    """
    รับรูปแบบวันที่ที่พบบ่อย:
      - ISO: '2025-01-31' หรือ '2025-01-31T13:20:00'
      - '31/01/2025', '31-01-2025'
      - พ.ศ.: '31/01/2568' (ลบ 543 อัตโนมัติ)
    คืนค่า datetime tz-aware (Asia/Bangkok)
    """
    if not date_str:
        return None
    s = date_str.strip()
    tz_bkk = ZoneInfo("Asia/Bangkok") if ZoneInfo else None

    # ลอง ISO ก่อน
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            # ถ้าไม่มีเวลา ใส่ต้นวัน/ท้ายวันให้เหมาะสม
            if end_of_day and dt.hour == 0 and dt.minute == 0 and dt.second == 0:
                dt = datetime(dt.year, dt.month, dt.day, 23, 59, 59, 999999)
            dt = dt.replace(tzinfo=tz_bkk)
        return dt.astimezone(tz_bkk) if tz_bkk else dt
    except Exception:
        pass

    # ลอง d/m/Y, d-m-Y
    for fmt in ("%d/%m/%Y", "%d-%m-%Y"):
        try:
            d = datetime.strptime(s, fmt)
            year = d.year
            # แปลง พ.ศ. -> ค.ศ.
            if year > 2400:
                year -= 543
            if end_of_day:
                d = datetime(year, d.month, d.day, 23, 59, 59, 999999, tzinfo=tz_bkk)
            else:
                d = datetime(year, d.month, d.day, 0, 0, 0, 0, tzinfo=tz_bkk)
            return d
        except Exception:
            continue

    # ล้มเหลว: ให้ None
    return None


def _bkk_to_utc_range(date_from_bkk: Optional[datetime], date_to_bkk: Optional[datetime]) -> Tuple[datetime, datetime, datetime, datetime]:
    """
    ถ้าไม่ส่งช่วงวันที่ ให้ fallback เป็นทั้งปีปัจจุบัน (เวลาไทย)
    คืน (bkk_from, bkk_to, utc_from, utc_to)
    """
    tz_bkk = ZoneInfo("Asia/Bangkok") if ZoneInfo else None
    now_bkk = datetime.now(tz_bkk) if tz_bkk else datetime.now()

    if not date_from_bkk or not date_to_bkk:
        bkk_from = datetime(now_bkk.year, 1, 1, 0, 0, 0, 0, tzinfo=tz_bkk)
        bkk_to   = datetime(now_bkk.year, 12, 31, 23, 59, 59, 999999, tzinfo=tz_bkk)
    else:
        bkk_from = date_from_bkk
        bkk_to   = date_to_bkk

    utc_from = bkk_from.astimezone(timezone.utc) if bkk_from.tzinfo else bkk_from
    utc_to   = bkk_to.astimezone(timezone.utc)   if bkk_to.tzinfo   else bkk_to
    return bkk_from, bkk_to, utc_from, utc_to


def get_department_ranking_by_date(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit_top: int = 5,
    limit_bottom: int = 5
) -> Dict[str, Any]:
    """
    จัดอันดับหน่วยงานที่ 'มีเรื่องมากที่สุด' และ 'น้อยที่สุด'
    - อิงเรื่องที่ถูก 'มอบหมาย' ผ่าน outgoing_reports(1–4)
    - รับช่วงวันที่ (เวลาไทย) -> แปลงเป็น UTC ก่อนคิวรี
    - กันการซ้ำด้วย distinct(complaint_id, department_id)
    """
    # 1) ทำช่วงวันที่ (BKK -> UTC)
    bkk_from = _parse_bkk_date(date_from, end_of_day=False)
    bkk_to   = _parse_bkk_date(date_to,   end_of_day=True)
    bkk_from, bkk_to, utc_from, utc_to = _bkk_to_utc_range(bkk_from, bkk_to)

    # 2) รวม mapping complaint_id ↔ department_id จาก report 1–4
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

    # 3) นับจำนวนเรื่องต่อ department (ภายในช่วงเวลา)
    rows = (
        db.query(
            link_q.c.department_id.label("dept_id"),
            Department.name.label("dept_name"),
            func.count(distinct(Complaint.id)).label("cnt")
        )
        .join(Complaint, Complaint.id == link_q.c.complaint_id)
        .outerjoin(Department, Department.id == link_q.c.department_id)
        .filter(Complaint.created_at.between(utc_from, utc_to))
        .group_by(link_q.c.department_id, Department.name)
        .all()
    )

    # 4) รวมยอดทั้งหมด + จำนวนหน่วยงานที่มีเรื่อง
    total_complaints = sum(int(r.cnt or 0) for r in rows)
    # เรียงมากสุด ↓ / น้อยสุด ↑
    top_sorted = sorted(rows, key=lambda r: (int(r.cnt or 0), r.dept_name or ""), reverse=True)
    bottom_sorted = sorted(rows, key=lambda r: (int(r.cnt or 0), r.dept_name or ""))

    # 5) ทำ payload
    def _pack(lst, take, desc=True):
        out: List[Dict[str, Any]] = []
        for idx, r in enumerate(lst[:max(0, take)], start=1):
            out.append({
                "rank": idx,
                "department": {"id": str(r.dept_id) if r.dept_id else None, "name": r.dept_name or "ไม่ระบุ"},
                "count": int(r.cnt or 0)
            })
        return out

    payload = {
        "filters": {
            "date_from_bangkok": bkk_from.isoformat(),
            "date_to_bangkok": bkk_to.isoformat(),
            "date_from_utc": utc_from.isoformat(),
            "date_to_utc": utc_to.isoformat(),
            "limit_top": int(limit_top),
            "limit_bottom": int(limit_bottom)
        },
        "totals": {
            "total_complaints": int(total_complaints),
            "departments_with_complaints": len(rows)
        },
        "top_departments": _pack(top_sorted, limit_top, desc=True),
        "bottom_departments": _pack(bottom_sorted, limit_bottom, desc=False)
    }
    return payload