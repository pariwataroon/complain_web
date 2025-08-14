from uuid import UUID
from sqlalchemy import func, and_, or_, literal, text, distinct
from sqlalchemy.orm import Session, joinedload, aliased
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta, timezone

import os, json
from pathlib import Path
import logging

from models.comp_complaint import Complaint, ComplaintStatus, ComplaintStatusHistory
from models.user import User
from models.role import Role
from app.api.v1.controllers.user_controller import get_user_with_roles_and_titles

# สร้าง logger
logger = logging.getLogger(__name__)

# Cache สำหรับข้อมูลผู้ใช้
_user_info_cache = {}

# เพิ่ม role ที่ถือว่าเป็นเจ้าหน้าที่ทุกประเภท
STAFF_ROLES = [
    "staff", "admin", "admin_home", "supervisor", "department"
]
EXCLUDED_ROLES = ["people"]
MAP_JSON_PATH = os.getenv("THAI_MAP_JSON_PATH", os.path.join("seed", "map.json"))

try:
    from zoneinfo import ZoneInfo  # Python 3.9+
except Exception:
    ZoneInfo = None

def _is_be_year(y_str: str) -> bool:
    try:
        return int(y_str) >= 2500
    except:
        return False

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
            staff_info = {
                "id": staff_id,
                "name": user_data.get("full_name_with_title", ""),
                "position": user_data.get("primary_position", {}).get("position_name", "") if user_data.get("primary_position") else "",
                "email": user_data.get("email", ""),
                "avatar": None
            }
        else:
            staff_info = {
                "id": staff_id,
                "name": f"เจ้าหน้าที่ {staff_id[:8]}",
                "position": "",
                "email": ""
            }
    except ValueError:
        staff_info = {
            "id": staff_id,
            "name": staff_id,
            "position": "หน่วยงานภายนอก",
            "email": ""
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

    # 1. ดึงรายชื่อเจ้าหน้าที่ทุกคน
    staff_ids = _get_staff_list(db)

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
    base_year_gregorian: int = 2025,   # ไม่ได้ใช้แล้ว แต่คง signature เดิมไว้กันกระทบ
    years_forward: int = 0             # ไม่ได้ใช้แล้ว
) -> Dict[str, Any]:
    """
    ส่งออก JSON รูปเดียวกับ map.json แต่:
      - provinceValues: มี 'เฉพาะปี พ.ศ.' เท่านั้น
      - ปีปัจจุบัน (พ.ศ.) จะคิวรี 'ค่าจริง' จาก DB โดยกำหนดกรอบเวลาเป็น BKK แล้วแปลงเป็น UTC ก่อน query
      - จังหวัด ZERO-FILL ครบเสมอ (กันกราฟพัง)
      - yearOptions: เฉพาะ พ.ศ. เท่านั้น (ถ้า seed มี จะฟิลเตอร์เอาเฉพาะ พ.ศ.; ถ้าไม่มี seed -> generate จาก key ที่ส่งออก)

    โครงสร้าง:
    {
      "hcKeyToThaiName": {...},
      "provinceValues": { "2568": [...], "2567": [...], ... },   # ไม่มีคีย์ ค.ศ.
      "yearOptions": [ {"value":"2564","label":"2564"}, ... ]     # เฉพาะ พ.ศ.
    }
    """
    # 1) โหลด seed แล้วเตรียม mapping จังหวัด
    data_seed = _load_raw_map_json(json_path)  # ฟังก์ชันนี้ของคุณรองรับไฟล์หลายก้อนแล้ว
    hckey_to_th: Dict[str, str] = data_seed.get("hcKeyToThaiName", {}) or {}
    if not hckey_to_th:
        return {"hcKeyToThaiName": {}, "provinceValues": {}, "yearOptions": []}

    all_hc_keys = sorted(list(hckey_to_th.keys()))
    th_to_hckey = _invert_thai_to_hckey(hckey_to_th)

    # 2) เวลาปัจจุบันตาม Bangkok (+07:00)
    tz_bkk = ZoneInfo("Asia/Bangkok") if ZoneInfo else None
    now_bkk = datetime.now(tz_bkk) if tz_bkk else datetime.now()
    current_year_g = now_bkk.year                # ค.ศ.
    current_year_b = current_year_g + 543        # พ.ศ. ที่ต้องแสดงผล

    # 3) คิดช่วงเวลา "ปีปัจจุบันตาม BKK" แล้ว "แปลงเป็น UTC" ก่อนคิวรี DB
    bkk_start = datetime(current_year_g, 1, 1, 0, 0, 0, tzinfo=tz_bkk) if tz_bkk else datetime(current_year_g, 1, 1, 0, 0, 0)
    bkk_end   = datetime(current_year_g, 12, 31, 23, 59, 59, 999999, tzinfo=tz_bkk) if tz_bkk else datetime(current_year_g, 12, 31, 23, 59, 59, 999999)
    utc_start = bkk_start.astimezone(timezone.utc) if bkk_start.tzinfo else bkk_start  # fallback กรณีไม่มี tz
    utc_end   = bkk_end.astimezone(timezone.utc)   if bkk_end.tzinfo   else bkk_end

    # 4) นับเรื่องจริงจาก DB (ช่วงเวลา UTC) กลุ่มตาม incident_province (ชื่อไทย)
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
        name = (th_name or "").strip()
        hckey = th_to_hckey.get(name)
        if not hckey:
            # ชื่อไม่แมตช์ mapping -> ข้าม (กันพัง); จะเพิ่ม normalizer ได้ภายหลังถ้าจำเป็น
            continue
        counts_this_year[hckey] = counts_this_year.get(hckey, 0) + int(c or 0)

    # 5) ZERO-FILL ให้ครบทุกจังหวัด สำหรับปีปัจจุบัน (พ.ศ.)
    real_series = _zero_fill_series(all_hc_keys, counts_this_year)

    # 6) รวมข้อมูล seed เฉพาะ "ปี พ.ศ." เท่านั้น + ZERO-FILL
    province_values_seed = data_seed.get("provinceValues", {}) or {}
    province_values_be: Dict[str, List[Dict[str, Any]]] = {}

    # เติมปี พ.ศ. ที่มีใน seed (ถ้ามี) โดย ZERO-FILL ให้ครบจังหวัด
    for y_str, series in province_values_seed.items():
        if not _is_be_year(y_str):
            continue  # ตัดคีย์ ค.ศ. ทิ้ง
        province_values_be[str(y_str)] = _zero_fill_series(all_hc_keys, _series_to_counts(series))

    # ใส่/ทับปีปัจจุบัน (พ.ศ.) ด้วยค่าจริงจาก DB
    province_values_be[str(current_year_b)] = real_series

    # 7) yearOptions: เอาเฉพาะ พ.ศ. เท่านั้น
    seed_year_opts = data_seed.get("yearOptions")
    if seed_year_opts and isinstance(seed_year_opts, list):
        # ฟิลเตอร์เอาเฉพาะ พ.ศ. + ทำให้ซิงก์กับคีย์ที่เรามีจริง
        be_keys = set(province_values_be.keys())
        year_options = [
            {"value": y.get("value"), "label": y.get("label")}
            for y in seed_year_opts
            if y and _is_be_year(str(y.get("value"))) and str(y.get("value")) in be_keys
        ]
        # ถ้า seed ไม่มีปีปัจจุบันใน yearOptions ให้เติมเข้าไป
        if str(current_year_b) not in {str(o["value"]) for o in year_options}:
            year_options.append({"value": str(current_year_b), "label": str(current_year_b)})
        # จัดเรียงตามค่า พ.ศ.
        year_options = sorted(year_options, key=lambda o: int(o["value"]))
    else:
        # สร้างจากคีย์ที่มีจริง
        year_options = [{"value": y, "label": y} for y in sorted(province_values_be.keys(), key=lambda s: int(s))]

    return {
        "hcKeyToThaiName": hckey_to_th,
        "provinceValues": province_values_be,  # << มีแต่คีย์ พ.ศ.
        "yearOptions": year_options           # << มีแต่ พ.ศ.
    }

