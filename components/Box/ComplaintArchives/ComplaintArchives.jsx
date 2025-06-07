import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListBox from "@services/TableListBox/TableListBox";
import Inventory2Icon from "@mui/icons-material/Inventory2";

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
  { value: "การคอร์รัปชัน", label: "การคอร์รัปชัน" },
  { value: "การบริการสาธารณะ", label: "การบริการสาธารณะ" },
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
  { value: "การเรียกรับสินบน", label: "การเรียกรับสินบน" },
  { value: "การบริการล่าช้า", label: "การบริการล่าช้า" },
  { value: "การปฏิบัติไม่เป็นธรรม", label: "การปฏิบัติไม่เป็นธรรม" },
  { value: "ข้อร้องเรียนทั่วไป", label: "ข้อร้องเรียนทั่วไป" },
];

const agencyOptions = [
  { value: "", label: "ทั้งหมด" },
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

// เพิ่ม options สำหรับเจ้าหน้าที่รับผิดชอบ
const responsibleOfficerOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "นายสมชาย ใจดี", label: "นายสมชาย ใจดี" },
  { value: "นางสุนีย์ เรืองศรี", label: "นางสุนีย์ เรืองศรี" },
  { value: "นายอนุชา วงศ์ใหญ่", label: "นายอนุชา วงศ์ใหญ่" },
  { value: "นางปิยะดา สมศักดิ์", label: "นางปิยะดา สมศักดิ์" },
  { value: "นายธนากร มั่นคง", label: "นายธนากร มั่นคง" },
];

// เพิ่ม options สำหรับสถานะเรื่อง
const statusOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "รับเรื่องแล้ว", label: "รับเรื่องแล้ว" },
  { value: "กำลังตรวจสอบ", label: "กำลังตรวจสอบ" },
  { value: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
  { value: "รอข้อมูลเพิ่มเติม", label: "รอข้อมูลเพิ่มเติม" },
  { value: "ส่งต่อหน่วยงาน", label: "ส่งต่อหน่วยงาน" },
  { value: "ดำเนินการเสร็จสิ้น", label: "ดำเนินการเสร็จสิ้น" },
  { value: "ยุติเรื่อง", label: "ยุติเรื่อง" },
];

