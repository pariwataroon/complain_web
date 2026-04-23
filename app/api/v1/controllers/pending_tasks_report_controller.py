from datetime import datetime, timezone
from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, or_, case, and_

from models.comp_complaint import Complaint, ComplaintStatus
from models.outgoing_reports import OutgoingReport
from models.outgoing_reports2 import OutgoingReport2
from models.outgoing_reports3 import OutgoingReport3
from models.outgoing_reports4 import OutgoingReport4
from models.outgoing_reports5 import OutgoingReport5
from models.outgoing_reports6 import OutgoingReport6
from models.outside_departments import OutsideDepartment
from models.user import User

PENDING_STATUSES = {
    ComplaintStatus.SUBMITTED,
    ComplaintStatus.SENT_TO_AGENCY,
    ComplaintStatus.SENT_TO_EXTERNAL,
    ComplaintStatus.IN_PROCESS,
    ComplaintStatus.IN_REVIEW,
    ComplaintStatus.TRACKING,
    ComplaintStatus.REVIEWED,
    ComplaintStatus.COMPLETED,  # เพิ่มสถานะเสร็จสิ้น เพื่อให้แสดงครบทุกเรื่อง
}

def get_pending_tasks_report(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    department: Optional[str] = None,
    officer_id: Optional[str] = None,  # เปลี่ยนจาก UUID เป็น str
    search: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    filing_type: Optional[str] = None,  # เพิ่ม parameter filing_type
):
    """
    รายการงานค้าง (pending-tasks)
    - department_name = หน่วยงานที่เกี่ยวข้อง (ภายใน) -> มาจาก OutgoingReport/2/4.department_id (ล่าสุด)
    - outside_department_name = หน่วยงานที่เกี่ยวข้อง (ภายนอก) ที่ได้รับมอบหมาย -> มาจาก OutgoingReport2/4.outside_department_id (ล่าสุด)
    - days_in_progress = นับจากจุดเริ่มของ 'สถานะปัจจุบัน' (ComplaintStatusHistory.changed_at) ถ้าไม่มี ใช้ assigned_date -> created_at
    """
    # imports ภายในฟังก์ชันเพื่อลดวงจร import
    from models.comp_complaint import Complaint, ComplaintStatusHistory
    from models.user import User
    from models.departments import Department
    from models.outside_departments import OutsideDepartment
    from models.outgoing_reports import OutgoingReport
    from models.outgoing_reports2 import OutgoingReport2
    from models.outgoing_reports4 import OutgoingReport4

    # ใช้ PENDING_STATUSES จากด้านบน (รวม SUBMITTED, SENT_TO_AGENCY, SENT_TO_EXTERNAL, IN_PROCESS, IN_REVIEW, TRACKING, REVIEWED)
    # ไม่รวม COMPLETED (เสร็จสิ้น), CANCELLED (ยกเลิก), SUBMITTED (ส่งคำร้อง) ถ้าต้องการกรองเฉพาะที่กำลังดำเนินการ

    # ---------- Subqueries: department_name (internal) ----------
    # รวมชื่อหน่วยงานภายในจาก OR/OR2/OR4 แล้วเลือกอันที่ created_at ใหม่สุด
    or1_q = (
        db.query(Department.name.label("name"), OutgoingReport.created_at.label("created_at"))
        .join(Department, Department.id == OutgoingReport.department_id)
        .filter(
            OutgoingReport.complaint_id == Complaint.id,
            OutgoingReport.is_active == True,
            # OutgoingReport.department_id.isnot(None),
        )
    )
    or2_q = (
        db.query(Department.name.label("name"), OutgoingReport2.created_at.label("created_at"))
        .join(Department, Department.id == OutgoingReport2.department_id)
        .filter(
            OutgoingReport2.complaint_id == Complaint.id,
            OutgoingReport2.is_active == True,
            # OutgoingReport2.department_id.isnot(None),
        )
    )
    or4_q = (
        db.query(Department.name.label("name"), OutgoingReport4.created_at.label("created_at"))
        .join(Department, Department.id == OutgoingReport4.department_id)
        .filter(
            OutgoingReport4.complaint_id == Complaint.id,
            OutgoingReport4.is_active == True,
            # OutgoingReport4.department_id.isnot(None),
        )
    )
    internal_union = or1_q.union_all(or2_q, or4_q).subquery()
    latest_internal_dept_name = (
        db.query(internal_union.c.name)
        .order_by(internal_union.c.created_at.desc())
        .limit(1)
        .correlate(Complaint)
        .scalar_subquery()
    )

    # ---------- Subqueries: outside_department_name (external) ----------
    out2_q = (
        db.query(OutsideDepartment.name.label("name"), OutgoingReport2.created_at.label("created_at"))
        .join(OutsideDepartment, OutsideDepartment.id == OutgoingReport2.outside_department_id)
        .filter(
            OutgoingReport2.complaint_id == Complaint.id,
            OutgoingReport2.is_active == True,
            # OutgoingReport2.outside_department_id.isnot(None),
        )
    )
    out4_q = (
        db.query(OutsideDepartment.name.label("name"), OutgoingReport4.created_at.label("created_at"))
        .join(OutsideDepartment, OutsideDepartment.id == OutgoingReport4.outside_department_id)
        .filter(
            OutgoingReport4.complaint_id == Complaint.id,
            OutgoingReport4.is_active == True,
            # OutgoingReport4.outside_department_id.isnot(None),
        )
    )
    outside_union = out2_q.union_all(out4_q).subquery()
    latest_outside_dept_name = (
        db.query(outside_union.c.name)
        .order_by(outside_union.c.created_at.desc())
        .limit(1)
        .correlate(Complaint)
        .scalar_subquery()
    )

    # ---------- Subquery: เริ่มนับเวลาจากประวัติของสถานะปัจจุบัน ----------
    latest_phase_start = (
        db.query(ComplaintStatusHistory.changed_at)
        .filter(
            ComplaintStatusHistory.complaint_id == Complaint.id,
            ComplaintStatusHistory.status == Complaint.status,  # จุดเริ่มของเฟสล่าสุด = ประวัติของสถานะปัจจุบัน
        )
        .order_by(ComplaintStatusHistory.changed_at.desc())
        .limit(1)
        .correlate(Complaint)
        .scalar_subquery()
    )
    # ใช้ phase_start -> assigned_date -> created_at
    start_ref = func.coalesce(latest_phase_start, Complaint.assigned_date, Complaint.created_at)

    # ---------- Alias สำหรับ parent complaint ----------
    ParentComplaint = aliased(Complaint)

    # ---------- สร้าง ordered_subq ----------
    assigned_nulls_last = case((Complaint.assigned_date.is_(None), 1), else_=0).asc()
    ordered_subq = (
        db.query(
            Complaint.id.label("id"),
            Complaint.complaint_number.label("receive_reference_number"),
            func.coalesce(Complaint.reference_number4, Complaint.reference_number).label("reference_number"),
            Complaint.subject.label("subject"),
            Complaint.assigned_date.label("assigned_date"),
            Complaint.director_submission_date.label("director_submission_date"),
            # department_name: เอาชื่อหน่วยงานภายในล่าสุด ถ้าไม่มีก็ fallback เป็นช่อง assigned_to เดิม
            func.coalesce(latest_internal_dept_name, Complaint.assigned_to).label("department_name"),
            # outside_department_name: เอาจาก union ล่าสุดของ OR2/OR4
            latest_outside_dept_name.label("outside_department_name"),
            Complaint.document_number.label("document_number"),
            Complaint.status.label("status"),
            Complaint.created_at.label("created_at"),
            Complaint.assigned_officer_id.label("assigned_officer_id"),
            Complaint.complaint_filing_type.label("filing_type"),  # เพิ่ม filing_type
            Complaint.processing_notes.label("assigned_remark"),  # เพิ่ม remark
            ParentComplaint.complaint_number.label("parent_complaint_number"),  # เลขอ้างอิง (เรื่องต้นเรื่อง)
            start_ref.label("start_ref"),
            func.row_number()
            .over(order_by=(assigned_nulls_last, Complaint.assigned_date.desc(), Complaint.created_at.desc()))
            .label("rn"),
        )
        .select_from(Complaint)
        .outerjoin(User, Complaint.assigned_officer_id == User.id)
        .outerjoin(ParentComplaint, Complaint.parent_complaint_id == ParentComplaint.id)  # join parent
        .filter(Complaint.status.in_(PENDING_STATUSES))
    )

    # ---------- filters ----------
    if status:
        # รองรับทั้ง string และ enum name
        from models.comp_complaint import ComplaintStatus as CS
        try:
            ordered_subq = ordered_subq.filter(Complaint.status == CS(status))
        except Exception:
            ordered_subq = ordered_subq.filter(False)

    if search:
        like = f"%{search}%"
        ordered_subq = ordered_subq.filter(
            or_(
                Complaint.complaint_number.ilike(like),
                Complaint.subject.ilike(like),
                Complaint.reference_number.ilike(like),
                Complaint.reference_number4.ilike(like),
            )
        )

    if date_from:
        ordered_subq = ordered_subq.filter(
            or_(Complaint.assigned_date >= date_from, Complaint.created_at >= date_from)
        )
    if date_to:
        ordered_subq = ordered_subq.filter(
            or_(Complaint.assigned_date <= date_to, Complaint.created_at <= date_to)
        )

    if department:
        # ช่องนี้ยังคง filter จาก assigned_to ถ้าต้องการให้ filter ตาม department_name ใหม่
        # ให้เปลี่ยนไป filter ที่ Department/OutgoingReport ตาม business rule ของคุณ
        ordered_subq = ordered_subq.filter(Complaint.assigned_to == department)

    # เพิ่มการกรองตาม filing_type (new, additional)
    if filing_type:
        from models.comp_complaint import ComplaintFilingType
        try:
            ft_enum = ComplaintFilingType(filing_type.lower())
            ordered_subq = ordered_subq.filter(Complaint.complaint_filing_type == ft_enum)
        except Exception:
            # ถ้าไม่ใช่ค่าที่ถูกต้อง ให้เพิกเฉย
            pass

    if officer_id:
        # แปลง officer_id จาก string เป็น UUID
        try:
            officer_uuid = UUID(officer_id) if isinstance(officer_id, str) else officer_id
        except Exception:
            officer_uuid = None

        if officer_uuid:
            # Filter เหมือนหน้าคลัง: รวม created_by, assigned_officer_id, confirm_assigned_by, และ OutgoingReport/2/3
            ordered_subq = ordered_subq.filter(
                or_(
                    Complaint.created_by == officer_uuid,
                    Complaint.assigned_officer_id == officer_uuid,
                    Complaint.confirm_assigned_by == officer_uuid,
                    # OutgoingReport
                    db.query(OutgoingReport.id).filter(
                        and_(
                            OutgoingReport.complaint_id == Complaint.id,
                            or_(
                                OutgoingReport.created_by == officer_uuid,
                                OutgoingReport.updated_by == officer_uuid,
                                OutgoingReport.signature_authority_user_id == officer_uuid
                            )
                        )
                    ).exists(),
                    # OutgoingReport2
                    db.query(OutgoingReport2.id).filter(
                        and_(
                            OutgoingReport2.complaint_id == Complaint.id,
                            or_(
                                OutgoingReport2.created_by == officer_uuid,
                                OutgoingReport2.updated_by == officer_uuid,
                                OutgoingReport2.signature_authority_user_id == officer_uuid,
                                OutgoingReport2.user_id == officer_uuid
                            )
                        )
                    ).exists(),
                    # OutgoingReport3
                    db.query(OutgoingReport3.id).filter(
                        and_(
                            OutgoingReport3.complaint_id == Complaint.id,
                            or_(
                                OutgoingReport3.created_by == officer_uuid,
                                OutgoingReport3.updated_by == officer_uuid,
                                OutgoingReport3.signature_authority_user_id == officer_uuid
                            )
                        )
                    ).exists(),
                    # OutgoingReport4
                    db.query(OutgoingReport4.id).filter(
                        and_(
                            OutgoingReport4.complaint_id == Complaint.id,
                            or_(
                                OutgoingReport4.created_by == officer_uuid,
                                OutgoingReport4.updated_by == officer_uuid,
                                OutgoingReport4.signature_authority_user_id == officer_uuid,
                                OutgoingReport4.user_id == officer_uuid
                            )
                        )
                    ).exists(),
                    # OutgoingReport5
                    db.query(OutgoingReport5.id).filter(
                        and_(
                            OutgoingReport5.complaint_id == Complaint.id,
                            or_(
                                OutgoingReport5.created_by == officer_uuid,
                                OutgoingReport5.updated_by == officer_uuid,
                                OutgoingReport5.signature_authority_user_id == officer_uuid,
                                OutgoingReport5.user_id == officer_uuid
                            )
                        )
                    ).exists(),
                    # OutgoingReport6
                    db.query(OutgoingReport6.id).filter(
                        and_(
                            OutgoingReport6.complaint_id == Complaint.id,
                            or_(
                                OutgoingReport6.created_by == officer_uuid,
                                OutgoingReport6.updated_by == officer_uuid,
                                OutgoingReport6.signature_authority_user_id == officer_uuid,
                                OutgoingReport6.user_id == officer_uuid
                            )
                        )
                    ).exists(),
                )
            )

    subq = ordered_subq.subquery()

    # ---------- ดึง page rows ----------
    page_rows = (
        db.query(subq)
        .filter(subq.c.rn > skip, subq.c.rn <= skip + limit)
        .order_by(subq.c.rn)
        .all()
    )

    # map officer name (bulk)
    officer_ids = [r.assigned_officer_id for r in page_rows if r.assigned_officer_id]
    officers = {}
    if officer_ids:
        for u in db.query(User.id, User.first_name, User.last_name).filter(User.id.in_(officer_ids)).all():
            officers[str(u.id)] = f"{u.first_name} {u.last_name}".strip()

    # ---------- map output ----------
    now = datetime.now(timezone.utc)
    items = []
    for r in page_rows:
        # เริ่มนับเวลาตามกติกาใหม่
        start_date = r.start_ref or r.assigned_date or r.created_at
        days_in_progress = (now - (start_date.replace(tzinfo=timezone.utc) if start_date.tzinfo is None else start_date)).days

        items.append(
            {
                "id": str(r.id),
                "receive_reference_number": r.receive_reference_number,
                "reference_number": r.reference_number,
                "parent_complaint_number": r.parent_complaint_number,  # เลขอ้างอิง (เรื่องต้นเรื่อง)
                "subject": r.subject,
                "assigned_date": r.assigned_date,
                "director_submission_date": r.director_submission_date,
                "department_name": r.department_name,                  # ภายใน
                "outside_department_name": r.outside_department_name,  # ภายนอก (ผู้รับมอบหมาย)
                "document_number": r.document_number,
                "status": r.status.value if hasattr(r.status, "value") else r.status,
                "days_in_progress": days_in_progress,
                "assigned_officer_name": officers.get(str(r.assigned_officer_id)) if r.assigned_officer_id else None,
                "filing_type": r.filing_type.value if hasattr(r.filing_type, "value") else r.filing_type,  # เพิ่ม filing_type
                "assigned_remark": r.assigned_remark,  # เพิ่ม remark
                "remark": r.assigned_remark,  # เพิ่ม remark (alias เพิ่อความยืดหยุ่น)
            }
        )

    # ---------- total ----------
    # นับจำนวนทั้งหมดจาก query เดียวกัน (ไม่ต้องนับใหม่ทั้งหมด)
    total = db.query(func.count()).select_from(subq).scalar() or 0

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
    }