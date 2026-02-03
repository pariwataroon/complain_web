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
import { getDocumentStorageByComplaintId } from "@pages/api/document/document";
import { GetPositionByID } from "@pages/api/positions/positions"; // ใช้สำหรับ map position_id -> position_name เมื่อ backend ไม่ส่งชื่อมา
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
import axiosInstance from "@pages/api/axiosInstance";

// 1. Define English-status constants
const STATUS = {
  RECEIVED: 1,
  FORWARDED: 2,
  INITIAL_NOTIFY: 3,
  REQUEST_UPDATE: 4,
  AGENCY_REPORT: 5,
  FINAL_NOTIFY: 6,
};

// Section color themes to improve visual separation - Pastel colors
const SECTION_STYLES = {
  RECEIVED: {
    boxBg: "#F0F8FF", // very light blue
    headerBg: "#87CEEB", // sky blue
    headerColor: "#2F4F4F", // dark slate gray
    border: "#B0E0E6", // powder blue
  },
  FORWARDED: {
    boxBg: "#F0FFFF", // azure
    headerBg: "#98D8C8", // mint cream
    headerColor: "#2F4F4F", // dark slate gray
    border: "#AFEEEE", // pale turquoise
  },
  INITIAL_NOTIFY: {
    boxBg: "#FFFEF7", // cream
    headerBg: "#F0E68C", // khaki
    headerColor: "#556B2F", // dark olive green
    border: "#F5DEB3", // wheat
  },
  REQUEST_UPDATE: {
    boxBg: "#FFF8F0", // seashell
    headerBg: "#DEB887", // burlywood
    headerColor: "#8B4513", // saddle brown
    border: "#FFEFD5", // papaya whip
  },
  AGENCY_REPORT: {
    boxBg: "#F8F0FF", // ghost white
    headerBg: "#DDA0DD", // plum
    headerColor: "#4B0082", // indigo
    border: "#E6E6FA", // lavender
  },
  FINAL_NOTIFY: {
    boxBg: "#F0FFF0", // honeydew
    headerBg: "#98FB98", // pale green
    headerColor: "#228B22", // forest green
    border: "#C1FFC1", // dark sea green
  },
};

const breadcrumbItems = [
  {
    label: "เมนูคลังเอกสาร",
    icon: <Inventory2Icon sx={{ width: 24, height: 24, mb: -1 }} />,
    url: "/admin/box/list",
  },
  { label: "คลังเรื่องราวร้องทุกข์" },
];

// ฟังก์ชันกรองชื่อหน่วยงาน: ถ้าเป็น "ทดสอบ" หรือค่าว่าง ให้คืนค่า null เพื่อข้ามไปใช้ค่าอื่น
const filterDepartmentName = (name) => {
  if (!name || name === "ทดสอบ") return null;
  return name;
};

const handleOpenDocument = (documentName) => {
  const w3schoolsPDF =
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
  window.open(w3schoolsPDF, "_blank");
};

const handleManage = (
  sectionKey,
  id,
  router,
  complaintId,
  complaintNumber,
  createdAt
) => {
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
    case "REQUEST_UPDATE":
      {
        const complaintId2 = router.query?.id || null;
        router.push({
          pathname: `/admin/edit/request-result-or-progress/${id}`,
          query: { complaint_id: complaintId2, outgoing_report3_id: id, report3_id: id, created_at: createdAt || "" },
        });
      }
      break;
    case "AGENCY_REPORT": {
      const complaintId2 = router.query?.id || null;
      router.push({
        pathname: "/admin/edit/report/",
        query: { complaint_id: complaintId2, outgoing_report5_id: id, report5_id: id, created_at: createdAt || "" },
      });
      break;
    }
    case "FINAL_NOTIFY":
      const complaintId = router.query?.id || null;
      router.push({
        pathname: "/admin/edit/inform-related-parties/",
        query: { complaint_id: complaintId, report4_id: id, created_at: createdAt || "" },
      });
      break;
    default:
      break;
  }
};

