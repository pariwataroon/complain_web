import React, { useState, useMemo, useRef, useEffect } from "react";
import PropTypes from "prop-types";
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
  Collapse,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  SearchOff as SearchOffIcon,
} from "@mui/icons-material";

import styles from "./TableWorkFollow.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import ButtonService from "@services/ButtonService/ButtonService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";

// --- Thai Date formatter helper ---
function formatThaiDate(date) {
  if (!date) return "-";
  let d = date;
  if (typeof date === "string" && !/^\d+$/.test(date)) {
    // try parse with Date (skip year-only string)
    const parsed = new Date(date);
    if (!isNaN(parsed)) d = parsed;
    else return date; // fallback
  }
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    // string in yyyy-mm-dd
    d = new Date(d);
  }
  if (!(d instanceof Date) || isNaN(d)) return "-";
  const day = d.getDate();
  const month = d.toLocaleString("th-TH", { month: "long" });
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}
const TableWorkFollow = ({
  data = [],
  filterFields = [],
  onSearch = () => {},
  navigateTo = "",
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isSm = useMediaQuery(theme.breakpoints.down("md"));
  const isBelow1100 = useMediaQuery("(max-width:1100px)");

  // Mount state for date picker
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const style = document.createElement("style");
    style.textContent = `
      .MuiPopper-root, .MuiDialog-root, .MuiModal-root, .MuiPickersPopper-root,
      .MuiDateCalendar-root, .MuiPickersDay-root, .MuiPickersCalendarHeader-root,
      .MuiPickersYear-root, .MuiPickersMonth-root, .MuiDatePicker-root,
      .MuiPaper-root.MuiPickersPopper-paper {
        z-index: 99999 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  // Group data by responsibleOfficer
  const groupedData = useMemo(
    () =>
      data.reduce((acc, item) => {
        const key = item.responsibleOfficer || "ไม่ระบุ";
        acc[key] = acc[key] || [];
        acc[key].push(item);
        return acc;
      }, {}),
    [data]
  );
  const groupKeys = Object.keys(groupedData);

  // Collapse state for each group
  const [expandedGroups, setExpandedGroups] = useState({});
  const toggleGroup = (key) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // Initial filters and handlers
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const flatData = groupKeys.flatMap((key) => groupedData[key]);
  const pagedGroups = groupKeys.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };
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

  // Columns for display & export (add field mapping for export)
  const columns = [
    { label: "ลำดับ", width: 80, field: "no" },
    {
      label: "เลขรับ สรร.",
      width: 120,
      field: "receiptNumber",
      render: (item) => (
        <>
          {item.receiptNumber}
          <br />
          {/* <small>({item.receiptDate})</small> */}
        </>
      ),
    },
    {
      label: "เลขที่อ้างอิง",
      width: 120,
      field: "referenceNumber",
      render: (item) => (
        <>
          {item.referenceNumber}
          <br />
          {/* <small>({item.proposeDate})</small> */}
        </>
      ),
    },
    { label: "เรื่อง", width: 300, field: "complaint" },
    { label: "วันที่รับงาน", width: 140, field: "receiveDate" },
    { label: "วันที่เสนอ ผอ.สรร.", width: 160, field: "proposeDate" },
    { label: "หน่วยงานในสังกัด", width: 200, field: "agency" },
    { label: "เลขที่หนังสือจากส่วนราชการ", width: 160, field: "letterNumber" },
    { label: "สถานะเรื่อง", width: 140, field: "status" },
    { label: "ดำเนินการมาแล้ว (วัน)", width: 180, field: "elapsedDays" },
    {
      label: "เจ้าหน้าที่ผู้รับผิดชอบ",
      width: 200,
      field: "responsibleOfficer",
    },
  ];

  // Prepare export data: flat array with all fields for export
  const exportData = useMemo(() => {
    let no = 1;
    return Object.entries(groupedData).flatMap(([key, items]) =>
      items.map((item) => ({
        no: no++,
        ...item,
        responsibleOfficer: key,
        receiptDate: item.receiptDate || "",
        proposeDate: item.proposeDate || "",
      }))
    );
  }, [groupedData]);

  // Export Excel (always use JSON mode)
  const handleExportExcel = () => {
    const today = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const filename = `รายงานการติดตามงานค้าง_${today}.xlsx`;
    const exportLabel = `วันที่ export: ${today}`;
    // use Thai header as keys for xlsx
    const jsonExport = exportData.map((row) =>
      Object.fromEntries(
        columns.map((col) => [col.label, row[col.field] ?? ""])
      )
    );
    exportExcel(jsonExport, {
      filename,
      sheetName: "Sheet1",
      title: "รายงานการติดตามงานค้าง",
      exportDate: exportLabel,
    });
  };

  // Date picker props
  const getDatePickerProps = () => {
    if (!isMounted || typeof window === "undefined") {
      return {
        sx: {
          width: "100%",
          position: "relative",
          zIndex: 1000,
        },
      };
    }
    return {
      componentsProps: {
        popper: {
          style: { zIndex: 99999 },
          placement: "bottom-start",
          container: document.body,
        },
      },
      PopperProps: {
        style: { zIndex: 99999 },
        disablePortal: false,
        container: document.body,
      },
      slotProps: {
        popper: {
          style: { zIndex: 99999 },
          container: document.body,
        },
      },
      sx: {
        width: "100%",
        position: "relative",
        zIndex: 1000,
        "& .MuiInputBase-root": { position: "relative", zIndex: 1000 },
        "& .MuiPopper-root": { zIndex: `${99999} !important` },
        "& .MuiDialog-root": { zIndex: `${99999} !important` },
        "& .MuiModal-root": { zIndex: `${99999} !important` },
        "& .MuiPaper-root": { zIndex: `${99999} !important` },
      },
    };
  };
    // ---- ดึงค่า filter มาแสดงในหัวตาราง ----
  // ฟิลด์ filter อาจชื่อไม่ตรง ให้หา key ที่ชื่อคล้าย
  const fieldKey = (name) => filterFields.find(f => f.name.includes(name))?.name || "";
  const receiveDateFromVal = filters[fieldKey("receiveDateFrom")];
  const receiveDateToVal = filters[fieldKey("receiveDateTo")];
  const issueTypeVal = filters[fieldKey("issueType")];

  // format
  const fromText = receiveDateFromVal
    ? formatThaiDate(receiveDateFromVal)
    : "-";
  const toText = receiveDateToVal
    ? formatThaiDate(receiveDateToVal)
    : "-";
  const typeText = issueTypeVal
    ? issueTypeVal
    : "ทั้งหมด";


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
      <Box className={styles.headerBar}></Box>

      {/* Filters Section */}
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
                  sx={{ position: "relative", zIndex: 1000 + index }}
                >
                  {f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size={isXs ? "small" : "medium"}
                      sx={{ position: "relative", zIndex: 1000 + index }}
                    />
                  ) : f.type === "date" ? (
                    <DateThaiPickerService
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleDateChange(f.name)}
                      placeholder={f.placeholder || `เลือก${f.label}`}
                      disabled={f.disabled || false}
                      required={f.required || false}
                      {...getDatePickerProps()}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size={isXs ? "small" : "medium"}
                      sx={{ position: "relative", zIndex: 1000 + index }}
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
              sx={{ position: "relative", zIndex: 500 }}
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
            {/* Export Buttons - Mobile/Tablet */}
            <Box
              display="flex"
              flexDirection="column"
              gap={1.5}
              alignItems="center"
              sx={{ position: "relative", zIndex: 500 }}
            >
              {isXs ? (
                <>
                  <ExportButton
                    label="Export PDF"
                    onClick={() =>
                      exportElementToPDF(pdfRef, "รายงานการติดตามงานค้าง.pdf")
                    }
                    size="small"
                    sx={{ width: "100%", maxWidth: "300px" }}
                  />
                  <ExportButton
                    label="Export Excel"
                    onClick={handleExportExcel}
                    size="small"
                    sx={{ width: "100%", maxWidth: "300px" }}
                  />
                </>
              ) : (
                <Box
                  display="flex"
                  gap={1}
                  width="100%"
                  justifyContent="center"
                >
                  <ExportButton
                    label="Export PDF"
                    onClick={() =>
                      exportElementToPDF(pdfRef, "รายงานการติดตามงานค้าง.pdf")
                    }
                    size="medium"
                    sx={{ flex: 1, maxWidth: "150px" }}
                  />
                  <ExportButton
                    label="Export Excel"
                    onClick={handleExportExcel}
                    size="medium"
                    sx={{ flex: 1, maxWidth: "150px" }}
                  />
                </Box>
              )}
            </Box>
          </>
        ) : (
          // Large Desktop Layout (>= 1100px)
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ position: "relative", zIndex: 1000 }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                flexGrow: 1,
                overflowX: "visible",
                maxWidth: "60%",
                position: "relative",
                zIndex: 1000,
              }}
            >
              {filterFields.map((f, index) => (
                <Box
                  key={f.name}
                  sx={{
                    flex: "1 1 140px",
                    minWidth: "140px",
                    maxWidth: "300px",
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
                      sx={{ position: "relative", zIndex: 1000 + index }}
                    />
                  ) : f.type === "date" ? (
                    <DateThaiPickerService
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleDateChange(f.name)}
                      placeholder={f.placeholder || `เลือก${f.label}`}
                      disabled={f.disabled || false}
                      required={f.required || false}
                      {...getDatePickerProps()}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      sx={{ position: "relative", zIndex: 1000 + index }}
                    />
                  )}
                </Box>
              ))}
              <Box
                display="flex"
                gap={1}
                sx={{ flexShrink: 0, ml: 1, position: "relative", zIndex: 500 }}
              >
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
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
                    width: 40,
                    height: 40,
                    "&:hover": { bgcolor: "#0b1580" },
                    position: "relative",
                    zIndex: 500,
                  }}
                >
                  <SearchOffIcon />
                </IconButton>
              </Box>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{ flexShrink: 0, ml: 2, position: "relative", zIndex: 500 }}
            >
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(pdfRef, "รายงานการติดตามงานค้าง.pdf")
                }
                size="medium"
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                size="medium"
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Report Title */}
      <Box
        sx={{
          backgroundColor: "#EAF5FF",
          p: 2,
          color: "#1120A3",
          textAlign: "center",
          fontSize: { xs: 16, sm: 18, md: 20 },
          fontWeight: "bold",
          position: "relative",
          zIndex: 1,
        }}
      >
        รายงานการติดตามงานค้าง
        <br />
        ตั้งแต่วันที่ {fromText} ถึงวันที่ {toText}
        <br />
        ประเภท {typeText}
      </Box>

      {/* Table with grouped collapsible rows */}
      <div ref={pdfRef}>
        <Box
          sx={{
            overflowX: "auto",
            px: { xs: 1, sm: 2 },
            pb: 1,
            position: "relative",
            zIndex: 1,
            "&::-webkit-scrollbar": { height: "8px" },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888",
              borderRadius: "4px",
              "&:hover": { backgroundColor: "#555" },
            },
          }}
        >
          <Table
            sx={{
              minWidth: 1400,
              position: "relative",
              zIndex: 1,
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((col, i) => (
                  <TableCell
                    key={i}
                    align={i === 0 ? "center" : "left"}
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
              {pagedGroups.map((groupKey) => {
                const items = groupedData[groupKey];
                return (
                  <React.Fragment key={groupKey}>
                    <TableRow
                      sx={{
                        "&:hover": { backgroundColor: "#f5f7ff" },
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <TableCell
                        align="center"
                        sx={{
                          width: 60,
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => toggleGroup(groupKey)}
                        >
                          {expandedGroups[groupKey] ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell
                        colSpan={columns.length + 1}
                        sx={{
                          width: 300,
                          fontSize: { xs: 12, sm: 14 },
                          fontWeight: "bold",
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        {`เจ้าหน้าที่ผู้รับผิดชอบ : ${groupKey}`}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        style={{ padding: 0 }}
                        colSpan={columns.length + 2}
                        sx={{
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        <Collapse
                          in={expandedGroups[groupKey]}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box>
                            <Table size="small">
                              <TableBody
                                sx={{
                                  backgroundColor: "#FEFAEF",
                                  position: "relative",
                                  zIndex: 1,
                                }}
                              >
                                {items.map((item, idx) => (
                                  <TableRow
                                    key={item.id}
                                    sx={{
                                      "&:hover": { backgroundColor: "#f5f7ff" },
                                      cursor: navigateTo
                                        ? "pointer"
                                        : "default",
                                      position: "relative",
                                      zIndex: 1,
                                    }}
                                    onClick={() =>
                                      navigateTo &&
                                      router.push(`${navigateTo}/${item.id}`)
                                    }
                                  >
                                    <TableCell
                                      align="center"
                                      sx={{
                                        width: columns[0].width,
                                        fontWeight: 600,
                                        color: "#1120A3",
                                        fontSize: { xs: 12, sm: 14 },
                                        position: "relative",
                                        zIndex: 1,
                                      }}
                                    >
                                      {page * rowsPerPage + idx + 1}
                                    </TableCell>
                                    {columns.slice(1).map((col, i) => (
                                      <TableCell
                                        key={i}
                                        sx={{
                                          width: col.width,
                                          fontSize: { xs: 12, sm: 14 },
                                          position: "relative",
                                          zIndex: 1,
                                        }}
                                      >
                                        {col.render
                                          ? col.render(item)
                                          : item[col.field] || "-"}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 25]}
            count={flatData.length}
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

TableWorkFollow.propTypes = {
  data: PropTypes.array,
  filterFields: PropTypes.array,
  onSearch: PropTypes.func,
  navigateTo: PropTypes.string,
};

export default TableWorkFollow;
