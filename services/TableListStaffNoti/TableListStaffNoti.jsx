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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import styles from "./TableListStaffNoti.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import ExportButton from "@services/ExportButton/ExportButton";
import { exportElementToPDF } from "@utils/exportPDF";
import * as XLSX from "xlsx-js-style";
const TableListStaffNoti = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
  filterFields = [],
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const theme = useTheme();

  // Dynamic responsive breakpoints
  const isExtraSmall = useMediaQuery("(max-width:640px)");
  const isSmall = useMediaQuery("(max-width:768px)");
  const isMedium = useMediaQuery("(max-width:1024px)");
  const isLarge = useMediaQuery("(max-width:1280px)");
  const isXL = useMediaQuery("(max-width:1536px)");
  const needsScrollbar = useMediaQuery("(max-width:1560px)");

  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  const handleChange = (field) => (e) =>
    setFilters({ ...filters, [field]: e?.target ? e.target.value : e });

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
    {
      name: "responsibleOfficer",
      label: "เจ้าหน้าที่ผู้รับผิดชอบ",
      width: 200,
    },
    { name: "claimantName", label: "ชื่อ - สกุล (ผู้ร้อง)", width: 200 },
    { name: "issue", label: "ชื่อเรื่อง", width: 200 },
    { name: "receiptNumber", label: "เลข สรร.", width: 150 },
    {
      name: "officerReceiveDate",
      label: "วันที่เจ้าหน้าที่รับเรื่อง",
      width: 180,
    },
    { name: "issueType", label: "หัวข้อ", width: 250 },
    { name: "countTimes", label: "จำนวนครั้ง", width: 120 },
  ];

  // Dynamic layout calculation with consistent sizing
  const getLayoutConfig = () => {
    const totalFields = filterFields.length;

    if (isExtraSmall) {
      return {
        layout: "stacked",
        fieldsPerRow: 1,
        fieldWidth: "100%",
        buttonSize: "small",
        gap: 1,
        padding: 1,
        inputHeight: "40px",
        iconSize: 36,
      };
    } else if (isSmall) {
      return {
        layout: "stacked",
        fieldsPerRow: 2,
        fieldWidth: "calc(50% - 4px)",
        buttonSize: "small",
        gap: 1,
        padding: 1.5,
        inputHeight: "40px",
        iconSize: 40,
      };
    } else if (isMedium) {
      return {
        layout: "two-row",
        fieldsPerRow: 3,
        fieldWidth: "calc(33.33% - 6px)",
        buttonSize: "small",
        gap: 1.5,
        padding: 2,
        inputHeight: "40px",
        iconSize: 40,
      };
    } else if (isLarge || totalFields > 5) {
      // สำหรับ large screen หรือ ฟิลด์มากกว่า 5 ช่อง ใช้ two-row layout
      return {
        layout: "two-row",
        fieldsPerRow: 4,
        fieldWidth: "auto",
        buttonSize: "small",
        gap: 1.5,
        padding: 2,
        inputHeight: "40px",
        iconSize: 40,
      };
    } else {
      return {
        layout: "single-row",
        fieldsPerRow: filterFields.length,
        fieldWidth: "auto",
        buttonSize: "small",
        gap: 2,
        padding: 2,
        inputHeight: "40px",
        iconSize: 40,
      };
    }
  };

  const layoutConfig = getLayoutConfig();

  // Common filter field styles
  const getFilterFieldStyles = () => ({
    "& .MuiInputBase-root": {
      height: layoutConfig.inputHeight,
    },
    "& .MuiInputLabel-root": {
      fontSize: isExtraSmall ? "13px" : "14px",
    },
    "& .MuiInputBase-input": {
      fontSize: isExtraSmall ? "13px" : "14px",
    },
  });

  const renderFilterField = (f) => {
    const commonProps = {
      fullWidth: true,
      label: f.label,
      value: filters[f.name],
      onChange: handleChange(f.name),
      size: "small",
      sx: getFilterFieldStyles(),
    };

    if (f.type === "select") {
      return <SelectField {...commonProps} options={f.options} />;
    } else if (f.type === "date") {
      return <DateThaiPickerService {...commonProps} placeholder="เลือกวันที่" />;
    } else {
      return <InputText {...commonProps} />;
    }
  };

