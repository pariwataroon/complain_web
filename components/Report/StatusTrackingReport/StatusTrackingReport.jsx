import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListCollaps from "@services/TableListCollaps/TableListCollaps";
import { GetMyRelatedComplaints } from "@pages/api/complaint/complaint";

/* ======================= ตัวเลือกฟิลเตอร์ ======================= */
const departmentOptions = [
  { value: "ภาษีอากร", label: "ภาษีอากร" },
  { value: "ค่ารักษาพยาบาล", label: "ค่ารักษาพยาบาล" },
  { value: "การจัดซื้อจัดจ้าง", label: "การจัดซื้อจัดจ้าง" },
  { value: "หนี้ในระบบ", label: "หนี้ในระบบ" },
  { value: "หนี้นอกระบบ", label: "หนี้นอกระบบ" },
  { value: "พฤติกรรมเจ้าหน้าที่", label: "พฤติกรรมเจ้าหน้าที่" },
  { value: "อื่นๆ", label: "อื่นๆ" },
  { value: "โครงการสาธารณูปโภคพื้นฐาน", label: "โครงการสาธารณูปโภคพื้นฐาน" },
  { value: "โครงการลงทะเบียนสวัสดิการ", label: "โครงการลงทะเบียนสวัสดิการ" },
  // (หมายเหตุ: ชุดนี้เป็น “หมวดหมู่” เป็นหลัก ถ้าต้องการให้กรองตามหน่วยงานจริง
  // อาจต้องเพิ่มรายการหน่วยงานเข้าไปให้ครบเพื่อให้ตรงกับข้อมูล)
];

const responsibleOfficerOptions = [
  { value: "กรมสรรพากร", label: "กรมสรรพากร" },
  { value: "สำนักงานเศรษฐกิจการคลัง", label: "สำนักงานเศรษฐกิจการคลัง" },
  { value: "กรมบัญชีกลาง", label: "กรมบัญชีกลาง" },
  { value: "สำนักงานบริหารหนี้สาธารณะ", label: "สำนักงานบริหารหนี้สาธารณะ" },
  { value: "ธนาคารแห่งประเทศไทย", label: "ธนาคารแห่งประเทศไทย" },
  { value: "กรมศุลกากร", label: "กรมศุลกากร" },
  { value: "สำนักงานเลขาธิการนายกรัฐมนตรี", label: "สลน.นายกฯ" },
  { value: "กรมโยธาธิการและผังเมือง", label: "กรมโยธาฯ" },
  { value: "สำนักงานหลักประกันสุขภาพแห่งชาติ", label: "สปสช." },
];

