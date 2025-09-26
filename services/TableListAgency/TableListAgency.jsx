// services/TableListAgency/TableListAgency.jsx
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import styles from "./TableListAgency.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";

// ⬇️ API ที่มีอยู่ในโปรเจกต์เดิม (ใช้ดึง options)
// - ถ้าในโปรเจกต์คุณ path ต่างกัน ปรับ import ให้ตรงได้เลย
import {
  GetDepartments,
  GetMyRelatedComplaints,
} from "@pages/api/complaint/complaint";

const TableListAgency = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const excelRef = useRef();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isSm = useMediaQuery(theme.breakpoints.down("md"));
  const isBelow1200 = useMediaQuery("(max-width:1200px)");

  // -------------------- ฟิลเตอร์ 5 ช่อง --------------------
  const [filters, setFilters] = useState({
    claimantName: "",
    receiptNumber: "",
    agency: "",
    responsibleOfficer: "",
    status: "",
  });

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((s) => ({ ...s, [field]: value }));
  };

  // options ดรอปดาวน์
  const [agencyOptions, setAgencyOptions] = useState([]);
  const [officerOptions, setOfficerOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([
    { value: "ทราบ", label: "ทราบ" },
    { value: "ทราบไว้ชั้นหนึ่ง", label: "ทราบไว้ชั้นหนึ่ง" },
    { value: "ยุติเรื่องได้", label: "ยุติเรื่องได้" },
    { value: "เห็นชอบ", label: "เห็นชอบ" },
    { value: "อยุ่ระหว่างดำเนินการ", label: "อยุ่ระหว่างดำเนินการ" },
  ]);

  // โหลด options จาก API (มี fallback จาก data)
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
          // fallback จากข้อมูลบนตาราง
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
        // ดึงรายชื่อจาก API เรื่องร้องเรียนของฉัน แล้วรวบรวมชื่อผู้รับผิดชอบ
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
          // fallback จากข้อมูลบนตาราง
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
      receiptNumber: "",
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

  // --- Excel Export Handler ---
  const handleExportExcel = () => {
    const today = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const filename = `รายงานสรุปเรื่องร้องเรียนของหน่วยงาน_${today}.xlsx`;
    const exportLabel = `วันที่ export: ${today}`;

    // เตรียมข้อมูล (คงเดิม)
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
      {/* Global CSS ของ DatePicker (คงเดิม) */}
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
              sx={{ fontSize: { xs: 16, sm: 18 }, height: { xs: 40, sm: 50 }, px: { xs: 2, sm: 3 } }}
            >
              <Box sx={{ fontWeight: "bold", textAlign: "center" }}>{title}</Box>
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
          <Box mt={2} className={styles.headerBar2} display="flex" alignItems="center" justifyContent="space-between" sx={{ fontSize: 18, height: 50, px: 3 }}>
            <Box sx={{ fontWeight: "bold" }}>{title}</Box>
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
            <InputText
              label="ชื่อผู้ร้อง"
              placeholder=""
              value={filters.claimantName}
              onChange={handleChange("claimantName")}
              size="small"
            />
            <InputText
              label="เลขรับ สรร."
              placeholder=""
              value={filters.receiptNumber}
              onChange={handleChange("receiptNumber")}
              size="small"
            />
            <SelectField
              label="หน่วยงาน/ชื่อ-สกุล (ผู้ร้อง)"
              value={filters.agency}
              onChange={handleChange("agency")}
              options={agencyOptions}
              size="small"
            />
            {/* <SelectField
              label="เจ้าหน้าที่ผู้รับผิดชอบ"
              value={filters.responsibleOfficer}
              onChange={handleChange("responsibleOfficer")}
              options={officerOptions}
              size="small"
            /> */}
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
              overflowX: isBelow1200 ? "auto" : "visible",
              px: { xs: 1, sm: 2 },
              pb: 1,
              position: "relative",
              zIndex: 0,
              "&::-webkit-scrollbar": { height: "8px" },
              "&::-webkit-scrollbar-track": { backgroundColor: "#f1f1f1", borderRadius: "4px" },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "#888", borderRadius: "4px", "&:hover": { backgroundColor: "#555" } },
            }}
          >
            <Table ref={excelRef} sx={{ minWidth: isBelow1200 ? 1400 : "100%" }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ width: { xs: 60, sm: 80 }, fontSize: { xs: 12, sm: 14 } }}>
                    ลำดับ
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.name} sx={{ width: col.width, fontSize: { xs: 12, sm: 14 }, fontWeight: 600, color: "#1120a3" }}>
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
                    <TableCell align="center" sx={{ width: { xs: 60, sm: 80 }, fontWeight: 600, color: "#1120A3", fontSize: { xs: 12, sm: 14 } }}>
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
