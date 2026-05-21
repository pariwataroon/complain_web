import React, { useEffect, useRef, useState } from "react";
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

  return Array.from(map.values());
};

// รวมสิทธิ์ผู้ตรวจ + ตัวเลขรายงาน + รายการเรื่อง เป็น rows สำหรับ TableListCollapsReport
const buildRows = (inspectors, reportItems, selectedInspectorId = "") => {
  // รายงานตอนนี้มาแบบรวมกับรายละเอียดแล้ว (เพราะ include_details=true)
  // จัดกลุ่มตาม inspector_id
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
        departments: new Map(), // key: department_id, value: { name, total, inProgress, closed, complaints }
      });
    }

    const inspectorData = byInspector.get(uid);
    const deptId = it.department_id || "unknown";
    const deptKey = norm(it.department_name || "ไม่ระบุหน่วยงาน");

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
      // ถ้ามี department ซ้ำ (ไม่น่าจะเกิด) ให้รวมข้อมูล
      const dept = inspectorData.departments.get(deptId);
      dept.total += Number(it.total_sent || 0);
      dept.inProgress += Number(it.total_in_progress || 0);
      dept.closed += Number(it.total_closed || 0);
      if (it.complaints && it.complaints.length > 0) {
        dept.complaints.push(...it.complaints);
      }
    }
  }

  // รองรับผู้ตรวจที่มีเฉพาะในรายงาน
  const inspectorMap = new Map(inspectors.map((i) => [i.id, i]));
  for (const uid of byInspector.keys()) {
    if (!inspectorMap.has(uid)) {
      const repOne = byInspector.get(uid);
      inspectorMap.set(uid, {
        id: uid,
        name: repOne?.inspector_name || "(ไม่พบในสิทธิ์)",
        email: "",
        position: "", // ไม่มีข้อมูลตำแหน่งจากรายงาน
        groupName: repOne?.group_name || "",
        departments: [],
      });
    }
  }

  const baseList = selectedInspectorId
    ? [inspectorMap.get(selectedInspectorId)].filter(Boolean)
    : (() => {
        const POSITION_RANK = [
          "หัวหน้าผู้ตรวจราชการกระทรวงการคลัง",
          "ผู้ตรวจราชการกระทรวงการคลัง",
          "ผู้อำนวยการสำนักตรวจสอบและประเมินผล",
          "รักษาราชการแทน ผอ.สตป",
        ];
        const rank = (p) => {
          if (!p) return POSITION_RANK.length;
          const idx = POSITION_RANK.findIndex((r) => p.includes(r));
          return idx === -1 ? POSITION_RANK.length : idx;
        };
        return Array.from(inspectorMap.values()).sort((a, b) => {
          const ra = rank(a.position);
          const rb = rank(b.position);
          if (ra !== rb) return ra - rb;
          return 0; // preserve API order within same position
        });
      })();

  return baseList.map((ins) => {
    const inspectorData = byInspector.get(ins.id);
    const departmentsData = [];

    // เพิ่ม departments จาก inspector rights
    for (const d of ins.departments || []) {
      const deptId = d.id || "unknown";
      const reportDept = inspectorData?.departments.get(deptId);

      if (reportDept) {
        // มีข้อมูลจากรายงาน
        departmentsData.push({
          department: reportDept.name,
          totalDept: reportDept.total,
          inProgressCnt: reportDept.inProgress,
          closedCnt: reportDept.closed,
          children: reportDept.complaints
            .filter(c => c.is_master !== false) // กรองเอาเฉพาะเรื่องร้องหลัก (เอาที่เป็น master หรือไม่ระบุ)
            .map(c => ({
              id: c.id,
              department: c.subject || c.reference_number || "-",
              totalDept: 1,
              inProgressCnt: c.status === "in_progress" ? 1 : 0,
              closedCnt: c.status === "closed" ? 1 : 0,
              complaintData: c, // เก็บข้อมูลเรื่องไว้สำหรับคลิก
            })),
        });
      } else {
        // ไม่มีข้อมูลจากรายงาน
        departmentsData.push({
          department: d.name,
          totalDept: 0,
          inProgressCnt: 0,
          closedCnt: 0,
          children: [],
        });
      }
    }

    // เพิ่ม departments ที่มีแต่ไม่อยู่ใน rights
    if (inspectorData) {
      for (const [deptId, dept] of inspectorData.departments.entries()) {
        const exists = departmentsData.find((x) => norm(x.department) === norm(dept.name));
        if (!exists) {
          departmentsData.push({
            department: dept.name,
            totalDept: dept.total,
            inProgressCnt: dept.inProgress,
            closedCnt: dept.closed,
            children: dept.complaints
              .filter(c => c.is_master !== false) // กรองเอาเฉพาะเรื่องร้องหลัก
              .map(c => ({
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

    // สร้างชื่อแสดงผล
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
  const inspectorsRef = useRef([]);
  const [claimantOptions, setClaimantOptions] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [dateRange, setDateRange] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    claimantName: "",
    receiveDateFrom: "",
    receiveDateTo: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const sig = await getSignatureAuthorities();
        const inspectorList = flattenToInspectors(sig?.res_data ?? sig);
        inspectorsRef.current = inspectorList;
        setInspectors(inspectorList);

        const fromSig = inspectorList.map((x) => ({
          value: x.id,
          label: x.position ? `${x.position}(${x.name})` : x.name
        }));
        setClaimantOptions(withAllOption(fromSig));
      } catch (e) {
        console.error("init inspectors error:", e);
        inspectorsRef.current = [];
        setInspectors([]);
        setClaimantOptions(withAllOption([]));
      }
      // ไม่กรอง — ส่ง filter ว่างเพื่อดึงข้อมูลทั้งหมด
      handleSearch({ claimantName: "", receiveDateFrom: "", receiveDateTo: "" });
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const yearFrom = (filters = {}) =>
    filters.receiveDateFrom
      ? new Date(filters.receiveDateFrom).getFullYear().toString()
      : ""; // No year = backend returns ALL data

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
      const rep = await GetAllReportsInspector(year, "", "", "", dateFrom, dateTo, true);
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

      // อัปเดตตาราง — ใช้ inspectorsRef เพื่อให้ initial load กับ search ได้ข้อมูลเดียวกันเป๊ะ
      setFilteredComplaints(buildRows(inspectorsRef.current, reportItems, filters.claimantName || ""));
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