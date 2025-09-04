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

// 1. Define English-status constants
const STATUS = {
  RECEIVED: 1,
  FORWARDED: 2,
  INITIAL_NOTIFY: 3,
  REQUEST_UPDATE: 4,
  AGENCY_REPORT: 5,
  FINAL_NOTIFY: 6,
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

const handleManage = (sectionKey, id, router) => {
  if (!id) {
    console.error("Error: complaintId is undefined or null");
    return;
  }
  switch (sectionKey) {
    case "RECEIVED":
      router.push(`/admin/edit/website-complaints/${id}`);
      break;
    case "FORWARDED":
      router.push(`/admin/edit/forward-to-agency/${id}`);
      break;
    case "INITIAL_NOTIFY":
      router.push(
        `/admin/edit/initial-notification-to-complainant-or-agency/${id}`
      );
      break;
    case "REQUEST_UPDATE":
      router.push(`/admin/edit/request-result-or-progress/${id}`);
      break;
    case "AGENCY_REPORT":
      router.push(`/admin/edit/report/${id}`);
      break;
    case "FINAL_NOTIFY":
      const complaintId = router.query?.id || id;
      router.push({
        pathname: "/admin/edit/inform-related-parties/",
        query: { complaint_id: complaintId },
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
  REQUEST_UPDATE: (router, complaintId, complaintNumber) =>
    router.push({
      pathname: "/admin/edit/request-result-or-progress/",
      query: {
        complaint_id: complaintId || "",
        complaint_number: complaintNumber || "",
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
  FINAL_NOTIFY: (router, complaintId, complaintNumber) =>
    router.push({
      pathname: "/admin/edit/inform-related-parties/",
      query: {
        complaint_id: complaintId || "",
        complaint_number: complaintNumber || "",
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
}) => (
  <Box
    sx={{
      border: "1px solid #E0E0E0",
      borderRadius: 1,
      width: "100%",
      maxWidth: { sm: "auto" },
    }}
  >
    <Box
      sx={{
        background: "#EAF5FF",
        py: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography mx={3} sx={{ fontWeight: "bold", color: "#1120A3" }}>
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
                              const complaintId = router.query?.id;
                              const targetId =
                                section.key === "FINAL_NOTIFY"
                                  ? complaintId
                                  : rowObj.id;
                              if (targetId) {
                                handleManage(section.key, targetId, router);
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

const StatusHistorySection = ({ statusHistory }) => (
  <Box
    sx={{
      border: "1px solid #E0E0E0",
      borderRadius: 1,
      width: "100%",
      maxWidth: { sm: "auto" },
    }}
  >
    <Box
      sx={{
        background: "#EAF5FF",
        py: 1,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Typography mx={3} sx={{ fontWeight: "bold", color: "#1120A3" }}>
        ประวัติการเปลี่ยนสถานะ
      </Typography>
    </Box>
    <Box sx={{ overflowX: { xs: "auto", sm: "unset" }, width: "100%" }}>
      <Table sx={{ width: "100%" }}>
        <TableHead>
          <TableRow>
            <TableCell
              align="center"
              sx={{ background: "#fff", fontWeight: "bold" }}
            >
              ลำดับ
            </TableCell>
            <TableCell
              align="center"
              sx={{ background: "#fff", fontWeight: "bold" }}
            >
              วันที่เปลี่ยนแปลง
            </TableCell>
            <TableCell
              align="center"
              sx={{ background: "#fff", fontWeight: "bold" }}
            >
              สถานะ
            </TableCell>
            <TableCell
              align="center"
              sx={{ background: "#fff", fontWeight: "bold" }}
            >
              ผู้เปลี่ยนแปลง
            </TableCell>
            <TableCell
              align="center"
              sx={{ background: "#fff", fontWeight: "bold" }}
            >
              หมายเหตุ
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
                <TableCell align="center">
                  <b>{getStatusThai(item.status)}</b>
                </TableCell>
                <TableCell align="center">{item.changed_by_name}</TableCell>
                <TableCell align="center">{item.remark || "-"}</TableCell>
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
    if (typeof raw === "string" && raw.startsWith("http")) return raw;

    const ensureLeading = (s) => (s.startsWith("/") ? s : `/${s}`);
    const url = ensureLeading(String(raw));

    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
    // Origin without /api or /api/vN
    const origin = apiBase.replace(/\/api(?:\/v\d+)?$/, "");
    // API root without version, ends with /api
    const apiRootNoVer = apiBase.replace(/\/v\d+$/, "");

    // Case 1: already has /api/uploads in path -> just prefix with origin
    if (url.startsWith("/api/uploads/")) {
      return `${origin}${url}`;
    }
    // Case 2: plain /uploads -> prefix with /api (no version)
    if (url.startsWith("/uploads/")) {
      const root = /\/api$/.test(apiRootNoVer) ? apiRootNoVer : `${origin}/api`;
      return `${root}${url}`;
    }
    // Fallback: join with apiBase as-is
    return `${apiBase}${url}`;
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

      <Box sx={{ background: "#91CBFF", py: 2, width: "100%" }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ px: 3 }}>
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
                                    handleManage("RECEIVED", rowObj.id, router);
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
          />
          <Box
            sx={{
              background: "#FFF9C4",
              py: 2,
              borderRadius: 1,
              width: "100%",
            }}
          >
            <Typography mx={3} align="center">
              ขั้นตอนอยู่ระหว่างดำเนินการ
            </Typography>
          </Box>

          {/* Section: ประวัติการเปลี่ยนสถานะ */}
          {documentData?.detail?.status_history?.length > 0 && (
            <StatusHistorySection
              statusHistory={documentData.detail.status_history}
            />
          )}
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
          />
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
                    {href ? (
                      <MuiLink href={href} target="_blank" rel="noreferrer" underline="hover">
                        <ListItemText primary={name} />
                      </MuiLink>
                    ) : (
                      <ListItemText primary={name} />
                    )}
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FollowComp;
