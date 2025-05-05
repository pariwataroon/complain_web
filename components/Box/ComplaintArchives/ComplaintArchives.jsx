import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListBox from "@services/TableListBox/TableListBox";

/* -------------------------------------------------------------------------- */
/*  breadcrumbs                                                               */
/* -------------------------------------------------------------------------- */
const breadcrumbItems = [
  {
    label: "ติดตามผลการดำเนินการ",
    icon: (
      <img
        src="/icons/Cube.png"
        alt="pencil"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
  { label: "คลังเรื่องราวร้องทุกข์" },
];

/* -------------------------------------------------------------------------- */
/*  mock data (ให้ตรงกับคอลัมน์ใน TableListWebComplaints)                    */
/* -------------------------------------------------------------------------- */
const mockComplaints = [
  {
    id: 1,
    receiveDate: "30 ม.ค. 2568",
    agency: "กรมธนารักษ์",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "พฤติกรรมเจ้าหน้าที่ที่ไม่เหมาะสม",
    issueType: "บ้านพัก/ที่ดิน/งานสำรวจทรัพย์สิน",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "กำลังดำเนินการ",
    remark: "อยู่ระหว่างการชี้แจง",
  },
  {
    id: 2,
    receiveDate: "26 ม.ค. 2568",
    agency: "โรงงานไพ่",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "คำร้องพยาบาลกลับไม่ได้",
    issueType: "ภารกิจ",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "ยุติ",
    remark: "จบ",
  },
  {
    id: 3,
    receiveDate: "26 ม.ค. 2568",
    agency: "ธนาคารอิสลามแห่งประเทศไทย",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "ขอให้ตรวจสอบหนี้บริษัท ลานมีฯ",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้นอกระบบ",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "กำลังดำเนินการ",
    remark: "รอหน่วยงานตอบกลับ",
  },
  {
    id: 4,
    receiveDate: "25 ม.ค. 2568",
    agency: "สำนักงานเลขาธิการนายกรัฐมนตรี",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "แก้ไขไฟฟ้ารอบบริษัท ย้อนปังแสงสว่าง",
    issueType: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    subIssueType: "โครงการสาธารณูปโภคพื้นฐาน",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "กำลังดำเนินการ",
    remark: "รอหน่วยงานตอบกลับ",
  },
  {
    id: 5,
    receiveDate: "25 ม.ค. 2568",
    agency: "สำนักงานเลขาธิการนายกรัฐมนตรี",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "แก้ไขปัญหาการลงทะเบียนโครงการรัฐ",
    issueType: "นโยบายรัฐฯ ด้านสวัสดิการ",
    subIssueType: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "กำลังดำเนินการ",
    remark: "รอหน่วยงานตอบกลับ",
  },
  {
    id: 6,
    receiveDate: "24 ม.ค. 2568",
    agency: "กรมธนารักษ์",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    subIssueType: "-",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "ยุติ",
    remark: "อยู่ระหว่างการชี้แจง",
  },
  {
    id: 7,
    receiveDate: "24 ม.ค. 2568",
    agency: "โรงงานไพ่",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "คำร้องพยาบาลกลับไม่ได้",
    issueType: "ภารกิจ",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "กำลังดำเนินการ",
    remark: "อยู่ระหว่างการชี้แจง",
  },
  {
    id: 8,
    receiveDate: "23 ม.ค. 2568",
    agency: "ธนาคารอิสลามแห่งประเทศไทย",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "ขอให้ตรวจสอบหนี้บริษัท ลานมีฯ",
    issueType: "ภารกิจ",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "กำลังดำเนินการ",
    remark: "รอหน่วยงานตอบกลับ",
  },
  {
    id: 9,
    receiveDate: "23 ม.ค. 2568",
    agency: "ธนาคารอิสลามแห่งประเทศไทย",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "แก้ไขไฟฟ้ารอบบริษัท ย้อนปังแสงสว่าง",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้และสภาพหนี้ระบบ",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "ยุติ",
    remark: "จบ",
  },
  {
    id: 10,
    receiveDate: "22 ม.ค. 2568",
    agency: "สำนักงานเลขาธิการนายกรัฐมนตรี",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "แก้ไขปัญหาการลงทะเบียนโครงการรัฐ",
    issueType: "นโยบายรัฐฯ ด้านสวัสดิการ",
    subIssueType: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "กำลังดำเนินการ",
    remark: "รอหน่วยงานตอบกลับ",
  },
  {
    id: 11,
    receiveDate: "22 ม.ค. 2568",
    agency: "กรมธนารักษ์",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    subIssueType: "-",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "ยุติ",
    remark: "จบ",
  },
  {
    id: 12,
    receiveDate: "20 ม.ค. 2568",
    agency: "โรงงานไพ่",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "คำร้องพยาบาลกลับไม่ได้",
    issueType: "ภารกิจ",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "กำลังดำเนินการ",
    remark: "อยู่ระหว่างการชี้แจง",
  },
  {
    id: 13,
    receiveDate: "20 ม.ค. 2568",
    agency: "ธนาคารอิสลามแห่งประเทศไทย",
    claimantName: "กิตติพงศ์ วัฒนากร",
    issue: "ค่าธรรมเนียมนำเข้าซ้ำซ้อน",
    issueType: "ภารกิจ",
    subIssueType: "-",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "ยุติ",
    remark: "จบ",
  },
];

/* dropdown options (accusedName list) */
const agencyOptions = [
  "กรมสรรพากร",
  "กรมศุลกากร",
  "กรมบัญชีกลาง",
  "สำนักงานเศรษฐกิจการคลัง",
  "สำนักงานบริหารหนี้สาธารณะ",
  "ธนาคารแห่งประเทศไทย",
];

/* -------------------------------------------------------------------------- */
/*  helpers                                                                   */
/* -------------------------------------------------------------------------- */
const safeIncludes = (text, query) =>
  (text ?? "")
    .toString()
    .toLowerCase()
    .includes((query ?? "").toString().toLowerCase());

/* -------------------------------------------------------------------------- */
/*  component                                                                 */
/* -------------------------------------------------------------------------- */
const ComplaintArchives = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  /* -------------------------------- handlers ------------------------------- */
  const handleNavigateTo = () => router.push("/admin/edit/website-complaints");

  const handleSearch = (filters) => {
    const {
      claimantName,
      issueType,
      subIssueType,
      ssoNo,
      subject,
      accusedName,
    } = filters;

    const result = allComplaints.filter((item) => {
      if (claimantName && !safeIncludes(item.claimantName, claimantName))
        return false;
      if (issueType && !safeIncludes(item.issueType, issueType)) return false;
      if (subIssueType && !safeIncludes(item.subIssueType, subIssueType))
        return false;
      if (ssoNo && !safeIncludes(item.ssoNo, ssoNo)) return false;
      if (subject && !safeIncludes(item.subject, subject)) return false;
      if (accusedName && item.accusedName !== accusedName) return false;
      return true;
    });

    setFilteredComplaints(result);
  };

  /* -------------------------------- render --------------------------------- */
  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <TableListBox
        data={filteredComplaints}
        title="ติดตามผลการดำเนินการ"
        // navigateTo="/admin/edit/website-complaints"
        agencyOptions={agencyOptions}
        onSearch={handleSearch}
        handleNavigateTo={handleNavigateTo}
      />
    </>
  );
};

export default ComplaintArchives;
