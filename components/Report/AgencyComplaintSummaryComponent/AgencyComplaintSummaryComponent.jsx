import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListAgency from "@services/TableListAgency/TableListAgency";
import { GetAgencyComplaintReport } from "@pages/api/report/report";

// ─── สถานะ (label ไทย) จากหน้ารายงานผู้ตรวจ ─────────────────────
const STATUS_LABELS = [
  "ทั้งหมด",
  "ทราบ",
  "ทราบไว้ชั้นหนึ่ง",
  "ยุติเรื่องได้",
  "เห็นชอบ",
  "อยู่ระหว่างดำเนินการ",
];
const statusFilterOptions = STATUS_LABELS.map((l) => ({ value: l, label: l }));

// ─── ฟังก์ชันแปลงวันที่ไทยเป็น Date object ─────────────────────────────────
const parseThaiDate = (thaiDateStr) => {
  if (!thaiDateStr) return null;

  const thaiMonths = {
    "ม.ค.": 0,
    "ก.พ.": 1,
    "มี.ค.": 2,
    "เม.ย.": 3,
    "พ.ค.": 4,
    "มิ.ย.": 5,
    "ก.ค.": 6,
    "ส.ค.": 7,
    "ก.ย.": 8,
    "ต.ค.": 9,
    "พ.ย.": 10,
    "ธ.ค.": 11,
  };

  const parts = thaiDateStr.trim().split(" ");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0]);
  const thaiMonth = parts[1];
  const buddhistYear = parseInt(parts[2]);
  const month = thaiMonths[thaiMonth];
  if (month === undefined) return null;
  const year = buddhistYear - 543;

  return new Date(year, month, day);
};

// ─── ฟังก์ชันแปลง Date object เป็นวันที่ไทย ─────────────────────────────────
const formatToThaiDate = (date) => {
  if (!date) return "";

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

  const day = date.getDate().toString().padStart(2, "0");
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;

  return `${day} ${month} ${year}`;
};

const AgencyComplaintSummary = () => {
  console.log("[AgencyComplaintSummary] Component rendered!");

  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch data on mount
  useEffect(() => {
    console.log("[AgencyComplaintSummary] useEffect triggered, calling fetchData...");
    fetchData();
  }, []);

  const fetchData = async (filters = {}) => {
    setLoading(true);
    console.log("[AgencyComplaintSummary] Starting fetch with filters:", filters);
    try {
      const year = filters.year || 2025; // ใช้ 2025 เป็น default
      console.log("[AgencyComplaintSummary] Year:", year);

      // แปลงวันที่เป็น ISO format (YYYY-MM-DD) สำหรับ API
      let date_from = "";
      let date_to = "";

      if (filters.startDate) {
        const fromDate = new Date(filters.startDate);
        let fromYear = fromDate.getFullYear();
        // แปลงเป็น ค.ศ. ถ้าเป็น พ.ศ.
        if (fromYear > 2500) {
          fromYear -= 543;
        }
        date_from = `${fromYear}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
      }

      if (filters.endDate) {
        const toDate = new Date(filters.endDate);
        let toYear = toDate.getFullYear();
        // แปลงเป็น ค.ศ. ถ้าเป็น พ.ศ.
        if (toYear > 2500) {
          toYear -= 543;
        }
        date_to = `${toYear}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`;
      }

      console.log("[AgencyComplaintSummary] Calling API with params:", {
        skip: 0,
        limit: 100,
        year,
        date_from,
        date_to,
        status: filters.status || "",
        agency: filters.agency || "",
        responsibleOfficer: filters.responsibleOfficer || "",
        claimantName: filters.claimantName || ""
      });

      const res = await GetAgencyComplaintReport(
        0,
        1000, // ดึงข้อมูลสูงสุด 1000 รายการ (API limit)
        year,
        date_from,
        date_to,
        "", // department_id
        filters.status || "",
        filters.agency || "",
        filters.responsibleOfficer || "",
        filters.claimantName || ""
      );

      console.log("[AgencyComplaintSummary] API Response:", res);
      const rawItems = res?.res_data?.items || [];

      // API /reports/agency-complaint/list ส่งข้อมูลแบบ flat object แล้ว
      // fields: claimantName, receiptNumber, receiveDate, agency, issue, issueType, note, responsibleOfficer, status
      const items = rawItems.map((item) => ({
        id: item.id,
        claimantName: item.claimantName || "-",
        receiptNumber: item.receiptNumber || "-",
        receiveDate: item.receiveDate || "-",
        agency: item.agency || "-",
        issue: item.issue || "-",
        issueType: item.issueType || "-",
        note: item.note || "-",
        responsibleOfficer: item.responsibleOfficer || "-",
        status: item.status || "-",
      }));

      console.log("[AgencyComplaintSummary] Items count:", items.length);
      console.log("[AgencyComplaintSummary] First item sample:", items[0]);
      setAllComplaints(items);
      setFilteredComplaints(items);
    } catch (error) {
      console.error("[AgencyComplaintSummary] Error fetching agency complaint report:", error);
      setAllComplaints([]);
      setFilteredComplaints([]);
    }
    setLoading(false);
  };

  const handleSearch = async (filters) => {
    // แปลง "ทั้งหมด" เป็น empty string
    if (filters.status === "ทั้งหมด") {
      filters.status = "";
    }

    // เรียก API ใหม่ด้วย filters
    await fetchData(filters);
  };

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "เมนูรายงาน",
            icon: (
              <img
                src="/icons/Cube.png"
                alt="cube"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          { label: "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน" },
        ]}
      />

      <TableListAgency
        data={filteredComplaints}
        loading={loading}
        title="รายงานสรุปเรื่องร้องเรียนของหน่วยงาน"
        navigateTo="/admin/edit/website-complaints"
        onSearch={handleSearch}
        statusOptions={statusFilterOptions}
      />
    </>
  );
};

export default AgencyComplaintSummary;