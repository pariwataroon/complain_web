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
import CubeIcon from "@mui/icons-material/Cube";
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
import { getDocumentStorageByComplaintId } from "@pages/api/document/document";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

const breadcrumbItems = [
  {
    label: "เมนูคลังเอกสาร",
    icon: <CubeIcon sx={{ width: 24, height: 24, mb: -1 }} />,
    url: "/admin/box/new",
  },
  { label: "รับเข้าบัตรสนเท่ห์" },
];

const filterDepartmentName = (name) => {
  if (!name || name === "ทดสอบ") return null;
  return name;
};

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

const getSignedDate = (row) => {
  if (row.status === "agency_report") {
    return row.internal_register_date || row.document_date || row.created_at;
  }
  return row.document_date || row.created_at;
};

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
  const raw = file.fileUrl || file.file_url || file.url || file.path || file.file_path || "";
  if (!raw) return null;
  if (typeof raw === "string" && /^https?:\/\//i.test(raw)) return raw;
  const normalizePath = (s) => {
    let v = String(s).replace(/\\/g, "/");
    const apiIdx = v.indexOf("/api/uploads/");
    if (apiIdx >= 0) v = v.substring(apiIdx);
    else { const upIdx = v.indexOf("/uploads/"); if (upIdx >= 0) v = v.substring(upIdx); }
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
        const a = document.createElement("a"); a.href = blobUrl; a.download = filename || "download"; a.style.display = "none";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100); return;
      }
    } catch (e) { console.warn("Fetch download failed:", e); }
    try {
      const a = document.createElement("a"); a.href = url; a.download = filename || "download"; a.target = "_blank"; a.rel = "noopener noreferrer"; a.style.display = "none";
      document.body.appendChild(a); a.click(); document.body.removeChild(a); return;
    } catch (e) { console.warn("Anchor download failed:", e); }
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (error) { console.error("Download failed:", error); }
};

const INLINE_IMAGE = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
const INLINE_TEXT = ["txt", "json", "md", "log", "csv"];
const INLINE_AUDIO = ["mp3", "wav", "ogg", "m4a", "aac"];
const INLINE_VIDEO = ["mp4", "webm", "ogv", "mov", "mkv"];
const OFFICE_DOC = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"];
const canPreview = (ext = "") => {
  const e = String(ext).toLowerCase();
  return e === "pdf" || INLINE_IMAGE.includes(e) || INLINE_TEXT.includes(e) || INLINE_AUDIO.includes(e) || INLINE_VIDEO.includes(e) || OFFICE_DOC.includes(e);
};

