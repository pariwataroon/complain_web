import React, { useState, useMemo, useCallback, useEffect } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableFilterList from "@services/TableFilterList/TableFilterList";
import { GetComplaintsGroupedbyChannel, GetComplaintByID } from "@pages/api/complaint/complaint";
import { GetAllSelectComplaintTypes } from "@pages/api/allselect/allselect";
import dayjs from "dayjs";

const breadcrumbItems = [
  {
    label: "จัดการข้อมูลในระบบ",
    icon: (
      <img
        src="/icons/Pencil.png"
        alt="pencil"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
  {
    label: "สืบค้นเรื่องร้องเรียน",
    url: "/admin/edit/search",
  },
  { label: "คัดกรองเรื่องร้องเรียน" },
];

const ALL_CHANNELS = [
  { key: "website", name: "เว็บไซต์ (https://complain.mof.go.th)" },
  { key: "opm1111", name: "ร้องเรียนผ่านระบบ OPM 1111 (สำนักงานปลัดสำนักนายกรัฐมนตรี)" },
  { key: "central_service", name: "ศูนย์บริการร่วมกระทรวงการคลัง" },
  { key: "letter", name: "ร้องเรียนผ่านจดหมาย" },
  { key: "email", name: "ร้องเรียนผ่านอีเมล" },
];

const Filteromplaints = () => {
  const [apiData, setApiData] = useState(null);
  const [allGroups, setAllGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Master data for complaint types (for lookup)
  const [complaintTypesMap, setComplaintTypesMap] = useState(new Map());
  const [typesLoaded, setTypesLoaded] = useState(false);

  // Dynamic options from API
  const [issueTypeOptions, setIssueTypeOptions] = useState([
    { value: "", label: "เลือกประเภทเรื่อง" },
  ]);
  const [respondentOptions, setRespondentOptions] = useState([
    { value: "", label: "เลือกผู้ถูกร้อง" },
  ]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear() + 543;
      return `${day}.${month}.${year}`;
    } catch {
      return "";
    }
  };

  // ---------- helpers สำหรับ is_assigned + subjectWithDot ----------
  const toBool = (v) => {
    if (v === true || v === false) return v;
    if (v === 1 || v === "1") return true;
    if (v === 0 || v === "0") return false;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (["true", "t", "y", "yes", "assigned", "enable", "enabled"].includes(s)) return true;
      if (["false", "f", "n", "no", "unassigned", "disable", "disabled", ""].includes(s)) return false;
    }
    return undefined;
  };
  const hasValue = (v) =>
    v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "");
  const getIsAssigned = (item) => {
    const candidates = [
      item?.is_assigned,
      item?.isAssigned,
      item?.assigned,
      item?.assignment?.is_assigned,
      item?.assignment?.assigned,
      item?.body?.is_assigned,
      item?.body?.assigned,
      item?.step4?.general?.is_assigned,
      item?.step4?.is_assigned,
      item?.step3?.general?.is_assigned,
      item?.step3?.is_assigned,
    ];
    for (const c of candidates) {
      const b = toBool(c);
      if (b !== undefined) return b;
    }
    // heuristic: มี assignee/วันที่มอบหมาย -> ถือว่า assigned
    const heuristicsTruthy = [
      item?.assigned_to,
      item?.assigned_date,
      item?.assignment?.assignee_id,
      item?.assignment?.assigned_date,
      item?.step4?.general?.assignee_id,
      item?.step4?.general?.assigned_date,
      item?.step3?.general?.assignee_id,
      item?.step3?.general?.assigned_date,
    ].some(hasValue);
    if (heuristicsTruthy) return true;

    return false;
  };

  const SUBJECT_DOT_INDENT = 16; // ปรับระยะจุดจากซ้าย (px)
  const renderSubjectWithDot = (subjectRaw, isAssigned) => (
    <span className="subject-dot">
      <i className={`dot ${isAssigned ? "on" : "off"}`} />
      <span className="text">{subjectRaw}</span>
    </span>
  );

  const mapItemToRow = (item) => {
    const isAssigned = getIsAssigned(item);
    const subjectRaw = item.subject || "-";
    // ใช้ชื่อผู้ร้องที่ได้จากการดึงข้อมูลเต็ม (ถ้ามี)
    const complainantName = (item.complainant_name && item.complainant_name.trim() !== "")
      ? item.complainant_name
      : "-";

    // ✅ Lookup complaint type name from UUID using complaintTypesMap
    let issueTypeName = item.complaint_type_name || "-";
    if (issueTypeName === "-" && item.complaint_type) {
      // ถ้าไม่มี complaint_type_name ให้ lookup จาก UUID
      issueTypeName = complaintTypesMap.get(item.complaint_type) || item.complaint_type;
    }

    return {
      id: item.id,
      name: item.complainant_name || "-",
      issueType: issueTypeName,

      // แสดงชื่อเรื่องพร้อม "จุดสถานะ" นำหน้า
      subject: renderSubjectWithDot(subjectRaw, isAssigned),
      subjectRaw, // ใช้สำหรับค้นหา

      respondentName: item.respondent_name || "-",
      docNo: item.reference_number
        // ? `${item.reference_number} (${formatDate(item.reference_date)})`
        ? `${item.reference_number}`
        : "-",
      docNo2: item.reference_number2
        // ? `${item.reference_number2} (${formatDate(item.reference_date2)})`
        ? `${item.reference_number2}`
        : "-",
      docNo3: item.reference_number3
        // ? `${item.reference_number3} (${formatDate(item.reference_date3)})`
        ? `${item.reference_number3}`
        : "-",
      docNo4: item.reference_number4
        // ? `${item.reference_number4} (${formatDate(item.reference_date4)})`
        ? `${item.reference_number4}`
        : "-",
      complaint_number: item.complaint_number,
      status: item.status,
      created_at: item.created_at,
      incident_location: item.incident_location,
      urgency_level: item.urgency_level,
      severity_level: item.severity_level,
      complaint_subtype: item.complaint_subtype,
      assigned_to: item.assigned_to,

      is_assigned: isAssigned,
    };
  };
  // ----------------------------------------------------------------

  // Fetch complaint types master data for lookup
  useEffect(() => {
    if (typesLoaded) return; // ป้องกัน fetch ซ้ำ

    const fetchComplaintTypes = async () => {
      try {
        const response = await GetAllSelectComplaintTypes();
        if (response?.res_code === "0000" && response?.res_data) {
          const typesMap = new Map();
          response.res_data.forEach((type) => {
            // สร้าง Map: UUID -> ชื่อประเภท
            typesMap.set(type.id, type.name);
          });
          setComplaintTypesMap(typesMap);
          setTypesLoaded(true);
          console.log('✅ Loaded complaint types map:', typesMap.size, 'types');
        }
      } catch (error) {
        console.error('Failed to load complaint types:', error);
        setTypesLoaded(true); // ตั้งเป็น true แม้ error เพื่อไม่ให้ retry ไม่รู้จบ
      }
    };

    fetchComplaintTypes();
  }, [typesLoaded]);

  // Fetch data from API
  useEffect(() => {
    if (!typesLoaded) return; // รอให้โหลด types เสร็จก่อน

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await GetComplaintsGroupedbyChannel({
          limit: 10000,
          skip: 0,
        });

        if (response?.res_code === "0000" && response?.res_data) {
          const data = response.res_data;
          setApiData(data);

          // ⚠️ ลบการเรียก GetComplaintByID เพื่อป้องกัน API loop
          // ถ้าต้องการชื่อผู้ร้อง ควรให้ API หลักส่งมาตั้งแต่แรก หรือ batch request
          const enrichedGroups = data.groups.map((group) => {
            return {
              ...group,
              items: group.items.map((item) => {
                // ใช้ชื่อที่ API ส่งมาตรงๆ ไม่ fetch เพิ่ม
                return {
                  ...item,
                  complainant_name: item.complainant_name || "-"
                };
              })
            };
          });

          // สร้าง Map ของข้อมูลที่มี
          const dataMap = new Map();
          enrichedGroups.forEach((group) => {
            const channelName = group.complaint_channel_name.toLowerCase();
            dataMap.set(channelName, {
              title: `ช่องทางการรับเรื่อง : ${group.complaint_channel_name}`,
              complaint_channel_id: group.complaint_channel_id,
              data: group.items.map(mapItemToRow),
            });
          });

          // สร้างกลุ่มทั้งหมด รวมทั้งที่ไม่มีข้อมูล
          const allChannelGroups = ALL_CHANNELS.map((channel) => {
            const existingData =
              dataMap.get(channel.name.toLowerCase()) ||
              dataMap.get(channel.key.toLowerCase());

            if (existingData) {
              return existingData;
            } else {
              return {
                title: `ช่องทางการรับเรื่อง : ${channel.name}`,
                complaint_channel_id: channel.key,
                data: [],
              };
            }
          });

          // เพิ่มกลุ่มจาก API ที่ไม่อยู่ใน ALL_CHANNELS
          enrichedGroups.forEach((group) => {
            const channelName = group.complaint_channel_name.toLowerCase();
            const exists = ALL_CHANNELS.some(
              (ch) =>
                ch.name.toLowerCase() === channelName ||
                ch.key.toLowerCase() === channelName
            );

            if (!exists) {
              allChannelGroups.push({
                title: `ช่องทางการรับเรื่อง : ${group.complaint_channel_name}`,
                complaint_channel_id: group.complaint_channel_id,
                data: group.items.map(mapItemToRow),
              });
            }
          });

          setAllGroups(allChannelGroups);
          setFilteredGroups(allChannelGroups);

          // Set options from API filters
          if (data.filters) {
            const typeOptions = [
              { value: "", label: "เลือกประเภทเรื่อง" },
              ...(data.filters.available_types || []),
            ];
            setIssueTypeOptions(typeOptions);

            const uniqueRespondents = [
              ...new Set(
                enrichedGroups
                  .flatMap((g) => g.items.map((item) => item.respondent_name))
                  .filter(Boolean)
              ),
            ];
            const respondentOpts = [
              { value: "", label: "เลือกผู้ถูกร้อง" },
              ...uniqueRespondents.map((name) => ({ value: name, label: name })),
            ];
            setRespondentOptions(respondentOpts);
          }
        } else {
          throw new Error(response?.res_message || "ไม่สามารถดึงข้อมูลได้");
        }
      } catch (error) {
        setError(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");

        const emptyChannelGroups = ALL_CHANNELS.map((channel) => ({
          title: `ช่องทางการรับเรื่อง : ${channel.name}`,
          complaint_channel_id: channel.key,
          data: [],
        }));

        setAllGroups(emptyChannelGroups);
        setFilteredGroups(emptyChannelGroups);
        setIssueTypeOptions([{ value: "", label: "เลือกประเภทเรื่อง" }]);
        setRespondentOptions([{ value: "", label: "เลือกผู้ถูกร้อง" }]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [typesLoaded]);

  // ---------- ค้นหา ----------
  const safeIncludes = (text, query) => {
    if (!query || query === "") return true;
    if (!text) return false;
    const textStr = String(text).toLowerCase().trim();
    const queryStr = String(query).toLowerCase().trim();
    return textStr.includes(queryStr);
  };
  const isEmpty = (value) => value === "" || value === null || value === undefined;
  const exactMatch = (text, query) => {
    if (isEmpty(query)) return true;
    if (!text) return false;
    const textStr = String(text).trim();
    const queryStr = String(query).trim();
    return textStr === queryStr;
  };

  const handleSearch = useCallback(
    (filters) => {
      const { claimantName, subject, issueType, respondentName, startDate, endDate } = filters;

      const hasFilters =
        !isEmpty(claimantName) ||
        !isEmpty(subject) ||
        !isEmpty(issueType) ||
        !isEmpty(respondentName) ||
        startDate ||
        endDate;

      if (!hasFilters) {
        setFilteredGroups(allGroups);
        return;
      }

      const filteredData = allGroups.map((group) => ({
        ...group,
        data: group.data.filter((item) => {
          if (!isEmpty(claimantName) && !safeIncludes(item.name, claimantName)) return false;

          // ✅ ใช้ subjectRaw เพราะ subject เป็น JSX
          if (!isEmpty(subject) && !safeIncludes(item.subjectRaw, subject)) return false;

          if (!isEmpty(issueType) && !exactMatch(item.issueType, issueType)) return false;

          if (!isEmpty(respondentName) && !safeIncludes(item.respondentName, respondentName)) return false;

          // Filter ตามวันที่สร้าง
          if (startDate || endDate) {
            if (!item.created_at) return false;

            const itemDate = dayjs(item.created_at);
            if (!itemDate.isValid()) return false;

            // ถ้ามี startDate ให้เช็คว่าวันที่สร้างต้อง >= startDate (เริ่มต้นวัน)
            if (startDate) {
              const start = dayjs(startDate).startOf('day');
              if (itemDate.isBefore(start)) return false;
            }

            // ถ้ามี endDate ให้เช็คว่าวันที่สร้างต้อง <= endDate (สิ้นสุดวัน)
            if (endDate) {
              const end = dayjs(endDate).endOf('day');
              if (itemDate.isAfter(end)) return false;
            }
          }

          return true;
        }),
      }));

      setFilteredGroups(filteredData);
    },
    [allGroups]
  );
  // --------------------------

  if (loading) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            fontSize: "18px",
          }}
        >
          กำลังโหลดข้อมูล...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            fontSize: "18px",
            color: "#dc3545",
          }}
        >
          <div>เกิดข้อผิดพลาด: {error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              backgroundColor: "#0f67b1",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ลองใหม่
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />

      <div className="complaint-table">
        <TableFilterList
          title="คัดกรองเรื่องร้องเรียน"
          navigateTo="/admin/edit/search/Filteromplaints"
          groups={filteredGroups}
          issueTypeOptions={issueTypeOptions}
          respondentOptions={respondentOptions}
          onSearch={handleSearch}
          loading={loading}
          totalCount={apiData?.pagination?.total || 0}
        />
      </div>

      <style jsx global>{`
        /* ลด padding ซ้ายของคอลัมน์แรก (ช่วยให้จุดชิดซ้าย) */
        .complaint-table thead th:first-child,
        .complaint-table tbody td:first-child,
        .complaint-table .MuiTableCell-root:first-child {
          padding-left: 8px !important; /* ปรับเป็น 4/6 เพื่อชิดกว่าเดิมได้ */
        }

        .complaint-table .subject-dot {
          position: relative;
          display: inline-block;
          min-width: 0;
          padding-left: ${SUBJECT_DOT_INDENT}px; /* เว้นที่ให้จุด */
        }
        .complaint-table .subject-dot .dot {
          position: absolute;
          left: 0;                 /* ชิดซ้ายสุดของพื้นที่ cell */
          top: 50%;
          transform: translateY(-50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #bdbdbd;
        }
        .complaint-table .subject-dot .dot.on { background: #2ecc71; }

        .complaint-table .subject-dot .text {
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: middle;
        }
      `}</style>
    </>
  );
};

export default Filteromplaints;
