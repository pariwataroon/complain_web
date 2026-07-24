import React, { useState, useRef } from "react";
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
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Search as SearchIcon,
  SearchOff as SearchOffIcon,
} from "@mui/icons-material";

import styles from "./TableAnnualCompSum.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportReportToPDF } from "@utils/exportReportPDF";
import * as XLSX from "xlsx-js-style";

// สร้าง component แยกสำหรับ date picker เพื่อป้องกัน hooks issue
const DatePickerWrapper = ({ field, value, onChange, isMobile }) => {
  return (
    <DateThaiPickerService
      label={field.label}
      value={value}
      onChange={onChange}
      size={isMobile ? "small" : "medium"}
      sx={{
        width: "100%",
        "& .MuiFormControl-root": {
          height: isMobile ? "40px" : "56px",
        },
        "& .MuiInputBase-root": {
          height: isMobile ? "40px" : "56px",
        },
        "& .MuiOutlinedInput-root": {
          height: isMobile ? "40px" : "56px",
        },
      }}
    />
  );
};

const TableAnnualCompSum = ({
  data = [],
  filterFields = [],
  onSearch = () => {},
  navigateTo = "",
  dateFrom = null,
  dateTo = null,
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const isExtraSmall = useMediaQuery("(max-width:640px)"); // ขนาดต่ำกว่า 640px

  // คำนวณปีงบประมาณอัตโนมัติ (เริ่ม 1 ต.ค. — ต.ค.-ธ.ค.ใช้ปีปัจจุบัน, ม.ค.-ก.ย.ใช้ปีก่อนหน้า)
  const currentFiscalYear = (() => {
    const now = new Date();
    const month = now.getMonth(); // 0=ม.ค. … 9=ต.ค.
    const year = now.getFullYear();
    return (month >= 9 ? year : year - 1) + 543;
  })();

  const initialFilters = filterFields.reduce(
    (acc, f) => ({ ...acc, [f.name]: "" }),
    {}
  );
  const [filters, setFilters] = useState(initialFilters);
  const handleChange = (name) => (e) =>
    setFilters({ ...filters, [name]: e?.target?.value ?? e });

  const handleSearchClick = () => onSearch(filters);
  const handleClearClick = () => {
    setFilters(initialFilters);
    onSearch(initialFilters);
  };

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const pagedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };

  // Columns config
  const columns = [
    { label: "ลำดับ", width: "80px" },
    { label: "หน่วยงาน", width: "400px" },
    { label: "จำนวน", width: "120px" },
    { label: "ยุติ", width: "120px" },
    { label: "อยู่ระหว่างดำเนินการ", width: "160px" },
  ];

  // แยก date fields และ non-date fields
  const dateFields = filterFields.filter((f) => f.type === "date");
  const nonDateFields = filterFields.filter((f) => f.type !== "date");

  // ตรวจสอบว่าไม่มีข้อมูล
  const hasNoData = data.length === 0;

const formatThaiDate = (date) => {
  if (!date) return "-";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear() + 543; // แปลงเป็น พ.ศ.
    return `${day}/${month}/${year}`;
  } catch (error) {
    return "-";
  }
};

