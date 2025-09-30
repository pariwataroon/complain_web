import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListBox from "@services/TableListBox/TableListBox";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { getDocumentStorageForWebsite } from "@pages/api/document/document";

/* ---------- สถานะ: Mapping 2 ทาง + helper + สี ---------- */
const statusMapEnToTh = {
  submitted: "ส่งคำร้อง",
  sent_to_agency: "มอบหมายเจ้าหน้าที่",
  sent_to_external: "ส่งหน่วยงานภายนอก",
  in_process: "อยู่ระหว่างดำเนินการ",
  in_review: "อยู่ระหว่างการพิจารณา",
  tracking: "ติดตามผลการพิจารณา",
  reviewed: "แจ้งผลการพิจารณา",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

const statusColors = {
  submitted: "#FFA726", // ส้ม
  sent_to_agency: "#42A5F5", // ฟ้า
  sent_to_external: "#AB47BC", // ม่วง
  in_process: "#26C6DA", // ฟ้าอ่อน
  in_review: "#FFCA28", // เหลือง
  tracking: "#FF7043", // ส้มแดง
  reviewed: "#66BB6A", // เขียวอ่อน
  completed: "#4CAF50", // เขียว
  cancelled: "#EF5350", // แดง
};

const statusMapThToEn = Object.fromEntries(
  Object.entries(statusMapEnToTh).map(([en, th]) => [th, en])
);

const getThaiStatus = (en) => statusMapEnToTh[en] ?? (en || "-");
const getEnglishStatus = (th) => statusMapThToEn[th] ?? (th || "-");
const getStatusColor = (en) => statusColors[en] ?? "#9E9E9E";

/* ---------- วันเวลา: รองรับทั้ง ISO และ "16 Aug 2025" ---------- */
const formatThaiDateFlexible = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  const thaiMonths = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

const displayOrDash = (v) =>
  v === undefined || v === null || v === "" ? "-" : v;

/* ---------- แปลงข้อมูลจาก API -> แถวของตาราง ---------- */
const transformComplaintData = (apiItems) => {
  return apiItems.map((item) => {
    const clean = (s) =>
      typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s;

    const outagencyRaw =
     item.outagency ||
     item.external_agency ||
     item.outside_agency ||
     item.externalDepartment?.name ||
     item.outsideDepartment?.name ||
     item.outside_department_name ||
     "-";

    const outagency = clean(outagencyRaw);

    const id = item.id || item.complaint_id;

    const receiveDate =
      (item.receiveDate && formatThaiDateFlexible(item.receiveDate)) !== "-"
        ? formatThaiDateFlexible(item.receiveDate)
        : formatThaiDateFlexible(item.created_at);

    // Agency: ใช้เฉพาะค่า item.agency ตามคำขอ (ถ้าว่างให้เป็น "-")
    const agency = clean(displayOrDash(item.agency));

    const claimantName =
      item.complainant?.government?.fullName ??
      item.complainant?.name ??
      item.claimantName ??
      "-";

    const issue = displayOrDash(item.issue ?? item.master_complaint?.subject);
    const issueType = displayOrDash(item.issueType);
    const subIssueType = displayOrDash(item.subIssueType);

    const responsibleOfficer =
      item.responsibleOfficer ?? item.assigned_officer?.name ?? "ไม่ได้มอบหมาย";

    const statusEn = item.status || "-";
    const statusTh = getThaiStatus(statusEn);

    const complaintNumberSorn = displayOrDash(item.master_complaint?.complaint_number);

    const complaintNumber = displayOrDash(
      item.master_complaint?.complaint_number
    );

    // Determine master flag:
    // 1. If the API gives item.is_master explicitly, use that exact boolean.
    // 2. Only if it's undefined (not present) then fall back to master_complaint.is_master.
    // (Previous logic used OR which caused every child (with a master_complaint) to appear as master.)
    const isMaster =
      item.is_master !== undefined
        ? item.is_master
        : !!item.master_complaint?.is_master;
    // console.debug("Row", id, "is_master(raw)=", item.is_master, "=> isMaster=", isMaster);

    return {
      id,
      receiveDate,
      agency,
      outagency,
      claimantName,
      issue,
      issueType,
      subIssueType,
      responsibleOfficer,
      status: statusTh, // แสดงไทย
      statusEn: statusEn, // เก็บอังกฤษใช้ใน URL
      statusColor: getStatusColor(statusEn), // เพิ่มสีสำหรับแสดงผล
      note: displayOrDash(item.note),
      complaintNumber,
      isMaster,
      complaintNumberSorn,
    };
  });
};

/* ---------- สกัดค่า options จาก items (ไม่ซ้ำ/ตัดค่าว่าง/ตัด "-") ---------- */
const toOptions = (arr) =>
  Array.from(
    new Set(
      (arr || [])
        .map((v) => (typeof v === "string" ? v.trim() : v))
        .filter((v) => v && v !== "-")
    )
  ).map((v) => ({ value: v, label: v }));

const extractFilterOptionsFromItems = (items) => {
  const issueTypes = [];
  const subIssueTypes = [];
  const agencies = [];
  const officers = [];
  const statusesTh = [];

  items.forEach((item) => {
    // ประเภทเรื่อง/ย่อย
    if (item.issueType) issueTypes.push(item.issueType);
    if (item.subIssueType) subIssueTypes.push(item.subIssueType);

    // หน่วยงาน: ใช้เฉพาะ item.agency (ไม่ fallback อย่างอื่น)
    const agencyName = item.agency;
    if (agencyName) agencies.push(agencyName);

    // เจ้าหน้าที่รับผิดชอบ
    const officer = item.responsibleOfficer ?? item.assigned_officer?.name;
    if (officer) officers.push(officer);

    // สถานะ (ไทย)
    const statusTh = getThaiStatus(item.status);
    if (statusTh && statusTh !== "-") statusesTh.push(statusTh);
  });

  return {
    issueTypeOptions: toOptions(issueTypes),
    subIssueTypeOptions: toOptions(subIssueTypes),
    agencyOptions: toOptions(agencies),
    responsibleOfficerOptions: toOptions(officers),
    statusOptions: toOptions(statusesTh),
  };
};

const ComplaintArchives = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // ตัวเลือกฟิลเตอร์ที่ "ดึงจาก API"
  const [filterOptions, setFilterOptions] = useState({
    issueTypeOptions: [],
    subIssueTypeOptions: [],
    agencyOptions: [],
    responsibleOfficerOptions: [],
    statusOptions: [],
    outagencyOptions: [],
  });

  const router = useRouter();

  /* ---------- ค้นหา/กรอง ---------- */
  const handleSearch = (filters) => {
    const norm = (s) =>
     String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
    const getVal = (v) =>
     typeof v === "string" ? v : v?.value ?? v?.label ?? "";

    const result = allComplaints.filter((item) => {
      let ok = true;

      if (filters.claimantName && filters.claimantName.trim() !== "") {
        const q = filters.claimantName.toLowerCase();
        ok = ok && (item.claimantName || "").toLowerCase().includes(q);
      }

      if (filters.issue && filters.issue.trim() !== "") {
        const q = filters.issue.toLowerCase();
        ok = ok && (item.issue || "").toLowerCase().includes(q);
      }

      if (filters.issueType && filters.issueType !== "") {
        ok = ok && item.issueType === filters.issueType;
      }

      if (filters.subIssueType && filters.subIssueType !== "") {
        ok = ok && item.subIssueType === filters.subIssueType;
      }

      if (filters.complaintNumberSorn && filters.complaintNumberSorn.trim() !== "") {
        const q = filters.complaintNumberSorn.toLowerCase();
        ok = ok && (item.complaintNumberSorn || "").toLowerCase().includes(q);
      }

      if (getVal(filters.agency)) {
       const q = norm(getVal(filters.agency));
       ok =
         ok &&
         (norm(item.agency).includes(q) || norm(item.outagency).includes(q));
     }

     if (getVal(filters.outagency)) {
       const q = norm(getVal(filters.outagency));
       ok =
         ok &&
         (norm(item.outagency).includes(q) || norm(item.agency).includes(q));
     }

      if (filters.responsibleOfficer && filters.responsibleOfficer !== "") {
        ok = ok && item.responsibleOfficer === filters.responsibleOfficer;
      }

      if (filters.status && filters.status !== "") {
        ok = ok && item.status === filters.status; // เทียบภาษาไทยในตาราง
      }

      if (filters.complaintNumber && filters.complaintNumber.trim() !== "") {
        const q = filters.complaintNumber.toLowerCase();
        ok = ok && (item.complaintNumber || "").toLowerCase().includes(q);
      }

      return ok;
    });

    setFilteredComplaints(result);
  };

  const handleResetSearch = () => {
    setFilteredComplaints(allComplaints);
  };

  /* ---------- คลิกแถว -> ไปหน้ารายการ พร้อมพารามิเตอร์สถานะที่ถูกต้อง ---------- */
  const handleRowClick = (item) => {
    const englishStatus = item.statusEn || getEnglishStatus(item.status);
    router.push(`/admin/box/list/${item.id}?status=${englishStatus}`);
  };

  /* ---------- โหลดข้อมูลจาก API ---------- */
  useEffect(() => {
    const fetchDocumentStorage = async () => {
      try {
        setLoading(true);
        const res = await getDocumentStorageForWebsite({ skip: 0, limit: 10000 });
        const items = res?.res_data?.items ?? [];

        // 1) แปลงข้อมูลเพื่อแสดงผล
        const transformed = transformComplaintData(items);
        setAllComplaints(transformed);
        setFilteredComplaints(transformed);

        // 2) สกัด options จาก API items
        const opts = extractFilterOptionsFromItems(items);

        // ถ้าอยาก merge กับชุดสถานะที่รองรับทั้งหมดจากระบบ (ไม่จำกัดเฉพาะที่มีในหน้า):
        // รวมสถานะไทยจาก mapping ทั้งหมด + ที่พบจริง แล้ว unique
        const allStatusTh = Array.from(
          new Set([
            ...Object.values(statusMapEnToTh),
            ...opts.statusOptions.map((o) => o.value),
          ])
        ).map((v) => ({ value: v, label: v }));

        setFilterOptions({
          issueTypeOptions: opts.issueTypeOptions,
          subIssueTypeOptions: opts.subIssueTypeOptions,
          agencyOptions: opts.agencyOptions,
          responsibleOfficerOptions: opts.responsibleOfficerOptions,
          statusOptions: allStatusTh,
        });
      } catch (err) {
        console.error("Error fetching document storage:", err);
        setAllComplaints([]);
        setFilteredComplaints([]);
        // ถ้า error ให้ยังแสดงตัวเลือกสถานะจาก mapping ไว้ก่อน
        setFilterOptions((prev) => ({
          ...prev,
          statusOptions: Object.values(statusMapEnToTh).map((th) => ({
            value: th,
            label: th,
          })),
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentStorage();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          fontSize: "18px",
        }}
      >
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "เมนูคลังเอกสาร",
            icon: <Inventory2Icon sx={{ width: 24, height: 24, mb: -1 }} />,
          },
          { label: "คลังเรื่องราวร้องทุกข์" },
        ]}
      />

      <TableListBox
        data={filteredComplaints}
        title="คลังเรื่องราวร้องทุกข์"
        navigateTo=""
        onRowClick={handleRowClick}
        onSearch={handleSearch}
        onResetSearch={handleResetSearch}
        filterFields={[
          { name: "claimantName", label: "ชื่อผู้ร้อง", type: "text" },
          { name: "issue", label: "เรื่อง", type: "text" },
          {
            name: "issueType",
            label: "ประเภทเรื่อง",
            type: "select",
            options: filterOptions.issueTypeOptions,
          },
          {
            name: "subIssueType",
            label: "ประเภทเรื่องย่อย",
            type: "select",
            options: filterOptions.subIssueTypeOptions,
          },
          {
            name: "agency",
            label: "หน่วยงาน",
            type: "select",
            options: filterOptions.agencyOptions,
          },
          {
            name: "outagency",
            label: "หน่วยงานภายนอก",
            type: "select",
            options: filterOptions.outagencyOptions,
          },
          {
            name: "responsibleOfficer",
            label: "เจ้าหน้าที่รับผิดชอบ",
            type: "select",
            options: filterOptions.responsibleOfficerOptions,
          },
          {
            name: "status",
            label: "สถานะเรื่อง",
            type: "select",
            options: filterOptions.statusOptions,
          },
          {
            name: "complaintNumberSorn",
            label: "เลข สรร.",
            type: "text",
          },
        ]}
      />
    </>
  );
};

export default ComplaintArchives;