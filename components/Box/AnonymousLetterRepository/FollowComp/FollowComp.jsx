import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Stack,
  CircularProgress,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import FolderIcon from "@mui/icons-material/Folder";
import { getDocumentStorageByComplaintId } from "@pages/api/document/document";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

// 1. Define English-status constants
const STATUS = {
  RECEIVED: 1,
  FORWARDED: 2,
  INITIAL_NOTIFY: 3,
  REQUEST_UPDATE: 4,
  AGENCY_REPORT: 5,
  FINAL_NOTIFY: 6,
};

// Breadcrumb items
const breadcrumbItems = [
  {
    label: "เมนูคลังเอกสาร",
    icon: <Inventory2Icon sx={{ width: 24, height: 24, mb: -1 }} />,
    url: "/admin/box/new",
  },
  { label: "คลังบัตรสนเท่ห์" },
];

// Section color themes - Pastel colors
const SECTION_STYLES = {
  RECEIVED: {
    boxBg: "#F0F8FF",
    headerBg: "#87CEEB",
    headerColor: "#2F4F4F",
    border: "#B0E0E6",
  },
  FORWARDED: {
    boxBg: "#F0FFFF",
    headerBg: "#98D8C8",
    headerColor: "#2F4F4F",
    border: "#AFEEEE",
  },
  INITIAL_NOTIFY: {
    boxBg: "#FFFEF7",
    headerBg: "#F0E68C",
    headerColor: "#556B2F",
    border: "#F5DEB3",
  },
  REQUEST_UPDATE: {
    boxBg: "#FFF8F0",
    headerBg: "#DEB887",
    headerColor: "#8B4513",
    border: "#FFEFD5",
  },
  AGENCY_REPORT: {
    boxBg: "#F8F0FF",
    headerBg: "#DDA0DD",
    headerColor: "#4B0082",
    border: "#E6E6FA",
  },
  FINAL_NOTIFY: {
    boxBg: "#F0FFF0",
    headerBg: "#98FB98",
    headerColor: "#228B22",
    border: "#C1FFC1",
  },
};

// ฟังก์ชันกรองชื่อหน่วยงาน
const filterDepartmentName = (name) => {
  if (!name || name === "ทดสอบ") return null;
  return name;
};

