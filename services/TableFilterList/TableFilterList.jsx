import React, { useState, useCallback, useRef, useEffect } from "react";
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
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import styles from "./TableFilterList.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import { exportElementToPDF } from "@utils/exportPDF";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { GetAllOutsideDepartments } from "@pages/api/outsideDepartments/outsideDepartments";
import dayjs from "dayjs";
import * as XLSX from "xlsx-js-style";

const TableFilterList = ({
  groups = [],
  title = "",
  navigateTo = "",
  issueTypeOptions = [],
  respondentOptions = [],
  channelOptions = [],
  onSearch = () => {},
}) => {
  const router = useRouter();

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

  const [filters, setFilters] = useState({
    claimantName: "",
    subject: "",
    issueType: "",
    respondentName: "",
    channel: "",
    outagency: "",
    caseCode: "",
    startDate: null,
    endDate: null,
  });

  // Handle input text change
  const handleInputChange = (field) => (e) => {
    const value = e?.target?.value || "";
    setFilters((prev) => ({
      ...prev,
      [field]: String(value),
    }));
  };

  // Handle SelectField change - รองรับ SelectField component ของคุณ
  const handleSelectChange = (field) => (e) => {
    let finalValue = "";

    if (e && typeof e === "object") {
      if (e.target && e.target.value !== undefined) {
        // กรณี SelectField ส่ง {target: {name, value: selected}}
        const selectedValue = e.target.value;

        if (typeof selectedValue === "object" && selectedValue !== null) {
          // ถ้า selected เป็น object {value, label}
          finalValue = String(selectedValue.value || "");
        } else {
          // ถ้า selected เป็น primitive value
          finalValue = String(selectedValue || "");
        }
      } else if (e.value !== undefined) {
        // กรณีส่ง object {value, label} โดยตรง
        finalValue = String(e.value || "");
      }
    } else {
      // กรณีส่ง primitive value โดยตรง
      finalValue = String(e || "");
    }

    setFilters((prev) => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  const [paginationStates, setPaginationStates] = useState(
    groups.map(() => ({ page: 0, rowsPerPage: 10 }))
  );

  const handlePageChange = (groupIdx) => (_, newPage) => {
    setPaginationStates((prev) =>
      prev.map((p, i) => (i === groupIdx ? { ...p, page: newPage } : p))
    );
  };

  const handleRowsPerPageChange = (groupIdx) => (e) => {
    const newRowsPerPage = parseInt(e.target.value, 10);
    setPaginationStates((prev) =>
      prev.map((p, i) =>
        i === groupIdx ? { page: 0, rowsPerPage: newRowsPerPage } : p
      )
    );
  };

  const handleSearchClick = useCallback(() => {
    setPaginationStates(groups.map(() => ({ page: 0, rowsPerPage: 10 })));

    if (typeof onSearch === "function") {
      onSearch(filters);
    }
  }, [filters, onSearch, groups]);

  const handleClearSearch = useCallback(() => {
    const cleared = {
      claimantName: "",
      subject: "",
      issueType: "",
      respondentName: "",
      channel: "",
      outagency: "",
      caseCode: "",
      startDate: null,
      endDate: null,
    };
    setFilters(cleared);
    setPaginationStates(groups.map(() => ({ page: 0, rowsPerPage: 10 })));

    if (typeof onSearch === "function") {
      onSearch(cleared);
    }
  }, [onSearch, groups]);

  // ฟังก์ชันสำหรับเปลี่ยนวันที่และค้นหาทันที
  const handleDateChange = (field) => (date) => {
    const newFilters = { ...filters, [field]: date };
    setFilters(newFilters);
    setPaginationStates(groups.map(() => ({ page: 0, rowsPerPage: 10 })));

    if (typeof onSearch === "function") {
      onSearch(newFilters);
    }
  };


  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  const handleNavigateTo = () => router.push("/admin/AccountBox");

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
  const today = new Date().toLocaleDateString("th-TH");
  const filename = `รายงาน${title}_${today}.xlsx`;

  const headers = [
    "ลำดับ",
    "ชื่อผู้ร้อง",
    "ประเภทเรื่อง",
    "ชื่อเรื่อง",
    "ชื่อผู้ถูกร้อง",
    "เลขที่สป.กค",
    "เลขที่สป.สร",
    "เลขที่สตป.",
    "เลขที่สรร",
    "รหัสเรื่อง",
  ];

  const numCols = headers.length;
  const wsData = [
    [title],                          // แถวที่ 1: ชื่อรายงาน
    [`หน่วยงาน กระทรวงการคลัง`],     // แถวที่ 2: หน่วยงาน
    [`ข้อมูล ณ วันที่ ${today}`],       // แถวที่ 3: วันที่
    [],                                // แถวว่าง
  ];

  const groupTitleRows = new Set(); // ติดตามแถวหัวข้อกลุ่มเพื่อ merge
  let currentRow = 4; // เริ่มจากแถวที่ 5 (0-indexed = 4)

  groups.forEach((group, index) => {
    const sheetTitle = `ช่องทางการรับเรื่อง : ${group.title} (${group.data.length} รายการ)`;

    if (index !== 0) {
      wsData.push([]); // แถวว่างระหว่างกลุ่ม
      currentRow++;
    }

    wsData.push([sheetTitle]);   // แถวหัวข้อกลุ่ม
    groupTitleRows.add(currentRow);
    currentRow++;

    wsData.push(headers);        // แถวหัวตาราง
    currentRow++;

    if (group.data.length > 0) {
      const rows = group.data.map((item, rowIdx) => [
        rowIdx + 1,
        item?.name || "-",
        item?.issueType || "-",
        item?.subjectRaw || "-",
        item?.respondentName || "-",
        item?.docNo || "-",
        item?.docNo2 || "-",
        item?.docNo3 || "-",
        item?.docNo4 || "-",
        item?.caseCode || "-",
      ]);
      wsData.push(...rows);
      currentRow += rows.length;
    } else {
      wsData.push(["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"]);
      currentRow++;
    }
  });

  // สร้าง worksheet ด้วย xlsx-js-style
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge cells หัวรายงาน
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } });
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } });
  ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } });

  // Merge แถวหัวข้อกลุ่ม
  groupTitleRows.forEach(rowIdx => {
    ws['!merges'].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: numCols - 1 } });
  });

  // ความกว้างคอลัมน์ — คำนวณพอดี A4 Landscape (297mm - margins ~20mm ทั้งสองข้าง = ~257mm ≈ 97 chars ที่ font 11pt)
  // ใช้ scale factor จาก pixel width → char width (≈ 7.5 px/char ที่ font 11pt)
  ws['!cols'] = [
    { wch: 5 },   // ลำดับ
    { wch: 18 },  // ชื่อผู้ร้อง
    { wch: 14 },  // ประเภทเรื่อง
    { wch: 25 },  // ชื่อเรื่อง
    { wch: 18 },  // ชื่อผู้ถูกร้อง
    { wch: 14 },  // เลขที่สป.กค
    { wch: 14 },  // เลขที่สป.สร
    { wch: 12 },  // เลขที่สตป.
    { wch: 12 },  // เลขที่สรร
    { wch: 14 },  // รหัสเรื่อง
  ];

  // จัดรูปแบบเซลล์ — สวยงาม พร้อมพิมพ์ A4
  const borderStyle = {
    top: { style: "thin", color: { rgb: "AAAAAA" } },
    bottom: { style: "thin", color: { rgb: "AAAAAA" } },
    left: { style: "thin", color: { rgb: "AAAAAA" } },
    right: { style: "thin", color: { rgb: "AAAAAA" } },
  };

  // ระบุแถวที่เป็นหัวคอลัมน์ (เกิดหลังแถวหัวข้อกลุ่ม)
  const headerRows = new Set();
  let trackRow = 4;
  groups.forEach((group, index) => {
    if (index !== 0) trackRow++; // แถวว่าง
    trackRow++; // แถวหัวข้อกลุ่ม
    headerRows.add(trackRow); // แถวหัวคอลัมน์
    trackRow++; // header row itself
    trackRow += Math.max(group.data.length, 1); // data rows
  });

  const range = XLSX.utils.decode_range(ws['!ref']);
  let dataRowIndex = 0;

  // คอลัมน์ที่ต้อง align center
  const centerCols = new Set([0, 5, 6, 7, 8]); // ลำดับ, เลขสป.กค, สป.สร, สตป., สรร

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      if (!ws[addr].s) ws[addr].s = {};

      if (R <= 2) {
        // หัวรายงาน — พื้น gradient เหลือง
        ws[addr].s.font = { name: "Cordia New", sz: 12, bold: true };
        ws[addr].s.fill = { fgColor: { rgb: "FEFAEF" } };
        ws[addr].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
      } else if (groupTitleRows.has(R)) {
        // แถวหัวข้อกลุ่ม — ตัวหนา สีน้ำเงิน พื้นอ่อน
        ws[addr].s.font = { name: "Cordia New", sz: 11, bold: true, color: { rgb: "1120A3" } };
        ws[addr].s.alignment = { horizontal: "left", vertical: "center" };
        dataRowIndex = 0;
      } else if (headerRows.has(R)) {
        // หัวคอลัมน์ — พื้นน้ำเงิน ตัวหนา ขาว
        ws[addr].s.fill = { fgColor: { rgb: "1120A3" } };
        ws[addr].s.font = { name: "Cordia New", sz: 11, bold: true, color: { rgb: "FFFFFF" } };
        ws[addr].s.border = borderStyle;
        ws[addr].s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
        dataRowIndex = 0;
      } else if (ws[addr].v === "") {
        // แถวว่าง — skip
        continue;
      } else {
        // ข้อมูล — สลับสีแถว และ wrap text
        const isOdd = dataRowIndex % 2 === 1;
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
    // เพิ่ม dataRowIndex สำหรับแถวข้อมูล
    if (!groupTitleRows.has(R) && !headerRows.has(R) && R > 3 && wsData[R] && wsData[R].length > 1) {
      dataRowIndex++;
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
  ws['!margins'] = {
    left: 0.2,
    right: 0.2,
    top: 0.3,
    bottom: 0.3,
    header: 0.1,
    footer: 0.1,
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "รายงานรวม");
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

      {/* Search Filters */}
      <Box sx={{ px: 2, mt: 2 }}>
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
              <SelectField
                label="ช่องทางการรับเรื่อง"
                inputLabel="เลือกช่องทาง"
                options={channelOptions}
                value={String(filters.channel || "")}
                onChange={handleSelectChange("channel")}
                name="channel"
              />

              <SelectField
                label="หน่วยงานภายนอก"
                inputLabel="เลือกหน่วยงาน"
                options={outsidedepartmentOptions}
                value={String(filters.outagency || "")}
                onChange={handleSelectChange("outagency")}
                name="outagency"
              />

              <InputText
                label="ชื่อผู้ร้อง"
                inputLabel="กรอกชื่อผู้ร้อง"
                value={String(filters.claimantName || "")}
                onChange={handleInputChange("claimantName")}
                onKeyPress={handleKeyPress}
              />

              <SelectField
                label="ประเภทเรื่อง"
                inputLabel="เลือกประเภทเรื่อง"
                options={issueTypeOptions}
                value={String(filters.issueType || "")}
                onChange={handleSelectChange("issueType")}
                name="issueType"
              />

              <InputText
                label="ชื่อเรื่อง"
                inputLabel="กรอกชื่อเรื่อง"
                value={String(filters.subject || "")}
                onChange={handleInputChange("subject")}
                onKeyPress={handleKeyPress}
              />

              <InputText
                label="ชื่อผู้ถูกร้อง"
                inputLabel="กรอกชื่อผู้ถูกร้อง"
                value={String(filters.respondentName || "")}
                onChange={handleInputChange("respondentName")}
                onKeyPress={handleKeyPress}
              />

              <InputText
                label="รหัสเรื่อง"
                inputLabel="กรอกรหัสเรื่อง"
                value={String(filters.caseCode || "")}
                onChange={handleInputChange("caseCode")}
                onKeyPress={handleKeyPress}
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
                <SearchOffIcon />
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
                สถิติการทำงานของเจ้าหน้าที่
              </Button>
            </Box>

            <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
              <ExportButton label="Export PDF" onClick={handleExportPDF} />
              <ExportButton label="Export Excel" onClick={handleExportExcel} />
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
      </Box>

      {/* Groups Tables */}
      
      {groups.length > 0 ? (
        <Box ref={tableRef}>
          {groups.map((group, groupIdx) => {
          
          const { page, rowsPerPage } = paginationStates[groupIdx] || {
            page: 0,
            rowsPerPage: 10,
          };
          return (
            <Box key={groupIdx} sx={{ mt: 4 }}>
              <Box className={styles.headerBar}>
                {group.title} ({group.data.length} รายการ)
              </Box>

              <Box
                
                className={styles.tableWrapper}
                sx={{ overflowX: "auto", px: 2, pb: 1 }}
              >
                <Table sx={{ minWidth: 1400 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                        sx={{ width: 80, fontWeight: "bold" }}
                      >
                        ลำดับ
                      </TableCell>
                      <TableCell sx={{ width: 200, fontWeight: "bold" }}>
                        ชื่อผู้ร้อง
                      </TableCell>
                      <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                        ประเภทเรื่อง
                      </TableCell>
                      <TableCell sx={{ width: 300, fontWeight: "bold" }}>
                        ชื่อเรื่อง
                      </TableCell>
                      <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                        ชื่อผู้ถูกร้อง
                      </TableCell>
                      <TableCell sx={{ width: 200, fontWeight: "bold" }}>
                        เลขที่สป.กค
                      </TableCell>
                      <TableCell sx={{ width: 200, fontWeight: "bold" }}>
                        เลขที่สป.สร
                      </TableCell>
                      <TableCell sx={{ width: 200, fontWeight: "bold" }}>
                        เลขที่สตป.
                      </TableCell>
                      <TableCell sx={{ width: 160, fontWeight: "bold" }}>
                        เลขที่สรร
                      </TableCell>
                      <TableCell sx={{ width: 200, fontWeight: "bold" }}>
                        รหัสเรื่อง
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.data.length > 0 ? (
                      group.data
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((item, idx) => (
                          <TableRow
                            key={item.id}
                            onClick={() => handleRowClick(item, group.title)}
                            sx={{
                              cursor: "pointer",
                              "&:hover": { backgroundColor: "#f5f7ff" },
                              "&:nth-of-type(even)": {
                                backgroundColor: "#fafafa",
                              },
                            }}
                          >
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 600, color: "#1120A3" }}
                            >
                              {page * rowsPerPage + idx + 1}
                            </TableCell>
                            <TableCell>{item?.name ?? "-"}</TableCell>
                            <TableCell>{item?.issueType ?? "-"}</TableCell>
                            <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "break-word", lineHeight: 1.5, maxWidth: 350 }}>{item?.subject ?? "-"}</TableCell>
                            <TableCell>{item?.respondentName ?? "-"}</TableCell>
                            <TableCell>{item?.docNo ?? "-"}</TableCell>
                            <TableCell>{item?.docNo2 ?? "-"}</TableCell>
                            <TableCell>{item?.docNo3 ?? "-"}</TableCell>
                            <TableCell>{item?.docNo4 ?? "-"}</TableCell>
                            <TableCell>{item?.caseCode ?? "-"}</TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          align="center"
                          sx={{ py: 3, color: "#999", fontSize: '16px' }}
                        >
                          💬 ยังไม่พบข้อมูลในช่องทางนี้
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {group.data.length > 0 && (
                  <TablePagination
                    component="div"
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    count={group.data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handlePageChange(groupIdx)}
                    onRowsPerPageChange={handleRowsPerPageChange(groupIdx)}
                    labelRowsPerPage="แถวต่อหน้า:"
                    labelDisplayedRows={({ from, to, count }) =>
                      `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`
                      }`
                    }
                    sx={{ borderTop: "1px solid #eee" }}
                  />
                )}
              </Box>
            </Box>
          );
        })} </Box>
      ) : (
        <Box sx={{ textAlign: "center", py: 4, color: "#999" }}>
          <Box sx={{ fontSize: "1.2rem", mb: 2 }}>
            🔍 ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
          </Box>
          <Box sx={{ fontSize: "0.9rem" }}>
            ลองปรับเงื่อนไขการค้นหา หรือกดปุ่ม "ล้างการค้นหา"
            เพื่อแสดงข้อมูลทั้งหมด
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default TableFilterList;
