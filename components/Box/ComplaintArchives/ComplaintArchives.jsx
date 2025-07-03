import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListBox from "@services/TableListBox/TableListBox";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { getDocumentStorage } from "@pages/api/document/document";

const issueTypeOptions = [
  { value: "ภารกิจ", label: "ภารกิจ" },
  { value: "การแก้ไขปัญหาหนี้สิน", label: "การแก้ไขปัญหาหนี้สิน" },
  {
    value: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    label: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
  },
  { value: "นโยบายรัฐฯ ด้านสวัสดิการ", label: "นโยบายรัฐฯ ด้านสวัสดิการ" },
  { value: "การคอร์รัปชัน", label: "การคอร์รัปชัน" },
  { value: "การบริการสาธารณะ", label: "การบริการสาธารณะ" },
  { value: "การเรียกรับผลประโยชน์", label: "การเรียกรับผลประโยชน์" },
  { value: "ทุจริต", label: "ทุจริต" },
  { value: "การซื้อขายออนไลน์", label: "การซื้อขายออนไลน์" },
  { value: "ประพฤติมิชอบ", label: "ประพฤติมิชอบ" },
  { value: "ฉ้อโกง", label: "ฉ้อโกง" },
];

const subIssueTypeOptions = [
  {
    value: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    label: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
  },
  { value: "หนี้นอกระบบ", label: "หนี้นอกระบบ" },
  { value: "โครงการสาธารณูปโภคพื้นฐาน", label: "โครงการสาธารณูปโภคพื้นฐาน" },
  {
    value: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
    label: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
  },
  { value: "หนี้และสภาพหนี้ระบบ", label: "หนี้และสภาพหนี้ระบบ" },
  { value: "การเรียกรับสินบน", label: "การเรียกรับสินบน" },
  { value: "การบริการล่าช้า", label: "การบริการล่าช้า" },
  { value: "การปฏิบัติไม่เป็นธรรม", label: "การปฏิบัติไม่เป็นธรรม" },
  { value: "ข้อร้องเรียนทั่วไป", label: "ข้อร้องเรียนทั่วไป" },
];

const agencyOptions = [
  { value: "กรมสรรพากร", label: "กรมสรรพากร" },
  { value: "กรมศุลกากร", label: "กรมศุลกากร" },
  { value: "กรมบัญชีกลาง", label: "กรมบัญชีกลาง" },
  { value: "สำนักงานเศรษฐกิจการคลัง", label: "สำนักงานเศรษฐกิจการคลัง" },
  { value: "สำนักงานบริหารหนี้สาธารณะ", label: "สำนักงานบริหารหนี้สาธารณะ" },
  { value: "ธนาคารแห่งประเทศไทย", label: "ธนาคารแห่งประเทศไทย" },
  { value: "กรมการปกครอง", label: "กรมการปกครอง" },
  { value: "กรมทางหลวง", label: "กรมทางหลวง" },
  { value: "การไฟฟ้าส่วนภูมิภาค", label: "การไฟฟ้าส่วนภูมิภาค" },
];

const responsibleOfficerOptions = [
  { value: "นายสมชาย ใจดี", label: "นายสมชาย ใจดี" },
  { value: "นางสุนีย์ เรืองศรี", label: "นางสุนีย์ เรืองศรี" },
  { value: "นายอนุชา วงศ์ใหญ่", label: "นายอนุชา วงศ์ใหญ่" },
  { value: "นางปิยะดา สมศักดิ์", label: "นางปิยะดา สมศักดิ์" },
  { value: "นายธนากร มั่นคง", label: "นายธนากร มั่นคง" },
];

