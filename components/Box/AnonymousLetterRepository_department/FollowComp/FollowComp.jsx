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
} from "@mui/material";
import CubeIcon from "@mui/icons-material/Cube";
import FolderIcon from "@mui/icons-material/Folder";
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

const sectionConfigs = [
  {
    key: "RECEIVED",
    title: "รับเรื่องราวร้องทุกข์",
    headers: [
      "ลำดับ",
      "หน่วยงาน",
      "เลข สรร.",
      "เลขที่อ้างอิง(เลขสรร.สารบัญ)",
      "เรื่อง",
      "ประเภทเรื่อง",
      "เอกสารแนบ",
    ],
    rowMapper: (row, idx) => ({
      ลำดับ: idx + 1,
      หน่วยงาน: row.agency || "-",
      "เลข สรร.": row.complaint_number || "-",
      "เลขที่อ้างอิง(เลขสรร.สารบัญ)": row.parent_complaint_number || "-",
      เรื่อง: row.subject || "-",
      ประเภทเรื่อง: row.complaint_type?.name || "-",
      เอกสารแนบ: row.attachment_name || "-",
      id: row.id,
    }),
  },
  {
    key: "FORWARDED",
    title: "ส่งหน่วยงานที่เกี่ยวข้อง",
    headers: [
      "ลำดับ",
      "หน่วยงาน(ครั้งที่ส่ง)",
      "เรื่อง",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "ผู้ลงนาม",
      "เอกสารแนบ",
    ],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || "";
      const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";
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
        ผู้ลงนาม: row.signer || (row.signature_authority_user && row.signature_authority_user.name) || "-",
        เอกสารแนบ: row.attachment_name || "-",
        id: row.id,
      };
    },
    filter: (row) => row.status === "sent_to_agency" || row.status === "forwarded",
  },
  {
    key: "INITIAL_NOTIFY",
    title: "แจ้งผู้ร้องเรียนส่วนราชการที่ส่งเรื่องมากระทรวงทราบเบื้องต้น",
    headers: [
      "ลำดับ",
      "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "เรื่อง",
      "ผู้ลงนาม",
      "เอกสารแนบ",
    ],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || "";
      const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";
      return {
        ลำดับ: idx + 1,
        "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)": positionDisplay,
        เลขที่หนังสือ: row.document_number || row.reference_number || "-",
        ลงวันที่: formatDate(getSignedDate(row)),
        เรื่อง: row.issue || row.subject || "-",
        ผู้ลงนาม: row.signer || (row.signature_authority_user && row.signature_authority_user.name) || "-",
        เอกสารแนบ: row.attachment_name || "-",
        id: row.id,
      };
    },
    filter: (row) => row.status === "initial_notify",
  },
  {
    key: "REQUEST_UPDATE",
    title: "ขอทราบผลการพิจารณา / ผลความคืบหน้า",
    headers: [
      "ลำดับ",
      "ส่งหน่วยงาน(ครั้งที่ส่ง)",
      "เรื่อง",
      "เลขที่หนังสือ",
      "ลงวันที่",
      "ผู้ลงนาม",
      "เอกสารแนบ",
    ],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || "";
      const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";
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
        ผู้ลงนาม: row.signer || (row.signature_authority_user && row.signature_authority_user.name) || "-",
        เอกสารแนบ: row.attachment_name || "-",
        id: row.id,
      };
    },
    filter: (row) => row.status === "request_update",
  },
  {
    key: "AGENCY_REPORT",
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
    ],
    rowMapper: (row, idx) => ({
      ลำดับ: idx + 1,
      เลขที่หนังสือ: row.document_number || row.internal_register_number || row.reference_number || "-",
      ลงวันที่: formatDate(getSignedDate(row)),
      เรื่อง: row.issue || row.subject || "-",
      วันรับงาน: formatDate(row._original_document_date || row.document_date || row.updated_at || row.created_at),
      วันที่เสนองาน: formatDate(row.present_to_director_date || row.updated_at || row.created_at),
      หน่วยงาน: filterDepartmentName(row.agency) || filterDepartmentName(row.department?.name) || "-",
      เอกสารแนบ: row.attachment_name || "-",
      id: row.id,
    }),
    filter: (row) => row.status === "agency_report",
  },
  {
    key: "FINAL_NOTIFY",
    title: "แจ้งผลการให้ผู้เกี่ยวข้องทราบ",
    headers: [
      "ลำดับ",
      "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)",
      "เลขที่หนังสือ",
      "เรื่อง",
      "ลงวันที่",
      "เอกสารแนบ",
    ],
    rowMapper: (row, idx) => {
      const posName = row.position?.name || row.position_name || "";
      const other = row.position_other_text || "";
      let positionDisplay = [posName, other].filter(Boolean).join(other ? " " : "") || "-";
      return {
        ลำดับ: idx + 1,
        "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)": positionDisplay,
        เลขที่หนังสือ: row.document_number || row.reference_number || "-",
        เรื่อง: row.issue || row.subject || "-",
        ลงวันที่: formatDate(getSignedDate(row)),
        เอกสารแนบ: row.attachment_name || "-",
        id: row.id,
      };
    },
    filter: (row) => row.status === "final_notify",
  },
];

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

  // RECEIVED
  const receivedSection = sectionConfigs[0];
  const receivedRows = allRelated.map((r) => ({
    ...r,
    agency: typeof r.agency === "string" && r.agency
      ? r.agency
      : r.agency?.name || r.agency?.agency_name || "-",
    subject: r.subject || r.issue || "-",
    complaint_type: r.complaint_type || r.complaint_type_data || undefined,
  }));

  // Override RECEIVED rowMapper
  sectionConfigs[0].rowMapper = (row, idx) => ({
    ลำดับ: idx + 1,
    หน่วยงาน: row.agency || "-",
    "เลข สรร.": row.complaint_number || "-",
    "เลขที่อ้างอิง(เลขสรร.สารบัญ)": row.parent_complaint_number || "-",
    เรื่อง: row.subject || "-",
    ประเภทเรื่อง: row.complaint_type?.name || row.complaint_type?.complaint_type_name || "-",
    เอกสารแนบ: row.attachments && row.attachments.length > 0 ? row.attachments.map((a) => a.file_name || a.name).join(", ") : "-",
    id: row.id,
  });

  // FORWARDED
  const forwardedSection = sectionConfigs[1];
  const outgoingType1 = outgoing_reports.type1 || [];
  const forwardedExtra = outgoingType1.map((item) => ({
    ...item,
    agency: filterDepartmentName(item.department?.name) || "-",
    issue: item.subject || "-",
    document_number: item.document_number || "-",
    document_date: formatDate(item.document_date),
    signer: item.signature_authority_user?.name || "-",
    attachment_name: item.attachments && item.attachments.length > 0
      ? item.attachments.map((a) => a.file_name || a.name).join(", ") : "-",
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

  // INITIAL_NOTIFY
  const initialNotifySection = sectionConfigs[2];
  const outgoingType2 = outgoing_reports.type2 || [];
  const initialNotifyExtra = outgoingType2.map((item) => ({
    ...item,
    subject: item.subject || "-",
    signer: item.signature_authority_user?.name || "-",
    attachment_name: item.attachments && item.attachments.length > 0
      ? item.attachments.map((a) => a.file_name || a.name).join(", ") : "-",
    id: item.id,
  }));
  const initialItems = items.filter(initialNotifySection.filter);
  const initialNotifyRows = [...initialItems, ...initialNotifyExtra].sort((a, b) => {
    const dateA = dayjs(a.document_date || a.complaint_number_date || 0).valueOf();
    const dateB = dayjs(b.document_date || b.complaint_number_date || 0).valueOf();
    return dateB - dateA;
  });

  // REQUEST_UPDATE
  const requestUpdateSection = sectionConfigs[3];
  const outgoingType3 = outgoing_reports.type3 || [];
  const requestUpdateExtra = outgoingType3.map((item) => ({
    ...item,
    agency: filterDepartmentName(item.department?.name) || "-",
    issue: item.subject || "-",
    document_number: item.document_number || "-",
    document_date: formatDate(item.document_date),
    signer: item.signature_authority_user?.name || "-",
    attachment_name: item.attachments && item.attachments.length > 0
      ? item.attachments.map((a) => a.file_name || a.name).join(", ") : "-",
    id: item.id,
  }));
  const requestUpdateItems = items.filter(requestUpdateSection.filter);
  const requestUpdateRows = [...requestUpdateItems, ...requestUpdateExtra].sort((a, b) => {
    const dateA = dayjs(a.document_date || 0).valueOf();
    const dateB = dayjs(b.document_date || 0).valueOf();
    return dateB - dateA;
  });

  // AGENCY_REPORT
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
    attachment_name: item.attachments && item.attachments.length > 0
      ? item.attachments.map((a) => a.file_name || a.name).join(", ") : "-",
    id: item.id,
  }));
  const agencyReportItems = items.filter(agencyReportSection.filter);
  const agencyReportRowsSorted = [...agencyReportItems, ...agencyReportRows].sort((a, b) => {
    const dateA = dayjs(a.internal_register_date || a.document_date || 0).valueOf();
    const dateB = dayjs(b.internal_register_date || b.document_date || 0).valueOf();
    return dateB - dateA;
  });

  // FINAL_NOTIFY
  const finalSection = sectionConfigs[5];
  const outgoingType4 = outgoing_reports.type4 || [];
  const finalNotifyExtra = outgoingType4.map((item) => ({
    ...item,
    agency: filterDepartmentName(item.department?.name) || "-",
    complaint_id: item.complaint_id || id,
    document_number: item.document_number || item.reference_number || "-",
    issue: item.subject || "-",
    attachment_name: item.attachments && item.attachments.length > 0
      ? item.attachments.map((a) => a.file_name || a.name).join(", ") : "-",
    id: item.id,
  }));
  const finalNotifyItems = items
    .filter(finalSection.filter)
    .map((it) => ({ ...it, complaint_id: it.complaint_id || id }));
  const finalNotifyRows = [...finalNotifyItems, ...finalNotifyExtra].sort((a, b) => {
    const dateA = dayjs(a.receive_date || a.document_date || a.reference_date || 0).valueOf();
    const dateB = dayjs(b.receive_date || b.document_date || b.reference_date || 0).valueOf();
    return dateB - dateA;
  });

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
        }}
      ></Box>
      <Box sx={{ background: "#fff", py: 2, px: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="#1120A3">
          ติดตามผลการดำเนินการ
        </Typography>
      </Box>

      {/* Info rows - real data from API */}
      <Box
        sx={{
          background: "#EDF7EA",
          py: 2,
          px: 3,
        }}
      >
        <span>
          เจ้าหน้าที่ผู้รับผิดชอบ: {" "}
          {documentData?.detail?.assigned_officer?.name ||
            documentData?.detail?.responsibleOfficer ||
            "ไม่ระบุ"}
        </span>
      </Box>

      <Box sx={{ background: "#FBEAE9", py: 2, px: 3 }}>
        ชื่อผู้ร้อง: {" "}
        {documentData?.detail?.claimantName ||
          documentData?.detail?.complainant?.name ||
          "ไม่ระบุ"}
      </Box>
      <Box sx={{ background: "#91CBFF", py: 2, px: 3 }}>
        ขั้นตอนดำเนินการครั้งแรก
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* RECEIVED - rendered separately like original */}
          <Box sx={{ border: "1px solid #E0E0E0", borderRadius: 1 }}>
            <Box sx={{ px: 3, background: "#EAF5FF", py: 1 }}>
              <Typography sx={{ fontWeight: "bold", color: "#1120A3" }}>
                {receivedSection.title}
              </Typography>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  {receivedSection.headers.map((h) => (
                    <TableCell key={h} sx={{ background: "#fff", fontWeight: "bold" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {receivedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={receivedSection.headers.length} align="center">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  receivedRows.map((row, idx) => {
                    const rowObj = sectionConfigs[0].rowMapper(row, idx);
                    return (
                      <TableRow key={rowObj.id || idx}>
                        {receivedSection.headers.map((h) => (
                          <TableCell key={h}>
                            {h === "เอกสารแนบ" ? (
                              <IconButton
                                size="small"
                                sx={{
                                  color: "#1976d2",
                                  "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.04)" },
                                }}
                              >
                                <FolderIcon />
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

          {/* Other sections */}
          {[forwardedSection, initialNotifySection, requestUpdateSection, agencyReportSection].map((section) => {
            let rows = [];
            if (section.key === "FORWARDED") rows = forwardedFilteredRows;
            else if (section.key === "INITIAL_NOTIFY") rows = initialNotifyRows;
            else if (section.key === "REQUEST_UPDATE") rows = requestUpdateRows;
            else if (section.key === "AGENCY_REPORT") rows = agencyReportRowsSorted;

            return (
              <Box key={section.key} sx={{ border: "1px solid #E0E0E0", borderRadius: 1 }}>
                <Box sx={{ px: 3, background: "#EAF5FF", py: 1 }}>
                  <Typography sx={{ fontWeight: "bold", color: "#1120A3" }}>
                    {section.title}
                  </Typography>
                </Box>
                <Table>
                  <TableHead>
                    <TableRow>
                      {section.headers.map((h) => (
                        <TableCell key={h} sx={{ background: "#fff", fontWeight: "bold" }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={section.headers.length} align="center">
                          ไม่พบข้อมูล
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row, idx) => {
                        const rowObj = section.rowMapper(row, idx);
                        return (
                          <TableRow key={rowObj.id || idx}>
                            {section.headers.map((h) => (
                              <TableCell key={h}>
                                {h === "เอกสารแนบ" ? (
                                  <IconButton
                                    size="small"
                                    sx={{
                                      color: "#1976d2",
                                      "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.04)" },
                                    }}
                                  >
                                    <FolderIcon />
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
            );
          })}

          {/* Yellow in-progress bar */}
          <Box sx={{ background: "#FFF9C4", py: 2, px: 3, borderRadius: 1 }}>
            ขั้นตอนอยู่ระหว่างดำเนินการ
          </Box>

          {/* FINAL_NOTIFY */}
          {finalSection && (
            <Box sx={{ border: "1px solid #E0E0E0", borderRadius: 1 }}>
              <Box sx={{ px: 3, background: "#FEFAEF", py: 1 }}>
                <Typography sx={{ fontWeight: "bold", color: "#1120A3" }}>
                  {finalSection.title}
                </Typography>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    {finalSection.headers.map((h) => (
                      <TableCell key={h} sx={{ background: "#E3F2FD", fontWeight: "bold" }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finalNotifyRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={finalSection.headers.length} align="center">
                        ไม่พบข้อมูล
                      </TableCell>
                    </TableRow>
                  ) : (
                    finalNotifyRows.map((row, idx) => {
                      const rowObj = finalSection.rowMapper(row, idx);
                      return (
                        <TableRow key={rowObj.id || idx}>
                          {finalSection.headers.map((h) => (
                            <TableCell key={h}>
                              {h === "เอกสารแนบ" ? (
                                <IconButton
                                  size="small"
                                  sx={{
                                    color: "#1976d2",
                                    "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.04)" },
                                  }}
                                >
                                  <FolderIcon />
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
          )}
        </>
      )}
    </Box>
  );
};

export default FollowComp;