def _calc_yoy_label_and_values(curr: int, prev: int) -> Dict[str, Any]:
    """
    คำนวณ % เปลี่ยนแปลง (YoY) พร้อมนโยบายการแสดงผล:
    - prev == 0:
        - curr == 0 -> 0%
        - curr > 0  -> 100++% (มากกว่า 100% และเลี่ยงหารศูนย์)
    - จำกัดการแสดงผลไม่ให้เกิน 100% หรือ น้อยกว่า -100%
      ถ้าเกิน 100% -> "100++%"
      ถ้าน้อยกว่า -100% -> "-100%"
    คืนทั้งค่า raw, ค่า capped และ label ที่พร้อมแสดง
    """
    diff = curr - prev

    if prev == 0:
        if curr == 0:
            return {
                "previous": prev,
                "current": curr,
                "diff": diff,
                "pct_change_raw": 0.0,
                "pct_change_capped": 0.0,
                "pct_change_label": "0%"
            }
        else:
            # กรณีฐานเป็นศูนย์แล้วปีนี้มีค่า > 0
            return {
                "previous": prev,
                "current": curr,
                "diff": diff,
                "pct_change_raw": None,        # เลี่ยงหารศูนย์
                "pct_change_capped": None,     # ไม่มีความหมายเชิงตัวเลขที่เที่ยงตรง
                "pct_change_label": "100++%"   # สื่อว่าโตเกิน 100%
            }

    # prev > 0 ปกติ
    pct_raw = ((curr - prev) / prev) * 100.0
    # ทำค่า capped ตามนโยบาย (ไม่เกิน 100 และไม่ต่ำกว่า -100)
    pct_capped = max(-100.0, min(100.0, pct_raw))

    # label สำหรับแสดงผล
    if pct_raw > 100.0:
        label = "100++%"
    elif pct_raw < -100.0:
        label = "-100%"
    else:
        # แสดงทศนิยม 2 ตำแหน่ง (ปรับได้)
        label = f"{pct_raw:.2f}%"

    return {
        "previous": prev,
        "current": curr,
        "diff": diff,
        "pct_change_raw": round(pct_raw, 6),
        "pct_change_capped": round(pct_capped, 6),
        "pct_change_label": label
    }

