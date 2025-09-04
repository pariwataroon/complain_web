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
  },
  files: [],
  agencyReports: [],
};

/* ---------- helpers ---------- */
const safeLabel = (v) =>
  v && typeof v === "object" ? (v.label ?? v.name ?? v.value ?? "") : (v ?? "");

const toStr = (v) => (v === 0 || typeof v === "number" ? String(v) : (v ?? ""));

/* ---------- mapper: payload API -> โครงที่ FollowStatusSummary ต้องการ ---------- */
function mapComplaintData(raw) {
  if (!raw) return { ...initialData };

  // รองรับทั้งที่มี/ไม่มีชั้น general
  const s1root = raw.step1 ?? {};
  const s2root = raw.step2 ?? {};
  const s3root = raw.step3 ?? {};

  const s1 = s1root.general ?? s1root ?? {};
  const s2 = s2root.general ?? s2root ?? {};
  const s3 = s3root.general ?? s3root ?? {};

  // โหนดลึกพิเศษตามตัวอย่างจริง: step1.general.general.government
  const s1gg = s1.general ?? {};
  const govNode = s1gg.government ?? s1.government ?? null;

  const assign = raw.assignment_form ?? {};
  const complaintNumber =
    raw.complaint_number ??
    raw.complaint?.complaint_number ??
    raw.complaint?.number ??
    "";

  // ===== ผู้ร้อง (map จาก government) =====
  const complainant = {
    idCard: toStr(govNode?.idCard),
    name: govNode?.fullName ?? "",
    address: govNode?.address ?? "",
    subdistricts: safeLabel(govNode?.subdistricts),
    district: safeLabel(govNode?.districts),
    province: safeLabel(govNode?.province),
    zipcode: toStr(safeLabel(govNode?.zipcode)),
    email: "",
    phone: toStr(govNode?.phone),
  };

  // ===== ผู้รับมอบอำนาจ/ผู้ลงนาม (ไม่มีในตัวอย่าง → เว้นว่าง) =====
  const delegate = { ...emptyPerson };
  const signer = { ...emptyPerson };

  // ===== ผู้ร้องนิติบุคคล (ไม่มีในตัวอย่าง) =====
  const corporate = { ...emptyPerson };

  // ===== ผู้ถูกร้อง (บุคคล) จาก step2.individual — ในตัวอย่างมีแค่ name: "ไม่ระบุ" =====
  const respondent = {
    ...emptyPerson,
    name: s2.individual?.name ?? "",
  };

  // ===== ผู้ถูกร้องนิติบุคคล (ไม่มีในตัวอย่าง) =====
  const corporateS2 = { ...emptyPerson };

  // ===== หน่วยงาน (ใช้ฝั่งขวาหากต้องการแสดงเป็นหน่วยงาน) =====
  const government = {
    idCard: "",
    name: safeLabel(govNode?.agencyName), // เช่น "สำนักงานบริหารหนี้สาธารณะ"
    address: govNode?.address ?? "",
    subdistricts: safeLabel(govNode?.subdistricts),
    district: safeLabel(govNode?.districts),
    province: safeLabel(govNode?.province),
    zipcode: toStr(safeLabel(govNode?.zipcode)),
    email: "",
    phone: toStr(govNode?.phone),
  };

  // ===== เรื่องร้องทุกข์ =====
  const complaint = {
    id: raw.id ?? raw.complaint?.id ?? "",
    // บางระบบใส่ชื่อชนิดเป็นสตริง, บางระบบอยู่ใน complaint_type_data.name
    complaintType: safeLabel(s3.complaintType) || safeLabel(s3.complaint_type_data?.name),
    subject: s3.subject ?? raw.subject ?? "",
    channel: safeLabel(assign.complaint_channel_name ?? s3.channel ?? raw.channel),
    incidentDate: s3.incidentDate ?? "",
    description: s3.description ?? "",
    complaintNumber,
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
        name: f?.name || f?.filename || "",
        url: f?.url || "",
      }))
    : [];

  // ===== รายงานจากหน่วยงาน (ตัวอย่างไม่มี) =====
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

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await GetComplaintByID(id);
        const payload = res?.res_data ?? res?.data ?? res; // เผื่อรูปแบบ response ต่างกัน
        const mapped = mapComplaintData(payload);
              // เติมชื่อผู้บันทึก/ผู้รับผิดชอบถ้ามีใน assignment_form
              const recorderName = payload?.updated_by || payload?.created_by || "";
              const responsibleOfficerName =
                payload?.assignment_form?.assigned_officer_name || "";
              mapped.recorderName = recorderName;
              mapped.responsibleOfficerName = responsibleOfficerName;
        if (alive) setData(mapped);
      } catch (e) {
        console.error("[FollowStatus] GetComplaintByID error:", e);
        if (alive) setError("ไม่สามารถดึงข้อมูลคำร้องได้");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [readyAndId, id]);

  if (!id) return <div style={{ padding: 24 }}>ไม่มีรหัสคำร้องใน URL</div>;
  if (loading) return <div style={{ padding: 24 }}>กำลังโหลด...</div>;
  if (error) return <div style={{ padding: 24, color: "#b00020" }}>{error}</div>;

  return <FollowStatusSummary data={data} />;
};

export default FollowStatus;