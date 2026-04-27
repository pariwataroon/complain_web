import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListWebComplaints from "@services/TableListWebComplaints/TableListWebComplaints";
import { GetAllComplaints } from "@pages/api/complaint/complaint";
import { GetAllSubComplaintTypes } from "@pages/api/allselect/allselect";
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
  const [apiSubTypes, setApiSubTypes] = useState([]);

  // สร้าง issueTypeOptions จาก API response
  const issueTypeOptions = useMemo(() => {
    const options = [
      { value: "", label: "เลือกประเภทเรื่อง" },
      ...availableTypes,
    ];

    return options;
  }, [availableTypes]);

  // สร้าง issueSubTypeOptions จาก API
  const issueSubTypeOptions = useMemo(() => {
    return [
      { value: "", label: "เลือกประเภทเรื่องย่อย" },
      ...apiSubTypes.map((type) => ({
        value: type.name,
        label: type.name,
      })),
    ];
  }, [apiSubTypes]);

  const fetchComplaints = async () => {
    const skip = page * limit;
    try {
      const res = await GetAllComplaints({ skip, limit });

      // กรองเฉพาะช่องทางเว็บไซต์ (ตามชื่อเมนู "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์")
      const allItems = res?.res_data?.items || [];
      const websiteOnly = allItems.filter((item) => {
        const channelName = (item.complaint_channel_name || "").toLowerCase();
        const channelId = (item.complaint_channel_id || "").toLowerCase();
        // กรองเฉพาะ channel ที่เป็นเว็บไซต์
        return (
          channelName.includes("เว็บไซต์") ||
          channelName.includes("website") ||
          channelName.includes("complain.mof.go.th") ||
          channelId === "website" ||
          channelId.includes("เว็บไซต์")
        );
      });

      setAllComplaints(websiteOnly);
      setFilteredComplaints(websiteOnly);
      setTotalCount(websiteOnly.length);

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

  // ดึง sub-types จาก API
  useEffect(() => {
    (async () => {
      try {
        const res = await GetAllSubComplaintTypes();
        if (res?.res_code === "0000" && Array.isArray(res?.res_data?.items)) {
          setApiSubTypes(res.res_data.items);
        }
      } catch (e) {
        console.error("Error fetching sub complaint types:", e);
      }
    })();
  }, []);

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
