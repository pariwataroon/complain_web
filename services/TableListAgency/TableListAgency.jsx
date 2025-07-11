import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Container,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import styles from "./TableListAgency.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";

import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";

const TableListAgency = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
  filterFields = [],
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const excelRef = useRef();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
  const isSm = useMediaQuery(theme.breakpoints.down("md")); // < 900px
  const isBelow1200 = useMediaQuery("(max-width:1200px)");
  const isBelow1300 = useMediaQuery("(max-width:1300px)");

  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  const handleChange = (field) => (e) => {
    let value;
    if (e?.target) {
      value = e.target.value;
    } else {
      value = e;
    }
    setFilters({ ...filters, [field]: value });
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const pagedData = useMemo(
    () => data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [data, page, rowsPerPage]
  );
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearSearch = () => {
    setFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
  };

  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  const columns = [
    { name: "claimantName", label: "ชื่อผู้ร้อง", width: 180 },
    { name: "receiptNumber", label: "เลขรับ สรร.", width: 150 },
    { name: "receiveDate", label: "ลงวันที่", width: 150 },
    { name: "agency", label: "หน่วยงาน/ชื่อ-สกุล (ผู้ร้อง)", width: 220 },
    { name: "issue", label: "ชื่อเรื่อง", width: 200 },
    { name: "issueType", label: "ประเภทเรื่อง", width: 180 },
    { name: "note", label: "หนังสือส่งหน่วยงาน/ติดตามผล", width: 200 },
    {
      name: "responsibleOfficer",
      label: "เจ้าหน้าที่ผู้รับผิดชอบ",
      width: 200,
    },
    { name: "status", label: "สถานะเรื่อง", width: 160 },
    { name: "workingDays", label: "ดำเนินการภายใน (วัน)", width: 160 },
  ];

  // --- Excel Export Handler ---
  const handleExportExcel = () => {
  const today = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const filename = `รายงานสรุปเรื่องร้องเรียนของหน่วยงาน_${today}.xlsx`;
  const exportLabel = `วันที่ export: ${today}`;

  // เตรียมข้อมูลแปลงเป็น array of object สำหรับ exportExcel
  const rows = data.map((item, idx) => {
    const rowObj = {
      ลำดับ: idx + 1,
    };
    columns.forEach((col) => {
      rowObj[col.label] = item[col.name] ?? "-";
    });
    return rowObj;
  });

  exportExcel(excelRef, filename, "Sheet1", title, exportLabel);
};

  return (
    <>
      {/* ← เพิ่ม Global CSS สำหรับ DatePicker popup ที่ document level */}
      <style jsx global>{`
        .popupOverlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 9999 !important;
          pointer-events: none !important;
          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;
          padding-top: 100px !important;
        }
        .popupCalendar {
          position: relative !important;
          background-color: #fff !important;
          border: 1px solid #e0e0e0 !important;
          border-radius: 8px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
          width: 320px !important;
          max-width: 90vw !important;
          overflow: hidden !important;
          z-index: 10000 !important;
          pointer-events: auto !important;
        }
        @media (max-width: 600px) {
          .popupCalendar {
            width: 300px !important;
            max-width: 95vw !important;
          }
        }
      `}</style>

      <Container
        maxWidth={false}
        disableGutters
        sx={{
          backgroundColor: "#fff",
          borderRadius: 2,
          boxShadow: "0 6px 18px rgba(0,0,0,.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          className={styles.headerBar}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            fontSize: { xs: 14, sm: 16, md: 18 },
            height: { xs: 35, sm: 40, md: 50 },
            px: { xs: 1.5, sm: 2, md: 3 },
          }}
        ></Box>

        {/* Title and Export Buttons */}
        {isSm ? (
          // Mobile & Tablet Layout
          <>
            <Box
              mt={2}
              className={styles.headerBar2}
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{
                fontSize: { xs: 16, sm: 18 },
                height: { xs: 40, sm: 50 },
                px: { xs: 2, sm: 3 },
              }}
            >
              <Box sx={{ fontWeight: "bold", textAlign: "center" }}>
                {title}
              </Box>
            </Box>
            <Box
              sx={{
                backgroundColor: "#f8f9fa",
                py: { xs: 2, sm: 1.5 },
                px: { xs: 2, sm: 3 },
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <Box
                display="flex"
                flexDirection={{ xs: "column", sm: "row" }}
                gap={{ xs: 1.5, sm: 1 }}
                justifyContent="center"
                alignItems="center"
              >
                <ExportButton
                  label="Export PDF"
                  onClick={() =>
                    exportElementToPDF(
                      pdfRef,
                      "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf"
                    )
                  }
                  size={isXs ? "small" : "medium"}
                  sx={{
                    minWidth: { xs: "200px", sm: "140px" },
                    width: { xs: "100%", sm: "auto" },
                    maxWidth: { xs: "250px", sm: "none" },
                  }}
                />
                <ExportButton
                  label="Export Excel"
                  onClick={handleExportExcel}
                  size={isXs ? "small" : "medium"}
                  sx={{
                    minWidth: { xs: "200px", sm: "140px" },
                    width: { xs: "100%", sm: "auto" },
                    maxWidth: { xs: "250px", sm: "none" },
                  }}
                />
              </Box>
            </Box>
          </>
        ) : (
          // Desktop Layout - Title and Export in same row
          <Box
            mt={2}
            className={styles.headerBar2}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              fontSize: 18,
              height: 50,
              px: 3,
            }}
          >
            <Box sx={{ fontWeight: "bold" }}>{title}</Box>
            <Box display="flex" alignItems="center" gap={1}>
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf"
                  )
                }
                size="medium"
              />
              <ExportButton
                label="Export Excel"
                size="medium"
                onClick={handleExportExcel}
              />
            </Box>
          </Box>
        )}

        {/* Filters + Search (unchanged) */}
        {/* ... (เหมือนเดิม) ... */}

        {/* Data Table */}
        <div ref={pdfRef}>
          <Box
            className={styles.tableWrapper}
            id="table-results"
            sx={{
              overflowX: isBelow1200 ? "auto" : "visible",
              px: { xs: 1, sm: 2 },
              pb: 1,
              position: "relative",
              zIndex: 0,
              "&::-webkit-scrollbar": {
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f1f1",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#888",
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: "#555",
                },
              },
            }}
          >
            <Table
              ref={excelRef}
              sx={{ minWidth: isBelow1200 ? 1400 : "100%" }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      width: { xs: 60, sm: 80 },
                      fontSize: { xs: 12, sm: 14 },
                    }}
                  >
                    ลำดับ
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell
                      key={col.name}
                      sx={{
                        width: col.width,
                        fontSize: { xs: 12, sm: 14 },
                        fontWeight: 600,
                        color: "#1120a3",
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedData.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#f5f7ff" },
                    }}
                  >
                    <TableCell
                      align="center"
                      sx={{
                        width: { xs: 60, sm: 80 },
                        fontWeight: 600,
                        color: "#1120A3",
                        fontSize: { xs: 12, sm: 14 },
                      }}
                    >
                      {page * rowsPerPage + idx + 1}
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell
                        key={col.name}
                        sx={{
                          width: col.width,
                          fontSize: { xs: 12, sm: 14 },
                          maxWidth: { xs: 120, sm: col.width },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item[col.name] ?? "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              rowsPerPageOptions={[5, 10, 25]}
              count={data.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sx={{
                borderTop: "1px solid #eee",
                "& .MuiTablePagination-toolbar": {
                  fontSize: { xs: 12, sm: 14 },
                  minHeight: { xs: 48, sm: 52 },
                },
                "& .MuiTablePagination-selectLabel": {
                  fontSize: { xs: 12, sm: 14 },
                },
                "& .MuiTablePagination-displayedRows": {
                  fontSize: { xs: 12, sm: 14 },
                },
              }}
            />
          </Box>
        </div>
      </Container>
    </>
  );
};

export default TableListAgency;
