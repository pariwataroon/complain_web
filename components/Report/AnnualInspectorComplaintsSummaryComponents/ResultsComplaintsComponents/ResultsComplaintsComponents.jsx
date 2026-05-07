import React, { useState, useEffect, useRef, useCallback } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListTab from "@services/TableListTab/TableListTab";
import {
  GetAllReportsInspectorPending,
  GetAllReportsInspector,
} from "@pages/api/report/report";
import { getSignatureAuthorities } from "@pages/api/department/department";

/* ─── helpers (ใช้ logic เดียวกับหน้า AnnualInspectorComplaintsSummaryComponents) ─── */
const flattenToInspectors = (resData) => {
  const map = new Map();
  const groups = resData?.groups ?? [];
  for (const g of groups) {
    const users = g?.users ?? [];
    const position = g?.group_description || "";
    const groupName = g?.group_name || "";
    for (const u of users) {
      if (!map.has(u.user_id)) {
        map.set(u.user_id, {
          id: u.user_id,
          name: u.user_name,
          position: position,
          groupName: groupName,
        });
      } else {
        const entry = map.get(u.user_id);
        if (position) entry.position = position;
        if (groupName) entry.groupName = groupName;
      }
    }
  }
  const individuals = resData?.individuals ?? [];
  for (const u of individuals) {
    if (!map.has(u.user_id)) {
      map.set(u.user_id, {
        id: u.user_id,
        name: u.user_name,
        position: "",
        groupName: "",
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "th"));
};

// รวมข้อมูล report items เป็นรายการ per-inspector (สอดคล้องกับ buildRows ของหน้า 1)
const buildSummaryRows = (inspectors, reportItems) => {
  // รวมตัวเลขตาม inspector
  const byInspector = new Map();
  for (const it of reportItems || []) {
    const uid = it.signature_authority_user_id;
    if (!uid) continue;
    if (!byInspector.has(uid)) {
      byInspector.set(uid, {
        inspector_name: it.signature_authority_user_name || "(ไม่พบชื่อ)",
        total: 0,
        inProgress: 0,
        closed: 0,
      });
    }
    const agg = byInspector.get(uid);
    agg.total += Number(it.total_sent || 0);
    agg.inProgress += Number(it.total_in_progress || 0);
    agg.closed += Number(it.total_closed || 0);
  }

  // รวมรายชื่อผู้ตรวจจากสิทธิ์ + จากรายงาน
  const inspectorMap = new Map(inspectors.map((i) => [i.id, i]));
  for (const uid of byInspector.keys()) {
    if (!inspectorMap.has(uid)) {
      const repOne = byInspector.get(uid);
      inspectorMap.set(uid, {
        id: uid,
        name: repOne?.inspector_name || "(ไม่พบในสิทธิ์)",
        position: "",
      });
    }
  }

  const sorted = Array.from(inspectorMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "th")
  );

  return sorted.map((ins, idx) => {
    const agg = byInspector.get(ins.id);
    const displayName = ins.position
      ? `${ins.position}(${ins.name})`
      : ins.name;
    return {
      id: idx + 1,
      claimantName: displayName || "-",
      totalDept: agg?.total ?? 0,
      inProgressCnt: agg?.inProgress ?? 0,
      closedCnt: agg?.closed ?? 0,
      receiveDate: "-",
    };
  });
};

const transformPendingData = (items, positions) => {
  return items.map((item, idx) => {
    const userName = item.signature_authority_user_name || "";
    const userId = item.signature_authority_user_id;
    const position = positions.get(userId) || "";
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
};

const ResultsComplaintsComponents = () => {
  const [filteredSummary, setFilteredSummary] = useState([]);
  const [filteredPending, setFilteredPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxDate, setMaxDate] = useState(null);
  const inspectorsRef = useRef([]);
  const positionsRef = useRef(new Map());

  const getQueryParams = useCallback((filters = {}) => {
    const dateFrom = filters.receiveDateFrom || "";
    const dateTo = filters.receiveDateTo || "";
    // No year when no date filter = backend returns ALL data
    const year = filters.receiveDateFrom
      ? new Date(filters.receiveDateFrom).getFullYear().toString()
      : "";
    return { year, dateFrom, dateTo };
  }, []);

  // ดึงข้อมูลตำแหน่งผู้ตรวจ + flatten
  const fetchInspectors = async () => {
    try {
      const sig = await getSignatureAuthorities();
      const inspectorList = flattenToInspectors(sig?.res_data ?? sig);
      inspectorsRef.current = inspectorList;

      const positions = new Map();
      for (const ins of inspectorList) {
        if (ins.id && ins.position) {
          positions.set(ins.id, ins.position);
        }
      }
      positionsRef.current = positions;
      return inspectorList;
    } catch (e) {
      console.error("Error fetching inspector positions:", e);
      return [];
    }
  };

  // โหลดข้อมูลทั้ง 2 tab พร้อมกัน (ใช้ loading ร่วมกัน)
  const fetchAllData = async (filters = {}, inspectorList = null) => {
    setLoading(true);
    try {
      const { year, dateFrom, dateTo } = getQueryParams(filters);
      const inspectors = inspectorList || inspectorsRef.current;

      const [summaryRes, pendingRes] = await Promise.all([
        GetAllReportsInspector(year, "", "", "", dateFrom, dateTo, true),
        GetAllReportsInspectorPending(year, "", "", dateFrom, dateTo),
      ]);

      // Tab 1: summary — รวม per inspector เหมือนหน้า 1
      const summaryItems = summaryRes?.res_data?.items ?? summaryRes?.items ?? [];
      setFilteredSummary(buildSummaryRows(inspectors, summaryItems));

      // Tab 2: pending — แปลงข้อมูลเลย
      const pendingItems = pendingRes?.res_data?.items ?? pendingRes?.items ?? [];
      setFilteredPending(transformPendingData(pendingItems, positionsRef.current));
    } catch (e) {
      console.error("Error fetching data:", e);
      setFilteredSummary([]);
      setFilteredPending([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load — ไม่กรอง ดึงข้อมูลทั้งหมด
  useEffect(() => {
    setMaxDate(new Date());
    const init = async () => {
      const inspectorList = await fetchInspectors();
      await fetchAllData({}, inspectorList);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search — ใช้ fetchAllData อันเดียวกับ initial load
  const handleSearch = async (filters) => {
    await fetchAllData(filters);
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
