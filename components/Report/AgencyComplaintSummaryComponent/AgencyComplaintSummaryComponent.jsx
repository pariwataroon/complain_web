// pages/admin/ComplaintArchives.jsx

import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListAgency from "@services/TableListAgency/TableListAgency";

// ─── option arrays ──────────────────────────────────────────────────────────

const agencyOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "กรมสรรพากร", label: "กรมสรรพากร" },
  { value: "กรมศุลกากร", label: "กรมศุลกากร" },
  { value: "กรมบัญชีกลาง", label: "กรมบัญชีกลาง" },
  { value: "สำนักงานเศรษฐกิจการคลัง", label: "สำนักงานเศรษฐกิจการคลัง" },
  { value: "สำนักงานบริหารหนี้สาธารณะ", label: "สำนักงานบริหารหนี้สาธารณะ" },
  { value: "ธนาคารแห่งประเทศไทย", label: "ธนาคารแห่งประเทศไทย" },
];

// สกัดรายชื่อเจ้าหน้าที่ผู้รับผิดชอบจาก mockComplaints แล้วทำให้เป็น unique list
const responsibleOfficerOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "นายกานต์ วรากร", label: "นายกานต์ วรากร" },
  { value: "นางกานต์รวี วรานี", label: "นางกานต์รวี วรานี" },
  { value: "นายปิยภา ภูมิศา", label: "นายปิยภา ภูมิศา" },
];

const statusOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
  { value: "ยุติ", label: "ยุติ" },
];

// ─── mock data (20 รายการ) ─────────────────────────────────────────────────
// ─── mock data (20 รายการ) ─────────────────────────────────────────────────
const mockComplaints = [
  {
    id: 1,
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
    status: "ยุติ",
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
    status: "กำลังดำเนินการ",
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
    status: "ยุติ",
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
    status: "ยุติ",
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
    status: "กำลังดำเนินการ",
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
    status: "กำลังดำเนินการ",
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
    status: "ยุติ",
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
    status: "ยุติ",
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
    status: "ยุติ",
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
    status: "ยุติ",
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
    status: "ยุติ",
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
    status: "กำลังดำเนินการ",
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
    status: "ยุติ",
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
    status: "กำลังดำเนินการ",
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
    status: "กำลังดำเนินการ",
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
    status: "ยุติ",
    workingDays: 5,
  },
];

const AgencyComplaintSummary = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  const handleSearch = (filters) => {
    const {
      receiveDateFrom,
      receiveDateTo,
      agency: fAgency,
      claimantName: fName,
      issueType: fIssueType,
      subIssueType: fSubIssueType,
      responsibleOfficer: fOfficer,
      status: fStatus,
    } = filters;

    const result = allComplaints.filter((item) => {
      // date range
      if (
        receiveDateFrom &&
        new Date(item.receiveDate) < new Date(receiveDateFrom)
      )
        return false;
      if (receiveDateTo && new Date(item.receiveDate) > new Date(receiveDateTo))
        return false;
      if (fAgency && item.agency !== fAgency) return false;
      if (fName && !item.claimantName.includes(fName)) return false;
      if (fIssueType && item.issueType !== fIssueType) return false;
      if (fSubIssueType && item.subIssueType !== fSubIssueType) return false;
      if (fOfficer && item.responsibleOfficer !== fOfficer) return false;
      if (fStatus && item.status !== fStatus) return false;
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
        filterFields={[
          {
            name: "receiveDateFrom",
            label: "ตั้งแต่วันที่",
            type: "date",
          },
          {
            name: "receiveDateTo",
            label: "ถึงวันที่",
            type: "date",
          },
          {
            name: "agency",
            label: "หน่วยงานในสังกัด",
            type: "select",
            options: agencyOptions,
          },
          {
            name: "responsibleOfficer",
            label: "เจ้าหน้าที่ผู้รับผิดชอบ",
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

export default AgencyComplaintSummary;
