import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListWebComplaints from "@services/TableListWebComplaints/TableListWebComplaints";

/* -------------------------------------------------------------------------- */
/*  breadcrumbs                                                               */
/* -------------------------------------------------------------------------- */
const breadcrumbItems = [
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
  { label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์" },
];

/* -------------------------------------------------------------------------- */
/*  mock data (ให้ตรงกับคอลัมน์ใน TableListWebComplaints)                    */
/* -------------------------------------------------------------------------- */
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
    ssoNo: "1234-5-678-9",
    subject: "การเรียกเก็บภาษีธุรกรรมการเงินซ้ำซ้อน",
    accusedName: "กรมศุลกากร",
  },
  {
    id: 3,
    claimantName: "บริษัท สถาปนา ยูไนเต็ด",
    issueType: "บ้านเช่าบ้าน/ค่ารักษาพยาบาล/การจัดซื้อจัดจ้าง",
    subIssueType: "การจัดซื้อจัดจ้าง",
    ssoNo: "1234-5-678-9",
    subject: "การดำเนินงานประมูลโครงการภาครัฐต่ำ",
    accusedName: "กรมบัญชีกลาง",
  },
  {
    id: 4,
    claimantName: "คุณวราภรณ์ ชาญชัยสกุล",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    subIssueType: "พฤติกรรมเจ้าหน้าที่",
    ssoNo: "1234-5-678-9",
    subject: "พฤติกรรมเจ้าหน้าที่ที่ไม่เหมาะสม",
    accusedName: "กรมบัญชีกลาง",
  },
  {
    id: 5,
    claimantName: "บริษัท ภูมิสิริ อินดัสตรี้ จำกัด",
    issueType: "ภาษีอากร",
    subIssueType: "ภาษีอากร",
    ssoNo: "1234-5-678-9",
    subject: "ปัญหาการคำนวณภาษีนำเข้าผิดพลาด",
    accusedName: "กรมศุลกากร",
  },
  {
    id: 6,
    claimantName: "นายอดัมส์ สวัสดี",
    issueType: "บ้านเช่าบ้าน/ค่ารักษาพยาบาล/การจัดซื้อจัดจ้าง",
    subIssueType: "ค่ารักษาพยาบาล",
    ssoNo: "1234-5-678-9",
    subject: "เบิกทุนหมุนเวียนและยอดจากภาครัฐไม่ได้รับ",
    accusedName: "สำนักงานเศรษฐกิจการคลัง",
  },
  {
    id: 7,
    claimantName: "นางสาวเกษรา มีความสุข",
    issueType: "หนี้ในระบบ",
    subIssueType: "หนี้ในระบบ",
    ssoNo: "1234-5-678-9",
    subject: "ปัญหาหักภาระหนี้ในระบบ",
    accusedName: "กรมสรรพสามิต",
  },
  {
    id: 8,
    claimantName: "บริษัท ยูไลเซียน เทรดดิ้ง จำกัด",
    issueType: "อื่นๆ",
    subIssueType: "อื่นๆ",
    ssoNo: "1234-5-678-9",
    subject: "ประกันภัยไม่มีวงเงินคุ้มครอง",
    accusedName: "สำนักงานบริหารหนี้สาธารณะ",
  },
  {
    id: 9,
    claimantName: "นางสาวชีวิต ดีสดใส",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    subIssueType: "พฤติกรรมเจ้าหน้าที่",
    ssoNo: "1234-5-678-9",
    subject: "พฤติกรรมเจ้าหน้าที่ที่ไม่เหมาะสม",
    accusedName: "สำนักงานเศรษฐกิจการคลัง",
  },
  {
    id: 10,
    claimantName: "บริษัท พัฒนา โฮลดิ้ง จำกัด",
    issueType: "ภาษีอากร",
    subIssueType: "ภาษีอากร",
    ssoNo: "1234-5-678-9",
    subject: "ข้อซักค้านในการกำกับดูแลธุรกรรมทางการเงินที่กระทบต่อธุรกิจ",
    accusedName: "ธนาคารแห่งประเทศไทย",
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
const WebsiteComplaints = () => {
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
      <TableListWebComplaints
        data={filteredComplaints}
        title="เรื่องราวร้องทุกข์ช่องทางเว็บไซต์"
        navigateTo="/admin/edit/website-complaints"
        agencyOptions={agencyOptions}
        onSearch={handleSearch}
        handleNavigateTo={handleNavigateTo}
      />
    </>
  );
};

export default WebsiteComplaints;
