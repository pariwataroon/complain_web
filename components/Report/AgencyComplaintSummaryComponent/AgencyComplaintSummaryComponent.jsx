import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListAgency from "@services/TableListAgency/TableListAgency";

// ─── สถานะ (label ไทย) เหมือนหน้า followup ─────────────────────
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

// code -> label ไทย (ให้ตรงกับหน้า followup)
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

// ─── mock data (20 รายการ) ─────────────────────────────────────────────────
// ─── mock data (20 รายการ) ─────────────────────────────────────────────────
// ใช้ status label ไทย ตาม STATUS_LABELS ที่กำหนด
const mockComplaints = [
  {
    id: "693611da-130a-4dab-adb7-b716b0144108",
    claimantName: "สุนิสา มณีโชติ",
    receiptNumber: "REC-0001",
    receiveDate: "01 ก.พ. 2568",
    agency: "กรมสรรพากร",
    issue: "ขอสอบถามการยื่นภาษีออนไลน์",
    issueType: "ภารกิจ",
    note: "รอเจ้าหน้าที่ติดต่อกลับ",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "กำลังดำเนินการ",
    workingDays: 3,
  },
  {
    id: 2,
    claimantName: "จุฑามาศ วิสุทธิ์",
    receiptNumber: "REC-0002",
    receiveDate: "02 ก.พ. 2568",
    agency: "กรมศุลกากร",
    issue: "สอบถามอัตราภาษีนำเข้า",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    note: "ชำระค่าภาษีเรียบร้อย",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "ยุติเรื่องแล้ว",
    workingDays: 5,
  },
  {
    id: 3,
    claimantName: "ภัทร์วดี ชื่นชม",
    receiptNumber: "REC-0003",
    receiveDate: "03 ก.พ. 2568",
    agency: "กรมบัญชีกลาง",
    issue: "ขอข้อมูลผลการเบิกจ่ายงบประมาณ",
    issueType: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    note: "ส่งเรื่องไปยังส่วนกลาง",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "ส่งหน่วยงานที่เกี่ยวข้อง",
    workingDays: 7,
  },
  {
    id: 4,
    claimantName: "ธีรภัทร ศิริรักษ์",
    receiptNumber: "REC-0004",
    receiveDate: "05 ก.พ. 2568",
    agency: "สำนักงานเศรษฐกิจการคลัง",
    issue: "ขอคำชี้แจงดัชนีเศรษฐกิจ",
    issueType: "นโยบายรัฐฯ ด้านสวัสดิการ",
    note: "ตอบกลับเรียบร้อย",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "แจ้งผลการพิจารณา",
    workingDays: 4,
  },
  {
    id: 5,
    claimantName: "อัครพล เทพเจริญ",
    receiptNumber: "REC-0005",
    receiveDate: "06 ก.พ. 2568",
    agency: "สำนักงานบริหารหนี้สาธารณะ",
    issue: "สอบถามการจัดการหนี้สาธารณะ",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    note: "เตรียมข้อมูลเพิ่มเติม",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "กำลังดำเนินการ",
    workingDays: 6,
  },
  {
    id: 6,
    claimantName: "สุดารัตน์ แสงสุริยา",
    receiptNumber: "REC-0006",
    receiveDate: "07 ก.พ. 2568",
    agency: "ธนาคารแห่งประเทศไทย",
    issue: "ขอรายละเอียดอัตราดอกเบี้ย",
    issueType: "ภารกิจ",
    note: "ดำเนินการสำเร็จ",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "ยุติเรื่องแล้ว",
    workingDays: 2,
  },
  {
    id: 7,
    claimantName: "มนต์ฤดี ใจตรง",
    receiptNumber: "REC-0007",
    receiveDate: "08 ก.พ. 2568",
    agency: "",
    issue: "ข้อเสนอแนะทั่วไป",
    issueType: "ภารกิจ",
    note: "รอตอบกลับ",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "รับเรื่อง",
    workingDays: 3,
  },
  {
    id: 8,
    claimantName: "สมชาย ใจดี",
    receiptNumber: "REC-0008",
    receiveDate: "09 ก.พ. 2568",
    agency: "กรมสรรพากร",
    issue: "สอบถามขั้นตอนยื่นภาษีหัก ณ ที่จ่าย",
    issueType: "ภารกิจ",
    note: "รอเอกสารเพิ่มเติม",
    responsibleOfficer: "นายสมชาย ใจดี",
    status: "ติดตามผล",
    workingDays: 5,
  },
  {
    id: 9,
    claimantName: "วราภรณ์ ศรีสุข",
    receiptNumber: "REC-0009",
    receiveDate: "10 ก.พ. 2568",
    agency: "กรมศุลกากร",
    issue: "ขอปรับปรุงระบบแจ้งคืนภาษีนำเข้า",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    note: "ทดสอบระบบแล้ว",
    responsibleOfficer: "นางวราภรณ์ ศรีสุข",
    status: "อยู่ระหว่างพิจารณา",
    workingDays: 4,
  },
  {
    id: 10,
    claimantName: "อรวรรณ จันทร์งาม",
    receiptNumber: "REC-0010",
    receiveDate: "11 ก.พ. 2568",
    agency: "กรมบัญชีกลาง",
    issue: "ขอรายงานสรุปงบกลางปี",
    issueType: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    note: "จัดส่ง PDF เรียบร้อย",
    responsibleOfficer: "นางอรวรรณ จันทร์งาม",
    status: "มอบหมายเจ้าหน้าที่",
    workingDays: 2,
  },
  {
    id: 11,
    claimantName: "นรินทร์ สวัสดิ์วงศ์",
    receiptNumber: "REC-0011",
    receiveDate: "12 ก.พ. 2568",
    agency: "สำนักงานเศรษฐกิจการคลัง",
    issue: "สอบถามตัวชี้วัดเศรษฐกิจ",
    issueType: "นโยบายรัฐฯ ด้านสวัสดิการ",
    note: "ส่งรายงานให้แล้ว",
    responsibleOfficer: "นายณรินทร์ สวัสดิ์วงศ์",
    status: "แจ้งผลการพิจารณา",
    workingDays: 3,
  },
  {
    id: 12,
    claimantName: "จิตติมา นิลวรรณ",
    receiptNumber: "REC-0012",
    receiveDate: "13 ก.พ. 2568",
    agency: "สำนักงานบริหารหนี้สาธารณะ",
    issue: "ขอปรับโครงสร้างหนี้ส่วนบุคคล",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    note: "รอเซ็นเอกสาร",
    responsibleOfficer: "นางจิตติมา นิลวรรณ",
    status: "กำลังดำเนินการ",
    workingDays: 7,
  },
  {
    id: 13,
    claimantName: "ปรีชา เกษมสุข",
    receiptNumber: "REC-0013",
    receiveDate: "14 ก.พ. 2568",
    agency: "ธนาคารแห่งประเทศไทย",
    issue: "ขอข้อมูลสถิติอัตราดอกเบี้ย",
    issueType: "ภารกิจ",
    note: "นำเข้าระบบเรียบร้อย",
    responsibleOfficer: "นายปรีชา เกษมสุข",
    status: "ยุติเรื่องแล้ว",
    workingDays: 1,
  },
  {
    id: 14,
    claimantName: "สุดารัตน์ วงศ์วิเศษ",
    receiptNumber: "REC-0014",
    receiveDate: "15 ก.พ. 2568",
    agency: "กรมสรรพากร",
    issue: "สอบถามเครดิตภาษีซื้อ",
    issueType: "ภารกิจ",
    note: "กำลังประสานงาน",
    responsibleOfficer: "นางสุดารัตน์ วงศ์วิเศษ",
    status: "กำลังดำเนินการ",
    workingDays: 6,
  },
  {
    id: 15,
    claimantName: "ณัฐพล รุ่งเรือง",
    receiptNumber: "REC-0015",
    receiveDate: "16 ก.พ. 2568",
    agency: "กรมศุลกากร",
    issue: "ขอแนวทางยื่นภาษีศุลกากร",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    note: "จัดอบรมเรียบร้อย",
    responsibleOfficer: "นายณัฐพล รุ่งเรือง",
    status: "ยุติเรื่องแล้ว",
    workingDays: 4,
  },
  {
    id: 16,
    claimantName: "ปาณิสรา ไทยเจริญ",
    receiptNumber: "REC-0016",
    receiveDate: "17 ก.พ. 2568",
    agency: "กรมบัญชีกลาง",
    issue: "ขอสำเนาเอกสารเบิกจ่าย",
    issueType: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    note: "รอสำเนาเซ็นรับ",
    responsibleOfficer: "น.ส.ปาณิสรา ไทยเจริญ",
    status: "มอบหมายเจ้าหน้าที่",
    workingDays: 5,
  },
  {
    id: 17,
    claimantName: "กมลทิพย์ จันทร์ฉาย",
    receiptNumber: "REC-0017",
    receiveDate: "18 ก.พ. 2568",
    agency: "สำนักงานเศรษฐกิจการคลัง",
    issue: "ขอรายงานเปรียบเทียบงบปีล่าสุด",
    issueType: "นโยบายรัฐฯ ด้านสวัสดิการ",
    note: "จัดส่งผ่านอีเมลแล้ว",
    responsibleOfficer: "น.ส.กมลทิพย์ จันทร์ฉาย",
    status: "ติดตามผล",
    workingDays: 3,
  },
  {
    id: 18,
    claimantName: "ปริญญา ทรัพย์รุ่ง",
    receiptNumber: "REC-0018",
    receiveDate: "19 ก.พ. 2568",
    agency: "สำนักงานบริหารหนี้สาธารณะ",
    issue: "ขอข้อมูลหนี้สาธารณะล่าสุด",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    note: "กำลังจัดทำสรุป",
    responsibleOfficer: "นายปริญญา ทรัพย์รุ่ง",
    status: "อยู่ระหว่างพิจารณา",
    workingDays: 8,
  },
  {
    id: 19,
    claimantName: "สุภาภรณ์ ศรีแสง",
    receiptNumber: "REC-0019",
    receiveDate: "20 ก.พ. 2568",
    agency: "ธนาคารแห่งประเทศไทย",
    issue: "สอบถามการปรับดอกเบี้ยเงินฝาก",
    issueType: "ภารกิจ",
    note: "รอประกาศอย่างเป็นทางการ",
    responsibleOfficer: "นางสุภาภรณ์ ศรีแสง",
    status: "รับเรื่อง",
    workingDays: 2,
  },
  {
    id: 20,
    claimantName: "เดชา พงษ์อนันต์",
    receiptNumber: "REC-0020",
    receiveDate: "21 ก.พ. 2568",
    agency: "กรมสรรพากร",
    issue: "ขอปรับปรุงฟอร์มยื่นภาษีออนไลน์",
    issueType: "ภารกิจ",
    note: "ได้รับ feedback แล้ว",
    responsibleOfficer: "นายเดชา พงษ์อนันต์",
    status: "ยุติเรื่องแล้ว",
    workingDays: 5,
  },
];
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
  const [allComplaints] = useState(
    mockComplaints.map((item) => ({
      ...item,
      status: STATUS_LABELS.includes(item.status) ? item.status : toThaiLabel(item.status),
    }))
  );
  const [filteredComplaints, setFilteredComplaints] = useState(allComplaints);
  const router = useRouter();

  const handleSearch = (filters) => {
    const {
      claimantName,
      receiptNumber,
      agency,
      responsibleOfficer,
      status,
    } = filters;

    const norm = (v) => (v ?? "").toString().trim();

    const result = allComplaints.filter((item) => {
      if (claimantName && !item.claimantName.includes(norm(claimantName))) return false;
      if (receiptNumber && !item.receiptNumber.includes(norm(receiptNumber))) return false;
      if (agency && item.agency !== agency) return false;
      if (responsibleOfficer && item.responsibleOfficer !== responsibleOfficer) return false;
      if (status && item.status !== status) return false;
      return true;
    });

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
          { label: "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน" },
        ]}
      />

      <TableListAgency
        data={filteredComplaints}
        title="รายงานสรุปเรื่องร้องเรียนของหน่วยงาน"
        navigateTo="/admin/edit/website-complaints"
        onSearch={handleSearch}
        statusOptions={statusFilterOptions}
      />
    </>
  );
};

export default AgencyComplaintSummary;