import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListBox from "@services/TableListBox/TableListBox";
import { getDocumentStorageForCard } from "@pages/api/document/document";

/* ---------- สถานะ: Mapping 2 ทาง + helper ---------- */
const statusMapEnToTh = {
  submitted: "รับเรื่อง",
  sent_to_agency: "ส่งหน่วยงาน",
  in_process: "กำลังดำเนินการ",
  in_review: "อยู่ระหว่างพิจารณา",
  tracking: "ติดตามผล",
  reviewed: "แจ้งผลการพิจารณา",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};
const statusMapThToEn = Object.fromEntries(
  Object.entries(statusMapEnToTh).map(([en, th]) => [th, en])
);
const getThaiStatus = (en) => statusMapEnToTh[en] ?? (en || "-");
const getEnglishStatus = (th) => statusMapThToEn[th] ?? (th || "-");

/* ---------- วันเวลา: รองรับทั้ง ISO และ "16 Aug 2025" ---------- */
const formatThaiDateFlexible = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  const thaiMonths = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

const displayOrDash = (v) => (v === undefined || v === null || v === "" ? "-" : v);

/* ---------- แปลงข้อมูลจาก API -> แถวของตาราง ---------- */
const transformComplaintData = (apiItems) => {
  return apiItems.map((item) => {
    const id = item.id || item.complaint_id;

    const receiveDate =
      (item.receiveDate && formatThaiDateFlexible(item.receiveDate)) !== "-"
        ? formatThaiDateFlexible(item.receiveDate)
        : formatThaiDateFlexible(item.created_at);

    const agency =
      item.complainant?.government?.agencyName?.name ??
      item.agency ??
      "-";

    const claimantName =
      item.complainant?.government?.fullName ??
      item.complainant?.name ??
      item.claimantName ??
      "-";

    const issue = displayOrDash(item.issue ?? item.master_complaint?.subject);
    const issueType = displayOrDash(item.issueType);
    const subIssueType = displayOrDash(item.subIssueType);

    const responsibleOfficer =
      item.responsibleOfficer ??
      item.assigned_officer?.name ??
      "ไม่ได้มอบหมาย";

    const statusEn = item.status || "-";
    const statusTh = getThaiStatus(statusEn);

    const complaintNumber = displayOrDash(item.master_complaint?.complaint_number);

    return {
      id,
      receiveDate,
      agency,
      claimantName,
      issue,
      issueType,
      subIssueType,
      responsibleOfficer,
      status: statusTh,   // สำหรับแสดง
      statusEn: statusEn, // สำหรับ URL
      note: displayOrDash(item.note),
      complaintNumber,
    };
  });
};

/* ---------- สกัด options จาก items (unique/ตัดค่าว่าง/ตัด "-") ---------- */
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
    if (item.issueType) issueTypes.push(item.issueType);
    if (item.subIssueType) subIssueTypes.push(item.subIssueType);

    const agencyName = item.complainant?.government?.agencyName?.name ?? item.agency;
    if (agencyName) agencies.push(agencyName);

    const officer = item.responsibleOfficer ?? item.assigned_officer?.name;
    if (officer) officers.push(officer);

    const statusTh = getThaiStatus(item.status);
    if (statusTh && statusTh !== "-") statusesTh.push(statusTh);
  });

  // รวมสถานะที่ระบบรองรับทั้งหมดด้วย (กันกรณีหน้าแรกยังไม่ปรากฏทุกสถานะ)
  const allStatusTh = Array.from(
    new Set([
      ...Object.values(statusMapEnToTh),
      ...statusesTh,
    ])
  );

  return {
    issueTypeOptions: toOptions(issueTypes),
    subIssueTypeOptions: toOptions(subIssueTypes),
    agencyOptions: toOptions(agencies),
    responsibleOfficerOptions: toOptions(officers),
    statusOptions: allStatusTh.map((v) => ({ value: v, label: v })),
  };
};