def get_complaint_summary_bkk_year(db: Session) -> Dict[str, Any]:
    """
    Summary complaint ที่อิงช่วงเวลาแบบเดียวกับ get_full_map_json_from_db:
    - ใช้ปีปัจจุบันตาม Asia/Bangkok
    - แปลงเป็น UTC ก่อนคิวรี
    นับ: total, in_progress, completed
    และเทียบ YoY กับปีก่อนหน้า พร้อม % ตามนโยบายการแสดงผล
    """
    # 1) เวลาปัจจุบันตาม Bangkok (+07:00) -> กรอบปี
    tz_bkk = ZoneInfo("Asia/Bangkok") if ZoneInfo else None
    now_bkk = datetime.now(tz_bkk) if tz_bkk else datetime.now()
    current_year_g = now_bkk.year

    # ช่วงปีปัจจุบัน
    bkk_start = datetime(current_year_g, 1, 1, 0, 0, 0, tzinfo=tz_bkk) if tz_bkk else datetime(current_year_g, 1, 1, 0, 0, 0)
    bkk_end   = datetime(current_year_g, 12, 31, 23, 59, 59, 999999, tzinfo=tz_bkk) if tz_bkk else datetime(current_year_g, 12, 31, 23, 59, 59, 999999)
    utc_start = bkk_start.astimezone(timezone.utc) if bkk_start.tzinfo else bkk_start
    utc_end   = bkk_end.astimezone(timezone.utc)   if bkk_end.tzinfo   else bkk_end

    # ช่วง "ปีก่อนหน้า"
    prev_year = current_year_g - 1
    bkk_prev_start = datetime(prev_year, 1, 1, 0, 0, 0, tzinfo=tz_bkk) if tz_bkk else datetime(prev_year, 1, 1, 0, 0, 0)
    bkk_prev_end   = datetime(prev_year, 12, 31, 23, 59, 59, 999999, tzinfo=tz_bkk) if tz_bkk else datetime(prev_year, 12, 31, 23, 59, 59, 999999)
    utc_prev_start = bkk_prev_start.astimezone(timezone.utc) if bkk_prev_start.tzinfo else bkk_prev_start
    utc_prev_end   = bkk_prev_end.astimezone(timezone.utc)   if bkk_prev_end.tzinfo   else bkk_prev_end

    # 2) กลุ่มสถานะ
    completed_set = [ComplaintStatus.COMPLETED, ComplaintStatus.REVIEWED]
    in_progress_set = [
        ComplaintStatus.SUBMITTED,
        ComplaintStatus.SENT_TO_AGENCY,
        ComplaintStatus.IN_PROCESS,
        ComplaintStatus.IN_REVIEW,
        ComplaintStatus.TRACKING,
    ]

    # 3) คิวรีนับ "ปีนี้"
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

    # 4) คิวรีนับ "ปีก่อนหน้า"
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

    # 5) คำนวณ YoY + จัดรูปแบบแสดงผล
    yoy_total      = _calc_yoy_label_and_values(int(total_cur), int(total_prev))
    yoy_inprogress = _calc_yoy_label_and_values(int(in_progress_cur), int(in_progress_prev))
    yoy_completed  = _calc_yoy_label_and_values(int(completed_cur), int(completed_prev))

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
        }
    }