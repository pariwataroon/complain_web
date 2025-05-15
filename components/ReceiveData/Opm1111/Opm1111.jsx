import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListBox from "@services/TableListBox/TableListBox";

const mockComplaints = [
  {
    id: 1,
    claimantName: "บริษัท เค.เค. ดีเวลลอป จำกัด",
    issueType: "ภาษีอากร",
    subIssueType: "ภาษีอากร",
    ssoNo: "1234-5-678-9",
    subject: "การเรียกเก็บภาษีมูลค่าเพิ่ม (VAT) ซ้ำซ้อน",
    accusedName: "กรมสรรพากร",
  },
  {
    id: 2,
    claimantName: "บจก. ทีเคเค เทรดดิ้ง จำกัด",
    issueType: "ภาษีอากร",
    subIssueType: "ภาษีอากร",
    ssoNo: "2345-6-789-0",
    subject: "ขอคืนภาษีซื้อที่ชำระเกิน",
    accusedName: "กรมสรรพากร",
  },
  {
    id: 3,
    claimantName: "คุณสมชาย ใจดี",
    issueType: "บ้านเช่าบ้าน/ค่ารักษาพยาบาล/การจัดซื้อจัดจ้าง",
    subIssueType: "ค่ารักษาพยาบาล",
    ssoNo: "3456-7-890-1",
    subject: "ขอเบิกค่ารักษาพยาบาลตามสิทธิ์",
    accusedName: "สำนักงานเศรษฐกิจการคลัง",
  },
  {
    id: 4,
    claimantName: "นางสาวอรทัย มั่งคั่ง",
    issueType: "บ้านเช่าบ้าน/ค่ารักษาพยาบาล/การจัดซื้อจัดจ้าง",
    subIssueType: "การจัดซื้อจัดจ้าง",
    ssoNo: "4567-8-901-2",
    subject: "จัดซื้อครุภัณฑ์ราชการไม่ตรงสเปค",
    accusedName: "กรมบัญชีกลาง",
  },
  {
    id: 5,
    claimantName: "บริษัท ภูมิสิริ อินดัสตรี้ จำกัด",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้ในระบบ",
    ssoNo: "5678-9-012-3",
    subject: "ขอปรับโครงสร้างหนี้สิน",
    accusedName: "สำนักงานบริหารหนี้สาธารณะ",
  },
  {
    id: 6,
    claimantName: "หจก. เอ็มเอ็นพี วัสดุภัณฑ์",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    subIssueType: "หนี้นอกระบบ",
    ssoNo: "6789-0-123-4",
    subject: "ปัญหาหนี้นอกระบบดอกเบี้ยสูง",
    accusedName: "ธนาคารแห่งประเทศไทย",
  },
  {
    id: 7,
    claimantName: "นางสาวปิยนันท์ ทองสุข",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    subIssueType: "พฤติกรรมเจ้าหน้าที่",
    ssoNo: "7890-1-234-5",
    subject: "เจ้าหน้าที่ปฏิเสธให้บริการ",
    accusedName: "กรมศุลกากร",
  },
  {
    id: 8,
    claimantName: "บริษัท ยูไลเซียน เทรดดิ้ง จำกัด",
    issueType: "อื่นๆ",
    subIssueType: "อื่นๆ",
    ssoNo: "8901-2-345-6",
    subject: "ข้อเสนอแนะปรับปรุงเว็บไซต์",
    accusedName: "สำนักงานเลขาธิการนายกรัฐมนตรี",
  },
  {
    id: 9,
    claimantName: "นายธนกฤต อัครเดชา",
    issueType: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    subIssueType: "โครงการสาธารณูปโภคพื้นฐาน",
    ssoNo: "9012-3-456-7",
    subject: "ข้อร้องเรียนถนนชำรุดไม่ได้รับการแก้ไข",
    accusedName: "กรมโยธาธิการและผังเมือง",
  },
  {
    id: 10,
    claimantName: "บริษัท ทีเค ระบบซัพพลาย จำกัด",
    issueType: "นโยบายรัฐฯ ด้านสวัสดิการ",
    subIssueType: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
    ssoNo: "0123-4-567-8",
    subject: "ลงทะเบียนสวัสดิการไม่สำเร็จ",
    accusedName: "สำนักงานหลักประกันสุขภาพแห่งชาติ",
  },
];

const issueTypeOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "ภาษีอากร", label: "ภาษีอากร" },
  {
    value: "บ้านเช่าบ้าน/ค่ารักษาพยาบาล/การจัดซื้อจัดจ้าง",
    label: "บ้านเช่าบ้าน/ค่ารักษาพยาบาล/การจัดซื้อจัดจ้าง",
  },
  { value: "การแก้ไขปัญหาหนี้สิน", label: "การแก้ไขปัญหาหนี้สิน" },
  { value: "พฤติกรรมเจ้าหน้าที่", label: "พฤติกรรมเจ้าหน้าที่" },
  { value: "อื่นๆ", label: "อื่นๆ" },
  {
    value: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    label: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
  },
  { value: "นโยบายรัฐฯ ด้านสวัสดิการ", label: "นโยบายรัฐฯ ด้านสวัสดิการ" },
];

// ประเภทเรื่องย่อย (subIssueType)
const subIssueTypeOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "ภาษีอากร", label: "ภาษีอากร" },
  { value: "ค่ารักษาพยาบาล", label: "ค่ารักษาพยาบาล" },
  { value: "การจัดซื้อจัดจ้าง", label: "การจัดซื้อจัดจ้าง" },
  { value: "หนี้ในระบบ", label: "หนี้ในระบบ" },
  { value: "หนี้นอกระบบ", label: "หนี้นอกระบบ" },
  { value: "พฤติกรรมเจ้าหน้าที่", label: "พฤติกรรมเจ้าหน้าที่" },
  { value: "อื่นๆ", label: "อื่นๆ" },
  { value: "โครงการสาธารณูปโภคพื้นฐาน", label: "โครงการสาธารณูปโภคพื้นฐาน" },
  {
    value: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
    label: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
  },
];

// ─── helper ─────────────────────────────────────────────────────────────────
const safeIncludes = (text = "", query = "") =>
  text.toLowerCase().includes(query.toLowerCase());

// ─── component ───────────────────────────────────────────────────────────────
const Opm1111Components = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  const handleNavigateTo = (item) =>
    router.push(`/admin/edit/opm1111/${item.id}`);

  const handleSearch = (filters) => {
    const result = allComplaints.filter((item) => {
      if (
        filters.claimantName &&
        !safeIncludes(item.claimantName, filters.claimantName)
      )
        return false;
      if (filters.issueType && item.issueType !== filters.issueType)
        return false;
      if (filters.subIssueType && item.subIssueType !== filters.subIssueType)
        return false;
      if (filters.subject && !safeIncludes(item.subject, filters.subject))
        return false;
      if (filters.ssoNo && !safeIncludes(item.ssoNo, filters.ssoNo))
        return false;
      if (filters.accusedName && item.accusedName !== filters.accusedName)
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
            label: "รับเข้าข้อมูล",
            icon: (
              <img
                src="/icons/Pencil.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          { label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ OPM1111" },
        ]}
      />

      <TableListBox
        data={filteredComplaints}
        title="เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ OPM1111"
        navigateTo="/admin/edit/opm1111"
        onSearch={handleSearch}
        handleNavigateTo={handleNavigateTo}
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
          { name: "ssoNo", label: "เลขที่ สรร", type: "text" },
          { name: "subject", label: "ชื่อเรื่อง", type: "text" },
          {
            name: "accusedName",
            label: "ผู้ถูกร้อง",
            type: "text",
          },
        ]}
      />
    </>
  );
};

export default Opm1111Components;
