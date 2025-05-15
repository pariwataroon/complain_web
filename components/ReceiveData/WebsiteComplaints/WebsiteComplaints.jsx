import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListWebComplaints from "@services/TableListWebComplaints/TableListWebComplaints";
import { GetAllComplaints } from "@pages/api/complaint/complaint";


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




const agencyOptions = [
  "กรมสรรพากร",
  "กรมศุลกากร",
  "กรมบัญชีกลาง",
  "สำนักงานเศรษฐกิจการคลัง",
  "สำนักงานบริหารหนี้สาธารณะ",
  "ธนาคารแห่งประเทศไทย",
];


const WebsiteComplaints = () => {
  const router = useRouter();

  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const fetchComplaints = async () => {
    const skip = page * limit;
    try {
      const res = await GetAllComplaints({ skip, limit });
      setAllComplaints(res?.res_data?.items || []);
      setFilteredComplaints(res?.res_data?.items || []);
      setTotalCount(res?.res_data?.pagination?.total || 0);
    } catch (error) {
      console.error("Load complaints failed", error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, limit]);

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
      const safeIncludes = (text, query) =>
        (text ?? "").toLowerCase().includes((query ?? "").toLowerCase());

      if (claimantName && !safeIncludes(item.complainant_name, claimantName))
        return false;
      if (issueType && !safeIncludes(item.complaint_type, issueType))
        return false;
      if (subIssueType && !safeIncludes(item.subIssueType, subIssueType))
        return false;
      if (ssoNo && !safeIncludes(item.ssoNo, ssoNo)) return false;
      if (subject && !safeIncludes(item.subject, subject)) return false;
      if (accusedName && !safeIncludes(item.respondent_name, accusedName))
        return false;
      return true;
    });

    setFilteredComplaints(result);
  };

  const handleNavigateTo = () => router.push("/admin/edit/website-complaints");

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
        page={page}
        onPageChange={setPage}
        rowsPerPage={limit}
        onRowsPerPageChange={setLimit}
        total={totalCount}
      />
    </>
  );
};

export default WebsiteComplaints;