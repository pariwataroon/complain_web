import React, { useState, useEffect, useRef } from "react";
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const didFetchRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const data = await GetEnhancedComplaints({ skip: 0, limit: 100 });
        const complaints = data?.res_data?.items || [];
        setAllComplaints(complaints);
        setFilteredComplaints(complaints);
      } catch (e) {
        setAllComplaints([]);
        setFilteredComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const handleNavigateTo = () =>
    router.push("/admin/edit/search/Filteromplaints");

  const handleSearch = (filters) => {
    // คุณสามารถ filter client-side หรือ call API ใหม่ (แนะนำ call API ใหม่ถ้า dataset ใหญ่)
    // ตัวอย่างนี้ filter client-side
    const { claimantName, subject, docGov, agency, docKk, docSr, docStp } =
      filters;

    const safeIncludes = (text, query) =>
      (text ?? "")
        .toString()
        .toLowerCase()
        .includes((query ?? "").toString().toLowerCase());

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
        loading={loading}
      />
    </>
  );
};

export default SearchComplaints;
