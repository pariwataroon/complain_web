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
                .map((it) => it?.complaint?.assigned_to)
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
    const today = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const filename = `รายงานสรุปเรื่องร้องเรียนของหน่วยงาน_${today}.xlsx`;
    const exportLabel = `วันที่ export: ${today}`;

    const rows = data.map((item, idx) => {
      const rowObj = { ลำดับ: idx + 1 };
      columns.forEach((col) => {
        rowObj[col.label] = item[col.name] ?? "-";
      });
      return rowObj;
    });

    exportExcel(excelRef, filename, "Sheet1", title, exportLabel);
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

        {/* ⬇️ แถบฟิลเตอร์ 5 ช่อง */}
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
                lg: "repeat(5, 1fr)",
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
            <SelectField
              label="สถานะเรื่อง"
              value={filters.status}
              onChange={handleChange("status")}
              options={statusOptions}
              size="small"
            />
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
                {pagedData.map((item, idx) => (
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
                        sx={{
                          width: col.width,
                          fontSize: { xs: 12, sm: 14 },
                          maxWidth: col.width,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
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