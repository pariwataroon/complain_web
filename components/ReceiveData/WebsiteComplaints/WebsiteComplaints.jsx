import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListWebComplaints from "@services/TableListWebComplaints/TableListWebComplaints";
import { GetAllComplaints } from "@pages/api/complaint/complaint";
import dayjs from "dayjs";

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
    const options = [
      { value: "", label: "เลือกประเภทเรื่อง" },
      ...availableTypes,
    ];

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

      setAllComplaints(res?.res_data?.items || []);
      setFilteredComplaints(res?.res_data?.items || []);
      setTotalCount(res?.res_data?.pagination?.total || 0);

      const types = res?.res_data?.filters?.available_types || [];

      setAvailableTypes(types);

      setTimeout(() => {}, 100);
    } catch (error) {
      console.error("❌ Load complaints failed", error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, limit]);

  const handleSearch = (filters) => {
    const {
      claimantName,
      issueType,
      issueSubType,
      ssoNo,
      subject,
      accusedName,
      startDate,
      endDate,
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

      // Filter ตามวันที่สร้าง
      if (startDate || endDate) {
        if (!item.created_at) return false;

        const itemDate = dayjs(item.created_at);
        if (!itemDate.isValid()) return false;

        // ถ้ามี startDate ให้เช็คว่าวันที่สร้างต้อง >= startDate (เริ่มต้นวัน)
        if (startDate) {
          const start = dayjs(startDate).startOf('day');
          if (itemDate.isBefore(start)) return false;
        }

        // ถ้ามี endDate ให้เช็คว่าวันที่สร้างต้อง <= endDate (สิ้นสุดวัน)
        if (endDate) {
          const end = dayjs(endDate).endOf('day');
          if (itemDate.isAfter(end)) return false;
        }
      }

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