// ฟังก์ชันแปลงวันที่ให้เป็นรูปแบบไทยที่สอดคล้องกันทั่วทั้งไฟล์
const formatDate = (date) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return "-";
  }
};

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
      เอกสารหลัก:
        row.is_master !== undefined ? (row.is_master ? "✅" : "-") : "-",
      เอกสารปัจจุบัน:
        row.is_current !== undefined ? (row.is_current ? "✅" : "-") : "-",
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
      // If position indicates it's an individual or 'other' (ผู้ร้อง / ผู้ร้องเรียน / อื่นๆ / หน่วยงานอื่นๆ)
      // prefer position_other_text; otherwise prefer department.name. Keep safe fallbacks.
      const isSpecialPosition = ["ผู้ร้อง", "ผู้ร้องเรียน", "อื่นๆ", "หน่วยงานอื่นๆ"].includes(posName);
      // FORWARDED context: use the selected posName (in parentheses) as prefix for special positions
      const prefix = isSpecialPosition ? `(${posName}) ` : "";

      const deptName = filterDepartmentName(row.department?.name)
        || filterDepartmentName(row.department_name)
        || filterDepartmentName(row.outgoing_departments?.[0]?.name);

      const departmentDisplay = isSpecialPosition
        ? (prefix + (other || deptName || "-"))
        : (deptName || "-");

      // แปลงวันที่ให้เป็นรูปแบบไทยที่สอดคล้องกัน
      const formatDate = (date) => {
        if (!date) return "-";
        try {
          return new Date(date).toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
        } catch {
          return "-";
        }
      };

      return {
        ลำดับ: idx + 1,
        "หน่วยงาน(ครั้งที่ส่ง)": departmentDisplay,
        เรื่อง: row.issue || row.subject || "-",
        เลขที่หนังสือ: row.document_number || "-",
        ลงวันที่: formatDate(row.document_date),
        ผู้ลงนาม:
          row.signer ||
          (row.signature_authority_user && row.signature_authority_user.name) ||
          "-",
        เอกสารแนบ: row.attachment_name || "-",
        การจัดการ: row.id,
        id: row.id,
      };
    },
    filter: (row) =>
      row.status === "sent_to_agency" || row.status === "forwarded",
  },
  {
    key: "INITIAL_NOTIFY",
    status: STATUS.INITIAL_NOTIFY,
    title: "แจ้งผู้ร้อง/หน่วยงานที่ส่งเรื่องมากระทรวงการคลังทราบเบื้องต้น",
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

      // แปลงวันที่ให้เป็นรูปแบบไทยที่สอดคล้องกัน
      const formatDate = (date) => {
        if (!date) return "-";
        try {
          return new Date(date).toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
        } catch {
          return "-";
        }
      };

      return {
        ลำดับ: idx + 1,
        "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)": positionDisplay,
        เลขที่หนังสือ: row.document_number || row.reference_number || "-",
        ลงวันที่: formatDate(row.document_date),
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
      // FORWARDED context: use the selected posName (in parentheses) as prefix for special positions
      const prefix = isSpecialPosition ? `(${posName}) ` : "";

      const deptName = filterDepartmentName(row.department?.name)
        || filterDepartmentName(row.department_name)
        || filterDepartmentName(row.outgoing_departments?.[0]?.name);

      const departmentDisplay = isSpecialPosition
        ? (prefix + (other || deptName || "-"))
        : (deptName || "-");

      // แปลงวันที่ให้เป็นรูปแบบไทยที่สอดคล้องกัน
      const formatDate = (date) => {
        if (!date) return "-";
        try {
          return new Date(date).toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
        } catch {
          return "-";
        }
      };

      return {
        ลำดับ: idx + 1,
        "ส่งหน่วยงาน(ครั้งที่ส่ง)": departmentDisplay,
        เรื่อง: row.issue || row.subject || "-",
        เลขที่หนังสือ: row.document_number || row.document_number || "-",
        ลงวันที่: formatDate(row.document_date),
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
      // "หน่วยงาน",
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => {
      // แปลงวันที่ให้เป็นรูปแบบไทยที่สอดคล้องกัน
      const formatDate = (date) => {
        if (!date) return "-";
        try {
          return new Date(date).toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
        } catch {
          return "-";
        }
      };

      return {
        ลำดับ: idx + 1,
        หน่วยงาน: filterDepartmentName(row.agency) || filterDepartmentName(row.department?.name) || "-",
        เลขที่หนังสือ: row.document_number || row.reference_number || "-",
        // ลงวันที่: ใช้ internal_register_date (ตามหน้า Detail/Edit)
        ลงวันที่: formatDate(row.internal_register_date || row.document_date),
        เรื่อง: row.issue || row.subject || "-",
        // วันรับงาน: ใช้ document_date (ตามหน้า Detail/Edit)
        วันรับงาน: formatDate(row.document_date),
        // วันที่เสนองาน: ใช้ present_to_director_date (ตามหน้า Detail/Edit)
        วันที่เสนองาน: formatDate(row.present_to_director_date),
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
      // "เลขคำร้อง (complaint_id)",
      "ผู้ตรวจฯ / ผู้ร้อง / หน่วยงานอื่น",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "เรื่อง",
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
      // แปลงวันที่ให้เป็นรูปแบบไทยที่สอดคล้องกัน
      const formatDate = (date) => {
        if (!date) return "-";
        try {
          return new Date(date).toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
        } catch {
          return "-";
        }
      };

      return {
      ลำดับ: idx + 1,
      // "เลขคำร้อง (complaint_id)": row.complaint_id || row.complaint?.id || "-",
      "ผู้ตรวจฯ / ผู้ร้อง / หน่วยงานอื่น":positionDisplay,
      เลขที่หนังสือ: row.document_number || row.reference_number || "-",
      ลงวันที่: formatDate(row.document_date),
      เรื่อง: row.issue || row.subject || "-",
      เอกสารแนบ:
        row.attachment_name ||
        (row.attachments && row.attachments.length > 0
          ? row.attachments.map((a) => a.file_name || a.name).join(", ")
          : "-"),
      การจัดการ: row.id,
      id: row.id,
      }
    },
    filter: (row) => row.status === "final_notify",
  },
];

// Add button handlers for each section (customize these to fit your actual create routes)
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

// Mapping section key -> delete endpoint path
const DELETE_ENDPOINT_BY_SECTION = {
  FORWARDED: (id) => `/outgoing-reports/${id}`,
  INITIAL_NOTIFY: (id) => `/outgoing-reports2/${id}`,
  REQUEST_UPDATE: (id) => `/outgoing-reports3/${id}`,
  FINAL_NOTIFY: (id) => `/outgoing-reports4/${id}`,
  AGENCY_REPORT: (id) => `/outgoing-reports5/${id}`,
};

const TableSection = ({
  section,
  headers,
  rows,
  rowMapper,
  onAdd,
  router,
  onOpenAttachments,
  handleManage,
  meta,
  onDelete,
  deletingMap = {},
}) => (
  <Box
    sx={{
      border: `1px solid ${SECTION_STYLES[section.key]?.border || '#E0E0E0'}`,
      borderRadius: 1,
      width: "100%",
      maxWidth: { sm: "auto" },
      background: SECTION_STYLES[section.key]?.boxBg || '#FFFFFF',
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
                  background: "#FAFAFA", // very light gray instead of white
                  fontWeight: "bold",
                  color: "#555555" // softer text color
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
                    '&:nth-of-type(odd)': {
                      backgroundColor: '#FBFBFB', // very light alternate row
                    },
                    '&:nth-of-type(even)': {
                      backgroundColor: '#FFFFFF', // white for even rows
                    },
                    '&:hover': {
                      backgroundColor: '#F0F0F0', // subtle hover effect
                    }
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
                              } else if (section.key === "FINAL_NOTIFY") {
                                // rowObj.id is the outgoing report4 id
                                if (rowObj.id) {
                                  handleManage(section.key, rowObj.id, router);
                                } else {
                                  console.error("Missing outgoing report4 id for FINAL_NOTIFY row");
                                }
                              } else {
                                // other sections use rowObj.id directly
                                if (rowObj.id) handleManage(section.key, rowObj.id, router);
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

// สีอิงแนวทางจาก TableListBox/ComplaintArchives
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
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3
    ? h.split('').map((c) => c + c).join('')
    : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
        background: "#B8C5D6", // softer blue-gray
        color: "#2F4F4F", // dark slate gray
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
            <TableCell align="center" sx={{ 
              background: "#FAFAFA", 
              fontWeight: "bold",
              color: "#555555"
            }}>
              ลำดับ
            </TableCell>
            <TableCell align="center" sx={{ 
              background: "#FAFAFA", 
              fontWeight: "bold",
              color: "#555555"
            }}>
              วันที่เปลี่ยนแปลง
            </TableCell>
            <TableCell align="center" sx={{ 
              background: "#FAFAFA", 
              fontWeight: "bold",
              color: "#555555"
            }}>
              ผู้เปลี่ยนแปลง
            </TableCell>
            <TableCell align="center" sx={{ 
              background: "#FAFAFA", 
              fontWeight: "bold",
              color: "#555555"
            }}>
              หมายเหตุ
            </TableCell>
            <TableCell align="center" sx={{ 
              background: "#FAFAFA", 
              fontWeight: "bold",
              color: "#555555"
            }}>
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
                  '&:nth-of-type(odd)': {
                    backgroundColor: '#FBFBFB',
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: '#FFFFFF',
                  },
                  '&:hover': {
                    backgroundColor: '#F0F0F0',
                  }
                }}
              >
                <TableCell align="center">{idx + 1}</TableCell>
                <TableCell align="center">
                  {new Date(item.changed_at).toLocaleString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell align="center">{item.changed_by_name || '-'}</TableCell>
                <TableCell align="center">{item.remark || '-'}</TableCell>
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

  // Preview modal state (PDF-like viewer)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [previewType, setPreviewType] = useState("image"); // 'image' | 'pdf' | 'gdoc' | 'text' | 'audio' | 'video'
  const [previewOriginalUrl, setPreviewOriginalUrl] = useState(""); // เก็บ URL ต้นฉบับสำหรับไฟล์ text (สำหรับดาวน์โหลด)
  const [previewZoom, setPreviewZoom] = useState(1);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [deleting, setDeleting] = useState({}); // {id: true}
  const [confirmDelete, setConfirmDelete] = useState(null); // { sectionKey, id }

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

    // Normalize path and preserve the server-provided uploads structure
    const normalizePath = (s) => {
      let v = String(s).replace(/\\\\/g, "/").replace(/\\/g, "/");
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
    const apiNoVer = apiBase.replace(/\/v\d+$/, ""); // ends with /api
    const origin = apiNoVer.replace(/\/api$/, "");

    if (normalized.startsWith("/api/")) {
      // Already includes /api prefix
      return `${origin}${normalized}`;
    }
    if (normalized.startsWith("/uploads/")) {
      // Prepend API root without version
      return `${apiNoVer}${normalized}`;
    }
    // Fallback
    return `${apiNoVer}${normalized}`;
  };

  // ฟังก์ชันดาวน์โหลดไฟล์ที่ปรับปรุงแล้ว
  const downloadFile = async (url, filename) => {
    if (!url) {
      console.error("No URL provided for download");
      return;
    }

    try {
      console.log("Downloading file:", { url, filename });
      
      // ลองวิธีต่างๆ ตามลำดับ
      
      // วิธีที่ 1: ใช้ fetch + blob (สำหรับไฟล์ที่มี CORS header)
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename || 'download';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          // ทำความสะอาด blob URL
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
          
          console.log("Download successful via fetch");
          return;
        }
      } catch (fetchError) {
        console.warn("Fetch download failed:", fetchError);
      }
      
      // วิธีที่ 2: ใช้ a element download attribute
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log("Download triggered via anchor element");
        return;
      } catch (anchorError) {
        console.warn("Anchor download failed:", anchorError);
      }
      
      // วิธีที่ 3: เปิดในแท็บใหม่ (fallback)
      window.open(url, '_blank', 'noopener,noreferrer');
      console.log("Opened in new tab as fallback");
      
    } catch (error) {
      console.error("Download failed:", error);
      // แสดงข้อความแจ้งเตือนให้ผู้ใช้
      alert("ไม่สามารถดาวน์โหลดไฟล์ได้ กรุณาคลิกขวาเลือก 'Save as' หรือลองใหม่อีกครั้ง");
    }
  };

  // ประเภทที่เปิดดูภายใน modal ได้ (inline)
  const INLINE_IMAGE = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"]; // svg treat as image
  const INLINE_TEXT = ["txt", "json", "md", "log", "csv"]; // csv simple text preview
  const INLINE_AUDIO = ["mp3", "wav", "ogg", "m4a", "aac"]; 
  const INLINE_VIDEO = ["mp4", "webm", "ogv", "mov", "mkv"]; 
  const OFFICE_DOC = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"]; // ใช้ Google Docs viewer

  const canPreview = (ext = "") => {
    const e = String(ext).toLowerCase();
    if (e === "pdf") return true;
    if (INLINE_IMAGE.includes(e)) return true;
    if (INLINE_TEXT.includes(e)) return true;
    if (INLINE_AUDIO.includes(e)) return true;
    if (INLINE_VIDEO.includes(e)) return true;
    if (OFFICE_DOC.includes(e)) return true; // ผ่าน Google Docs
    return false;
  };

  const openPreview = async (href, name, ext) => {
    if (!href) return;
    const e = (ext || "").toLowerCase();
    setPreviewName(name || "ไฟล์แนบ");
    setPreviewZoom(1);
    setPdfLoadError(false);
    setPreviewOriginalUrl(""); // รีเซ็ต URL ต้นฉบับ

    console.log("Opening preview:", { href, name, ext, type: e }); // Debug log

    // Text files: fetch content (limit size for safety)
    if (["txt", "json", "md", "log", "csv"].includes(e)) {
      setPreviewOriginalUrl(href); // เก็บ URL ต้นฉบับไว้สำหรับดาวน์โหลด
      try {
        const res = await fetch(href);
        const text = await res.text();
        // limit to first 200kb
        const limited = text.length > 200000 ? text.slice(0, 200000) + "\n... (ตัดบางส่วน)" : text;
        setPreviewSrc(limited);
        setPreviewType("text");
      } catch (err) {
        console.error("Preview text fetch error", err);
        setPreviewSrc("ไม่สามารถโหลดไฟล์ข้อความได้: " + err.message);
        setPreviewType("text");
      }
      setPreviewOpen(true);
      return;
    }

    if (["mp3", "wav", "ogg", "m4a", "aac"].includes(e)) {
      setPreviewSrc(href);
      setPreviewType("audio");
      setPreviewOpen(true);
      return;
    }
    if (["mp4", "webm", "ogv", "mov", "mkv"].includes(e)) {
      setPreviewSrc(href);
      setPreviewType("video");
      setPreviewOpen(true);
      return;
    }
    if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(e)) {
      // ใช้ Google Docs viewer (ต้องเป็นไฟล์ที่เข้าถึงสาธารณะได้)
      const encoded = encodeURIComponent(href);
      const gdoc = `https://docs.google.com/gview?embedded=1&url=${encoded}`;
      setPreviewSrc(gdoc);
      setPreviewType("gdoc");
      setPreviewOpen(true);
      return;
    }
    if (e === "pdf") {
      // ลองหลายวิธีสำหรับ PDF
      // 1. ใช้ PDF.js viewer ของ Mozilla (ถ้ามี)
      // 2. ใช้ Google Docs viewer
      // 3. เปิดในแท็บใหม่
      
      // ลอง PDF.js viewer ก่อน (มาพร้อม browser ส่วนใหญ่)
      const pdfJsUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(href)}`;
      setPreviewSrc(pdfJsUrl);
      setPreviewType("pdfjs");
      setPreviewOpen(true);
      return;
    }
    // default image
    setPreviewSrc(href);
    setPreviewType("image");
    setPreviewOpen(true);
  };

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
          // อาจเก็บใน type5 เช่นกัน หรือมีเฉพาะใน rowRaw
          files = rowRaw?.attachments || findById(out?.type5, rowDisplay?.id)?.attachments || [];
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

  const allRelated = documentData?.relationships?.all_related || [];

  // Navigate to the complaint whose complaint_number matches the clicked
  // complaint_number or parent_complaint_number. We first try to resolve the
  // internal id from allRelated (so API keeps using numeric/UUID ids). If we
  // can't find it, fall back to pushing the raw number as id (in case the API
  // accepts that form).
  const navigateToComplaint = (targetComplaintNumber) => {
    if (!targetComplaintNumber || targetComplaintNumber === '-') return;
    const target = allRelated.find(
      (r) => r?.complaint_number === targetComplaintNumber
    );
    const targetId = target?.id || targetComplaintNumber;
    // Avoid pushing duplicate navigation
    if (targetId && targetId !== router.query.id) {
      router.push({ pathname: router.pathname, query: { id: targetId } });
    }
  };

  // ให้เลือกเลข สรร. ที่น่าเชื่อถือที่สุด: จาก master ก่อน, รองลงมา all_related แถวแรก, สุดท้ายจาก detail
  const baseComplaintNumber =
    allRelated.find((it) => it?.is_master)?.complaint_number ||
    documentData?.relationships?.master_complaint?.complaint_number ||
    allRelated?.[0]?.complaint_number ||
    documentData?.detail?.complaintNumber ||
    "";

  // ข้อมูล all_related สำหรับตารางรับเรื่องราวร้องทุกข์
  // const allRelated = documentData?.relationships?.all_related || [];
  const receivedSection = sectionConfigs[0];
  const receivedHeaders = receivedSection.headers;
  const receivedRowMapper = receivedSection.rowMapper;
  const receivedRows = allRelated.map((r, idx) => ({
    ...r,
    // Derive agency string: prefer explicit string else nested object name
    agency: typeof r.agency === 'string' && r.agency
      ? r.agency
      : r.agency?.name || r.agency?.agency_name || '-',
    subject: r.subject || r.issue || '-',
    complaint_type: r.complaint_type || r.complaint_type_data || undefined,
  }));

  // Override RECEIVED section rowMapper to use normalized shape (receivedRows)
  sectionConfigs[0].rowMapper = (row, idx) => ({
    ลำดับ: idx + 1,
    หน่วยงาน: row.agency || '-',
    'เลข สรร.': row.complaint_number || '-',
    'เลขที่อ้างอิง(เลขสรร.สารบัญ)': row.parent_complaint_number || '-',
    เรื่อง: row.subject || '-',
    ประเภทเรื่อง: row.complaint_type?.name || row.complaint_type?.complaint_type_name || '-',
    เอกสารหลัก: row.is_master ? '✅' : '-',
    เอกสารปัจจุบัน: row.is_current ? '✅' : '-',
    เอกสารแนบ: row.attachments && row.attachments.length > 0 ? row.attachments.map(a => a.file_name || a.name).join(', ') : '-',
    การจัดการ: row.id,
    id: row.id,
  });

  // outgoing_reports types
  const outgoing_reports = documentData?.outgoing_reports || {};

  // FORWARDED
  const forwardedSection = sectionConfigs[1];
  const forwardedHeaders = forwardedSection.headers;
  const forwardedRowMapper = forwardedSection.rowMapper;
  const outgoingType1 = outgoing_reports.type1 || [];
  const forwardedExtra = outgoingType1.map((item, idx) => ({
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
    // เรียงตามวันที่หนังสือล่าสุดก่อน (descending)
    const dateA = new Date(a.document_date || 0);
    const dateB = new Date(b.document_date || 0);
    return dateB - dateA;
  });

  // INITIAL_NOTIFY (type2)
  const initialNotifySection = sectionConfigs[2];
  const initialNotifyHeaders = initialNotifySection.headers;
  const initialNotifyRowMapper = initialNotifySection.rowMapper;
  const outgoingType2 = outgoing_reports.type2 || [];
  const initialNotifyExtra = outgoingType2.map((item, idx) => ({
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
    // เรียงตามวันที่ล่าสุดก่อน (descending)
    const dateA = new Date(a.document_date || a.complaint_number_date || 0);
    const dateB = new Date(b.document_date || b.complaint_number_date || 0);
    return dateB - dateA;
  });

  // REQUEST_UPDATE (type3)
  const requestUpdateSection = sectionConfigs[3];
  const requestUpdateHeaders = requestUpdateSection.headers;
  const requestUpdateRowMapper = requestUpdateSection.rowMapper;
  const outgoingType3 = outgoing_reports.type3 || [];
  const requestUpdateExtra = outgoingType3.map((item, idx) => ({
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
    // เรียงตามวันที่ล่าสุดก่อน (descending)
    const dateA = new Date(a.document_date || 0);
    const dateB = new Date(b.document_date || 0);
    return dateB - dateA;
  });
  
// AGENCY_REPORT (เปลี่ยนมาใช้ outgoing5)
const agencyReportSection = sectionConfigs[4];
const agencyReportHeaders = agencyReportSection.headers;
const agencyReportRowMapper = agencyReportSection.rowMapper;
const outgoingType5 = outgoing_reports.type5 || [];
const agencyReportRows = outgoingType5.map((item) => ({
 ...item,
  document_number: item.document_number || item.reference_number || "-",
  // ลงวันที่: ใช้ internal_register_date (หรือ fallback เป็น document_date)
  document_date: formatDate(item.internal_register_date || item.document_date),
  // วันรับงาน: ใช้ document_date
  reference_date: formatDate(item.document_date),
  issue: item.subject || "-",
  // วันที่เสนองาน: ใช้ present_to_director_date
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
    // เรียงตามวันที่หนังสือล่าสุดก่อน (descending) - ใช้ internal_register_date
    const dateA = new Date(a.internal_register_date || a.document_date || 0);
    const dateB = new Date(b.internal_register_date || b.document_date || 0);
    return dateB - dateA;
  });

  // FINAL_NOTIFY (เปลี่ยนมาใช้ outgoing4)
  const finalSection = sectionConfigs.find((s) => s.key === "FINAL_NOTIFY");
  const finalHeaders = finalSection.headers;
  const finalRowMapper = finalSection.rowMapper;
  const outgoingType4 = outgoing_reports.type4 || [];
  const finalNotifyExtra = outgoingType4.map((item, idx) => ({
    ...item,
    agency: filterDepartmentName(item.department?.name) || "-",
    complaint_id: item.complaint_id || id,
    document_number: item.document_number || item.reference_number || "-",
    receiveDate: formatDate(item.receive_date || item.document_date || item.reference_date),
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
    // เรียงตามวันที่ล่าสุดก่อน (descending)
    const dateA = new Date(a.receive_date || a.document_date || a.reference_date || 0);
    const dateB = new Date(b.receive_date || b.document_date || b.reference_date || 0);
    return dateB - dateA;
  });

  // ================= Position Name Mapping (เฉพาะ FINAL_NOTIFY) =================
  const [positionMap, setPositionMap] = useState({}); // { position_id: name }
  const [positionLoading, setPositionLoading] = useState(false);

  useEffect(() => {
    // รวบรวม position_id ที่ยังไม่มีชื่อ (backend ส่ง position_name เป็น null)
    if (!finalNotifyRows || finalNotifyRows.length === 0) return;
    const missing = new Set();
    finalNotifyRows.forEach((r) => {
      const pid = r.position_id || r.positionId || r.position?.id;
      const hasName = r.position?.name || r.position_name || positionMap[pid];
      if (pid && !hasName) {
        missing.add(pid);
      }
    });
    if (missing.size === 0) return; // ไม่มีอะไรต้องโหลด

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

  // เติมชื่อที่ map ได้เข้าไป (ไม่ mutate ของเดิม)
  const enrichedFinalNotifyRows = finalNotifyRows.map((r) => {
    const pid = r.position_id || r.positionId || r.position?.id;
    if (pid && !r.position_name && !(r.position && r.position.name) && positionMap[pid]) {
      return { ...r, position_name: positionMap[pid] };
    }
    return r;
  });
  // ============================================================================

  const handleImageClick = () => {
    router.push("/complaint/");
  };

  const complaintMeta = {
    complaintId: id,
    complaintNumber:
      documentData?.detail?.complaintNumber ||
      documentData?.relationships?.master_complaint?.complaint_number ||
      documentData?.relationships?.all_related?.[0]?.complaint_number ||
      "",
    createdAt: documentData?.detail?.created_at || "",
  };

  // เรียกเมื่อกดปุ่มลบ (ยังไม่ลบจริง แค่เปิด dialog)
  const handleRequestDelete = (sectionKey, delId) => {
    if (!sectionKey || !delId) return;
    setConfirmDelete({ sectionKey, id: delId });
  };

  // ลบจริงเมื่อกดยืนยันใน dialog
  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { sectionKey, id: delId } = confirmDelete;
    const build = DELETE_ENDPOINT_BY_SECTION[sectionKey];
    if (!build) return;
    setDeleting((p) => ({ ...p, [delId]: true }));
    try {
      const endpoint = build(delId);
      await axiosInstance.delete(endpoint);
      await fetchDocumentData(complaintMeta.complaintId);
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

  const getSectionTitle = (key) => sectionConfigs.find((s) => s.key === key)?.title || key;

  return (
    <Box>
      <BreadcrumbsService items={breadcrumbItems} />

      <Box
        sx={{
          background: "linear-gradient(to right, #1223a5, #2499ff)",
          height: 50,
          borderTopRightRadius: "12px",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      ></Box>

      <Box
        sx={{
          background: "#E8F5E9",
          border: "1px solid #A5D6A7",
          borderRadius: 1,
          py: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          mb: 2,
        }}
      >
        <Typography mx={3}>
          เจ้าหน้าที่ผู้รับผิดชอบ:{" "}
          {documentData?.detail?.assigned_officer?.name ||
            documentData?.detail?.responsibleOfficer ||
            "ไม่ระบุ"}
        </Typography>
        {/* <IconButton
          size="small"
          onClick={() => handleOpenDocument("เอกสารเจ้าหน้าที่")}
          sx={{
            mx: 3,
            color: "#1120A3",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.04)",
            },
          }}
        >
          <FolderIcon />
        </IconButton> */}
      </Box>

      <Box
        sx={{
          background: "#FBEAE9",
          border: "1px solid #F8BBD0",
          borderRadius: 1,
          py: 1.5,
          width: "100%",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          mb: 2,
        }}
      >
        <Typography mx={3}>
          ชื่อผู้ร้อง:{" "}
          {documentData?.detail?.claimantName ||
            documentData?.detail?.complainant?.name ||
            "ไม่ระบุ"}
        </Typography>
      </Box>

      {/* ขั้นตอนอยู่ระหว่างดำเนินการ (แสดงตาม detail.status) */}
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

      {/* "รับเรื่องราวร้องทุกข์" */}
      <Box
        sx={{
          border: "1px solid #E0E0E0",
          borderRadius: 1,
          width: "100%",
          maxWidth: { sm: "auto" },
          mb: 2,
        }}
      >
        <Box sx={{ background: "#F0F8FF", py: 1.5 }}> {/* softer blue background */}
          <Typography mx={3} sx={{ fontWeight: "bold", color: "#2F4F4F" }}> {/* softer text color */}
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
                      color: "#555555"
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
                  const rowObj = receivedRowMapper(row, idx);
                  return (
                    <TableRow 
                      key={rowObj.id || idx}
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: '#FBFBFB',
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: '#FFFFFF',
                        },
                        '&:hover': {
                          backgroundColor: '#F0F0F0',
                        }
                      }}
                    >
                      {receivedHeaders.map((h) => {
      if (h === "เอกสารแนบ") {
                          return (
                            <TableCell key={h} align="center">
                              <IconButton
                                size="small"
        onClick={() => openAttachments("RECEIVED", row, rowObj)}
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
                                    console.error(
                                      "Error: ID is missing for this row."
                                    );
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

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* ส่งหน่วยงานที่เกี่ยวข้อง */}
          <TableSection
            section={forwardedSection}
            headers={forwardedHeaders}
            rows={forwardedFilteredRows}
            rowMapper={forwardedRowMapper}
            onAdd={() =>
              addButtonHandlers.FORWARDED(
                router,
                id,
                documentData?.detail?.complaintNumber ||
                  documentData?.relationships?.master_complaint
                    ?.complaint_number ||
                  documentData?.relationships?.all_related?.[0]
                    ?.complaint_number ||
                  "",
                documentData?.detail?.created_at || ""
              )
            }
            router={router}
            onOpenAttachments={openAttachments}
            handleManage={handleManage}
            meta={complaintMeta}
            onDelete={(sectionKey, rowId) => handleRequestDelete(sectionKey, rowId)}
            deletingMap={deleting}
          />
          {/* แจ้งผู้ร้องเรียนส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น */}
          <TableSection
            section={initialNotifySection}
            headers={initialNotifyHeaders}
            rows={initialNotifyRows}
            rowMapper={initialNotifyRowMapper}
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
            router={router}
            onOpenAttachments={openAttachments}
            handleManage={handleManage}
            meta={complaintMeta}
            onDelete={(sectionKey, rowId) => handleRequestDelete(sectionKey, rowId)}
            deletingMap={deleting}
          />
          {/* ขอทราบผลการพิจารณา / ผลความคืบหน้า */}
          <TableSection
            section={requestUpdateSection}
            headers={requestUpdateHeaders}
            rows={requestUpdateRows}
            rowMapper={requestUpdateRowMapper}
            onAdd={() =>
              addButtonHandlers.REQUEST_UPDATE(
                router,
                id,
                documentData?.detail?.complaintNumber ||
                  documentData?.relationships?.master_complaint
                    ?.complaint_number ||
                  documentData?.relationships?.all_related?.[0]
                    ?.complaint_number ||
                  ""
              )
            }
            router={router}
            onOpenAttachments={openAttachments}
            handleManage={handleManage}
            meta={complaintMeta}
            onDelete={(sectionKey, rowId) => handleRequestDelete(sectionKey, rowId)}
            deletingMap={deleting}
          />
          {/* หนังสือแจ้งผลพิจารณาหน่วยงาน */}
          <TableSection
            section={agencyReportSection}
            headers={agencyReportHeaders}
            rows={agencyReportRowsSorted}
            rowMapper={agencyReportRowMapper}
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
            router={router}
            onOpenAttachments={openAttachments}
            handleManage={handleManage}
            meta={complaintMeta}
            onDelete={(sectionKey, rowId) => handleRequestDelete(sectionKey, rowId)}
            deletingMap={deleting}
          />
          {/* แจ้งผลการให้ผู้เกี่ยวข้องทราบ */}
          <TableSection
            section={finalSection}
            headers={finalHeaders}
            rows={enrichedFinalNotifyRows}
            rowMapper={finalRowMapper}
            onAdd={() =>
              addButtonHandlers.FINAL_NOTIFY(
                router,
                id,
                documentData?.detail?.complaintNumber ||
                  documentData?.relationships?.master_complaint
                    ?.complaint_number ||
                  documentData?.relationships?.all_related?.[0]
                    ?.complaint_number ||
                  ""
              )
            }
            router={router}
            onOpenAttachments={openAttachments}
            handleManage={handleManage}
            meta={complaintMeta}
            onDelete={(sectionKey, rowId) => handleRequestDelete(sectionKey, rowId)}
            deletingMap={deleting}
          />
          {/* แสดงสถานะโหลดตำแหน่ง (optional UX สามารถถอดออกได้) */}
          {positionLoading && (
            <Typography variant="caption" sx={{ ml: 2, color: "#666" }}>
              กำลังโหลดข้อมูลตำแหน่งเพิ่มเติม...
            </Typography>
          )}

          {/* Section: ประวัติการเปลี่ยนสถานะ */}
          {documentData?.detail?.status_history?.length > 0 && (
            <StatusHistorySection
              statusHistory={documentData.detail.status_history}
            />
          )}
        </>
      )}

      {/* Attachments Modal */}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                      {href && canPreview(ext) ? (
                        <MuiLink component="button" type="button" underline="hover" onClick={() => openPreview(href, name, ext)} sx={{ textAlign: 'left', flexGrow: 1 }}>
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
                          <IconButton size="small" onClick={() => window.open(href, '_blank', 'noreferrer')}>
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

      {/* PDF-like preview modal */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullScreen>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1e1e1e' }}>
          {/* Toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, bgcolor: '#2c2c2c', color: '#fff' }}>
            <IconButton color="inherit" onClick={() => setPreviewOpen(false)}>
              <CloseIcon sx={{ color: '#fff' }} />
            </IconButton>
            <Typography sx={{ flexGrow: 1 }} noWrap title={previewName}>{previewName}</Typography>
            {previewType === 'image' && (
              <>
                <IconButton color="inherit" onClick={() => setPreviewZoom((z) => Math.max(0.25, parseFloat((z - 0.1).toFixed(2))))}>
                  <ZoomOutIcon sx={{ color: '#fff' }} />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 48, textAlign: 'center' }}>{Math.round(previewZoom * 100)}%</Typography>
                <IconButton color="inherit" onClick={() => setPreviewZoom((z) => Math.min(4, parseFloat((z + 0.1).toFixed(2))))}>
                  <ZoomInIcon sx={{ color: '#fff' }} />
                </IconButton>
              </>
            )}
            <IconButton color="inherit" onClick={() => downloadFile(previewType === 'text' && previewOriginalUrl ? previewOriginalUrl : previewSrc, previewName)}>
              <DownloadIcon sx={{ color: '#fff' }} />
            </IconButton>
            <IconButton color="inherit" onClick={() => window.open(previewType === 'text' && previewOriginalUrl ? previewOriginalUrl : previewSrc, '_blank', 'noreferrer') }>
              <OpenInNewIcon sx={{ color: '#fff' }} />
            </IconButton>
          </Box>

          {/* Content area */}
          <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            {previewType === 'pdfjs' && (
              <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <iframe 
                  title={previewName} 
                  src={previewSrc} 
                  style={{ border: 'none', width: '100%', height: '100%' }}
                  onError={() => {
                    console.error("PDF.js viewer failed, trying Google Docs viewer");
                    const encoded = encodeURIComponent(previewSrc.split('file=')[1] || '');
                    setPreviewSrc(`https://docs.google.com/gview?embedded=1&url=${encoded}`);
                    setPreviewType("gdoc");
                  }}
                />
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 16, 
                  right: 16,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  p: 1,
                  borderRadius: 1,
                  fontSize: '0.8rem'
                }}>
                  PDF.js Viewer
                </Box>
              </Box>
            )}
            {previewType === 'pdf' && (
              <Box sx={{ width: '100%', height: '100%', bgcolor: '#1e1e1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', height: '100%', bgcolor: '#1e1e1e', position: 'relative' }}>
                  <iframe
                    title={previewName}
                    src={previewSrc + (previewSrc.includes('#') ? '' : '#toolbar=0')}
                    style={{ border: 'none', width: '100%', height: '100%' }}
                    onLoad={(e) => {
                      // Check if iframe loaded successfully
                      try {
                        const iframe = e.target;
                        setTimeout(() => {
                          try {
                            const doc = iframe.contentDocument || iframe.contentWindow.document;
                            if (!doc || doc.body.innerHTML.includes('error') || doc.body.innerHTML.trim() === '') {
                              setPdfLoadError(true);
                            }
                          } catch (err) {
                            console.log("PDF iframe access error (may be CORS):", err);
                            // This is normal for cross-origin iframes
                          }
                        }, 2000);
                      } catch (err) {
                        console.error("PDF load check error:", err);
                        setPdfLoadError(true);
                      }
                    }}
                    onError={() => setPdfLoadError(true)}
                  />
                  {pdfLoadError && (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      color: '#fff',
                      bgcolor: 'rgba(0,0,0,0.8)',
                      p: 3,
                      borderRadius: 1,
                      '& button': { mt: 1, mr: 1, bgcolor: '#1976d2', color: '#fff', '&:hover': { bgcolor: '#1565c0' } }
                    }}>
                      <Typography variant="h6" gutterBottom>ไม่สามารถแสดง PDF ได้</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>ลองเปิดด้วยวิธีอื่นหรือดาวน์โหลดไฟล์</Typography>
                      <Button variant="contained" onClick={() => downloadFile(previewSrc, previewName)}>
                        ดาวน์โหลดไฟล์
                      </Button>
                      <Button variant="contained" onClick={() => window.open(previewSrc, '_blank')}>
                        เปิดในแท็บใหม่
                      </Button>
                      <Button variant="contained" onClick={() => {
                        const encoded = encodeURIComponent(previewSrc);
                        window.open(`https://docs.google.com/gview?url=${encoded}`, '_blank');
                      }}>
                        เปิดใน Google Docs
                      </Button>
                      <Button variant="contained" onClick={() => {
                        const pdfJsUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(previewSrc)}`;
                        window.open(pdfJsUrl, '_blank');
                      }}>
                        เปิดใน PDF.js
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            {previewType === 'gdoc' && (
              <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <iframe 
                  title={previewName} 
                  src={previewSrc} 
                  style={{ border: 'none', width: '100%', height: '100%' }}
                  onError={() => {
                    console.error("Google Docs viewer failed for:", previewSrc);
                  }}
                />
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 16, 
                  right: 16,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  p: 1,
                  borderRadius: 1,
                  fontSize: '0.8rem'
                }}>
                  Google Docs Viewer
                </Box>
              </Box>
            )}
            {previewType === 'image' && (
              <Box sx={{ bgcolor: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Box sx={{ bgcolor: '#ffffff', boxShadow: 3, p: 2 }}>
                  <Box sx={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left' }}>
                    <img 
                      src={previewSrc} 
                      alt={previewName} 
                      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'block';
                      }}
                    />
                    <Box sx={{ display: 'none', textAlign: 'center', p: 4, color: '#666' }}>
                      <Typography>ไม่สามารถโหลดรูปภาพได้</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>URL: {previewSrc}</Typography>
                      <Button variant="outlined" onClick={() => downloadFile(previewSrc, previewName)} sx={{ mt: 1, mr: 1 }}>
                        ดาวน์โหลดไฟล์
                      </Button>
                      <Button variant="outlined" onClick={() => window.open(previewSrc, '_blank')} sx={{ mt: 1 }}>
                        เปิดในแท็บใหม่
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
            {previewType === 'text' && (
              <Box sx={{ width: '100%', height: '100%', bgcolor: '#121212', color: '#e0e0e0', p: 2, fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflow: 'auto', fontSize: '14px', lineHeight: 1.5 }}>
                {previewSrc}
              </Box>
            )}
            {previewType === 'audio' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <audio controls src={previewSrc} style={{ width: '100%', maxWidth: '500px' }} onError={() => {
                  console.error("Audio load error:", previewSrc);
                }} />
                <Typography color="#fff">{previewName}</Typography>
                <Typography variant="body2" color="#aaa">URL: {previewSrc}</Typography>
                <Button variant="outlined" onClick={() => downloadFile(previewSrc, previewName)} sx={{ color: '#fff', borderColor: '#fff', '&:hover': { borderColor: '#aaa' } }}>
                  ดาวน์โหลดไฟล์เสียง
                </Button>
              </Box>
            )}
            {previewType === 'video' && (
              <Box sx={{ width: '100%', maxWidth: 960 }}>
                <video 
                  controls 
                  src={previewSrc} 
                  style={{ width: '100%', maxHeight: '80vh' }}
                  onError={() => {
                    console.error("Video load error:", previewSrc);
                  }}
                />
                <Typography color="#fff" align="center" mt={1}>{previewName}</Typography>
                <Typography variant="body2" color="#aaa" align="center">URL: {previewSrc}</Typography>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button variant="outlined" onClick={() => downloadFile(previewSrc, previewName)} sx={{ color: '#fff', borderColor: '#fff', '&:hover': { borderColor: '#aaa' } }}>
                    ดาวน์โหลดไฟล์วิดีโอ
                  </Button>
                </Box>
              </Box>
            )}
            {!['pdf','pdfjs','gdoc','image','text','audio','video'].includes(previewType) && (
              <Box sx={{ textAlign: 'center', color: '#fff' }}>
                <Typography variant="h6" gutterBottom>ไม่สามารถพรีวิวไฟล์นี้ได้</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>ประเภท: {previewType}</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>URL: {previewSrc}</Typography>
                <Button variant="contained" onClick={() => downloadFile(previewSrc, previewName)} sx={{ mr: 1 }}>
                  ดาวน์โหลดไฟล์
                </Button>
                <Button variant="contained" onClick={() => window.open(previewSrc, '_blank')}>
                  เปิดในแท็บใหม่
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => !Object.keys(deleting).some(k => deleting[k]) && setConfirmDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg,#fafbfd,#f4f8fb)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            fontWeight: 'bold',
            fontSize: 18,
            pb: 1,
            color: '#b71c1c'
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              color: '#d32f2f'
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
            borderColor: '#e3e8ee',
            background: 'transparent'
          }}
        >
          <Typography sx={{ mb: 1.5, fontSize: 15, color: '#37474f' }}>
            คุณต้องการลบข้อมูลนี้หรือไม่? การลบจะไม่สามารถย้อนกลับได้
          </Typography>
          {confirmDelete && (
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2,
                background: '#fff',
                border: '1px solid #f5c2c7',
                mb: 2,
                fontSize: 13.5,
                color: '#5d4037'
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                <b>ประเภท:</b> {getSectionTitle(confirmDelete.sectionKey)}<br />
                <b>ID:</b> {confirmDelete.id}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setConfirmDelete(null)}
              disabled={confirmDelete && deleting[confirmDelete.id]}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                borderColor: '#90a4ae',
                color: '#455a64',
                '&:hover': { borderColor: '#607d8b', background: 'rgba(96,125,139,0.06)' }
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
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                fontWeight: 600,
                bgcolor: '#d32f2f',
                boxShadow: '0 2px 6px rgba(211,47,47,0.4)',
                '&:hover': { bgcolor: '#c62828' }
              }}
            >
              {confirmDelete && deleting[confirmDelete.id] ? 'กำลังลบ...' : 'ลบข้อมูล'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FollowComp;
