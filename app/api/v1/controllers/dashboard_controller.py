from uuid import UUID
from sqlalchemy import func, and_, or_, literal, text, distinct
from sqlalchemy.orm import Session, joinedload, aliased
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
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