// แก้ไข mock data ให้เป็นเรื่องราวร้องทุกข์จริง
const mockComplaints = [
  {
    id: 1,
    receiveDate: "15 ม.ค. 2568",
    agency: "กรมสรรพากร",
    claimantName: "นายสมศักดิ์ ขยันทำงาน",
    issue: "เจ้าหน้าที่เรียกเก็บค่าธรรมเนียมเกินกว่าที่กฎหมายกำหนด",
    issueType: "การคอร์รัปชัน",
    subIssueType: "การเรียกรับสินบน",
    responsibleOfficer: "นายสมชาย ใจดี",
    status: "กำลังตรวจสอบ",
    note: "ส่งเอกสารหลักฐานการโอนเงินแล้ว",
  },
  {
    id: 2,
    receiveDate: "18 ม.ค. 2568",
    agency: "กรมการปกครอง",
    claimantName: "นางสาวรัตนา มีความหวัง",
    issue: "การทำบัตรประชาชนใหม่ใช้เวลานานเกิน 30 วัน",
    issueType: "การบริการสาธารณะ",
    subIssueType: "การบริการล่าช้า",
    responsibleOfficer: "นางสุนีย์ เรืองศรี",
    status: "ส่งต่อหน่วยงาน",
    note: "ส่งเรื่องไปยังสำนักงานเขตแล้ว",
  },
  {
    id: 3,
    receiveDate: "22 ม.ค. 2568",
    agency: "กรมทางหลวง",
    claimantName: "นายประยุทธ์ ห่วงใยประชาชน",
    issue: "ถนนสายหลักชำรุดไม่ได้รับการซ่อมแซมมานานกว่า 1 ปี",
    issueType: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    subIssueType: "โครงการสาธารณูปโภคพื้นฐาน",
    responsibleOfficer: "นายอนุชา วงศ์ใหญ่",
    status: "กำลังดำเนินการ",
    note: "อนุมัติงบประมาณซ่อมแซมแล้ว คาดเริ่มงานเดือนหน้า",
  },
  {
    id: 4,
    receiveDate: "25 ม.ค. 2568",
    agency: "การไฟฟ้าส่วนภูมิภาค",
    claimantName: "นางอัมพร ไฟดับบ่อย",
    issue: "ไฟฟ้าในหมู่บ้านดับบ่อย ส่งผลกระทบต่อการดำรงชีวิต",
    issueType: "การบริการสาธารณะ",
    subIssueType: "ข้อร้องเรียนทั่วไป",
    responsibleOfficer: "นางปิยะดา สมศักดิ์",
    status: "รอข้อมูลเพิ่มเติม",
    note: "รอทีมช่างสำรวจพื้นที่เพิ่มเติม",
  },
  {
    id: 5,
    receiveDate: "28 ม.ค. 2568",
    agency: "สำนักงานบริหารหนี้สาธารณะ",
    claimantName: "นายธนากร หนี้ท่วมตัว",
    issue: "ขอความช่วยเหลือปรับโครงสร้างหนี้ครัวเรือน",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้และสภาพหนี้ระบบ",
    responsibleOfficer: "นายธนากร มั่นคง",
    status: "กำลังดำเนินการ",
    note: "นัดหมายให้มาพบเจ้าหน้าที่ในวันที่ 5 ก.พ.",
  },
  {
    id: 6,
    receiveDate: "02 ก.พ. 2568",
    agency: "กรมศุลกากร",
    claimantName: "นายวิชัย ทำธุรกิจ",
    issue: "เจ้าหน้าที่ศุลกากรปฏิบัติต่อผู้ประกอบการอย่างไม่เป็นธรรม",
    issueType: "การคอร์รัปชัน",
    subIssueType: "การปฏิบัติไม่เป็นธรรม",
    responsibleOfficer: "นายสมชาย ใจดี",
    status: "ดำเนินการเสร็จสิ้น",
    note: "ตักเตือนเจ้าหน้าที่แล้ว และปรับปรุงขั้นตอนการทำงาน",
  },
  {
    id: 7,
    receiveDate: "05 ก.พ. 2568",
    agency: "กรมบัญชีกลาง",
    claimantName: "นางสาวจินตนา รอเงินเบี้ยยังชีพ",
    issue: "เงินเบี้ยยังชีพผู้สูงอายุโอนช้ากว่าที่ประกาศไว้",
    issueType: "นโยบายรัฐฯ ด้านสวัสดิการ",
    subIssueType: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
    responsibleOfficer: "นางสุนีย์ เรืองศรี",
    status: "รับเรื่องแล้ว",
    note: "ตรวจสอบสถานะการโอนเงินและจะติดต่อกลับ",
  },
  {
    id: 8,
    receiveDate: "08 ก.พ. 2568",
    agency: "สำนักงานเศรษฐกิจการคลัง",
    claimantName: "นายศุภชัย กังวลเศรษฐกิจ",
    issue: "ข้อเสนะแนะนโยบายช่วยเหลือ SME ในช่วงเศรษฐกิจตกต่ำ",
    issueType: "ภารกิจ",
    subIssueType: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    responsibleOfficer: "นายธนากร มั่นคง",
    status: "กำลังตรวจสอบ",
    note: "ส่งต่อให้คณะกรรมการพิจารณานโยบาย",
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
      if (filters.issue && !item.issue.includes(filters.issue)) return false;
      if (filters.agency && item.agency !== filters.agency) return false;
      if (
        filters.responsibleOfficer &&
        item.responsibleOfficer !== filters.responsibleOfficer
      )
        return false;
      if (filters.status && item.status !== filters.status) return false;
      return true;
    });
    setFilteredComplaints(result);
  };

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
        navigateTo="/admin/box/list"
        onSearch={handleSearch}
        filterFields={[
          { name: "claimantName", label: "ชื่อผู้ร้อง", type: "text" },
          { name: "issue", label: "เรื่อง", type: "text" },
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
