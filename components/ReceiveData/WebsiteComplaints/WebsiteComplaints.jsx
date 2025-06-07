import React, { useState, useEffect, useMemo } from "react";
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

const WebsiteComplaints = () => {
  const router = useRouter();

  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [availableTypes, setAvailableTypes] = useState([]);

  // สร้าง issueTypeOptions จาก API response
  const issueTypeOptions = useMemo(() => {
    console.log("🔍 Creating issueTypeOptions");
    console.log("Available types length:", availableTypes.length);
    console.log("Available types content:", availableTypes);

    // ตรวจสอบ format ของข้อมูล
    if (availableTypes.length > 0) {
      console.log("First item type:", typeof availableTypes[0]);
      console.log("First item:", availableTypes[0]);
    }

    const options = [
      { value: "", label: "เลือกประเภทเรื่อง" },
      ...availableTypes,
    ];

    console.log("Final options:", options);
    console.log("Final options length:", options.length);

    return options;
  }, [availableTypes]);

  // สร้าง issueSubTypeOptions จากข้อมูลจริง
  const issueSubTypeOptions = useMemo(() => {
    const uniqueSubTypes = [
      ...new Set(
        allComplaints
          .map((item) => item.sub_complaint_type || item.subIssueType)
          .filter((type) => type && type.trim() !== "")
      ),
    ].sort();

    return [
      { value: "", label: "เลือกประเภทเรื่องย่อย" },
      ...uniqueSubTypes.map((type) => ({
        value: type,
        label: type,
      })),
    ];
  }, [allComplaints]);

  const fetchComplaints = async () => {
    const skip = page * limit;
    try {
      const res = await GetAllComplaints({ skip, limit });
      console.log("🔄 API Response full:", res);
      console.log("🔄 Items:", res?.res_data?.items);
      console.log("🔄 Filters:", res?.res_data?.filters);
      console.log(
        "🔄 Available types raw:",
        res?.res_data?.filters?.available_types
      );

      // ตั้งค่าข้อมูล complaints
      setAllComplaints(res?.res_data?.items || []);
      setFilteredComplaints(res?.res_data?.items || []);
      setTotalCount(res?.res_data?.pagination?.total || 0);

      // ตั้งค่า available_types จาก API
      const types = res?.res_data?.filters?.available_types || [];
      console.log("🔄 Setting available types:", types);
      console.log("🔄 Types length:", types.length);

      setAvailableTypes(types);

      // ตรวจสอบหลังจาก set state
      setTimeout(() => {
        console.log("🔄 After setState - availableTypes:", availableTypes);
      }, 100);
    } catch (error) {
      console.error("❌ Load complaints failed", error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, limit]);

  // เพิ่ม useEffect เพื่อตรวจสอบ availableTypes เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    console.log("🔄 availableTypes changed:", availableTypes);
    console.log("🔄 availableTypes length:", availableTypes?.length);
  }, [availableTypes]);

  const handleSearch = (filters) => {
    console.log("🔍 Search filters:", filters);

    const {
      claimantName,
      issueType,
      issueSubType,
      ssoNo,
      subject,
      accusedName,
    } = filters;

    const result = allComplaints.filter((item) => {
      const safeIncludes = (text, query) => {
        if (!query || query.trim() === "") return true;
        if (!text) return false;
        return text.toLowerCase().includes(query.toLowerCase().trim());
      };

      const exactMatch = (text, query) => {
        if (!query || query.trim() === "") return true;
        if (!text) return false;
        return text.trim() === query.trim();
      };

      // ชื่อผู้ร้อง - partial match
      if (claimantName && !safeIncludes(item.complainant_name, claimantName)) {
        return false;
      }

      // ประเภทเรื่อง - exact match
      if (issueType && !exactMatch(item.complaint_type, issueType)) {
        return false;
      }

      // ประเภทเรื่องย่อย - exact match
      if (
        issueSubType &&
        !exactMatch(item.sub_complaint_type || item.subIssueType, issueSubType)
      ) {
        return false;
      }

      // เลขที่ สรร - partial match
      if (ssoNo && !safeIncludes(item.complaint_number || item.ssoNo, ssoNo)) {
        return false;
      }

      // ชื่อเรื่อง - partial match
      if (subject && !safeIncludes(item.subject, subject)) {
        return false;
      }

      // ชื่อผู้ถูกร้อง - partial match
      if (accusedName && !safeIncludes(item.respondent_name, accusedName)) {
        return false;
      }

      return true;
    });

    console.log(`🎯 Found ${result.length} items after filtering`);
    setFilteredComplaints(result);
  };

  const handleNavigateTo = () => router.push("/admin/edit/website-complaints");

  // เพิ่ม debug component
  console.log("🔄 Component render - issueTypeOptions:", issueTypeOptions);
  console.log(
    "🔄 Component render - issueTypeOptions length:",
    issueTypeOptions?.length
  );

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />

      <TableListWebComplaints
        data={filteredComplaints}
        title="เรื่องราวร้องทุกข์ช่องทางเว็บไซต์"
        navigateTo="/admin/edit/website-complaints"
        issueTypeOptions={issueTypeOptions}
        issueSubTypeOptions={issueSubTypeOptions}
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
