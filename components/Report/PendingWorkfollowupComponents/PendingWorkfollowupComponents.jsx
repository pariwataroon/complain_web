import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableWorkFollow from "@services/TableWorkFollow/TableWorkFollow";

// mock data (ปรับให้ตรงกับ columns)
const mockComplaints = [
  {
    id: 1,
    responsibleOfficer: "นางสาวพัชรินทร์ จันทร์โพธิ์",
    receiptNumber: "98/68",
    receiptDate: "20 ม.ค. 2568",
    referenceNumber: "747/67",
    proposeDate: "6 พ.ย. 2567",
    complaint: "เร่งรัดผลการพิจารณา ราษฎรศุภชัย อเจริญ",
    receiveDate: "22 พ.ย. 2567",
    agency: "กรมธนารักษ์",
    letterNumber: "000/000",
    status: "รอแจ้งผลจากหน่วยงาน",
    elapsedDays: 2,
  },
  {
    id: 2,
    responsibleOfficer: "นางสาวสุวิชา ลีละเศรษฐกุล",
    receiptNumber: "98/68",
    receiptDate: "20 ม.ค. 2568",
    referenceNumber: "747/67",
    proposeDate: "6 พ.ย. 2567",
    complaint:
      "แจ้งผลการพิจารณารายผู้ประกอบการก่อสร้าง (บ. ราษฎร์วิศ ดีเวลลอปเมนท์ จำกัด)",
    receiveDate: "11 พ.ย. 2567",
    agency: "กรมบัญชีกลาง",
    letterNumber: "000/000",
    status: "อยู่ระหว่างดำเนินการ",
    elapsedDays: 30,
  },
  {
    id: 3,
    responsibleOfficer: "นางสาวสุปราณี อาทร",
    receiptNumber: "98/68",
    receiptDate: "20 ม.ค. 2568",
    referenceNumber: "747/67",
    proposeDate: "6 พ.ย. 2567",
    complaint: "แจ้งผลการพิจารณารายนายอุกฤษชัย พจมานต",
    receiveDate: "25 พ.ย. 2567",
    agency: "กรมศุลกากร",
    letterNumber: "000/000",
    status: "รอแจ้งผลจากหน่วยงาน",
    elapsedDays: 1,
  },
  {
    id: 4,
    responsibleOfficer: "นางสาวสุปราณี อาทร",
    receiptNumber: "98/68",
    receiptDate: "20 ม.ค. 2568",
    referenceNumber: "747/67",
    proposeDate: "6 พ.ย. 2567",
    complaint: "แจ้งผลการพิจารณารายนายดินผล ทิพย์สุทธิ์",
    receiveDate: "21 พ.ย. 2567",
    agency: "กรมสรรพสามิต",
    letterNumber: "000/000",
    status: "รอแจ้งผลจากหน่วยงาน",
    elapsedDays: 3,
  },
  // ... เพิ่มเติมตามรูปแบบเดียวกันสำหรับรายการที่เหลือ
];

// ตัวเลือกประเภทเรื่อง
const ISSUE_TYPE_OPTIONS = [
  { value: "พฤติกรรมเจ้าหน้าที่", label: "พฤติกรรมเจ้าหน้าที่" },
  {
    value: "บ้านเชิงบ้านญ ครัวพยาบาล การซ่อมแซม",
    label: "บ้านเชิงบ้านญ ครัวพยาบาล การซ่อมแซม",
  },
  { value: "ภาษีอากร", label: "ภาษีอากร" },
  { value: "การจัดสวัสดิการ", label: "การจัดสวัสดิการ" },
  { value: "การเบิกจ่ายงบประมาณ", label: "การเบิกจ่ายงบประมาณ" },
  { value: "การจัดทำรายงาน", label: "การจัดทำรายงาน" },
  { value: "การให้คำปรึกษา", label: "การให้คำปรึกษา" },
  { value: "การพัฒนาบุคลากร", label: "การพัฒนาบุคลากร" },
  { value: "การซ่อมแซมถนน", label: "การซ่อมแซมถนน" },
  { value: "การอนุรักษ์ป่าไม้", label: "การอนุรักษ์ป่าไม้" },
  { value: "การจัดการน้ำ", label: "การจัดการน้ำ" },
  { value: "การพยากรณ์อากาศ", label: "การพยากรณ์อากาศ" },
  { value: "การส่งเสริมสุขภาพ", label: "การส่งเสริมสุขภาพ" },
  { value: "การประกันสุขภาพถ้วนหน้า", label: "การประกันสุขภาพถ้วนหน้า" },
  { value: "การบริการทะเบียนราษฎร์", label: "การบริการทะเบียนราษฎร์" },
  { value: "การขนส่งสาธารณะ", label: "การขนส่งสาธารณะ" },
  { value: "การเดินเรือ", label: "การเดินเรือ" },
  { value: "การชลประทาน", label: "การชลประทาน" },
  { value: "การค้าระหว่างประเทศ", label: "การค้าระหว่างประเทศ" },
  { value: "การศึกษา", label: "การศึกษา" },
];

const PendingWorkfollowupComponents = () => {
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
          { label: "รายงานการติดตามงานค้าง" },
        ]}
      />

      <TableWorkFollow
        data={filteredComplaints}
        onSearch={handleSearch}
        actionButtonLabel="สรุปผลตามประเภทเรื่อง"
        onActionClick={handleSummaryByIssueType}
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
            name: "issueType",
            label: "ประเภทเรื่อง",
            type: "select",
            options: ISSUE_TYPE_OPTIONS,
          },
        ]}
      />
    </>
  );
};

export default PendingWorkfollowupComponents;
