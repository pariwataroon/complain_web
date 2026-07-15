import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListBox from "@services/TableListBox/TableListBox";
import { GetAllSubComplaintTypes, GetAllSelectComplaintTypes } from "@pages/api/allselect/allselect";
import { GetComplaintsByPageTypeCard, GetEnhancedComplaints } from "@pages/api/complaint/complaint";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

/* ---------- สถานะ: Mapping ---------- */
const statusMapEnToTh = {
  submitted: "ส่งคำร้อง",
  sent_to_agency: "มอบหมายเจ้าหน้าที่",
  sent_to_external: "ส่งหน่วยงานภายนอก",
  in_process: "อยู่ระหว่างดำเนินการ",
  in_review: "อยู่ระหว่างการพิจารณา",
  tracking: "ติดตามผลการพิจารณา",
  reviewed: "แจ้งผลการพิจารณา",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};
const statusMapThToEn = Object.fromEntries(
  Object.entries(statusMapEnToTh).map(([en, th]) => [th, en])
);
const getThaiStatus = (en) => statusMapEnToTh[en] ?? (en || "-");
const getEnglishStatus = (th) => statusMapThToEn[th] ?? (th || "-");

/* ---------- วันที่ ---------- */
const formatThaiDateFlexible = (dateStr) => {
  if (!dateStr || dateStr === null || dateStr === undefined || dateStr === "") return "-";
  const d = dayjs(dateStr);
  if (!d.isValid()) return "-";
  const thaiMonths = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  return `${d.date()} ${thaiMonths[d.month()]} ${d.$y}`;
};

const displayOrDash = (v) =>
  v === undefined || v === null || v === "" ? "-" : v;

/* ---------- แปลงข้อมูลจาก GetComplaintsByPageTypeCard -> แถวของตาราง ---------- */
const transformCardComplaintData = (complaintItems, documentNumberMap = {}) => {
  return complaintItems.map((item) => {
    const clean = (s) =>
      typeof s === "string" ? s.trim().replace(/\s+/g, " ") : s;

    const outagencyRaw =
      item.outagency ||
      item.external_agency ||
      item.outside_agency ||
      item.externalDepartment?.name ||
      item.outsideDepartment?.name ||
      item.outside_department_name ||
      item.incident_location ||
      "-";
    const outagency = clean(outagencyRaw);

    const id = item.id || item.complaint_id;

    const receiveDate =
      (item.receiveDate && formatThaiDateFlexible(item.receiveDate)) !== "-"
        ? formatThaiDateFlexible(item.receiveDate)
        : formatThaiDateFlexible(item.created_at);

    const agency = clean(displayOrDash(item.agency));

    const claimantName =
      item.complainant_name ||
      item.complainant?.government?.fullName ||
      item.complainant?.name ||
      item.claimantName ||
      "-";

    const issue =
      displayOrDash(item.subject) !== "-"
        ? displayOrDash(item.subject)
        : displayOrDash(item.issue ?? item.master_complaint?.subject);
    const issueType = displayOrDash(item.issueType || item.complaint_type_name);
    const subIssueType = displayOrDash(item.subIssueType);

    const responsibleOfficer =
      item.responsibleOfficer ??
      item.assigned_officer?.name ??
      item.assigned_to ??
      "ไม่ได้มอบหมาย";

    const statusEn = item.status || "-";
    const statusTh = getThaiStatus(statusEn);

    const complaintNumberSorn = displayOrDash(
      item.complaint_number || item.master_complaint?.complaint_number
    );

    const complaintNumber = displayOrDash(
      item.complaint_number || item.master_complaint?.complaint_number
    );

    const isMaster =
      item.is_master !== undefined
        ? item.is_master
        : !!item.master_complaint?.is_master;

    const docNum = documentNumberMap[id] || item.document_number || "";

    return {
      id,
      receiveDate,
      agency,
      outagency,
      claimantName,
      issue,
      issueType,
      subIssueType,
      responsibleOfficer,
      status: statusTh,
      statusEn: statusEn,
      note: displayOrDash(item.note || item.assigned_remark),
      complaintNumber,
      isMaster,
      complaintNumberSorn,
      documentNumber: docNum,
      created_at: item.created_at,
    };
  });
};

/* ---------- สกัด options ---------- */
const toOptions = (arr) =>
  Array.from(
    new Set(
      (arr || [])
        .map((v) => (typeof v === "string" ? v.trim() : v))
        .filter((v) => v && v !== "-")
    )
  ).map((v) => ({ value: v, label: v }));

