import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableNewAddComp from "@services/TableNewAddComp/TableNewAddComp";

// สำหรับกรองเดือน (คำย่อในวันที่)
const THAI_MONTH_ABBREV = {
  1: "ม.ค.",
  2: "ก.พ.",
  3: "มี.ค.",
  4: "เม.ย.",
  5: "พ.ค.",
  6: "มิ.ย.",
  7: "ก.ค.",
  8: "ส.ค.",
  9: "ก.ย.",
  10: "ต.ค.",
  11: "พ.ย.",
  12: "ธ.ค.",
};

// ตัวเลือกเดือน (สำหรับ SelectField)
const MONTH_OPTIONS = [
  { value: "1", label: "มกราคม" },
  { value: "2", label: "กุมภาพันธ์" },
  { value: "3", label: "มีนาคม" },
  { value: "4", label: "เมษายน" },
  { value: "5", label: "พฤษภาคม" },
  { value: "6", label: "มิถุนายน" },
  { value: "7", label: "กรกฎาคม" },
  { value: "8", label: "สิงหาคม" },
  { value: "9", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
];

// ตัวเลือกปีงบประมาณ
const FISCAL_YEAR_OPTIONS = [
  { value: "2566", label: "2566" },
  { value: "2567", label: "2567" },
  { value: "2568", label: "2568" },
  { value: "2569", label: "2569" },
  { value: "2570", label: "2570" },
];

// ─── mock data (20 รายการ) ─────────────────────────────────────────────────
const mockComplaints = [
  {
    id: 1,
    receiveDate: "30 ม.ค. 2568",
    receiptNumber: "97/68",
    claimantName: "นางสาวภัทร มีความสุข",
    responsibleOfficer: "นางสาววิชนิดา มณี",
    agency: "กรมธนารักษ์",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 2,
    receiveDate: "30 ม.ค. 2568",
    receiptNumber: "97/68",
    claimantName: "นายภัทร วรากร",
    responsibleOfficer: "นางสาวปรินา ชูเกียรติ",
    agency: "โรงงานไฟฟ้า",
    issueType: "บ้านเชิงบ้านญ ครัวพยาบาล การซ่อมแซม",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 3,
    receiveDate: "30 ม.ค. 2568",
    receiptNumber: "97/68",
    claimantName: "นายธีรภัทร ชูนันท์",
    responsibleOfficer: "นางสาวปรินา ชูเกียรติ",
    agency: "กรมศุลกากร",
    issueType: "ภาษีอากร",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 4,
    receiveDate: "31 ม.ค. 2568",
    receiptNumber: "98/69",
    claimantName: "นางสาวจุฑาภรณ์ กาญจนาภรณ์",
    responsibleOfficer: "นายณัฐพล รุ่งโรจน์",
    agency: "ธนาคารแห่งประเทศไทย",
    issueType: "การจัดสวัสดิการ",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 5,
    receiveDate: "31 ม.ค. 2568",
    receiptNumber: "98/69",
    claimantName: "นายอาทิตย์ รุ่งเรือง",
    responsibleOfficer: "นางสาวมณีรัตน์ สุขใจ",
    agency: "สำนักงานเศรษฐกิจการคลัง",
    issueType: "การเบิกจ่ายงบประมาณ",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 6,
    receiveDate: "01 ก.พ. 2568",
    receiptNumber: "99/70",
    claimantName: "นางสาวมณีรัตน์ สุขใจ",
    responsibleOfficer: "นายสมชาย ใจดี",
    agency: "กรมบัญชีกลาง",
    issueType: "การจัดทำรายงาน",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 7,
    receiveDate: "01 ก.พ. 2568",
    receiptNumber: "99/70",
    claimantName: "นายสมชาย ใจดี",
    responsibleOfficer: "นางสาวสุดารัตน์ แสงสุริยา",
    agency: "โรงพยาบาลศิริราช",
    issueType: "การให้คำปรึกษา",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 8,
    receiveDate: "02 ก.พ. 2568",
    receiptNumber: "100/71",
    claimantName: "นางสาวสุดารัตน์ แสงสุริยา",
    responsibleOfficer: "นายวิชัย ศรีสวัสดิ์",
    agency: "สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน",
    issueType: "การพัฒนาบุคลากร",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 9,
    receiveDate: "03 ก.พ. 2568",
    receiptNumber: "101/72",
    claimantName: "นายวิชัย ศรีสวัสดิ์",
    responsibleOfficer: "นางสาวอรทัย ศรีสง่า",
    agency: "การไฟฟ้าส่วนภูมิภาค",
    issueType: "การซ่อมแซมถนน",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 10,
    receiveDate: "04 ก.พ. 2568",
    receiptNumber: "102/73",
    claimantName: "นางสาวอรทัย ศรีสง่า",
    responsibleOfficer: "นายอาทิตย์ รุ่งเรือง",
    agency: "กรมป่าไม้",
    issueType: "การอนุรักษ์ป่าไม้",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 11,
    receiveDate: "05 ก.พ. 2568",
    receiptNumber: "103/74",
    claimantName: "นายณัฐพล รุ่งโรจน์",
    responsibleOfficer: "นางสาวจุฑาภรณ์ กาญจนาภรณ์",
    agency: "กรมทรัพยากรน้ำ",
    issueType: "การจัดการน้ำ",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 12,
    receiveDate: "06 ก.พ. 2568",
    receiptNumber: "104/75",
    claimantName: "นางสาวกมลทิพย์ จันทร์ฉาย",
    responsibleOfficer: "นางสาวกรรณิการ์ แก้วประเสริฐ",
    agency: "กรมอุตุนิยมวิทยา",
    issueType: "การพยากรณ์อากาศ",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 13,
    receiveDate: "07 ก.พ. 2568",
    receiptNumber: "105/76",
    claimantName: "นายสนธยา ทองแท้",
    responsibleOfficer: "นายปวิชญ์ พิสุทธิ์",
    agency: "กรมอนามัย",
    issueType: "การส่งเสริมสุขภาพ",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 14,
    receiveDate: "08 ก.พ. 2568",
    receiptNumber: "106/77",
    claimantName: "นางสาวกรรณิการ์ แก้วประเสริฐ",
    responsibleOfficer: "นางสาวพิมพ์ชนก วัฒนานนท์",
    agency: "สำนักงานหลักประกันสุขภาพแห่งชาติ",
    issueType: "การประกันสุขภาพถ้วนหน้า",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 15,
    receiveDate: "09 ก.พ. 2568",
    receiptNumber: "107/78",
    claimantName: "นายปวิชญ์ พิสุทธิ์",
    responsibleOfficer: "นายกฤษณ์ ศรีวัฒนา",
    agency: "กรมการปกครอง",
    issueType: "การบริการทะเบียนราษฎร์",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 16,
    receiveDate: "10 ก.พ. 2568",
    receiptNumber: "108/79",
    claimantName: "นางสาวพิมพ์ชนก วัฒนานนท์",
    responsibleOfficer: "นางสาวชุติมา นิลวรรณ",
    agency: "กรมการขนส่งทางบก",
    issueType: "การขนส่งสาธารณะ",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 17,
    receiveDate: "11 ก.พ. 2568",
    receiptNumber: "109/80",
    claimantName: "นายกฤษณ์ ศรีวัฒนา",
    responsibleOfficer: "นายสารัช โชติปราณี",
    agency: "กรมเจ้าท่า",
    issueType: "การเดินเรือ",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 18,
    receiveDate: "12 ก.พ. 2568",
    receiptNumber: "110/81",
    claimantName: "นางสาวชุติมา นิลวรรณ",
    responsibleOfficer: "นางสาวปิยนุช ศรีประกาย",
    agency: "กรมชลประทาน",
    issueType: "การชลประทาน",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 19,
    receiveDate: "13 ก.พ. 2568",
    receiptNumber: "111/82",
    claimantName: "นายสารัช โชติปราณี",
    responsibleOfficer: "นายธีรภัทร ชูนันท์",
    agency: "กรมส่งเสริมการค้าระหว่างประเทศ",
    issueType: "การค้าระหว่างประเทศ",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  {
    id: 20,
    receiveDate: "14 ก.พ. 2568",
    receiptNumber: "112/83",
    claimantName: "นางสาวปิยนุช ศรีประกาย",
    responsibleOfficer: "นางสาวภัทร มีความสุข",
    agency: "กรมการศึกษา",
    issueType: "การศึกษา",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
];

const NewAdditionalComplaintsSummaryComponents = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  // เปลี่ยนหน้า summary
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // กรองข้อมูลตามเดือนและปีงบประมาณ
  const handleSearch = ({ receiveDateFrom, receiveDateTo }) => {
    let result = allComplaints;

    if (receiveDateFrom) {
      const monthLabel = THAI_MONTH_ABBREV[receiveDateFrom];
      result = result.filter((item) => item.receiveDate.includes(monthLabel));
    }

    if (receiveDateTo) {
      result = result.filter((item) =>
        item.receiveDate.endsWith(receiveDateTo)
      );
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
          { label: "รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่มทั้งหมด" },
        ]}
      />

      <TableNewAddComp
        data={filteredComplaints}
        title="รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่มทั้งหมด"
        onSearch={handleSearch}
        actionButtonLabel="สรุปผลตามประเภทเรื่อง"
        onActionClick={handleSummaryByIssueType}
        filterFields={[
          {
            name: "receiveDateFrom",
            label: "เดือน",
            type: "select",
            options: MONTH_OPTIONS,
          },
          {
            name: "receiveDateTo",
            label: "ปีงบประมาณ",
            type: "select",
            options: FISCAL_YEAR_OPTIONS,
          },
        ]}
      />
    </>
  );
};

export default NewAdditionalComplaintsSummaryComponents;
