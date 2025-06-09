import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListTab from "@services/TableListTab/TableListTab";

// mock data for summary (tab 0) - เพิ่ม receiveDate
const mockSummary = [
  {
    id: 1,
    claimantName: "นายปิยกร อภิบาลศรี",
    totalDept: 8,
    inProgressCnt: 6,
    closedCnt: 2,
    receiveDate: "15 ม.ค. 2568",
  },
  {
    id: 2,
    claimantName: "นายเกียรติเดช วงศ์น้อย",
    totalDept: 9,
    inProgressCnt: 6,
    closedCnt: 3,
    receiveDate: "23 ก.พ. 2568",
  },
  {
    id: 3,
    claimantName: "นายจุฑาพงศ์ จิตติสักกุล",
    totalDept: 10,
    inProgressCnt: 4,
    closedCnt: 6,
    receiveDate: "8 มี.ค. 2568",
  },
  {
    id: 4,
    claimantName: "นางสาวจุฑิมา ศรีปราชญ์",
    totalDept: 23,
    inProgressCnt: 3,
    closedCnt: 20,
    receiveDate: "12 เม.ย. 2567",
  },
  {
    id: 5,
    claimantName: "นายอรรถพล ธรรถพงศ์",
    totalDept: 9,
    inProgressCnt: 8,
    closedCnt: 1,
    receiveDate: "27 พ.ค. 2567",
  },
  {
    id: 6,
    claimantName: "นางสาวทิพย์เพ็ญ จักรพันธ์",
    totalDept: 19,
    inProgressCnt: 4,
    closedCnt: 15,
    receiveDate: "3 มิ.ย. 2567",
  },
];

// mock data for pending (tab 1) - เพิ่ม receiveDate
const mockPending = [
  {
    id: 1,
    claimantName: "นายปิยกร อภิบาลศรี",
    pendingBetween: 36,
    inProcessFY2568: 6,
    total: 42,
    receiveDate: "15 ม.ค. 2568",
  },
  {
    id: 2,
    claimantName: "นายเกียรติเดช วงศ์น้อย",
    pendingBetween: 28,
    inProcessFY2568: 6,
    total: 34,
    receiveDate: "23 ก.พ. 2568",
  },
  {
    id: 3,
    claimantName: "นายจุฑาพงศ์ จิตติสักกุล",
    pendingBetween: 21,
    inProcessFY2568: 4,
    total: 25,
    receiveDate: "8 มี.ค. 2568",
  },
  {
    id: 4,
    claimantName: "นางสาวจุฑิมา ศรีปราชญ์",
    pendingBetween: 33,
    inProcessFY2568: 3,
    total: 36,
    receiveDate: "12 เม.ย. 2567",
  },
  {
    id: 5,
    claimantName: "นายอรรถพล ธรรถพงศ์",
    pendingBetween: 32,
    inProcessFY2568: 8,
    total: 40,
    receiveDate: "27 พ.ค. 2567",
  },
  {
    id: 6,
    claimantName: "นางสาวทิพย์เพ็ญ จักรพันธ์",
    pendingBetween: 6,
    inProcessFY2568: 4,
    total: 10,
    receiveDate: "3 มิ.ย. 2567",
  },
];

