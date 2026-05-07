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
  Stack,
  Typography,
  TextField,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import styles from "./TableListAgency.module.scss";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportReportToPDF } from "@utils/exportReportPDF";
import * as XLSX from "xlsx-js-style";
import {
  GetDepartments,
} from "@pages/api/complaint/complaint";

const HEADER_COLOR = "#1120A3";

const TableListAgency = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
  statusOptions = [],
  loading = false,
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const excelRef = useRef();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isSm = useMediaQuery(theme.breakpoints.down("md"));

  // -------------------- ฟิลเตอร์ 5 ช่อง --------------------
  const [filters, setFilters] = useState({
    claimantName: "",
    startDate: null,
    endDate: null,
    agency: "",
    responsibleOfficer: "",
    status: "",
  });

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((s) => ({ ...s, [field]: value }));
  };

  // ฟังก์ชันสำหรับเปลี่ยนวันที่
  const handleDateChange = (field) => (date) => {
    setFilters((s) => ({ ...s, [field]: date }));
  };

  // options ดรอปดาวน์
  const [agencyOptions, setAgencyOptions] = useState([]);
  const [officerOptions, setOfficerOptions] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const depRes = await GetDepartments().catch(() => null);
        let deps = [];
        if (depRes?.res_data?.length) {
          deps = depRes.res_data
            .map((d) => ({
              value: String(d.name),
              label: d.name,
            }))
            .filter((x) => x.label);
        } else {
          const uniq = [
            ...new Set(data.map((d) => d.agency).filter(Boolean)),
          ].sort();
          deps = uniq.map((x) => ({ value: x, label: x }));
        }
        setAgencyOptions(deps);
      } catch (e) {
        setAgencyOptions([]);
        console.error("Load departments failed:", e);
      }
    })();
  }, [data]);

  useEffect(() => {
    // ใช้ข้อมูลจาก data prop โดยตรง เพราะมีคำนำหน้าแล้ว
    const names = [
      ...new Set(
        data.map((d) => d.responsibleOfficer).filter((x) => x && x !== "-")
      ),
    ].sort();
    setOfficerOptions(names.map((n) => ({ value: n, label: n })));
  }, [data]);

  // -------------------- ตาราง --------------------
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // รีเซ็ต page เมื่อ data เปลี่ยน (แก้ปัญหาเลขลำดับผิดเมื่อกรอง)
  useEffect(() => {
    setPage(0);
  }, [data]);

  // แปลงวันที่ไทย เช่น "30 ต.ค. 2568" -> Date object
  const parseThaiDate = (str) => {
    if (!str) return new Date(0);
    const thaiMonths = {
      "ม.ค.": 0, "ก.พ.": 1, "มี.ค.": 2, "เม.ย.": 3,
      "พ.ค.": 4, "มิ.ย.": 5, "ก.ค.": 6, "ส.ค.": 7,
      "ก.ย.": 8, "ต.ค.": 9, "พ.ย.": 10, "ธ.ค.": 11,
      "มกราคม": 0, "กุมภาพันธ์": 1, "มีนาคม": 2, "เมษายน": 3,
      "พฤษภาคม": 4, "มิถุนายน": 5, "กรกฎาคม": 6, "สิงหาคม": 7,
      "กันยายน": 8, "ตุลาคม": 9, "พฤศจิกายน": 10, "ธันวาคม": 11,
    };
    // ลอง parse เป็น ISO format ก่อน (เผื่อ API เปลี่ยน format)
    const isoDate = new Date(str);
    if (!isNaN(isoDate.getTime())) return isoDate;
    // parse Thai format: "DD MMM YYYY" เช่น "30 ต.ค. 2568"
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = thaiMonths[parts[1]];
      const year = parseInt(parts[2], 10) - 543; // แปลง พ.ศ. เป็น ค.ศ.
      if (!isNaN(day) && month !== undefined && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return new Date(0);
  };

  const sortedData = useMemo(
    () =>
      [...data].sort((a, b) => {
        const dateA = parseThaiDate(a.receiveDate);
        const dateB = parseThaiDate(b.receiveDate);
        return dateB - dateA;
      }),
    [data]
  );

  const pagedData = useMemo(
    () => sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedData, page, rowsPerPage]
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
    const cleared = {
      claimantName: "",
      startDate: null,
      endDate: null,
      agency: "",
      responsibleOfficer: "",
      status: "",
    };
    setFilters(cleared);
    setPage(0);
    onSearch(cleared);
  };

  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  const handleIssueClick = (item, e) => {
    e.stopPropagation();
    router.push(`/admin/box/list/${item.id}/?status=submitted`);
  };

  const columns = [
    { name: "claimantName", label: "ชื่อผู้ร้อง", width: 140 },
    { name: "receiptNumber", label: "เลข สรร.", width: 120 },
    { name: "receiveDate", label: "ลงวันที่", width: 120 },
    { name: "agency", label: "หน่วยงาน", width: 150 },
    { name: "issue", label: "ชื่อเรื่อง", width: 180 },
    { name: "issueType", label: "ประเภทเรื่อง", width: 120 },
    { name: "note", label: "หนังสือส่งหน่วยงาน/ติดตามผล", width: 180 },
    { name: "responsibleOfficer", label: "เจ้าหน้าที่ผู้รับผิดชอบ", width: 150 },
    { name: "status", label: "สถานะเรื่อง", width: 140 },
    // { name: "workingDays", label: "ดำเนินการภายใน (วัน)", width: 100 },
  ];

  // --- Excel Export Handler ---
  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ export");
      return;
    }

    const now = new Date();
    const thaiDate = now.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const filename = `รายงานสรุปเรื่องร้องเรียนของหน่วยงาน_${now.toLocaleDateString("th-TH").replace(/\//g, "-")}.xlsx`;

    // สร้างช่วงวันที่สำหรับรายงาน
    let dateRangeText = "";
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      const startDateThai = startDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const endDateThai = endDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      dateRangeText = `ตั้งแต่วันที่ ${startDateThai} ถึงวันที่ ${endDateThai} ณ`;
    } else if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const startDateThai = startDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      dateRangeText = `ตั้งแต่วันที่ ${startDateThai} ณ`;
    } else if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      const endDateThai = endDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      dateRangeText = `ถึงวันที่ ${endDateThai} ณ`;
    } else {
      dateRangeText = `ข้อมูล ณ วันที่ ${thaiDate}`;
    }

    // สร้างข้อมูลแถวต่อแถว
    const exportData = [];

    // แถวที่ 1: หัวข้อรายงาน
    exportData.push(["สรุปเรื่องร้องเรียนของหน่วยงาน"]);

    // แถวที่ 2: ช่วงวันที่
    exportData.push([dateRangeText]);

    // แถวที่ 3: หน่วยงาน
    exportData.push(["หน่วยงาน กระทรวงการคลัง"]);

    // แถวว่าง
    exportData.push([]);

    // แถวที่ 5: Header ของตาราง
    const headerRow = ["ลำดับ"];
    columns.forEach((col) => {
      headerRow.push(col.label);
    });
    exportData.push(headerRow);

    // แถวข้อมูล
    data.forEach((item, idx) => {
      const row = [idx + 1];
      columns.forEach((col) => {
        let value = item[col.name] ?? "-";
        if (col.name === "status" && statusOptions.length > 0) {
          const statusOption = statusOptions.find(opt => opt.value === value);
          if (statusOption) {
            value = statusOption.label || value;
          }
        }
        row.push(value);
      });
      exportData.push(row);
    });

    // สร้าง worksheet
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // จำนวนคอลัมน์ทั้งหมด
    const numCols = headerRow.length;

    // Merge cells สำหรับหัวข้อ (แถว 0-2)
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } });
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } });
    ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } });

    // กำหนดความกว้างคอลัมน์ (ลดให้พอดี A4 landscape)
    ws['!cols'] = [
      { wch: 4 },  // ลำดับ
      { wch: 16 }, // ชื่อผู้ร้อง
      { wch: 10 }, // เลข สรร.
      { wch: 12 }, // ลงวันที่
      { wch: 18 }, // หน่วยงาน
      { wch: 22 }, // ชื่อเรื่อง
      { wch: 14 }, // ประเภทเรื่อง
      { wch: 22 }, // หนังสือส่งหน่วยงาน
      { wch: 18 }, // เจ้าหน้าที่
      { wch: 14 }, // สถานะ
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
          ws[cellAddress].s.font = { name: "Cordia New", sz: 11 };
          ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
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
          const centerColumns = [0, 2, 3]; // ลำดับ, เลข สรร., ลงวันที่
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
      left: 0.2,
      right: 0.2,
      top: 0.3,
      bottom: 0.3,
      header: 0.1,
      footer: 0.1,
    };

    // Export file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
  };

  const handleExportPDF = async () => {
    if (!data || data.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ export PDF");
      return;
    }
    await exportElementToPDF(pdfRef, `รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf`, "l");
  };

  return (
    <>
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
        {/* Title + Export */}
        {isSm ? (
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
                color: HEADER_COLOR,
              }}
            >
              <Box sx={{ fontWeight: "bold", textAlign: "center", color: HEADER_COLOR }}>{title}</Box>
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
                  onClick={() => handleExportPDF()}
                  size={isXs ? "small" : "medium"}
                  sx={{ minWidth: { xs: "200px", sm: "140px" }, width: { xs: "100%", sm: "auto" } }}
                />
                <ExportButton label="Export Excel" onClick={handleExportExcel} size={isXs ? "small" : "medium"} />
              </Box>
            </Box>
          </>
        ) : (
          <Box
            mt={2}
            className={styles.headerBar2}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ fontSize: 18, height: 50, px: 3, color: HEADER_COLOR }}
          >
            <Box sx={{ fontWeight: "bold", color: HEADER_COLOR }}>{title}</Box>
            <Box display="flex" alignItems="center" gap={1}>
              <ExportButton label="Export PDF" onClick={() => handleExportPDF()} size="medium" />
              <ExportButton label="Export Excel" onClick={handleExportExcel} size="medium" />
            </Box>
          </Box>
        )}

        {/* ⬇️ แถบฟิลเตอร์ */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pt: 2,
            pb: 1.5,
            borderTop: "1px solid #eef0fb",
            borderBottom: "1px solid #eef0fb",
            background: "linear-gradient(90deg, #f7f8ff 0%, #ffffff 100%)",
          }}
        >
          <Box
            display="grid"
            gap={{ xs: 1.2, sm: 1.5 }}
            sx={{
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(3, 1fr)",
              },
            }}
          >
            <SelectField
              label="หน่วยงาน"
              value={filters.agency}
              onChange={handleChange("agency")}
              options={agencyOptions}
              size="small"
            />
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "#1120A3", fontWeight: 600, mb: 1 }}
              >
                ตั้งแต่วันที่
              </Typography>
              <Box sx={{ "& .MuiFormControl-root": { mb: 0 } }}>
                <DateThaiPickerService
                  value={filters.startDate}
                  onChange={handleDateChange("startDate")}
                  placeholder="เลือกวันที่เริ่มต้น"
                />
              </Box>
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "#1120A3", fontWeight: 600, mb: 1 }}
              >
                ถึงวันที่
              </Typography>
              <Box sx={{ "& .MuiFormControl-root": { mb: 0 } }}>
                <DateThaiPickerService
                  value={filters.endDate}
                  onChange={handleDateChange("endDate")}
                  placeholder="เลือกวันที่สิ้นสุด"
                />
              </Box>
            </Box>
          </Box>

          {/* แถวที่ 2: สถานะ, เจ้าหน้าที่, ชื่อผู้ร้อง */}
          <Box
            display="grid"
            gap={{ xs: 1.2, sm: 1.5 }}
            sx={{
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(3, 1fr)",
              },
            }}
            mt={{ xs: 1, sm: 1.5 }}
          >
            <SelectField
              label="สถานะเรื่อง"
              value={filters.status}
              onChange={handleChange("status")}
              options={statusOptions}
              size="small"
            />
            <SelectField
              label="เจ้าหน้าที่ผู้รับผิดชอบ"
              value={filters.responsibleOfficer}
              onChange={handleChange("responsibleOfficer")}
              options={officerOptions}
              size="small"
            />
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "#1120A3", fontWeight: 600, mb: 1 }}
              >
                ชื่อผู้ร้อง
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="พิมพ์ชื่อผู้ร้อง..."
                value={filters.claimantName}
                onChange={handleChange("claimantName")}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "40px",
                    borderRadius: "10px",
                    "& fieldset": {
                      borderColor: "#1120A3",
                    },
                  },
                }}
              />
            </Box>
          </Box>

          <Stack direction="row" spacing={1} mt={1.5} justifyContent="flex-end">
            <IconButton
              aria-label="ค้นหา"
              onClick={handleSearchClick}
              sx={{ backgroundColor: "#1120A3", color: "#fff", "&:hover": { backgroundColor: "#0d1991" } }}
              size="small"
            >
              <SearchIcon />
            </IconButton>
            <IconButton
              aria-label="ล้างค่า"
              onClick={handleClearSearch}
              sx={{ backgroundColor: "#e9ecff", color: "#1120A3", "&:hover": { backgroundColor: "#dfe5ff" } }}
              size="small"
            >
              <SearchOffIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* ตารางข้อมูล */}
        <div ref={pdfRef}>
          <Box
            className={styles.tableWrapper}
            id="table-results"
            sx={{
              overflowX: "auto",
              width: "100%",
              minHeight: "220px",
              px: 1,
              pb: 1,
            }}
          >
            <Table ref={excelRef} sx={{ minWidth: 1200, width: "max-content" }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      width: { xs: 60, sm: 80 },
                      fontSize: { xs: 12, sm: 14 },
                      background: "#f5f7ff",
                      color: HEADER_COLOR,
                      fontWeight: 700,
                      borderBottom: "2px solid #e0e0e0",
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
                        fontWeight: 700,
                        color: HEADER_COLOR,
                        background: "#f5f7ff",
                        borderBottom: "2px solid #e0e0e0",
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      align="center"
                      sx={{
                        py: 4,
                      }}
                    >
                      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <CircularProgress sx={{ color: HEADER_COLOR }} />
                        <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#666" }}>
                          กำลังโหลดข้อมูล...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      align="center"
                      sx={{
                        py: 4,
                        fontSize: { xs: 14, sm: 16 },
                        color: "#666",
                      }}
                    >
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedData.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f5f7ff" } }}
                    >
                      <TableCell
                        align="center"
                        sx={{
                          width: { xs: 60, sm: 80 },
                          fontWeight: 600,
                          color: HEADER_COLOR,
                          fontSize: { xs: 12, sm: 14 },
                        }}
                      >
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell
                          key={col.name}
                          onClick={col.name === "issue" ? (e) => handleIssueClick(item, e) : undefined}
                          sx={{
                            width: col.width,
                            fontSize: { xs: 12, sm: 14 },
                            wordWrap: "break-word",
                            whiteSpace: "normal",
                            cursor: col.name === "issue" ? "pointer" : "default",
                            color: col.name === "issue" ? "#1120A3" : "inherit",
                            textDecoration: col.name === "issue" ? "underline" : "none",
                            "&:hover": col.name === "issue" ? { color: "#0d1991" } : undefined,
                          }}
                        >
                          {item[col.name] ?? "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
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
                "& .MuiTablePagination-toolbar": { fontSize: { xs: 12, sm: 14 }, minHeight: { xs: 48, sm: 52 } },
                "& .MuiTablePagination-selectLabel": { fontSize: { xs: 12, sm: 14 } },
                "& .MuiTablePagination-displayedRows": { fontSize: { xs: 12, sm: 14 } },
              }}
            />
          </Box>
        </div>
      </Container>
    </>
  );
};

export default TableListAgency;