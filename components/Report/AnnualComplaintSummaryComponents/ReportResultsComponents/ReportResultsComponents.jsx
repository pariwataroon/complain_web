import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAnnualResults from "@services/TableAnnualResults/TableAnnualResults";
import { GetAnnualComplaintDetails } from "@pages/api/report/report";

// mock data (ปรับสถานะให้มีแค่ 2 ค่า: "ยุติ" และ "อยู่ระหว่างดำเนินการ" และเพิ่มฟิลด์ "หน่วยงานในสังกัด")
const mockComplaints = [
  {
    id: 1,
    agency: "กรมการปกครอง",
    receiptNumber: "98/68",
    receiptDate: "30 ม.ค. 2568",
    complainant: "นางสาวจันทร มีความสุข",
    complaint: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    letterRef: "กค 0000.0/0000",
    letterDate: "21 ม.ค. 2568",
    responsibleOfficer: "นางสาววริยา มณี",
    status: "อยู่ระหว่างดำเนินการ",
    elapsedTime: "1 ปี",
  },
  {
    id: 2,
    agency: "กรมธนารักษ์",
    receiptNumber: "97/68",
    receiptDate: "28 ม.ค. 2568",
    complainant: "สำนักงานปลัดกระทรวงการคลัง",
    complaint: "ค่ารักษาพยาบาลเบิกไม่ได้",
    issueType: "บำเหน็จบำนาญ / ค่ารักษาพยาบาล",
    letterRef: "กค 0000.0/0000",
    letterDate: "21 ม.ค. 2568",
    responsibleOfficer: "กาน วรากร",
    status: "ยุติ",
    elapsedTime: "3 เดือน",
  },
  {
    id: 3,
    agency: "สำนักงานปลัดกระทรวงการคลัง",
    receiptNumber: "97/68",
    receiptDate: "21 ม.ค. 2568",
    complainant: "สำนักงานรัฐมนตรี",
    complaint: "ขอให้ตรวจสอบภาษีซ้ำซ้อน",
    issueType: "ภาษีอากร",
    letterRef: "กค 0000.0/0000",
    letterDate: "21 ม.ค. 2568",
    responsibleOfficer: "ธีรภัทร ฤทธานันท์",
    status: "อยู่ระหว่างดำเนินการ",
    elapsedTime: "15 วัน",
  },
  {
    id: 4,
    agency: "สำนักงานรัฐมนตรี",
    receiptNumber: "97/68",
    receiptDate: "21 ม.ค. 2568",
    complainant: "กานณิรา รามันต์",
    complaint: "แก้ไขหน้าระบบบริษัท อีซีซี...",
    issueType: "การแก้ไขปัญหาหน้าเว็บไซต์",
    letterRef: "กค 0000.0/0000",
    letterDate: "21 ม.ค. 2568",
    responsibleOfficer: "ปริณา ชุณหา",
    status: "ยุติ",
    elapsedTime: "1 เดือน",
  },
  {
    id: 5,
    agency: "สำนักงานรัฐมนตรี",
    receiptNumber: "97/68",
    receiptDate: "20 ม.ค. 2568",
    complainant: "สำนักงานรัฐมนตรี",
    complaint: "แก้ไขปัญหาลงทะเบียนโครงการรัฐ",
    issueType: "นโยบายรัฐบาลเกี่ยวกับกระทรวงการคลัง",
    letterRef: "กค 0000.0/0000",
    letterDate: "21 ม.ค. 2568",
    responsibleOfficer: "นางสาวจันทร มีความสุข",
    status: "อยู่ระหว่างดำเนินการ",
    elapsedTime: "7 วัน",
  },
  {
    id: 6,
    agency: "กรมกิจการพลเรือนทหาร",
    receiptNumber: "96/67",
    receiptDate: "19 ม.ค. 2568",
    complainant: "นายสมชาย ใจดี",
    complaint: "การขอสำเนาเอกสารโครงการ",
    issueType: "บริการข้อมูลภาครัฐ",
    letterRef: "กค 0000.0/0000",
    letterDate: "20 ม.ค. 2568",
    responsibleOfficer: "นางสาวมณีรัตน์ สุขใจ",
    status: "ยุติ",
    elapsedTime: "2 สัปดาห์",
  },
  {
    id: 7,
    agency: "สำนักเลขาธิการคณะรัฐมนตรี",
    receiptNumber: "95/66",
    receiptDate: "18 ม.ค. 2568",
    complainant: "นางสาวสุดารัตน์ แสงสุริยา",
    complaint: "ขอข้อมูลผลการประชุมคณะรัฐมนตรี",
    issueType: "ข้อมูลข่าวสารภาครัฐ",
    letterRef: "กค 0000.0/0000",
    letterDate: "19 ม.ค. 2568",
    responsibleOfficer: "นายวิชัย ศรีสวัสดิ์",
    status: "อยู่ระหว่างดำเนินการ",
    elapsedTime: "10 วัน",
  },
  {
    id: 8,
    agency: "กรมบัญชีกลาง",
    receiptNumber: "94/65",
    receiptDate: "17 ม.ค. 2568",
    complainant: "นายณัฐพล รุ่งโรจน์",
    complaint: "การขอปรับปรุงบัญชีรายรับ-รายจ่าย",
    issueType: "การจัดทำบัญชี",
    letterRef: "กค 0000.0/0000",
    letterDate: "18 ม.ค. 2568",
    responsibleOfficer: "นางสาวจุฑาภรณ์ กาญจนาภรณ์",
    status: "ยุติ",
    elapsedTime: "5 วัน",
  },
  {
    id: 9,
    agency: "กรมตรวจสอบภายใน",
    receiptNumber: "93/64",
    receiptDate: "16 ม.ค. 2568",
    complainant: "นางสาวกมลทิพย์ จันทร์ฉาย",
    complaint: "การขออนุมัติเดินทางไปต่างประเทศ",
    issueType: "การเดินทางราชการ",
    letterRef: "กค 0000.0/0000",
    letterDate: "17 ม.ค. 2568",
    responsibleOfficer: "นางสาวกรรณิการ์ แก้วประเสริฐ",
    status: "อยู่ระหว่างดำเนินการ",
    elapsedTime: "3 วัน",
  },
  {
    id: 10,
    agency: "กรมสรรพากร",
    receiptNumber: "92/63",
    receiptDate: "15 ม.ค. 2568",
    complainant: "นายปวิชญ์ พิสุทธิ์",
    complaint: "ขอคืนภาษีล่าช้า",
    issueType: "ภาษีหรือค่าธรรมเนียม",
    letterRef: "กค 0000.0/0000",
    letterDate: "16 ม.ค. 2568",
    responsibleOfficer: "นายกฤษณ์ ศรีวัฒนา",
    status: "ยุติ",
    elapsedTime: "1 สัปดาห์",
  },
];

  const convertThaiDateStringToBuddhistISO = (thaiDateStr) => {
  if (!thaiDateStr) return null;

  const thaiMonths = {
    'ม.ค.': '01',
    'ก.พ.': '02',
    'มี.ค.': '03',
    'เม.ย.': '04',
    'พ.ค.': '05',
    'มิ.ย.': '06',
    'ก.ค.': '07',
    'ส.ค.': '08',
    'ก.ย.': '09',
    'ต.ค.': '10',
    'พ.ย.': '11',
    'ธ.ค.': '12',
  };

  const parts = thaiDateStr.trim().split(' '); // ['15', 'ม.ค.', '2568']
  if (parts.length !== 3) return null;

  const [dayStr, monthThai, yearStr] = parts;
  const day = dayStr.padStart(2, '0');
  const month = thaiMonths[monthThai];
  const year = yearStr;

  if (!month) return null;

  return `${year}-${month}-${day}`;
};