// อัปเดต statusOptions ให้ใช้ status_mapping
const statusOptions = [
  { value: "รับเรื่อง", label: "รับเรื่อง" },
  { value: "ส่งหน่วยงาน", label: "ส่งหน่วยงาน" },
  { value: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
  { value: "อยู่ระหว่างพิจารณา", label: "อยู่ระหว่างพิจารณา" },
  { value: "ติดตามผล", label: "ติดตามผล" },
  { value: "แจ้งผลการพิจารณา", label: "แจ้งผลการพิจารณา" },
  { value: "เสร็จสิ้น", label: "เสร็จสิ้น" },
  { value: "ยกเลิก", label: "ยกเลิก" },
];

// ฟังก์ชันแปลงสถานะจาก API เป็นภาษาไทย
const getThaiStatus = (englishStatus) => {
  const statusMapping = {
    submitted: "รับเรื่อง",
    sent_to_agency: "ส่งหน่วยงาน",
    in_process: "กำลังดำเนินการ",
    in_review: "อยู่ระหว่างพิจารณา",
    tracking: "ติดตามผล",
    reviewed: "แจ้งผลการพิจารณา",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
  };
  return statusMapping[englishStatus] || englishStatus;
};

// ฟังก์ชันแปลงสถานะเป็นอังกฤษ (สำหรับ URL)
const getEnglishStatus = (status) => {
  const statusMapping = {
    submitted: "รับเรื่อง",
    sent_to_agency: "ส่งหน่วยงาน",
    in_process: "กำลังดำเนินการ",
    in_review: "อยู่ระหว่างพิจารณา",
    tracking: "ติดตามผล",
    reviewed: "แจ้งผลการพิจารณา",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
  };

  // หา key จาก value
  const englishStatus = Object.keys(statusMapping).find(
    (key) => statusMapping[key] === status
  );

  return englishStatus || status;
};

// ฟังก์ชันสำหรับแปลงวันที่จาก ISO string เป็นรูปแบบไทย
const formatThaiDate = (isoString) => {
  if (!isoString) return "ไม่ระบุ";

  const date = new Date(isoString);
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

  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // แปลงเป็นปีพุทธศักราช

  return `${day} ${month} ${year}`;
};

// ฟังก์ชันสำหรับแปลงข้อมูลจาก API response เป็นรูปแบบที่ใช้ในตาราง
const transformComplaintData = (apiData) => {
  return apiData.map((item, index) => ({
    id: item.id || item.complaint_id,
    receiveDate: formatThaiDate(item.created_at) || "-",
    agency: item.respondent?.agency || "-",
    claimantName: item["ข้อมูลผู้ร้อง"] || item.complainant?.name || "-",
    issue: item["เรื่อง"] || item.master_complaint?.subject || "-",
    issueType: item["ประเภทเรื่อง"] || "-",
    subIssueType: item["ประเภทเรื่องย่อย"] || "-",
    responsibleOfficer:
      item["เจ้าหน้าที่ที่รับผิดชอบ"] ||
      item.assigned_officer?.name ||
      "ไม่ได้มอบหมาย",
    // แปลงสถานะจาก API เป็นภาษาไทย
    status: getThaiStatus(item.status) || item["สถานะเรื่อง"] || "-",
    // เก็บสถานะภาษาอังกฤษไว้สำหรับ URL
    statusEn: item.status || "-",
    note: item["หมายเหตุ"] || "-",
    complaintNumber:
      item["หมายเลข"] || item.master_complaint?.complaint_number || "-",
  }));
};

const ComplaintArchives = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [documentStorage, setDocumentStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ปรับปรุงฟังก์ชัน handleSearch ให้ทำงานได้ดีขึ้น
  const handleSearch = (filters) => {
    console.log("Search filters:", filters);

    const result = allComplaints.filter((item) => {
      let matchesFilter = true;

      // ตรวจสอบแต่ละเงื่อนไข
      if (filters.claimantName && filters.claimantName.trim() !== "") {
        const searchTerm = filters.claimantName.toLowerCase();
        const itemName = (item.claimantName || "").toLowerCase();
        matchesFilter = matchesFilter && itemName.includes(searchTerm);
      }

      if (filters.issue && filters.issue.trim() !== "") {
        const searchTerm = filters.issue.toLowerCase();
        const itemIssue = (item.issue || "").toLowerCase();
        matchesFilter = matchesFilter && itemIssue.includes(searchTerm);
      }

      if (filters.issueType && filters.issueType !== "") {
        matchesFilter = matchesFilter && item.issueType === filters.issueType;
      }

      if (filters.subIssueType && filters.subIssueType !== "") {
        matchesFilter =
          matchesFilter && item.subIssueType === filters.subIssueType;
      }

      if (filters.agency && filters.agency !== "") {
        matchesFilter = matchesFilter && item.agency === filters.agency;
      }

      if (filters.responsibleOfficer && filters.responsibleOfficer !== "") {
        matchesFilter =
          matchesFilter &&
          item.responsibleOfficer === filters.responsibleOfficer;
      }

      if (filters.status && filters.status !== "") {
        matchesFilter = matchesFilter && item.status === filters.status;
      }

      if (filters.complaintNumber && filters.complaintNumber.trim() !== "") {
        const searchTerm = filters.complaintNumber.toLowerCase();
        const itemNumber = (item.complaintNumber || "").toLowerCase();
        matchesFilter = matchesFilter && itemNumber.includes(searchTerm);
      }

      return matchesFilter;
    });

    console.log("Filtered results:", result);
    setFilteredComplaints(result);
  };

  // ฟังก์ชันสำหรับรีเซ็ตการค้นหา
  const handleResetSearch = () => {
    setFilteredComplaints(allComplaints);
  };

  const handleRowClick = (item) => {
    // ใช้สถานะภาษาอังกฤษที่เก็บไว้
    const englishStatus = item.statusEn || getEnglishStatus(item.status);
    router.push(`/admin/box/list/${item.id}?${englishStatus}`);
  };

  useEffect(() => {
    const fetchDocumentStorage = async () => {
      try {
        setLoading(true);
        const res = await getDocumentStorage();
        setDocumentStorage(res.res_data.items);

        // แปลงข้อมูลและตั้งค่าใน state
        const transformedData = transformComplaintData(res.res_data.items);
        setAllComplaints(transformedData);
        setFilteredComplaints(transformedData);

        console.log("Document Storage Data:", res.res_data.items);
        console.log("Transformed Data:", transformedData);
      } catch (err) {
        console.error("Error fetching document storage:", err);
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
          { name: "complaintNumber", label: "หมายเลขเรื่อง", type: "text" },
          {
            name: "issueType",
            label: "ประเภทเรื่อง",
            type: "select",
            options: issueTypeOptions,
          },
          {
            name: "subIssueType",
            label: "ประเภทเรื่องย่อย",
            type: "select",
            options: subIssueTypeOptions,
          },
          {
            name: "agency",
            label: "หน่วยงาน",
            type: "select",
            options: agencyOptions,
          },
          {
            name: "responsibleOfficer",
            label: "เจ้าหน้าที่รับผิดชอบ",
            type: "select",
            options: responsibleOfficerOptions,
          },
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

export default ComplaintArchives;
