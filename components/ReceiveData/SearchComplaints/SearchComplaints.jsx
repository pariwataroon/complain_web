import React, { useState, useEffect } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableList from "@services/TableList/TableList";
import { useRouter } from "next/router";
import { getDocumentStorageForWebsite } from "@pages/api/document/document";
import { GetEnhancedComplaints } from "@pages/api/complaint/complaint";
import dayjs from "dayjs";
import { Box, Chip, Typography } from "@mui/material";

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
  { label: "สืบค้นเรื่องร้องเรียน" },
];

const mockAgencyOptions = [
  { value: "", label: "เลือกหน่วยงาน" },
  { value: "กระทรวงมหาดไทย", label: "กระทรวงมหาดไทย" },
  { value: "กรมส่งเสริมการปกครองท้องถิ่น", label: "กรมส่งเสริมการปกครองท้องถิ่น" },
  { value: "กรมการปกครอง", label: "กรมการปกครอง" },
  { value: "กรมป้องกันและบรรเทาสาธารณภัย", label: "กรมป้องกันและบรรเทาสาธารณภัย" },
  { value: "กรมโยธาธิการและผังเมือง", label: "กรมโยธาธิการและผังเมือง" },
  { value: "จังหวัด", label: "จังหวัด" },
  { value: "อำเภอ", label: "อำเภอ" },
  { value: "องค์การบริหารส่วนจังหวัด", label: "องค์การบริหารส่วนจังหวัด" },
  { value: "เทศบาลเมือง", label: "เทศบาลเมือง" },
  { value: "เทศบาลตำบล", label: "เทศบาลตำบล" },
  { value: "องค์การบริหารส่วนตำบล", label: "องค์การบริหารส่วนตำบล" },
  { value: "กรุงเทพมหานคร", label: "กรุงเทพมหานคร" },
  { value: "เมืองพัทยา", label: "เมืองพัทยา" },
  { value: "สำนักงานคณะกรรมการการเลือกตั้ง", label: "สำนักงานคณะกรรมการการเลือกตั้ง" },
  { value: "สำนักงานตำรวจแห่งชาติ", label: "สำนักงานตำรวจแห่งชาติ" },
  { value: "สำนักงาน ก.พ.", label: "สำนักงาน ก.พ." },
  { value: "สำนักงานอัยการสูงสุด", label: "สำนักงานอัยการสูงสุด" },
  { value: "สำนักงานศาลยุติธรรม", label: "สำนักงานศาลยุติธรรม" },
  { value: "กระทรวงการคลัง", label: "กระทรวงการคลัง" },
  { value: "กระทรวงศึกษาธิการ", label: "กระทรวงศึกษาธิการ" },
  { value: "กระทรวงสาธารณสุข", label: "กระทรวงสาธารณสุข" },
  { value: "กระทรวงแรงงาน", label: "กระทรวงแรงงาน" },
  { value: "กระทรวงยุติธรรม", label: "กระทรวงยุติธรรม" },
  { value: "กระทรวงพัฒนาสังคมและความมั่นคงของมนุษย์", label: "กระทรวงพัฒนาสังคมและความมั่นคงของมนุษย์" },
  { value: "หน่วยงานเอกชน", label: "หน่วยงานเอกชน" },
  { value: "รัฐวิสาหกิจ", label: "รัฐวิสาหกิจ" },
  { value: "อื่นๆ", label: "อื่นๆ" },
];

const safeIncludes = (text, query) =>
  (text ?? "").toString().toLowerCase().includes((query ?? "").toString().toLowerCase());

const SUBJECT_LEFT_OFFSET = 14;

const getChannelKey = (channelName) => {
  if (!channelName) return "website";
  const n = channelName.toLowerCase();
  if (n.includes("opm") || n.includes("1111")) return "opm1111";
  if (n.includes("eoffice") || n.includes("สารบรรณอิเล็กทรอนิกส์")) return "eoffice";
  if (n.includes("จดหมาย") || n.includes("letter")) return "letter";
  if (n.includes("อีเมล") || n.includes("email")) return "email";
  if (n.includes("ศูนย์บริการร่วม") || n.includes("central")) return "central_service";
  return "website";
};

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
  v !== null &&
  v !== undefined &&
  !(typeof v === "string" && v.trim() === "");