const handleExportExcel = () => {
  if (!data || data.length === 0) {
    alert("ไม่มีข้อมูลสำหรับ export");
    return;
  }

  const today = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const filename = `รายงานการแจ้งเตือนเจ้าหน้าที่_${today}.xlsx`;

  // สร้าง array สำหรับ worksheet
  const wsData = [];

  // แถวที่ 1: หัวข้อรายงาน
  wsData.push(["รายงานการแจ้งเตือนเจ้าหน้าที่"]);

  // แถวที่ 2: วันที่
  wsData.push([`ข้อมูล ณ วันที่ ${today}`]);

  // แถวที่ 3: หน่วยงาน
  wsData.push(["หน่วยงาน กระทรวงการคลัง"]);

  // แถวว่าง
  wsData.push([]);

  // แถวที่ 5: Header ตาราง
  const headers = [
    "ลำดับ",
    ...columns.map((col) => col.label),
  ];
  wsData.push(headers);

  // แถวข้อมูล
  data.forEach((item, idx) => {
    const row = [idx + 1];
    columns.forEach((col) => {
      row.push(item[col.name] ?? "-");
    });
    wsData.push(row);
  });

  // สร้าง worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // จำนวนคอลัมน์
  const numCols = headers.length;

  // Merge cells สำหรับหัวข้อ
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } });
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } });
  ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } });

  // กำหนดความกว้างคอลัมน์
  ws['!cols'] = [
    { wch: 6 },  // ลำดับ
    { wch: 22 }, // เจ้าหน้าที่ผู้รับผิดชอบ
    { wch: 22 }, // ชื่อ - สกุล
    { wch: 22 }, // ชื่อเรื่อง
    { wch: 14 }, // เลข สรร.
    { wch: 18 }, // วันที่เจ้าหน้าที่รับเรื่อง
    { wch: 22 }, // หัวข้อ
    { wch: 12 }, // จำนวนครั้ง
  ];

  // จัดรูปแบบเซลล์
  const borderStyle = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const range = XLSX.utils.decode_range(ws['!ref']);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) {
        ws[cellAddress] = { t: 's', v: '' };
      }
      if (!ws[cellAddress].s) ws[cellAddress].s = {};

      // แถว 0-2: หัวข้อรายงาน
      if (R >= 0 && R <= 2) {
        ws[cellAddress].s.font = { name: "Cordia New", sz: 14 };
        ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
      }
      // แถวที่ 4: Header ตาราง
      else if (R === 4) {
        ws[cellAddress].s.font = { name: "Cordia New", sz: 14, bold: true };
        ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
        ws[cellAddress].s.fill = { fgColor: { rgb: "D9D9D9" } };
        ws[cellAddress].s.border = borderStyle;
      }
      // แถวข้อมูล
      else if (R > 4) {
        ws[cellAddress].s.font = { name: "Cordia New", sz: 14 };
        ws[cellAddress].s.border = borderStyle;
        const centerColumns = [0, 4, 7]; // ลำดับ, เลข สรร., จำนวนครั้ง
        ws[cellAddress].s.alignment = {
          horizontal: centerColumns.includes(C) ? "center" : "left",
          vertical: "center",
          wrapText: true,
        };
      }
    }
  }

  // ตั้งค่า Page Setup เป็น A4 Landscape พอดีหน้า
  ws['!pageSetup'] = {
    paperSize: 9, // A4 = 9
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  // ตั้งค่า margins
  ws['!margins'] = {
    left: 0.4,
    right: 0.4,
    top: 0.4,
    bottom: 0.4,
    header: 0.2,
    footer: 0.2,
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
};

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
        overflow: "visible",
      }}
    >
      {/* Title */}
      <Box
        className={styles.headerBar}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          // Remove the responsive font size changes to keep consistent with SCSS
          fontSize: "18px",
          padding: "0 24px",
          height: "50px",
          // Add responsive styles that match your SCSS
          "@media (max-width: 599px)": {
            height: "44px",
            padding: "0 16px",
            fontSize: "16px",
          },
          "@media (max-width: 899px) and (min-width: 600px)": {
            fontSize: "17px",
          },
        }}
      >
        <Box>{title}</Box>
      </Box>

      {/* Dynamic Responsive Filters */}
      <Box
        width="100%"
        px={layoutConfig.padding}
        py={layoutConfig.padding}
        sx={{
          overflow: "visible",
          boxSizing: "border-box",
        }}
      >
        {layoutConfig.layout === "stacked" ? (
          // Stacked Layout (Mobile/Small screens)
          <>
            {/* Filter Fields */}
            <Box
              display="grid"
              gridTemplateColumns={`repeat(${layoutConfig.fieldsPerRow}, 1fr)`}
              gap={layoutConfig.gap}
              mb={2}
              sx={{
                overflow: "visible",
                width: "100%",
              }}
            >
              {filterFields.map((f) => (
                <Box key={f.name} sx={{ minWidth: 0 }}>
                  {renderFilterField(f)}
                </Box>
              ))}
            </Box>

            {/* Search Buttons */}
            <Box display="flex" justifyContent="center" gap={1} mb={2}>
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                  width: layoutConfig.iconSize,
                  height: layoutConfig.iconSize,
                  borderRadius: "50%",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                  width: layoutConfig.iconSize,
                  height: layoutConfig.iconSize,
                  borderRadius: "50%",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <SearchOffIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Export Buttons */}
            <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    "รายงานการแจ้งเตือนเจ้าหน้าที่.pdf"
                  )
                }
                size={layoutConfig.buttonSize}
                sx={{
                  minWidth: isExtraSmall ? "100px" : "120px",
                  height: layoutConfig.inputHeight,
                  fontSize: "12px",
                }}
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                size={layoutConfig.buttonSize}
                sx={{
                  minWidth: isExtraSmall ? "100px" : "120px",
                  height: layoutConfig.inputHeight,
                  fontSize: "12px",
                }}
              />
            </Box>
          </>
        ) : layoutConfig.layout === "two-row" ? (
          // Two-row Layout (Medium to Large screens)
          <>
            {/* First Row - First 4 fields */}
            <Box
              display="grid"
              gridTemplateColumns={`repeat(${Math.min(layoutConfig.fieldsPerRow, filterFields.length)}, 1fr)`}
              gap={layoutConfig.gap}
              mb={1.5}
              sx={{
                overflow: "visible",
                width: "100%",
              }}
            >
              {filterFields.slice(0, layoutConfig.fieldsPerRow).map((f) => (
                <Box key={f.name} sx={{ minWidth: 0 }}>
                  {renderFilterField(f)}
                </Box>
              ))}
            </Box>

            {/* Second Row - Remaining fields + Search Buttons + Export Buttons */}
            <Box
              display="flex"
              alignItems="flex-start"
              gap={layoutConfig.gap}
              mb={0}
              sx={{
                overflow: "visible",
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              {/* Remaining filter fields */}
              <Box
                display="flex"
                gap={layoutConfig.gap}
                sx={{
                  flex: "1 1 auto",
                  minWidth: 0,
                  alignItems: "flex-start",
                }}
              >
                {filterFields.slice(layoutConfig.fieldsPerRow).map((f) => (
                  <Box
                    key={f.name}
                    sx={{
                      flex: "1 1 0",
                      minWidth: "140px",
                      maxWidth: "220px",
                    }}
                  >
                    {renderFilterField(f)}
                  </Box>
                ))}

                {/* Search Buttons */}
                <Box display="flex" gap={1} sx={{ flexShrink: 0, pt: 0.5 }}>
                  <IconButton
                    onClick={handleSearchClick}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                      width: layoutConfig.iconSize,
                      height: layoutConfig.iconSize,
                      borderRadius: "50%",
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={handleClearSearch}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                      width: layoutConfig.iconSize,
                      height: layoutConfig.iconSize,
                      borderRadius: "50%",
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    <SearchOffIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Export Buttons */}
              <Box display="flex" gap={1} sx={{ flexShrink: 0, pt: 0.5 }}>
                <ExportButton
                  label="Export PDF"
                  onClick={() =>
                    exportElementToPDF(
                      pdfRef,
                      "รายงานการแจ้งเตือนเจ้าหน้าที่.pdf"
                    )
                  }
                  size={layoutConfig.buttonSize}
                  sx={{
                    minWidth: "120px",
                    height: layoutConfig.inputHeight,
                    fontSize: "12px",
                  }}
                />
                <ExportButton
                  label="Export Excel"
                  onClick={handleExportExcel}
                  size={layoutConfig.buttonSize}
                  sx={{
                    minWidth: "120px",
                    height: layoutConfig.inputHeight,
                    fontSize: "12px",
                  }}
                />
              </Box>
            </Box>
          </>
        ) : (
          // Single Row Layout (Large screens)
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={layoutConfig.gap}
            sx={{
              overflow: "visible",
              flexWrap: isLarge ? "wrap" : "nowrap",
            }}
          >
            {/* Left Section: Filters + Search */}
            <Box
              display="flex"
              alignItems="center"
              gap={layoutConfig.gap}
              sx={{
                flexGrow: 1,
                overflow: "visible",
                minWidth: 0,
                flexWrap: isLarge ? "wrap" : "nowrap",
              }}
            >
              {filterFields.map((f, index) => (
                <Box
                  key={f.name}
                  sx={{
                    flex: isLarge
                      ? `1 1 ${100 / Math.min(3, filterFields.length)}%`
                      : "1 1 0",
                    minWidth: isLarge ? "150px" : "120px",
                    maxWidth: isLarge ? "250px" : "none",
                  }}
                >
                  {renderFilterField(f)}
                </Box>
              ))}

              {/* Search Buttons */}
              <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                    width: layoutConfig.iconSize,
                    height: layoutConfig.iconSize,
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                    mt: 1,
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                    width: layoutConfig.iconSize,
                    height: layoutConfig.iconSize,
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                    mt: 1,
                  }}
                >
                  <SearchOffIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Right Section: Export Buttons */}
            <Box
              display="flex"
              gap={1}
              sx={{
                flexShrink: 0,
                alignItems: "center",
                ...(isLarge && {
                  width: "100%",
                  justifyContent: "center",
                  pt: 1,
                }),
              }}
            >
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    "รายงานการแจ้งเตือนเจ้าหน้าที่.pdf"
                  )
                }
                size={layoutConfig.buttonSize}
                sx={{
                  minWidth: "120px",
                  height: layoutConfig.inputHeight,
                  fontSize: "12px",
                  mt: 1,
                }}
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                size={layoutConfig.buttonSize}
                sx={{
                  minWidth: "120px",
                  height: layoutConfig.inputHeight,
                  fontSize: "12px",
                  mt: 1,
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Data Table with conditional scrollbar */}
      <div ref={pdfRef}>
        <Box
          className={styles.tableWrapper}
          id="table-results"
          sx={{
            overflowX: needsScrollbar ? "auto" : "visible",
            px: layoutConfig.padding,
            pb: 1,
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#c1c1c1",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "#a8a8a8",
              },
            },
          }}
        >
          <Table
            sx={{
              minWidth: needsScrollbar ? 1400 : "100%",
              width: "100%",
              tableLayout: needsScrollbar ? "auto" : "fixed",
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  align="center"
                  sx={{
                    width: 80,
                    minWidth: 80,
                    backgroundColor: "#e8e9f6",
                    fontWeight: 600,
                    color: "#1120a3",
                    border: "1px solid #e0e0e0",

                    padding: "14px 12px", // Keep consistent padding
                    // Add responsive styles only for very small screens if needed
                    "@media (max-width: 599px)": {
                      padding: "8px 4px",
                    },
                  }}
                >
                  ลำดับ
                </TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col.name}
                    sx={{
                      width: needsScrollbar ? col.width : "auto",
                      minWidth: needsScrollbar ? col.width : "auto",
                      backgroundColor: "#e8e9f6",
                      fontWeight: 600,
                      color: "#1120a3",
                      border: "1px solid #e0e0e0",

                      padding: "14px 12px", // Keep consistent padding
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      // Add responsive styles only for very small screens if needed
                      "@media (max-width: 599px)": {
                        padding: "8px 4px",
                      },
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
                    "&:hover": {
                      backgroundColor: "#f5f7ff",
                      transform: "scale(1.001)",
                      transition: "all 0.2s ease-in-out",
                    },
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{
                      width: 80,
                      minWidth: 80,
                      fontWeight: 600,
                      color: "#1120A3",
                      border: "1px solid #e0e0e0",

                      padding: "14px 12px", // Keep consistent padding
                      // Add responsive styles only for very small screens if needed
                      "@media (max-width: 599px)": {
                        padding: "6px 4px",
                      },
                    }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell
                      key={col.name}
                      sx={{
                        width: needsScrollbar ? col.width : "auto",
                        minWidth: needsScrollbar ? col.width : "auto",
                        border: "1px solid #e0e0e0",

                        padding: "14px 12px", // Keep consistent padding
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        // Add responsive styles only for very small screens if needed
                        "@media (max-width: 599px)": {
                          padding: "6px 4px",
                        },
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
                padding: "16px", // Keep consistent padding
                // Add responsive styles only for very small screens if needed
                "@media (max-width: 599px)": {
                  padding: "6px",
                },
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  fontSize: "14px", // Keep consistent font size
                  // Add responsive styles only for very small screens if needed
                  "@media (max-width: 599px)": {},
                },
            }}
          />
        </Box>
      </div>
    </Container>
  );
};

export default TableListStaffNoti;
