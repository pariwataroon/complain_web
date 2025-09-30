import React, { useState, useEffect } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableList from "@services/TableList/TableList";
import { useRouter } from "next/router";
import { GetEnhancedComplaints } from "@pages/api/complaint/complaint";

const breadcrumbItems = [
  {
    label: "จัดการข้อมูลในระบบ",
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
    subject: "พฤติกรรมเจ้าหน้าที่ กค. ไม่เหมาะสม",
    docKk: "สป-กค-1234-5-678-9",
    docSr: "สป-สร-1234-5-678-9",
    docStp: "สตป-1234-5-678-9",
    docGov: "สรร-1234-5-678-9",
    agency: "กรมส่งเสริมการปกครองท้องถิ่น",
  },
  {
    id: 2,
    name: "นางสาวนฤมลมี สงั่งสงามอิงลมดี",
    citizenId: "1101000393752",
    subject: "พฤติกรรมเจ้าหน้าที่ กค. ไม่เหมาะสม",
    docKk: "สป-กค-2345-6-789-0",
    docSr: "สป-สร-2345-6-789-0",
    docStp: "สตป-2345-6-789-0",
    docGov: "สรร-2345-6-789-0",
    agency: "กรมการปกครอง",
  },
  {
    id: 3,
    name: "นายปัญญู เป็นสุขเหนือโชค",
    citizenId: "1100501163554",
    subject: "ไม่สามารถเบิกค่ารักษาพยาบาลได้",
    docKk: "สป-กค-3456-7-890-1",
    docSr: "สป-สร-3456-7-890-1",
    docStp: "สตป-3456-7-890-1",
    docGov: "สรร-3456-7-890-1",
    agency: "เทศบาลเมือง",
  },
  {
    id: 4,
    name: "นางปารยา จาริยา",
    citizenId: "1139300066487",
    subject: "โดนวางหนี้บัตรระบบ",
    docKk: "สป-กค-4567-8-901-2",
    docSr: "สป-สร-4567-8-901-2",
    docStp: "สตป-4567-8-901-2",
    docGov: "สรร-4567-8-901-2",
    agency: "องค์การบริหารส่วนตำบล",
  },
  {
    id: 5,
    name: "นางสมสุข พุกข์เบิกหน่อย",
    citizenId: "1249900751961",
    subject: "การยืมโดยไม่มีสัญญา",
    docKk: "สป-กค-5678-9-012-3",
    docSr: "สป-สร-5678-9-012-3",
    docStp: "สตป-5678-9-012-3",
    docGov: "สรร-5678-9-012-3",
    agency: "จังหวัด",
  },
  {
    id: 6,
    name: "นายอนวัช ดีสวัสดิ์",
    citizenId: "1309901099370",
    subject: "เจ้าหน้าที่พูดจาดูถูกว่าราวกับจะเสียเกียรติ...",
    docKk: "สป-กค-6789-0-123-4",
    docSr: "สป-สร-6789-0-123-4",
    docStp: "สตป-6789-0-123-4",
    docGov: "สรร-6789-0-123-4",
    agency: "อำเภอ",
  },
  {
    id: 7,
    name: "นางสาวสมภัทร มีความสุข",
    citizenId: "1341501436232",
    subject: "ปัญหาที่ระบบชะลอขึ้นระบบ",
    docKk: "สป-กค-7890-1-234-5",
    docSr: "สป-สร-7890-1-234-5",
    docStp: "สตป-7890-1-234-5",
    docGov: "สรร-7890-1-234-5",
    agency: "กรุงเทพมหานคร",
  },
  {
    id: 8,
    name: "นางเพทพินี เพชรมแทะละ",
    citizenId: "1267900395693",
    subject: "ประกาศนั้นไม่บังคับชอบ",
    docKk: "สป-กค-8901-2-345-6",
    docSr: "สป-สร-8901-2-345-6",
    docStp: "สตป-8901-2-345-6",
    docGov: "สรร-8901-2-345-6",
    agency: "เมืองพัทยา",
  },
  {
    id: 9,
    name: "นางสาวจารุจิต ดีดีศักดิ์ดีงาม",
    citizenId: "1129901653956",
    subject: "พฤติกรรมเจ้าหน้าที่ กค. ไม่เหมาะสม",
    docKk: "สป-กค-9012-3-456-7",
    docSr: "สป-สร-9012-3-456-7",
    docStp: "สตป-9012-3-456-7",
    docGov: "สรร-9012-3-456-7",
    agency: "เทศบาลตำบล",
  },
  {
    id: 10,
    name: "นางสมสุข พุกข์เบิกหน่อย",
    citizenId: "1104301948071",
    subject: "ระบบขัดข้องระหว่างส่งข้อมูล",
    docKk: "สป-กค-0123-4-567-8",
    docSr: "สป-สร-0123-4-567-8",
    docStp: "สตป-0123-4-567-8",
    docGov: "สรร-0123-4-567-8",
    agency: "องค์การบริหารส่วนจังหวัด",
  },
];