const getIsAssigned = (item) => {
  const candidates = [
    item?.is_assigned,
    item?.isAssigned,
    item?.assigned,
    item?.assignment?.is_assigned,
    item?.assignment?.assigned,
    item?.body?.is_assigned,
    item?.body?.assigned,
    item?.body?.isAssigned,
    item?.step4?.general?.is_assigned,
    item?.step4?.general?.assigned,
    item?.step4?.is_assigned,
    item?.step3?.general?.is_assigned,
    item?.step3?.is_assigned,
    item?.step2?.general?.is_assigned,
    item?.step1?.general?.is_assigned,
  ];

  for (const c of candidates) {
    const b = toBool(c);
    if (b !== undefined) return b;
  }

  const heuristicsTruthy = [
    item?.assigned_date,
    item?.assignment?.assigned_date,
    item?.assignment?.assignee_id,
    item?.assignment?.assignee,
    item?.step4?.general?.assigned_date,
    item?.step4?.general?.assignee_id,
    item?.step3?.general?.assigned_date,
    item?.step3?.general?.assignee_id,
  ].some(hasValue);

  if (heuristicsTruthy) return true;

  return false;
};

const CHANNEL_OPTIONS = [
  { value: "", label: "ทุกช่องทาง" },
  { value: "website", label: "เว็บไซต์" },
  { value: "opm1111", label: "OPM 1111" },
  { value: "eoffice", label: "สารบรรณอิเล็กทรอนิกส์" },
  { value: "letter", label: "จดหมาย" },
  { value: "email", label: "อีเมล" },
  { value: "central_service", label: "ศูนย์บริการร่วม" },
];

