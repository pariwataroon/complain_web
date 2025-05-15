import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAnnualResults from "@services/TableAnnualResults/TableAnnualResults";

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
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  // เปลี่ยนหน้า summary
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // กรองข้อมูลตามวันที่และประเภทเรื่อง
  const handleSearch = ({ receiveDateFrom, receiveDateTo, issueType }) => {
    let result = allComplaints;

    if (receiveDateFrom) {
      result = result.filter((item) =>
        item.receiveDate.includes(receiveDateFrom)
      );
    }
    if (receiveDateTo) {
      result = result.filter((item) =>
        item.receiveDate.includes(receiveDateTo)
      );
    }
    if (issueType) {
      result = result.filter((item) => item.issueType === issueType);
    }

    setFilteredComplaints(result);
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
