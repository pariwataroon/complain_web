// pages/admin/ComplaintArchives.jsx

import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListTab from "@services/TableListTab/TableListTab";

// mock data for summary (tab 0)
const mockSummary = [
  {
    id: 1,
    claimantName: "นายปิยกร อภิบาลศรี",
    totalDept: 8,
    inProgressCnt: 6,
    closedCnt: 2,
  },
  {
    id: 2,
    claimantName: "นายเกียรติเดช วงศ์น้อย",
    totalDept: 9,
    inProgressCnt: 6,
    closedCnt: 3,
  },
  {
    id: 3,
    claimantName: "นายจุฑาพงศ์ จิตติสักกุล",
    totalDept: 10,
    inProgressCnt: 4,
    closedCnt: 6,
  },
  {
    id: 4,
    claimantName: "นางสาวจุฑิมา ศรีปราชญ์",
    totalDept: 23,
    inProgressCnt: 3,
    closedCnt: 20,
  },
  {
    id: 5,
    claimantName: "นายอรรถพล ธรรถพงศ์",
    totalDept: 9,
    inProgressCnt: 8,
    closedCnt: 1,
  },
  {
    id: 6,
    claimantName: "นางสาวทิพย์เพ็ญ จักรพันธ์",
    totalDept: 19,
    inProgressCnt: 4,
    closedCnt: 15,
  },
];

// mock data for pending (tab 1)
const mockPending = [
  {
    id: 1,
    claimantName: "นายปิยกร อภิบาลศรี",
    pendingBetween: 36,
    inProcessFY2568: 6,
    total: 42,
  },
  {
    id: 2,
    claimantName: "นายเกียรติเดช วงศ์น้อย",
    pendingBetween: 28,
    inProcessFY2568: 6,
    total: 34,
  },
  {
    id: 3,
    claimantName: "นายจุฑาพงศ์ จิตติสักกุล",
    pendingBetween: 21,
    inProcessFY2568: 4,
    total: 25,
  },
  {
    id: 4,
    claimantName: "นางสาวจุฑิมา ศรีปราชญ์",
    pendingBetween: 33,
    inProcessFY2568: 3,
    total: 36,
  },
  {
    id: 5,
    claimantName: "นายอรรถพล ธรรถพงศ์",
    pendingBetween: 32,
    inProcessFY2568: 8,
    total: 40,
  },
  {
    id: 6,
    claimantName: "นางสาวทิพย์เพ็ญ จักรพันธ์",
    pendingBetween: 6,
    inProcessFY2568: 4,
    total: 10,
  },
];

const ComplaintArchives = () => {
  const [filteredSummary] = useState(mockSummary);
  const [filteredPending] = useState(mockPending);
  const router = useRouter();

  const handleSearch = (filters) => {
    // ถ้ามีฟิลด์วันที่ใน data ให้กรองที่นี่
    // ตอนนี้ mock ไม่มีวันที่ จึงยังไม่กรอง
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
          { name: "receiveDateFrom", label: "ตั้งแต่วันที่", type: "text" },
          { name: "receiveDateTo", label: "ถึงวันที่", type: "text" },
        ]}
        // navigateTo="/admin/document/annual-inspector-complaints-summary/resultscomplaints"
      />
    </>
  );
};

export default ComplaintArchives;
