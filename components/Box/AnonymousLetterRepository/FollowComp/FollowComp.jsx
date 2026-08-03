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
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link as MuiLink,
  Button,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import FolderIcon from "@mui/icons-material/Folder";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import MovieIcon from "@mui/icons-material/Movie";
import TableChartIcon from "@mui/icons-material/TableChart";
import ArticleIcon from "@mui/icons-material/Article";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getDocumentStorageByComplaintId } from "@pages/api/document/document";
import axiosInstance from "@pages/api/axiosInstance";
import { GetPositionByID } from "@pages/api/positions/positions";
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

// Status translation (English -> Thai)
const STATUS_TRANSLATION = {
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

function getStatusThai(status) {
  return STATUS_TRANSLATION[status] || status || "-";
}

// Status color mapping
const STATUS_COLORS = {
  submitted: "#FFA726",
  sent_to_agency: "#42A5F5",
  sent_to_external: "#AB47BC",
  in_process: "#26C6DA",
  in_review: "#FFCA28",
  tracking: "#FF7043",
  reviewed: "#66BB6A",
  completed: "#4CAF50",
  cancelled: "#EF5350",
};

function getStatusColor(status) {
  return STATUS_COLORS[status] || "#9E9E9E";
}

// Utility: hex to rgba for tinted backgrounds
function hexToRgba(hex, alpha = 0.1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Mapping section key -> delete endpoint path
const DELETE_ENDPOINT_BY_SECTION = {
  FORWARDED: (id) => `/outgoing-reports/${id}`,
  INITIAL_NOTIFY: (id) => `/outgoing-reports2/${id}`,
  REQUEST_UPDATE: (id) => `/outgoing-reports3/${id}`,
  FINAL_NOTIFY: (id) => `/outgoing-reports4/${id}`,
  AGENCY_REPORT: (id) => `/outgoing-reports5/${id}`,
};

// Add button handlers for each section
const addButtonHandlers = {
  FORWARDED: (router, complaintId, complaintNumber, createdAt) =>
    router.push({
      pathname: "/admin/edit/forward-to-agency/",
      query: {
        complaint_id: complaintId || "",
        complaint_number: complaintNumber || "",
        created_at: createdAt || "",
      },
    }),
  INITIAL_NOTIFY: (router, complaintId, complaintNumber, createdAt) =>
    router.push({
      pathname: "/admin/edit/initial-notification-to-complainant-or-agency/",
      query: {
        complaint_id: complaintId || "",
        complaint_number: complaintNumber || "",
        created_at: createdAt || "",
      },
    }),
  REQUEST_UPDATE: (router, complaintId, complaintNumber, createdAt) =>
    router.push({
      pathname: "/admin/edit/request-result-or-progress/",
      query: {
        complaint_id: complaintId || "",
        complaint_number: complaintNumber || "",
        created_at: createdAt || "",
      },
    }),
  AGENCY_REPORT: (router, complaintId, complaintNumber, createdAt) =>
    router.push({
      pathname: "/admin/edit/report/",
      query: {
        complaint_id: complaintId || "",
        complaint_number: complaintNumber || "",
        created_at: createdAt || "",
      },
    }),
  FINAL_NOTIFY: (router, complaintId, complaintNumber, createdAt) =>
    router.push({
      pathname: "/admin/edit/inform-related-parties/",
      query: {
        complaint_id: complaintId || "",
        complaint_number: complaintNumber || "",
        created_at: createdAt || "",
      },
    }),
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

// ==================== Attachment Helpers ====================
const getFileExt = (filename = "") => filename.split(".").pop()?.toLowerCase() || "";

const getFileIcon = (ext) => {
  const e = String(ext).toLowerCase();
  if (e === "pdf") return <PictureAsPdfIcon sx={{ color: "#d32f2f" }} />;
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(e)) return <ImageIcon sx={{ color: "#1976d2" }} />;
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(e)) return <AudioFileIcon sx={{ color: "#6a1b9a" }} />;
  if (["mp4", "webm", "ogv", "mov", "mkv"].includes(e)) return <MovieIcon sx={{ color: "#ef6c00" }} />;
  if (["xls", "xlsx", "csv"].includes(e)) return <TableChartIcon sx={{ color: "#2e7d32" }} />;
  if (["doc", "docx", "ppt", "pptx"].includes(e)) return <ArticleIcon sx={{ color: "#0288d1" }} />;
  if (["txt", "json", "md", "log"].includes(e)) return <DescriptionIcon sx={{ color: "#455a64" }} />;
  return <InsertDriveFileIcon sx={{ color: "#757575" }} />;
};

const getDownloadUrl = (file = {}) => {
  const raw =
    file.fileUrl ||
    file.file_url ||
    file.url ||
    file.path ||
    file.file_path ||
    "";
  if (!raw) return null;
  if (typeof raw === "string" && /^https?:\/\//i.test(raw)) return raw;

  const normalizePath = (s) => {
    let v = String(s).replace(/\\/g, "/").replace(/\\/g, "/");
    const apiIdx = v.indexOf("/api/uploads/");
    if (apiIdx >= 0) v = v.substring(apiIdx);
    else {
      const upIdx = v.indexOf("/uploads/");
      if (upIdx >= 0) v = v.substring(upIdx);
    }
    if (!v.startsWith("/")) v = `/${v}`;
    return v;
  };

  const normalized = normalizePath(raw);
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  const apiNoVer = apiBase.replace(/\/v\d+$/, "");
  const origin = apiNoVer.replace(/\/api$/, "");

  if (normalized.startsWith("/api/")) return `${origin}${normalized}`;
  if (normalized.startsWith("/uploads/")) return `${apiNoVer}${normalized}`;
  return `${apiNoVer}${normalized}`;
};

const downloadFile = async (url, filename) => {
  if (!url) return;
  try {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "download";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
        return;
      }
    } catch (fetchError) {
      console.warn("Fetch download failed:", fetchError);
    }
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "download";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    } catch (anchorError) {
      console.warn("Anchor download failed:", anchorError);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("Download failed:", error);
  }
};

