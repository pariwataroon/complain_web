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
    const position = g?.group_description || ""; // ตำแหน่ง
    const groupName = g?.group_name || ""; // ชื่อกลุ่ม

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
        // ถ้ามี user อยู่แล้ว อัปเดตตำแหน่งและชื่อกลุ่ม (เอาอันล่าสุด)
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
  // individuals (ถ้ามี)
  const individuals = resData?.individuals ?? [];
  for (const u of individuals) {
    if (!map.has(u.user_id)) {
      map.set(u.user_id, {
        id: u.user_id,
        name: u.user_name,
        email: u.user_email,
        position: "", // ไม่มีตำแหน่งสำหรับ individuals
        groupName: "",
        departments: [], // ไม่มีรายการหน่วยงานแนบมากับ individuals
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "th"));
};

// รวมสิทธิ์ผู้ตรวจ + ตัวเลขรายงาน เป็น rows สำหรับ TableListCollapsReport
const buildRows = (inspectors, reportItems, selectedInspectorId = "") => {
  const byUser = new Map();
  for (const it of reportItems || []) {
    const uid = it.signature_authority_user_id;
    // ใช้ department_name จาก outgoing_reports (ผ่าน complaint_number)
    const deptKey = norm(it.department_name);
    if (!deptKey) continue;
    if (!byUser.has(uid)) byUser.set(uid, new Map());
    const m = byUser.get(uid);
    const total = Number(it.total_sent || 0);
    const inProgress = Number(it.total_in_progress || 0);
    const closed = Number(it.total_closed || 0);
    if (!m.has(deptKey)) {
      m.set(deptKey, {
        name: it.department_name || "",
        total,
        inProgress,
        closed,
      });
    } else {
      const agg = m.get(deptKey);
      agg.total += total;
      agg.inProgress += inProgress;
      agg.closed += closed;
    }
  }

  // รองรับผู้ตรวจที่มีเฉพาะในรายงาน
  const inspectorMap = new Map(inspectors.map((i) => [i.id, i]));
  for (const uid of byUser.keys()) {
    if (!inspectorMap.has(uid)) {
      const repOne = (reportItems || []).find((x) => x.signature_authority_user_id === uid);
      inspectorMap.set(uid, {
        id: uid,
        name: repOne?.signature_authority_user_name || "(ไม่พบในสิทธิ์)",
        email: "",
        position: "", // ไม่มีข้อมูลตำแหน่งจากรายงาน
        groupName: "",
        departments: [],
      });
    }
  }

  const baseList = selectedInspectorId
    ? [inspectorMap.get(selectedInspectorId)].filter(Boolean)
    : Array.from(inspectorMap.values()).sort((a, b) => a.name.localeCompare(b.name, "th"));

  return baseList.map((ins) => {
    const reportMap = byUser.get(ins.id) || new Map();

    const departmentsData = (ins.departments || []).map((d) => {
      const key = norm(d.name);
      const r = reportMap.get(key);
      return {
        department: d.name,
        totalDept: r ? r.total : 0,
        inProgressCnt: r ? r.inProgress : 0,
        closedCnt: r ? r.closed : 0,
      };
    });

    for (const [k, r] of reportMap.entries()) {
      const exists = departmentsData.find((x) => norm(x.department) === k);
      if (!exists) {
        departmentsData.push({
          department: r.name || "(ไม่พบในสิทธิ์ผู้ตรวจ)",
          totalDept: r.total,
          inProgressCnt: r.inProgress,
          closedCnt: r.closed,
        });
      }
    }

    // สร้างชื่อแสดงผลในรูปแบบ "ตำแหน่ง(ชื่อ)"
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

// รวม options แล้วเติม “ทั้งหมด”
const withAllOption = (opts) => {
  const uniq = Array.from(new Map(opts.map((o) => [o.value, o])).values()).sort((a, b) =>
    a.label.localeCompare(b.label, "th")
  );
  return [{ value: "", label: "ทั้งหมด" }, ...uniq];
};

/* ───────────────────────── component ───────────────────────── */
const AnnualInspectorComplaintsSummaryComponents = () => {
  const [loading, setLoading] = useState(false);

  const [inspectors, setInspectors] = useState([]);
  const [claimantOptions, setClaimantOptions] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [dateRange, setDateRange] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    claimantName: "",
    receiveDateFrom: "",
    receiveDateTo: "",
  });

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
        GetAllReportsInspector(year, "", "", "", dateFrom, dateTo),
      ]);

      // รายชื่อผู้ตรวจ “ทุกคน”
      const inspectorList = flattenToInspectors(sig?.res_data ?? sig);
      setInspectors(inspectorList);

      const reportItems = rep?.res_data?.items || [];

      // ตัวเลือกดรอปดาวน์ = (ผู้ตรวจจากสิทธิ์) ∪ (ผู้ตรวจที่เจอในรายงาน) + "ทั้งหมด"
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

      // rows สำหรับตาราง
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
    setSearchFilters(filters);

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
      const rep = await GetAllReportsInspector(year, "", "", "", dateFrom, dateTo);
      const reportItems = rep?.res_data?.items || [];

      // อัปเดตตัวเลือก (กันกรณีมีผู้ตรวจใหม่โผล่มาจากข้อมูลรายงาน)
      const extraOptions = Array.from(
        new Map(
          reportItems.map((i) => [
            i.signature_authority_user_id,
            { value: i.signature_authority_user_id, label: i.signature_authority_user_name },
          ])
        ).values()
      );
      setClaimantOptions((prev) => withAllOption([...(prev || []), ...extraOptions]));

      // อัปเดตตาราง
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
                src="/icons/note.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          { label: "รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ" },
        ]}
      />

      <TableListCollapsReport
        data={filteredComplaints}
        title="รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ"
        reportTitle="รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ"
        dateRange={dateRange}
        onSearch={handleSearch}
        loading={loading}
        filterFields={[
          {
            name: "claimantName",
            label: "รายชื่อผู้ตรวจ",
            type: "select",
            // ดรอปดาวน์มี “ทั้งหมด” อยู่บนสุด + รายชื่อทุกคนครบถ้วน
            options: claimantOptions,
          },
          { name: "receiveDateFrom", label: "ตั้งแต่วันที่", type: "date" },
          { name: "receiveDateTo", label: "ถึงวันที่", type: "date" },
        ]}
      />
    </>
  );
};

export default AnnualInspectorComplaintsSummaryComponents;