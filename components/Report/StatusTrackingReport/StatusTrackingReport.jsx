import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListCollaps from "@services/TableListCollaps/TableListCollaps";
import { GetMyRelatedComplaints, GetDepartments } from "@pages/api/complaint/complaint";
import { GetAllSignatureAuthorities } from "@pages/api/allselect/allselect";

/* ============= คำที่ถือว่า “ปิดเรื่องจากผลพิจารณา (outgoing)” ============= */
const CLOSED_WORDS = ["ยุติเรื่อง", "ยุติเรื่องได้", "ปิดเรื่อง", "ปิดงาน"];

/* ============= label สถานะเหมือนหน้าติดตามผลการดำเนินการ ============= */
const STATUS_LABELS = [
  "รับเรื่อง",
  "ส่งหน่วยงานที่เกี่ยวข้อง",
  "กำลังดำเนินการ",
  "ติดตามผล",
  "มอบหมายเจ้าหน้าที่",
  "แจ้งผลการพิจารณา",
  "อยู่ระหว่างพิจารณา",
  "ยุติเรื่องแล้ว",
];

const statusFilterOptions = STATUS_LABELS.map((l) => ({ value: l, label: l }));

/* code -> label ไทย (ให้ตรงกับหน้า followup) */
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

/* ถ้า history มี outgoing ที่สรุป “ยุติ/ปิดเรื่อง” ให้ถือว่าปิดเรื่อง */
const closedByOutgoing = (history = []) =>
  history.some(
    (h) =>
      (h?.type === "outgoing_report" || h?.status === "outgoing_report") &&
      (h?.ext?.is_closed_by_consideration === true ||
        CLOSED_WORDS.includes(String(h?.ext?.consideration_result || "")))
  );

/* ======================= Utils อื่น ๆ ======================= */
const diffDaysFrom = (startISO) => {
  try { return Math.max(0, Math.ceil((new Date() - new Date(startISO)) / 86400000)); } catch { return 0; }
};

const diffDaysBetween = (startISO, endISO) => {
  try { return Math.max(0, Math.ceil((new Date(endISO) - new Date(startISO)) / 86400000)); } catch { return 0; }
};

const guessRefFromSubject = (subject) => {
  if (!subject || subject === "-") return null;
  const s = String(subject).trim();
  const hasLongDigits = (s.match(/\d/g) || []).length >= 5;
  const hasSep = /[-_/]/.test(s);
  return (hasLongDigits || hasSep) ? s : null;
};

const getReferenceNumber = (item) => {
  const c = item?.complaint ?? {};
  const latest = item?.latest ?? {};
  const direct = latest?.sent?.reference_number || c.reference_number || latest?.decision?.reference_number;
  if (direct) return String(direct);
  const fromSubject = guessRefFromSubject(c.subject);
  return fromSubject || c.complaint_number || c.id || "-";
};

const buildHistoryRows = (item) => {
  const c = item?.complaint ?? {};
  const latest = item?.latest ?? {};
  const history = Array.isArray(item?.history) ? item.history.slice() : [];
  if (history.length === 0) return [];

  history.sort((a, b) => new Date(a.at) - new Date(b.at));
  const refNoFallback = getReferenceNumber(item);

  return history.map((h, idx) => {
    const prevAt = idx === 0 ? c.created_at : history[idx - 1]?.at ?? c.created_at;
    const stepDays = diffDaysBetween(prevAt, h.at);

    let department = "-";
    let referenceNumber = refNoFallback;
    let statusLabel = h.status_label ?? h.status ?? "-";

    if (h.type === "status_history") {
      if (String(h.status).toLowerCase() === "sent_to_agency") {
        department = latest?.sent?.department_name || "-";
      }
    } else if (h.type === "outgoing_report") {
      department = h.department_name || latest?.sent?.department_name || "-";
      referenceNumber = h.reference_number || refNoFallback;
      statusLabel = "เอกสารถึงหน่วยงาน";
    }

    return { department, receiptNumber: c.complaint_number ?? "-", referenceNumber, workingDays: stepDays, status: statusLabel };
  });
};

