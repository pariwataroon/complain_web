import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import FollowStatusSummary from "@services/FollowStatusSummary/FollowStatusSummary";
import { GetComplaintByID } from "@pages/api/complaint/complaint";

/* ---------- โครงข้อมูลเริ่มต้น ---------- */
const emptyPerson = {
  idCard: "",
  name: "",
  address: "",
  subdistricts: "",
  district: "",
  province: "",
  zipcode: "",
  email: "",
  phone: "",
};

const initialData = {
  complainant: { ...emptyPerson },
  delegate: { ...emptyPerson },
  corporate: { ...emptyPerson },
  signer: { ...emptyPerson },
  respondent: { ...emptyPerson },
  corporateS2: { ...emptyPerson },
  government: { ...emptyPerson },
  complaint: {
    id: "",
    complaintType: "",
    subject: "",
    channel: "",
    incidentDate: "",
    description: "",
    complaintNumber: "",
    status: "",
    status_thai: "",
  },
  files: [],
  agencyReports: [],
  assignment_form: {},
  status_history: [],
  recorderName: "",
  responsibleOfficerName: "",
};

/* ---------- helpers ---------- */
const safeLabel = (v) =>
  v && typeof v === "object" ? (v.label ?? v.name ?? v.value ?? "") : (v ?? "");

const toStr = (v) => (v === 0 || typeof v === "number" ? String(v) : (v ?? ""));

/** เดิน path แบบ 'a.b.c' บน object ปลอดภัย */
const getNested = (obj, ...paths) => {
  for (const p of paths) {
    const r = p.split(".").reduce((a, k) => a?.[k], obj);
    if (r && typeof r === "object" && Object.keys(r).length > 0) return r;
  }
  return null;
};

/** แปลง node ข้อมูลบุคคล/หน่วยงาน → flat object สำหรับ FollowStatusSummary */
const mapPerson = (node) => {
  if (!node || typeof node !== "object") return { ...emptyPerson };
  return {
    idCard: toStr(node.idCard ?? node.id_card),
    name: node.fullName ?? node.full_name ?? node.name ?? "",
    agencyName: node.agencyName ?? node.agency_name ?? "",
    companyName: node.companyName ?? node.company_name ?? "",
    signatoryName: node.signatoryName ?? node.signatory_name ?? "",
    address: node.address ?? "",
    subdistricts: safeLabel(node.subdistricts ?? node.sub_districts),
    district: safeLabel(node.districts ?? node.district),
    province: safeLabel(node.province),
    zipcode: toStr(safeLabel(node.zipcode ?? node.postal_code)),
    email: node.email ?? "",
    phone: toStr(node.phone ?? node.telephone),
  };
};

/** status code → Thai label */
const toThaiLabel = (code = "") => {
  const s = String(code || "").toLowerCase();
  switch (s) {
    case "submitted": return "รับเรื่อง";
    case "sent_to_external":
    case "sent_to_agency":
    case "forwarded": return "ส่งหน่วยงานที่เกี่ยวข้อง";
    case "in_process":
    case "in_progress": return "กำลังดำเนินการ";
    case "tracking": return "ติดตามผล";
    case "assigned": return "มอบหมายเจ้าหน้าที่";
    case "reviewed": return "แจ้งผลการพิจารณา";
    case "in_review": return "อยู่ระหว่างพิจารณา";
    case "completed":
    case "cancelled":
    case "closed":
    case "resolved":
    case "done": return "ยุติเรื่องแล้ว";
    default: return code || "-";
  }
};