const ResultsComplaintsComponents = () => {
  const [allSummaryData] = useState(mockSummary);
  const [allPendingData] = useState(mockPending);
  const [filteredSummary, setFilteredSummary] = useState(mockSummary);
  const [filteredPending, setFilteredPending] = useState(mockPending);
  const router = useRouter();

  // ← แก้ไขฟังก์ชันแปลงวันที่ให้ใช้งานได้ถูกต้อง
  const convertThaiDateToDate = (thaiDate) => {
    if (!thaiDate) return null;

    console.log("🔄 Converting Thai date:", thaiDate);

    // ถ้าเป็น object จาก DateThaiPickerService
    if (
      typeof thaiDate === "object" &&
      thaiDate.day &&
      thaiDate.month &&
      thaiDate.year
    ) {
      // ใช้ year จาก object (ปี ค.ศ.)
      const gregorianYear = thaiDate.year;
      const result = new Date(gregorianYear, thaiDate.month - 1, thaiDate.day);
      console.log(
        `📅 Converted ${thaiDate.day}/${thaiDate.month}/${gregorianYear} to:`,
        result
      );
      return result;
    }

    // ถ้าเป็น string format "YYYY-MM-DD" จาก TextField
    if (typeof thaiDate === "string" && thaiDate.includes("-")) {
      const [year, month, day] = thaiDate.split("-").map(Number);
      if (year && month && day) {
        const result = new Date(year, month - 1, day);
        console.log(`📅 Converted string ${thaiDate} to:`, result);
        return result;
      }
    }

    return null;
  };

  // ← ปรับปรุงฟังก์ชันแปลงวันที่จาก string format "DD MMM. YYYY" เป็น Date object
  const convertStringToDate = (dateStr) => {
    if (!dateStr) return null;

    const thaiMonthMap = {
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

    // แยก string format "15 ม.ค. 2568"
    const parts = dateStr.split(" ");
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0]);
    const monthAbbrev = parts[1];
    const buddhistYear = parseInt(parts[2]);

    // แปลงปี พ.ศ. เป็น ค.ศ.
    const gregorianYear = buddhistYear;

    const month = thaiMonthMap[monthAbbrev];
    if (isNaN(day) || month === undefined || isNaN(gregorianYear)) return null;

    const result = new Date(gregorianYear, month, day);
    console.log(`📊 Data date ${dateStr} converted to:`, result);
    return result;
  };

  // ← แก้ไขฟังก์ชัน handleSearch ให้ทำงานถูกต้อง
  const handleSearch = (filters) => {
    console.log("🔍 Search filters received:", filters);

    let filteredSummaryResult = [...allSummaryData];
    let filteredPendingResult = [...allPendingData];

    // กรองตามวันที่เริ่มต้น
    if (filters.receiveDateFrom) {
      console.log("📅 From date filter:", filters.receiveDateFrom);
      const fromDate = convertThaiDateToDate(filters.receiveDateFrom);
      console.log("📅 Converted from date:", fromDate);

      if (fromDate) {
        // เซ็ตเวลาเป็นเริ่มวัน (00:00:00)
        fromDate.setHours(0, 0, 0, 0);
        console.log("📅 From date with time set:", fromDate);

        filteredSummaryResult = filteredSummaryResult.filter((item) => {
          const itemDate = convertStringToDate(item.receiveDate);
          const isMatch = itemDate && itemDate >= fromDate;
          console.log(
            `📊 Summary - ${item.claimantName}: ${
              item.receiveDate
            } -> ${itemDate?.toLocaleDateString()} >= ${fromDate.toLocaleDateString()} = ${isMatch}`
          );
          return isMatch;
        });

        filteredPendingResult = filteredPendingResult.filter((item) => {
          const itemDate = convertStringToDate(item.receiveDate);
          const isMatch = itemDate && itemDate >= fromDate;
          console.log(
            `📋 Pending - ${item.claimantName}: ${
              item.receiveDate
            } -> ${itemDate?.toLocaleDateString()} >= ${fromDate.toLocaleDateString()} = ${isMatch}`
          );
          return isMatch;
        });
      }
    }

    // กรองตามวันที่สิ้นสุด
    if (filters.receiveDateTo) {
      console.log("📅 To date filter:", filters.receiveDateTo);
      const toDate = convertThaiDateToDate(filters.receiveDateTo);
      console.log("📅 Converted to date:", toDate);

      if (toDate) {
        // เซ็ตเวลาเป็นสิ้นวัน (23:59:59)
        toDate.setHours(23, 59, 59, 999);
        console.log("📅 To date with time set:", toDate);

        filteredSummaryResult = filteredSummaryResult.filter((item) => {
          const itemDate = convertStringToDate(item.receiveDate);
          const isMatch = itemDate && itemDate <= toDate;
          console.log(
            `📊 Summary - ${item.claimantName}: ${
              item.receiveDate
            } -> ${itemDate?.toLocaleDateString()} <= ${toDate.toLocaleDateString()} = ${isMatch}`
          );
          return isMatch;
        });

        filteredPendingResult = filteredPendingResult.filter((item) => {
          const itemDate = convertStringToDate(item.receiveDate);
          const isMatch = itemDate && itemDate <= toDate;
          console.log(
            `📋 Pending - ${item.claimantName}: ${
              item.receiveDate
            } -> ${itemDate?.toLocaleDateString()} <= ${toDate.toLocaleDateString()} = ${isMatch}`
          );
          return isMatch;
        });
      }
    }

    // กรองตามชื่อ (ถ้ามี)
    if (filters.searchName && filters.searchName.trim()) {
      const searchTerm = filters.searchName.trim().toLowerCase();
      console.log("🔍 Name search term:", searchTerm);

      filteredSummaryResult = filteredSummaryResult.filter((item) =>
        item.claimantName.toLowerCase().includes(searchTerm)
      );
      filteredPendingResult = filteredPendingResult.filter((item) =>
        item.claimantName.toLowerCase().includes(searchTerm)
      );
    }

    console.log("📊 Final filter results:", {
      original: {
        summary: allSummaryData.length,
        pending: allPendingData.length,
      },
      filtered: {
        summary: filteredSummaryResult.length,
        pending: filteredPendingResult.length,
      },
      summaryItems: filteredSummaryResult.map(
        (item) => `${item.claimantName} (${item.receiveDate})`
      ),
      pendingItems: filteredPendingResult.map(
        (item) => `${item.claimantName} (${item.receiveDate})`
      ),
    });

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
        onSearch={handleSearch}
        filterFields={[
          {
            name: "receiveDateFrom",
            label: "ตั้งแต่วันที่",
            type: "date",
            placeholder: "เลือกวันที่เริ่มต้น",
            maxDate: new Date(),
          },
          {
            name: "receiveDateTo",
            label: "ถึงวันที่",
            type: "date",
            placeholder: "เลือกวันที่สิ้นสุด",
            maxDate: new Date(),
          },
        ]}
        navigateTo="/admin/document/annual-inspector-complaints-summary/resultscomplaints"
      />
    </>
  );
};

export default ResultsComplaintsComponents;