const statusOptions = [
  { value: "รอดำเนินการ", label: "รอดำเนินการ" },
  { value: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
  { value: "เสร็จสิ้น", label: "เสร็จสิ้น" },
];

/* ======================= Utils แปลงค่า/คำนวนเวลา ======================= */
// map สถานะ API -> 3 สถานะบน UI
const mapStatusToUI = (code = "") => {
  const c = String(code).toLowerCase();
  if (["completed"].includes(c)) return "เสร็จสิ้น";
  if (["submitted"].includes(c)) return "รอดำเนินการ";
  if (["sent_to_agency", "in_process", "in_review", "tracking", "reviewed", "cancelled"].includes(c))
    return "กำลังดำเนินการ";
  return "รอดำเนินการ";
};

// จำนวนวัน (ปัจจุบัน - เวลาเริ่ม)
const diffDaysFrom = (startISO) => {
  try {
    const start = new Date(startISO);
    const now = new Date();
    const ms = now - start;
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  } catch {
    return 0;
  }
};

// จำนวนวันระหว่างสองเหตุการณ์
const diffDaysBetween = (startISO, endISO) => {
  try {
    const start = new Date(startISO);
    const end = new Date(endISO);
    const ms = end - start;
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  } catch {
    return 0;
  }
};

// เดาเลขอ้างอิงจาก subject ที่มักเป็นโค้ดภายนอก เช่น "นร0168..." ฯลฯ
const guessRefFromSubject = (subject) => {
  if (!subject || subject === "-") return null;
  const s = String(subject).trim();
  const hasLongDigits = (s.match(/\d/g) || []).length >= 5;
  const hasSep = /[-_/]/.test(s);
  if (hasLongDigits || hasSep) return s;
  return null;
};

// ดึงเลขที่อ้างอิงจาก payload ตามลำดับความสำคัญ
const getReferenceNumber = (item) => {
  const c = item?.complaint ?? {};
  const latest = item?.latest ?? {};
  // ✅ ให้ความสำคัญ “เลขหนังสือส่งออกล่าสุด” ก่อน
  const direct =
    latest?.sent?.reference_number ||
    c.reference_number ||
    latest?.decision?.reference_number;
  if (direct) return String(direct);

  const fromSubject = guessRefFromSubject(c.subject);
  if (fromSubject) return fromSubject;

  // fallback
  return c.complaint_number || c.id || "-";
};

// แปลง history -> แถวลูก (departmentsData)
const buildHistoryRows = (item) => {
  const c = item?.complaint ?? {};
  const latest = item?.latest ?? {};
  const history = Array.isArray(item?.history) ? item.history.slice() : [];
  if (history.length === 0) return [];

  // เรียงตามเวลา (กันข้อมูล API ไม่เรียง)
  history.sort((a, b) => new Date(a.at) - new Date(b.at));

  const refNoFallback = getReferenceNumber(item);

  return history.map((h, idx) => {
    const prevAt = idx === 0 ? c.created_at : history[idx - 1]?.at ?? c.created_at;
    const stepDays = diffDaysBetween(prevAt, h.at);

    // ค่าเริ่มต้น
    let department = "-";
    let referenceNumber = refNoFallback;
    let statusLabel = h.status_label ?? h.status ?? "-";

    if (h.type === "status_history") {
      // ถ้าเป็นสเต็ป "ส่งหน่วยงาน" ให้โชว์หน่วยงานเป้าหมาย (ถ้ามี)
      if (String(h.status).toLowerCase() === "sent_to_agency") {
        department = latest?.sent?.department_name || "-";
      }
      // statusLabel ใช้จาก status_label เดิม
    } else if (h.type === "outgoing_report") {
      // หนังสือ/รายงานส่งออก
      department = h.department_name || latest?.sent?.department_name || "-";
      referenceNumber = h.reference_number || refNoFallback;
      statusLabel = "ทำหนังสือส่งหน่วยงาน";
    }

    return {
      department,
      receiptNumber: c.complaint_number ?? "-",
      referenceNumber,
      workingDays: stepDays,
      status: statusLabel,
    };
  });
};

/* ======================= หน้ารายงานหลัก ======================= */
const StatusTrackingReport = () => {
  const router = useRouter();
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyRelated = async () => {
      try {
        setLoading(true);
        const res = await GetMyRelatedComplaints({ skip: 0, limit: 100 });
        const items = res?.res_data?.items ?? [];

        const mapped = items.map((it, idx) => {
          const c = it?.complaint ?? {};
          const latest = it?.latest ?? {};

          // ✅ หน่วยงาน: ใช้ department_name จากหนังสือล่าสุดถ้ามี
          const deptName = latest?.sent?.department_name || "-";

          return {
            id: c.id ?? idx + 1,
            claimantName: c.subject ?? "-",
            department: deptName,                         // หน่วยงาน
            responsibleOfficer: c.assigned_to || "-",     // เจ้าหน้าที่ผู้รับผิดชอบ (บุคคล)
            receiptNumber: c.complaint_number ?? "-",
            referenceNumber: getReferenceNumber(it),      // ให้เลขหนังสือล่าสุดมาก่อน
            workingDays: diffDaysFrom(c.created_at),
            status: mapStatusToUI(c.status),              // map เหลือ 3 สถานะบน UI
            departmentsData: buildHistoryRows(it),        // รายการย่อยจาก timeline
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

    fetchMyRelated();
  }, []);

  const handleSearch = (filters) => {
    const {
      claimantName: fName,
      department: fDept,
      responsibleOfficer: fOfficer,
      receiptNumber: fReceipt,
      referenceNumber: fReference,
      status: fStatus,
    } = filters;

    const norm = (v) => (v ?? "").toString().toLowerCase();

    // ไม่มีตัวกรอง -> คืนทั้งหมด
    if (!fName && !fDept && !fOfficer && !fReceipt && !fReference && !fStatus) {
      setFilteredComplaints(allComplaints);
      return;
    }

    // (ตรรกะ OR ตามเดิม — ถ้าต้องการ AND ให้เปลี่ยนเป็นตรวจทุกเงื่อนไขพร้อมกัน)
    const result = allComplaints.filter((item) => {
      if (fName && norm(item.claimantName).includes(norm(fName))) return true;
      if (fDept && item.department === fDept) return true;
      if (fOfficer && item.responsibleOfficer === fOfficer) return true;
      if (fReceipt && norm(item.receiptNumber).includes(norm(fReceipt))) return true;
      if (fReference && norm(item.referenceNumber).includes(norm(fReference))) return true;
      if (fStatus && item.status === fStatus) return true;
      return false;
    });

    setFilteredComplaints(result);
  };

  const handleNavigateTo = (item) => router.push(`/admin/edit/opm1111/${item.id}`);

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "เมนูรายงาน",
            icon: (
              <img
                src="/icons/note.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
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
          { name: "receiptNumber", label: "เลขรับ สรร.", type: "text" },
          { name: "referenceNumber", label: "เลขที่อ้างอิง", type: "text" },
          { name: "status", label: "สถานะเรื่อง", type: "select", options: statusOptions },
        ]}
      />
    </>
  );
};

export default StatusTrackingReport;
