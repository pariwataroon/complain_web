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
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import { exportElementToPDF } from "@utils/exportPDF";

import styles from "./TableListBox.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import { exportExcel } from "@utils/exportExcel";

const TableListBox = ({
  data = [],
  title = "",
  navigateTo = "",
  onRowClick,
  onSearch = () => {},
  onResetSearch,
  filterFields = [],
}) => {
  const router = useRouter();
  const tableWrapperRef = useRef(null); // ใช้ wrapper เดียวสำหรับ Export PDF

  // Breakpoints
  const isExtraSmall = useMediaQuery("(max-width:640px)");
  const isSmall = useMediaQuery("(max-width:768px)");
  const isMedium = useMediaQuery("(max-width:1024px)");
  const isLarge = useMediaQuery("(max-width:1305px)");
  const needsScrollbar = useMediaQuery("(max-width:1200px)");

  // Filters
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);
  const handleChange = (field) => (e) =>
    setFilters({ ...filters, [field]: e?.target ? e.target.value : e });

  // Pagination
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

  // Search
  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearSearch = () => {
    setFilters(initialFilters);
    setPage(0);
    if (onResetSearch) onResetSearch();
    else onSearch(initialFilters);
  };

  // Export PDF
  const handleExportPDF = () => {
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `คลังเรื่องราวร้องทุกข์_${title}_${today}.pdf`;
    exportElementToPDF(tableWrapperRef, filename);
  };

  // Columns (ใช้ร่วมกันทั้งหัว/ตัวข้อมูล + colgroup)
  const columns = [
    { name: "receiveDate", label: "วันที่ร้อง", width: 120 },
    { name: "agency", label: "หน่วยงาน", width: 200 },
    { name: "claimantName", label: "ชื่อสกุลผู้ร้อง", width: 200 },
    { name: "issue", label: "เรื่อง", width: 200 },
    { name: "issueType", label: "ประเภทเรื่อง", width: 200 },
    { name: "subIssueType", label: "ประเภทเรื่องย่อย", width: 200 },
    { name: "responsibleOfficer", label: "เจ้าหน้าที่รับผิดชอบ", width: 200 },
    { name: "status", label: "สถานะเรื่อง", width: 140 },
    { name: "note", label: "หมายเหตุ", width: 140 },
  ];

  // Export Excel
  const handleExportExcel = () => {
    if (!Array.isArray(pagedData) || pagedData.length === 0) {
      alert("ไม่มีข้อมูลที่จะแสดงใน Excel");
      return;
    }
    const exportData = pagedData.map((item, idx) => {
      const row = { ลำดับ: page * rowsPerPage + idx + 1 };
      columns.forEach((col) => {
        row[col.label] = item[col.name] ?? "-";
      });
      return row;
    });
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `คลังเรื่องราวร้องทุกข์_${today}.xlsx`;
    exportExcel(exportData, filename);
  };

  // Row click
  const handleRowClick = (item) => {
    if (onRowClick) {
      onRowClick(item);
    } else if (navigateTo) {
      router.push(`${navigateTo}/${item.id}`);
    }
  };

  // Layout config
  const getLayoutConfig = () => {
    if (isExtraSmall) {
      return {
        layout: "stacked",
        fieldsPerRow: 1,
        gap: 1,
        padding: 1,
        inputHeight: "40px",
        iconSize: 36,
      };
    } else if (isSmall) {
      return {
        layout: "stacked",
        fieldsPerRow: 2,
        gap: 1,
        padding: 1.5,
        inputHeight: "40px",
        iconSize: 40,
      };
    } else if (isMedium) {
      return {
        layout: "two-row",
        fieldsPerRow: 3,
        gap: 1.5,
        padding: 2,
        inputHeight: "40px",
        iconSize: 40,
      };
    } else if (isLarge) {
      return {
        layout: "large-responsive",
        fieldsPerRow: Math.min(4, filterFields.length),
        gap: 1.5,
        padding: 2,
        inputHeight: "40px",
        iconSize: 40,
      };
    }
    return {
      layout: "single-row",
      fieldsPerRow: filterFields.length,
      gap: 1.5,
      padding: 2,
      inputHeight: "40px",
      iconSize: 40,
    };
  };
  const layoutConfig = getLayoutConfig();

  // Common filter styles
  const getFilterFieldStyles = () => ({
    "& .MuiInputBase-root": { height: layoutConfig.inputHeight },
    "& .MuiInputLabel-root": { fontSize: isExtraSmall ? "13px" : "14px" },
    "& .MuiInputBase-input": { fontSize: isExtraSmall ? "13px" : "14px" },
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
      {/* Header (เส้น/พื้นที่) */}
      <Box
        className={styles.headerBar}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      />

      {/* Title + Export */}
      <Box
        mt={2}
        className={styles.headerBar2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={isExtraSmall ? 1 : 2}
        sx={{
          flexDirection: isExtraSmall ? "column" : "row",
          gap: isExtraSmall ? 1 : 0,
        }}
      >
        <Box
          sx={{
            fontSize: isExtraSmall ? "16px" : "18px",
            fontWeight: "bold",
            color: "#1120a3",
          }}
        >
          {title}
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            flexDirection: isExtraSmall ? "column" : "row",
            width: isExtraSmall ? "100%" : "auto",
          }}
        >
          <ExportButton
            label="Export PDF"
            sx={{
              fontSize: isExtraSmall ? "12px" : "14px",
              minWidth: isExtraSmall ? "120px" : "auto",
            }}
            onClick={handleExportPDF}
          />
          <ExportButton
            label="Export Excel"
            onClick={handleExportExcel}
            sx={{
              fontSize: isExtraSmall ? "12px" : "14px",
              minWidth: isExtraSmall ? "120px" : "auto",
            }}
          />
        </Box>
      </Box>

      {/* Filters — Responsive Layouts */}
      <Box
        width="100%"
        px={layoutConfig.padding}
        py={layoutConfig.padding}
        sx={{ overflow: "visible", boxSizing: "border-box" }}
      >
        {layoutConfig.layout === "stacked" ? (
          <>
            <Box
              display="grid"
              gridTemplateColumns={`repeat(${layoutConfig.fieldsPerRow}, 1fr)`}
              gap={layoutConfig.gap}
              mb={2}
              sx={{ overflow: "visible", width: "100%" }}
            >
              {filterFields.map((f) => (
                <Box key={f.name} sx={{ minWidth: 0 }}>
                  {renderFilterField(f)}
                </Box>
              ))}
            </Box>

            <Box display="flex" justifyContent="center" gap={1} mb={2}>
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
                  width: layoutConfig.iconSize,
                  height: layoutConfig.iconSize,
                  borderRadius: "50%",
                  transition: "background-color 0.2s",
                }}
                title="ค้นหา"
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#dc3545",
                  color: "#fff",
                  "&:hover": { bgcolor: "#c82333" },
                  width: layoutConfig.iconSize,
                  height: layoutConfig.iconSize,
                  borderRadius: "50%",
                  transition: "background-color 0.2s",
                }}
                title="ล้างการค้นหา"
              >
                <CleaningServicesIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        ) : layoutConfig.layout === "two-row" ? (
          <>
            <Box
              display="grid"
              gridTemplateColumns="repeat(3, 1fr)"
              gap={layoutConfig.gap}
              mb={2}
              sx={{ overflow: "visible", width: "100%" }}
            >
              {filterFields.slice(0, 3).map((f) => (
                <Box key={f.name} sx={{ minWidth: 0 }}>
                  {renderFilterField(f)}
                </Box>
              ))}
            </Box>

            <Box
              display="flex"
              alignItems="center"
              gap={layoutConfig.gap}
              mb={2}
              sx={{ overflow: "visible", width: "100%" }}
            >
              {filterFields.slice(3).map((f) => (
                <Box key={f.name} sx={{ flex: "1 1 0", minWidth: 0 }}>
                  {renderFilterField(f)}
                </Box>
              ))}
              <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0b1580" },
                    width: layoutConfig.iconSize,
                    height: layoutConfig.iconSize,
                    borderRadius: "50%",
                    transition: "background-color 0.2s",
                    mt: 1,
                  }}
                  title="ค้นหา"
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    bgcolor: "#dc3545",
                    color: "#fff",
                    "&:hover": { bgcolor: "#c82333" },
                    width: layoutConfig.iconSize,
                    height: layoutConfig.iconSize,
                    borderRadius: "50%",
                    transition: "background-color 0.2s",
                    mt: 1,
                  }}
                  title="ล้างการค้นหา"
                >
                  <CleaningServicesIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </>
        ) : layoutConfig.layout === "large-responsive" ? (
          <>
            <Box
              display="grid"
              gridTemplateColumns={`repeat(${Math.min(
                4,
                filterFields.length
              )}, 1fr)`}
              gap={layoutConfig.gap}
              mb={2}
              sx={{ overflow: "visible", width: "100%" }}
            >
              {filterFields
                .slice(0, Math.min(4, filterFields.length))
                .map((f) => (
                  <Box key={f.name} sx={{ minWidth: 0 }}>
                    {renderFilterField(f)}
                  </Box>
                ))}
            </Box>

            {filterFields.length > 4 && (
              <Box
                display="flex"
                alignItems="center"
                gap={layoutConfig.gap}
                mb={2}
                sx={{ overflow: "visible", width: "100%" }}
              >
                {filterFields.slice(4).map((f) => (
                  <Box key={f.name} sx={{ flex: "1 1 0", minWidth: 0 }}>
                    {renderFilterField(f)}
                  </Box>
                ))}
                <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
                  <IconButton
                    onClick={handleSearchClick}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": { bgcolor: "#0b1580" },
                      width: layoutConfig.iconSize,
                      height: layoutConfig.iconSize,
                      borderRadius: "50%",
                      transition: "background-color 0.2s",
                      mt: 1,
                    }}
                    title="ค้นหา"
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={handleClearSearch}
                    sx={{
                      bgcolor: "#dc3545",
                      color: "#fff",
                      "&:hover": { bgcolor: "#c82333" },
                      width: layoutConfig.iconSize,
                      height: layoutConfig.iconSize,
                      borderRadius: "50%",
                      transition: "background-color 0.2s",
                      mt: 1,
                    }}
                    title="ล้างการค้นหา"
                  >
                    <CleaningServicesIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}

            {filterFields.length <= 4 && (
              <Box display="flex" justifyContent="center" gap={1} mb={2}>
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0b1580" },
                    width: layoutConfig.iconSize,
                    height: layoutConfig.iconSize,
                    borderRadius: "50%",
                    transition: "background-color 0.2s",
                  }}
                  title="ค้นหา"
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    bgcolor: "#dc3545",
                    color: "#fff",
                    "&:hover": { bgcolor: "#c82333" },
                    width: layoutConfig.iconSize,
                    height: layoutConfig.iconSize,
                    borderRadius: "50%",
                    transition: "background-color 0.2s",
                  }}
                  title="ล้างการค้นหา"
                >
                  <CleaningServicesIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </>
        ) : (
          // Single-row layout (>1305px)
          <Box
            display="flex"
            alignItems="center"
            gap={layoutConfig.gap}
            sx={{ overflow: "visible", flexWrap: "nowrap" }}
          >
            {filterFields.map((f) => (
              <Box
                key={f.name}
                sx={{ flex: "1 1 0", minWidth: "140px", maxWidth: "200px" }}
              >
                {renderFilterField(f)}
              </Box>
            ))}

            <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
                  width: layoutConfig.iconSize,
                  height: layoutConfig.iconSize,
                  borderRadius: "50%",
                  transition: "background-color 0.2s",
                  mt: 1,
                }}
                title="ค้นหา"
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#dc3545",
                  color: "#fff",
                  "&:hover": { bgcolor: "#c82333" },
                  width: layoutConfig.iconSize,
                  height: layoutConfig.iconSize,
                  borderRadius: "50%",
                  transition: "background-color 0.2s",
                  mt: 1,
                }}
                title="ล้างการค้นหา"
              >
                <CleaningServicesIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Data Table — ใช้ Table เดียว + colgroup + fixed layout + scroll แนวนอน */}
      <Box
        className={styles.tableWrapper}
        id="table-results"
        sx={{ px: layoutConfig.padding, pb: 1 }}
      >
        <Box
          ref={tableWrapperRef}
          sx={{
            mx: isExtraSmall ? 1 : 3,
            mb: 3,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f1f3f4",
          }}
        >
          <Box
            sx={{
              overflowX: "auto",
              "&::-webkit-scrollbar": { height: "8px" },
              "&::-webkit-scrollbar-track": { backgroundColor: "#f8f9fa" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#dee2e6",
                borderRadius: "3px",
                "&:hover": { backgroundColor: "#adb5bd" },
              },
            }}
          >
            <Table
              sx={{
                minWidth: needsScrollbar ? 1600 : "100%",
                tableLayout: "fixed", // สำคัญ: ให้หัวและตัวข้อมูลคำนวณคอลัมน์เหมือนกัน
                borderCollapse: "collapse",
              }}
            >
              <colgroup>
                {columns.map((col) => (
                  <col key={col.name} style={{ width: col.width }} />
                ))}
              </colgroup>

              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#f8f9fa",
                    "& th": {
                      borderBottom: "1px solid #e9ecef",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#495057",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "16px 20px",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.name}
                      sx={{
                        backgroundColor: "#e8e9f6",
                        fontWeight: 600,
                        color: "#1120a3",
                        borderBottom: "1px solid #e0e0e0",
                        borderRight: "1px solid #e0e0e0",
                        "&:last-child": { borderRight: "none" },
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {pagedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      align="center"
                      sx={{ padding: "60px 20px", borderBottom: "none" }}
                    >
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={2}
                      >
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            backgroundColor: "#f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            sx={{ fontSize: "24px", color: "#6c757d" }}
                          >
                            📄
                          </Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            color: "#6c757d",
                            fontWeight: 500,
                            fontSize: "16px",
                          }}
                        >
                          ไม่พบข้อมูลที่ค้นหา
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "#adb5bd", fontSize: "14px" }}
                        >
                          กรุณาลองปรับเปลี่ยนเงื่อนไขการค้นหา
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedData.map((item) => (
                    <TableRow
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      sx={{
                        cursor: "pointer",
                        transition: "background-color 0.18s",
                        "&:hover": {
                          backgroundColor: "#e5eaff",
                        },
                      }}
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={col.name}
                          sx={{
                            borderBottom: "1px solid #e0e0e0",
                            borderRight: "1px solid #e0e0e0",
                            fontSize: "14px",
                            padding: "14px 12px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            "&:last-child": { borderRight: "none" },
                          }}
                          title={item[col.name] ?? "-"}
                        >
                          {item[col.name] ?? "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>

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
              fontSize: "14px",
              padding: "16px",
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { fontSize: "14px" },
          }}
        />
      </Box>
    </Container>
  );
};

export default TableListBox;