const handleExportExcel = () => {
  if (!data || data.length === 0) return;

  const today = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const filename = `รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ_${today}.xlsx`;

  // สร้าง array สำหรับ worksheet (เพิ่มคอลัมน์ A ว่างเป็น spacer ด้านซ้าย)
  const wsData = [];

  // แถวที่ 1: หัวข้อรายงาน (วางใน col A เพื่อ merge A→F ครอบทั้งหน้า)
  wsData.push(["รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ"]);

  // แถวที่ 2: ช่วงวันที่
  const dateText = dateFrom || dateTo
    ? `ตั้งแต่วันที่ ${dateFrom ? formatThaiDate(dateFrom) : "-"} ถึงวันที่ ${dateTo ? formatThaiDate(dateTo) : "-"}`
    : `ข้อมูล ณ วันที่ ${today}`;
  wsData.push([dateText]);

  // แถวที่ 3: หน่วยงาน
  wsData.push(["หน่วยงาน กระทรวงการคลัง"]);

  // แถวว่าง
  wsData.push(["", ""]);

  // แถวที่ 5: Header ตาราง
  const headers = ["ลำดับ", "หน่วยงาน", "จำนวน", "ยุติ", "อยู่ระหว่างดำเนินการ"];
  wsData.push(["", ...headers]);

  // แถวข้อมูล
  data.forEach((item, idx) => {
    wsData.push([
      "",
      idx + 1,
      item.agency || "-",
      item.total || 0,
      item.closed || 0,
      item.ongoing || 0,
    ]);
  });

  // สร้าง worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // จำนวนคอลัมน์รวม spacer (6 คอลัมน์)
  const totalCols = headers.length + 1;

  // Merge cells สำหรับหัวข้อ (merge ตั้งแต่ col A → F ให้ครอบทั้งหน้า)
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } });
  ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } });

  // กำหนดความกว้างคอลัมน์ (col A = spacer, col B-F = ข้อมูล)
  ws['!cols'] = [
    { wch: 3 },  // A: spacer ว่างด้านซ้าย
    { wch: 5 },  // B: ลำดับ
    { wch: 55 }, // C: หน่วยงาน
    { wch: 10 }, // D: จำนวน
    { wch: 10 }, // E: ยุติ
    { wch: 20 }, // F: อยู่ระหว่างดำเนินการ
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

      // แถว 0-2: หัวข้อรายงาน (merge ทั้งหน้า ให้ center ทุก cell)
      if (R >= 0 && R <= 2) {
        ws[cellAddress].s.font = { name: "Cordia New", sz: 14, bold: true };
        ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
      }
      // แถว 3: ว่าง
      else if (R === 3) {
        continue;
      }
      // col A (C=0): spacer ว่าง ไม่ต้องมี border (เฉพาะแถว header/data)
      else if (C === 0) {
        continue;
      }
      // แถวที่ 4: Header ตาราง
      else if (R === 4) {
        ws[cellAddress].s.font = { name: "Cordia New", sz: 11, bold: true };
        ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
        ws[cellAddress].s.fill = { fgColor: { rgb: "D9D9D9" } };
        ws[cellAddress].s.border = borderStyle;
      }
      // แถวข้อมูล
      else if (R > 4) {
        ws[cellAddress].s.font = { name: "Cordia New", sz: 11 };
        ws[cellAddress].s.border = borderStyle;
        const centerColumns = [1, 3, 4, 5];
        ws[cellAddress].s.alignment = {
          horizontal: centerColumns.includes(C) ? "center" : "left",
          vertical: "center",
          wrapText: true,
        };
      }
    }
  }

  // ตั้งค่า Page Setup เป็น A4 พอดีหน้า
  ws['!pageSetup'] = {
    paperSize: 9, // A4 = 9
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  // ตั้งค่า margins (กว้างข้างเพื่อให้ตารางอยู่กลางหน้า)
  ws['!margins'] = {
    left: 0.5,
    right: 0.5,
    top: 0.3,
    bottom: 0.3,
    header: 0.1,
    footer: 0.1,
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
};

  const handleExportPDF = async () => {
    if (!data || data.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ export PDF");
      return;
    }
    const today = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit" });
    await exportElementToPDF(pdfRef, `รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ_${today}.pdf`, "p");
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
      <Box className={styles.headerBar} />

      {/* Responsive Filters */}
      <Box px={isMobile ? 1 : 2} py={isMobile ? 1.5 : 2}>
        {isExtraSmall ? (
          // Extra Small Layout (< 640px) - แยกเป็น 3 บรรทัด
          <>
            {/* Filter Fields - บรรทัดแรก */}
            <Box
              display="flex"
              alignItems="flex-end"
              justifyContent="center"
              gap={1.5}
              flexWrap="wrap"
              mb={2}
            >
              {/* Non-date fields */}
              {nonDateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "140px",
                    flex: "1 1 140px",
                    maxWidth: "300px",
                  }}
                >
                  {f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="small"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="small"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />
                  )}
                </Box>
              ))}

              {/* Date fields */}
              {dateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "140px",
                    flex: "1 1 140px",
                    maxWidth: "300px",
                  }}
                >
                  <DatePickerWrapper
                    field={f}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                    isMobile={true}
                  />
                </Box>
              ))}
            </Box>

            {/* Search buttons - บรรทัดที่สอง (ตรงกลาง, ไม่มี margin-top) */}
            <Box display="flex" justifyContent="center" gap={1} mb={2}>
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  "&:hover": {
                    bgcolor: "#0f1a8f",
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleClearClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  "&:hover": {
                    bgcolor: "#0f1a8f",
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <SearchOffIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Export Buttons - บรรทัดที่สาม (ตรงกลาง) - ขนาดเท่า desktop */}
            <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
              <ExportButton
                label="Export PDF"
                onClick={() => handleExportPDF()
                }
                disabled={hasNoData}
                size="medium" // ขนาดเท่า desktop
                sx={{
                  minWidth: "120px", // ขนาดเท่า desktop
                  fontSize: "14px", // ขนาดเท่า desktop
                  height: "40px", // ขนาดเท่า desktop
                  borderRadius: "8px",
                  px: 2, // ขนาดเท่า desktop
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                disabled={hasNoData}
                size="medium" // ขนาดเท่า desktop
                sx={{
                  minWidth: "120px", // ขนาดเท่า desktop
                  fontSize: "14px", // ขนาดเท่า desktop
                  height: "40px", // ขนาดเท่า desktop
                  borderRadius: "8px",
                  px: 2, // ขนาดเท่า desktop
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
            </Box>
          </>
        ) : isMobile ? (
          // Mobile Layout (640px+) - แยกเป็น 2 บรรทัด
          <>
            {/* Filter Fields + Search Buttons - บรรทัดแรก */}
            <Box
              display="flex"
              alignItems="flex-end"
              gap={1.5}
              flexWrap="wrap"
              mb={2}
            >
              {/* Non-date fields */}
              {nonDateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "140px",
                    flex: "1 1 140px",
                    maxWidth: "300px",
                  }}
                >
                  {f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="small"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="small"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />
                  )}
                </Box>
              ))}

              {/* Date fields */}
              {dateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "140px",
                    flex: "1 1 140px",
                    maxWidth: "300px",
                  }}
                >
                  <DatePickerWrapper
                    field={f}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                    isMobile={true}
                  />
                </Box>
              ))}

              {/* Search buttons */}
              <Box
                display="flex"
                gap={1}
                sx={{
                  alignSelf: "flex-end",
                  height: "40px",
                  alignItems: "center",
                }}
              >
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    "&:hover": {
                      bgcolor: "#0f1a8f",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleClearClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    "&:hover": {
                      bgcolor: "#0f1a8f",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SearchOffIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Export Buttons - บรรทัดที่สอง - ขนาดเท่า desktop */}
            <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
              <ExportButton
                label="Export PDF"
                onClick={() => handleExportPDF()
                }
                disabled={hasNoData}
                size="medium" // ขนาดเท่า desktop
                sx={{
                  minWidth: "120px", // ขนาดเท่า desktop
                  fontSize: "14px", // ขนาดเท่า desktop
                  height: "40px", // ขนาดเท่า desktop
                  borderRadius: "8px",
                  px: 2, // ขนาดเท่า desktop
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                disabled={hasNoData}
                size="medium" // ขนาดเท่า desktop
                sx={{
                  minWidth: "120px", // ขนาดเท่า desktop
                  fontSize: "14px", // ขนาดเท่า desktop
                  height: "40px", // ขนาดเท่า desktop
                  borderRadius: "8px",
                  px: 2, // ขนาดเท่า desktop
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
            </Box>
          </>
        ) : (
          // Desktop Layout - แถวเดียว
          <Box
            display="flex"
            alignItems="flex-end"
            justifyContent="space-between"
            gap={2}
            flexWrap="wrap"
          >
            {/* Filter Fields Section */}
            <Box
              display="flex"
              alignItems="flex-end"
              gap={2}
              flexWrap="wrap"
              sx={{ flexGrow: 1 }}
            >
              {/* Non-date fields */}
              {nonDateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "180px",
                    flex: "1 1 180px",
                    maxWidth: "300px",
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
                        "& .MuiInputBase-root": {
                          height: "56px",
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
                        "& .MuiInputBase-root": {
                          height: "56px",
                        },
                      }}
                    />
                  )}
                </Box>
              ))}

              {/* Date fields */}
              {dateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "180px",
                    flex: "1 1 180px",
                    maxWidth: "300px",
                  }}
                >
                  <DatePickerWrapper
                    field={f}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                    isMobile={false}
                  />
                </Box>
              ))}

              {/* Search buttons */}
              <Box
                display="flex"
                gap={1}
                sx={{
                  alignSelf: "flex-end",
                  height: "70px",
                  alignItems: "center",
                }}
              >
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    "&:hover": {
                      bgcolor: "#0f1a8f",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleClearClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    "&:hover": {
                      bgcolor: "#0f1a8f",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SearchOffIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Export Buttons Section */}
            <Box
              display="flex"
              gap={1}
              flexWrap="wrap"
              sx={{
                justifyContent: "flex-end",
                alignSelf: "flex-end",
                mb: 2,
              }}
            >
              <ExportButton
                label="Export PDF"
                onClick={() => handleExportPDF()
                }
                disabled={hasNoData}
                size="medium"
                sx={{
                  minWidth: "120px",
                  fontSize: "14px",
                  height: "40px",
                  borderRadius: "8px",
                  px: 2,
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                disabled={hasNoData}
                size="medium"
                sx={{
                  minWidth: "120px",
                  fontSize: "14px",
                  height: "40px",
                  borderRadius: "8px",
                  px: 2,
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Title */}
      <Box
        sx={{
          backgroundColor: "#EAF5FF",
          p: isMobile ? 1.5 : 2,
          color: "#1120A3",
          textAlign: "center",
          fontSize: isMobile ? "16px" : isTablet ? "18px" : "20px",
          fontWeight: "bold",
          lineHeight: 1.4,
        }}
      >
        รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ
        <br />
        {dateFrom || dateTo ? (
          <>
            ตั้งแต่วันที่ {dateFrom ? formatThaiDate(dateFrom) : "-"} ถึงวันที่ {dateTo ? formatThaiDate(dateTo) : "-"}
          </>
        ) : (
          <>
            ตั้งแต่วันที่ 1 ตุลาคม {currentFiscalYear} ถึงวันที่ {new Date().toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' })}
          </>
        )}
      </Box>

      {/* Summary Table */}
      <div ref={pdfRef}>
        <Box sx={{ overflowX: "auto", px: isMobile ? 1 : 2, pb: 1 }}>
          <Table
            sx={{
              minWidth: isMobile ? 700 : 1000,
              tableLayout: "fixed",
              width: "100%",
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableCell
                    key={idx}
                    sx={{
                      width: col.width,
                      backgroundColor: "#e8e9f6",
                      fontWeight: 600,
                      color: "#1120a3",
                      fontSize: isMobile ? "12px" : "14px",
                      border: "1px solid #e0e0e0",
                      padding: isMobile ? "8px 4px" : "14px 12px",
                    }}
                    align={idx === 1 ? "left" : "center"}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {hasNoData ? (
                // แสดงข้อความไม่มีข้อมูล
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    sx={{
                      textAlign: "center",
                      padding: isMobile ? "20px 10px" : "40px 20px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: isMobile ? 1 : 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: isMobile ? 40 : 60,
                          height: isMobile ? 40 : 60,
                          borderRadius: "50%",
                          backgroundColor: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: isMobile ? 0.5 : 1,
                        }}
                      >
                        <SearchIcon
                          sx={{
                            fontSize: isMobile ? 20 : 30,
                            color: "#999",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#666",
                          fontWeight: 500,
                          fontSize: isMobile ? "14px" : "16px",
                        }}
                      >
                        ไม่พบข้อมูล
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#999",
                          fontSize: isMobile ? "12px" : "14px",
                          textAlign: "center",
                          px: isMobile ? 1 : 0,
                        }}
                      >
                        ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                        <br />
                        โปรดลองปรับเปลี่ยนเงื่อนไขการค้นหา
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                // แสดงข้อมูลปกติ
                pagedData.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      cursor: navigateTo ? "pointer" : "default",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                    onClick={() => {
                      if (navigateTo) {
                        const query = {};
                        if (row.department_id || row.id) {
                          query.department_id = row.department_id || row.id;
                        }
                        if (dateFrom) query.dateFrom = dateFrom;
                        if (dateTo) query.dateTo = dateTo;

                        const queryString = Object.keys(query).length > 0
                          ? `?${new URLSearchParams(query).toString()}`
                          : '';

                        router.push(`${navigateTo}${queryString}`);
                      }
                    }}
                  >
                    {/* Column 1 - ลำดับ */}
                    <TableCell
                      align="center"
                      sx={{
                        width: columns[0].width,
                        fontWeight: 600,
                        color: "#1120A3",
                        fontSize: isMobile ? "12px" : "14px",
                        border: "1px solid #e0e0e0",
                        padding: isMobile ? "8px 4px" : "14px 12px",
                      }}
                    >
                      {page * rowsPerPage + idx + 1}
                    </TableCell>

                    {/* Column 2 - หน่วยงาน */}
                    <TableCell
                      sx={{
                        width: columns[1].width,
                        fontSize: isMobile ? "12px" : "14px",
                        border: "1px solid #e0e0e0",
                        padding: isMobile ? "8px 4px" : "14px 12px",
                      }}
                    >
                      <Box
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: isMobile ? "nowrap" : "normal",
                        }}
                      >
                        {row.agency}
                      </Box>
                    </TableCell>

                    {/* Column 3 - จำนวน */}
                    <TableCell
                      align="center"
                      sx={{
                        width: columns[2].width,
                        fontSize: isMobile ? "12px" : "14px",
                        border: "1px solid #e0e0e0",
                        padding: isMobile ? "8px 4px" : "14px 12px",
                      }}
                    >
                      {row.total ?? "-"}
                    </TableCell>

                    {/* Column 4 - ยุติ */}
                    <TableCell
                      align="center"
                      sx={{
                        width: columns[3].width,
                        fontSize: isMobile ? "12px" : "14px",
                        border: "1px solid #e0e0e0",
                        padding: isMobile ? "8px 4px" : "14px 12px",
                      }}
                    >
                      {row.closed ?? "-"}
                    </TableCell>

                    {/* Column 5 - อยู่ระหว่างดำเนินการ */}
                    <TableCell
                      align="center"
                      sx={{
                        width: columns[4].width,
                        fontSize: isMobile ? "12px" : "14px",
                        border: "1px solid #e0e0e0",
                        padding: isMobile ? "8px 4px" : "14px 12px",
                      }}
                    >
                      {row.ongoing ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* แสดง Pagination เฉพาะเมื่อมีข้อมูล */}
          {!hasNoData && (
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
                  fontSize: isMobile ? "12px" : "14px",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? 1 : 0,
                  py: isMobile ? 1 : 0,
                },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                  {
                    fontSize: isMobile ? "12px" : "14px",
                  },
                "& .MuiTablePagination-select": {
                  fontSize: isMobile ? "12px" : "14px",
                },
              }}
            />
          )}
        </Box>
      </div>
    </Container>
  );
};

TableAnnualCompSum.propTypes = {
  data: PropTypes.array,
  filterFields: PropTypes.array,
  onSearch: PropTypes.func,
  navigateTo: PropTypes.string,
  dateFrom: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  dateTo: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

export default TableAnnualCompSum;
