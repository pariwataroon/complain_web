import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListCollaps from "@services/TableListCollaps/TableListCollaps";
import {
  GetMyRelatedComplaints,
  GetDepartments,
} from "@pages/api/complaint/complaint";

/* ======================= ตัวเลือกฟิลเตอร์ (static แค่บางอัน) ======================= */
const statusOptions = [
  { value: "รอดำเนินการ", label: "รอดำเนินการ" },
  { value: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
  { value: "เสร็จสิ้น", label: "เสร็จสิ้น" },
];

// ✅ Mockup Department Options
const mockupDepartmentOptions = [
  { value: "กรมสรรพากร", label: "กรมสรรพากร" },
  { value: "กรมศุลกากร", label: "กรมศุลกากร" },
  { value: "กรมบัญชีกลาง", label: "กรมบัญชีกลาง" },
  { value: "กรมสรรพสามิต", label: "กรมสรรพสามิต" },
  { value: "กรมธนารักษ์", label: "กรมธนารักษ์" },
  { value: "สำนักงานเศรษฐกิจการคลัง", label: "สำนักงานเศรษฐกิจการคลัง" },
  { value: "สำนักงานบริหารหนี้สาธารณะ", label: "สำนักงานบริหารหนี้สาธารณะ" },
  { value: "สำนักงานประกันสังคม", label: "สำนักงานประกันสังคม" },
  { value: "ธนาคารแห่งประเทศไทย", label: "ธนาคารแห่งประเทศไทย" },
  { value: "ธนาคารออมสิน", label: "ธนาคารออมสิน" },
  { value: "ธนาคารอาคารสงเคราะห์", label: "ธนาคารอาคารสงเคราะห์" },
  { value: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร", label: "ธ.ก.ส." },
  {
    value: "ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย",
    label: "ธนาคารเอ็กซิม",
  },
  {
    value: "ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย",
    label: "ธนาคาร SME",
  },
  {
    value: "สำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์",
    label: "ก.ล.ต.",
  },
  {
    value: "สำนักงานคณะกรรมการกำกับและส่งเสริมการประกอบธุรกิจประกันภัย",
    label: "คปภ.",
  },
  { value: "บรรษัทประกันเงินฝากแห่งประเทศไทย", label: "บปง." },
  { value: "สำนักงานหลักประกันสุขภาพแห่งชาติ", label: "สปสช." },
  { value: "กองทุนบำเหน็จบำนาญข้าราชการ", label: "กบข." },
  { value: "กองทุนประกันสังคม", label: "กองทุนประกันสังคม" },
  { value: "สำนักงานเลขาธิการนายกรัฐมนตรี", label: "สลน.นายกฯ" },
  { value: "กรมโยธาธิการและผังเมือง", label: "กรมโยธาฯ" },
  { value: "กรมการขนส่งทางบก", label: "กรมการขนส่งทางบก" },
  { value: "กรมเจ้าท่า", label: "กรมเจ้าท่า" },
  { value: "การรถไฟแห่งประเทศไทย", label: "รฟท." },
  { value: "การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย", label: "กฟผ." },
  { value: "การไฟฟ้านครหลวง", label: "กฟน." },
  { value: "การไฟฟ้าส่วนภูมิภาค", label: "กฟภ." },
  { value: "การประปานครหลวง", label: "กปน." },
  { value: "การประปาส่วนภูมิภาค", label: "กปภ." },
  { value: "บริษัท ปตท. จำกัด (มหาชน)", label: "ปตท." },
  { value: "บริษัท บางจาก คอร์ปอเรชั่น จำกัด (มหาชน)", label: "บางจาก" },
  { value: "บริษัท ไทยออยล์ จำกัด (มหาชน)", label: "ไทยออยล์" },
  { value: "ธนาคารกรุงไทย จำกัด (มหาชน)", label: "ธนาคารกรุงไทย" },
  { value: "ธนาคารกรุงศรีอยุธยา จำกัด (มหาชน)", label: "ธนาคารกรุงศรี" },
  { value: "ธนาคารไทยพาณิชย์ จำกัด (มหาชน)", label: "ธนาคารไทยพาณิชย์" },
  { value: "ธนาคารกสิกรไทย จำกัด (มหาชน)", label: "ธนาคารกสิกรไทย" },
  { value: "ธนาคารธนชาต จำกัด (มหาชน)", label: "ธนาคารธนชาต" },
  { value: "ธนาคารทหารไทยธนชาต จำกัด (มหาชน)", label: "ธนาคารทหารไทย" },
  { value: "สำนักงานตำรวจแห่งชาติ", label: "สำนักงานตำรวจแห่งชาติ" },
  { value: "กรมราชทัณฑ์", label: "กรมราชทัณฑ์" },
  { value: "กรมป้องกันและบรรเทาสาธารณภัย", label: "กรมป้องกันฯ" },
  {
    value: "สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ",
    label: "ป.ป.ช.",
  },
  { value: "สำนักงานคณะกรรมการป้องกันและปราบปรามยาเสพติด", label: "ป.ป.ส." },
];

/* ======================= Utils ======================= */
const mapStatusToUI = (code = "") => {
  const c = String(code).toLowerCase();
  if (["completed"].includes(c)) return "เสร็จสิ้น";
  if (["submitted"].includes(c)) return "รอดำเนินการ";
  if (
    [
      "sent_to_agency",
      "in_process",
      "in_review",
      "tracking",
      "reviewed",
      "cancelled",
    ].includes(c)
  )
    return "กำลังดำเนินการ";
  return "รอดำเนินการ";
};

const diffDaysFrom = (startISO) => {
  try {
    const start = new Date(startISO);
    const now = new Date();
    const ms = now - start;
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
};

const diffDaysBetween = (startISO, endISO) => {
  try {
    const start = new Date(startISO);
    const end = new Date(endISO);
    const ms = end - start;
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
};

const guessRefFromSubject = (subject) => {
  if (!subject || subject === "-") return null;
  const s = String(subject).trim();
  const hasLongDigits = (s.match(/\d/g) || []).length >= 5;
  const hasSep = /[-_/]/.test(s);
  if (hasLongDigits || hasSep) return s;
  return null;
};

const getReferenceNumber = (item) => {
  const c = item?.complaint ?? {};
  const latest = item?.latest ?? {};
  const direct =
    latest?.sent?.reference_number ||
    c.reference_number ||
    latest?.decision?.reference_number;
  if (direct) return String(direct);

  const fromSubject = guessRefFromSubject(c.subject);
  if (fromSubject) return fromSubject;

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
    const prevAt =
      idx === 0 ? c.created_at : history[idx - 1]?.at ?? c.created_at;
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
  const [departmentOptions, setDepartmentOptions] = useState(
    mockupDepartmentOptions
  ); // ✅ เริ่มต้นด้วย mockup
  const [responsibleOfficerOptions, setResponsibleOfficerOptions] = useState(
    []
  );

  // โหลดข้อมูลเรื่องร้องเรียน
  useEffect(() => {
    const fetchMyRelated = async () => {
      try {
        setLoading(true);
        const res = await GetMyRelatedComplaints({ skip: 0, limit: 100 });
        console.log("GetMyRelatedComplaints response:", res); // Debug log

        const items = res?.res_data?.items ?? [];

        const mapped = items.map((it, idx) => {
          const c = it?.complaint ?? {};
          const latest = it?.latest ?? {};

          // ปรับปรุงการดึงข้อมูลหน่วยงานจาก API response
          let deptName = "-";

          // ลองดึงจาก assigned_to ก่อน
          if (c.assigned_to) {
            deptName = c.assigned_to;
          }
          // หรือจาก latest sent department
          else if (latest?.sent?.department_name) {
            deptName = latest.sent.department_name;
          }
          // หรือจาก history
          else if (Array.isArray(it?.history)) {
            const sentHistory = it.history.find(
              (h) =>
                h.type === "status_history" &&
                String(h.status).toLowerCase() === "sent_to_agency"
            );
            if (sentHistory?.department_name) {
              deptName = sentHistory.department_name;
            }
          }

          return {
            id: c.id ?? `temp_${idx + 1}`,
            claimantName: c.subject ?? "-",
            department: deptName,
            responsibleOfficer: c.assigned_to || "-",
            receiptNumber: c.complaint_number ?? "-",
            referenceNumber: getReferenceNumber(it),
            workingDays: diffDaysFrom(c.created_at),
            status: mapStatusToUI(c.status),
            departmentsData: buildHistoryRows(it),
            rawData: it,
          };
        });

        console.log("Mapped complaints:", mapped); // Debug log
        setAllComplaints(mapped);
        setFilteredComplaints(mapped);

        // ✅ รวม department options จาก API กับ mockup (ไม่ซ้ำ)
        const uniqueDepartments = [
          ...new Set(
            mapped
              .map((item) => item.department)
              .filter((dept) => dept && dept !== "-")
          ),
        ].sort();

        const dynamicDeptOptions = uniqueDepartments.map((dept) => ({
          value: dept,
          label: dept,
        }));

        // รวม mockup กับ dynamic options และเอาซ้ำออก
        const combinedDeptOptions = [
          ...mockupDepartmentOptions,
          ...dynamicDeptOptions,
        ];
        const uniqueDeptOptions = combinedDeptOptions
          .filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.value === item.value)
          )
          .sort((a, b) => a.label.localeCompare(b.label));

        setDepartmentOptions(uniqueDeptOptions);
        console.log("Combined Department options:", uniqueDeptOptions); // Debug log

        // สร้าง responsible officer options จาก assigned_to
        const uniqueOfficers = [
          ...new Set(
            mapped
              .map((item) => item.responsibleOfficer)
              .filter((officer) => officer && officer !== "-")
          ),
        ].sort();

        const dynamicOfficerOptions = uniqueOfficers.map((officer) => ({
          value: officer,
          label: officer,
        }));

        setResponsibleOfficerOptions(dynamicOfficerOptions);
        console.log("Responsible Officer options:", dynamicOfficerOptions); // Debug log
      } catch (e) {
        console.error("Error fetching my-related complaints:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRelated();
  }, []);

  // โหลดหน่วยงานจาก API (backup option)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await GetDepartments();
        const list = res?.res_data ?? [];
        const apiDeptOptions = list.map((d) => ({
          value: d.name,
          label: d.name,
        }));

        // รวม API options กับ options ที่มีอยู่แล้ว
        setDepartmentOptions((prev) => {
          const combined = [...prev, ...apiDeptOptions];
          const unique = combined.filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.value === item.value)
          );
          return unique.sort((a, b) => a.label.localeCompare(b.label));
        });
      } catch (e) {
        console.error("Error fetching departments:", e);
      }
    };

    fetchDepartments();
  }, []);

  const handleSearch = (filters) => {
    console.log("Search filters:", filters); // Debug log

    const {
      claimantName: fName,
      department: fDept,
      responsibleOfficer: fOfficer,
      receiptNumber: fReceipt,
      referenceNumber: fReference,
      status: fStatus,
    } = filters;

    const norm = (v) => (v ?? "").toString().toLowerCase().trim();

    // ถ้าไม่มีฟิลเตอร์อะไรเลย ให้แสดงทั้งหมด
    if (!fName && !fDept && !fOfficer && !fReceipt && !fReference && !fStatus) {
      setFilteredComplaints(allComplaints);
      return;
    }

    const result = allComplaints.filter((item) => {
      let match = false;

      // ใช้ OR logic - ถ้าตรงเงื่อนไขไหนก็ผ่าน
      if (fName && norm(item.claimantName).includes(norm(fName))) match = true;
      if (fDept && norm(item.department).includes(norm(fDept))) match = true;
      if (fOfficer && norm(item.responsibleOfficer).includes(norm(fOfficer)))
        match = true;
      if (fReceipt && norm(item.receiptNumber).includes(norm(fReceipt)))
        match = true;
      if (fReference && norm(item.referenceNumber).includes(norm(fReference)))
        match = true;
      if (fStatus && norm(item.status) === norm(fStatus)) match = true;

      return match;
    });

    console.log("Filtered results:", result); // Debug log
    setFilteredComplaints(result);
  };

  const handleNavigateTo = (item) => {
    console.log("Navigate to item:", item);
    router.push(`/admin/edit/opm1111/${item.id}`);
  };

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
          {
            name: "department",
            label: "หน่วยงาน",
            type: "select",
            options: departmentOptions, // ✅ ใช้ options ที่รวม mockup แล้ว
          },
          {
            name: "responsibleOfficer",
            label: "เจ้าหน้าที่ผู้รับผิดชอบ",
            type: "select",
            options: responsibleOfficerOptions,
          },
          { name: "receiptNumber", label: "เลขรับ สรร.", type: "text" },
          { name: "referenceNumber", label: "เลขที่อ้างอิง", type: "text" },
          {
            name: "status",
            label: "สถานะเรื่อง",
            type: "select",
            options: statusOptions,
          },
        ]}
      />
    </>
  );
};

export default StatusTrackingReport;