/* ---------- mapper: payload API → โครงที่ FollowStatusSummary ต้องการ ---------- */
function mapComplaintData(raw) {
  if (!raw) return { ...initialData };

  // รองรับทั้งที่มี/ไม่มีชั้น general และ nested general (ตาม backend จริง)
  const s1root = raw.step1 ?? {};
  const s2root = raw.step2 ?? {};
  const s3root = raw.step3 ?? {};

  // ดึงข้อมูลจากทุก path ที่เป็นไปได้ (รองรับทั้งโครงเก่าและใหม่)
  const governmentNode = getNested(s1root, "general.government", "general.general.government");
  const corporateNode  = getNested(s1root, "general.corporate", "general.general.corporate");
  const generalNode    = getNested(s1root, "general.general", "general.general.general") ?? s1root.general ?? {};
  const delegateNode   = getNested(s1root, "general.delegate", "general.general.delegate");
  const signerNode     = getNested(s1root, "general.signer", "general.general.signer");

  // step2: ผู้ถูกร้อง
  const s2 = s2root.general ?? s2root ?? {};
  const respondentIndividual = s2.individual ?? {};
  const respondentCorporate  = s2.corporate ?? {};
  const respondentGovernment = s2.government ?? {};
  const respondentActiveType  = s2.activeType;

  // step3: เรื่องร้องทุกข์
  const s3 = s3root.general ?? s3root ?? {};

  const assign = raw.assignment_form ?? {};
  const statusHistory = raw.status_history ?? [];

  const complaintNumber =
    raw.complaint_number ??
    raw.complaint?.complaint_number ??
    raw.complaint?.number ??
    assign?.complaint_number ??
    "";

  // ===== ผู้ร้อง / หน่วยงาน =====
  const government = mapPerson(governmentNode);

  // ===== ผู้ร้องบุคคล =====
  const complainant = mapPerson(generalNode);

  // ===== ผู้ร้องนิติบุคคล =====
  const corporate = mapPerson(corporateNode);

  // ===== ผู้รับมอบอำนาจ =====
  const delegate = mapPerson(delegateNode);

  // ===== ผู้ลงนาม =====
  const signer = mapPerson(signerNode);

  // ===== ผู้ถูกร้อง (map ทั้ง 3 ประเภท) =====
  const respondent = mapPerson(respondentIndividual);
  const corporateS2 = mapPerson(respondentCorporate);

  // ===== เรื่องร้องทุกข์ =====
  const rawStatus = assign.status ?? raw.status ?? "";
  const complaint = {
    id: raw.id ?? raw.complaint?.id ?? "",
    complaintType: safeLabel(s3.complaintType) || safeLabel(s3.complaint_type_data?.name),
    complaintSubtype: safeLabel(s3.complaintSubtype) || safeLabel(s3.complaint_subtype_data?.name),
    subject: s3.subject ?? raw.subject ?? "",
    channel: safeLabel(assign.complaint_channel_name ?? s3.channel ?? raw.channel),
    incidentDate: s3.incidentDate ?? s3.incident_date ?? "",
    description: s3.description ?? "",
    complaintNumber,
    status: rawStatus,
    status_thai: toThaiLabel(rawStatus),
  };

  // ===== ไฟล์แนบ =====
  const rawAttachments =
    s3.attachment ??
    s3.attachments ??
    s3.files ??
    raw.attachments ??
    raw.files ??
    [];
  const files = Array.isArray(rawAttachments)
    ? rawAttachments.map((f) => ({
        name: f?.name || f?.filename || f?.file_name || "",
        url: f?.url || f?.file_url || "",
      }))
    : [];

  // ===== รายงานจากหน่วยงาน =====
  const agencyReports = Array.isArray(raw.agency_reports)
    ? raw.agency_reports.map((r) => ({
        agency_name: r.agency_name ?? "",
        priority_label: safeLabel(r.priority_label),
        sla_label: safeLabel(r.sla_label),
        summary: r.summary ?? "",
        reporter_name: r.reporter_name ?? "",
        report_date: r.report_date ?? "",
        attachments: Array.isArray(r.attachments)
          ? r.attachments.map((f) => ({
              name: f?.name || f?.filename || "",
              url: f?.url || "",
            }))
          : [],
      }))
    : [];

  return {
    complainant,
    delegate,
    corporate,
    signer,
    respondent,
    corporateS2,
    government,
    complaint,
    files,
    agencyReports,
    // ส่งผ่าน assignment_form + status_history ให้ FollowStatusSummary ใช้แสดงเลขอ้างอิง/สถานะ
    assignment_form: assign,
    status_history: statusHistory,
  };
}

/* ---------- หน้า FollowStatus ---------- */
const FollowStatus = () => {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const readyAndId = useMemo(() => router.isReady && !!id, [router.isReady, id]);

  useEffect(() => {
    if (!readyAndId) return;

    let alive = false;

    (async () => {
      try {
        alive = true;
        setLoading(true);

        // เรียก GetComplaintByID เสมอ — sessionStorage จาก GetMyRelatedComplaints
        // ไม่มี step1/step2/step3 จึงใช้ไม่ได้
        const res = await GetComplaintByID(id);
        const payload = res?.res_data ?? res?.data ?? res;

        const mapped = mapComplaintData(payload);
        // เติมชื่อผู้บันทึก/ผู้รับผิดชอบถ้ามี
        mapped.recorderName = payload?.updated_by || payload?.created_by || "";
        mapped.responsibleOfficerName =
          payload?.assignment_form?.assigned_officer_name || "";

        if (alive) setData(mapped);
      } catch (e) {
        console.error("[FollowStatus] GetComplaintByID error:", e);
        if (alive) setError("ไม่สามารถดึงข้อมูลคำร้องได้");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [readyAndId, id]);

  if (!id) return <div style={{ padding: 24 }}>ไม่มีรหัสคำร้องใน URL</div>;
  if (loading) return <div style={{ padding: 24 }}>กำลังโหลด...</div>;
  if (error) return <div style={{ padding: 24, color: "#b00020" }}>{error}</div>;

  return <FollowStatusSummary data={data} />;
};

export default FollowStatus;