/* ======================= หน้ารายงานหลัก ======================= */
const StatusTrackingReport = () => {
  const router = useRouter();
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [responsibleOfficerOptions, setResponsibleOfficerOptions] = useState([]);

  // โหลด “หน่วยงาน” จากผู้มีอำนาจลงนาม
  useEffect(() => {
    (async () => {
      try {
        const sigs = await GetAllSignatureAuthorities();
        const bag = new Map();
        (sigs || []).forEach((auth) => {
          (auth?.departments || []).forEach((d) => {
            const label = d?.name?.trim();
            if (!label) return;
            const value = String(d.id ?? label);
            if (!bag.has(label)) bag.set(label, { value, label });
          });
        });
        const opts = [...bag.values()].sort((a, b) => a.label.localeCompare(b.label, "th"));
        setDepartmentOptions(opts);
      } catch (e) {
        console.error("Load signature authorities failed:", e);
        setDepartmentOptions([]);
      }
    })();
  }, []);

  // โหลดข้อมูลเรื่องร้องเรียน แล้ว map สถานะเป็น label แบบเดียวกับหน้า followup
  useEffect(() => {
    const fetchMyRelated = async () => {
      try {
        setLoading(true);
        const res = await GetMyRelatedComplaints({ skip: 0, limit: 100 });
        const items = res?.res_data?.items ?? [];

        const mapped = items.map((it, idx) => {
          const c = it?.complaint ?? {};
          const latest = it?.latest ?? {};
          const history = Array.isArray(it?.history) ? it.history : [];

          // หน่วยงาน
          let deptName = "-";
          if (c.assigned_to) deptName = c.assigned_to;
          else if (latest?.sent?.department_name) deptName = latest.sent.department_name;
          else {
            const sentHistory = history.find(
              (h) => h.type === "status_history" && String(h.status).toLowerCase() === "sent_to_agency"
            );
            if (sentHistory?.department_name) deptName = sentHistory.department_name;
          }

          // สถานะ: ถ้า outgoing ปิด → ถือว่า completed, ไม่งั้นใช้ raw status แล้วแปลง label
          const raw = String(c.status || "").toLowerCase();
          const isClosed = closedByOutgoing(history);
          const finalCode = isClosed ? "completed" : raw;
          const statusLabel = toThaiLabel(finalCode);

          return {
            id: c.id ?? `temp_${idx + 1}`,
            claimantName: c.subject ?? "-",
            department: deptName,
            responsibleOfficer: c.assigned_to || "-",
            receiptNumber: c.complaint_number ?? "-",
            referenceNumber: getReferenceNumber(it),
            workingDays: diffDaysFrom(c.created_at),
            status: statusLabel,           // แสดง label เหมือนหน้า followup
            departmentsData: buildHistoryRows(it),
            rawData: it,
          };
        });

        setAllComplaints(mapped);
        setFilteredComplaints(mapped);

        const uniqueOfficers = [
          ...new Set(mapped.map((i) => i.responsibleOfficer).filter((x) => x && x !== "-")),
        ].sort();
        setResponsibleOfficerOptions(uniqueOfficers.map((x) => ({ value: x, label: x })));
      } catch (e) {
        console.error("Error fetching my-related complaints:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRelated();
  }, []);

  // โหลดหน่วยงาน (สำรอง)
  useEffect(() => {
    (async () => {
      try {
        const res = await GetDepartments();
        const list = res?.res_data ?? [];
        if (!list.length) return;
        const extra = list.map((d) => ({ value: String(d.name), label: d.name })).filter((x) => x.label);
        setDepartmentOptions((prev) => {
          const bag = new Map(prev.map((p) => [p.label, p]));
          extra.forEach((e) => { if (!bag.has(e.label)) bag.set(e.label, e); });
          return [...bag.values()].sort((a, b) => a.label.localeCompare(b.label, "th"));
        });
      } catch (e) {
        console.error("Error fetching departments:", e);
      }
    })();
  }, []);

  const handleSearch = (filters) => {
    const {
      claimantName: fName,
      department: fDept,
      responsibleOfficer: fOfficer,
      receiptNumber: fReceipt,
      referenceNumber: fReference,
      status: fStatus, // ใช้ STATUS_LABELS
    } = filters;

    const norm = (v) => (v ?? "").toString().toLowerCase().trim();

    if (!fName && !fDept && !fOfficer && !fReceipt && !fReference && !fStatus) {
      setFilteredComplaints(allComplaints);
      return;
    }

    const result = allComplaints.filter((item) => {
      let ok = false;
      if (fName && norm(item.claimantName).includes(norm(fName))) ok = true;
      if (fDept && (norm(item.department) === norm(fDept) || norm(item.department).includes(norm(fDept)))) ok = true;
      if (fOfficer && norm(item.responsibleOfficer).includes(norm(fOfficer))) ok = true;
      if (fReceipt && norm(item.receiptNumber).includes(norm(fReceipt))) ok = true;
      if (fReference && norm(item.referenceNumber).includes(norm(fReference))) ok = true;

      // กรองสถานะด้วย "label" ที่โชว์จริง (เหมือนหน้า followup)
      if (fStatus && norm(item.status) === norm(fStatus)) ok = true;

      return ok;
    });

    setFilteredComplaints(result);
  };

  const handleNavigateTo = (item) => {
    router.push(`/admin/edit/opm1111/${item.id}`);
  };

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "เมนูรายงาน",
            icon: <img src="/icons/note.png" alt="pencil" style={{ width: 24, height: 24, marginBottom: -8 }} />,
          },
          { label: "รายงานติดตามสถานะ" },
        ]}
      />

      <TableListCollaps
        data={filteredComplaints}
        title="รายงานติดตามสถานะ"
        navigateTo="/admin/document/status-tracking-report"
        handleNavigateTo={handleNavigateTo}
        onSearch={handleSearch}
        loading={loading}
        filterFields={[
          { name: "claimantName", label: "ชื่อเรื่อง", type: "text" },
          { name: "department", label: "หน่วยงาน", type: "select", options: departmentOptions },
          { name: "responsibleOfficer", label: "เจ้าหน้าที่ผู้รับผิดชอบ", type: "select", options: responsibleOfficerOptions },
          { name: "receiptNumber", label: "เลข สรร.", type: "text" },
          { name: "referenceNumber", label: "เลขที่อ้างอิง", type: "text" },
          { name: "status", label: "สถานะเรื่อง", type: "select", options: statusFilterOptions },
        ]}
      />
    </>
  );
};

export default StatusTrackingReport;
