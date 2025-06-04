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
    name: "นางสาวสมภัทร มีความสุข",
    citizenId: "1103702083925",
    subject: "พฤติกรรมเจ้าหน้าที่กก.ไม่เหมาะสม",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
  },
  {
    id: 2,
    name: "นางสาวนฤมลมี สงั่งสงามอิงลมดี",
    citizenId: "1101000393752",
    subject: "พฤติกรรมเจ้าหน้าที่กก.ไม่เหมาะสม",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
  },
  {
    id: 3,
    name: "นายปัญญู เป็นสุขเหนือโชค",
    citizenId: "1100501163554",
    subject: "ไม่สามารถเบิกค่ารักษาพยาบาลได้",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
  },
  {
    id: 4,
    name: "นางปารยา จาริยา",
    citizenId: "1139300066487",
    subject: "โดนวางหนี้บัตรระบบ",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
  },
  {
    id: 5,
    name: "นางสมสุข พุกข์เบิกหน่อย",
    citizenId: "1249900751961",
    subject: "การยืมโดยไม่มีสัญญา",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
  },
  {
    id: 6,
    name: "นายอนวัช ดีสวัสดิ์",
    citizenId: "1309901099370",
    subject: "เจ้าหน้าที่พูดจาดูถูกว่าราวกับจะเสียเกียรติ...",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
  },
  {
    id: 7,
    name: "นางสาวสมภัทร มีความสุข",
    citizenId: "1341501436232",
    subject: "ปัญหาที่ระบบชะลอขึ้นระบบ",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
  },
  {
    id: 8,
    name: "นางเพทพินี เพชรมแทะละ",
    citizenId: "1267900395693",
    subject: "ประกาศนั้นไม่บังคับชอบ",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
  },
  {
    id: 9,
    name: "นางสาวจารุจิต ดีดีศักดิ์ดีงาม",
    citizenId: "1129901653956",
    subject: "พฤติกรรมเจ้าหน้าที่กก.ไม่เหมาะสม",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
  },
  {
    id: 10,
    name: "นางสมสุข พุกข์เบิกหน่อย",
    citizenId: "1104301948071",
    subject: "ระบบขัดข้องระหว่างส่งข้อมูล",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
  },
];



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
        onSearch={handleSearch}
        handleNavigateTo={handleNavigateTo}
      />
    </>
  );
};

export default SearchComplaints;
