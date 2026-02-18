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
import { exportExcel } from "@utils/exportExcel";
import {
  GetDepartments,
  GetMyRelatedComplaints,
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
    (async () => {
      try {
        const res = await GetMyRelatedComplaints({ skip: 0, limit: 200 }).catch(
          () => null
        );
        let names = [];
        if (res?.res_data?.items?.length) {
          names = [
            ...new Set(
              res.res_data.items
                .map((it) => it?.complaint?.assigned_officer_full_name || it?.complaint?.assigned_to)
                .filter((x) => x && x !== "-")
            ),
          ].sort();
        } else {
          names = [
            ...new Set(
              data.map((d) => d.responsibleOfficer).filter((x) => x && x !== "-")
            ),
          ].sort();
        }
        setOfficerOptions(names.map((n) => ({ value: n, label: n })));
      } catch (e) {
        console.error("Load officers failed:", e);
        setOfficerOptions([]);
      }
    })();
  }, [data]);

  // -------------------- ตาราง --------------------
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
  const handleExportExcel = async () => {
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

    // ใช้ dynamic import เพื่อโหลด xlsx-js-style
    const XLSXStyle = await import("xlsx-js-style");

    // สร้างข้อมูลแถวต่อแถว
    const exportData = [];

    // แถวที่ 1: หัวข้อรายงาน (จัดกึ่งกลาง)
    exportData.push(["สรุปเรื่องร้องเรียนของหน่วยงาน"]);

    // แถวที่ 2: ช่วงวันที่ (จัดกึ่งกลาง)
    exportData.push([dateRangeText]);

    // แถวที่ 3: หน่วยงาน (จัดกึ่งกลาง)
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
        // สำหรับคอลัมน์สถานะเรื่อง ให้ใช้ค่าจาก statusOptions ถ้ามี
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
    const ws = XLSXStyle.utils.aoa_to_sheet(exportData);

    // จำนวนคอลัมน์ทั้งหมด
    const numCols = headerRow.length;

    // Merge cells สำหรับหัวข้อ (แถว 0-2)
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }, // หัวข้อ
      { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }, // วันที่
      { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } }, // หน่วยงาน
    ];

    // กำหนดความกว้างคอลัมน์
    ws["!cols"] = [
      { wch: 8 },  // ลำดับ
      { wch: 20 }, // ชื่อผู้ร้อง
      { wch: 15 }, // เลข สรร.
      { wch: 15 }, // ลงวันที่
      { wch: 25 }, // หน่วยงาน
      { wch: 30 }, // ชื่อเรื่อง
      { wch: 20 }, // ประเภทเรื่อง
      { wch: 30 }, // หนังสือส่งหน่วยงาน
      { wch: 25 }, // เจ้าหน้าที่
      { wch: 20 }, // สถานะ
    ];

    // จัดรูปแบบ style
    const range = XLSXStyle.utils.decode_range(ws["!ref"]);

    // Border style เดียวกันทั้งหมด
    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSXStyle.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        // สร้าง style object
        let style = {
          font: { name: "TH Sarabun", sz: 11 },
          alignment: { vertical: "center", wrapText: true },
        };

        // แถว 0-2: หัวข้อรายงาน (ตัวหนา 16pt, จัดกลาง, ไม่มีกรอบ)
        if (R <= 2) {
          style.font = { name: "TH Sarabun", sz: 16, bold: true };
          style.alignment = { horizontal: "center", vertical: "center", wrapText: true };
        }
        // แถวที่ 4: Header ตาราง (ตัวหนา 11pt, จัดกลาง, มีกรอบ, พื้นหลังเทา)
        else if (R === 4) {
          style.font = { name: "TH Sarabun", sz: 11, bold: true };
          style.alignment = { horizontal: "center", vertical: "center", wrapText: true };
          style.fill = { fgColor: { rgb: "D9D9D9" } };
          style.border = borderStyle;
        }
        // แถวข้อมูล (มีกรอบ, คอลัมน์ตัวเลข/วันที่จัดกลาง, อื่นๆ จัดซ้าย)
        else if (R > 4) {
          // คอลัมน์ที่จัดกลาง: ลำดับ(0), เลข สรร.(1), ลงวันที่(2)
          const centerColumns = [0, 1, 2];
          style.alignment = {
            horizontal: centerColumns.includes(C) ? "center" : "left",
            vertical: "center",
            wrapText: true
          };
          style.border = borderStyle;
        }

        ws[cellAddress].s = style;
      }
    }

    // ตั้งค่า Page Setup เป็น A4
    ws["!pageSetup"] = {
      paperSize: 9, // A4 = 9
      orientation: "portrait",
      fitToPage: false,
      scale: 100,
    };

    // ตั้งค่า margins
    ws["!margins"] = {
      left: 0.5,
      right: 0.5,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3,
    };

    // Export file
    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSXStyle.writeFile(wb, filename);
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
                  onClick={() => exportElementToPDF(pdfRef, "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf")}
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
              <ExportButton label="Export PDF" onClick={() => exportElementToPDF(pdfRef, "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf")} size="medium" />
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