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
    Helper function สำหรับดึงรายชื่อเจ้าหน้าที่โดยใช้ relationship
    """
    staff_ids = []
    
    # เฉพาะ role ที่ถือว่าเป็นเจ้าหน้าที่
    # staff_roles = ["staff", "admin", "admin_home", "supervisor", "department"]
    staff_roles = ["staff"]
    
    # Role ที่ไม่ควรนับเป็นเจ้าหน้าที่
    excluded_roles = ["people"]
    
    # ดึงรายชื่อ role ทั้งหมดในระบบ
    try:
        all_roles = db.query(distinct(Role.name)).all()
        role_names = [r[0] for r in all_roles]
        logger.info(f"Available roles in database: {role_names}")
        
        # ปรับปรุง staff_roles ให้มีเฉพาะที่มีในฐานข้อมูล
        staff_roles = [r for r in staff_roles if r in role_names]
        if not staff_roles:
            logger.warning("No matching staff roles found in database")
            return []
        
        logger.info(f"Using roles for staff: {staff_roles}")
    except Exception as e:
        logger.error(f"Could not retrieve role names: {str(e)}")
    
    # วิธี 1: ใช้ relationship และ exists()
    try:
        from models.user_role import UserRole
        from sqlalchemy import exists, select
        
        # ใช้ exists() เพื่อตรวจสอบว่ามี staff role และไม่มี excluded role
        staff_role_exists = exists().where(
            and_(
                UserRole.user_id == User.id,
                UserRole.role_id == Role.id,
                Role.name.in_(staff_roles)
            )
        )
        
        excluded_role_exists = exists().where(
            and_(
                UserRole.user_id == User.id,
                UserRole.role_id == Role.id,
                Role.name.in_(excluded_roles)
            )
        )
        
        # ดึงเฉพาะ users ที่มี staff role และไม่มี excluded role
        users = db.query(User).filter(
            staff_role_exists,
            ~excluded_role_exists
        ).all()
        
        staff_ids = [str(user.id) for user in users]
        logger.info(f"Found {len(staff_ids)} staff using exists() approach")
        
        # Log generated SQL for debugging
        query = db.query(User).filter(
            staff_role_exists,
            ~excluded_role_exists
        )
        compiled_query = query.statement.compile(dialect=db.bind.dialect, 
                                             compile_kwargs={"literal_binds": True})
        logger.debug(f"Generated SQL: {compiled_query}")
        
    except Exception as e:
        logger.error(f"Error with exists() approach: {str(e)}")
        
        # วิธี 2: ใช้ relationship ของ model โดยตรง
        try:
            from sqlalchemy import select
            from sqlalchemy.orm import selectinload
            
            # ใช้ relationship ของ model โดยตรง
            staff_users = db.query(User).options(
                selectinload(User.roles).selectinload(UserRole.role)
            ).filter(
                User.roles.any(UserRole.role.has(Role.name.in_(staff_roles))),
                ~User.roles.any(UserRole.role.has(Role.name.in_(excluded_roles)))
            ).all()
            
            staff_ids = [str(user.id) for user in staff_users]
            logger.info(f"Found {len(staff_ids)} staff using direct relationship")
            
            # Log generated SQL for debugging
            query = db.query(User).filter(
                User.roles.any(UserRole.role.has(Role.name.in_(staff_roles))),
                ~User.roles.any(UserRole.role.has(Role.name.in_(excluded_roles)))
            )
            compiled_query = query.statement.compile(dialect=db.bind.dialect, 
                                                 compile_kwargs={"literal_binds": True})
            logger.debug(f"Generated SQL: {compiled_query}")
            
        except Exception as e2:
            logger.error(f"Error with direct relationship: {str(e2)}")
    
    # หากไม่พบเจ้าหน้าที่เลย ลองดึงจากผู้ที่มีงานมอบหมาย
    if not staff_ids:
        try:
            assigned_users = db.query(distinct(Complaint.assigned_to)).filter(
                Complaint.assigned_to.isnot(None)
            ).all()
            
            staff_ids = [str(assigned[0]) for assigned in assigned_users]
            logger.info(f"Found {len(staff_ids)} staff from assigned users")
            
        except Exception as e:
            logger.error(f"Error fetching assigned users: {str(e)}")
    
    # Debug log
    logger.info(f"Final staff count: {len(staff_ids)}")
    if staff_ids:
        logger.info(f"Sample staff IDs: {staff_ids[:min(3, len(staff_ids))]}")
    else:
        logger.warning("No staff found for dashboard!")
        # สร้าง mock data เพื่อให้ dashboard ไม่ว่างเปล่า
        mock_ids = ["00000000-0000-0000-0000-000000000001"]
        logger.warning(f"Using mock staff ID: {mock_ids[0]}")
        staff_ids = mock_ids
    
    return staff_ids

def _get_status_counts_by_staff(db: Session, staff_ids: List[str]) -> Dict[str, Dict[str, int]]:
    """
    ดึงจำนวนเรื่องตามสถานะแยกตามเจ้าหน้าที่ (ทำครั้งเดียว)
    """
    results = {}
    
    # ใช้ GROUP BY เพื่อลดจำนวน queries
    status_counts = db.query(
        Complaint.assigned_to,
        Complaint.status,
        func.count(Complaint.id).label('count')
    ).filter(
        Complaint.assigned_to.in_(staff_ids)
    ).group_by(
        Complaint.assigned_to,
        Complaint.status
    ).all()
    
    # จัดเรียงผลลัพธ์เป็น dictionary
    for staff_id in staff_ids:
        results[staff_id] = {status.value: 0 for status in ComplaintStatus}
    
    for assigned_to, status, count in status_counts:
        if assigned_to in results:
            results[assigned_to][status.value] = count
    
    return results

def _calculate_summary_stats(db: Session) -> Dict:
    """
    คำนวณสถิติโดยรวมทั้งหมด
    """
    total_count = db.query(func.count(Complaint.id)).scalar()
    
    # นับจำนวน complaint แยกตามสถานะทั้งหมด
    status_counts_query = db.query(
        Complaint.status,
        func.count(Complaint.id).label('count')
    ).group_by(Complaint.status).all()
    
    status_counts = {status.value: 0 for status in ComplaintStatus}
    for status, count in status_counts_query:
        status_counts[status.value] = count
    
    return {
        "total_complaints": total_count,
        "status_counts": status_counts
    }

def get_staff_workload(db: Session, skip: int = 0, limit: int = 100):
    """
    ดึงข้อมูลภาระงานของเจ้าหน้าที่แต่ละคน แยกตามสถานะของเรื่องร้องทุกข์
    """
    # 1. ดึงรายชื่อเจ้าหน้าที่
    staff_ids = _get_staff_list(db)
    
    # 2. คำนวณสถิติโดยรวม
    summary_stats = _calculate_summary_stats(db)
    total_count = summary_stats["total_complaints"]
    
    # 3. ดึงจำนวนเรื่องตามสถานะแยกตามเจ้าหน้าที่ (ทำครั้งเดียว)
    status_counts_by_staff = _get_status_counts_by_staff(db, staff_ids)
    
    # 4. สร้างผลลัพธ์
    result = {
        "summary": {
            "total_staff": len(staff_ids),
            "total_complaints": total_count,
            "status_counts": summary_stats["status_counts"]
        },
        "staff_data": []
    }
    
    # 5. ดึงข้อมูลเรื่องร้องทุกข์ล่าสุดแยกตามเจ้าหน้าที่ (ใช้ window function)
    latest_complaints_by_staff = {}
    
    for staff_id in staff_ids:
        latest_complaints = db.query(Complaint).filter(
            Complaint.assigned_to == staff_id
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
    
    # 6. วนลูปสร้างข้อมูลเจ้าหน้าที่
    for staff_id in staff_ids:
        try:
            # ดึงข้อมูลพื้นฐานของเจ้าหน้าที่
            staff_info = _get_user_info(db, staff_id)
            
            # ดึงจำนวนเรื่องและสถานะ
            staff_status_counts = status_counts_by_staff.get(staff_id, {})
            total_assigned = sum(staff_status_counts.values())
            
            # คำนวณสัดส่วน workload
            workload_percentage = round((total_assigned / total_count * 100), 2) if total_count > 0 else 0
            
            # คำนวณความคืบหน้า
            completed_count = staff_status_counts.get(ComplaintStatus.COMPLETED.value, 0)
            reviewed_count = staff_status_counts.get(ComplaintStatus.REVIEWED.value, 0)
            progress_percentage = round(((completed_count + reviewed_count) / total_assigned * 100), 2) if total_assigned > 0 else 0
            
            # สร้างข้อมูลสรุปของเจ้าหน้าที่
            staff_data = {
                "staff_info": staff_info,
                "workload": {
                    "total_assigned": total_assigned,
                    "workload_percentage": workload_percentage,
                    "progress_percentage": progress_percentage,
                    "status_counts": staff_status_counts
                },
                "latest_complaints": latest_complaints_by_staff.get(staff_id, [])
            }
            
            result["staff_data"].append(staff_data)
            
        except Exception as e:
            logger.error(f"Error processing staff {staff_id}: {str(e)}")
            continue
    
    # เรียงลำดับตามจำนวนงานที่รับผิดชอบ (มากไปน้อย)
    result["staff_data"].sort(key=lambda x: x["workload"]["total_assigned"], reverse=True)
    
    # จำกัดจำนวนเจ้าหน้าที่ตาม pagination
    result["staff_data"] = result["staff_data"][skip:skip+limit]
    
    return result

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