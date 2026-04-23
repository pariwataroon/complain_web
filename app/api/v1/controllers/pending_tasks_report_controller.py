from datetime import datetime, timezone
from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, or_, case, and_, text

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
    officer_id: Optional[str] = None,
    search: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    filing_type: Optional[str] = None,
):
    """
    รายการงานค้าง (pending-tasks)
    - department_name = หน่วยงานที่เกี่ยวข้อง (ภายใน) -> มาจาก OutgoingReport/2/4.department_id (ล่าสุด)
    - outside_department_name = หน่วยงานที่เกี่ยวข้อง (ภายนอก) -> มาจาก OutgoingReport2/4.outside_department_id (ล่าสุด)
    - days_in_progress = นับจากจุดเริ่มของ 'สถานะปัจจุบัน' (ComplaintStatusHistory.changed_at)
    """
    from models.comp_complaint import Complaint, ComplaintStatusHistory
    from models.user import User
    from models.departments import Department
    from models.outside_departments import OutsideDepartment
    from models.outgoing_reports import OutgoingReport
    from models.outgoing_reports2 import OutgoingReport2
    from models.outgoing_reports4 import OutgoingReport4

    # ---------- Subquery: เริ่มนับเวลาจากประวัติของสถานะปัจจุบัน ----------
    latest_phase_start = (
        db.query(ComplaintStatusHistory.changed_at)
        .filter(
            ComplaintStatusHistory.complaint_id == Complaint.id,
            ComplaintStatusHistory.status == Complaint.status,
        )
        .order_by(ComplaintStatusHistory.changed_at.desc())
        .limit(1)
        .correlate(Complaint)
        .scalar_subquery()
    )
    start_ref = func.coalesce(latest_phase_start, Complaint.assigned_date, Complaint.created_at)

    # ---------- Alias สำหรับ parent complaint ----------
    ParentComplaint = aliased(Complaint)

    # ---------- สร้าง ordered_subq (ไม่มี department_name / outside_department_name) ----------
    assigned_nulls_last = case((Complaint.assigned_date.is_(None), 1), else_=0).asc()
    ordered_subq = (
        db.query(
            Complaint.id.label("id"),
            Complaint.complaint_number.label("receive_reference_number"),
            func.coalesce(Complaint.reference_number4, Complaint.reference_number).label("reference_number"),
            Complaint.subject.label("subject"),
            Complaint.assigned_date.label("assigned_date"),
            Complaint.director_submission_date.label("director_submission_date"),
            Complaint.document_number.label("document_number"),
            Complaint.status.label("status"),
            Complaint.created_at.label("created_at"),
            Complaint.assigned_officer_id.label("assigned_officer_id"),
            Complaint.complaint_filing_type.label("filing_type"),
            Complaint.processing_notes.label("assigned_remark"),
            Complaint.agency_sender.label("agency_sender"),
            ParentComplaint.complaint_number.label("parent_complaint_number"),
            start_ref.label("start_ref"),
            func.row_number()
            .over(order_by=(assigned_nulls_last, Complaint.assigned_date.desc(), Complaint.created_at.desc()))
            .label("rn"),
        )
        .select_from(Complaint)
        .outerjoin(User, Complaint.assigned_officer_id == User.id)
        .outerjoin(ParentComplaint, Complaint.parent_complaint_id == ParentComplaint.id)
        .filter(Complaint.status.in_(PENDING_STATUSES))
    )

    # ---------- filters ----------
    if status:
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
        ordered_subq = ordered_subq.filter(Complaint.assigned_to == department)

    if filing_type:
        from models.comp_complaint import ComplaintFilingType
        try:
            ft_enum = ComplaintFilingType(filing_type.lower())
            ordered_subq = ordered_subq.filter(Complaint.complaint_filing_type == ft_enum)
        except Exception:
            pass

    if officer_id:
        try:
            officer_uuid = UUID(officer_id) if isinstance(officer_id, str) else officer_id
        except Exception:
            officer_uuid = None

        if officer_uuid:
            ordered_subq = ordered_subq.filter(
                or_(
                    Complaint.created_by == officer_uuid,
                    Complaint.assigned_officer_id == officer_uuid,
                    Complaint.confirm_assigned_by == officer_uuid,
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

    # ---------- Post-process: batch lookup department names ----------
    # chunk size 500 เพื่อไม่ให้เกิน SQL Server parameter limit (2100)
    # UNION ALL x3 = 3 * chunk_size params -> 500 is safe
    CHUNK_SIZE = 500

    complaint_ids = [r.id for r in page_rows]
    dept_map = {}       # complaint_id -> department_name (ภายใน)
    outside_map = {}    # complaint_id -> outside_department_name (ภายนอก)

    def chunk_list(lst, size):
        for i in range(0, len(lst), size):
            yield lst[i:i + size]

    if complaint_ids:
        for chunk in chunk_list(complaint_ids, CHUNK_SIZE):
            # --- หน่วยงานภายใน: UNION ALL outgoing_reports / outgoing_reports2 / outgoing_reports4 ---
            or1_q = (
                db.query(
                    OutgoingReport.complaint_id.label("cid"),
                    Department.name.label("dept_name"),
                    OutgoingReport.created_at.label("created_at"),
                )
                .join(Department, Department.id == OutgoingReport.department_id)
                .filter(OutgoingReport.complaint_id.in_(chunk), OutgoingReport.is_active == True)
            )
            or2_q = (
                db.query(
                    OutgoingReport2.complaint_id.label("cid"),
                    Department.name.label("dept_name"),
                    OutgoingReport2.created_at.label("created_at"),
                )
                .join(Department, Department.id == OutgoingReport2.department_id)
                .filter(OutgoingReport2.complaint_id.in_(chunk), OutgoingReport2.is_active == True)
            )
            or4_q = (
                db.query(
                    OutgoingReport4.complaint_id.label("cid"),
                    Department.name.label("dept_name"),
                    OutgoingReport4.created_at.label("created_at"),
                )
                .join(Department, Department.id == OutgoingReport4.department_id)
                .filter(OutgoingReport4.complaint_id.in_(chunk), OutgoingReport4.is_active == True)
            )

            all_depts = or1_q.union_all(or2_q, or4_q).subquery()
            latest_dept = (
                db.query(
                    all_depts.c.cid,
                    all_depts.c.dept_name,
                    func.row_number().over(
                        partition_by=all_depts.c.cid,
                        order_by=all_depts.c.created_at.desc()
                    ).label("rn"),
                )
            ).subquery()

            for row in db.query(latest_dept).filter(latest_dept.c.rn == 1).all():
                dept_map[str(row.cid)] = row.dept_name

            # --- หน่วยงานภายนอก: UNION ALL outgoing_reports2 / outgoing_reports4 ---
            out2_q = (
                db.query(
                    OutgoingReport2.complaint_id.label("cid"),
                    OutsideDepartment.name.label("dept_name"),
                    OutgoingReport2.created_at.label("created_at"),
                )
                .join(OutsideDepartment, OutsideDepartment.id == OutgoingReport2.outside_department_id)
                .filter(OutgoingReport2.complaint_id.in_(chunk), OutgoingReport2.is_active == True)
            )
            out4_q = (
                db.query(
                    OutgoingReport4.complaint_id.label("cid"),
                    OutsideDepartment.name.label("dept_name"),
                    OutgoingReport4.created_at.label("created_at"),
                )
                .join(OutsideDepartment, OutsideDepartment.id == OutgoingReport4.outside_department_id)
                .filter(OutgoingReport4.complaint_id.in_(chunk), OutgoingReport4.is_active == True)
            )

            all_out = out2_q.union_all(out4_q).subquery()
            latest_out = (
                db.query(
                    all_out.c.cid,
                    all_out.c.dept_name,
                    func.row_number().over(
                        partition_by=all_out.c.cid,
                        order_by=all_out.c.created_at.desc()
                    ).label("rn"),
                )
            ).subquery()

            for row in db.query(latest_out).filter(latest_out.c.rn == 1).all():
                outside_map[str(row.cid)] = row.dept_name

    # --- Fallback: agency_sender -> OutsideDepartment ---
    agency_dept_map = {}
    missing_dept_ids = []
    for r in page_rows:
        cid = str(r.id)
        if cid not in dept_map and r.agency_sender:
            try:
                missing_dept_ids.append(UUID(str(r.agency_sender)))
            except (ValueError, AttributeError):
                pass

    if missing_dept_ids:
        unique_ids = list(set(missing_dept_ids))
        for u in db.query(OutsideDepartment.id, OutsideDepartment.name).filter(
            OutsideDepartment.id.in_(unique_ids),
            OutsideDepartment.is_active == True
        ).all():
            agency_dept_map[str(u.id)] = u.name

    # ---------- map officer name (bulk) ----------
    officer_ids = [r.assigned_officer_id for r in page_rows if r.assigned_officer_id]
    officers = {}
    if officer_ids:
        for u in db.query(User.id, User.first_name, User.last_name).filter(User.id.in_(officer_ids)).all():
            officers[str(u.id)] = f"{u.first_name} {u.last_name}".strip()

    # ---------- map output ----------
    now = datetime.now(timezone.utc)
    items = []
    for r in page_rows:
        start_date = r.start_ref or r.assigned_date or r.created_at
        days_in_progress = (now - (start_date.replace(tzinfo=timezone.utc) if start_date.tzinfo is None else start_date)).days

        cid = str(r.id)
        dept_name = dept_map.get(cid)
        if not dept_name and r.agency_sender:
            dept_name = agency_dept_map.get(str(r.agency_sender))

        items.append(
            {
                "id": cid,
                "receive_reference_number": r.receive_reference_number,
                "reference_number": r.reference_number,
                "parent_complaint_number": r.parent_complaint_number,
                "subject": r.subject,
                "assigned_date": r.assigned_date,
                "director_submission_date": r.director_submission_date,
                "department_name": dept_name,
                "outside_department_name": outside_map.get(cid),
                "document_number": r.document_number,
                "status": r.status.value if hasattr(r.status, "value") else r.status,
                "days_in_progress": days_in_progress,
                "assigned_officer_name": officers.get(str(r.assigned_officer_id)) if r.assigned_officer_id else None,
                "filing_type": r.filing_type.value if hasattr(r.filing_type, "value") else r.filing_type,
                "assigned_remark": r.assigned_remark,
                "remark": r.assigned_remark,
            }
        )

    # ---------- total ----------
    total = db.query(func.count()).select_from(subq).scalar() or 0

    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
    }