const INLINE_IMAGE = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
const INLINE_TEXT = ["txt", "json", "md", "log", "csv"];
const INLINE_AUDIO = ["mp3", "wav", "ogg", "m4a", "aac"];
const INLINE_VIDEO = ["mp4", "webm", "ogv", "mov", "mkv"];
const OFFICE_DOC = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"];

const canPreview = (ext = "") => {
  const e = String(ext).toLowerCase();
  if (e === "pdf") return true;
  if (INLINE_IMAGE.includes(e)) return true;
  if (INLINE_TEXT.includes(e)) return true;
  if (INLINE_AUDIO.includes(e)) return true;
  if (INLINE_VIDEO.includes(e)) return true;
  if (OFFICE_DOC.includes(e)) return true;
  return false;
};

const openPreview = async (setPreviewState, href, name, ext) => {
  if (!href) return;
  const e = (ext || "").toLowerCase();
  setPreviewState((prev) => ({ ...prev, name: name || "ไฟล์แนบ", zoom: 1, pdfLoadError: false, originalUrl: "", open: true, type: "image", src: "" }));

  if (INLINE_TEXT.includes(e)) {
    setPreviewState((prev) => ({ ...prev, originalUrl: href }));
    try {
      const res = await fetch(href);
      const text = await res.text();
      const limited = text.length > 200000 ? text.slice(0, 200000) + "\n... (ตัดบางส่วน)" : text;
      setPreviewState((prev) => ({ ...prev, src: limited, type: "text" }));
    } catch (err) {
      setPreviewState((prev) => ({ ...prev, src: "ไม่สามารถโหลดไฟล์ข้อความได้", type: "text" }));
    }
    return;
  }
  if (INLINE_AUDIO.includes(e)) {
    setPreviewState((prev) => ({ ...prev, src: href, type: "audio" }));
    return;
  }
  if (INLINE_VIDEO.includes(e)) {
    setPreviewState((prev) => ({ ...prev, src: href, type: "video" }));
    return;
  }
  if (OFFICE_DOC.includes(e)) {
    const encoded = encodeURIComponent(href);
    setPreviewState((prev) => ({ ...prev, src: `https://docs.google.com/gview?embedded=1&url=${encoded}`, type: "gdoc" }));
    return;
  }
  if (e === "pdf") {
    const pdfJsUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(href)}`;
    setPreviewState((prev) => ({ ...prev, src: pdfJsUrl, type: "pdfjs" }));
    return;
  }
  setPreviewState((prev) => ({ ...prev, src: href, type: "image" }));
};

const TableSection = ({
  section,
  headers,
  rows,
  rowMapper,
  router,
  handleManage,
  meta,
  onOpenAttachments,
  onAdd,
  onDelete,
  deletingMap = {},
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
      {onAdd && (
        <IconButton sx={{ mr: 2 }} onClick={onAdd}>
          <img
            src="/icons/Add.png"
            alt="Add"
            style={{
              width: "28px",
              height: "28px",
              cursor: "pointer",
              filter: "invert(1) brightness(2)",
            }}
          />
        </IconButton>
      )}
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
                            onClick={() => onOpenAttachments && onOpenAttachments(section.key, row, rowObj)}
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
                          {DELETE_ENDPOINT_BY_SECTION[section.key] && (
                            <IconButton
                              size="small"
                              onClick={() => onDelete && onDelete(section.key, rowObj.id)}
                              sx={{
                                color: "#d32f2f",
                                ml: 0.5,
                                "&:hover": { backgroundColor: "rgba(211,47,47,0.08)" },
                              }}
                              disabled={!!deletingMap[rowObj.id]}
                            >
                              {deletingMap[rowObj.id] ? (
                                <CircularProgress size={22} sx={{ color: "#d32f2f" }} />
                              ) : (
                                <DeleteOutlineIcon sx={{ fontSize: 28 }} />
                              )}
                            </IconButton>
                          )}
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

// StatusHistorySection component
const StatusHistorySection = ({ statusHistory }) => (
  <Box
    sx={{
      border: "1px solid #E0E0E0",
      borderRadius: 1,
      width: "100%",
      maxWidth: { sm: "auto" },
      background: "#F9FAFB",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      mb: 3,
    }}
  >
    <Box
      sx={{
        background: "#B8C5D6",
        color: "#2F4F4F",
        py: 1.2,
        display: "flex",
        alignItems: "center",
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
      }}
    >
      <Typography mx={3} sx={{ fontWeight: "bold" }}>
        ประวัติการเปลี่ยนสถานะ
      </Typography>
    </Box>
    <Box sx={{ overflowX: { xs: "auto", sm: "unset" }, width: "100%" }}>
      <Table sx={{ width: "100%" }}>
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ background: "#FAFAFA", fontWeight: "bold", color: "#555555" }}>
              ลำดับ
            </TableCell>
            <TableCell align="center" sx={{ background: "#FAFAFA", fontWeight: "bold", color: "#555555" }}>
              วันที่เปลี่ยนแปลง
            </TableCell>
            <TableCell align="center" sx={{ background: "#FAFAFA", fontWeight: "bold", color: "#555555" }}>
              ผู้เปลี่ยนแปลง
            </TableCell>
            <TableCell align="center" sx={{ background: "#FAFAFA", fontWeight: "bold", color: "#555555" }}>
              หมายเหตุ
            </TableCell>
            <TableCell align="center" sx={{ background: "#FAFAFA", fontWeight: "bold", color: "#555555" }}>
              สถานะ
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {statusHistory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ background: "#FEFEFE" }}>
                ไม่พบประวัติการเปลี่ยนสถานะ
              </TableCell>
            </TableRow>
          ) : (
            statusHistory.map((item, idx) => (
              <TableRow
                key={idx}
                sx={{
                  "&:nth-of-type(odd)": { backgroundColor: "#FBFBFB" },
                  "&:nth-of-type(even)": { backgroundColor: "#FFFFFF" },
                  "&:hover": { backgroundColor: "#F0F0F0" },
                }}
              >
                <TableCell align="center">{idx + 1}</TableCell>
                <TableCell align="center">
                  {item.changed_at
                    ? (() => {
                        const d = dayjs(item.changed_at);
                        return d.isValid() ? d.format("D MMM BBBB HH:mm") : "-";
                      })()
                    : "-"}
                </TableCell>
                <TableCell align="center">{item.changed_by_name || "-"}</TableCell>
                <TableCell align="center">{item.remark || "-"}</TableCell>
                <TableCell align="center">
                  <b>{getStatusThai(item.status)}</b>
                </TableCell>
              </TableRow>
            ))
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
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsList, setAttachmentsList] = useState([]);
  const [attachmentsTitle, setAttachmentsTitle] = useState("เอกสารแนบ");
  const [preview, setPreview] = useState({ open: false, src: "", name: "", type: "image", zoom: 1, pdfLoadError: false, originalUrl: "" });
  const [deleting, setDeleting] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [positionMap, setPositionMap] = useState({});
  const [positionLoading, setPositionLoading] = useState(false);

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

  // Navigate to a related complaint by its complaint number
  const navigateToComplaint = (targetComplaintNumber) => {
    if (!targetComplaintNumber || targetComplaintNumber === "-") return;
    const target = allRelated.find(
      (r) => r?.complaint_number === targetComplaintNumber
    );
    const targetId = target?.id || targetComplaintNumber;
    if (targetId && targetId !== router.query.id) {
      router.push({ pathname: router.pathname, query: { id: targetId } });
    }
  };

  // Get section title by key
  const getSectionTitle = (key) => sectionConfigs.find((s) => s.key === key)?.title || key;

  // Handle delete request (opens confirmation dialog)
  const handleRequestDelete = (sectionKey, delId) => {
    if (!sectionKey || !delId) return;
    setConfirmDelete({ sectionKey, id: delId });
  };

  // Execute actual delete via axiosInstance
  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { sectionKey, id: delId } = confirmDelete;
    const build = DELETE_ENDPOINT_BY_SECTION[sectionKey];
    if (!build) return;
    setDeleting((p) => ({ ...p, [delId]: true }));
    try {
      const endpoint = build(delId);
      await axiosInstance.delete(endpoint);
      await fetchDocumentData(id);
      setConfirmDelete(null);
    } catch (e) {
      console.error("Delete failed", e?.response?.data || e.message);
      alert(e?.response?.data?.res_message || "ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeleting((p) => {
        const cp = { ...p };
        delete cp[delId];
        return cp;
      });
    }
  };

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

  // ================= Position Name Mapping (FINAL_NOTIFY) =================
  useEffect(() => {
    if (!finalNotifyRows || finalNotifyRows.length === 0) return;
    const missing = new Set();
    finalNotifyRows.forEach((r) => {
      const pid = r.position_id || r.positionId || r.position?.id;
      const hasName = r.position?.name || r.position_name || positionMap[pid];
      if (pid && !hasName) {
        missing.add(pid);
      }
    });
    if (missing.size === 0) return;

    let cancelled = false;
    const fetchPositions = async () => {
      setPositionLoading(true);
      try {
        const entries = await Promise.all(
          Array.from(missing).map(async (pid) => {
            try {
              const data = await GetPositionByID(pid);
              const name = data?.res_data?.name || data?.data?.name || data?.name || null;
              return [pid, name];
            } catch (err) {
              console.warn("GetPositionByID failed", pid, err);
              return [pid, null];
            }
          })
        );
        if (!cancelled) {
          setPositionMap((prev) => {
            const next = { ...prev };
            entries.forEach(([pid, name]) => {
              if (name) next[pid] = name;
            });
            return next;
          });
        }
      } finally {
        if (!cancelled) setPositionLoading(false);
      }
    };
    fetchPositions();
    return () => {
      cancelled = true;
    };
  }, [finalNotifyRows]);

  // Enrich FINAL_NOTIFY rows with mapped position names
  const enrichedFinalNotifyRows = finalNotifyRows.map((r) => {
    const pid = r.position_id || r.positionId || r.position?.id;
    if (pid && !r.position_name && !(r.position && r.position.name) && positionMap[pid]) {
      return { ...r, position_name: positionMap[pid] };
    }
    return r;
  });
  // ============================================================================

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

  // เปิด dialog เอกสารแนบ
  const openAttachments = (sectionKey, rowRaw, rowDisplay) => {
    try {
      setAttachmentsLoading(true);
      let files = [];
      let title = `เอกสารแนบ (${sectionKey})`;

      const relAll = documentData?.relationships?.all_related || [];
      const out = documentData?.outgoing_reports || {};
      const findById = (arr = [], idVal) => (arr || []).find((x) => x?.id === idVal) || null;

      switch (sectionKey) {
        case "RECEIVED": {
          const found = findById(relAll, rowDisplay?.id);
          files = found?.attachments || [];
          title = `เอกสารแนบ - รับเรื่อง (${found?.complaint_number || "-"})`;
          break;
        }
        case "FORWARDED": {
          files = rowRaw?.attachments || findById(out?.type1, rowDisplay?.id)?.attachments || [];
          title = `เอกสารแนบ - ส่งหน่วยงานที่เกี่ยวข้อง`;
          break;
        }
        case "INITIAL_NOTIFY": {
          files = rowRaw?.attachments || findById(out?.type2, rowDisplay?.id)?.attachments || [];
          title = `เอกสารแนบ - แจ้งเบื้องต้น`;
          break;
        }
        case "REQUEST_UPDATE": {
          files = rowRaw?.attachments || findById(out?.type3, rowDisplay?.id)?.attachments || [];
          title = `เอกสารแนบ - ขอทราบผล/ความคืบหน้า`;
          break;
        }
        case "AGENCY_REPORT": {
          files = rowRaw?.attachments || findById(out?.type5, rowDisplay?.id)?.attachments || [];
          title = `เอกสารแนบ - หนังสือแจ้งผลการพิจารณาจากหน่วยงาน`;
          break;
        }
        case "FINAL_NOTIFY": {
          files = rowRaw?.attachments || findById(out?.type4, rowDisplay?.id)?.attachments || findById(out?.type5, rowDisplay?.id)?.attachments || [];
          title = `เอกสารแนบ - แจ้งผลผู้เกี่ยวข้องทราบ`;
          break;
        }
        default: {
          files = [];
        }
      }
      setAttachmentsTitle(title);
      setAttachmentsList(Array.isArray(files) ? files : []);
      setAttachmentsOpen(true);
    } finally {
      setAttachmentsLoading(false);
    }
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

      {/* Status display box with color (replaces simple yellow bar) */}
      {(() => {
        const statusEn = documentData?.detail?.status || "-";
        const statusTh = getStatusThai(statusEn);
        const color = getStatusColor(statusEn);
        const bg = hexToRgba(color, 0.12);
        return (
          <Box
            sx={{
              background: bg,
              border: `1px solid ${color}`,
              borderRadius: 1,
              py: 2,
              px: 3,
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold", color, mb: 0.5 }}>
              ขั้นตอนอยู่ระหว่างดำเนินการ
            </Typography>
            <Typography sx={{ color: "#1A1A1A" }}>
              สถานะปัจจุบัน: <b style={{ color }}>{statusTh}</b>
            </Typography>
          </Box>
        );
      })()}

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
                                    onClick={() => openAttachments("RECEIVED", row, sectionConfigs[0].rowMapper(row, idx))}
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
                              // Make complaint number columns clickable
                              if (
                                h === "เลข สรร." ||
                                h === "เลขที่อ้างอิง(เลขสรร.สารบัญ)"
                              ) {
                                const displayValue = rowObj[h] ?? "-";
                                return (
                                  <TableCell
                                    key={h}
                                    align="center"
                                    sx={{
                                      cursor:
                                        displayValue && displayValue !== "-"
                                          ? "pointer"
                                          : "default",
                                      color:
                                        displayValue && displayValue !== "-"
                                          ? "#1976d2"
                                          : "inherit",
                                      textDecoration:
                                        displayValue && displayValue !== "-"
                                          ? "underline"
                                          : "none",
                                    }}
                                    onClick={() =>
                                      displayValue && displayValue !== "-"
                                        ? navigateToComplaint(displayValue)
                                        : null
                                    }
                                  >
                                    {displayValue}
                                  </TableCell>
                                );
                              }
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

          {/* Other sections using TableSection component with onAdd, onDelete, deletingMap */}
          <TableSection
            section={forwardedSection}
            headers={forwardedSection.headers}
            rows={forwardedFilteredRows}
            rowMapper={forwardedSection.rowMapper}
            router={router}
            handleManage={handleManage}
            meta={complaintMeta}
            onOpenAttachments={openAttachments}
            onAdd={() =>
              addButtonHandlers.FORWARDED(
                router,
                id,
                documentData?.detail?.complaintNumber ||
                  documentData?.relationships?.master_complaint?.complaint_number ||
                  documentData?.relationships?.all_related?.[0]?.complaint_number ||
                  "",
                documentData?.detail?.created_at || ""
              )
            }
            onDelete={(sectionKey, rowId) => handleRequestDelete(sectionKey, rowId)}
            deletingMap={deleting}
          />
          <TableSection
            section={initialNotifySection}
            headers={initialNotifySection.headers}
            rows={initialNotifyRows}
            rowMapper={initialNotifySection.rowMapper}
            router={router}
            handleManage={handleManage}
            meta={complaintMeta}
            onOpenAttachments={openAttachments}
            onAdd={() =>
              addButtonHandlers.INITIAL_NOTIFY(
                router,
                id,
                documentData?.detail?.complaintNumber ||
                  documentData?.relationships?.master_complaint?.complaint_number ||
                  documentData?.relationships?.all_related?.[0]?.complaint_number ||
                  "",
                documentData?.detail?.created_at || ""
              )
            }
            onDelete={(sectionKey, rowId) => handleRequestDelete(sectionKey, rowId)}
            deletingMap={deleting}
          />
          <TableSection
            section={requestUpdateSection}
            headers={requestUpdateSection.headers}
            rows={requestUpdateRows}
            rowMapper={requestUpdateSection.rowMapper}
            router={router}
            handleManage={handleManage}
            meta={complaintMeta}
            onOpenAttachments={openAttachments}
            onAdd={() =>
              addButtonHandlers.REQUEST_UPDATE(
                router,
                id,
                documentData?.detail?.complaintNumber ||
                  documentData?.relationships?.master_complaint?.complaint_number ||
                  documentData?.relationships?.all_related?.[0]?.complaint_number ||
                  ""
              )
            }
            onDelete={(sectionKey, rowId) => handleRequestDelete(sectionKey, rowId)}
            deletingMap={deleting}
          />
          <TableSection
            section={agencyReportSection}
            headers={agencyReportSection.headers}
            rows={agencyReportRowsSorted}
            rowMapper={agencyReportSection.rowMapper}
            router={router}
            handleManage={handleManage}
            meta={complaintMeta}
            onOpenAttachments={openAttachments}
            onAdd={() =>
              addButtonHandlers.AGENCY_REPORT(
                router,
                id,
                documentData?.detail?.complaintNumber ||
                  documentData?.relationships?.master_complaint?.complaint_number ||
                  documentData?.relationships?.all_related?.[0]?.complaint_number ||
                  ""
              )
            }
            onDelete={(sectionKey, rowId) => handleRequestDelete(sectionKey, rowId)}
            deletingMap={deleting}
          />

          {/* FINAL_NOTIFY section - now using TableSection with enriched rows */}
          <TableSection
            section={finalSection}
            headers={finalSection.headers}
            rows={enrichedFinalNotifyRows}
            rowMapper={finalSection.rowMapper}
            router={router}
            handleManage={handleManage}
            meta={complaintMeta}
            onOpenAttachments={openAttachments}
            onAdd={() =>
              addButtonHandlers.FINAL_NOTIFY(
                router,
                id,
                documentData?.detail?.complaintNumber ||
                  documentData?.relationships?.master_complaint?.complaint_number ||
                  documentData?.relationships?.all_related?.[0]?.complaint_number ||
                  ""
              )
            }
            onDelete={(sectionKey, rowId) => handleRequestDelete(sectionKey, rowId)}
            deletingMap={deleting}
          />

          {/* Position loading indicator */}
          {positionLoading && (
            <Typography variant="caption" sx={{ ml: 2, color: "#666" }}>
              กำลังโหลดข้อมูลตำแหน่งเพิ่มเติม...
            </Typography>
          )}

          {/* StatusHistorySection */}
          {documentData?.detail?.status_history?.length > 0 && (
            <StatusHistorySection
              statusHistory={documentData.detail.status_history}
            />
          )}
        </>
      )}

      {/* Attachments Dialog */}
      <Dialog open={attachmentsOpen} onClose={() => setAttachmentsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{attachmentsTitle}</DialogTitle>
        <DialogContent dividers>
          {attachmentsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : attachmentsList.length === 0 ? (
            <Typography align="center">ไม่มีไฟล์แนบ</Typography>
          ) : (
            <List>
              {attachmentsList.map((f, idx) => {
                const name = f.file_name || f.name || f.original_name || `ไฟล์แนบ ${idx + 1}`;
                const ext = getFileExt(name);
                const href = getDownloadUrl(f);
                return (
                  <ListItem key={idx} disableGutters>
                    <ListItemIcon sx={{ minWidth: 36 }}>{getFileIcon(ext)}</ListItemIcon>
                    <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
                      {href && canPreview(ext) ? (
                        <MuiLink component="button" type="button" underline="hover" onClick={() => openPreview(setPreview, href, name, ext)} sx={{ textAlign: "left", flexGrow: 1 }}>
                          <ListItemText primary={name} />
                        </MuiLink>
                      ) : href ? (
                        <MuiLink href={href} target="_blank" rel="noreferrer" underline="hover" sx={{ flexGrow: 1 }}>
                          <ListItemText primary={name} />
                        </MuiLink>
                      ) : (
                        <ListItemText primary={name} />
                      )}
                      {href && (
                        <>
                          <IconButton size="small" onClick={() => window.open(href, "_blank", "noreferrer")}>
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => downloadFile(href, name)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={preview.open} onClose={() => setPreview((p) => ({ ...p, open: false }))} fullScreen>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#1e1e1e" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, py: 0.5, bgcolor: "#2c2c2c", color: "#fff" }}>
            <IconButton color="inherit" onClick={() => setPreview((p) => ({ ...p, open: false }))}>
              <CloseIcon sx={{ color: "#fff" }} />
            </IconButton>
            <Typography sx={{ flexGrow: 1 }} noWrap title={preview.name}>{preview.name}</Typography>
            {preview.type === "image" && (
              <>
                <IconButton color="inherit" onClick={() => setPreview((p) => ({ ...p, zoom: Math.max(0.25, parseFloat((p.zoom - 0.1).toFixed(2))) }))}>
                  <ZoomOutIcon sx={{ color: "#fff" }} />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 48, textAlign: "center" }}>{Math.round(preview.zoom * 100)}%</Typography>
                <IconButton color="inherit" onClick={() => setPreview((p) => ({ ...p, zoom: Math.min(4, parseFloat((p.zoom + 0.1).toFixed(2))) }))}>
                  <ZoomInIcon sx={{ color: "#fff" }} />
                </IconButton>
              </>
            )}
            <IconButton color="inherit" onClick={() => downloadFile(preview.type === "text" ? preview.originalUrl : preview.src, preview.name)}>
              <DownloadIcon sx={{ color: "#fff" }} />
            </IconButton>
            <IconButton color="inherit" onClick={() => window.open(preview.type === "text" ? preview.originalUrl : preview.src, "_blank", "noreferrer")}>
              <OpenInNewIcon sx={{ color: "#fff" }} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
            {preview.type === "pdfjs" && (
              <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                <iframe title={preview.name} src={preview.src} style={{ border: "none", width: "100%", height: "100%" }} />
              </Box>
            )}
            {preview.type === "gdoc" && (
              <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
                <iframe title={preview.name} src={preview.src} style={{ border: "none", width: "100%", height: "100%" }} />
              </Box>
            )}
            {preview.type === "image" && (
              <Box sx={{ bgcolor: "#ffffff", boxShadow: 3, p: 2 }}>
                <Box sx={{ transform: `scale(${preview.zoom})`, transformOrigin: "top left" }}>
                  <img src={preview.src} alt={preview.name} style={{ display: "block", maxWidth: "100%", height: "auto" }} />
                </Box>
              </Box>
            )}
            {preview.type === "text" && (
              <Box sx={{ width: "100%", height: "100%", bgcolor: "#121212", color: "#e0e0e0", p: 2, fontFamily: "monospace", whiteSpace: "pre-wrap", overflow: "auto", fontSize: "14px", lineHeight: 1.5 }}>
                {preview.src}
              </Box>
            )}
            {preview.type === "audio" && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <audio controls src={preview.src} style={{ width: "100%", maxWidth: "500px" }} />
                <Typography color="#fff">{preview.name}</Typography>
              </Box>
            )}
            {preview.type === "video" && (
              <Box sx={{ width: "100%", maxWidth: 960 }}>
                <video controls src={preview.src} style={{ width: "100%", maxHeight: "80vh" }} />
                <Typography color="#fff" align="center" mt={1}>{preview.name}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => !Object.keys(deleting).some((k) => deleting[k]) && setConfirmDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(135deg,#fafbfd,#f4f8fb)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            fontWeight: "bold",
            fontSize: 18,
            pb: 1,
            color: "#b71c1c",
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(244, 67, 54, 0.1)",
              color: "#d32f2f",
            }}
          >
            <DeleteOutlineIcon />
          </Box>
          ยืนยันการลบ
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            pt: 2,
            pb: 2.5,
            borderColor: "#e3e8ee",
            background: "transparent",
          }}
        >
          <Typography sx={{ mb: 1.5, fontSize: 15, color: "#37474f" }}>
            คุณต้องการลบข้อมูลนี้หรือไม่? การลบจะไม่สามารถย้อนกลับได้
          </Typography>
          {confirmDelete && (
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2,
                background: "#fff",
                border: "1px solid #f5c2c7",
                mb: 2,
                fontSize: 13.5,
                color: "#5d4037",
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                <b>ประเภท:</b> {getSectionTitle(confirmDelete.sectionKey)}<br />
                <b>ID:</b> {confirmDelete.id}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setConfirmDelete(null)}
              disabled={confirmDelete && deleting[confirmDelete.id]}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 2.5,
                borderColor: "#90a4ae",
                color: "#455a64",
                "&:hover": { borderColor: "#607d8b", background: "rgba(96,125,139,0.06)" },
              }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              onClick={executeDelete}
              disabled={!(confirmDelete && !deleting[confirmDelete.id])}
              startIcon={confirmDelete && deleting[confirmDelete.id] ? <CircularProgress size={18} color="inherit" /> : <DeleteOutlineIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 2.5,
                fontWeight: 600,
                bgcolor: "#d32f2f",
                boxShadow: "0 2px 6px rgba(211,47,47,0.4)",
                "&:hover": { bgcolor: "#c62828" },
              }}
            >
              {confirmDelete && deleting[confirmDelete.id] ? "กำลังลบ..." : "ลบข้อมูล"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FollowComp;
