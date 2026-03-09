import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAnnualResults from "@services/TableAnnualResults/TableAnnualResults";
import { GetAnnualComplaintDetails } from "@pages/api/report/report";

// Status options คงที่
const statusOptions = [
  { value: "ยุติ", label: "ยุติ" },
  { value: "อยู่ระหว่างดำเนินการ", label: "อยู่ระหว่างดำเนินการ" },
];

const ReportResultsComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [agencyOptions, setAgencyOptions] = useState([]); // เก็บ agency options จาก API
  const [officerOptions, setOfficerOptions] = useState([]); // เก็บ officer options จาก API
  const [currentFilters, setCurrentFilters] = useState({}); // เก็บ filter ปัจจุบัน
  const router = useRouter();

  // Fetch data on mount
  useEffect(() => {
    // ตรวจสอบ query parameters จาก URL
    const { department_id, dateFrom, dateTo } = router.query;
    const initialFilters = {};
    if (department_id) initialFilters.agency = department_id;
    if (dateFrom) initialFilters.receiveDateFrom = dateFrom;
    if (dateTo) initialFilters.receiveDateTo = dateTo;

    fetchData(initialFilters);
  }, [router.query]);

  const fetchData = async (filters = {}) => {
    setLoading(true);
    try {
      const year = filters.year || new Date().getFullYear();
      const departmentId = filters.agency || "";
      const status = filters.status || "";

      // แปลงวันที่เป็น ISO format (YYYY-MM-DD) สำหรับ API
      let dateFrom = "";
      let dateTo = "";

      if (filters.receiveDateFrom) {
        const fromDate = new Date(filters.receiveDateFrom);
        // แปลงเป็น ค.ศ. ถ้าเป็น พ.ศ.
        let fromYear = fromDate.getFullYear();
        if (fromYear > 2500) {
          fromYear -= 543;
        }
        dateFrom = `${fromYear}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
      }

      if (filters.receiveDateTo) {
        const toDate = new Date(filters.receiveDateTo);
        // แปลงเป็น ค.ศ. ถ้าเป็น พ.ศ.
        let toYear = toDate.getFullYear();
        if (toYear > 2500) {
          toYear -= 543;
        }
        dateTo = `${toYear}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`;
      }

      const res = await GetAnnualComplaintDetails(
        0,
        100,
        year,
        dateFrom,
        dateTo,
        departmentId,
        status
      );
      const items = res?.res_data?.items || [];

      // สร้าง filter options จากข้อมูลจริง
      const uniqueAgencies = [...new Set(items.map(item => item.agency || item.department_name).filter(Boolean))];
      const uniqueOfficers = [...new Set(items.map(item => item.responsibleOfficer || item.responsible_officer).filter(Boolean))];

      setAgencyOptions(uniqueAgencies.map(a => ({ value: a, label: a })));
      setOfficerOptions(uniqueOfficers.map(o => ({ value: o, label: o })));

      setAllComplaints(items);
      setFilteredComplaints(items);
    } catch (error) {
      console.error("Error fetching annual complaint details:", error);
      setAllComplaints([]);
      setFilteredComplaints([]);
    }
    setLoading(false);
  };

  // เปลี่ยนหน้า summary
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // ค้นหาข้อมูลจาก API
  const handleSearch = async (filters) => {
    setCurrentFilters(filters); // เก็บ filter ปัจจุบัน
    await fetchData(filters);
  };

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "เมนูรายงาน",
            icon: (
              <img
                src="/icons/Cube.png"
                alt="cube"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          {
            label: "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ",
            url: "/admin/document/annual-complaint-summary",
          },
          {
            label:
              "รายงานสรุปเรื่องร้องเรียนสำนักงานปลัดกระทรวงการคลัง / สำนักงานรัฐมนตรี",
          },
        ]}
      />

      <TableAnnualResults
        data={filteredComplaints}
        loading={loading}
        onSearch={handleSearch}
        actionButtonLabel="สรุปผลตามประเภทเรื่อง"
        onActionClick={handleSummaryByIssueType}
        navigateTo="/admin/document/annual-complaint-summary/reportresults"
        dateFrom={currentFilters.receiveDateFrom}
        dateTo={currentFilters.receiveDateTo}
        filterFields={[
          { name: "receiveDateFrom", label: "ตั้งแต่วันที่", type: "date" },
          { name: "receiveDateTo", label: "ถึงวันที่", type: "date" },
          {
            name: "agency",
            label: "หน่วยงานในสังกัด",
            type: "select",
            options: agencyOptions,
          },
          {
            name: "responsibleOfficer",
            label: "เจ้าหน้าที่รับผิดชอบ",
            type: "select",
            options: officerOptions,
          },
          {
            name: "status",
            label: "สถานะเรื่อง",
            type: "select",
            options: statusOptions,
          },
        ]}
      />
    </>
  );
};

export default ReportResultsComponents;
