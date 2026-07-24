import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListCollaps from "@services/TableListCollaps/TableListCollaps";
import { GetMyRelatedComplaints, GetDepartments } from "@pages/api/complaint/complaint";
import { GetAllSignatureAuthorities } from "@pages/api/allselect/allselect";
import { getPendingTasksReport } from "@pages/api/complaintreports/reports";
import dayjs from "dayjs";
import "dayjs/locale/th";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// ตั้งค่า timezone สำหรับประเทศไทย
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

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
  const direct = latest?.sent?.reference_number || c.reference_number || c.reference_number4 || latest?.decision?.reference_number;
  if (direct) return String(direct);
  return c.complaint_number || c.id || "-";
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
  const fetchMyRelated = async (filters = {}) => {
    try {
      setLoading(true);

      // แปลงวันที่เป็น ISO format (YYYY-MM-DD) สำหรับ API
      let date_from = "";
      let date_to = "";

      // หมายเหตุ: เนื่องจากใช้ dayjs.locale("th") อยู่ fromDate.year() จะเป็นปี พ.ศ. แล้ว
      // แต่ filters.startDate ที่รับเข้ามาเป็น JavaScript Date object ปกติ (ไม่ใช่ dayjs)
      // ดังนั้นจึงต้องตรวจสอบปีจาก Date object โดยตรง
      if (filters.startDate) {
        const fromDate = dayjs(filters.startDate).tz("Asia/Bangkok");
        if (fromDate.isValid()) {
          // ตรวจสอบปีจาก JavaScript Date object ต้นฉบับ
          const jsYear = new Date(filters.startDate).getFullYear();
          // แปลงเป็น ค.ศ. ถ้าเป็น พ.ศ.
          const fromYear = jsYear > 2500 ? jsYear - 543 : jsYear;
          date_from = `${fromYear}-${String(fromDate.month() + 1).padStart(2, '0')}-${String(fromDate.date()).padStart(2, '0')}`;
        }
      }

      if (filters.endDate) {
        const toDate = dayjs(filters.endDate).tz("Asia/Bangkok");
        if (toDate.isValid()) {
          // ตรวจสอบปีจาก JavaScript Date object ต้นฉบับ
          const jsYear = new Date(filters.endDate).getFullYear();
          // แปลงเป็น ค.ศ. ถ้าเป็น พ.ศ.
          const toYear = jsYear > 2500 ? jsYear - 543 : jsYear;
          date_to = `${toYear}-${String(toDate.month() + 1).padStart(2, '0')}-${String(toDate.date()).padStart(2, '0')}`;
        }
      }

      const res = await GetMyRelatedComplaints({ skip: 0, limit: 10000, date_from, date_to });
      const items = res?.res_data?.items ?? [];

      const mapped = items.map((it, idx) => {
          const c = it?.complaint ?? {};
          const latest = it?.latest ?? {};
          const history = Array.isArray(it?.history) ? it.history : [];

          // หน่วยงาน - ใช้ department_name จาก backend ก่อน ถ้าไม่มีค่อย fallback ไป history
          let deptName = c.department_name || "-";
          if (!deptName || deptName === "-") {
            if (latest?.sent?.department_name) {
              deptName = latest.sent.department_name;
            } else {
              const sentHistory = history.find(
                (h) => h.type === "status_history" && String(h.status).toLowerCase() === "sent_to_agency"
              );
              if (sentHistory?.department_name) deptName = sentHistory.department_name;
              else {
                const anyDept = history.find((h) => h.department_name);
                if (anyDept) deptName = anyDept.department_name;
              }
            }
          }

          // เจ้าหน้าที่ผู้รับผิดชอบ - ใช้ fallback chain หลายชั้น
          const officerName =
            c.assigned_officer?.name ||
            c.assigned_officer_name ||
            c.assigned_to ||
            "";

          // สถานะ: ถ้า outgoing ปิด → ถือว่า completed, ไม่งั้นใช้ raw status แล้วแปลง label
          const raw = String(c.status || "").toLowerCase();
          const isClosed = closedByOutgoing(history);
          const finalCode = isClosed ? "completed" : raw;
          const statusLabel = toThaiLabel(finalCode);

          return {
            id: c.id ?? `temp_${idx + 1}`,
            claimantName: c.complainant_name || c.subject || "-",
            department: deptName,
            responsibleOfficer: officerName || "ไม่ได้มอบหมาย",
            receiptNumber: c.complaint_number ?? "-",
            referenceNumber: getReferenceNumber(it),
            workingDays: diffDaysFrom(c.created_at),
            status: statusLabel,           // แสดง label เหมือนหน้า followup
            departmentsData: buildHistoryRows(it),
            rawData: it,
            created_at: c.created_at,      // เพิ่มฟิลด์วันที่สร้างสำหรับกรอง
          };
        });

        setAllComplaints(mapped);
        setFilteredComplaints(mapped);
      } catch (e) {
        console.error("Error fetching my-related complaints:", e);
        setAllComplaints([]);
        setFilteredComplaints([]);
      } finally {
        setLoading(false);
      }
    };

  // เรียก API ครั้งแรกเมื่อ component mount
  useEffect(() => {
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

  // โหลด dropdown เจ้าหน้าที่ทุกคนจาก API pending-tasks (เหมือนหน้าติดตามงานค้าง)
  useEffect(() => {
    (async () => {
      try {
        const items = await getPendingTasksReport({ all_officers: true });
        const uniqueOfficers = [
          ...new Set(
            items.map((item) => item.assigned_officer_name).filter(Boolean)
          ),
        ]
          .filter((name) => name && name.trim() !== "" && name !== "-")
          .sort();
        setResponsibleOfficerOptions(uniqueOfficers.map((name) => ({ value: name, label: name })));
      } catch (e) {
        console.error("Error fetching officer list:", e);
      }
    })();
  }, []);

  const handleSearch = async (filters) => {
    const {
      claimantName: fName,
      department: fDept,
      responsibleOfficer: fOfficer,
      receiptNumber: fReceipt,
      referenceNumber: fReference,
      status: fStatus, // ใช้ STATUS_LABELS
      startDate: fStartDate,
      endDate: fEndDate,
    } = filters;

    // ถ้ามีการกรองตามวันที่ ให้เรียก API ใหม่
    if (fStartDate || fEndDate) {
      await fetchMyRelated(filters);
      return;
    }

    const norm = (v) => (v ?? "").toString().toLowerCase().trim();

    if (!fName && !fDept && !fOfficer && !fReceipt && !fReference && !fStatus) {
      setFilteredComplaints(allComplaints);
      return;
    }

    const result = allComplaints.filter((item) => {
      // เช็คแต่ละเงื่อนไข ถ้าไม่มีการกรอกฟิลด์นั้นๆ ถือว่าผ่าน
      const matchName = !fName || norm(item.claimantName).includes(norm(fName));
      const matchDept = !fDept || (norm(item.department) === norm(fDept) || norm(item.department).includes(norm(fDept)));
      const matchOfficer = !fOfficer || norm(item.responsibleOfficer).includes(norm(fOfficer));
      const matchReceipt = !fReceipt || norm(item.receiptNumber).includes(norm(fReceipt));
      const matchReference = !fReference || norm(item.referenceNumber).includes(norm(fReference));
      const matchStatus = !fStatus || norm(item.status) === norm(fStatus);

      // ต้องผ่านทุกเงื่อนไข
      return matchName && matchDept && matchOfficer && matchReceipt && matchReference && matchStatus;
    });

    setFilteredComplaints(result);
  };

  const handleNavigateTo = (item) => {
    // FollowStatus จะ fetch ข้อมูลเต็มจาก GetComplaintByID เอง
    router.push(`/admin/document/status-tracking-report/${item.id}`);
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
          { name: "startDate", label: "ตั้งแต่วันที่", type: "date" },
          { name: "endDate", label: "ถึงวันที่", type: "date" },
        ]}
      />
    </>
  );
};

export default StatusTrackingReport;
