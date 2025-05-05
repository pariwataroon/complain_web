import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListFollowing from "@services/TableListFollowing/TableListFollowing";

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
];

/* -------------------------------------------------------------------------- */
/*  mock data (ให้ตรงกับคอลัมน์ใน TableListWebComplaints)                    */
/* -------------------------------------------------------------------------- */
const mockComplaints = [
  {
    id: 1,
    claimantName: "นางสาวอนิภัทร มีความสุข",
    agency: "กรมสรรพากร",
    ssoNo: "97/68",
    issue: "พฤติกรรมเจ้าหน้าที่ที่กระทำรุนแรงต่อประชาชน",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    receiveDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 2,
    claimantName: "นายคำบัว วงการ",
    agency: "โรงพยาบาลไท่",
    ssoNo: "97/68",
    issue: "ไม่สามารถขออนุญาตทำการพยาบาลได้",
    issueType: "บริการสาธารณสุข",
    receiveDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 3,
    claimantName: "นางสาวกมลวรรณ ณเณ่",
    agency: "กรมสรรพสามิต",
    ssoNo: "97/68",
    issue: "การขับขี่โดยไม่มีใบอนุญาต",
    issueType: "การแก้ไขปัญหาหนี้สิน",
    receiveDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 4,
    claimantName: "นายปฏิพัทธ์ กาญจนวัฒน์",
    agency: "กรมศุลกากร",
    ssoNo: "97/68",
    issue: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    receiveDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 5,
    claimantName: "นางสาวอัมพวัน จิตรสุขุม",
    agency: "ธนาคารออมสิน",
    ssoNo: "97/68",
    issue: "ประกันภัยไม่จ่ายเงินชดเชย",
    issueType: "บริการทางการเงิน",
    receiveDate: "30 ม.ค. 2568",
    status: "ยุติ",
  },
  {
    id: 6,
    claimantName: "นายอดัมส์ สวัสดี",
    agency: "สำนักงานเศรษฐกิจการคลัง",
    ssoNo: "97/68",
    issue: "เบิกทุนหมุนเวียนไม่สำเร็จ",
    issueType: "งบประมาณ/การคลัง",
    receiveDate: "30 ม.ค. 2568",
    status: "ยุติ",
  },
  {
    id: 7,
    claimantName: "นางสาวเกษรา มีความสุข",
    agency: "กรมสรรพสามิต",
    ssoNo: "97/68",
    issue: "ปัญหาหักภาระหนี้ในระบบ",
    issueType: "หนี้ในระบบ",
    receiveDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 8,
    claimantName: "บริษัท ยูไลเซียน เทรดดิ้ง จำกัด",
    agency: "สำนักงานบริหารหนี้สาธารณะ",
    ssoNo: "97/68",
    issue: "ประกันภัยไม่มีวงเงินคุ้มครอง",
    issueType: "อื่นๆ",
    receiveDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 9,
    claimantName: "นางสาวชีวิต ดีสดใส",
    agency: "สำนักงานเศรษฐกิจการคลัง",
    ssoNo: "97/68",
    issue: "พฤติกรรมเจ้าหน้าที่ที่ไม่เหมาะสม",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    receiveDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 10,
    claimantName: "บริษัท พัฒนา โฮลดิ้ง จำกัด",
    agency: "ธนาคารแห่งประเทศไทย",
    ssoNo: "97/68",
    issue: "ข้อซักค้านธุรกรรมทางการเงินกระทบต่อธุรกิจ",
    issueType: "ภาษีอากร",
    receiveDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 11,
    claimantName: "นางสาวสุนิสา ทองสุข",
    agency: "กรมสรรพากร",
    ssoNo: "97/68",
    issue: "พฤติกรรมเจ้าหน้าที่ไม่เป็นธรรม",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    receiveDate: "30 ม.ค. 2568",
    status: "ยุติ",
  },
  {
    id: 12,
    claimantName: "นายวีรชัย อุ่นมั่น",
    agency: "โรงพยาบาลไท่",
    ssoNo: "97/68",
    issue: "การบันทึกค่าใช้จ่ายรักษาพยาบาลไม่ครบถ้วน",
    issueType: "บริการสาธารณสุข",
    receiveDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างการดำเนินการ",
  },
  {
    id: 13,
    claimantName: "บริษัท ซีเคเอ พาวเวอร์ จำกัด",
    agency: "กรมศุลกากร",
    ssoNo: "97/68",
    issue: "ค่าธรรมเนียมนำเข้าซ้ำซ้อน",
    issueType: "ภาษีอากร",
    receiveDate: "30 ม.ค. 2568",
    status: "ยุติ",
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
const StackedLineChartComponents = () => {
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
      <TableListFollowing
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

export default StackedLineChartComponents;