const SearchComplaints = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState("");
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // ── 1) ดึงข้อมูล website complaints (เดิม) ──
        let websiteMapped = [];
        try {
          const res = await getDocumentStorageForWebsite({ skip: 0, limit: 10000 });
          const items = Array.isArray(res?.res_data?.items) ? res.res_data.items : [];

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
            console.error("Error fetching enhanced complaints:", e);
          }

          websiteMapped = items.map((item) => {
          const isAssigned = getIsAssigned(item);

          const isMasterCandidates = [
            item?.is_master,
            item?.isMaster,
            item?.body?.is_master,
            item?.body?.isMaster,
            item?.master_complaint?.is_master,
          ];
          let isMaster = false;
          for (const c of isMasterCandidates) {
            if (c === true || c === false) { isMaster = c; break; }
            if (c === 1 || c === "1") { isMaster = true; break; }
            if (c === 0 || c === "0") { isMaster = false; break; }
          }

          const textColor = isMaster ? "#1565c0" : "#94ccf9ff";

          const subjectRaw =
            item?.subject ??
            item?.issue ??
            item?.master_complaint?.subject ?? "-";

          const subjectWithDot = (
            <div
              style={{
                position: "relative",
                minWidth: 0,
                paddingLeft: SUBJECT_LEFT_OFFSET,
                marginLeft: -SUBJECT_LEFT_OFFSET,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 4,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: isAssigned ? "#2ecc71" : "#bdbdbd",
                }}
                title={isAssigned ? "มอบหมายแล้ว" : "ยังไม่มอบหมาย"}
                aria-label={isAssigned ? "assigned" : "unassigned"}
              />
              <span
                style={{
                  display: "block",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  lineHeight: 1.5,
                  color: textColor,
                }}
              >
                {subjectRaw}
              </span>
            </div>
          );

          const complainantName =
            item?.complainant?.government?.fullName ??
            item?.complainant?.name ??
            item?.claimantName ??
            item?.complainant_name ??
            "-";

          const docGovRaw = item?.reference_number4 ?? "-";
          const caseCodeRaw = item?.reference_number5 ?? "-";

          const itemId = item?.id ?? item?.complaint_id;
          const documentNumber = documentNumberMap[itemId] || item?.document_number || "";
          const allReferenceNumbers = [
            documentNumber,
            item?.reference_number5,
            item?.reference_number4,
            item?.reference_number,
            item?.reference_number2,
            item?.reference_number3,
            item?.master_complaint?.complaint_number,
          ].filter(v => v && v !== "" && v !== null && v !== "-");
          const caseCodeSearch = allReferenceNumbers.join(" | ");

          return {
            id: itemId ?? "-",
            name: (
              <span style={{ color: textColor }}>
                {complainantName}
              </span>
            ),
            nameRaw: complainantName,
            citizenId: item?.citizen_id ?? "-",
            subject: subjectWithDot,
            subjectRaw,
            docKk: item?.reference_number ?? "-",
            docSr: item?.reference_number2 ?? "-",
            docStp: item?.reference_number3 ?? "-",
            docGov: docGovRaw,
            docGovRaw,
            caseCode: documentNumber || caseCodeRaw,
            caseCodeSearch,
            agency: item?.incident_location ?? item?.agency ?? "-",
            status: item?.status ?? "-",
            is_assigned: isAssigned,
            is_master: isMaster,
            created_at: item?.created_at ?? null,
            channel: getChannelKey(item?.channel?.name),
          };
        });
        } catch (e) {
          console.error("Error fetching complaints:", e);
        }

        // ── 2) EOffice data เข้าหน้าสืบค้นผ่าน auto-create ──
        //    ถูกสร้างใน EOfficeDetail → อยู่ใน document-storage แล้ว
        //    channel ถูกตั้งค่าจาก item.channel.name ข้างบน

        // ── 3) Merge ข้อมูลทั้งหมด ──
        const allData = websiteMapped;

        if (isMounted) {
          setAllComplaints(allData);
          setFilteredComplaints(allData);
        }
      } catch (err) {
        console.error("โหลดข้อมูลร้องเรียนล้มเหลว:", err);
        if (isMounted) {
          setAllComplaints([]);
          setFilteredComplaints([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  // ── Channel filter ──
  const handleChannelChange = (channel) => {
    setChannelFilter(channel);
    // Re-apply search with new channel filter
    handleSearchWithChannel(channel);
  };

  const handleSearchWithChannel = (channel) => {
    if (!channel) {
      setFilteredComplaints(allComplaints);
    } else {
      setFilteredComplaints(allComplaints.filter((item) => item.channel === channel));
    }
  };

  const handleNavigateTo = () => router.push("/admin/edit/search/Filteromplaints");

  const handleSearch = (filters) => {
    const { claimantName, citizenId, subject, docGov, agency, caseCode, docKk, docSr, docStp, startDate, endDate } = filters;

    const result = allComplaints.filter((item) => {
      // Channel filter
      if (channelFilter && item.channel !== channelFilter) return false;

      if (claimantName && !safeIncludes(item.nameRaw, claimantName)) return false;
      if (citizenId && !safeIncludes(item.citizenId, citizenId)) return false;
      if (subject && !safeIncludes(item.subjectRaw, subject)) return false;
      if (docGov && !safeIncludes(item.docGovRaw, docGov)) return false;
      if (agency && item.agency !== agency) return false;
      if (docKk && !safeIncludes(item.docKk, docKk)) return false;
      if (docSr && !safeIncludes(item.docSr, docSr)) return false;
      if (docStp && !safeIncludes(item.docStp, docStp)) return false;

      if (caseCode && caseCode.trim() !== "") {
        const q = caseCode.toLowerCase().trim();
        const searchFields = [
          item.caseCodeSearch,
          item.docKk,
          item.docSr,
          item.docStp,
          item.docGovRaw,
        ].map(v => (v || "").toLowerCase());
        const found = searchFields.some(field => field.includes(q));
        if (!found) return false;
      }

      if (startDate || endDate) {
        if (!item.created_at) return false;

        const itemDate = dayjs(item.created_at);
        if (!itemDate.isValid()) return false;

        if (startDate) {
          const start = dayjs(startDate).startOf('day');
          if (itemDate.isBefore(start)) return false;
        }

        if (endDate) {
          const end = dayjs(endDate).endOf('day');
          if (itemDate.isAfter(end)) return false;
        }
      }

      return true;
    });

    setFilteredComplaints(result);
  };

  // ── นับจำนวนแต่ละ channel ──
  const getChannelCount = (key) => allComplaints.filter((c) => c.channel === key).length;

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />

      {/* ── Channel Filter Chips ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, px: 1 }}>
        <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 600, mr: 1 }}>
          ช่องทาง:
        </Typography>
        {CHANNEL_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={`${opt.label} (${opt.value === "" ? allComplaints.length : getChannelCount(opt.value)})`}
            onClick={() => handleChannelChange(opt.value)}
            sx={{
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              ...(channelFilter === opt.value
                ? {
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "white",
                    boxShadow: "0 3px 10px rgba(37,99,235,0.3)",
                  }
                : {
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #e5e7eb",
                    "&:hover": { backgroundColor: "#e5e7eb" },
                  }),
            }}
          />
        ))}
      </Box>

      {isLoading ? (
        <div style={{ textAlign: "center", margin: 40 }}>กำลังโหลดข้อมูล...</div>
      ) : (
        <TableList
          data={Array.isArray(filteredComplaints) ? filteredComplaints : []}
          title="สืบค้นเรื่องร้องเรียน"
          navigateTo="/admin/edit/search"
          onSearch={handleSearch}
          handleNavigateTo={handleNavigateTo}
          agencyOptions={mockAgencyOptions}
        />
      )}
    </>
  );
};

export default SearchComplaints;
