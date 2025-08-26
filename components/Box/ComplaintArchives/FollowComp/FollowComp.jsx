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
      router.push(`/admin/edit/inform-related-parties/${id}`);
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
      เลขที่หนังสือ: row.document_number || row.reference_number || "-",
      ลงวันที่: row.receiveDate || row.reference_date || "-",
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
      เลขที่หนังสือ: row.document_number || row.reference_number || "-",
      ลงวันที่: row.receiveDate || row.reference_date || "-",
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
      วันรับงาน: row.assigned_date || "-",
      วันที่เสนองาน: row.proposed_date || "-",
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
      "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)",
      "เลขที่หนังสือ",
      "เรื่อง",
      "ลงวันที่",
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => ({
      ลำดับ: idx + 1,
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
  FORWARDED: (router) => router.push("/admin/edit/forward-to-agency/"),
  INITIAL_NOTIFY: (router) =>
    router.push("/admin/edit/initial-notification-to-complainant-or-agency/"),
  REQUEST_UPDATE: (router) =>
    router.push("/admin/edit/request-result-or-progress/"),
  AGENCY_REPORT: (router) => router.push("/admin/edit/report/"),
  FINAL_NOTIFY: (router) => router.push("/admin/edit/inform-related-parties/"),
};

const TableSection = ({
  section,
  headers,
  rows,
  rowMapper,
  onAdd,
  router,
  handleOpenDocument,
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
                            onClick={() =>
                              handleOpenDocument(rowObj["เอกสารแนบ"])
                            }
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
                                handleManage(section.key, rowObj.id, router);
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

  // ข้อมูล all_related สำหรับตารางรับเรื่องราวร้องทุกข์
  const allRelated = documentData?.relationships?.all_related || [];
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
    document_number: item.reference_number || "-",
    receiveDate: item.reference_date
      ? new Date(item.reference_date).toLocaleDateString("th-TH")
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
    document_number: item.reference_number || "-",
    receiveDate: item.reference_date
      ? new Date(item.reference_date).toLocaleDateString("th-TH")
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

  // AGENCY_REPORT (type4)
  const agencyReportSection = sectionConfigs[4];
  const agencyReportHeaders = agencyReportSection.headers;
  const agencyReportRowMapper = agencyReportSection.rowMapper;
  const outgoingType4 = outgoing_reports.type4 || [];
  const agencyReportExtra = outgoingType4.map((item, idx) => ({
    ...item,
    document_number: item.reference_number || "-",
    receiveDate: item.reference_date
      ? new Date(item.reference_date).toLocaleDateString("th-TH")
      : "-",
    issue: item.subject || "-",
    assigned_date: item.assigned_date || "-",
    proposed_date: item.proposed_date || "-",
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
  const agencyReportRows = [...agencyReportItems, ...agencyReportExtra];

  // FINAL_NOTIFY (type5)
  const finalSection = sectionConfigs.find((s) => s.key === "FINAL_NOTIFY");
  const finalHeaders = finalSection.headers;
  const finalRowMapper = finalSection.rowMapper;
  const outgoingType5 = outgoing_reports.type5 || [];
  const finalNotifyExtra = outgoingType5.map((item, idx) => ({
    ...item,
    agency: item.department?.name || "-",
    document_number: item.document_number || item.reference_number || "-",
    receiveDate: item.receive_date
      ? new Date(item.receive_date).toLocaleDateString("th-TH")
      : "-",
    issue: item.subject || "-",
    attachment_name:
      item.attachments && item.attachments.length > 0
        ? item.attachments.map((a) => a.file_name || a.name).join(", ")
        : "-",
    id: item.id,
  }));
  const finalNotifyItems = Array.isArray(documentData?.items)
    ? documentData.items.filter(finalSection.filter)
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
                                onClick={() =>
                                  handleOpenDocument(rowObj["เอกสารแนบ"])
                                }
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
            onAdd={() => addButtonHandlers.FORWARDED(router)}
            router={router}
            handleOpenDocument={handleOpenDocument}
            handleManage={handleManage}
          />
          {/* แจ้งผู้ร้องเรียนส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น */}
          <TableSection
            section={initialNotifySection}
            headers={initialNotifyHeaders}
            rows={initialNotifyRows}
            rowMapper={initialNotifyRowMapper}
            onAdd={() => addButtonHandlers.INITIAL_NOTIFY(router)}
            router={router}
            handleOpenDocument={handleOpenDocument}
            handleManage={handleManage}
          />
          {/* ขอทราบผลการพิจารณา / ผลความคืบหน้า */}
          <TableSection
            section={requestUpdateSection}
            headers={requestUpdateHeaders}
            rows={requestUpdateRows}
            rowMapper={requestUpdateRowMapper}
            onAdd={() => addButtonHandlers.REQUEST_UPDATE(router)}
            router={router}
            handleOpenDocument={handleOpenDocument}
            handleManage={handleManage}
          />
          {/* หนังสือแจ้งผลพิจารณาหน่วยงาน */}
          <TableSection
            section={agencyReportSection}
            headers={agencyReportHeaders}
            rows={agencyReportRows}
            rowMapper={agencyReportRowMapper}
            onAdd={() => addButtonHandlers.AGENCY_REPORT(router)}
            router={router}
            handleOpenDocument={handleOpenDocument}
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
          {/* แจ้งผลการให้ผู้เกี่ยวข้องทราบ */}
          <TableSection
            section={finalSection}
            headers={finalHeaders}
            rows={finalNotifyRows}
            rowMapper={finalRowMapper}
            onAdd={() => addButtonHandlers.FINAL_NOTIFY(router)}
            router={router}
            handleOpenDocument={handleOpenDocument}
            handleManage={handleManage}
          />
        </>
      )}
    </Box>
  );
};

export default FollowComp;