// ฟังก์ชันแปลงวันที่เป็นรูปแบบ ว/ด/ป (DD/MM/YYYY ปี พ.ศ.)
const formatDate = (date) => {
  if (!date || date === null || date === undefined || date === "") return "-";
  try {
    const dateStr = String(date).trim();

    if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
      const [day, month, year] = dateStr.split("/").map(Number);
      const fullYear = year < 100 ? year + 2500 : year;
      const parsedDate = dayjs(`${fullYear - 543}-${month}-${day}`);
      if (!parsedDate.isValid()) return "-";
      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${String(fullYear)}`;
    }

    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/) || dateStr.includes("T")) {
      const parsedDate = dayjs(date);
      if (!parsedDate.isValid()) return "-";
      return parsedDate.format("DD/MM/") + String(parsedDate.$y);
    }

    const parsedDate = dayjs(date);
    if (!parsedDate.isValid()) return "-";
    return parsedDate.format("DD/MM/") + String(parsedDate.$y);
  } catch (e) {
    console.error("Date parsing error:", date, e);
    return "-";
  }
};

// Helper function สำหรับดึงวันที่ลงวันที่ พร้อม fallback
const getSignedDate = (row) => {
  if (row.status === "agency_report") {
    return row.internal_register_date || row.document_date || row.created_at;
  }
  return row.document_date || row.created_at;
};

const handleManage = (sectionKey, id, router, complaintId, complaintNumber, createdAt) => {
  if (!id) {
    console.error("Error: complaintId is undefined or null");
    return;
  }
  switch (sectionKey) {
    case "RECEIVED":
      router.push({
        pathname: `/admin/edit/website-complaints/${id}`,
        query: {
          complaint_id: complaintId || "",
          complaint_number: complaintNumber || "",
          created_at: createdAt || "",
          fromBox: "1",
        },
      });
      break;
    case "FORWARDED":
      router.push({
        pathname: `/admin/edit/forward-to-agency/${id}`,
        query: {
          complaint_id: complaintId || "",
          complaint_number: complaintNumber || "",
          created_at: createdAt || "",
        },
      });
      break;
    case "INITIAL_NOTIFY":
      router.push({
        pathname: `/admin/edit/initial-notification-to-complainant-or-agency/${id}`,
        query: {
          complaint_id: complaintId || "",
          complaint_number: complaintNumber || "",
          created_at: createdAt || "",
        },
      });
      break;
    case "REQUEST_UPDATE": {
      const complaintId2 = router.query?.id || null;
      router.push({
        pathname: `/admin/edit/request-result-or-progress/${id}`,
        query: { complaint_id: complaintId2, outgoing_report3_id: id, report3_id: id, created_at: createdAt || "" },
      });
      break;
    }
    case "AGENCY_REPORT": {
      const complaintId2 = router.query?.id || null;
      router.push({
        pathname: "/admin/edit/report/",
        query: { complaint_id: complaintId2, outgoing_report5_id: id, report5_id: id, created_at: createdAt || "" },
      });
      break;
    }
    case "FINAL_NOTIFY": {
      const complaintId = router.query?.id || null;
      router.push({
        pathname: "/admin/edit/inform-related-parties/",
        query: { complaint_id: complaintId, report4_id: id, created_at: createdAt || "" },
      });
      break;
    }
    default:
      break;
  }
};

// Section configurations matching ComplaintArchives pattern
const sectionConfigs = [
  {
    key: "RECEIVED",
    status: STATUS.RECEIVED,
    title: "รับเรื่องราวร้องทุกข์",
    headers: [
      "ลำดับ",
      "หน่วยงาน",
      "เลข สรร.",
      "เลขที่อ้างอิง(เลขสรร.สารบัญ)",
      "เรื่อง",
      "ประเภทเรื่อง",
      "เอกสารหลัก",
      "เอกสารปัจจุบัน",
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => ({
      ลำดับ: idx + 1,
      หน่วยงาน: row.agency || "-",
      "เลข สรร.": row.complaint_number || "-",
      "เลขที่อ้างอิง(เลขสรร.สารบัญ)": row.parent_complaint_number || "-",
      เรื่อง: row.subject || "-",
      ประเภทเรื่อง: row.complaint_type?.name || "-",
      เอกสารหลัก: row.is_master !== undefined ? (row.is_master ? "✅" : "-") : "-",
      เอกสารปัจจุบัน: row.is_current !== undefined ? (row.is_current ? "✅" : "-") : "-",
      เอกสารแนบ: row.attachment_name || "-",
      การจัดการ: row.id,
      id: row.id,
    }),
    filter: (row) => true,
  },
  {
    key: "FORWARDED",
    status: STATUS.FORWARDED,
    title: "ส่งหน่วยงานที่เกี่ยวข้อง",
    headers: [
      "ลำดับ",
      "หน่วยงาน(ครั้งที่ส่ง)",
      "เรื่อง",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "ผู้ลงนาม",
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || "";
      const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";

      if (posName === "ผู้ร้อง" || posName === "ผู้ร้องเรียน") {
        positionDisplay = positionDisplay.replace(/^ผู้ร้อง(เรียน)?/, "(ผู้ร้อง)");
      } else if (posName === "อื่นๆ") {
        positionDisplay = positionDisplay.replace(/^อื่นๆ/, "(อื่นๆ)");
      }
      const isSpecialPosition = ["ผู้ร้อง", "ผู้ร้องเรียน", "อื่นๆ", "หน่วยงานอื่นๆ"].includes(posName);
      const prefix = isSpecialPosition ? `(${posName}) ` : "";

      const deptName = filterDepartmentName(row.department?.name)
        || filterDepartmentName(row.department_name)
        || filterDepartmentName(row.outgoing_departments?.[0]?.name);

      const departmentDisplay = isSpecialPosition
        ? (prefix + (other || deptName || "-"))
        : (deptName || "-");

      return {
        ลำดับ: idx + 1,
        "หน่วยงาน(ครั้งที่ส่ง)": departmentDisplay,
        เรื่อง: row.issue || row.subject || "-",
        เลขที่หนังสือ: row.document_number || "-",
        ลงวันที่: formatDate(getSignedDate(row)),
        ผู้ลงนาม:
          row.signer ||
          (row.signature_authority_user && row.signature_authority_user.name) ||
          "-",
        เอกสารแนบ: row.attachment_name || "-",
        การจัดการ: row.id,
        id: row.id,
      };
    },
    filter: (row) => row.status === "sent_to_agency" || row.status === "forwarded",
  },
  {
    key: "INITIAL_NOTIFY",
    status: STATUS.INITIAL_NOTIFY,
    title: "แจ้งผู้ร้อง/หน่วยงานที่ส่งเรื่องมากระทรวงทราบเบื้องต้น",
    headers: [
      "ลำดับ",
      "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "เรื่อง",
      "ผู้ลงนาม",
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || "";
      const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";

      if (posName === "ผู้ร้อง" || posName === "ผู้ร้องเรียน") {
        positionDisplay = positionDisplay.replace(/^ผู้ร้อง(เรียน)?/, "(ผู้ร้อง)");
      } else if (posName === "อื่นๆ") {
        positionDisplay = positionDisplay.replace(/^อื่นๆ/, "(อื่นๆ)");
      }

      return {
        ลำดับ: idx + 1,
        "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)": positionDisplay,
        เลขที่หนังสือ: row.document_number || row.reference_number || "-",
        ลงวันที่: formatDate(getSignedDate(row)),
        เรื่อง: row.issue || row.subject || "-",
        ผู้ลงนาม:
          row.signer ||
          (row.signature_authority_user && row.signature_authority_user.name) ||
          "-",
        เอกสารแนบ:
          row.attachment_name ||
          (row.attachments && row.attachments.length > 0
            ? row.attachments.map((a) => a.file_name || a.name).join(", ")
            : "-"),
        การจัดการ: row.id,
        id: row.id,
      };
    },
    filter: (row) => row.status === "initial_notify",
  },
  {
    key: "REQUEST_UPDATE",
    status: STATUS.REQUEST_UPDATE,
    title: "ขอทราบผลการพิจารณา / ผลความคืบหน้า",
    headers: [
      "ลำดับ",
      "ส่งหน่วยงาน(ครั้งที่ส่ง)",
      "เรื่อง",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "ผู้ลงนาม",
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || "";
      const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";

      if (posName === "ผู้ร้อง" || posName === "ผู้ร้องเรียน") {
        positionDisplay = positionDisplay.replace(/^ผู้ร้อง(เรียน)?/, "(ผู้ร้อง)");
      } else if (posName === "อื่นๆ") {
        positionDisplay = positionDisplay.replace(/^อื่นๆ/, "(อื่นๆ)");
      }
      const isSpecialPosition = ["ผู้ร้อง", "ผู้ร้องเรียน", "อื่นๆ", "หน่วยงานอื่นๆ"].includes(posName);
      const prefix = isSpecialPosition ? `(${posName}) ` : "";

      const deptName = filterDepartmentName(row.department?.name)
        || filterDepartmentName(row.department_name)
        || filterDepartmentName(row.outgoing_departments?.[0]?.name);

      const departmentDisplay = isSpecialPosition
        ? (prefix + (other || deptName || "-"))
        : (deptName || "-");

      return {
        ลำดับ: idx + 1,
        "ส่งหน่วยงาน(ครั้งที่ส่ง)": departmentDisplay,
        เรื่อง: row.issue || row.subject || "-",
        เลขที่หนังสือ: row.document_number || "-",
        ลงวันที่: formatDate(getSignedDate(row)),
        ผู้ลงนาม:
          row.signer ||
          (row.signature_authority_user && row.signature_authority_user.name) ||
          "-",
        เอกสารแนบ:
          row.attachment_name ||
          (row.attachments && row.attachments.length > 0
            ? row.attachments.map((a) => a.file_name || a.name).join(", ")
            : "-"),
        การจัดการ: row.id,
        id: row.id,
      };
    },
    filter: (row) => row.status === "request_update",
  },
  {
    key: "AGENCY_REPORT",
    status: STATUS.AGENCY_REPORT,
    title: "หนังสือแจ้งผลการพิจารณาจากหน่วยงาน",
    headers: [
      "ลำดับ",
      "หน่วยงาน",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "เรื่อง",
      "วันรับงาน",
      "วันที่เสนองาน",
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => {
      return {
        ลำดับ: idx + 1,
        หน่วยงาน: filterDepartmentName(row.agency) || filterDepartmentName(row.department?.name) || "-",
        เลขที่หนังสือ: row.document_number || row.internal_register_number || row.reference_number || "-",
        ลงวันที่: formatDate(getSignedDate(row)),
        เรื่อง: row.issue || row.subject || "-",
        วันรับงาน: formatDate(row._original_document_date || row.document_date || row.updated_at || row.created_at),
        วันที่เสนองาน: formatDate(row.present_to_director_date || row.updated_at || row.created_at),
        เอกสารแนบ:
          row.attachment_name ||
          (row.attachments && row.attachments.length > 0
            ? row.attachments.map((a) => a.file_name || a.name).join(", ")
            : "-"),
        การจัดการ: row.id,
        id: row.id,
      };
    },
    filter: (row) => row.status === "agency_report",
  },
  {
    key: "FINAL_NOTIFY",
    status: STATUS.FINAL_NOTIFY,
    title: "แจ้งผลการพิจารณาให้ผู้เกี่ยวข้องทราบ",
    headers: [
      "ลำดับ",
      "ผู้ตรวจฯ / ผู้ร้อง / หน่วยงานอื่น",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "เรื่อง",
      "วันที่รับ",
      "วันที่ส่งกลับ",
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || "";
      const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";

      if (posName === "ผู้ร้อง" || posName === "ผู้ร้องเรียน") {
        positionDisplay = positionDisplay.replace(/^ผู้ร้อง(เรียน)?/, "(ผู้ร้อง)");
      } else if (posName === "อื่นๆ") {
        positionDisplay = positionDisplay.replace(/^อื่นๆ/, "(อื่นๆ)");
      }

      return {
        ลำดับ: idx + 1,
        "ผู้ตรวจฯ / ผู้ร้อง / หน่วยงานอื่น": positionDisplay,
        เลขที่หนังสือ: row.document_number || row.reference_number || "-",
        ลงวันที่: formatDate(getSignedDate(row)),
        เรื่อง: row.issue || row.subject || "-",
        "วันที่รับ": row.receiveDate || formatDate(row.receive_date || row.document_date || row.reference_date || row.updated_at || row.created_at),
        "วันที่ส่งกลับ": formatDate(row.return_date || row.updated_at || row.created_at),
        เอกสารแนบ:
          row.attachment_name ||
          (row.attachments && row.attachments.length > 0
            ? row.attachments.map((a) => a.file_name || a.name).join(", ")
            : "-"),
        การจัดการ: row.id,
        id: row.id,
      };
    },
    filter: (row) => row.status === "final_notify",
  },
];

const TableSection = ({
  section,
  headers,
  rows,
  rowMapper,
  router,
  handleManage,
  meta,
}) => (
  <Box
    sx={{
      border: `1px solid ${SECTION_STYLES[section.key]?.border || "#E0E0E0"}`,
      borderRadius: 1,
      width: "100%",
      maxWidth: { sm: "auto" },
      background: SECTION_STYLES[section.key]?.boxBg || "#FFFFFF",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      mb: 3,
    }}
  >
    <Box
      sx={{
        background: SECTION_STYLES[section.key]?.headerBg || "#EAF5FF",
        color: SECTION_STYLES[section.key]?.headerColor || "#1120A3",
        py: 1.2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
      }}
    >
      <Typography mx={3} sx={{ fontWeight: "bold" }}>
        {section.title}
      </Typography>
    </Box>
    <Box sx={{ overflowX: { xs: "auto", sm: "unset" }, width: "100%" }}>
      <Table sx={{ width: "100%" }}>
        <TableHead>
          <TableRow>
            {headers.map((h) => (
              <TableCell
                key={h}
                align="center"
                sx={{
                  background: "#FAFAFA",
                  fontWeight: "bold",
                  color: "#555555",
                }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} align="center" sx={{ background: "#FEFEFE" }}>
                ไม่พบข้อมูล
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => {
              const rowObj = rowMapper(row, idx);
              return (
                <TableRow
                  key={rowObj.id || idx}
                  sx={{
                    "&:nth-of-type(odd)": {
                      backgroundColor: "#FBFBFB",
                    },
                    "&:nth-of-type(even)": {
                      backgroundColor: "#FFFFFF",
                    },
                    "&:hover": {
                      backgroundColor: "#F0F0F0",
                    },
                  }}
                >
                  {headers.map((h) => {
                    if (h === "เอกสารแนบ") {
                      return (
                        <TableCell key={h} align="center">
                          <IconButton
                            size="small"
                            sx={{
                              color: "#1976d2",
                              "&:hover": {
                                backgroundColor: "rgba(25, 118, 210, 0.04)",
                              },
                            }}
                          >
                            <FolderIcon
                              sx={{
                                color: "#1223A5",
                                fontSize: 24,
                              }}
                            />
                          </IconButton>
                        </TableCell>
                      );
                    } else if (h === "การจัดการ") {
                      return (
                        <TableCell key={h} align="center">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const targetId = rowObj.id;
                              if (targetId) {
                                handleManage(
                                  section.key,
                                  targetId,
                                  router,
                                  meta?.complaintId,
                                  meta?.complaintNumber,
                                  meta?.createdAt
                                );
                              } else {
                                console.error("Error: ID is missing for this row.");
                              }
                            }}
                            sx={{
                              color: "#1976d2",
                              "&:hover": {
                                backgroundColor: "rgba(25, 118, 210, 0.04)",
                              },
                            }}
                          >
                            <img
                              src="/icons/Edit.png"
                              alt="Edit"
                              style={{
                                width: 35,
                                height: 35,
                                filter:
                                  "brightness(0) saturate(100%) invert(9%) sepia(89%) saturate(7495%) hue-rotate(230deg) brightness(94%) contrast(106%)",
                              }}
                            />
                          </IconButton>
                        </TableCell>
                      );
                    } else {
                      return (
                        <TableCell key={h} align="center">
                          {rowObj[h] ?? "-"}
                        </TableCell>
                      );
                    }
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Box>
  </Box>
);

const FollowComp = () => {
  const router = useRouter();
  const { id } = router.query;
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDocumentData(id);
    }
  }, [id]);

  const fetchDocumentData = async (id) => {
    setLoading(true);
    try {
      const response = await getDocumentStorageByComplaintId(id);
      if (response && response.res_data) {
        setDocumentData(response.res_data);
      }
    } catch (error) {
      console.error("Error fetching document data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Data Processing ====================

  const allRelated = documentData?.relationships?.all_related || [];
  const outgoing_reports = documentData?.outgoing_reports || {};

  // RECEIVED section
  const receivedSection = sectionConfigs[0];
  const receivedHeaders = receivedSection.headers;
  const receivedRows = allRelated.map((r) => ({
    ...r,
    agency: typeof r.agency === "string" && r.agency
      ? r.agency
      : r.agency?.name || r.agency?.agency_name || "-",
    subject: r.subject || r.issue || "-",
    complaint_type: r.complaint_type || r.complaint_type_data || undefined,
  }));

  // Override RECEIVED rowMapper to match enriched shape
  sectionConfigs[0].rowMapper = (row, idx) => ({
    ลำดับ: idx + 1,
    หน่วยงาน: row.agency || "-",
    "เลข สรร.": row.complaint_number || "-",
    "เลขที่อ้างอิง(เลขสรร.สารบัญ)": row.parent_complaint_number || "-",
    เรื่อง: row.subject || "-",
    ประเภทเรื่อง: row.complaint_type?.name || row.complaint_type?.complaint_type_name || "-",
    เอกสารหลัก: row.is_master ? "✅" : "-",
    เอกสารปัจจุบัน: row.is_current ? "✅" : "-",
    เอกสารแนบ: row.attachments && row.attachments.length > 0 ? row.attachments.map((a) => a.file_name || a.name).join(", ") : "-",
    การจัดการ: row.id,
    id: row.id,
  });

  // FORWARDED section
  const forwardedSection = sectionConfigs[1];
  const outgoingType1 = outgoing_reports.type1 || [];
  const forwardedExtra = outgoingType1.map((item) => ({
    ...item,
    agency: filterDepartmentName(item.department?.name) || "-",
    issue: item.subject || "-",
    document_number: item.document_number || "-",
    document_date: formatDate(item.document_date),
    signer: item.signature_authority_user?.name || "-",
    attachment_name:
      item.attachments && item.attachments.length > 0
        ? item.attachments.map((a) => a.file_name || a.name).join(", ")
        : "-",
    id: item.id,
  }));
  const items = Array.isArray(documentData?.items) ? documentData.items : [];
  const forwardedFilteredRows = [
    ...items.filter(forwardedSection.filter),
    ...forwardedExtra,
  ].sort((a, b) => {
    const dateA = dayjs(a.document_date || 0).valueOf();
    const dateB = dayjs(b.document_date || 0).valueOf();
    return dateB - dateA;
  });

  // INITIAL_NOTIFY section
  const initialNotifySection = sectionConfigs[2];
  const outgoingType2 = outgoing_reports.type2 || [];
  const initialNotifyExtra = outgoingType2.map((item) => ({
    ...item,
    department: item.department,
    agency: filterDepartmentName(item.department?.name) || "-",
    reference_number: item.reference_number || "-",
    complaint_number_date: formatDate(item.complaint_number_date),
    subject: item.subject || "-",
    signer: item.signature_authority_user?.name || "-",
    attachments: item.attachments,
    attachment_name:
      item.attachments && item.attachments.length > 0
        ? item.attachments.map((a) => a.file_name || a.name).join(", ")
        : "-",
    id: item.id,
  }));
  const initialItems = Array.isArray(documentData?.items)
    ? documentData.items.filter(initialNotifySection.filter)
    : [];
  const initialNotifyRows = [...initialItems, ...initialNotifyExtra].sort((a, b) => {
    const dateA = dayjs(a.document_date || a.complaint_number_date || 0).valueOf();
    const dateB = dayjs(b.document_date || b.complaint_number_date || 0).valueOf();
    return dateB - dateA;
  });

  // REQUEST_UPDATE section
  const requestUpdateSection = sectionConfigs[3];
  const outgoingType3 = outgoing_reports.type3 || [];
  const requestUpdateExtra = outgoingType3.map((item) => ({
    ...item,
    agency: filterDepartmentName(item.department?.name) || "-",
    issue: item.subject || "-",
    document_number: item.document_number || "-",
    document_date: formatDate(item.document_date),
    signer: item.signature_authority_user?.name || "-",
    attachment_name:
      item.attachments && item.attachments.length > 0
        ? item.attachments.map((a) => a.file_name || a.name).join(", ")
        : "-",
    id: item.id,
  }));
  const requestUpdateItems = Array.isArray(documentData?.items)
    ? documentData.items.filter(requestUpdateSection.filter)
    : [];
  const requestUpdateRows = [...requestUpdateItems, ...requestUpdateExtra].sort((a, b) => {
    const dateA = dayjs(a.document_date || 0).valueOf();
    const dateB = dayjs(b.document_date || 0).valueOf();
    return dateB - dateA;
  });

  // AGENCY_REPORT section
  const agencyReportSection = sectionConfigs[4];
  const outgoingType5 = outgoing_reports.type5 || [];
  const agencyReportRows = outgoingType5.map((item) => ({
    ...item,
    document_number: item.document_number || item.reference_number || "-",
    document_date: formatDate(item.internal_register_date || item.document_date),
    _original_document_date: item.document_date,
    issue: item.subject || "-",
    created_at: formatDate(item.present_to_director_date),
    agency: filterDepartmentName(item.department?.name) || "-",
    attachment_name:
      item.attachments && item.attachments.length > 0
        ? item.attachments.map((a) => a.file_name || a.name).join(", ")
        : "-",
    id: item.id,
  }));
  const agencyReportItems = Array.isArray(documentData?.items)
    ? documentData.items.filter(agencyReportSection.filter)
    : [];
  const agencyReportRowsSorted = [...agencyReportItems, ...agencyReportRows].sort((a, b) => {
    const dateA = dayjs(a.internal_register_date || a.document_date || 0).valueOf();
    const dateB = dayjs(b.internal_register_date || b.document_date || 0).valueOf();
    return dateB - dateA;
  });

  // FINAL_NOTIFY section
  const finalSection = sectionConfigs.find((s) => s.key === "FINAL_NOTIFY");
  const outgoingType4 = outgoing_reports.type4 || [];
  const finalNotifyExtra = outgoingType4.map((item) => ({
    ...item,
    agency: filterDepartmentName(item.department?.name) || "-",
    complaint_id: item.complaint_id || id,
    document_number: item.document_number || item.reference_number || "-",
    receiveDate: formatDate(item.receive_date || item.document_date || item.reference_date),
    returnDate: formatDate(item.return_date),
    issue: item.subject || "-",
    attachment_name:
      item.attachments && item.attachments.length > 0
        ? item.attachments.map((a) => a.file_name || a.name).join(", ")
        : "-",
    id: item.id,
  }));
  const finalNotifyItems = Array.isArray(documentData?.items)
    ? documentData.items
        .filter(finalSection.filter)
        .map((it) => ({ ...it, complaint_id: it.complaint_id || id }))
    : [];
  const finalNotifyRows = [...finalNotifyItems, ...finalNotifyExtra].sort((a, b) => {
    const dateA = dayjs(a.receive_date || a.document_date || a.reference_date || 0).valueOf();
    const dateB = dayjs(b.receive_date || b.document_date || b.reference_date || 0).valueOf();
    return dateB - dateA;
  });

  // Complaint meta for navigation
  const complaintMeta = {
    complaintId: id,
    complaintNumber:
      documentData?.detail?.complaintNumber ||
      documentData?.relationships?.master_complaint?.complaint_number ||
      documentData?.relationships?.all_related?.[0]?.complaint_number ||
      "",
    createdAt: documentData?.detail?.created_at || "",
  };

  // Handle add button click
  const handleImageClick = () => {
    router.push("/complaint/");
  };

  return (
    <Box>
      <BreadcrumbsService items={breadcrumbItems} />

      {/* Top gradient bar */}
      <Box
        sx={{
          background: "linear-gradient(to right, #1223a5, #2499ff)",
          height: 50,
          borderTopRightRadius: "12px",
          px: 3,
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      ></Box>
      <Box sx={{ background: "#fff", py: 2, px: 3, width: "100%" }}>
        <Typography variant="h5" fontWeight="bold" color="#1120A3">
          ติดตามผลการดำเนินการ
        </Typography>
      </Box>

      {/* Info rows - using real data from API */}
      <Box
        sx={{
          background: "#E8F5E9",
          border: "1px solid #A5D6A7",
          borderRadius: 1,
          py: 1.5,
          px: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          mb: 2,
        }}
      >
        <Typography>
          เจ้าหน้าที่ผู้รับผิดชอบ: {" "}
          {documentData?.detail?.assigned_officer?.name ||
            documentData?.detail?.responsibleOfficer ||
            "ไม่ระบุ"}
        </Typography>
      </Box>

      <Box
        sx={{
          background: "#FBEAE9",
          border: "1px solid #F8BBD0",
          borderRadius: 1,
          py: 1.5,
          px: 3,
          width: "100%",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          mb: 2,
        }}
      >
        <Typography>
          ชื่อผู้ร้อง: {" "}
          {documentData?.detail?.claimantName ||
            documentData?.detail?.complainant?.name ||
            "ไม่ระบุ"}
        </Typography>
      </Box>

      {/* ขั้นตอนดำเนินการครั้งแรก header */}
      <Box sx={{ background: "#91CBFF", py: 2, px: 3, width: "100%" }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" sx={{ color: "#000" }}>
            ขั้นตอนดำเนินการครั้งแรก
          </Typography>
          <img
            src="/icons/Add.png"
            alt="Add"
            style={{
              width: "24px",
              height: "24px",
              cursor: "pointer",
              marginLeft: "auto",
            }}
            onClick={handleImageClick}
          />
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* RECEIVED section */}
          <Box
            sx={{
              border: "1px solid #E0E0E0",
              borderRadius: 1,
              width: "100%",
              maxWidth: { sm: "auto" },
              mb: 2,
            }}
          >
            <Box sx={{ background: "#F0F8FF", py: 1.5 }}>
              <Typography mx={3} sx={{ fontWeight: "bold", color: "#2F4F4F" }}>
                {receivedSection.title}
              </Typography>
            </Box>
            <Box sx={{ overflowX: { xs: "auto", sm: "unset" }, width: "100%" }}>
              <Table sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    {receivedHeaders.map((h) => (
                      <TableCell
                        key={h}
                        align="center"
                        sx={{
                          background: "#FAFAFA",
                          fontWeight: "bold",
                          color: "#555555",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receivedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={receivedHeaders.length} align="center" sx={{ background: "#FEFEFE" }}>
                        ไม่พบข้อมูล
                      </TableCell>
                    </TableRow>
                  ) : (
                    receivedRows.map((row, idx) => {
                      const rowObj = sectionConfigs[0].rowMapper(row, idx);
                      return (
                        <TableRow
                          key={rowObj.id || idx}
                          sx={{
                            "&:nth-of-type(odd)": {
                              backgroundColor: "#FBFBFB",
                            },
                            "&:nth-of-type(even)": {
                              backgroundColor: "#FFFFFF",
                            },
                            "&:hover": {
                              backgroundColor: "#F0F0F0",
                            },
                          }}
                        >
                          {receivedHeaders.map((h) => {
                            if (h === "เอกสารแนบ") {
                              return (
                                <TableCell key={h} align="center">
                                  <IconButton
                                    size="small"
                                    sx={{
                                      color: "#1976d2",
                                      "&:hover": {
                                        backgroundColor: "rgba(25, 118, 210, 0.04)",
                                      },
                                    }}
                                  >
                                    <FolderIcon
                                      sx={{
                                        color: "#1223A5",
                                        fontSize: 24,
                                      }}
                                    />
                                  </IconButton>
                                </TableCell>
                              );
                            } else if (h === "การจัดการ") {
                              return (
                                <TableCell key={h} align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      if (rowObj.id) {
                                        handleManage(
                                          "RECEIVED",
                                          rowObj.id,
                                          router,
                                          complaintMeta.complaintId,
                                          complaintMeta.complaintNumber,
                                          complaintMeta.createdAt
                                        );
                                      } else {
                                        console.error("Error: ID is missing for this row.");
                                      }
                                    }}
                                    sx={{
                                      color: "#1976d2",
                                      "&:hover": {
                                        backgroundColor: "rgba(25, 118, 210, 0.04)",
                                      },
                                    }}
                                  >
                                    <img
                                      src="/icons/Edit.png"
                                      alt="Edit"
                                      style={{
                                        width: 35,
                                        height: 35,
                                        filter:
                                          "brightness(0) saturate(100%) invert(9%) sepia(89%) saturate(7495%) hue-rotate(230deg) brightness(94%) contrast(106%)",
                                      }}
                                    />
                                  </IconButton>
                                </TableCell>
                              );
                            } else {
                              return (
                                <TableCell key={h} align="center">
                                  {rowObj[h] ?? "-"}
                                </TableCell>
                              );
                            }
                          })}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          </Box>

          {/* Other sections using TableSection component */}
          <TableSection
            section={forwardedSection}
            headers={forwardedSection.headers}
            rows={forwardedFilteredRows}
            rowMapper={forwardedSection.rowMapper}
            router={router}
            handleManage={handleManage}
            meta={complaintMeta}
          />
          <TableSection
            section={initialNotifySection}
            headers={initialNotifySection.headers}
            rows={initialNotifyRows}
            rowMapper={initialNotifySection.rowMapper}
            router={router}
            handleManage={handleManage}
            meta={complaintMeta}
          />
          <TableSection
            section={requestUpdateSection}
            headers={requestUpdateSection.headers}
            rows={requestUpdateRows}
            rowMapper={requestUpdateSection.rowMapper}
            router={router}
            handleManage={handleManage}
            meta={complaintMeta}
          />
          <TableSection
            section={agencyReportSection}
            headers={agencyReportSection.headers}
            rows={agencyReportRowsSorted}
            rowMapper={agencyReportSection.rowMapper}
            router={router}
            handleManage={handleManage}
            meta={complaintMeta}
          />

          {/* Yellow in-progress bar */}
          <Box sx={{ background: "#FFF9C4", py: 2, px: 3, borderRadius: 1, width: "100%" }}>
            ขั้นตอนอยู่ระหว่างดำเนินการ
          </Box>

          {/* FINAL_NOTIFY section */}
          {finalSection && (
            <Box
              sx={{
                border: `1px solid ${SECTION_STYLES.FINAL_NOTIFY?.border || "#E0E0E0"}`,
                borderRadius: 1,
                width: "100%",
                maxWidth: { sm: "auto" },
                marginBottom: 2,
                background: SECTION_STYLES.FINAL_NOTIFY?.boxBg || "#FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                px: 3,
              }}
            >
              <Box sx={{ px: 3, background: SECTION_STYLES.FINAL_NOTIFY?.headerBg || "#FEFAEF", py: 1 }}>
                <Typography sx={{ fontWeight: "bold", color: SECTION_STYLES.FINAL_NOTIFY?.headerColor || "#1120A3" }}>
                  {finalSection.title}
                </Typography>
              </Box>
              <Box sx={{ overflowX: { xs: "auto", sm: "unset" }, width: "100%" }}>
                <Table sx={{ width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      {finalSection.headers.map((h) => (
                        <TableCell key={h} sx={{ background: "#FAFAFA", fontWeight: "bold", color: "#555555" }} align="center">
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {finalNotifyRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={finalSection.headers.length} align="center" sx={{ background: "#FEFEFE" }}>
                          ไม่พบข้อมูล
                        </TableCell>
                      </TableRow>
                    ) : (
                      finalNotifyRows.map((row, idx) => {
                        const rowObj = finalSection.rowMapper(row, idx);
                        return (
                          <TableRow
                            key={rowObj.id || idx}
                            sx={{
                              "&:nth-of-type(odd)": { backgroundColor: "#FBFBFB" },
                              "&:nth-of-type(even)": { backgroundColor: "#FFFFFF" },
                              "&:hover": { backgroundColor: "#F0F0F0" },
                            }}
                          >
                            {finalSection.headers.map((h) => (
                              <TableCell key={h} align="center">
                                {h === "เอกสารแนบ" ? (
                                  <IconButton
                                    size="small"
                                    sx={{
                                      color: "#1120A3",
                                      "&:hover": {
                                        backgroundColor: "rgba(25, 118, 210, 0.04)",
                                      },
                                    }}
                                  >
                                    <FolderIcon />
                                  </IconButton>
                                ) : h === "การจัดการ" ? (
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      if (rowObj.id) {
                                        handleManage(
                                          finalSection.key,
                                          rowObj.id,
                                          router,
                                          complaintMeta.complaintId,
                                          complaintMeta.complaintNumber,
                                          complaintMeta.createdAt
                                        );
                                      } else {
                                        console.error("Error: ID is missing for this row.");
                                      }
                                    }}
                                    sx={{
                                      color: "#1976d2",
                                      "&:hover": {
                                        backgroundColor: "rgba(25, 118, 210, 0.04)",
                                      },
                                    }}
                                  >
                                    <img
                                      src="/icons/Edit.png"
                                      alt="Edit"
                                      style={{
                                        width: 35,
                                        height: 35,
                                        filter:
                                          "brightness(0) saturate(100%) invert(9%) sepia(89%) saturate(7495%) hue-rotate(230deg) brightness(94%) contrast(106%)",
                                      }}
                                    />
                                  </IconButton>
                                ) : (
                                  rowObj[h] ?? "-"
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default FollowComp;