const extractFilterOptionsFromItems = (items) => {
  const issueTypes = [];
  const subIssueTypes = [];
  const agencies = [];
  const officers = [];
  const statusesTh = [];

  items.forEach((item) => {
    if (item.issueType) issueTypes.push(item.issueType);
    if (item.subIssueType) subIssueTypes.push(item.subIssueType);
    const agencyName = item.agency;
    if (agencyName) agencies.push(agencyName);
    const officer = item.responsibleOfficer ?? item.assigned_officer?.name;
    if (officer) officers.push(officer);
    const statusTh = getThaiStatus(item.status);
    if (statusTh && statusTh !== "-") statusesTh.push(statusTh);
  });

  return {
    issueTypeOptions: toOptions(issueTypes),
    subIssueTypeOptions: toOptions(subIssueTypes),
    agencyOptions: toOptions(agencies),
    responsibleOfficerOptions: toOptions(officers),
    statusOptions: toOptions(statusesTh),
  };
};

const AnonymousLetterRepository = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterOptions, setFilterOptions] = useState({
    issueTypeOptions: [],
    subIssueTypeOptions: [],
    agencyOptions: [],
    responsibleOfficerOptions: [],
    statusOptions: [],
  });

  const [allApiSubTypes, setAllApiSubTypes] = useState([]);
  const [typeNameToId, setTypeNameToId] = useState({});
  const router = useRouter();

  /* ---------- ค้นหา/กรอง ---------- */
  const handleSearch = (filters) => {
    const norm = (s) =>
      String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
    const getVal = (v) =>
      typeof v === "string" ? v : v?.value ?? v?.label ?? "";

    const result = allComplaints.filter((item) => {
      let ok = true;

      if (filters.claimantName && filters.claimantName.trim() !== "") {
        const q = filters.claimantName.toLowerCase();
        ok = ok && (item.claimantName || "").toLowerCase().includes(q);
      }

      if (filters.subject && filters.subject.trim() !== "") {
        const q = filters.subject.toLowerCase();
        ok = ok && (item.issue || "").toLowerCase().includes(q);
      }

      if (filters.issueType && filters.issueType !== "") {
        ok = ok && item.issueType === filters.issueType;
      }

      if (filters.subIssueType && filters.subIssueType !== "") {
        ok = ok && item.subIssueType === filters.subIssueType;
      }

      if (getVal(filters.agency)) {
        const q = norm(getVal(filters.agency));
        ok =
          ok &&
          (norm(item.agency).includes(q) || norm(item.outagency).includes(q));
      }

      if (filters.responsibleOfficer && filters.responsibleOfficer !== "") {
        ok = ok && item.responsibleOfficer === filters.responsibleOfficer;
      }

      if (filters.status && filters.status !== "") {
        ok = ok && item.status === filters.status;
      }

      if (filters.complaintNumberSorn && filters.complaintNumberSorn.trim() !== "") {
        const q = filters.complaintNumberSorn.toLowerCase();
        ok = ok && (item.complaintNumberSorn || "").toLowerCase().includes(q);
      }

      if (filters.startDate || filters.endDate) {
        if (!item.created_at) {
          ok = false;
        } else {
          const itemDate = dayjs(item.created_at);
          if (!itemDate.isValid()) {
            ok = false;
          } else {
            if (filters.startDate) {
              const start = dayjs(filters.startDate).startOf('day');
              if (itemDate.isBefore(start)) ok = false;
            }
            if (filters.endDate) {
              const end = dayjs(filters.endDate).endOf('day');
              if (itemDate.isAfter(end)) ok = false;
            }
          }
        }
      }

      return ok;
    });

    setFilteredComplaints(result);
  };

  const handleResetSearch = () => {
    setFilteredComplaints(allComplaints);
  };

  const handleFilterChange = (field, value) => {
    if (field === "issueType") {
      let filteredSubTypes;
      if (value && typeNameToId[value]) {
        const parentId = typeNameToId[value];
        filteredSubTypes = allApiSubTypes
          .filter((st) => st.parent_type_id === parentId)
          .map((st) => ({ value: st.name, label: st.name }))
          .sort((a, b) => a.label.localeCompare(b.label, "th"));
      } else {
        filteredSubTypes = allApiSubTypes
          .map((st) => ({ value: st.name, label: st.name }))
          .sort((a, b) => a.label.localeCompare(b.label, "th"));
      }
      setFilterOptions((prev) => ({ ...prev, subIssueTypeOptions: filteredSubTypes }));
    }
  };

  const handleRowClick = (item) => {
    const englishStatus = item.statusEn || getEnglishStatus(item.status);
    router.push(`/admin/box/new/${item.id}?status=${englishStatus}`);
  };

  /* ---------- โหลดข้อมูลจาก API ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // เรียก GetComplaintsByPageTypeCard เพื่อดึงข้อมูลบัตรสนเทศ
        const cardRes = await GetComplaintsByPageTypeCard({
          pageType: "card",
          skip: 0,
          limit: 10000,
        });

        if (cardRes?.res_code === "0000" && Array.isArray(cardRes?.res_data?.items)) {
          // API นี้ return items ที่แต่ละ item มี .complaint property
          const complaints = cardRes.res_data.items
            .map((entry) => entry?.complaint)
            .filter(Boolean);

          if (complaints.length > 0) {
            // ดึง enhanced complaints เพื่อเอา document_number (เลข นร)
            let documentNumberMap = {};
            try {
              const enhancedRes = await GetEnhancedComplaints({ skip: 0, limit: 10000 });
              if (enhancedRes?.res_data?.items) {
                enhancedRes.res_data.items.forEach((c) => {
                  const cId = c.id || c.complaint_id;
                  const docNum = c.document_number || "";
                  if (cId && docNum) {
                    documentNumberMap[cId] = docNum;
                  }
                });
              }
            } catch (e) {
              console.warn("[คลังบัตรสนเทศ-dept] Enhanced fetch failed:", e);
            }

            const transformedData = transformCardComplaintData(complaints, documentNumberMap);
            setAllComplaints(transformedData);
            setFilteredComplaints(transformedData);

            // สกัด filter options
            const opts = extractFilterOptionsFromItems(complaints);
            const allStatusTh = Array.from(
              new Set([
                ...Object.values(statusMapEnToTh),
                ...opts.statusOptions.map((o) => o.value),
              ])
            ).map((v) => ({ value: v, label: v }));

            // ดึง sub-types จาก API
            let subTypeOpts = opts.subIssueTypeOptions;
            try {
              const subRes = await GetAllSubComplaintTypes();
              if (subRes?.res_code === "0000" && Array.isArray(subRes?.res_data?.items)) {
                const allSubs = subRes.res_data.items;
                setAllApiSubTypes(allSubs);
                subTypeOpts = allSubs
                  .map((item) => ({ value: item.name, label: item.name }))
                  .sort((a, b) => a.label.localeCompare(b.label, "th"));
              }
              const typeRes = await GetAllSelectComplaintTypes();
              if (typeRes?.res_code === "0000" && Array.isArray(typeRes?.res_data)) {
                const map = {};
                typeRes.res_data.forEach(t => { map[t.name] = t.id; });
                setTypeNameToId(map);
              }
            } catch (e) {
              console.error("Error fetching sub complaint types:", e);
            }

            setFilterOptions({
              issueTypeOptions: opts.issueTypeOptions,
              subIssueTypeOptions: subTypeOpts,
              agencyOptions: opts.agencyOptions,
              responsibleOfficerOptions: opts.responsibleOfficerOptions,
              statusOptions: allStatusTh,
            });

            console.log(`[คลังบัตรสนเทศ-dept] โหลดสำเร็จ: ${complaints.length} รายการ`);
          } else {
            console.log("[คลังบัตรสนเทศ-dept] ไม่พบข้อมูลบัตรสนเทศ");
            setAllComplaints([]);
            setFilteredComplaints([]);
          }
        } else {
          console.error("[คลังบัตรสนเทศ-dept] Unexpected response:", cardRes);
          setAllComplaints([]);
          setFilteredComplaints([]);
        }
      } catch (err) {
        console.error("Error fetching card complaints:", err);
        setAllComplaints([]);
        setFilteredComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "200px",
          fontSize: "18px",
        }}
      >
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "ติดตามผลการดำเนินการ",
            icon: (
              <img
                src="/icons/Cube.png"
                alt="cube"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          { label: "รับเข้าบัตรสนเท่ห์" },
        ]}
      />

      <TableListBox
        data={filteredComplaints}
        title="รับเข้าบัตรสนเท่ห์"
        navigateTo="/admin/box/new"
        onRowClick={handleRowClick}
        onSearch={handleSearch}
        onResetSearch={handleResetSearch}
        onFilterChange={handleFilterChange}
        filterFields={[
          { name: "claimantName", label: "ชื่อผู้ร้อง", type: "text" },
          { name: "subject", label: "เรื่อง", type: "text" },
          {
            name: "issueType",
            label: "ประเภทเรื่อง",
            type: "select",
            options: filterOptions.issueTypeOptions,
          },
          {
            name: "subIssueType",
            label: "ประเภทเรื่องย่อย",
            type: "select",
            options: filterOptions.subIssueTypeOptions,
          },
          {
            name: "agency",
            label: "หน่วยงาน",
            type: "select",
            options: filterOptions.agencyOptions,
          },
          {
            name: "responsibleOfficer",
            label: "เจ้าหน้าที่รับผิดชอบ",
            type: "select",
            options: filterOptions.responsibleOfficerOptions,
          },
          {
            name: "status",
            label: "สถานะเรื่อง",
            type: "select",
            options: filterOptions.statusOptions,
          },
          {
            name: "complaintNumberSorn",
            label: "เลข สรร.",
            type: "text",
          },
          {
            name: "startDate",
            label: "ตั้งแต่วันที่",
            type: "date",
          },
          {
            name: "endDate",
            label: "ถึงวันที่",
            type: "date",
          },
        ]}
      />
    </>
  );
};

export default AnonymousLetterRepository;
