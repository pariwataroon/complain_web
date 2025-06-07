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

const TableListAgency = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
  filterFields = [],
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
  const isSm = useMediaQuery(theme.breakpoints.down("md")); // < 900px
  const isBelow1200 = useMediaQuery("(max-width:1200px)");
  const isBelow1300 = useMediaQuery("(max-width:1300px)");

  // 1) initial filters จาก props.filterFields
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  // 2) handle input change - ปรับให้รับค่า date object
  const handleChange = (field) => (e) => {
    let value;
    if (e?.target) {
      // InputText หรือ SelectField
      value = e.target.value;
    } else {
      // DateThaiPickerService หรือ callback อื่น ๆ
      value = e;
    }
    setFilters({ ...filters, [field]: value });
  };

  // 3) pagination
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

  // 4) search / clear
  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearSearch = () => {
    setFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
  };

  // 5) row click → navigate
  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  // 6) กำหนดคอลัมน์ ให้ name map กับ item[name] ตาม label
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
          overflow: "hidden", // ← รักษา overflow hidden สำหรับ content ปกติ
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
            {/* Title */}
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

            {/* Export buttons section - separate for mobile/tablet */}
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
              <ExportButton label="Export Excel" size="medium" />
            </Box>
          </Box>
        )}

        {/* Filters + Search */}
        <Box
          width="100%"
          px={{ xs: 1.5, sm: 2 }}
          py={{ xs: 1.5, sm: 1 }}
          sx={{
            position: "relative",
            zIndex: 1,
            minHeight: "120px",
            boxSizing: "border-box",
          }}
        >
          {isSm || isBelow1300 ? (
            // Mobile, Tablet & Small Desktop Layout (< 1300px) - Grid Layout
            <>
              {/* Filter Fields */}
              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: "1fr",
                  sm: "1fr 1fr",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)",
                }}
                gap={{ xs: 1.5, sm: 1.5, md: 2 }}
                sx={{
                  mb: { xs: 2, sm: 2 },
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  "& > div": {
                    minWidth: 0,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    position: "relative",
                  },
                }}
              >
                {filterFields.map((f, index) => (
                  <Box
                    key={f.name}
                    sx={{
                      minWidth: 0,
                      maxWidth: "100%",
                      width: "100%",
                      boxSizing: "border-box",
                      position: "relative",
                      zIndex: f.type === "date" ? 1000 - index : 10,
                    }}
                  >
                    {f.type === "date" ? (
                      <Box
                        sx={{
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          "& > div": {
                            width: "100% !important",
                            maxWidth: "100% !important",
                            boxSizing: "border-box !important",
                          },
                          "& .MuiFormControl-root": {
                            width: "100% !important",
                            maxWidth: "100% !important",
                            boxSizing: "border-box !important",
                          },
                          "& .datePickerContainer": {
                            width: "100% !important",
                            maxWidth: "100% !important",
                            boxSizing: "border-box !important",
                          },
                          "& .inputField": {
                            width: "100% !important",
                            maxWidth: "100% !important",
                            boxSizing: "border-box !important",
                          },
                          "& .dateInput": {
                            width: "100% !important",
                            maxWidth: "100% !important",
                            boxSizing: "border-box !important",
                          },
                        }}
                      >
                        <DateThaiPickerService
                          label={f.label}
                          value={filters[f.name]}
                          onChange={handleChange(f.name)}
                          placeholder="กรุณาเลือกวันที่"
                        />
                      </Box>
                    ) : f.type === "select" ? (
                      <SelectField
                        fullWidth
                        label={f.label}
                        options={f.options}
                        value={filters[f.name]}
                        onChange={handleChange(f.name)}
                        size={isXs ? "small" : "medium"}
                        sx={{
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          "& .MuiFormControl-root": {
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                          },
                          "& .MuiInputBase-root": {
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                          },
                        }}
                      />
                    ) : (
                      <InputText
                        fullWidth
                        label={f.label}
                        value={filters[f.name]}
                        onChange={handleChange(f.name)}
                        size={isXs ? "small" : "medium"}
                        sx={{
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          "& .MuiFormControl-root": {
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                          },
                          "& .MuiInputBase-root": {
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                          },
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>

              {/* Search Buttons */}
              <Box
                display="flex"
                gap={{ xs: 1.5, sm: 2 }}
                justifyContent="center"
              >
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0b1580" },
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                  }}
                >
                  <SearchIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                </IconButton>
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0b1580" },
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                  }}
                >
                  <SearchOffIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                </IconButton>
              </Box>
            </>
          ) : (
            // Large Desktop Layout (>= 1300px) - Horizontal Layout
            <Box
              display="flex"
              alignItems="center"
              justifyContent="flex-start"
              sx={{
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{
                  flexGrow: 1,
                  minWidth: 0,
                  maxWidth: "calc(100% - 100px)",
                  boxSizing: "border-box",
                  position: "relative",
                }}
              >
                {filterFields.map((f, index) => (
                  <Box
                    key={f.name}
                    sx={{
                      flex: "1 1 140px",
                      minWidth: "140px",
                      maxWidth: "200px",
                      boxSizing: "border-box",
                      position: "relative",
                      zIndex: f.type === "date" ? 1000 - index : 10,
                    }}
                  >
                    {f.type === "date" ? (
                      <Box
                        sx={{
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          "& > div": {
                            width: "100% !important",
                            maxWidth: "100% !important",
                            boxSizing: "border-box !important",
                          },
                          "& .MuiFormControl-root": {
                            width: "100% !important",
                            maxWidth: "100% !important",
                            boxSizing: "border-box !important",
                          },
                          "& .datePickerContainer": {
                            width: "100% !important",
                            maxWidth: "100% !important",
                            boxSizing: "border-box !important",
                          },
                          "& .inputField": {
                            width: "100% !important",
                            maxWidth: "100% !important",
                            boxSizing: "border-box !important",
                          },
                          "& .dateInput": {
                            width: "100% !important",
                            maxWidth: "100% !important",
                            boxSizing: "border-box !important",
                          },
                        }}
                      >
                        <DateThaiPickerService
                          label={f.label}
                          value={filters[f.name]}
                          onChange={handleChange(f.name)}
                          placeholder="กรุณาเลือกวันที่"
                        />
                      </Box>
                    ) : f.type === "select" ? (
                      <SelectField
                        fullWidth
                        label={f.label}
                        options={f.options}
                        value={filters[f.name]}
                        onChange={handleChange(f.name)}
                        size="medium"
                        sx={{
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          "& .MuiFormControl-root": {
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                          },
                          "& .MuiInputBase-root": {
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                          },
                        }}
                      />
                    ) : (
                      <InputText
                        fullWidth
                        label={f.label}
                        value={filters[f.name]}
                        onChange={handleChange(f.name)}
                        size="medium"
                        sx={{
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                          "& .MuiFormControl-root": {
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                          },
                          "& .MuiInputBase-root": {
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                          },
                        }}
                      />
                    )}
                  </Box>
                ))}

                <Box
                  display="flex"
                  gap={1}
                  sx={{
                    flexShrink: 0,
                    ml: 1,
                  }}
                >
                  <IconButton
                    onClick={handleSearchClick}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": { bgcolor: "#0b1580" },
                      width: 40,
                      height: 40,
                    }}
                  >
                    <SearchIcon />
                  </IconButton>

                  <IconButton
                    onClick={handleClearSearch}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": { bgcolor: "#0b1580" },
                      width: 40,
                      height: 40,
                    }}
                  >
                    <SearchOffIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

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
              // Add scrollbar styling for better UX
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
            <Table sx={{ minWidth: isBelow1200 ? 1400 : "100%" }}>
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
                        {/* ถ้าไม่มี property ใด ก็โชว์ "-" */}
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
