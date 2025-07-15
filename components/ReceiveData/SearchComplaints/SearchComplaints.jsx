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
      />
    </>
  );
};

export default SearchComplaints;
