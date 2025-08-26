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
import { getDocumentStorageForWebsite } from "@pages/api/document/document";

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

const getThaiStatus = (englishStatus) => {
  const statusMap = {
    submitted: "อยู่ระหว่างการแจ้งผล",
    sent_to_agency: "รอหน่วยงานตอบกลับ",
    stop: "ยุติ",
    received: "รับเรื่องแล้ว",
    investigating: "กำลังตรวจสอบ",
    processing: "กำลังดำเนินการ",
    awaiting_info: "รอข้อมูลเพิ่มเติม",
    forwarded: "ส่งต่อหน่วยงาน",
    completed: "ดำเนินการเสร็จสิ้น",
  };
  return statusMap[englishStatus] || englishStatus;
};

const handleOpenDocument = (documentName) => {
  // ใส่ลิงก์เอกสารจริงจาก API ตรงนี้ ถ้ามี
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

const getDocumentIcon = () => (
  <FolderIcon sx={{ color: "#1223A5", fontSize: 24 }} />
);

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
      "เอกสารแนบ",
      "การจัดการ",
    ],
    rowMapper: (row, idx) => ({
      ลำดับ: idx + 1,
      หน่วยงาน: row.agency || "-",
      "เลข สรร.": row.complaint_number || "-",
      "เลขที่อ้างอิง(เลขสรร.สารบัญ)": row.reference_number || "-",
      เรื่อง: row.issue || "-",
      ประเภทเรื่อง: row.issueType || "-",
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
      เรื่อง: row.issue || "-",
      เลขที่หนังสือ: row.document_number || "-",
      ลงวันที่: row.receiveDate || "-",
      ผู้ลงนาม: row.signer || "-",
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
      "หน่วยงานหรือผู้ร้อง(ครั้งที่ส่ง)": row.agency || "-",
      เลขที่หนังสือ: row.document_number || "-",
      ลงวันที่: row.receiveDate || "-",
      เรื่อง: row.issue || "-",
      ผู้ลงนาม: row.signer || "-",
      เอกสารแนบ: row.attachment_name || "-",
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
      เรื่อง: row.issue || "-",
      เลขที่หนังสือ: row.document_number || "-",
      ลงวันที่: row.receiveDate || "-",
      ผู้ลงนาม: row.signer || "-",
      เอกสารแนบ: row.attachment_name || "-",
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
      เลขที่หนังสือ: row.document_number || "-",
      ลงวันที่: row.receiveDate || "-",
      เรื่อง: row.issue || "-",
      วันรับงาน: row.assigned_date || "-",
      วันที่เสนองาน: row.proposed_date || "-",
      หน่วยงาน: row.agency || "-",
      เอกสารแนบ: row.attachment_name || "-",
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
      "ถึงหน่วยงาน / ผู้ร้อง / อื่นๆ (ครั้งที่แจ้งผล)": row.agency || "-",
      เลขที่หนังสือ: row.document_number || "-",
      เรื่อง: row.issue || "-",
      ลงวันที่: row.receiveDate || "-",
      เอกสารแนบ: row.attachment_name || "-",
      การจัดการ: row.id,
      id: row.id,
    }),
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
      const response = await getDocumentStorageForWebsite(id);
      if (response && response.res_data) {
        setDocumentData(response.res_data);
      }
    } catch (error) {
      console.error("Error fetching document data:", error);
    } finally {
      setLoading(false);
    }
  };

  const responsibleOfficer =
    documentData?.items?.[0]?.responsibleOfficer || "ไม่ระบุ";
  const complainantName =
    documentData?.items?.[0]?.claimantName ||
    documentData?.items?.[0]?.complainant?.name ||
    "ไม่ระบุ";

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

      <Box sx={{ background: "#fff", mx: 3, py: 2, width: "100%" }}>
        <Typography variant="h5" fontWeight="bold" color="#1120A3">
          ติดตามผลการดำเนินการ
        </Typography>
      </Box>

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
          เจ้าหน้าที่ผู้รับผิดชอบ: {responsibleOfficer}
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
        <Typography mx={3}>ชื่อผู้ร้อง: {complainantName}</Typography>
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

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        sectionConfigs
          .filter((s) => s.key !== "FINAL_NOTIFY")
          .map((section) => {
            const items = Array.isArray(documentData?.items)
              ? documentData.items
              : [];
            let filteredRows =
              section.key === "RECEIVED" ? items : items.filter(section.filter);

            return (
              <Box
                key={section.key}
                sx={{
                  border: "1px solid #E0E0E0",
                  borderRadius: 1,
                  width: "100%",
                  maxWidth: { sm: "auto" },
                  mb: 2,
                }}
              >
                <Box sx={{ background: "#EAF5FF", py: 1 }}>
                  <Typography
                    mx={3}
                    sx={{ fontWeight: "bold", color: "#1120A3" }}
                  >
                    {section.title}
                  </Typography>
                </Box>
                <Box
                  sx={{ overflowX: { xs: "auto", sm: "unset" }, width: "100%" }}
                >
                  <Table sx={{ width: "100%" }}>
                    <TableHead>
                      <TableRow>
                        {section.headers.map((h) => (
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
                      {filteredRows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={section.headers.length}
                            align="center"
                          >
                            ไม่พบข้อมูล
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRows.map((row, idx) => {
                          const rowObj = section.rowMapper(row, idx);
                          return (
                            <TableRow key={rowObj.id || idx}>
                              {section.headers.map((h) => {
                                if (h === "เอกสารแนบ") {
                                  return (
                                    <TableCell key={h} align="center">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleOpenDocument(
                                            rowObj["เอกสารแนบ"]
                                          )
                                        }
                                        sx={{
                                          color: "#1976d2",
                                          "&:hover": {
                                            backgroundColor:
                                              "rgba(25, 118, 210, 0.04)",
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
                                              section.key,
                                              rowObj.id,
                                              router
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
                                            backgroundColor:
                                              "rgba(25, 118, 210, 0.04)",
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
          })
      )}

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

      {/* Final (status 6) section */}
      {(() => {
        const finalSection = sectionConfigs.find(
          (s) => s.key === "FINAL_NOTIFY"
        );
        if (!finalSection) return null;
        const items = Array.isArray(documentData?.items)
          ? documentData.items
          : [];
        const filteredRows = items.filter(finalSection.filter);

        return (
          <Box
            sx={{
              border: "1px solid #E0E0E0",
              borderRadius: 1,
              width: "100%",
              maxWidth: { sm: "auto" },
              marginBottom: 2,
            }}
          >
            <Box sx={{ background: "#FEFAEF", py: 1 }}>
              <Typography mx={3} sx={{ fontWeight: "bold", color: "#1120A3" }}>
                {finalSection.title}
              </Typography>
            </Box>
            <Box sx={{ overflowX: { xs: "auto", sm: "unset" }, width: "100%" }}>
              <Table sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    {finalSection.headers.map((h) => (
                      <TableCell
                        key={h}
                        align="center"
                        sx={{ background: "#E3F2FD", fontWeight: "bold" }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={finalSection.headers.length}
                        align="center"
                      >
                        ไม่พบข้อมูล
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((row, idx) => {
                      const rowObj = finalSection.rowMapper(row, idx);
                      return (
                        <TableRow key={rowObj.id || idx}>
                          {finalSection.headers.map((h) => {
                            if (h === "เอกสารแนบ") {
                              return (
                                <TableCell key={h} align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleOpenDocument(rowObj["เอกสารแนบ"])
                                    }
                                    sx={{
                                      color: "#1120A3",
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(25, 118, 210, 0.04)",
                                      },
                                    }}
                                  >
                                    <FolderIcon />
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
                                          finalSection.key,
                                          rowObj.id,
                                          router
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
                                        backgroundColor:
                                          "rgba(25, 118, 210, 0.04)",
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
      })()}
    </Box>
  );
};

export default FollowComp;
