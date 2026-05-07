import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Container,
  IconButton,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";

import styles from "./TableListTab.module.scss";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";

// ← เพิ่ม try-catch และ fallback สำหรับ imports
let InputText, SelectField, ExportButton, DateThaiPickerService;

try {
  InputText = require("@services/InputText/InputText").default;
} catch (e) {
  console.warn("InputText import failed:", e);
  InputText = null;
}

try {
  SelectField = require("@services/SelectField/SelectField").default;
} catch (e) {
  console.warn("SelectField import failed:", e);
  SelectField = null;
}

try {
  ExportButton = require("@services/ExportButton/ExportButton").default;
} catch (e) {
  console.warn("ExportButton import failed:", e);
  ExportButton = null;
}

try {
  DateThaiPickerService =
    require("@services/DateThaiPickerService/DateThaiPickerService").default;
} catch (e) {
  console.warn("DateThaiPickerService import failed:", e);
  DateThaiPickerService = null;
}

const TableListTab = ({
  summaryData = [],
  pendingData = [],
  loading = false,
  onSearch = () => {},
  filterFields = [],
  navigateTo = "",
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));

  // tab state
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_, idx) => {
    setTabIndex(idx);
    setPage(0);
  };

  // filters state - แก้ไขให้รองรับทั้ง string และ object (สำหรับ date)
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = f.type === "date" ? null : "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  // pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ---- แก้ไขส่วนนี้ ----
  // ฟังก์ชันแปลงวันที่เป็นปีไทย
  const getThaiYear = (dateObj) => {
    if (!(dateObj instanceof Date) || isNaN(dateObj)) return "";
    return dateObj.getFullYear() + 543;
  };
  // ฟังก์ชันแปลงวันที่เป็นช่วง label (ถ้าเลือกช่วง)
  const getPendingBetweenLabel = () => {
    // กรณีเลือกทั้ง 2 วัน
    if (filters.receiveDateFrom && filters.receiveDateTo) {
      const fromD = new Date(filters.receiveDateFrom);
      const toD = new Date(filters.receiveDateTo);
      return `เรื่องค้างพิจารณาระหว่าง ปีงบประมาณ พ.ศ. ${getThaiYear(fromD)} - ${getThaiYear(toD)}`;
    }
    // กรณีเลือกวันเดียว
    if (filters.receiveDateFrom) {
      const fromD = new Date(filters.receiveDateFrom);
      return `เรื่องค้างพิจารณาประจำปีงบประมาณ พ.ศ. ${getThaiYear(fromD)}`;
    }
    if (filters.receiveDateTo) {
      const toD = new Date(filters.receiveDateTo);
      return `เรื่องค้างพิจารณาถึง ปีงบประมาณ พ.ศ. ${getThaiYear(toD)}`;
    }
    // default
    return "เรื่องค้างพิจารณาระหว่าง ปีงบประมาณ";
  };
  // ---- end ----

  // define columns for each tab
  const currentYear = new Date().getFullYear() + 543;
  const columnsByTab = [
    // Tab 0: ผลการดำเนินเรื่องร้องทุกข์
    [
      {
        field: "claimantName",
        headerName: "ผู้ตรวจราชการกระทรวงการคลัง",
        align: "left",
      },
      { field: "totalDept", headerName: "จำนวน", align: "center" },
      {
        field: "inProgressCnt",
        headerName: "อยู่ระหว่างดำเนินการ",
        align: "center",
      },
      { field: "closedCnt", headerName: "ยุติ", align: "center" },
    ],
    // Tab 1: เรื่องค้างการพิจารณา
    [
      {
        field: "claimantName",
        headerName: "ผู้ตรวจราชการกระทรวงการคลัง",
        align: "left",
      },
      {
        field: "pendingBetween",
        headerName: getPendingBetweenLabel(), // ← ใช้ label ตามวันที่เลือก
        align: "center",
      },
      {
        field: "inProcessFY2568",
        headerName: `อยู่ระหว่างดำเนินการ ปีงบประมาณ พ.ศ. ${currentYear}`, // ← ใช้ปีปัจจุบัน
        align: "center",
      },
      { field: "total", headerName: "รวม", align: "center" },
    ],
  ];

  const currentColumns = columnsByTab[tabIndex];
  const currentData = tabIndex === 0 ? summaryData : pendingData;

  // pagedData recalculated when currentData, page or rowsPerPage change
  const pagedData = useMemo(
    () =>
      currentData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [currentData, page, rowsPerPage]
  );

  // ← ปรับปรุง filter handlers ให้รองรับ date และ debug ดีขึ้น
  const handleChangeFilter = (name) => (value) => {
    let newValue;
    if (value && value.target) {
      newValue = value.target.value;
    } else {
      newValue = value;
    }
    setFilters((prev) => {
      const updated = { ...prev, [name]: newValue };
      return updated;
    });
  };

  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };

  const handleClearClick = () => {
    const clearedFilters = { ...initialFilters };
    setFilters(clearedFilters);
    setPage(0);
    onSearch(clearedFilters);
  };

  // pagination handlers
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };

  // compute totals for summary row
  const totals = currentColumns.reduce((acc, col) => {
    if (col.field !== "claimantName") {
      acc[col.field] = currentData.reduce(
        (sum, row) => sum + (Number(row[col.field]) || 0),
        0
      );
    }
    return acc;
  }, {});

  // ← ปรับปรุงฟังก์ชัน renderFilterField ให้มี fallback และ debug
  const renderFilterField = (field) => {
    switch (field.type) {
      case "date":
        if (DateThaiPickerService) {
          return (
            <DateThaiPickerService
              label={field.label}
              value={filters[field.name]}
              onChange={handleChangeFilter(field.name)}
              placeholder={field.placeholder || "กรุณาเลือกวันที่"}
              minDate={field.minDate}
              maxDate={field.maxDate}
            />
          );
        }
        return (
          <TextField
            fullWidth
            label={field.label}
            type="date"
            value={filters[field.name] || ""}
            onChange={handleChangeFilter(field.name)}
            placeholder={field.placeholder}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        );

      case "select":
        if (SelectField) {
          return (
            <SelectField
              fullWidth
              label={field.label}
              options={field.options || []}
              value={filters[field.name]}
              onChange={handleChangeFilter(field.name)}
              name={field.name}
            />
          );
        }
        return (
          <TextField
            fullWidth
            label={field.label}
            value={filters[field.name]}
            onChange={handleChangeFilter(field.name)}
            placeholder={field.placeholder}
            sx={{ mb: 2 }}
          />
        );

      default:
        if (InputText) {
          return (
            <InputText
              fullWidth
              label={field.label}
              value={filters[field.name]}
              onChange={handleChangeFilter(field.name)}
              placeholder={field.placeholder}
            />
          );
        }
        return (
          <TextField
            fullWidth
            label={field.label}
            value={filters[field.name]}
            onChange={handleChangeFilter(field.name)}
            placeholder={field.placeholder}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  const handleExportExcel = () => {
    const today = new Date().toLocaleDateString("th-TH");
    const columns = columnsByTab[tabIndex];
    const data = tabIndex === 0 ? summaryData : pendingData;

    // ✅ สร้างชื่อหัวตาราง (headerName) ให้เป็น string ทั้งหมด
    const exportColumns = columns.map((col, idx) => {
      return col.headerName?.toString() || col.field?.toString() || `คอลัมน์ ${idx + 1}`;
    });

    // ✅ แปลงข้อมูลแต่ละแถวเป็น array of string
    const exportData = data.map((row) =>
      columns.map((col) => {
        const value = row?.[col.field];
        return value !== undefined && value !== null ? value.toString() : "-";
      })
    );

    const totalRow = columns.map((col, idx) => {
      if (idx === 0) return "รวม";
      const val = totals?.[col.field];
      return val !== undefined && val !== null ? val.toString() : "-";
    });

    const finalExportData = [
      Array(columns.length).fill(""),
      Array(columns.length).fill(""),
      exportColumns,
      ...exportData,
      totalRow,
    ];

    exportExcel(finalExportData, {
      filename: `ผลการดำเนินการและเรื่องค้างพิจารณา_${today}.xlsx`,
      sheetName: "Sheet1",
      title:
        tabIndex === 0
          ? "ผลการดำเนินการและเรื่องค้างพิจารณา"
          : "เรื่องค้างพิจารณาตามปีงบประมาณ",
      exportDate: `วันที่ส่งออก: ${today}`,
    });
  };

  const renderExportButton = (label, onClick) => {
    if (ExportButton) {
      return <ExportButton label={label} onClick={onClick} />;
    }
    return (
      <button
        onClick={onClick}
        style={{
          padding: isMobile ? "6px 12px" : "8px 16px",
          backgroundColor: "#1120A3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: isMobile ? "12px" : "14px",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
      }}
    >
      {/* Tabs */}
      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            sx={{
              ".MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                fontSize: isMobile ? "12px" : "14px",
                minWidth: isMobile ? 120 : 180,
                padding: isMobile ? "8px 12px" : "12px 24px",
              },
            }}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
          >
            <Tab
              label="ผลการดำเนินเรื่องร้องทุกข์"
              sx={{
                textTransform: "none",
                height: 40,
                lineHeight: "40px",
                backgroundColor: "#878FD0",
                color: "#fff",
                borderTopLeftRadius: 10,
                borderTopRightRadius: 25,
                "&:hover": { backgroundColor: "#9AA4FF" },
                "&.Mui-selected": {
                  backgroundColor: "#1120A3",
                  color: "#fff",
                  zIndex: 3,
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: -8,
                    left: 0,
                    width: "100%",
                    height: 8,
                    backgroundColor: "#1120A3",
                  },
                },
              }}
            />
            <Tab
              label="เรื่องค้างการพิจารณา"
              sx={{
                textTransform: "none",
                mr: 1,
                height: 40,
                lineHeight: "40px",
                backgroundColor: "#878FD0",
                color: "#fff",
                borderTopLeftRadius: 10,
                borderTopRightRadius: 25,
                "&:hover": { backgroundColor: "#9AA4FF" },
                "&.Mui-selected": {
                  backgroundColor: "#1120A3",
                  color: "#fff",
                  zIndex: 3,
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: -8,
                    left: 0,
                    width: "100%",
                    height: 8,
                    backgroundColor: "#1120A3",
                  },
                },
              }}
            />
          </Tabs>
        </Box>
        <Box className={styles.headerBar} />
      </Box>

      {/* ← Filters section - Always visible, responsive layout */}
      <Box px={isMobile ? 1 : 2} py={1}>
        <Box
          display="flex"
          alignItems="flex-end"
          gap={1}
          flexWrap="wrap"
          sx={{
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "flex-end",
          }}
        >
          <Box
            display="flex"
            gap={1}
            flexWrap="wrap"
            sx={{
              flex: 1,
              width: "100%",
              flexDirection: isMobile ? "column" : "row",
              "& > *": {
                flex: isMobile
                  ? "1 1 100%"
                  : isTablet
                  ? "1 1 calc(50% - 8px)"
                  : "1 1 0",
                minWidth: isMobile ? "100%" : isTablet ? "200px" : "150px",
                maxWidth: isMobile ? "100%" : "300px",
              },
            }}
          >
            {filterFields.map((f) => (
              <Box key={f.name}>{renderFilterField(f)}</Box>
            ))}
          </Box>

          {/* ปุ่มค้นหาและเคลียร์ */}
          <Box
            display="flex"
            gap={1}
            sx={{
              flexShrink: 0,
              alignItems: "center",
              justifyContent: isMobile ? "center" : "flex-start",
              width: isMobile ? "100%" : "auto",
              mt: isMobile ? 2 : 0,
            }}
          >
            <IconButton
              onClick={handleSearchClick}
              sx={{
                bgcolor: "#1120A3",
                color: "#fff",
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                "&:hover": { bgcolor: "#0b1580" },
              }}
            >
              <SearchIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
            <IconButton
              onClick={handleClearClick}
              sx={{
                bgcolor: "#1120A3",
                color: "#fff",
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                "&:hover": { bgcolor: "#0b1580" },
              }}
            >
              <SearchOffIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Box>

          {/* Export buttons */}
          <Box
            display="flex"
            gap={1}
            sx={{
              flexShrink: 0,
              width: isMobile ? "100%" : "auto",
              justifyContent: isMobile ? "center" : "flex-end",
              mt: isMobile ? 1 : 0,
            }}
          >
            {renderExportButton("Export PDF", () =>
              exportElementToPDF(
                pdfRef,
                "ผลการดำเนินการและเรื่องค้างพิจารณา.pdf"
              )
            )}
            {renderExportButton("Export Excel", handleExportExcel)}
          </Box>
        </Box>
      </Box>

      {/* Table */}
      <div ref={pdfRef}>
        <Box
          className={styles.tableWrapper}
          sx={{
            overflowX: "auto",
            px: isMobile ? 1 : 2,
            pb: 1,
          }}
        >
          <Table sx={{ minWidth: isMobile ? 400 : 600, tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                {currentColumns.map((col) => (
                  <TableCell
                    key={col.field}
                    align={col.align}
                    sx={{
                      fontSize: isMobile ? "12px" : "14px",
                      padding: isMobile ? "8px 4px" : "16px",
                    }}
                  >
                    {col.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={currentColumns.length}
                    align="center"
                    sx={{ py: 6, fontSize: isMobile ? "14px" : "16px", color: "#888" }}
                  >
                    กำลังโหลดข้อมูล...
                  </TableCell>
                </TableRow>
              ) : (
              pagedData.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() =>
                    navigateTo && router.push(`${navigateTo}/${row.id}`)
                  }
                >
                  {currentColumns.map((col) => (
                    <TableCell
                      key={col.field}
                      align={col.align}
                      sx={{
                        fontSize: isMobile ? "12px" : "14px",
                        padding: isMobile ? "8px 4px" : "16px",
                      }}
                    >
                      {row[col.field]}
                    </TableCell>
                  ))}
                </TableRow>
              )))}

              {/* summary row */}
              {!loading && (
              <TableRow sx={{ backgroundColor: "#e3f2fd", fontWeight: "bold" }}>
                {currentColumns.map((col) =>
                  col.field === "claimantName" ? (
                    <TableCell
                      key={col.field}
                      sx={{
                        fontSize: isMobile ? "12px" : "14px",
                        padding: isMobile ? "8px 4px" : "16px",
                      }}
                    >
                      รวม
                    </TableCell>
                  ) : (
                    <TableCell
                      key={col.field}
                      align={col.align}
                      sx={{
                        fontSize: isMobile ? "12px" : "14px",
                        padding: isMobile ? "8px 4px" : "16px",
                      }}
                    >
                      {totals[col.field]}
                    </TableCell>
                  )
                )}
              </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25]}
            component="div"
            count={currentData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{
              borderTop: "1px solid #eee",
              "& .MuiTablePagination-toolbar": {
                fontSize: isMobile ? "12px" : "14px",
              },
            }}
          />
        </Box>
      </div>
    </Container>
  );
};

export default TableListTab;