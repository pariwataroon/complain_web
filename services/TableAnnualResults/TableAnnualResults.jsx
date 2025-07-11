import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Container,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Search as SearchIcon,
  SearchOff as SearchOffIcon,
} from "@mui/icons-material";

import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import styles from "./TableAnnualResults.module.scss";
import { exportExcel } from "@utils/exportExcel";
const TableAnnualResults = ({
  data = [],
  filterFields = [],
  onSearch = () => {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const isExtraSmall = useMediaQuery("(max-width:640px)");
  const isSmallScreen = useMediaQuery("(max-width:1400px)"); // สำหรับ table scroll

  // Filters state
  const initialFilters = filterFields.reduce(
    (acc, f) => ({ ...acc, [f.name]: "" }),
    {}
  );
  const [filters, setFilters] = useState(initialFilters);
  const [searchFilters, setSearchFilters] = useState(initialFilters); // เก็บค่าที่ใช้ในการค้นหาจริง
  const [hasSearched, setHasSearched] = useState(false); // ตรวจสอบว่าได้กดค้นหาแล้วหรือยัง

  const handleChange = (name) => (e) =>
    setFilters({ ...filters, [name]: e?.target?.value ?? e });

  const handleSearchClick = () => {
    setSearchFilters(filters); // อัพเดทค่าที่ใช้ในการค้นหา
    setHasSearched(true); // ทำเครื่องหมายว่าได้ค้นหาแล้ว
    onSearch(filters);
  };

  const handleClearClick = () => {
    setFilters(initialFilters);
    setSearchFilters(initialFilters); // ล้างค่าการค้นหาด้วย
    setHasSearched(false); // รีเซ็ตสถานะการค้นหา
    onSearch(initialFilters);
  };

  // ฟังก์ชันสำหรับกรองข้อมูลภายใน component (ใช้ searchFilters แทน filters)
  const getFilteredData = () => {
    // ถ้ายังไม่ได้กดค้นหา ให้แสดงข้อมูลทั้งหมด
    if (!hasSearched) {
      return data;
    }

    let result = data;

    // กรองตาม agency
    if (searchFilters.agency) {
      result = result.filter((item) => item.agency === searchFilters.agency);
    }

    // กรองตาม responsibleOfficer
    if (searchFilters.responsibleOfficer) {
      result = result.filter(
        (item) => item.responsibleOfficer === searchFilters.responsibleOfficer
      );
    }

    // กรองตาม status
    if (searchFilters.status) {
      result = result.filter((item) => item.status === searchFilters.status);
    }

    // กรองตาม receiptNumber (เลขรับ สรร.)
    if (searchFilters.receiptNumber) {
      result = result.filter((item) =>
        item.receiptNumber
          ?.toLowerCase()
          .includes(searchFilters.receiptNumber.toLowerCase())
      );
    }

    // กรองตาม complainant (ชื่อผู้ร้อง)
    if (searchFilters.complainant) {
      result = result.filter((item) =>
        item.complainant
          ?.toLowerCase()
          .includes(searchFilters.complainant.toLowerCase())
      );
    }

    // กรองตาม complaint (ชื่อเรื่อง)
    if (searchFilters.complaint) {
      result = result.filter((item) =>
        item.complaint
          ?.toLowerCase()
          .includes(searchFilters.complaint.toLowerCase())
      );
    }

    // กรองตาม issueType (ประเภทเรื่อง)
    if (searchFilters.issueType) {
      result = result.filter((item) =>
        item.issueType
          ?.toLowerCase()
          .includes(searchFilters.issueType.toLowerCase())
      );
    }

    // สำหรับ date fields - ถ้ามีการส่งค่ามาสามารถเพิ่มการกรองได้
    // ขณะนี้ข้อมูล mock ใช้รูปแบบ "30 ม.ค. 2568" ซึ่งอาจต้องแปลงก่อนเปรียบเทียบ
    if (searchFilters.receiveDateFrom || searchFilters.receiveDateTo) {
      // สามารถเพิ่มการกรองตามวันที่ได้ที่นี่
      // ต้องแปลงรูปแบบวันที่ให้ตรงกันก่อน
    }

    return result;
  };

  // ใช้ข้อมูลที่กรองแล้ว
  const filteredData = getFilteredData();

  // แยก date fields และ non-date fields
  const dateFields = filterFields.filter((f) => f.type === "date");
  const nonDateFields = filterFields.filter((f) => f.type !== "date");

  // Columns config
  const columns = [
    { label: "ลำดับ", width: 80, align: "center" },
    { label: "เลขรับ สรร.", field: "receiptNumber", width: 120 },
    { label: "ลงวันที่", field: "receiptDate", width: 120 },
    { label: "ชื่อ-สกุล (ผู้ร้อง)", field: "complainant", width: 200 },
    { label: "ชื่อเรื่อง", field: "complaint", width: 300 },
    { label: "ประเภทเรื่อง", field: "issueType", width: 200 },
    {
      label: "หนังสือส่งหน่วยงาน/ติดตามผล",
      width: 200,
      render: (row) => (
        <>
          {row.letterRef}
          <br />
          <small>({row.letterDate})</small>
        </>
      ),
    },
    {
      label: "เจ้าหน้าที่ผู้รับผิดชอบ",
      field: "responsibleOfficer",
      width: 200,
    },
    { label: "สถานะเรื่อง", field: "status", width: 140, align: "center" },
    {
      label: "ระยะเวลาในการดำเนินงาน",
      field: "elapsedTime",
      width: 160,
      align: "center",
    },
  ];

  // Split data by status (ใช้ข้อมูลที่กรองแล้ว)
  const closedData = filteredData.filter((r) => r.status === "ยุติ");
  const ongoingData = filteredData.filter(
    (r) => r.status === "อยู่ระหว่างดำเนินการ"
  );

  const renderTable = (dataset) => (
    <Box
      sx={{
        overflowX: "auto", // เสมอมี scrollbar ถ้าจำเป็น
        width: "100%",
        // เพิ่มการป้องกันทะลุ
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <Table
        sx={{
          minWidth: 1400, // กำหนด minWidth คงที่
          width: "100%",
          tableLayout: "fixed", // บังคับให้ใช้ width ที่กำหนด
        }}
      >
        <TableHead>
          <TableRow>
            {columns.map((col, idx) => (
              <TableCell
                key={idx}
                sx={{
                  width: `${col.width}px`, // ใช้ px แทน
                  minWidth: `${col.width}px`,
                  maxWidth: `${col.width}px`, // เพิ่ม maxWidth เพื่อป้องกันขยาย
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  whiteSpace: "nowrap",
                  fontSize: isMobile ? "12px" : "14px",
                  padding: isMobile ? "8px 4px" : "14px 12px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                align={col.align || (idx === 1 ? "left" : "center")}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {dataset.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                sx={{
                  textAlign: "center",
                  padding: isMobile ? "20px 10px" : "40px 20px",
                  color: "#666",
                  fontStyle: "italic",
                  border: "1px solid #e0e0e0",
                  fontSize: isMobile ? "12px" : "14px",
                }}
              >
                {hasSearched
                  ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา"
                  : "กรุณากดปุ่มค้นหาเพื่อแสดงข้อมูล"}
              </TableCell>
            </TableRow>
          ) : (
            dataset.map((row, idx) => (
              <TableRow key={row.id} hover>
                {columns.map((col, cIdx) => {
                  let content;
                  if (cIdx === 0) {
                    content = idx + 1;
                  } else if (col.render) {
                    content = col.render(row);
                  } else {
                    content = row[col.field] ?? "-";
                  }
                  return (
                    <TableCell
                      key={cIdx}
                      sx={{
                        width: `${col.width}px`,
                        minWidth: `${col.width}px`,
                        maxWidth: `${col.width}px`, // เพิ่ม maxWidth เพื่อป้องกันขยาย
                        border: "1px solid #e0e0e0",
                        fontSize: isMobile ? "11px" : "14px",
                        padding: isMobile ? "6px 4px" : "14px 12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        // ปรับ whiteSpace ตามคอลัมน์
                        whiteSpace:
                          cIdx === 4 || cIdx === 6 ? "normal" : "nowrap",
                        // สำหรับคอลัมน์ที่ยาว ให้แสดงแบบหลายบรรทัด
                        ...(cIdx === 4 || cIdx === 6
                          ? {
                              whiteSpace: "normal",
                              wordWrap: "break-word",
                              textOverflow: "unset",
                            }
                          : {}),
                      }}
                      align={col.align || (cIdx === 1 ? "left" : "center")}
                    >
                      {content}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
// ฟังก์ชันสำหรับ export Excel
const handleExportExcel = () => {
  if (!filteredData || filteredData.length === 0) {
    alert("ไม่มีข้อมูลสำหรับ export");
    return;
  }

  const today = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const exportData = filteredData.map((row, index) => ({
    ลำดับ: index + 1,
    "เลขรับ สรร.": row.receiptNumber || "-",
    "ลงวันที่": row.receiptDate || "-",
    "ชื่อ-สกุล (ผู้ร้อง)": row.complainant || "-",
    "ชื่อเรื่อง": row.complaint || "-",
    "ประเภทเรื่อง": row.issueType || "-",
    "หนังสือส่งหน่วยงาน/ติดตามผล": row.letterRef
      ? `${row.letterRef} (${row.letterDate || "-"})`
      : "-",
    "เจ้าหน้าที่ผู้รับผิดชอบ": row.responsibleOfficer || "-",
    "สถานะเรื่อง": row.status || "-",
    "ระยะเวลาในการดำเนินงาน": row.elapsedTime || "-",
  }));

  exportExcel(exportData, {
    filename: `รายงานสรุปเรื่องร้องเรียนสำนักงานปลัดกระทรวงการคลัง / สำนักงานรัฐมนตรี${today}.xlsx`,
    sheetName: "Report",
    title: "รายงานสรุปเรื่องร้องเรียนสำนักงานปลัดกระทรวงการคลัง / สำนักงานรัฐมนตรี",
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
        // ← แก้ไขส่วนนี้เพื่อให้ date picker แสดงได้ถูกต้อง
        overflow: "visible", // เปลี่ยนเป็น visible
        position: "relative",
        zIndex: 1, // กำหนด z-index base ต่ำ
      }}
    >
      <Box className={styles.headerBar} />

      {/* Responsive Filters */}
      <Box
        px={isMobile ? 1 : 2}
        py={isMobile ? 1.5 : 2}
        sx={{
          // ← ลบ position relative และ z-index ออก เพื่อไม่ให้ขัดแย้งกับ date picker
          overflow: "visible", // เพิ่มเพื่อให้ date picker แสดงได้
        }}
      >
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
              sx={{
                overflow: "visible", // ← เพิ่มเพื่อให้ date picker แสดงได้
              }}
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

              {/* Date fields - แก้ไขส่วนนี้ */}
              {dateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "140px",
                    flex: "1 1 140px",
                    maxWidth: "300px",
                    // ← ลบ position relative และ z-index ออก
                  }}
                >
                  <DateThaiPickerService
                    label={f.label}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                    // ← ลบ props ที่ไม่จำเป็นออก เพราะ DateThaiPickerService ใหม่ใช้ portal แล้ว
                  />
                </Box>
              ))}
            </Box>

            {/* Search buttons - บรรทัดที่สอง (ตรงกลาง) */}
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

            {/* Export Buttons - บรรทัดที่สาม (ตรงกลาง) */}
            <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
              <ExportButton
                label="Export PDF"
                size="medium"
                sx={{
                  minWidth: "120px",
                  fontSize: "14px",
                  height: "40px",
                  borderRadius: "8px",
                  px: 2,
                }}
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                size="medium"
                sx={{
                  minWidth: "120px",
                  fontSize: "14px",
                  height: "40px",
                  borderRadius: "8px",
                  px: 2,
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
              sx={{
                overflow: "visible", // ← เพิ่มเพื่อให้ date picker แสดงได้
              }}
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

              {/* Date fields - แก้ไขส่วนนี้ */}
              {dateFields.map((f) => (
                <Box
                  key={f.name}
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

            {/* Export Buttons - บรรทัดที่สอง */}
            <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
              <ExportButton
                label="Export PDF"
                size="medium"
                sx={{
                  minWidth: "120px",
                  fontSize: "14px",
                  height: "40px",
                  borderRadius: "8px",
                  px: 2,
                }}
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                size="medium"
                sx={{
                  minWidth: "120px",
                  fontSize: "14px",
                  height: "40px",
                  borderRadius: "8px",
                  px: 2,
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
            sx={{
              overflow: "visible", // ← เพิ่มเพื่อให้ date picker แสดงได้
            }}
          >
            {/* Filter Fields Section */}
            <Box
              display="flex"
              alignItems="flex-end"
              gap={2}
              flexWrap="wrap"
              sx={{
                flexGrow: 1,
                overflow: "visible", // ← เพิ่มเพื่อให้ date picker แสดงได้
              }}
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

              {/* Date fields - แก้ไขส่วนนี้ */}
              {dateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "180px",
                    flex: "1 1 180px",
                    maxWidth: "300px",
                    // ← ลบ position relative และ z-index ออก
                  }}
                >
                  <DateThaiPickerService
                    label={f.label}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                    // ← ลบ props ที่ไม่จำเป็นออก
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
                size="medium"
                sx={{
                  minWidth: "120px",
                  fontSize: "14px",
                  height: "40px",
                  borderRadius: "8px",
                  px: 2,
                }}
              />
              <ExportButton
                label="Export Excel"
                onClick={handleExportExcel}
                size="medium"
                sx={{
                  minWidth: "120px",
                  fontSize: "14px",
                  height: "40px",
                  borderRadius: "8px",
                  px: 2,
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Title Sections - ทำ responsive ด้วย */}
      {/* Closed Section */}
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
        รายงานสรุปเรื่องร้องเรียนสำนักงานปลัดกระทรวงการคลัง / สำนักงานรัฐมนตรี
        <br />
        ประจำปีงบประมาณ 2568 ตั้งแต่วันที่ 1 ตุลาคม 2567 - 31 ธันวาคม 2567
        <br />
        สถานะ ยุติแล้ว ({closedData.length} รายการ)
      </Box>
      <Box sx={{ px: isMobile ? 1 : 2, pb: 4 }}>{renderTable(closedData)}</Box>

      {/* Ongoing Section */}
      <Box
        sx={{
          backgroundColor: "#FEECEC",
          p: isMobile ? 1.5 : 2,
          color: "#D32F2F",
          textAlign: "center",
          fontSize: isMobile ? "16px" : isTablet ? "18px" : "20px",
          fontWeight: "bold",
          lineHeight: 1.4,
        }}
      >
        รายงานสรุปเรื่องร้องเรียนสำนักงานปลัดกระทรวงการคลัง / สำนักงานรัฐมนตรี
        <br />
        ประจำปีงบประมาณ 2568 ตั้งแต่วันที่ 1 ตุลาคม 2567 - 31 ธันวาคม 2567
        <br />
        สถานะ อยู่ระหว่างดำเนินการ ({ongoingData.length} รายการ)
      </Box>
      <Box sx={{ px: isMobile ? 1 : 2, pb: 4 }}>{renderTable(ongoingData)}</Box>
    </Container>
  );
};

TableAnnualResults.propTypes = {
  data: PropTypes.array.isRequired,
  filterFields: PropTypes.array,
  onSearch: PropTypes.func,
};

export default TableAnnualResults;
