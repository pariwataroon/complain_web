import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAnnualCompSum from "@services/TableAnnualCompSum/TableAnnualCompSum";
import { GetAnnualComplaintSummary } from "@pages/api/report/report";

const AnnualComplaintSummaryComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({}); // เก็บ filter ปัจจุบัน
  const router = useRouter();

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (filters = {}) => {
    setLoading(true);
    try {
      const year = filters.year || new Date().getFullYear();

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

      const res = await GetAnnualComplaintSummary(year, dateFrom, dateTo);
      const items = res?.res_data?.items || [];

      setAllComplaints(items);
      setFilteredComplaints(items);
    } catch (error) {
      console.error("Error fetching annual complaint summary:", error);
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

  //แปลงวันที่ให้คืนค่า เป็น พ.ศ.
  const formatDateForComparison = (dateInput) => {
    if (!dateInput) return null;

    if (typeof dateInput === "string" && dateInput.includes("T")) {
      const date = new Date(dateInput);
      const year = date.getFullYear() + 543;
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`; // → พ.ศ.
    }

    if (dateInput instanceof Date) {
      const year = dateInput.getFullYear() + 543;
      const month = String(dateInput.getMonth() + 1).padStart(2, "0");
      const day = String(dateInput.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split("-");
      const buddhistYear = parseInt(year) < 2500 ? parseInt(year) + 543 : parseInt(year);
      return `${buddhistYear}-${month}-${day}`;
    }

    return null;
  };

  //ค้นหาวันที่ ตั้งแต่วันที - ถึงวันที่
  const handleSearch = async ({ receiveDateFrom, receiveDateTo, issueType }) => {
    setCurrentFilters({ receiveDateFrom, receiveDateTo, issueType }); // เก็บ filter ปัจจุบัน
    await fetchData({ receiveDateFrom, receiveDateTo, issueType });
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
          { label: "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ" },
        ]}
      />

      <TableAnnualCompSum
        data={filteredComplaints}
        loading={loading}
        onSearch={handleSearch}
        actionButtonLabel="สรุปผลตามประเภทเรื่อง"
        onActionClick={handleSummaryByIssueType}
        navigateTo="/admin/document/annual-complaint-summary/reportresults"
        dateFrom={currentFilters.receiveDateFrom}
        dateTo={currentFilters.receiveDateTo}
        filterFields={[
          {
            name: "receiveDateFrom",
            label: "ตั้งแต่วันที่",
            type: "date",
          },
          {
            name: "receiveDateTo",
            label: "ถึงวันที่",
            type: "date",
          },
        ]}
      />
    </>
  );
};

export default AnnualComplaintSummaryComponents;
