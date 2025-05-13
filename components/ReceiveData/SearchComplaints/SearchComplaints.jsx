import React, { useState } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableList from "@services/TableList/TableList";
import { useRouter } from "next/router";

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
  { label: "สืบค้นเรื่องร้องเรียน" },
];

const mockComplaints = [
  {
    id: 1,
    name: "นายสมชาย ใจดี",
    citizenId: "1234567890123",
    subject: "พฤติกรรมเจ้าหน้าที่กก.ไม่เหมาะสม",
    docNo: "สป-กค-1234-5-678-9",
    agency: "สป-กค-1234-5-678-9",
    status: "อยู่ระหว่างดำเนินการ",
  },
  {
    id: 2,
    name: "นางสาวสมฤดี อ่อนหวาน",
    citizenId: "9876543210987",
    subject: "ไม่สามารถเบิกค่ารักษาพยาบาลได้",
    docNo: "สป-กค-1234-5-678-9",
    agency: "สป-สร-1234-5-678-9",
    status: "ติดตามผลการพิจารณา",
  },
  {
    id: 3,
    name: "นายกิตติศักดิ์ พากเพียร",
    citizenId: "1100501234567",
    subject: "การชำระเงินค่ารักษาพยาบาลล่าช้า",
    docNo: "สธ-1234-5-678-9",
    agency: "สป-กค-1234-5-678-9",
    status: "ส่งหน่วยงาน",
  },
  {
    id: 4,
    name: "นางสาวพิชญ์สินี รัตนปัญญา",
    citizenId: "3101709876543",
    subject: "เจ้าหน้าที่แสดงกิริยาไม่เหมาะสม",
    docNo: "สป-กค-1234-5-678-9",
    agency: "สป-กค-1234-5-678-9",
    status: "อยู่ระหว่างดำเนินการ",
  },
  {
    id: 5,
    name: "นายประกิต ตั้งตรง",
    citizenId: "1501201122334",
    subject: "ระบบไม่อัปเดตข้อมูลคำร้อง",
    docNo: "สป-สร-1234-5-678-9",
    agency: "สป-สร-1234-5-678-9",
    status: "ติดตามผลการพิจารณา",
  },
  {
    id: 6,
    name: "นางสาวศิริกาญจน์ ภักดี",
    citizenId: "1409905566778",
    subject: "ร้องเรียนพฤติกรรมการทำงานล่าช้า",
    docNo: "สธ-1234-5-678-9",
    agency: "สธ-1234-5-678-9",
    status: "อยู่ระหว่างดำเนินการ",
  },
  {
    id: 7,
    name: "นายอนันต์ จิตรอาสา",
    citizenId: "1200603344556",
    subject: "ไม่สามารถติดต่อเจ้าหน้าที่ได้",
    docNo: "สป-กค-2234-5-678-9",
    agency: "สป-กค-2234-5-678-9",
    status: "ส่งหน่วยงาน",
  },
  {
    id: 8,
    name: "นางสาวณัฐชญา งามสง่า",
    citizenId: "1900406677889",
    subject: "ขอสอบถามสถานะเรื่องร้องเรียน",
    docNo: "สป-สร-2234-5-678-9",
    agency: "สป-สร-2234-5-678-9",
    status: "อยู่ระหว่างดำเนินการ",
  },
  {
    id: 9,
    name: "นายสมพล รุ่งเรือง",
    citizenId: "1702204455667",
    subject: "เจ้าหน้าที่ปฏิบัติหน้าที่ไม่เป็นธรรม",
    docNo: "สธ-2234-5-678-9",
    agency: "สธ-2234-5-678-9",
    status: "ติดตามผลการพิจารณา",
  },
  {
    id: 10,
    name: "นางสาวกมลชนก มีศรี",
    citizenId: "1803307788990",
    subject: "ระบบล่มไม่สามารถยื่นคำร้องได้",
    docNo: "สป-กค-3234-5-678-9",
    agency: "สป-กค-3234-5-678-9",
    status: "ส่งหน่วยงาน",
  },
  {
    id: 11,
    name: "นายวโรดม สุขสงบ",
    citizenId: "1308009988776",
    subject: "ขอแก้ไขข้อมูลคำร้องเดิม",
    docNo: "สป-สร-3234-5-678-9",
    agency: "สป-สร-3234-5-678-9",
    status: "อยู่ระหว่างดำเนินการ",
  },
];

const agencyOptions = ["สป-กค-1234-5-678-9", "สป-สร-1234-5-678-9"];

const safeIncludes = (t, q) =>
  (t ?? "")
    .toString()
    .toLowerCase()
    .includes((q ?? "").toString().toLowerCase());

const SearchComplaints = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();
  const handleNavigateTo = () =>
    router.push("/admin/edit/search/Filteromplaints");
  const handleSearch = (filters) => {
    const { claimantName, citizenId, subject, docNo, agency } = filters;

    const result = allComplaints.filter((item) => {
      if (claimantName && !safeIncludes(item.name, claimantName)) return false;
      if (citizenId && !safeIncludes(item.citizenId, citizenId)) return false;
      if (subject && !safeIncludes(item.subject, subject)) return false;
      if (docNo && !safeIncludes(item.docNo, docNo)) return false;
      if (agency && item.agency !== agency) return false;
      return true;
    });

    setFilteredComplaints(result);
  };

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />

      <TableList
        data={filteredComplaints}
        title="สืบค้นเรื่องร้องเรียน"
        navigateTo="/admin/edit/search"
        agencyOptions={agencyOptions}
        onSearch={handleSearch}
        handleNavigateTo={handleNavigateTo}
      />
    </>
  );
};

export default SearchComplaints;