const openPreview = async (setPreviewState, href, name, ext) => {
  if (!href) return;
  const e = (ext || "").toLowerCase();
  setPreviewState((prev) => ({ ...prev, name: name || "ไฟล์แนบ", zoom: 1, pdfLoadError: false, originalUrl: "", open: true, type: "image", src: "" }));
  if (INLINE_TEXT.includes(e)) {
    setPreviewState((prev) => ({ ...prev, originalUrl: href }));
    try { const res = await fetch(href); const text = await res.text(); const limited = text.length > 200000 ? text.slice(0, 200000) + "\n..." : text; setPreviewState((prev) => ({ ...prev, src: limited, type: "text" })); }
    catch { setPreviewState((prev) => ({ ...prev, src: "ไม่สามารถโหลดไฟล์ได้", type: "text" })); }
    return;
  }
  if (INLINE_AUDIO.includes(e)) { setPreviewState((prev) => ({ ...prev, src: href, type: "audio" })); return; }
  if (INLINE_VIDEO.includes(e)) { setPreviewState((prev) => ({ ...prev, src: href, type: "video" })); return; }
  if (OFFICE_DOC.includes(e)) { const encoded = encodeURIComponent(href); setPreviewState((prev) => ({ ...prev, src: `https://docs.google.com/gview?embedded=1&url=${encoded}`, type: "gdoc" })); return; }
  if (e === "pdf") { setPreviewState((prev) => ({ ...prev, src: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(href)}`, type: "pdfjs" })); return; }
  setPreviewState((prev) => ({ ...prev, src: href, type: "image" }));
};

// ==================== Section Configs ====================
const sectionConfigs = [
  {
    key: "RECEIVED", title: "รับเรื่องราวร้องทุกข์",
    headers: ["ลำดับ", "หน่วยงาน", "เลข สรร.", "เลขที่อ้างอิง(เลขสรร.สารบัญ)", "เรื่อง", "ประเภทเรื่อง", "เอกสารแนบ"],
    rowMapper: (row, idx) => ({ ลำดับ: idx + 1, หน่วยงาน: row.agency || "-", "เลข สรร.": row.complaint_number || "-", "เลขที่อ้างอิง(เลขสรร.สารบัญ)": row.parent_complaint_number || "-", เรื่อง: row.subject || "-", ประเภทเรื่อง: row.complaint_type?.name || "-", เอกสารแนบ: row.attachment_name || "-", id: row.id }),
  },
  {
    key: "FORWARDED", title: "ส่งหน่วยงานที่เกี่ยวข้อง",
    headers: ["ลำดับ", "หน่วยงาน(ครั้งที่ส่ง)", "เรื่อง", "เลขที่หนังสือ", "ลงวันที่", "ผู้ลงนาม", "เอกสารแนบ"],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || ""; const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";
      const isSpecialPosition = ["ผู้ร้อง", "ผู้ร้องเรียน", "อื่นๆ", "หน่วยงานอื่นๆ"].includes(posName);
      const prefix = isSpecialPosition ? `(${posName}) ` : "";
      const deptName = filterDepartmentName(row.department?.name) || filterDepartmentName(row.department_name) || filterDepartmentName(row.outgoing_departments?.[0]?.name);
      return { ลำดับ: idx + 1, "หน่วยงาน(ครั้งที่ส่ง)": (isSpecialPosition ? prefix + (other || deptName || "-") : deptName || "-"), เรื่อง: row.issue || row.subject || "-", เลขที่หนังสือ: row.document_number || "-", ลงวันที่: formatDate(getSignedDate(row)), ผู้ลงนาม: row.signer || (row.signature_authority_user && row.signature_authority_user.name) || "-", เอกสารแนบ: row.attachment_name || "-", id: row.id };
    },
    filter: (row) => row.status === "sent_to_agency" || row.status === "forwarded",
  },
  {
    key: "INITIAL_NOTIFY", title: "แจ้งผู้ร้องเรียนส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น",
    headers: ["ลำดับ", "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)", "เลขที่หนังสือ", "ลงวันที่", "เรื่อง", "ผู้ลงนาม", "เอกสารแนบ"],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || ""; const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";
      return { ลำดับ: idx + 1, "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)": positionDisplay, เลขที่หนังสือ: row.document_number || row.reference_number || "-", ลงวันที่: formatDate(getSignedDate(row)), เรื่อง: row.issue || row.subject || "-", ผู้ลงนาม: row.signer || (row.signature_authority_user && row.signature_authority_user.name) || "-", เอกสารแนบ: row.attachment_name || "-", id: row.id };
    },
    filter: (row) => row.status === "initial_notify",
  },
  {
    key: "REQUEST_UPDATE", title: "ขอทราบผลการพิจารณา / ผลความคืบหน้า",
    headers: ["ลำดับ", "ส่งหน่วยงาน(ครั้งที่ส่ง)", "เรื่อง", "เลขที่หนังสือ", "ลงวันที่", "ผู้ลงนาม", "เอกสารแนบ"],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || ""; const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";
      const isSpecialPosition = ["ผู้ร้อง", "ผู้ร้องเรียน", "อื่นๆ", "หน่วยงานอื่นๆ"].includes(posName);
      const prefix = isSpecialPosition ? `(${posName}) ` : "";
      const deptName = filterDepartmentName(row.department?.name) || filterDepartmentName(row.department_name) || filterDepartmentName(row.outgoing_departments?.[0]?.name);
      return { ลำดับ: idx + 1, "ส่งหน่วยงาน(ครั้งที่ส่ง)": (isSpecialPosition ? prefix + (other || deptName || "-") : deptName || "-"), เรื่อง: row.issue || row.subject || "-", เลขที่หนังสือ: row.document_number || "-", ลงวันที่: formatDate(getSignedDate(row)), ผู้ลงนาม: row.signer || (row.signature_authority_user && row.signature_authority_user.name) || "-", เอกสารแนบ: row.attachment_name || "-", id: row.id };
    },
    filter: (row) => row.status === "request_update",
  },
  {
    key: "AGENCY_REPORT", title: "หนังสือแจ้งผลพิจารณาหน่วยงาน",
    headers: ["ลำดับ", "เลขที่หนังสือ", "ลงวันที่", "เรื่อง", "วันรับงาน", "วันที่เสนองาน", "หน่วยงาน", "เอกสารแนบ"],
    rowMapper: (row, idx) => ({ ลำดับ: idx + 1, เลขที่หนังสือ: row.document_number || row.internal_register_number || row.reference_number || "-", ลงวันที่: formatDate(getSignedDate(row)), เรื่อง: row.issue || row.subject || "-", วันรับงาน: formatDate(row._original_document_date || row.document_date || row.updated_at || row.created_at), วันที่เสนองาน: formatDate(row.present_to_director_date || row.updated_at || row.created_at), หน่วยงาน: filterDepartmentName(row.agency) || filterDepartmentName(row.department?.name) || "-", เอกสารแนบ: row.attachment_name || "-", id: row.id }),
    filter: (row) => row.status === "agency_report",
  },
  {
    key: "FINAL_NOTIFY", title: "แจ้งผลการให้ผู้เกี่ยวข้องทราบ",
    headers: ["ลำดับ", "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)", "เลขที่หนังสือ", "เรื่อง", "ลงวันที่", "เอกสารแนบ"],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || ""; const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";
      return { ลำดับ: idx + 1, "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)": positionDisplay, เลขที่หนังสือ: row.document_number || row.reference_number || "-", เรื่อง: row.issue || row.subject || "-", ลงวันที่: formatDate(getSignedDate(row)), เอกสารแนบ: row.attachment_name || "-", id: row.id };
    },
    filter: (row) => row.status === "final_notify",
  },
];

const SectionTable = ({ section, rows, onOpenAttachments }) => (
  <Box sx={{ border: "1px solid #E0E0E0", borderRadius: 1 }}>
    <Box sx={{ px: 3, background: "#EAF5FF", py: 1 }}>
      <Typography sx={{ fontWeight: "bold", color: "#1120A3" }}>{section.title}</Typography>
    </Box>
    <Table>
      <TableHead>
        <TableRow>
          {section.headers.map((h) => (
            <TableCell key={h} sx={{ background: "#fff", fontWeight: "bold" }}>{h}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={section.headers.length} align="center">ไม่พบข้อมูล</TableCell></TableRow>
        ) : (
          rows.map((row, idx) => {
            const rowObj = section.rowMapper(row, idx);
            return (
              <TableRow key={rowObj.id || idx}>
                {section.headers.map((h) => (
                  <TableCell key={h}>
                    {h === "เอกสารแนบ" ? (
                      <IconButton size="small" onClick={() => onOpenAttachments && onOpenAttachments(section.key, row, rowObj)} sx={{ color: "#1976d2", "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.04)" } }}>
                        <FolderIcon />
                      </IconButton>
                    ) : (rowObj[h] ?? "-")}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
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

  useEffect(() => { if (id) fetchDocumentData(id); }, [id]);

  const fetchDocumentData = async (id) => {
    setLoading(true);
    try { const response = await getDocumentStorageByComplaintId(id); if (response?.res_data) setDocumentData(response.res_data); }
    catch (error) { console.error("Error fetching document data:", error); }
    finally { setLoading(false); }
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
        case "RECEIVED": { const found = findById(relAll, rowDisplay?.id); files = found?.attachments || []; title = `เอกสารแนบ - รับเรื่อง (${found?.complaint_number || "-"})`; break; }
        case "FORWARDED": { files = rowRaw?.attachments || findById(out?.type1, rowDisplay?.id)?.attachments || []; break; }
        case "INITIAL_NOTIFY": { files = rowRaw?.attachments || findById(out?.type2, rowDisplay?.id)?.attachments || []; break; }
        case "REQUEST_UPDATE": { files = rowRaw?.attachments || findById(out?.type3, rowDisplay?.id)?.attachments || []; break; }
        case "AGENCY_REPORT": { files = rowRaw?.attachments || findById(out?.type5, rowDisplay?.id)?.attachments || []; break; }
        case "FINAL_NOTIFY": { files = rowRaw?.attachments || findById(out?.type4, rowDisplay?.id)?.attachments || findById(out?.type5, rowDisplay?.id)?.attachments || []; break; }
        default: files = [];
      }
      setAttachmentsTitle(title);
      setAttachmentsList(Array.isArray(files) ? files : []);
      setAttachmentsOpen(true);
    } finally { setAttachmentsLoading(false); }
  };

  // ==================== Data Processing ====================
  const allRelated = documentData?.relationships?.all_related || [];
  const outgoing_reports = documentData?.outgoing_reports || {};

  const receivedSection = sectionConfigs[0];
  const receivedRows = allRelated.map((r) => ({ ...r, agency: typeof r.agency === "string" && r.agency ? r.agency : r.agency?.name || r.agency?.agency_name || "-", subject: r.subject || r.issue || "-", complaint_type: r.complaint_type || r.complaint_type_data || undefined }));
  sectionConfigs[0].rowMapper = (row, idx) => ({ ลำดับ: idx + 1, หน่วยงาน: row.agency || "-", "เลข สรร.": row.complaint_number || "-", "เลขที่อ้างอิง(เลขสรร.สารบัญ)": row.parent_complaint_number || "-", เรื่อง: row.subject || "-", ประเภทเรื่อง: row.complaint_type?.name || row.complaint_type?.complaint_type_name || "-", เอกสารแนบ: row.attachments?.length > 0 ? row.attachments.map((a) => a.file_name || a.name).join(", ") : "-", id: row.id });

  const items = Array.isArray(documentData?.items) ? documentData.items : [];
  const buildRows = (section, outType) => {
    const extra = (outgoing_reports[outType] || []).map((item) => ({ ...item, agency: filterDepartmentName(item.department?.name) || "-", issue: item.subject || "-", document_number: item.document_number || "-", document_date: formatDate(item.document_date), signer: item.signature_authority_user?.name || "-", attachment_name: item.attachments?.length > 0 ? item.attachments.map((a) => a.file_name || a.name).join(", ") : "-", id: item.id }));
    return [...items.filter(section.filter), ...extra].sort((a, b) => { const dA = dayjs(a.document_date || 0).valueOf(); const dB = dayjs(b.document_date || 0).valueOf(); return dB - dA; });
  };

  const buildAgencyRows = () => {
    const extra = (outgoing_reports.type5 || []).map((item) => ({ ...item, document_number: item.document_number || item.reference_number || "-", document_date: formatDate(item.internal_register_date || item.document_date), _original_document_date: item.document_date, issue: item.subject || "-", created_at: formatDate(item.present_to_director_date), agency: filterDepartmentName(item.department?.name) || "-", attachment_name: item.attachments?.length > 0 ? item.attachments.map((a) => a.file_name || a.name).join(", ") : "-", id: item.id }));
    return [...items.filter(sectionConfigs[4].filter), ...extra].sort((a, b) => { const dA = dayjs(a.internal_register_date || a.document_date || 0).valueOf(); const dB = dayjs(b.internal_register_date || b.document_date || 0).valueOf(); return dB - dA; });
  };

  const buildFinalRows = () => {
    const extra = (outgoing_reports.type4 || []).map((item) => ({ ...item, agency: filterDepartmentName(item.department?.name) || "-", complaint_id: item.complaint_id || id, document_number: item.document_number || item.reference_number || "-", receiveDate: formatDate(item.receive_date || item.document_date || item.reference_date), returnDate: formatDate(item.return_date), issue: item.subject || "-", attachment_name: item.attachments?.length > 0 ? item.attachments.map((a) => a.file_name || a.name).join(", ") : "-", id: item.id }));
    return [...items.filter(sectionConfigs[5].filter).map((it) => ({ ...it, complaint_id: it.complaint_id || id })), ...extra].sort((a, b) => { const dA = dayjs(a.receive_date || a.document_date || a.reference_date || 0).valueOf(); const dB = dayjs(b.receive_date || b.document_date || b.reference_date || 0).valueOf(); return dB - dA; });
  };

  const sectionRows = {
    RECEIVED: receivedRows,
    FORWARDED: buildRows(sectionConfigs[1], "type1"),
    INITIAL_NOTIFY: buildRows(sectionConfigs[2], "type2"),
    REQUEST_UPDATE: buildRows(sectionConfigs[3], "type3"),
    AGENCY_REPORT: buildAgencyRows(),
    FINAL_NOTIFY: buildFinalRows(),
  };

  return (
    <Box>
      <BreadcrumbsService items={breadcrumbItems} />
      <Box sx={{ background: "linear-gradient(to right, #1223a5, #2499ff)", height: 50, borderTopRightRadius: "12px", px: 3, display: "flex", alignItems: "center" }}></Box>
      <Box sx={{ background: "#fff", py: 2, px: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="#1120A3">ติดตามผลการดำเนินการ</Typography>
      </Box>
      <Box sx={{ background: "#EDF7EA", py: 2, px: 3 }}>
        <span>เจ้าหน้าที่ผู้รับผิดชอบ: {documentData?.detail?.assigned_officer?.name || documentData?.detail?.responsibleOfficer || "ไม่ระบุ"}</span>
      </Box>
      <Box sx={{ background: "#FBEAE9", py: 2, px: 3 }}>
        ชื่อผู้ร้อง: {documentData?.detail?.claimantName || documentData?.detail?.complainant?.name || "ไม่ระบุ"}
      </Box>
      <Box sx={{ background: "#91CBFF", py: 2, px: 3 }}>ขั้นตอนดำเนินการครั้งแรก</Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}><CircularProgress /></Box>
      ) : (
        <>
          <SectionTable section={receivedSection} rows={sectionRows.RECEIVED} onOpenAttachments={openAttachments} />
          <SectionTable section={sectionConfigs[1]} rows={sectionRows.FORWARDED} onOpenAttachments={openAttachments} />
          <SectionTable section={sectionConfigs[2]} rows={sectionRows.INITIAL_NOTIFY} onOpenAttachments={openAttachments} />
          <SectionTable section={sectionConfigs[3]} rows={sectionRows.REQUEST_UPDATE} onOpenAttachments={openAttachments} />
          <Box sx={{ background: "#FFF9C4", py: 2, px: 3, borderRadius: 1 }}>ขั้นตอนอยู่ระหว่างดำเนินการ</Box>
          {sectionConfigs[5] && <SectionTable section={sectionConfigs[5]} rows={sectionRows.FINAL_NOTIFY} onOpenAttachments={openAttachments} />}
        </>
      )}

      {/* Attachments Dialog */}
      <Dialog open={attachmentsOpen} onClose={() => setAttachmentsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{attachmentsTitle}</DialogTitle>
        <DialogContent dividers>
          {attachmentsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}><CircularProgress size={24} /></Box>
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
                          <IconButton size="small" onClick={() => window.open(href, "_blank", "noreferrer")}><OpenInNewIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => downloadFile(href, name)}><DownloadIcon fontSize="small" /></IconButton>
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
            <IconButton color="inherit" onClick={() => setPreview((p) => ({ ...p, open: false }))}><CloseIcon sx={{ color: "#fff" }} /></IconButton>
            <Typography sx={{ flexGrow: 1 }} noWrap title={preview.name}>{preview.name}</Typography>
            {preview.type === "image" && (<>
              <IconButton color="inherit" onClick={() => setPreview((p) => ({ ...p, zoom: Math.max(0.25, parseFloat((p.zoom - 0.1).toFixed(2))) }))}><ZoomOutIcon sx={{ color: "#fff" }} /></IconButton>
              <Typography variant="body2" sx={{ minWidth: 48, textAlign: "center" }}>{Math.round(preview.zoom * 100)}%</Typography>
              <IconButton color="inherit" onClick={() => setPreview((p) => ({ ...p, zoom: Math.min(4, parseFloat((p.zoom + 0.1).toFixed(2))) }))}><ZoomInIcon sx={{ color: "#fff" }} /></IconButton>
            </>)}
            <IconButton color="inherit" onClick={() => downloadFile(preview.type === "text" ? preview.originalUrl : preview.src, preview.name)}><DownloadIcon sx={{ color: "#fff" }} /></IconButton>
            <IconButton color="inherit" onClick={() => window.open(preview.type === "text" ? preview.originalUrl : preview.src, "_blank", "noreferrer")}><OpenInNewIcon sx={{ color: "#fff" }} /></IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
            {(preview.type === "pdfjs" || preview.type === "gdoc") && <Box sx={{ width: "100%", height: "100%" }}><iframe title={preview.name} src={preview.src} style={{ border: "none", width: "100%", height: "100%" }} /></Box>}
            {preview.type === "image" && <Box sx={{ bgcolor: "#fff", boxShadow: 3, p: 2 }}><Box sx={{ transform: `scale(${preview.zoom})`, transformOrigin: "top left" }}><img src={preview.src} alt={preview.name} style={{ display: "block", maxWidth: "100%", height: "auto" }} /></Box></Box>}
            {preview.type === "text" && <Box sx={{ width: "100%", height: "100%", bgcolor: "#121212", color: "#e0e0e0", p: 2, fontFamily: "monospace", whiteSpace: "pre-wrap", overflow: "auto", fontSize: 14, lineHeight: 1.5 }}>{preview.src}</Box>}
            {preview.type === "audio" && <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}><audio controls src={preview.src} style={{ width: "100%", maxWidth: 500 }} /><Typography color="#fff">{preview.name}</Typography></Box>}
            {preview.type === "video" && <Box sx={{ width: "100%", maxWidth: 960 }}><video controls src={preview.src} style={{ width: "100%", maxHeight: "80vh" }} /><Typography color="#fff" align="center" mt={1}>{preview.name}</Typography></Box>}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default FollowComp;