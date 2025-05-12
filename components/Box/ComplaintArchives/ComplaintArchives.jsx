import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListBox from "@services/TableListBox/TableListBox";

// 1) สร้าง option arrays มาจาก mockComplaints
const issueTypeOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "ภารกิจ", label: "ภารกิจ" },
  { value: "การแก้ไขปัญหาหนี้สิน", label: "การแก้ไขปัญหาหนี้สิน" },
  {
    value: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    label: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
  },
  { value: "นโยบายรัฐฯ ด้านสวัสดิการ", label: "นโยบายรัฐฯ ด้านสวัสดิการ" },
];

const subIssueTypeOptions = [
  { value: "", label: "ทั้งหมด" },
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
  { value: "-", label: "-" },
];

const agencyOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "กรมสรรพากร", label: "กรมสรรพากร" },
  { value: "กรมศุลกากร", label: "กรมศุลกากร" },
  { value: "กรมบัญชีกลาง", label: "กรมบัญชีกลาง" },
  { value: "สำนักงานเศรษฐกิจการคลัง", label: "สำนักงานเศรษฐกิจการคลัง" },
  { value: "สำนักงานบริหารหนี้สาธารณะ", label: "สำนักงานบริหารหนี้สาธารณะ" },
  { value: "ธนาคารแห่งประเทศไทย", label: "ธนาคารแห่งประเทศไทย" },
];

// mock data (เหมือนเดิม)
// pages/admin/ComplaintArchives.jsx (ส่วน mockComplaints)
const mockComplaints = [
  {
    id: 1,
    receiveDate: "01 ก.พ. 2568",
    agency: "กรมสรรพากร",
    claimantName: "สุนิสา มณีโชติ",
    issue: "ขอสอบถามการยื่นภาษีออนไลน์",
    issueType: "ภารกิจ",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "กำลังดำเนินการ",
    note: "รอเจ้าหน้าที่ติดต่อกลับ",
  },
  {
    id: 2,
    receiveDate: "02 ก.พ. 2568",
    agency: "กรมศุลกากร",
    claimantName: "จุฑามาศ วิสุทธิ์",
    issue: "สอบถามอัตราภาษีนำเข้า",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้นอกระบบ",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "ยุติ",
    note: "ชำระค่าภาษีเรียบร้อย",
  },
  {
    id: 3,
    receiveDate: "03 ก.พ. 2568",
    agency: "กรมบัญชีกลาง",
    claimantName: "ภัทร์วดี ชื่นชม",
    issue: "ขอข้อมูลผลการเบิกจ่ายงบประมาณ",
    issueType: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    subIssueType: "โครงการสาธารณูปโภคพื้นฐาน",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "กำลังดำเนินการ",
    note: "ส่งเรื่องไปยังส่วนกลาง",
  },
  {
    id: 4,
    receiveDate: "05 ก.พ. 2568",
    agency: "สำนักงานเศรษฐกิจการคลัง",
    claimantName: "ธีรภัทร ศิริรักษ์",
    issue: "ขอคำชี้แจงดัชนีเศรษฐกิจ",
    issueType: "นโยบายรัฐฯ ด้านสวัสดิการ",
    subIssueType: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "ยุติ",
    note: "ตอบกลับเรียบร้อย",
  },
  {
    id: 5,
    receiveDate: "06 ก.พ. 2568",
    agency: "สำนักงานบริหารหนี้สาธารณะ",
    claimantName: "อัครพล เทพเจริญ",
    issue: "สอบถามการจัดการหนี้สาธารณะ",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้และสภาพหนี้ระบบ",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "กำลังดำเนินการ",
    note: "เตรียมข้อมูลเพิ่มเติม",
  },
  {
    id: 6,
    receiveDate: "07 ก.พ. 2568",
    agency: "ธนาคารแห่งประเทศไทย",
    claimantName: "สุดารัตน์ แสงสุริยา",
    issue: "ขอรายละเอียดอัตราดอกเบี้ย",
    issueType: "ภารกิจ",
    subIssueType: "-",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "ยุติ",
    note: "ดำเนินการสำเร็จ",
  },
  {
    id: 7,
    receiveDate: "08 ก.พ. 2568",
    agency: "",
    claimantName: "มนต์ฤดี ใจตรง",
    issue: "ข้อเสนอแนะทั่วไป",
    issueType: "ภารกิจ",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "กำลังดำเนินการ",
    note: "รอตอบกลับ",
  },
];

const ComplaintArchives = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  const handleSearch = (filters) => {
    const result = allComplaints.filter((item) => {
      if (
        filters.claimantName &&
        !item.claimantName.includes(filters.claimantName)
      )
        return false;
      if (filters.issueType && item.issueType !== filters.issueType)
        return false;
      if (filters.subIssueType && item.subIssueType !== filters.subIssueType)
        return false;
      if (filters.subject && !item.issue.includes(filters.subject))
        return false;
      if (filters.accusedName && item.agency !== filters.accusedName)
        return false;
      return true;
    });
    setFilteredComplaints(result);
  };

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
          { label: "คลังเรื่องราวร้องทุกข์" },
        ]}
      />

      <TableListBox
        data={filteredComplaints}
        title="ติดตามผลการดำเนินการ"
        navigateTo="/admin/edit/website-complaints"
        onSearch={handleSearch}
        filterFields={[
          { name: "claimantName", label: "ชื่อผู้ร้อง", type: "text" },
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
          { name: "subject", label: "เรื่อง", type: "text" },
          {
            name: "accusedName",
            label: "หน่วยงาน",
            type: "select",
            options: agencyOptions,
          },
        ]}
      />
    </>
  );
};

export default ComplaintArchives;
