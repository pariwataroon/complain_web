import React, { useState, useMemo, useRef, useEffect } from "react";
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import styles from "./TableListCollapsReport.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";

const TableListCollapsReport = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
  filterFields = [],
  reportTitle = "",
  reportSubTitle = "",
  dateRange = "",
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const excelRef = useRef();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
  const isSm = useMediaQuery(theme.breakpoints.down("md")); // < 900px
  const isBelow1100 = useMediaQuery("(max-width:1100px)");
  const isBelow1200 = useMediaQuery("(max-width:1200px)");

  // เพิ่ม state สำหรับ client-side mounting
  const [isMounted, setIsMounted] = useState(false);

  // เพิ่ม useEffect สำหรับ client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // เพิ่ม useEffect สำหรับ global CSS สำหรับ DatePicker
  useEffect(() => {
    if (typeof window === "undefined") return; // ← check window

    const style = document.createElement("style");
    style.textContent = `
      .MuiPopper-root {
        z-index: 99999 !important;
      }
      .MuiDialog-root {
        z-index: 99999 !important;
      }
      .MuiModal-root {
        z-index: 99999 !important;
      }
      .MuiPickersPopper-root {
        z-index: 99999 !important;
      }
      .MuiDateCalendar-root {
        z-index: 99999 !important;
      }
      .MuiPickersDay-root {
        z-index: 99999 !important;
      }
      .MuiPickersCalendarHeader-root {
        z-index: 99999 !important;
      }
      .MuiPickersYear-root {
        z-index: 99999 !important;
      }
      .MuiPickersMonth-root {
        z-index: 99999 !important;
      }
      .MuiDatePicker-root {
        z-index: 99999 !important;
      }
      .MuiPaper-root.MuiPickersPopper-paper {
        z-index: 99999 !important;
      }
    `;

    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Initial filters
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const pagedData = useMemo(
    () => data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [data, page, rowsPerPage]
  );

  // Collapse states
  const [openRow, setOpenRow] = useState(null);
  const [openChild, setOpenChild] = useState({});

  // Totals
  const totalDeptSum = data.reduce(
    (sum, item) =>
      sum + item.departmentsData.reduce((s, d) => s + (d.totalDept || 0), 0),
    0
  );
  const inProgressSum = data.reduce(
    (sum, item) =>
      sum +
      item.departmentsData.reduce((s, d) => s + (d.inProgressCnt || 0), 0),
    0
  );
  const closedSum = data.reduce(
    (sum, item) =>
      sum + item.departmentsData.reduce((s, d) => s + (d.closedCnt || 0), 0),
    0
  );

  // Handlers
  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field) => (selectedDate) => {
    setFilters((prev) => ({ ...prev, [field]: selectedDate }));
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
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };
  const handleToggle = (id) => setOpenRow(openRow === id ? null : id);
  const handleChildToggle = (parentId, idx) => {
    const key = `${parentId}_${idx}`;
    setOpenChild((o) => ({ ...o, [key]: !o[key] }));
  };
  const handleExportExcel = () => {
    const today = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const filename = `รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ_${today}.xlsx`;
    const exportLabel = `วันที่ export: ${today}`;
    exportExcel(excelRef, {
      filename,
      sheetName: "Sheet1",
      title: reportTitle,
      exportDate: exportLabel,
    });
  };

  // Columns
  const columns = [
    {
      name: "claimantName",
      label: "รายชื่อผู้ตรวจ / หน่วยงานในสังกัด",
      width: 300,
      align: "left",
    },
    { name: "totalDept", label: "จำนวน", width: 100, align: "center" },
    {
      name: "inProgressCnt",
      label: "อยู่ระหว่างดำเนินการ",
      width: 150,
      align: "center",
    },
    { name: "closedCnt", label: "ยุติ", width: 100, align: "center" },
  ];

  // ฟังก์ชันสำหรับ DatePicker Props (เช็ค client-side)
  const getDatePickerProps = () => {
    if (!isMounted || typeof window === "undefined") {
      return {
        // Server-side safe props
        sx: {
          width: "100%",
          position: "relative",
          zIndex: 1000,
        },
      };
    }

    return {
      // Client-side props with document.body
      componentsProps: {
        popper: {
          style: {
            zIndex: 99999,
          },
          placement: "bottom-start",
          container: document.body,
        },
      },
      PopperProps: {
        style: {
          zIndex: 99999,
        },
        disablePortal: false,
        container: document.body,
      },
      slotProps: {
        popper: {
          style: {
            zIndex: 99999,
          },
          container: document.body,
        },
      },
      sx: {
        width: "100%",
        position: "relative",
        zIndex: 1000,
        "& .MuiInputBase-root": {
          position: "relative",
          zIndex: 1000,
        },
        "& .MuiPopper-root": {
          zIndex: `${99999} !important`,
        },
        "& .MuiDialog-root": {
          zIndex: `${99999} !important`,
        },
        "& .MuiModal-root": {
          zIndex: `${99999} !important`,
        },
        "& .MuiPaper-root": {
          zIndex: `${99999} !important`,
        },
      },
    };
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
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
          height: { xs: 40, sm: 50 },
          px: { xs: 2, sm: 3 },
          position: "relative",
          zIndex: 1,
        }}
      ></Box>

      {/* Title and Export Buttons */}
      {isSm ? (
        // Mobile & Tablet Layout
        <>
          {/* Title */}
          <Box
            className={styles.headerBar2}
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              fontSize: { xs: 16, sm: 18 },
              height: { xs: 40, sm: 50 },
              px: { xs: 2, sm: 3 },
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box sx={{ fontWeight: "bold", textAlign: "center" }}>{title}</Box>
          </Box>

          {/* Export Buttons Section - Mobile */}
          <Box
            sx={{
              backgroundColor: "#f8f9fa",
              py: { xs: 1.5, sm: 2 },
              px: { xs: 2, sm: 3 },
              borderBottom: "1px solid #e0e0e0",
              mt: 2,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              display="flex"
              flexDirection="column"
              gap={1.5}
              alignItems="center"
            >
              {isXs ? (
                // XS - แยกบรรทัด
                <>
                  <ExportButton
                    label="Export PDF"
                    onClick={() =>
                      exportElementToPDF(
                        pdfRef,
                        "รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ.pdf"
                      )
                    }
                    size="small"
                    sx={{
                      width: "100%",
                      maxWidth: "300px",
                    }}
                  />
                  <ExportButton
                    label="Export Excel"
                    onClick={handleExportExcel}
                    size="small"
                    sx={{
                      width: "100%",
                      maxWidth: "300px",
                    }}
                  />
                </>
              ) : (
                // SM - อยู่แถวเดียวกัน
                <Box
                  display="flex"
                  gap={1}
                  width="100%"
                  justifyContent="center"
                >
                  <ExportButton
                    label="Export PDF"
                    onClick={() =>
                      exportElementToPDF(
                        pdfRef,
                        "รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ.pdf"
                      )
                    }
                    size="medium"
                    sx={{
                      flex: 1,
                      maxWidth: "150px",
                    }}
                  />
                  <ExportButton
                    label="Export Excel"
                    onClick={handleExportExcel}
                    size="medium"
                    sx={{
                      flex: 1,
                      maxWidth: "150px",
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </>
      ) : (
        // Desktop Layout - Title and Export Buttons in same row
        <Box
          className={styles.headerBar2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            fontSize: { xs: 16, sm: 18, md: 18 },
            height: { xs: 40, sm: 50 },
            px: { xs: 2, sm: 3 },
            position: "relative",
            zIndex: 1,
            mt: 2,
          }}
        >
          <Box sx={{ fontWeight: "bold" }}>{title}</Box>

          {/* Export Buttons - Desktop */}
          <Box display="flex" gap={1} alignItems="center">
            <ExportButton
              label="Export PDF"
              onClick={() =>
                exportElementToPDF(
                  pdfRef,
                  "รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ.pdf"
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

      {/* Filters Section - Responsive */}
      <Box
        px={{ xs: 1.5, sm: 2 }}
        py={{ xs: 1.5, sm: 1 }}
        sx={{
          overflow: "visible",
          position: "relative",
          zIndex: 1000,
        }}
      >
        {isSm || isBelow1100 ? (
          // Mobile & Tablet & Small Desktop Layout (< 1100px)
          <>
            {/* Filter Fields - Grid Layout */}
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(3, 1fr)",
              }}
              gap={{ xs: 2, sm: 1.5 }}
              sx={{
                mb: 2,
                width: "100%",
                position: "relative",
                zIndex: 1000,
                "& > div": {
                  minWidth: 0,
                  position: "relative",
                  zIndex: 1000,
                },
              }}
            >
              {filterFields.map((f, index) => (
                <Box
                  key={f.name}
                  sx={{
                    position: "relative",
                    zIndex: 1000 + index,
                  }}
                >
                  {f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size={isXs ? "small" : "medium"}
                      sx={{
                        position: "relative",
                        zIndex: 1000 + index,
                      }}
                    />
                  ) : f.type === "date" ? (
                    <DateThaiPickerService
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleDateChange(f.name)}
                      placeholder={f.placeholder || `เลือก${f.label}`}
                      disabled={f.disabled || false}
                      required={f.required || false}
                      {...getDatePickerProps()} // ← ใช้ฟังก์ชันที่เช็ค client-side
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size={isXs ? "small" : "medium"}
                      sx={{
                        position: "relative",
                        zIndex: 1000 + index,
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>

            {/* Search Buttons */}
            <Box
              display="flex"
              gap={1.5}
              justifyContent="center"
              mb={2}
              sx={{
                position: "relative",
                zIndex: 500,
              }}
            >
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  "&:hover": { bgcolor: "#0b1580" },
                  position: "relative",
                  zIndex: 500,
                }}
              >
                <SearchIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  "&:hover": { bgcolor: "#0b1580" },
                  position: "relative",
                  zIndex: 500,
                }}
              >
                <SearchOffIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </IconButton>
            </Box>

            {/* Action Button - Mobile/Tablet/Small Desktop */}
            <Box
              display="flex"
              justifyContent="center"
              sx={{
                position: "relative",
                zIndex: 500,
              }}
            >
              <ButtonService
                label="ผลการดำเนินการและเรื่องค้างพิจารณา"
                color="#1120A3"
                onClick={() =>
                  router.push(
                    "/admin/document/annual-inspector-complaints-summary/resultscomplaints"
                  )
                }
                sx={{
                  width: "100%",
                  maxWidth: "350px",
                  height: { xs: 36, sm: 40 },
                  fontSize: { xs: 12, sm: 14 },
                  position: "relative",
                  zIndex: 500,
                }}
              />
            </Box>
          </>
        ) : (
          // Large Desktop Layout (>= 1100px)
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              position: "relative",
              zIndex: 1000,
            }}
          >
            {/* Left Side - Filters + Search */}
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                flexGrow: 1,
                overflowX: "visible",
                maxWidth: "65%",
                position: "relative",
                zIndex: 1000,
              }}
            >
              {filterFields.map((f, index) => (
                <Box
                  key={f.name}
                  sx={{
                    flex: "1 1 180px",
                    minWidth: "180px",
                    maxWidth: "250px",
                    position: "relative",
                    zIndex: 1000 + index,
                  }}
                >
                  {f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="medium"
                      sx={{
                        position: "relative",
                        zIndex: 1000 + index,
                      }}
                    />
                  ) : f.type === "date" ? (
                    <DateThaiPickerService
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleDateChange(f.name)}
                      placeholder={f.placeholder || `เลือก${f.label}`}
                      disabled={f.disabled || false}
                      required={f.required || false}
                      {...getDatePickerProps()} // ← ใช้ฟังก์ชันที่เช็ค client-side
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="medium"
                      sx={{
                        position: "relative",
                        zIndex: 1000 + index,
                      }}
                    />
                  )}
                </Box>
              ))}

              {/* Search Buttons */}
              <Box
                display="flex"
                gap={1}
                sx={{
                  flexShrink: 0,
                  ml: 1,
                  position: "relative",
                  zIndex: 500,
                }}
              >
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 48,
                    height: 48,
                    "&:hover": { bgcolor: "#0b1580" },
                    position: "relative",
                    zIndex: 500,
                  }}
                >
                  <SearchIcon />
                </IconButton>
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 48,
                    height: 48,
                    "&:hover": { bgcolor: "#0b1580" },
                    position: "relative",
                    zIndex: 500,
                  }}
                >
                  <SearchOffIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Right Side - Action Button */}
            <Box
              sx={{
                flexShrink: 0,
                ml: 2,
                position: "relative",
                zIndex: 500,
              }}
            >
              <ButtonService
                label="ผลการดำเนินการและเรื่องค้างพิจารณา"
                color="#1120A3"
                onClick={() =>
                  router.push(
                    "/admin/document/annual-inspector-complaints-summary/resultscomplaints"
                  )
                }
                sx={{
                  minWidth: "240px",
                  height: 40,
                  fontSize: "14px",
                  position: "relative",
                  zIndex: 500,
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Subtitle / Info Box */}
      <Box
        width="100%"
        textAlign="center"
        bgcolor="#EAF5FF"
        py={2}
        mb={2}
        sx={{
          fontWeight: "bold",
          color: "#0d47a1",
          fontSize: { xs: 14, sm: 16 },
          px: { xs: 1, sm: 2 },
          position: "relative",
          zIndex: 1,
        }}
      >
        {reportTitle}
        {reportSubTitle && (
          <>
            <br />
            {reportSubTitle}
          </>
        )}
        {dateRange && (
          <>
            <br />
            {dateRange}
          </>
        )}
      </Box>

      {/* Table */}
      <div ref={pdfRef}>
        <Box
          id="table-results"
          sx={{
            overflowX: "auto",
            px: { xs: 1, sm: 2 },
            pb: 1,
            position: "relative",
            zIndex: 1,
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
            sx={{
              minWidth: columns.reduce((sum, c) => sum + c.width, 0),
              tableLayout: "fixed",
              position: "relative",
              zIndex: 1,
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.name}
                    align={col.align}
                    sx={{
                      width: col.width,
                      fontSize: { xs: 12, sm: 14 },
                      fontWeight: 600,
                      color: "#1120a3",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Totals */}
              <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                {columns.map((col) => (
                  <TableCell
                    key={col.name}
                    align={col.align}
                    sx={{
                      width: col.width,
                      fontSize: { xs: 12, sm: 14 },
                      fontWeight: "bold",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {col.name === "claimantName"
                      ? "รวม"
                      : col.name === "totalDept"
                      ? totalDeptSum
                      : col.name === "inProgressCnt"
                      ? inProgressSum
                      : closedSum}
                  </TableCell>
                ))}
              </TableRow>

              {/* Rows */}
              {pagedData.map((item) => (
                <React.Fragment key={item.id}>
                  {/* Parent row */}
                  <TableRow
                    onClick={() => router.push(`${navigateTo}/${item.id}`)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#f5f7ff" },
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {columns.map((col) => {
                      const val =
                        col.name === "claimantName"
                          ? item.claimantName
                          : col.name === "totalDept"
                          ? item.departmentsData.reduce(
                              (s, d) => s + (d.totalDept || 0),
                              0
                            )
                          : col.name === "inProgressCnt"
                          ? item.departmentsData.reduce(
                              (s, d) => s + (d.inProgressCnt || 0),
                              0
                            )
                          : item.departmentsData.reduce(
                              (s, d) => s + (d.closedCnt || 0),
                              0
                            );

                      return col.name === "claimantName" ? (
                        <TableCell
                          key={col.name}
                          align={col.align}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            fontSize: { xs: 12, sm: 14 },
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(item.id);
                            }}
                            sx={{ mr: 1 }}
                          >
                            {openRow === item.id ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                          {val}
                        </TableCell>
                      ) : (
                        <TableCell
                          key={col.name}
                          align={col.align}
                          sx={{
                            width: col.width,
                            fontSize: { xs: 12, sm: 14 },
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          {val}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* First-level collapse */}
                  {openRow === item.id &&
                    item.departmentsData.map((d, idx) => {
                      const key = `${item.id}_${idx}`;
                      return (
                        <React.Fragment key={key}>
                          <TableRow
                            sx={{
                              backgroundColor: "#fefaef",
                              position: "relative",
                              zIndex: 1,
                            }}
                          >
                            <TableCell
                              align="left"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                pl: 4,
                                fontSize: { xs: 12, sm: 14 },
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleChildToggle(item.id, idx)}
                                sx={{ mr: 1 }}
                              >
                                {openChild[key] ? (
                                  <ExpandLessIcon />
                                ) : (
                                  <ExpandMoreIcon />
                                )}
                              </IconButton>
                              {d.department}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontSize: { xs: 12, sm: 14 },
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              {d.totalDept}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontSize: { xs: 12, sm: 14 },
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              {d.inProgressCnt}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontSize: { xs: 12, sm: 14 },
                                position: "relative",
                                zIndex: 1,
                              }}
                            >
                              {d.closedCnt}
                            </TableCell>
                          </TableRow>

                          {/* Second-level collapse */}
                          {d.children &&
                            openChild[key] &&
                            d.children.map((c, j) => (
                              <TableRow
                                key={`${key}_${j}`}
                                sx={{
                                  position: "relative",
                                  zIndex: 1,
                                }}
                              >
                                <TableCell
                                  align="left"
                                  sx={{
                                    width: columns[0].width,
                                    pl: 8,
                                    fontSize: { xs: 12, sm: 14 },
                                    position: "relative",
                                    zIndex: 1,
                                  }}
                                >
                                  {c.department}
                                </TableCell>
                                <TableCell
                                  align="center"
                                  sx={{
                                    fontSize: { xs: 12, sm: 14 },
                                    position: "relative",
                                    zIndex: 1,
                                  }}
                                >
                                  {c.totalDept}
                                </TableCell>
                                <TableCell
                                  align="center"
                                  sx={{
                                    fontSize: { xs: 12, sm: 14 },
                                    position: "relative",
                                    zIndex: 1,
                                  }}
                                >
                                  {c.inProgressCnt}
                                </TableCell>
                                <TableCell
                                  align="center"
                                  sx={{
                                    fontSize: { xs: 12, sm: 14 },
                                    position: "relative",
                                    zIndex: 1,
                                  }}
                                >
                                  {c.closedCnt}
                                </TableCell>
                              </TableRow>
                            ))}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{
              borderTop: "1px solid #eee",
              position: "relative",
              zIndex: 1,
              "& .MuiTablePagination-toolbar": {
                fontSize: { xs: 12, sm: 14 },
                minHeight: { xs: 48, sm: 52 },
              },
            }}
          />
        </Box>
      </div>
    </Container>
  );
};

export default TableListCollapsReport;
