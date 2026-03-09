import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListTab from "@services/TableListTab/TableListTab";
import {
  GetAllReportsInspectorPending,
  GetAllReportsInspector,
} from "@pages/api/report/report";
import { getSignatureAuthorities } from "@pages/api/department/department";

const ResultsComplaintsComponents = () => {
  const [filteredSummary, setFilteredSummary] = useState([]);
  const [filteredPending, setFilteredPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxDate, setMaxDate] = useState(null);
  const [inspectorPositions, setInspectorPositions] = useState(new Map());
  const [rawSummaryData, setRawSummaryData] = useState([]);
  const [rawPendingData, setRawPendingData] = useState([]);
  const router = useRouter();

  // ดึงข้อมูลตำแหน่งผู้ตรวจ
  const fetchInspectorPositions = async () => {
    try {
      const sig = await getSignatureAuthorities();
      const positions = new Map();
      const groups = sig?.res_data?.groups || sig?.groups || [];

      for (const group of groups) {
        const position = group?.group_description || "";
        const users = group?.users || [];

        for (const user of users) {
          if (user.user_id && position) {
            positions.set(user.user_id, position);
          }
        }
      }

      setInspectorPositions(positions);
      return positions;
    } catch (e) {
      console.error("Error fetching inspector positions:", e);
      return new Map();
    }
  };

  // แปลงข้อมูล summary เมื่อ inspectorPositions หรือ rawSummaryData เปลี่ยน
  useEffect(() => {
    if (rawSummaryData.length > 0) {
      const transformed = rawSummaryData.map((item, idx) => {
        const userName = item.signature_authority_user_name || "";
        const userId = item.signature_authority_user_id;
        const position = inspectorPositions.get(userId) || "";
        const displayName = position ? `${position}(${userName})` : userName;

        return {
          id: idx + 1,
          claimantName: displayName || "-",
          totalDept: item.total_sent ?? 0,
          inProgressCnt: item.total_in_progress ?? 0,
          closedCnt: item.total_closed ?? 0,
          receiveDate: "-",
        };
      });
      setFilteredSummary(transformed);
    }
  }, [inspectorPositions, rawSummaryData]);

  // แปลงข้อมูล pending เมื่อ inspectorPositions หรือ rawPendingData เปลี่ยน
  useEffect(() => {
    if (rawPendingData.length > 0) {
      const transformed = rawPendingData.map((item, idx) => {
        const userName = item.signature_authority_user_name || "";
        const userId = item.signature_authority_user_id;
        const position = inspectorPositions.get(userId) || "";
        const displayName = position ? `${position}(${userName})` : userName;

        return {
          id: idx + 1,
          claimantName: displayName || "-",
          pendingBetween: item.pending_count ?? 0,
          inProcessFY2568: item.inprogress_count ?? 0,
          total: (item.pending_count || 0) + (item.inprogress_count || 0),
          receiveDate: "-",
        };
      });
      setFilteredPending(transformed);
    }
  }, [inspectorPositions, rawPendingData]);

  // Initial load
  useEffect(() => {
    setMaxDate(new Date());
    const init = async () => {
      await fetchInspectorPositions();
      await fetchSummaryData({});
      await fetchPendingData({});
    };
    init();
    // eslint-disable-next-line
  }, []);

  const fetchSummaryData = async (filters = {}) => {
    setLoading(true);
    try {
      const dateFrom = filters.receiveDateFrom || "";
      const dateTo = filters.receiveDateTo || "";
      const year = filters.receiveDateFrom
        ? new Date(filters.receiveDateFrom).getFullYear().toString()
        : new Date().getFullYear().toString();

      console.log("Fetching summary data with year:", year, "dateFrom:", dateFrom, "dateTo:", dateTo);

      const res = await GetAllReportsInspector(year, "", "", "", dateFrom, dateTo);
      const items = res?.res_data?.items ?? res?.items ?? [];

      console.log("Summary API response:", res);
      console.log("Summary items:", items);

      setRawSummaryData(items);
    } catch (e) {
      console.error("Error fetching summary data:", e);
      setRawSummaryData([]);
      setFilteredSummary([]);
    }
    setLoading(false);
  };

  const fetchPendingData = async (filters = {}) => {
    setLoading(true);
    try {
      const dateFrom = filters.receiveDateFrom || "";
      const dateTo = filters.receiveDateTo || "";
      const year = filters.receiveDateFrom
        ? new Date(filters.receiveDateFrom).getFullYear().toString()
        : new Date().getFullYear().toString();

      console.log("Fetching pending data with year:", year, "dateFrom:", dateFrom, "dateTo:", dateTo);

      const res = await GetAllReportsInspectorPending(year, "", "", dateFrom, dateTo);
      const items = res?.res_data?.items ?? res?.items ?? [];

      console.log("Pending API response:", res);
      console.log("Pending items:", items);

      setRawPendingData(items);
    } catch (e) {
      console.error("Error fetching pending data:", e);
      setRawPendingData([]);
      setFilteredPending([]);
    }
    setLoading(false);
  };

  const handleSearch = async (filters) => {
    await Promise.all([
      fetchSummaryData(filters),
      fetchPendingData(filters)
    ]);
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