const AnonymousLetterRepository = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // ตัวเลือกฟิลเตอร์ที่สกัดมาจาก API
  const [filterOptions, setFilterOptions] = useState({
    issueTypeOptions: [],
    subIssueTypeOptions: [],
    agencyOptions: [],
    responsibleOfficerOptions: [],
    statusOptions: [],
  });

  const router = useRouter();

  /* ---------- ค้นหา/กรอง ---------- */
  const handleSearch = (filters) => {
    const result = allComplaints.filter((item) => {
      let ok = true;

      // text fields → includes
      if (filters.claimantName && filters.claimantName.trim() !== "") {
        const q = filters.claimantName.toLowerCase();
        ok = ok && (item.claimantName || "").toLowerCase().includes(q);
      }

      if (filters.issue && filters.issue.trim() !== "") {
        const q = filters.issue.toLowerCase();
        ok = ok && (item.issue || "").toLowerCase().includes(q);
      }

      if (filters.complaintNumber && filters.complaintNumber.trim() !== "") {
        const q = filters.complaintNumber.toLowerCase();
        ok = ok && (item.complaintNumber || "").toLowerCase().includes(q);
      }

      // select fields → exact match
      if (filters.issueType && filters.issueType !== "") {
        ok = ok && item.issueType === filters.issueType;
      }
      if (filters.subIssueType && filters.subIssueType !== "") {
        ok = ok && item.subIssueType === filters.subIssueType;
      }
      if (filters.agency && filters.agency !== "") {
        ok = ok && item.agency === filters.agency;
      }
      if (filters.responsibleOfficer && filters.responsibleOfficer !== "") {
        ok = ok && item.responsibleOfficer === filters.responsibleOfficer;
      }
      if (filters.status && filters.status !== "") {
        ok = ok && item.status === filters.status; // status แสดงเป็นไทยในตาราง
      }

      return ok;
    });

    setFilteredComplaints(result);
  };

  // ฟังก์ชันสำหรับรีเซ็ตการค้นหา
  const handleResetSearch = () => {
    setFilteredComplaints(allComplaints);
  };

  // คลิกแถว -> ไปหน้ารายการ พร้อมพารามิเตอร์สถานะ (อังกฤษ)
  const handleRowClick = (item) => {
    const englishStatus = item.statusEn || getEnglishStatus(item.status);
    router.push(`/admin/box/new/${item.id}?status=${englishStatus}`);
  };

  /* ---------- โหลดข้อมูลจาก API ---------- */
  useEffect(() => {
    const fetchDocumentStorage = async () => {
      try {
        setLoading(true);
        const res = await getDocumentStorageForCard({ skip: 0, limit: 100 });
        const items = res?.res_data?.items ?? [];

        // แปลงข้อมูลแสดงผล
        const transformedData = transformComplaintData(items);
        setAllComplaints(transformedData);
        setFilteredComplaints(transformedData);

        // สกัดฟิลเตอร์จาก API
        const opts = extractFilterOptionsFromItems(items);
        setFilterOptions(opts);
      } catch (err) {
        console.error("Error fetching document storage:", err);
        setAllComplaints([]);
        setFilteredComplaints([]);
        // อย่างน้อยแสดงตัวเลือกสถานะจาก mapping
        setFilterOptions((prev) => ({
          ...prev,
          statusOptions: Object.values(statusMapEnToTh).map((v) => ({ value: v, label: v })),
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
            label: "ติดตามผลการดำเนินการ",
            icon: (
              <img
                src="/icons/Cube.png"
                alt="cube"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          { label: "คลังบัตรสนเท่ห์" },
        ]}
      />

      <TableListBox
        data={filteredComplaints}
        title="คลังบัตรสนเท่ห์"
        navigateTo=""
        onRowClick={handleRowClick}
        onSearch={handleSearch}
        onResetSearch={handleResetSearch}
        filterFields={[
          { name: "claimantName", label: "ชื่อผู้ร้อง", type: "text" },
          { name: "issue", label: "เรื่อง", type: "text" },
          { name: "issueType", label: "ประเภทเรื่อง", type: "select", options: filterOptions.issueTypeOptions },
          { name: "subIssueType", label: "ประเภทเรื่องย่อย", type: "select", options: filterOptions.subIssueTypeOptions },
          { name: "agency", label: "หน่วยงาน", type: "select", options: filterOptions.agencyOptions }, // แก้จาก accusedName -> agency
          { name: "responsibleOfficer", label: "เจ้าหน้าที่รับผิดชอบ", type: "select", options: filterOptions.responsibleOfficerOptions },
          { name: "status", label: "สถานะเรื่อง", type: "select", options: filterOptions.statusOptions },
        ]}
      />
    </>
  );
};

export default AnonymousLetterRepository;
