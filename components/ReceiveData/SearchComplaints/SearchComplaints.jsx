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
        const res = await GetEnhancedComplaints({ skip: 0, limit: 100 });
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
