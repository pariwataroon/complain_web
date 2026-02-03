import React, { useEffect, useState } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListCollapsReport from "@services/TableListCollapsReport/TableListCollapsReport";
import { GetAllReportsInspector } from "@pages/api/report/report";
import { getSignatureAuthorities } from "@pages/api/department/department";

/* ───────────────────────── helpers ───────────────────────── */
const norm = (s) => (s || "").toString().trim().replace(/\s+/g, " ").toLowerCase();

const flattenToInspectors = (resData) => {
  const map = new Map();
  const groups = resData?.groups ?? [];
  // groups
  for (const g of groups) {
    const users = g?.users ?? [];
    const deps = g?.departments ?? [];
    const position = g?.group_description || "";
    const groupName = g?.group_name || "";

    for (const u of users) {
      if (!map.has(u.user_id)) {
        map.set(u.user_id, {
          id: u.user_id,
          name: u.user_name,
          email: u.user_email,
          position: position,
          groupName: groupName,
          departments: [],
        });
      } else {
        const entry = map.get(u.user_id);
        if (position) entry.position = position;
        if (groupName) entry.groupName = groupName;
      }
      const entry = map.get(u.user_id);
      const had = new Set(entry.departments.map((d) => d.id));
      for (const d of deps) {
        if (!had.has(d.department_id)) {
          entry.departments.push({ id: d.department_id, name: d.department_name });
          had.add(d.department_id);
        }
      }
    }
  }
  // individuals
  const individuals = resData?.individuals ?? [];
  for (const u of individuals) {
    if (!map.has(u.user_id)) {
      map.set(u.user_id, {
        id: u.user_id,
        name: u.user_name,
        email: u.user_email,
        position: "",
        groupName: "",
        departments: [],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "th"));
};

// รวมสิทธิ์ผู้ตรวจ + ตัวเลขรายงาน + รายการเรื่อง เป็น rows สำหรับ TableListCollapsReport
const buildRows = (inspectors, reportItems, selectedInspectorId = "") => {
  const byInspector = new Map();

  for (const it of reportItems || []) {
    const uid = it.signature_authority_user_id;
    if (!uid) continue;

    if (!byInspector.has(uid)) {
      byInspector.set(uid, {
        inspector_id: uid,
        inspector_name: it.signature_authority_user_name || "(ไม่พบชื่อ)",
        group_order: it.signature_group_order_index,
        group_name: it.signature_group_name,
        departments: new Map(),
      });
    }

    const inspectorData = byInspector.get(uid);
    const deptId = it.department_id || "unknown";

    if (!inspectorData.departments.has(deptId)) {
      inspectorData.departments.set(deptId, {
        id: deptId,
        name: it.department_name || "ไม่ระบุหน่วยงาน",
        total: Number(it.total_sent || 0),
        inProgress: Number(it.total_in_progress || 0),
        closed: Number(it.total_closed || 0),
        complaints: it.complaints || [],
      });
    } else {
      const dept = inspectorData.departments.get(deptId);
      dept.total += Number(it.total_sent || 0);
      dept.inProgress += Number(it.total_in_progress || 0);
      dept.closed += Number(it.total_closed || 0);
      if (it.complaints && it.complaints.length > 0) {
        dept.complaints.push(...it.complaints);
      }
    }
  }

  const inspectorMap = new Map(inspectors.map((i) => [i.id, i]));
  for (const uid of byInspector.keys()) {
    if (!inspectorMap.has(uid)) {
      const repOne = byInspector.get(uid);
      inspectorMap.set(uid, {
        id: uid,
        name: repOne?.inspector_name || "(ไม่พบในสิทธิ์)",
        email: "",
        position: "",
        groupName: repOne?.group_name || "",
        departments: [],
      });
    }
  }

  const baseList = selectedInspectorId
    ? [inspectorMap.get(selectedInspectorId)].filter(Boolean)
    : Array.from(inspectorMap.values()).sort((a, b) => a.name.localeCompare(b.name, "th"));

  return baseList.map((ins) => {
    const inspectorData = byInspector.get(ins.id);
    const departmentsData = [];

    for (const d of ins.departments || []) {
      const deptId = d.id || "unknown";
      const reportDept = inspectorData?.departments.get(deptId);

      if (reportDept) {
        departmentsData.push({
          department: reportDept.name,
          totalDept: reportDept.total,
          inProgressCnt: reportDept.inProgress,
          closedCnt: reportDept.closed,
          children: reportDept.complaints.map(c => ({
            id: c.id,
            department: c.subject || c.reference_number || "-",
            totalDept: 1,
            inProgressCnt: c.status === "in_progress" ? 1 : 0,
            closedCnt: c.status === "closed" ? 1 : 0,
            complaintData: c,
          })),
        });
      } else {
        departmentsData.push({
          department: d.name,
          totalDept: 0,
          inProgressCnt: 0,
          closedCnt: 0,
          children: [],
        });
      }
    }

    if (inspectorData) {
      for (const [, dept] of inspectorData.departments.entries()) {
        const exists = departmentsData.find((x) => norm(x.department) === norm(dept.name));
        if (!exists) {
          departmentsData.push({
            department: dept.name,
            totalDept: dept.total,
            inProgressCnt: dept.inProgress,
            closedCnt: dept.closed,
            children: dept.complaints.map(c => ({
              id: c.id,
              department: c.subject || c.reference_number || "-",
              totalDept: 1,
              inProgressCnt: c.status === "in_progress" ? 1 : 0,
              closedCnt: c.status === "closed" ? 1 : 0,
              complaintData: c,
            })),
          });
        }
      }
    }

    const displayName = ins.position
      ? `${ins.position}(${ins.name})`
      : ins.name;

    return { id: ins.id, claimantName: displayName, departmentsData };
  });
};

const formatDateThai = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear() + 543}`;
};

const withAllOption = (opts) => {
  const uniq = Array.from(new Map(opts.map((o) => [o.value, o])).values()).sort((a, b) =>
    a.label.localeCompare(b.label, "th")
  );
  return [{ value: "", label: "ทั้งหมด" }, ...uniq];
};

/* ───────────────────────── component ───────────────────────── */
const ResultsComplaintsComponents = () => {
  const [loading, setLoading] = useState(false);
  const [inspectors, setInspectors] = useState([]);
  const [claimantOptions, setClaimantOptions] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [dateRange, setDateRange] = useState("");

  useEffect(() => {
    loadInitial();
  }, []);

  const yearFrom = (filters = {}) =>
    filters.receiveDateFrom
      ? new Date(filters.receiveDateFrom).getFullYear().toString()
      : new Date().getFullYear().toString();

  const loadInitial = async (filters = {}) => {
    setLoading(true);
    try {
      const year = yearFrom(filters);
      const dateFrom = filters.receiveDateFrom || "";
      const dateTo = filters.receiveDateTo || "";

      const [sig, rep] = await Promise.all([
        getSignatureAuthorities(),
        GetAllReportsInspector(year, "", "", "", dateFrom, dateTo, true),
      ]);

      const inspectorList = flattenToInspectors(sig?.res_data ?? sig);
      setInspectors(inspectorList);

      const reportItems = rep?.res_data?.items || [];

      const fromSig = inspectorList.map((x) => ({
        value: x.id,
        label: x.position ? `${x.position}(${x.name})` : x.name
      }));
      const fromReport = Array.from(
        new Map(
          reportItems.map((i) => [
            i.signature_authority_user_id,
            { value: i.signature_authority_user_id, label: i.signature_authority_user_name },
          ])
        ).values()
      );
      setClaimantOptions(withAllOption([...fromSig, ...fromReport]));

      setFilteredComplaints(buildRows(inspectorList, reportItems, filters.claimantName || ""));
    } catch (e) {
      console.error("loadInitial error:", e);
      setInspectors([]);
      setClaimantOptions(withAllOption([]));
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (filters) => {

    let range = "";
    if (filters.receiveDateFrom && filters.receiveDateTo) {
      range = `ตั้งแต่วันที่ ${formatDateThai(filters.receiveDateFrom)} ถึงวันที่ ${formatDateThai(
        filters.receiveDateTo
      )}`;
    } else if (filters.receiveDateFrom) {
      range = `ตั้งแต่วันที่ ${formatDateThai(filters.receiveDateFrom)}`;
    } else if (filters.receiveDateTo) {
      range = `ถึงวันที่ ${formatDateThai(filters.receiveDateTo)}`;
    }
    setDateRange(range);

    setLoading(true);
    try {
      const year = yearFrom(filters);
      const dateFrom = filters.receiveDateFrom || "";
      const dateTo = filters.receiveDateTo || "";
      const rep = await GetAllReportsInspector(year, "", "", "", dateFrom, dateTo, true);
      const reportItems = rep?.res_data?.items || [];

      const extraOptions = Array.from(
        new Map(
          reportItems.map((i) => [
            i.signature_authority_user_id,
            { value: i.signature_authority_user_id, label: i.signature_authority_user_name },
          ])
        ).values()
      );
      setClaimantOptions((prev) => withAllOption([...(prev || []), ...extraOptions]));

      setFilteredComplaints(buildRows(inspectors, reportItems, filters.claimantName || ""));
    } catch (e) {
      console.error("search error:", e);
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
    }
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

      <TableListCollapsReport
        data={filteredComplaints}
        title="ผลการดำเนินการและเรื่องค้างพิจารณา"
        reportTitle="ผลการดำเนินการและเรื่องค้างพิจารณา"
        reportSubTitle="รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ"
        dateRange={dateRange}
        onSearch={handleSearch}
        loading={loading}
        filterFields={[
          {
            name: "claimantName",
            label: "รายชื่อผู้ตรวจ",
            type: "select",
            options: claimantOptions,
          },
          { name: "receiveDateFrom", label: "ตั้งแต่วันที่", type: "date" },
          { name: "receiveDateTo", label: "ถึงวันที่", type: "date" },
        ]}
      />
    </>
  );
};

export default ResultsComplaintsComponents;
