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
  if (!date || isNaN(date.getTime())) return "-";

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
    // เคลียร์ข้อมูลเก่าก่อนโหลดใหม่ เพื่อไม่ให้แสดงข้อมูลค้างจากหน่วยงานก่อนหน้า
    setFilteredComplaints([]);
    console.log("[AgencyComplaintSummary] Starting fetch with filters:", filters);
    try {
      const year = filters.year || new Date().getFullYear(); // ใช้ปีปัจจุบันเป็น default
      console.log("[AgencyComplaintSummary] Year:", year);

      // แปลงวันที่เป็น ISO format (YYYY-MM-DD) สำหรับ API
      // ถ้าไม่เลือกวันที่ ให้ใช้ default เป็นต้นปีถึงสิ้นปีของปีที่เลือก
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
      } else {
        // Default: 1 ม.ค. ของปีที่เลือก
        date_from = `${year}-01-01`;
      }

      if (filters.endDate) {
        const toDate = new Date(filters.endDate);
        let toYear = toDate.getFullYear();
        // แปลงเป็น ค.ศ. ถ้าเป็น พ.ศ.
        if (toYear > 2500) {
          toYear -= 543;
        }
        date_to = `${toYear}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`;
      } else {
        // Default: 31 ธ.ค. ของปีที่เลือก
        date_to = `${year}-12-31`;
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

      const rawItems = res?.res_data?.items || [];

      // Debug: แสดง raw item แรกเพื่อตรวจสอบ field names
      // API /reports/agency-complaint/list ส่งข้อมูลแบบ flat object แล้ว
      // fields: claimantName, receiptNumber, receiveDate, agency, issue, issueType, note, responsibleOfficer, status
      // receiveDate จาก API เป็น format ไทยอยู่แล้ว เช่น "30 ต.ค. 2568"
      const getReceiveDate = (item) => {
        const dateValue = item.receiveDate || item.receivedDate || item.received_date || item.receive_date;
        if (!dateValue) return "-";
        // ถ้าเป็น format ไทยอยู่แล้ว (มี ม.ค., "ก.พ.", ฯลฯ) ให้ใช้ค่าเดิม
        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        const isThaiFormat = thaiMonths.some(m => dateValue.includes(m));
        if (isThaiFormat) return dateValue;
        // ถ้าเป็น ISO format ให้แปลงเป็นไทย
        const date = new Date(dateValue);
        return formatToThaiDate(date);
      };

      const items = rawItems.map((item) => ({
        id: item.id,
        claimantName: item.claimantName || item.claimant_name || "-",
        receiptNumber: item.receiptNumber || item.receipt_number || "-",
        // แปลงวันที่เป็นรูปแบบไทย ถ้ามีข้อมูล
        receiveDate: getReceiveDate(item),
        agency: item.agency || "-",
        issue: item.issue || "-",
        issueType: item.issueType || item.issue_type || "-",
        note: item.note || "-",
        // รองรับหลายรูปแบบ field name: responsibleOfficer, responsible_officer
        responsibleOfficer: item.responsibleOfficer || item.responsible_officer || "-",
        status: item.status || "-",
        filing_type: item.filing_type || item.complaint_filing_type || null,
      }));

      // กรองข้อมูลซ้ำโดยใช้ id เป็นหลัก (เก็บ item ล่าสุดสำหรับแต่ละ id)
      // เพื่อให้สถานะแสดงเป็นค่าล่าสุด ไม่ใช่ค่าแรกสุด
      // และกรองเรื่องร้องเพิ่มเติมออก (เฉพาะเรื่องร้องเรียนหลัก)
      const itemMap = new Map();
      items.forEach((item) => {
        // กรองเรื่องร้องเพิ่มเติมออก (filing_type = "additional")
        if (item.filing_type === "additional") return;
        // เก็บ item ล่าสุดสำหรับแต่ละ id (ถ้าซ้ำจะ overwrite ด้วยข้อมูลล่าสุด)
        itemMap.set(item.id, item);
      });
      const uniqueItems = Array.from(itemMap.values());

      console.log("[AgencyComplaintSummary] Raw items:", items.length, "Unique items:", uniqueItems.length);
      setAllComplaints(uniqueItems);
      setFilteredComplaints(uniqueItems);
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