// Mockup data สำหรับ agencyOptions
const mockAgencyOptions = [
  { value: "", label: "เลือกหน่วยงาน" },
  { value: "กระทรวงมหาดไทย", label: "กระทรวงมหาดไทย" },
  {
    value: "กรมส่งเสริมการปกครองท้องถิ่น",
    label: "กรมส่งเสริมการปกครองท้องถิ่น",
  },
  { value: "กรมการปกครอง", label: "กรมการปกครอง" },
  {
    value: "กรมป้องกันและบรรเทาสาธารณภัย",
    label: "กรมป้องกันและบรรเทาสาธารณภัย",
  },
  { value: "กรมโยธาธิการและผังเมือง", label: "กรมโยธาธิการและผังเมือง" },
  { value: "จังหวัด", label: "จังหวัด" },
  { value: "อำเภอ", label: "อำเภอ" },
  { value: "องค์การบริหารส่วนจังหวัด", label: "องค์การบริหารส่วนจังหวัด" },
  { value: "เทศบาลเมือง", label: "เทศบาลเมือง" },
  { value: "เทศบาลตำบล", label: "เทศบาลตำบล" },
  { value: "องค์การบริหารส่วนตำบล", label: "องค์การบริหารส่วนตำบล" },
  { value: "กรุงเทพมหานคร", label: "กรุงเทพมหานคร" },
  { value: "เมืองพัทยา", label: "เมืองพัทยา" },
  {
    value: "สำนักงานคณะกรรมการการเลือกตั้ง",
    label: "สำนักงานคณะกรรมการการเลือกตั้ง",
  },
  { value: "สำนักงานตำรวจแห่งชาติ", label: "สำนักงานตำรวจแห่งชาติ" },
  { value: "สำนักงาน ก.พ.", label: "สำนักงาน ก.พ." },
  { value: "สำนักงานอัยการสูงสุด", label: "สำนักงานอัยการสูงสุด" },
  { value: "สำนักงานศาลยุติธรรม", label: "สำนักงานศาลยุติธรรม" },
  { value: "กระทรวงการคลัง", label: "กระทรวงการคลัง" },
  { value: "กระทรวงศึกษาธิการ", label: "กระทรวงศึกษาธิการ" },
  { value: "กระทรวงสาธารณสุข", label: "กระทรวงสาธารณสุข" },
  { value: "กระทรวงแรงงาน", label: "กระทรวงแรงงาน" },
  { value: "กระทรวงยุติธรรม", label: "กระทรวงยุติธรรม" },
  {
    value: "กระทรวงพัฒนาสังคมและความมั่นคงของมนุษย์",
    label: "กระทรวงพัฒนาสังคมและความมั่นคงของมนุษย์",
  },
  { value: "หน่วยงานเอกชน", label: "หน่วยงานเอกชน" },
  { value: "รัฐวิสาหกิจ", label: "รัฐวิสาหกิจ" },
  { value: "อื่นๆ", label: "อื่นๆ" },
];

const safeIncludes = (text, query) =>
  (text ?? "")
    .toString()
    .toLowerCase()
    .includes((query ?? "").toString().toLowerCase());

const SearchComplaints = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const router = useRouter();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await GetEnhancedComplaints({ skip: 0, limit: 10000 });
        const items = res?.res_data?.items || [];

        const mapped = items.map((item) => ({
          id: item.id,
          name: item.complainant_name || "-",
          citizenId: item.citizen_id || "-", // หรือ "-"
          subject: item.subject || "-",
          docKk: item.reference_number || "-",
          docSr: item.reference_number2 || "-",
          docStp: item.reference_number3 || "-",
          docGov: item.reference_number4 || "-",
          agency: item.incident_location || "-",
        }));

        setAllComplaints(mapped);
        setFilteredComplaints(mapped);
      } catch (err) {
        console.error("โหลดข้อมูลร้องเรียนล้มเหลว:", err);
      }
    };

    fetchData();
  }, []);
  const handleNavigateTo = () =>
    router.push("/admin/edit/search/Filteromplaints");

  const handleSearch = (filters) => {
    const {
      claimantName,
      citizenId,
      subject,
      docGov,
      agency,
      docKk,
      docSr,
      docStp,
    } = filters;


    const result = allComplaints.filter((item) => {
      // ชื่อผู้ร้อง
      if (claimantName && !safeIncludes(item.name, claimantName)) {
        return false;
      }

      // เลขบัตรประชาชน
      if (citizenId && !safeIncludes(item.citizenId, citizenId)) {
        return false;
      }

      // ชื่อเรื่อง
      if (subject && !safeIncludes(item.subject, subject)) {
        return false;
      }

      // เลขที่ส่วนรับราชการ
      if (docGov && !safeIncludes(item.docGov, docGov)) {
        return false;
      }

      // หน่วยงาน
      if (agency && item.agency !== agency) {
        return false;
      }

      // เลขที่สป.กค.
      if (docKk && !safeIncludes(item.docKk, docKk)) {
        return false;
      }

      // เลขที่สป.สร.
      if (docSr && !safeIncludes(item.docSr, docSr)) {
        return false;
      }

      // เลขที่สตป.
      if (docStp && !safeIncludes(item.docStp, docStp)) {
        return false;
      }

      return true;
    });

    console.log("Search result:", result);
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
        agencyOptions={mockAgencyOptions}
      />
    </>
  );
};

export default SearchComplaints;