const agencyOptions = Array.from(
  new Set(mockComplaints.map((r) => r.agency))
).map((a) => ({ value: a, label: a }));

const officerOptions = Array.from(
  new Set(mockComplaints.map((r) => r.responsibleOfficer))
).map((o) => ({ value: o, label: o }));

const statusOptions = [
  { value: "ยุติ", label: "ยุติ" },
  { value: "อยู่ระหว่างดำเนินการ", label: "อยู่ระหว่างดำเนินการ" },
];

const ReportResultsComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (filters = {}) => {
    setLoading(true);
    try {
      const year = filters.year || new Date().getFullYear();
      const departmentId = filters.agency || "";
      const status = filters.status || "";

      // แปลงวันที่เป็น ISO format (YYYY-MM-DD) สำหรับ API
      let dateFrom = "";
      let dateTo = "";

      if (filters.receiveDateFrom) {
        const fromDate = new Date(filters.receiveDateFrom);
        // แปลงเป็น ค.ศ. ถ้าเป็น พ.ศ.
        let fromYear = fromDate.getFullYear();
        if (fromYear > 2500) {
          fromYear -= 543;
        }
        dateFrom = `${fromYear}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
      }

      if (filters.receiveDateTo) {
        const toDate = new Date(filters.receiveDateTo);
        // แปลงเป็น ค.ศ. ถ้าเป็น พ.ศ.
        let toYear = toDate.getFullYear();
        if (toYear > 2500) {
          toYear -= 543;
        }
        dateTo = `${toYear}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`;
      }

      const res = await GetAnnualComplaintDetails(
        0,
        100,
        year,
        dateFrom,
        dateTo,
        departmentId,
        status
      );
      const items = res?.res_data?.items || [];

      setAllComplaints(items);
      setFilteredComplaints(items);
    } catch (error) {
      console.error("Error fetching annual complaint details:", error);
      setAllComplaints([]);
      setFilteredComplaints([]);
    }
    setLoading(false);
  };

  // เปลี่ยนหน้า summary
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // ค้นหาข้อมูลจาก API
  const handleSearch = async (filters) => {
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
          {
            label: "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ",
            url: "/admin/document/annual-complaint-summary",
          },
          {
            label:
              "รายงานสรุปเรื่องร้องเรียนสำนักงานปลัดกระทรวงการคลัง / สำนักงานรัฐมนตรี",
          },
        ]}
      />

      <TableAnnualResults
        data={filteredComplaints}
        loading={loading}
        onSearch={handleSearch}
        actionButtonLabel="สรุปผลตามประเภทเรื่อง"
        onActionClick={handleSummaryByIssueType}
        navigateTo="/admin/document/annual-complaint-summary/reportresults"
        filterFields={[
          { name: "receiveDateFrom", label: "ตั้งแต่วันที่", type: "date" },
          { name: "receiveDateTo", label: "ถึงวันที่", type: "date" },
          {
            name: "agency",
            label: "หน่วยงานในสังกัด",
            type: "select",
            options: agencyOptions,
          },
          {
            name: "responsibleOfficer",
            label: "เจ้าหน้าที่รับผิดชอบ",
            type: "select",
            options: officerOptions,
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

export default ReportResultsComponents;
