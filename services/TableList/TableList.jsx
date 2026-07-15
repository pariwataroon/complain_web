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
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import styles from "./TableList.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import { formatCitizenId_null } from "@utils/Formats";
import { exportElementToPDF } from "@utils/exportPDF";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { GetAllOutsideDepartments } from "@pages/api/outsideDepartments/outsideDepartments";
import dayjs from "dayjs";
import * as XLSX from "xlsx-js-style";
const TableList = ({
  data = [],
  title = "",
  navigateTo = "",
  agencyOptions = [],
  onSearch = () => {},
  handleNavigateTo,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery("(max-width:1200px)");
  const isExtraSmallScreen = useMediaQuery("(max-width:600px)");

  // State สำหรับ options หน่วยงานภายนอก (ดึงจาก API เหมือน TableListBox)
  const [outsidedepartmentOptions, setOutsideDepartmentOptions] = useState([]);

  useEffect(() => {
    const fetchOutsideDepartments = async () => {
      try {
        const res = await GetAllOutsideDepartments();
        const list = res?.res_data?.items || res?.res_data || res || [];
        const mapped = (Array.isArray(list) ? list : []).map((d) => {
          const name =
            d?.name ||
            d?.department_name ||
            d?.title ||
            d?.shortName ||
            d?.code ||
            "";
          return name ? { value: name, label: name } : null;
        }).filter(Boolean);
        setOutsideDepartmentOptions(mapped);
      } catch (err) {
        console.error("Error fetching outside departments:", err);
        setOutsideDepartmentOptions([]);
      }
    };
    fetchOutsideDepartments();
  }, []);

  /* ฟิลเตอร์ที่ผู้ใช้กรอก (จะส่งกลับเมื่อกดค้นหา) */
  const [filters, setFilters] = useState({
    claimantName: "",
    // citizenId: "",
    subject: "",
    docGov: "",
    agency: "",
    caseCode: "",
    docKk: "",
    docSr: "",
    docStp: "",
    startDate: null,
    endDate: null,
  });

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // ฟังก์ชันสำหรับเปลี่ยนวันที่และค้นหาทันที
  const handleDateChange = (field) => (date) => {
    const newFilters = { ...filters, [field]: date };
    setFilters(newFilters);
    setPage(0);
    onSearch(newFilters);
  };

  /* pagination */
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
    console.log("Searching with filters:", filters); // Debug log
    setPage(0); // Reset to first page when searching
    onSearch(filters);
  };

  const handleClearSearch = () => {
    const cleared = {
      claimantName: "",
      // citizenId: "",
      subject: "",
      docGov: "",
      agency: "",
      caseCode: "",
      docKk: "",
      docSr: "",
      docStp: "",
      startDate: null,
      endDate: null,
    };
    setFilters(cleared);
    setPage(0);
    onSearch(cleared);
  };

  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  // Handle Enter key press for search
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  const tableRef = useRef(null);

    const handleExportPDF = () => {
      const today = new Date().toLocaleDateString("th-TH");
      const filename = `รายงาน${title}_${today}.pdf`;
      exportElementToPDF(tableRef, filename);
    };
  const handleExportExcel = () => {
  if (!data || data.length === 0) return;

  const today = new Date().toLocaleDateString("th-TH");
  const filename = `รายงาน${title}_${today}.xlsx`;

  // กำหนดหัวตาราง
  const headers = [
    "ลำดับ",
    "ชื่อผู้ร้อง",
    "ชื่อเรื่อง",
    "เลข สป.กค.",
    "เลข สป.สร.",
    "เลข สตป.",
    "เลข สรร.",
    "รหัสเรื่อง",
    "ช่องทาง",
    "หน่วยงาน",
    "สถานะ",
  ];

  // ชื่อช่องทางภาษาไทย
  const channelLabels = {
    website: "เว็บไซต์",
    opm1111: "OPM 1111",
    eoffice: "สารบรรณอิเลกทรอนิกส์",
    letter: "จดหมาย",
    email: "อีเมล",
    central_service: "ศูนย์บริการร่วม",
  };

  // สถานะภาษาไทย — ค่าจริงจาก API /document-storage (ตรงกับ statusMapEnToTh ใน ComplaintArchives)
  const statusLabels = {
    submitted: "ส่งคำร้อง",
    sent_to_agency: "มอบหมายเจ้าหน้าที่",
    sent_to_external: "ส่งหน่วยงานภายนอก",
    in_process: "อยู่ระหว่างดำเนินการ",
    in_review: "อยู่ระหว่างการพิจารณา",
    tracking: "ติดตามผลการพิจารณา",
    reviewed: "แจ้งผลการพิจารณา",
    completed: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
  };

  // แปลงข้อมูล — ใช้ nameRaw / subjectRaw (string) แทน React element
  const exportData = data.map((item, idx) => [
    idx + 1,
    item?.nameRaw ?? item?.name ?? "-",
    item?.subjectRaw ?? item?.subject ?? "-",
    item?.docKk ?? "-",
    item?.docSr ?? "-",
    item?.docStp ?? "-",
    item?.docGov ?? "-",
    item?.caseCode ?? "-",
    channelLabels[item?.channel] ?? item?.channel ?? "-",
    item?.agency ?? "-",
    statusLabels[item?.status] ?? item?.status ?? "-",
  ]);

  // สร้าง worksheet ด้วย xlsx-js-style
  const numCols = headers.length;
  const wsData = [
    [title],                          // แถวที่ 1: ชื่อรายงาน
    ["หน่วยงาน กระทรวงการคลัง"],     // แถวที่ 2: หน่วยงาน
    [`ข้อมูล ณ วันที่ ${today}`],       // แถวที่ 3: วันที่
    [],                                // แถวว่าง
    headers,                           // แถวที่ 5: หัวคอลัมน์
    ...exportData,                     // ข้อมูล
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge cells หัวรายงาน
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } });
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } });
  ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } });

  // ความกว้างคอลัมน์ — รวมไม่เกิน 150 chars สำหรับ A4 Landscape
  ws['!cols'] = [
    { wch: 5 },   // ลำดับ
    { wch: 18 },  // ชื่อผู้ร้อง
    { wch: 22 },  // ชื่อเรื่อง
    { wch: 13 },  // เลข สป.กค.
    { wch: 13 },  // เลข สป.สร.
    { wch: 12 },  // เลข สตป.
    { wch: 18 },  // เลข สรร.
    { wch: 15 },  // รหัสเรื่อง
    { wch: 14 },  // ช่องทาง
    { wch: 18 },  // หน่วยงาน
    { wch: 12 },  // สถานะ
  ];

  // จัดรูปแบบเซลล์ — สวยงาม พร้อมพิมพ์ A4
  const borderStyle = {
    top: { style: "thin", color: { rgb: "AAAAAA" } },
    bottom: { style: "thin", color: { rgb: "AAAAAA" } },
    left: { style: "thin", color: { rgb: "AAAAAA" } },
    right: { style: "thin", color: { rgb: "AAAAAA" } },
  };

  // คอลัมน์ที่ต้องจัดกลาง: ลำดับ(0), เลขอ้างอิง(3-6), รหัสเรื่อง(7), ช่องทาง(8), สถานะ(10)
  const centerCols = new Set([0, 3, 4, 5, 6, 7, 8, 10]);

  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      if (!ws[addr].s) ws[addr].s = {};

      if (R <= 2) {
        // หัวรายงาน — พื้นเหลืองอ่อน ตัวหนา
        ws[addr].s.font = { name: "Cordia New", sz: 12, bold: true };
        ws[addr].s.fill = { fgColor: { rgb: "FEFAEF" } };
        ws[addr].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
      } else if (R === 4) {
        // หัวคอลัมน์ — พื้นน้ำเงิน ตัวหนา ขาว
        ws[addr].s.fill = { fgColor: { rgb: "1120A3" } };
        ws[addr].s.font = { name: "Cordia New", sz: 10, bold: true, color: { rgb: "FFFFFF" } };
        ws[addr].s.border = borderStyle;
        ws[addr].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
      } else if (ws[addr].v === "") {
        // แถวว่าง — skip
        continue;
      } else {
        // ข้อมูล — สลับสีแถว
        const isOdd = (R - 5) % 2 === 1;
        ws[addr].s.fill = isOdd ? { fgColor: { rgb: "F5F7FF" } } : { fgColor: { rgb: "FFFFFF" } };
        ws[addr].s.border = borderStyle;
        ws[addr].s.font = { name: "Cordia New", sz: 10 };
        ws[addr].s.alignment = {
          horizontal: centerCols.has(C) ? "center" : "left",
          vertical: "center",
          wrapText: true,
        };
      }
    }
  }

  // Page Setup A4 Landscape พอดีหน้า
  ws['!pageSetup'] = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  ws['!margins'] = { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
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
      <Box className={styles.headerBar}>{title}</Box>

      {/* Search Bar - Responsive Layout */}
      <Box sx={{ px: 2, py: 2 }}>
        {isSmallScreen ? (
          // Mobile/Tablet Layout (< 1200px)
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Search Fields Grid */}
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
              }}
              gap={2}
            >
              <InputText
                label="ชื่อผู้ร้อง"
                inputLabel="กรอกชื่อผู้ร้อง"
                value={filters.claimantName}
                onChange={handleChange("claimantName")}
                onKeyPress={handleKeyPress}
              />
              {/* <InputText
                label="เลขบัตรประชาชน"
                inputLabel="กรอกเลขบัตรประชาชน"
                value={filters.citizenId}
                onChange={handleChange("citizenId")}
                onKeyPress={handleKeyPress}
              /> */}
              <InputText
                label="ชื่อเรื่อง"
                inputLabel="กรอกชื่อเรื่อง"
                value={filters.subject}
                onChange={handleChange("subject")}
                onKeyPress={handleKeyPress}
              />
              <InputText
                label="เลขที่ส่วนรับราชการ"
                inputLabel="กรอกเลขที่ส่วนรับราชการ"
                value={filters.docGov}
                onChange={handleChange("docGov")}
                onKeyPress={handleKeyPress}
              />
              <InputText
                label="รหัสเรื่อง"
                inputLabel="กรอกรหัสเรื่อง"
                value={filters.caseCode}
                onChange={handleChange("caseCode")}
                onKeyPress={handleKeyPress}
              />
              <SelectField
                label="หน่วยงานอื่นที่ส่งเรื่องมายัง กค."
                inputLabel="เลือกหน่วยงาน"
                options={outsidedepartmentOptions}
                value={filters.agency}
                onChange={handleChange("agency")}
              />

              {/* DatePicker สำหรับช่วงวันที่ */}
              <Box>
                <Box sx={{ mb: 0.5, fontSize: "0.875rem", fontWeight: 500, color: "#1120A3" }}>
                  ตั้งแต่วันที่
                </Box>
                <DateThaiPickerService
                  value={filters.startDate}
                  onChange={handleDateChange("startDate")}
                  placeholder="เลือกวันที่เริ่มต้น"
                />
              </Box>

              <Box>
                <Box sx={{ mb: 0.5, fontSize: "0.875rem", fontWeight: 500, color: "#1120A3" }}>
                  ถึงวันที่
                </Box>
                <DateThaiPickerService
                  value={filters.endDate}
                  onChange={handleDateChange("endDate")}
                  placeholder="เลือกวันที่สิ้นสุด"
                />
              </Box>
            </Box>

            {/* Action Buttons - Responsive Layout */}
            {isExtraSmallScreen ? (
              // Extra Small (xs) - แยกบรรทัดและเรียงแนวตั้ง
              <Box display="flex" flexDirection="column" gap={2}>
                {/* Search & Clear Buttons */}
                <Box display="flex" justifyContent="center" gap={1}>
                  <IconButton
                    onClick={handleSearchClick}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": { bgcolor: "#0b1580" },
                      height: 40,
                      width: 40,
                    }}
                    title="ค้นหา"
                  >
                    <SearchIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleClearSearch}
                    sx={{
                      bgcolor: "#dc3545",
                      color: "#fff",
                      "&:hover": { bgcolor: "#c82333" },
                      height: 40,
                      width: 40,
                    }}
                    title="ล้างการค้นหา"
                  >
                    <CleaningServicesIcon />
                  </IconButton>
                </Box>

                {/* Navigation Button */}
                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    onClick={handleNavigateTo}
                    sx={{
                      backgroundColor: "#1120A3",
                      color: "#fff",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      px: 3,
                      py: 1,
                      height: 40,
                      "&:hover": { backgroundColor: "#0b1580" },
                      width: "100%",
                      maxWidth: 300,
                    }}
                  >
                    คัดกรองเรื่องร้องเรียน
                  </Button>
                </Box>

                {/* Export Buttons - แยกบรรทัด */}
                <Box display="flex" flexDirection="column" gap={1}>
                  <ExportButton label="Export PDF" onClick={handleExportPDF} />
                  <ExportButton label="Export Excel" onClick={handleExportExcel} />
                </Box>
              </Box>
            ) : (
              // Small and up (sm+) - จัดเป็น 2 แถว
              <Box display="flex" flexDirection="column" gap={2}>
                {/* แถวที่ 1: Search, Clear, Navigate */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Box display="flex" gap={1}>
                    <IconButton
                      onClick={handleSearchClick}
                      sx={{
                        bgcolor: "#1120A3",
                        color: "#fff",
                        "&:hover": { bgcolor: "#0b1580" },
                        height: 40,
                        width: 40,
                      }}
                      title="ค้นหา"
                    >
                      <SearchIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleClearSearch}
                      sx={{
                        bgcolor: "#dc3545",
                        color: "#fff",
                        "&:hover": { bgcolor: "#c82333" },
                        height: 40,
                        width: 40,
                      }}
                      title="ล้างการค้นหา"
                    >
                      <CleaningServicesIcon />
                    </IconButton>
                  </Box>

                  <Button
                    variant="contained"
                    onClick={handleNavigateTo}
                    sx={{
                      backgroundColor: "#1120A3",
                      color: "#fff",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      px: 3,
                      py: 1,
                      height: 40,
                      "&:hover": { backgroundColor: "#0b1580" },
                      minWidth: 220,
                    }}
                  >
                    คัดกรองเรื่องร้องเรียน
                  </Button>
                </Box>

                {/* แถวที่ 2: Export Buttons */}
                <Box display="flex" justifyContent="center" gap={1}>
                  <ExportButton label="Export PDF" onClick={handleExportPDF} />
                  <ExportButton label="Export Excel" onClick={handleExportExcel} />
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          // Desktop Layout (>= 1200px)
          <Box display="flex" flexDirection="column" gap={2}>
            {/* แถวที่ 1: ฟิลด์ค้นหาทั่วไป */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={1}
              sx={{
                flexWrap: "nowrap",
                whiteSpace: "nowrap",
                overflowX: "auto",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{ flexWrap: "nowrap" }}
              >
                <InputText
                  label="ชื่อผู้ร้อง"
                  inputLabel="กรอกชื่อผู้ร้อง"
                  value={filters.claimantName}
                  onChange={handleChange("claimantName")}
                  onKeyPress={handleKeyPress}
                />
                {/* <InputText
                  label="เลขบัตรประชาชน"
                  inputLabel="กรอกเลขบัตรประชาชน"
                  value={filters.citizenId}
                  onChange={handleChange("citizenId")}
                  onKeyPress={handleKeyPress}
                /> */}
                <InputText
                  label="ชื่อเรื่อง"
                  inputLabel="กรอกชื่อเรื่อง"
                  value={filters.subject}
                  onChange={handleChange("subject")}
                  onKeyPress={handleKeyPress}
                />
                <InputText
                  label="เลข สรร."
                  inputLabel="กรอกเลข สรร."
                  value={filters.docGov}
                  onChange={handleChange("docGov")}
                  onKeyPress={handleKeyPress}
                />
                <InputText
                  label="รหัสเรื่อง"
                  inputLabel="กรอกรหัสเรื่อง"
                  value={filters.caseCode}
                  onChange={handleChange("caseCode")}
                  onKeyPress={handleKeyPress}
                />
                <SelectField
                  label="หน่วยงานอื่นที่ส่งเรื่องมายัง กค."
                  inputLabel="เลือกหน่วยงาน"
                  options={outsidedepartmentOptions}
                  value={filters.agency}
                  onChange={handleChange("agency")}
                />

                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0b1580" },
                    flexShrink: 0,
                    height: 40,
                    width: 40,
                  }}
                  title="ค้นหา"
                >
                  <SearchIcon />
                </IconButton>
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    bgcolor: "#dc3545",
                    color: "#fff",
                    "&:hover": { bgcolor: "#c82333" },
                    flexShrink: 0,
                    height: 40,
                    width: 40,
                  }}
                  title="ล้างการค้นหา"
                >
                  <CleaningServicesIcon />
                </IconButton>

                <Button
                  variant="contained"
                  onClick={handleNavigateTo}
                  sx={{
                    backgroundColor: "#1120A3",
                    color: "#fff",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    px: 3,
                    py: 1,
                    minWidth: 220,
                    height: 40,
                    "&:hover": { backgroundColor: "#0b1580" },
                    flexShrink: 0,
                  }}
                >
                  คัดกรองเรื่องร้องเรียน
                </Button>
              </Box>

              {/* Export buttons */}
              <Box
                display="flex"
                flexDirection={isExtraSmallScreen ? "column" : "row"}
                gap={1}
                sx={{ flexShrink: 0 }}
              >
                <ExportButton label="Export PDF" onClick={handleExportPDF}/>
                <ExportButton label="Export Excel" onClick={handleExportExcel}/>
              </Box>
            </Box>

            {/* แถวที่ 2: DatePicker */}
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ minWidth: 200 }}>
                <Box sx={{ mb: 0.5, fontSize: "0.875rem", fontWeight: 500, color: "#1120A3" }}>
                  ตั้งแต่วันที่
                </Box>
                <DateThaiPickerService
                  value={filters.startDate}
                  onChange={handleDateChange("startDate")}
                  placeholder="เลือกวันที่เริ่มต้น"
                />
              </Box>

              <Box sx={{ minWidth: 200 }}>
                <Box sx={{ mb: 0.5, fontSize: "0.875rem", fontWeight: 500, color: "#1120A3" }}>
                  ถึงวันที่
                </Box>
                <DateThaiPickerService
                  value={filters.endDate}
                  onChange={handleDateChange("endDate")}
                  placeholder="เลือกวันที่สิ้นสุด"
                />
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Results Summary */}
      <Box sx={{ px: 2, py: 1 }}>
        <Box sx={{ color: "#666", fontSize: "0.9rem" }}>
          พบข้อมูล {data.length} รายการ
        </Box>
      </Box>

      {/* Table - Conditional Scrolling based on screen size */}
      <Box
      ref={tableRef}
      className={styles.tableWrapper}
      id="table-results"
        sx={{
          overflowX: isSmallScreen ? "auto" : "visible",
          px: 2,
          pb: 1,
        }}
      >
        <Table
          sx={{
            minWidth: isSmallScreen ? 1600 : "100%",
            width: isSmallScreen ? 1600 : "100%",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 80, fontWeight: "bold" }}>
                ลำดับ
              </TableCell>
              <TableCell sx={{ width: 200, fontWeight: "bold" }}>
                ชื่อผู้ร้อง
              </TableCell>
              {/* <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                บัตรประชาชน
              </TableCell> */}
              <TableCell sx={{ width: 300, fontWeight: "bold" }}>
                ชื่อเรื่อง
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                เลข สป.กค.
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                เลข สป.สร.
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                เลข สตป.
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                เลข สรร.
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                รหัสเรื่อง
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pagedData.length > 0 ? (
              pagedData.map((item, idx) => (
                <TableRow
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f7ff" },
                    "&:nth-of-type(even)": { backgroundColor: "#fafafa" },
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600, color: "#1120A3" }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>{item?.name ?? "-"}</TableCell>
                  {/* <TableCell>
                    {formatCitizenId_null(item?.citizenId ?? "-")}
                  </TableCell> */}
                  <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "break-word", lineHeight: 1.5, maxWidth: 350 }}>
                    {item?.subject ?? "-"}
                  </TableCell>
                  <TableCell>{item?.docKk ?? "-"}</TableCell>
                  <TableCell>{item?.docSr ?? "-"}</TableCell>
                  <TableCell>{item?.docStp ?? "-"}</TableCell>
                  <TableCell>{item?.docGov ?? "-"}</TableCell>
                  <TableCell>{item?.caseCode ?? "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  align="center"
                  sx={{ py: 3, color: "#999" }}
                >
                  ไม่พบข้อมูลที่ค้นหา
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25, 50]}
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="แถวต่อหน้า:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
          }
          sx={{ borderTop: "1px solid #eee" }}
        />
      </Box>
    </Container>
  );
};

export default TableList;
