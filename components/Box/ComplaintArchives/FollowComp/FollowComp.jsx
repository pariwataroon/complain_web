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
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import FolderIcon from "@mui/icons-material/Folder";
import { getDocumentStorageByComplaintId } from "@pages/api/document/document";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

// 1. Define English-status constants
const STATUS = {
  RECEIVED: 1,
  FORWARDED: 2,
  INITIAL_NOTIFY: 3,
  REQUEST_UPDATE: 4,
  AGENCY_REPORT: 5,
  FINAL_NOTIFY: 6,
};

// Section color themes to improve visual separation
const SECTION_STYLES = {
  RECEIVED: {
    boxBg: "#E3F2FD", // light blue
    headerBg: "#1565C0",
    headerColor: "#ffffff",
    border: "#90CAF9",
  },
  FORWARDED: {
    boxBg: "#E0F7FA", // light cyan
    headerBg: "#00838F",
    headerColor: "#ffffff",
    border: "#80DEEA",
  },
  INITIAL_NOTIFY: {
    boxBg: "#FFF8E1", // light amber
    headerBg: "#FF8F00",
    headerColor: "#1A1A1A",
    border: "#FFE082",
  },
  REQUEST_UPDATE: {
    boxBg: "#FFF3E0", // light orange
    headerBg: "#EF6C00",
    headerColor: "#1A1A1A",
    border: "#FFCC80",
  },
  AGENCY_REPORT: {
    boxBg: "#F3E5F5", // light purple
    headerBg: "#6A1B9A",
    headerColor: "#ffffff",
    border: "#CE93D8",
  },
  FINAL_NOTIFY: {
    boxBg: "#E8F5E9", // light green
    headerBg: "#2E7D32",
    headerColor: "#ffffff",
    border: "#A5D6A7",
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
      router.push({
        pathname: `/admin/edit/request-result-or-progress/${id}`,
        query: {
          complaint_id: complaintId || "",
          complaint_number: complaintNumber || "",
          created_at: createdAt || "",
        },
      });
      break;
    case "AGENCY_REPORT":
      router.push({
        pathname: `/admin/edit/report/${id}`,
        query: {
          complaint_id: complaintId || "",
          complaint_number: complaintNumber || "",
          created_at: createdAt || "",
        },
      });
      break;
    case "FINAL_NOTIFY":
      router.push({
        pathname: `/admin/edit/inform-related-parties/${id}`,
        query: {
          complaint_id: complaintId || "",
          complaint_number: complaintNumber || "",
          created_at: createdAt || "",
        },
      });
      break;
    default:
      break;
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
      หน่วยงาน: row.outgoing_departments?.[0]?.name || "-",
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
    rowMapper: (row, idx) => ({
      ลำดับ: idx + 1,
      "หน่วยงาน(ครั้งที่ส่ง)": row.agency || "-",
      เรื่อง: row.issue || row.subject || "-",
      เลขที่หนังสือ: row.document_number || "-",
      ลงวันที่: row.document_date || "-",
      ผู้ลงนาม:
        row.signer ||
        (row.signature_authority_user && row.signature_authority_user.name) ||
        "-",
      เอกสารแนบ: row.attachment_name || "-",
      การจัดการ: row.id,
      id: row.id,
    }),
    filter: (row) =>
      row.status === "sent_to_agency" || row.status === "forwarded",
  },
  {
    key: "INITIAL_NOTIFY",
    status: STATUS.INITIAL_NOTIFY,
    title: "แจ้งผู้ร้องเรียนส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น",
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
    rowMapper: (row, idx) => ({
      ลำดับ: idx + 1,
      "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)":
        row.agency || row.department?.name || "-",
      เลขที่หนังสือ: row.document_number || row.reference_number || "-",
      ลงวันที่:
        row.receiveDate ||
        row.complaint_number_date ||
        row.reference_date ||
        "-",
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
    }),
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
    rowMapper: (row, idx) => ({
      ลำดับ: idx + 1,
      "ส่งหน่วยงาน(ครั้งที่ส่ง)": row.agency || "-",
      เรื่อง: row.issue || row.subject || "-",
      เลขที่หนังสือ: row.document_number || row.document_number || "-",
      ลงวันที่: row.document_date || row.document_date || "-",
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
    }),
    filter: (row) => row.status === "request_update",
  },
  {
    key: "AGENCY_REPORT",
    status: STATUS.AGENCY_REPORT,
    title: "หนังสือแจ้งผลพิจารณาหน่วยงาน",
    headers: [
      "ลำดับ",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "เรื่อง",
      "วันรับงาน",
      "วันที่เสนองาน",
      "หน่วยงาน",
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => ({
      ลำดับ: idx + 1,
      เลขที่หนังสือ: row.document_number || row.reference_number || "-",
      ลงวันที่: row.receiveDate || row.reference_date || "-",
      เรื่อง: row.issue || row.subject || "-",
      วันรับงาน: row.reference_date || "-",
      วันที่เสนองาน: row.created_at || "-",
      หน่วยงาน: row.agency || row.department?.name || "-",
      เอกสารแนบ:
        row.attachment_name ||
        (row.attachments && row.attachments.length > 0
          ? row.attachments.map((a) => a.file_name || a.name).join(", ")
          : "-"),
      การจัดการ: row.id,
      id: row.id,
    }),
    filter: (row) => row.status === "agency_report",
  },
  {
    key: "FINAL_NOTIFY",
    status: STATUS.FINAL_NOTIFY,
    title: "แจ้งผลการให้ผู้เกี่ยวข้องทราบ",
    headers: [
      "ลำดับ",
      // "เลขคำร้อง (complaint_id)",
      "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)",
      "เลขที่หนังสือ",
      "เรื่อง",
      "ลงวันที่",
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => ({
      ลำดับ: idx + 1,
      // "เลขคำร้อง (complaint_id)": row.complaint_id || row.complaint?.id || "-",
      "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)":
        row.agency || row.department?.name || "-",
      เลขที่หนังสือ: row.document_number || row.reference_number || "-",
      เรื่อง: row.issue || row.subject || "-",
      ลงวันที่: row.receiveDate || row.reference_date || "-",
      เอกสารแนบ:
        row.attachment_name ||
        (row.attachments && row.attachments.length > 0
          ? row.attachments.map((a) => a.file_name || a.name).join(", ")
          : "-"),
      การจัดการ: row.id,
      id: row.id,
    }),
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
                sx={{ background: "#fff", fontWeight: "bold" }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} align="center">
                ไม่พบข้อมูล
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => {
              const rowObj = rowMapper(row, idx);
              return (
                <TableRow key={rowObj.id || idx}>
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
        background: "#1223A5",
        color: "#ffffff",
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
            <TableCell align="center" sx={{ background: "#fff", fontWeight: "bold" }}>
              ลำดับ
            </TableCell>
            <TableCell align="center" sx={{ background: "#fff", fontWeight: "bold" }}>
              วันที่เปลี่ยนแปลง
            </TableCell>
            <TableCell align="center" sx={{ background: "#fff", fontWeight: "bold" }}>
              ผู้เปลี่ยนแปลง
            </TableCell>
            <TableCell align="center" sx={{ background: "#fff", fontWeight: "bold" }}>
              หมายเหตุ
            </TableCell>
            <TableCell align="center" sx={{ background: "#fff", fontWeight: "bold" }}>
              สถานะ
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {statusHistory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                ไม่พบประวัติการเปลี่ยนสถานะ
              </TableCell>
            </TableRow>
          ) : (
            statusHistory.map((item, idx) => (
              <TableRow key={idx}>
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
  const [previewType, setPreviewType] = useState("image"); // 'image' | 'pdf'
  const [previewZoom, setPreviewZoom] = useState(1);

  const getFileExt = (filename = "") => filename.split(".").pop()?.toLowerCase() || "";
  const getFileIcon = (ext) => {
    if (ext === "pdf") return <PictureAsPdfIcon sx={{ color: "#d32f2f" }} />;
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return <ImageIcon sx={{ color: "#1976d2" }} />;
    return <DescriptionIcon sx={{ color: "#757575" }} />;
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

  const canPreview = (ext = "") => {
    const e = String(ext).toLowerCase();
    if (["pdf"].includes(e)) return true;
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(e)) return true;
    return false;
  };

  const openPreview = (href, name, ext) => {
    if (!href) return;
    setPreviewSrc(href);
    setPreviewName(name || "ไฟล์แนบ");
    const e = (ext || "").toLowerCase();
    setPreviewType(e === "pdf" ? "pdf" : "image");
    setPreviewZoom(1);
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
          title = `เอกสารแนบ - หนังสือแจ้งผลพิจารณาหน่วยงาน`;
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
  const receivedRows = allRelated;

  // outgoing_reports types
  const outgoing_reports = documentData?.outgoing_reports || {};

  // FORWARDED
  const forwardedSection = sectionConfigs[1];
  const forwardedHeaders = forwardedSection.headers;
  const forwardedRowMapper = forwardedSection.rowMapper;
  const outgoingType1 = outgoing_reports.type1 || [];
  const forwardedExtra = outgoingType1.map((item, idx) => ({
    ...item,
    agency: item.department?.name || "-",
    issue: item.subject || "-",
    document_number: item.document_number || "-",
    document_date: item.document_date
      ? new Date(item.document_date).toLocaleDateString("th-TH")
      : "-",
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
  ];

  // INITIAL_NOTIFY (type2)
  const initialNotifySection = sectionConfigs[2];
  const initialNotifyHeaders = initialNotifySection.headers;
  const initialNotifyRowMapper = initialNotifySection.rowMapper;
  const outgoingType2 = outgoing_reports.type2 || [];
  const initialNotifyExtra = outgoingType2.map((item, idx) => ({
    ...item,
    department: item.department,
    agency: item.department?.name || "-",
    reference_number: item.reference_number || "-",
    complaint_number_date: item.complaint_number_date
      ? new Date(item.complaint_number_date).toLocaleDateString("th-TH")
      : "-",
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
  const initialNotifyRows = [...initialItems, ...initialNotifyExtra];

  // REQUEST_UPDATE (type3)
  const requestUpdateSection = sectionConfigs[3];
  const requestUpdateHeaders = requestUpdateSection.headers;
  const requestUpdateRowMapper = requestUpdateSection.rowMapper;
  const outgoingType3 = outgoing_reports.type3 || [];
  const requestUpdateExtra = outgoingType3.map((item, idx) => ({
    ...item,
    agency: item.department?.name || "-",
    issue: item.subject || "-",
    document_number: item.document_number || "-",
    document_date: item.document_date
      ? new Date(item.document_date).toLocaleDateString("th-TH")
      : "-",
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
  const requestUpdateRows = [...requestUpdateItems, ...requestUpdateExtra];
  
// AGENCY_REPORT (เปลี่ยนมาใช้ outgoing5)
const agencyReportSection = sectionConfigs[4];
const agencyReportHeaders = agencyReportSection.headers;
const agencyReportRowMapper = agencyReportSection.rowMapper;
const outgoingType5 = outgoing_reports.type5 || [];
const agencyReportRows = outgoingType5.map((item) => ({
 ...item,
  document_number: item.document_number || item.reference_number || "-",
  reference_date: item.document_date
    ? new Date(item.document_date).toLocaleDateString("th-TH")
    : item.reference_date
    ? new Date(item.reference_date).toLocaleDateString("th-TH")
    : "-",
  issue: item.subject || "-",
  created_at: item.created_at
    ? new Date(item.created_at).toLocaleDateString("th-TH")
    : "-",
  agency: item.department?.name || "-",
  attachment_name:
    item.attachments && item.attachments.length > 0
      ? item.attachments.map((a) => a.file_name || a.name).join(", ")
      : "-",
  id: item.id,
}));
  const agencyReportItems = Array.isArray(documentData?.items)
    ? documentData.items.filter(agencyReportSection.filter)
    : [];
  // const agencyReportRows = [...agencyReportItems, ...agencyReportExtra];

  // FINAL_NOTIFY (เปลี่ยนมาใช้ outgoing4)
  const finalSection = sectionConfigs.find((s) => s.key === "FINAL_NOTIFY");
  const finalHeaders = finalSection.headers;
  const finalRowMapper = finalSection.rowMapper;
  const outgoingType4 = outgoing_reports.type4 || [];
  const finalNotifyExtra = outgoingType4.map((item, idx) => ({
    ...item,
    agency: item.department?.name || "-",
    complaint_id: item.complaint_id || id,
    document_number: item.document_number || item.reference_number || "-",
    receiveDate:
      item.receive_date || item.document_date || item.reference_date
        ? new Date(
            item.receive_date || item.document_date || item.reference_date
          ).toLocaleDateString("th-TH")
        : "-",
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

  const finalNotifyRows = [...finalNotifyItems, ...finalNotifyExtra];

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
          background: "#EDF7EA",
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Typography mx={3}>
          เจ้าหน้าที่ผู้รับผิดชอบ:{" "}
          {documentData?.detail?.assigned_officer?.name ||
            documentData?.detail?.responsibleOfficer ||
            "ไม่ระบุ"}
        </Typography>
        <IconButton
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
        </IconButton>
      </Box>

      <Box sx={{ background: "#FBEAE9", py: 2, width: "100%" }}>
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
        }}
      >
        <Box sx={{ background: "#EAF5FF", py: 1 }}>
          <Typography mx={3} sx={{ fontWeight: "bold", color: "#1120A3" }}>
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
                    sx={{ background: "#fff", fontWeight: "bold" }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {receivedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={receivedHeaders.length} align="center">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              ) : (
                receivedRows.map((row, idx) => {
                  const rowObj = receivedRowMapper(row, idx);
                  return (
                    <TableRow key={rowObj.id || idx}>
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
          />
          {/* หนังสือแจ้งผลพิจารณาหน่วยงาน */}
          <TableSection
            section={agencyReportSection}
            headers={agencyReportHeaders}
            rows={agencyReportRows}
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
          />
          {/* แจ้งผลการให้ผู้เกี่ยวข้องทราบ */}
          <TableSection
            section={finalSection}
            headers={finalHeaders}
            rows={finalNotifyRows}
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
          />

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
                          <IconButton size="small" onClick={() => {
                            const a = document.createElement('a');
                            a.href = href;
                            a.download = name || 'download';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          }}>
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
            <IconButton color="inherit" onClick={() => {
              const a = document.createElement('a');
              a.href = previewSrc;
              a.download = previewName || 'download';
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}>
              <DownloadIcon sx={{ color: '#fff' }} />
            </IconButton>
            <IconButton color="inherit" onClick={() => window.open(previewSrc, '_blank', 'noreferrer') }>
              <OpenInNewIcon sx={{ color: '#fff' }} />
            </IconButton>
          </Box>

          {/* Content area */}
          <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            {previewType === 'pdf' ? (
              <Box sx={{ width: '100%', height: '100%', bgcolor: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', height: '100%', bgcolor: '#1e1e1e' }}>
                  <iframe
                    title={previewName}
                    src={previewSrc + (previewSrc.includes('#') ? '' : '#toolbar=0')}
                    style={{ border: 'none', width: '100%', height: '100%' }}
                  />
                </Box>
              </Box>
            ) : (
              <Box sx={{ bgcolor: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Box sx={{ bgcolor: '#ffffff', boxShadow: 3, p: 2 }}>
                  <Box sx={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left' }}>
                    <img src={previewSrc} alt={previewName} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default FollowComp;
