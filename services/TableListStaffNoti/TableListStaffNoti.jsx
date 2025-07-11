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
import ExportButton from "@services/ExportButton/ExportButton";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";
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
    { name: "claimantName", label: "ชื่อ - สกุล (ผู้ร้อง)", width: 200 },
    { name: "issue", label: "ชื่อเรื่อง", width: 200 },
    {
      name: "responsibleOfficer",
      label: "เจ้าหน้าที่ผู้รับผิดชอบ",
      width: 200,
    },
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
        layout: "two-row", // New layout for medium screens
        fieldsPerRow: 3,
        fieldWidth: "calc(33.33% - 6px)",
        buttonSize: "small",
        gap: 1.5,
        padding: 2,
        inputHeight: "40px",
        iconSize: 40,
      };
    } else if (isLarge) {
      return {
        layout: "single-row",
        fieldsPerRow: filterFields.length,
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

    return f.type === "select" ? (
      <SelectField {...commonProps} options={f.options} />
    ) : (
      <InputText {...commonProps} />
    );
  };

const handleExportExcel = () => {
  if (!data || data.length === 0) {
    alert("ไม่มีข้อมูลสำหรับ export");
    return;
  }

  const today = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const exportData = data.map((item, index) => ({
    ลำดับ: index + 1,
    "ชื่อ - สกุล (ผู้ร้อง)": item.claimantName || "-",
    "ชื่อเรื่อง": item.issue || "-",
    "เจ้าหน้าที่ผู้รับผิดชอบ": item.responsibleOfficer || "-",
    "เลข สรร.": item.receiptNumber || "-",
    "วันที่เจ้าหน้าที่รับเรื่อง": item.officerReceiveDate || "-",
    "หัวข้อ": item.issueType || "-",
    "จำนวนครั้ง": item.countTimes ?? "-",
  }));

  exportExcel(exportData, {
    filename: `รายงานการแจ้งเตือนเจ้าหน้าที่_${today}.xlsx`,
    sheetName: "เรื่องร้องเรียน",
    title: "รายงานการแจ้งเตือนเจ้าหน้าที่",
    exportDate: `วันที่ ${today}`,
  });
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
                    "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf"
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
          // Two-row Layout (Medium screens below 1025px)
          <>
            {/* First Row - First 3 fields */}
            <Box
              display="grid"
              gridTemplateColumns="repeat(3, 1fr)"
              gap={layoutConfig.gap}
              mb={2}
              sx={{
                overflow: "visible",
                width: "100%",
              }}
            >
              {filterFields.slice(0, 3).map((f) => (
                <Box key={f.name} sx={{ minWidth: 0 }}>
                  {renderFilterField(f)}
                </Box>
              ))}
            </Box>

            {/* Second Row - Remaining fields + Search Buttons */}
            <Box
              display="flex"
              alignItems="center"
              gap={layoutConfig.gap}
              mb={2}
              sx={{
                overflow: "visible",
                width: "100%",
              }}
            >
              {/* Remaining filter fields */}
              {filterFields.slice(3).map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    flex: "1 1 0",
                    minWidth: 0,
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

            {/* Export Buttons */}
            <Box display="flex" justifyContent="center" gap={1}>
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf"
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
                    "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf"
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
