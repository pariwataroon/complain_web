import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListTab from "@services/TableListTab/TableListTab";
import {
  GetAllReportsInspectorPending,
  GetAllReportsInspector,
} from "@pages/api/report/report"; // เพิ่ม GetAllReportsInspector

const ResultsComplaintsComponents = () => {
  const [allSummaryData, setAllSummaryData] = useState([]);
  const [filteredSummary, setFilteredSummary] = useState([]);
  const [allPendingData, setAllPendingData] = useState([]);
  const [filteredPending, setFilteredPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxDate, setMaxDate] = useState(null);
  const router = useRouter();

  // Helper: แปลงข้อมูล API summary
  function transformSummaryAPI(items = []) {
    // ปรับตามโครงสร้าง API ของ GetAllReportsInspector
    // ตัวอย่าง: total_sent, total_closed, total_in_progress
    return items.map((item, idx) => ({
      id: idx + 1,
      claimantName: item.signature_authority_user_name,
      totalDept: item.total_sent,
      inProgressCnt: item.total_in_progress,
      closedCnt: item.total_closed,
      receiveDate: "-", // ถ้า API summary มีวันที่ ให้ map ได้เลย
    }));
  }

  // Helper: แปลงข้อมูล API pending
  function transformPendingAPI(items = []) {
    return items.map((item, idx) => ({
      id: idx + 1,
      claimantName: item.signature_authority_user_name,
      pendingBetween: item.pending_count,
      inProcessFY2568: item.inprogress_count,
      total: (item.pending_count || 0) + (item.inprogress_count || 0),
      receiveDate: "-", // ถ้ามีวันให้ใส่, ตอนนี้ไม่มีใน API
    }));
  }

  // Hydration-safe date state
  useEffect(() => {
    setMaxDate(new Date());
    fetchSummaryData();
    fetchPendingData();
    // eslint-disable-next-line
  }, []);

  const fetchSummaryData = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await GetAllReportsInspector("2025", "", "", "");
      const items = res?.res_data?.items ?? [];
      const transformed = transformSummaryAPI(items);
      setAllSummaryData(transformed);
      setFilteredSummary(transformed);
    } catch (e) {
      setAllSummaryData([]);
      setFilteredSummary([]);
    }
    setLoading(false);
  };

  const fetchPendingData = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await GetAllReportsInspectorPending("2025", "", "");
      const items = res?.res_data?.items ?? [];
      const transformed = transformPendingAPI(items);
      setAllPendingData(transformed);
      setFilteredPending(transformed);
    } catch (e) {
      setAllPendingData([]);
      setFilteredPending([]);
    }
    setLoading(false);
  };

  const convertThaiDateToDate = (input) => {
    if (!input) return null;
    if (input instanceof Date && !isNaN(input)) return input;
    const parsed = new Date(input);
    if (!isNaN(parsed)) return parsed;
    const [year, month, day] = input.split("-").map(Number);
    return new Date(year - 543, month - 1, day);
  };
  const convertStringToDate = (thaiDateStr) => {
    if (!thaiDateStr) return null;
    const months = {
      "ม.ค.": 0,
      "ก.พ.": 1,
      "มี.ค.": 2,
      "เม.ย.": 3,
      "พ.ค.": 4,
      "มิ.ย.": 5,
      "ก.ค.": 6,
      "ส.ค.": 7,
      "ก.ย.": 8,
      "ต.ค.": 9,
      "พ.ย.": 10,
      "ธ.ค.": 11,
    };
    const [day, monthThai, yearThai] = thaiDateStr.split(" ");
    const month = months[monthThai];
    const year = parseInt(yearThai, 10) - 543;
    const d = parseInt(day, 10);
    return new Date(year, month, d);
  };

  // ฟิลเตอร์ข้อมูลสองตาราง
  const handleSearch = (filters) => {
    let filteredSummaryResult = [...allSummaryData];
    let filteredPendingResult = [...allPendingData];

    // ฟิลเตอร์วันที่ (ถ้ามี receiveDate จริง)
    if (filters.receiveDateFrom) {
      const fromDate = convertThaiDateToDate(filters.receiveDateFrom);
      if (fromDate) {
        fromDate.setHours(0, 0, 0, 0);
        filteredSummaryResult = filteredSummaryResult.filter((item) => {
          const itemDate = convertStringToDate(item.receiveDate);
          return itemDate && itemDate >= fromDate;
        });
        filteredPendingResult = filteredPendingResult.filter((item) => {
          const itemDate = convertStringToDate(item.receiveDate);
          return itemDate && itemDate >= fromDate;
        });
      }
    }
    if (filters.receiveDateTo) {
      const toDate = convertThaiDateToDate(filters.receiveDateTo);
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        filteredSummaryResult = filteredSummaryResult.filter((item) => {
          const itemDate = convertStringToDate(item.receiveDate);
          return itemDate && itemDate <= toDate;
        });
        filteredPendingResult = filteredPendingResult.filter((item) => {
          const itemDate = convertStringToDate(item.receiveDate);
          return itemDate && itemDate <= toDate;
        });
      }
    }

    // ฟิลเตอร์ตามชื่อ (ถ้ามี)
    if (filters.searchName && filters.searchName.trim()) {
      const searchTerm = filters.searchName.trim().toLowerCase();
      filteredSummaryResult = filteredSummaryResult.filter((item) =>
        item.claimantName.toLowerCase().includes(searchTerm)
      );
      filteredPendingResult = filteredPendingResult.filter((item) =>
        item.claimantName.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredSummary(filteredSummaryResult);
    setFilteredPending(filteredPendingResult);
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
            url: "/admin",
          },
          {
            label: "สรุปผลการดำเนินการและเรื่องค้างพิจารณาของผู้ตรวจราชการ",
            url: "/admin/document/annual-inspector-complaints-summary",
          },
          { label: "ผลการดำเนินการและเรื่องค้างพิจารณา" },
        ]}
      />

      <TableListTab
        summaryData={filteredSummary}
        pendingData={filteredPending}
        loading={loading}
        onSearch={handleSearch}
        filterFields={[
          {
            name: "receiveDateFrom",
            label: "ตั้งแต่วันที่",
            type: "date",
            placeholder: "เลือกวันที่เริ่มต้น",
            maxDate: maxDate,
          },
          {
            name: "receiveDateTo",
            label: "ถึงวันที่",
            type: "date",
            placeholder: "เลือกวันที่สิ้นสุด",
            maxDate: maxDate,
          },
        ]}
      />
    </>
  );
};

export default ResultsComplaintsComponents;