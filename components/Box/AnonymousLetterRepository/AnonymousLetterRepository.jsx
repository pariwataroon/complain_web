import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListBox from "@services/TableListBox/TableListBox";

// 1) เตรียม option arrays
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

const officerOptions = [
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

// 2) mock data
// เพิ่มเป็น 20 รายการใน mockComplaints
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
    receiveDate: "04 ก.พ. 2568",
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
    receiveDate: "05 ก.พ. 2568",
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
    receiveDate: "06 ก.พ. 2568",
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
    receiveDate: "07 ก.พ. 2568",
    agency: "กรมบัญชีกลาง",
    claimantName: "มธุรินท์ พรหมลิขิต",
    issue: "ขอสำเนาใบสำคัญเบิกค่าใช้จ่าย",
    issueType: "ภารกิจ",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "กำลังดำเนินการ",
    note: "กำลังจัดเตรียมเอกสาร",
  },
  {
    id: 8,
    receiveDate: "08 ก.พ. 2568",
    agency: "กรมสรรพากร",
    claimantName: "อภิชาต วรรณชาติ",
    issue: "ตรวจสอบสภาพหนี้ภาษี",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้นอกระบบ",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "ยุติ",
    note: "แก้ไขยอดเรียบร้อย",
  },
  {
    id: 9,
    receiveDate: "09 ก.พ. 2568",
    agency: "กรมศุลกากร",
    claimantName: "กมลลักษณ์ ตั้งเจริญ",
    issue: "สอบถามข้อยกเว้นภาษีนำเข้า",
    issueType: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    subIssueType: "โครงการสาธารณูปโภคพื้นฐาน",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "กำลังดำเนินการ",
    note: "รอการอนุมัติจากส่วนกลาง",
  },
  {
    id: 10,
    receiveDate: "10 ก.พ. 2568",
    agency: "สำนักงานเศรษฐกิจการคลัง",
    claimantName: "มนัสนันท์ วิไลวรรณ",
    issue: "ขอเอกสารรายงานงบประมาณ",
    issueType: "นโยบายรัฐฯ ด้านสวัสดิการ",
    subIssueType: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "ยุติ",
    note: "จัดส่งทางอีเมลแล้ว",
  },
  {
    id: 11,
    receiveDate: "11 ก.พ. 2568",
    agency: "สำนักงานบริหารหนี้สาธารณะ",
    claimantName: "สุธิดา ศรีสุวรรณ",
    issue: "ขอแนวทางปรับโครงสร้างหนี้",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้และสภาพหนี้ระบบ",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "กำลังดำเนินการ",
    note: "ส่งให้ฝ่ายกฏหมายตรวจสอบ",
  },
  {
    id: 12,
    receiveDate: "12 ก.พ. 2568",
    agency: "ธนาคารแห่งประเทศไทย",
    claimantName: "ปุณยวีร์ ชัยยะ",
    issue: "สอบถามมาตรการกระตุ้นเศรษฐกิจ",
    issueType: "ภารกิจ",
    subIssueType: "-",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "ยุติ",
    note: "สรุปผลทางโทรศัพท์",
  },
  {
    id: 13,
    receiveDate: "13 ก.พ. 2568",
    agency: "กรมสรรพากร",
    claimantName: "ฐิติมา แซ่โต",
    issue: "ขอยื่นภาษีย้อนหลัง",
    issueType: "ภารกิจ",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "กำลังดำเนินการ",
    note: "รอแบบฟอร์มตอบกลับ",
  },
  {
    id: 14,
    receiveDate: "14 ก.พ. 2568",
    agency: "กรมศุลกากร",
    claimantName: "บุศรินทร์ เหลืองอุทัย",
    issue: "เคลมค่าภาษีนำเข้าซ้ำซ้อน",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้นอกระบบ",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "ยุติ",
    note: "คืนเงินให้บัญชีแล้ว",
  },
  {
    id: 15,
    receiveDate: "15 ก.พ. 2568",
    agency: "กรมบัญชีกลาง",
    claimantName: "ณัฏฐ์ดนัย โสภณ",
    issue: "ขอข้อมูลเบิกค่าทำงานล่วงเวลา",
    issueType: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    subIssueType: "โครงการสาธารณูปโภคพื้นฐาน",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "กำลังดำเนินการ",
    note: "จัดทำรายงานเพิ่มเติม",
  },
  {
    id: 16,
    receiveDate: "16 ก.พ. 2568",
    agency: "สำนักงานเศรษฐกิจการคลัง",
    claimantName: "กมลพัชร จิตติวงศ์",
    issue: "สอบถามอัตราเงินเฟ้อ",
    issueType: "นโยบายรัฐฯ ด้านสวัสดิการ",
    subIssueType: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "ยุติ",
    note: "ตอบกลับทางโทรศัพท์",
  },
  {
    id: 17,
    receiveDate: "17 ก.พ. 2568",
    agency: "สำนักงานบริหารหนี้สาธารณะ",
    claimantName: "อภินันท์ สารสิน",
    issue: "ขอทราบวงเงินกู้สาธารณะ",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้และสภาพหนี้ระบบ",
    responsibleOfficer: "นายกานต์ วรากร",
    status: "กำลังดำเนินการ",
    note: "รอการพิจารณาจากผู้บริหาร",
  },
  {
    id: 18,
    receiveDate: "18 ก.พ. 2568",
    agency: "ธนาคารแห่งประเทศไทย",
    claimantName: "จิรายุ พงษ์ประทีป",
    issue: "ขอรายละเอียดอัตราดอกเบี้ยเงินกู้",
    issueType: "ภารกิจ",
    subIssueType: "-",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "ยุติ",
    note: "แจ้งผลทาง SMS",
  },
  {
    id: 19,
    receiveDate: "19 ก.พ. 2568",
    agency: "กรมสรรพากร",
    claimantName: "วิมลรัตน์ มโนรมย์",
    issue: "ข้อเสนอแนะปรับปรุงแบบฟอร์มภาษี",
    issueType: "ภารกิจ",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นางกานต์รวี วรานี",
    status: "กำลังดำเนินการ",
    note: "ส่งให้ทีมออกแบบพิจารณา",
  },
  {
    id: 20,
    receiveDate: "20 ก.พ. 2568",
    agency: "กรมศุลกากร",
    claimantName: "กมลวรรณ สวัสดิ์ชัย",
    issue: "สอบถามข้อจำกัดการนำเข้า",
    issueType: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    subIssueType: "โครงการสาธารณูปโภคพื้นฐาน",
    responsibleOfficer: "นายปิยภา ภูมิศา",
    status: "ยุติ",
    note: "ปิดเรื่องเรียบร้อย",
  },
];

const AnonymousLetterRepository = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  // 3) ฟังก์ชันค้นหา
  const handleSearch = ({
    claimantName,
    subject,
    issueType,
    subIssueType,
    accusedName,
    responsibleOfficer,
    status,
  }) => {
    const result = allComplaints.filter((item) => {
      if (claimantName && !item.claimantName.includes(claimantName))
        return false;
      if (subject && !item.issue.includes(subject)) return false;
      if (issueType && item.issueType !== issueType) return false;
      if (subIssueType && item.subIssueType !== subIssueType) return false;
      if (accusedName && item.agency !== accusedName) return false;
      if (responsibleOfficer && item.responsibleOfficer !== responsibleOfficer)
        return false;
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
        title="ติดตามผลการดำเนินการ"
        navigateTo="/admin/edit/website-complaints"
        onSearch={handleSearch}
        filterFields={[
          { name: "claimantName", label: "ชื่อผู้ร้อง", type: "text" },
          { name: "subject", label: "เรื่อง", type: "text" },
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
            name: "accusedName",
            label: "หน่วยงาน",
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

export default AnonymousLetterRepository;
