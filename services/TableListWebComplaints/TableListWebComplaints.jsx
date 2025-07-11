import React, { useState, useCallback, useRef } from "react";
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
import styles from "./TableListWebComplaints.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices"; // เปลี่ยนเป็น icon ไม้กวาด
import { exportExcel } from "@utils/exportExcel";
import { exportElementToPDF } from "@utils/exportPDF";

const TableListWebComplaints = ({
  data = [],
  title = "",
  navigateTo = "",
  issueTypeOptions = [],
  issueSubTypeOptions = [],
  onSearch = () => {},
  page,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  total = 0,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery("(max-width:1200px)");
  const isExtraSmallScreen = useMediaQuery("(max-width:600px)");

  const [filters, setFilters] = useState({
    claimantName: "",
    issueType: "",
    issueSubType: "",
    subject: "",
    accusedName: "",
    ssoNo: "",
  });

  // Handle input text change
  const handleInputChange = (field) => (e) => {
    const value = e?.target?.value || "";
    setFilters((prev) => ({
      ...prev,
      [field]: String(value),
    }));
  };

  // Handle SelectField change
  const handleSelectChange = (field) => (e) => {
    let finalValue = "";

    if (e && typeof e === "object") {
      if (e.target && e.target.value !== undefined) {
        const selectedValue = e.target.value;

        if (typeof selectedValue === "object" && selectedValue !== null) {
          finalValue = String(selectedValue.value || "");
        } else {
          finalValue = String(selectedValue || "");
        }
      } else if (e.value !== undefined) {
        finalValue = String(e.value || "");
      }
    } else {
      finalValue = String(e || "");
    }

    setFilters((prev) => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  // เมื่อคลิกปุ่มค้นหา
  const handleSearchClick = useCallback(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  // เมื่อคลิกปุ่มเคลียร์การค้นหา
  const handleClearSearch = useCallback(() => {
    const cleared = {
      claimantName: "",
      issueType: "",
      issueSubType: "",
      subject: "",
      accusedName: "",
      ssoNo: "",
    };
    setFilters(cleared);
    onPageChange(0);
    onSearch(cleared);
  }, [onPageChange, onSearch]);

  // กรณีคลิกแถวใด ให้ navigate ไปยังหน้า edit
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
  const today = new Date().toLocaleDateString("th-TH");
  const filename = `รายงาน${title}_${today}.xlsx`;

  // สมมุติว่า data มีฟิลด์ channel เช่น 'เว็บไซต์', 'แอดมิน' (คุณอาจต้องเปลี่ยนตรงนี้ตามโครงสร้างจริง)
  const grouped = data.reduce((acc, item) => {
    const channel = item.channel || "ไม่ระบุช่องทาง";
    if (!acc[channel]) acc[channel] = [];
    acc[channel].push(item);
    return acc;
  }, {});

  const exportData = [];

  Object.entries(grouped).forEach(([channel, items]) => {

    // แถว header
    exportData.push([
      "ลำดับ",
      "ชื่อผู้ร้อง",
      "ประเภทเรื่อง",
      "ชื่อเรื่อง",
      "ชื่อผู้ถูกร้อง",
      "เลขที่ สรร",
    ]);

    if (items.length > 0) {
      items.forEach((item, idx) => {
        exportData.push([
          `${idx + 1}`,
          item.complainant_name || "-",
          item.complaint_type || "-",
          item.subject || "-",
          item.respondent_name || "-",
          item.complaint_number || "-",
        ]);
      });
    } else {
      exportData.push(["💬 ยังไม่พบข้อมูลในช่องทางนี้"]);
    }

    // เพิ่มบรรทัดว่างระหว่างกลุ่ม
    exportData.push([]);
  });

  exportExcel(exportData, {
    filename,
    sheetName: "รายงานเรื่องร้องเรียน",
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

              {/* <SelectField
                label="ประเภทเรื่องย่อย"
                inputLabel="เลือกประเภทเรื่องย่อย"
                options={issueSubTypeOptions}
                value={String(filters.issueSubType || "")}
                onChange={handleSelectChange("issueSubType")}
                name="issueSubType"
              /> */}

              <InputText
                label="เลขที่ สรร"
                inputLabel="กรอกเลขที่ สรร"
                value={String(filters.ssoNo || "")}
                onChange={handleInputChange("ssoNo")}
                onKeyPress={handleKeyPress}
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
                value={String(filters.accusedName || "")}
                onChange={handleInputChange("accusedName")}
                onKeyPress={handleKeyPress}
              />
            </Box>

            {/* Action Buttons - Responsive Layout */}
            {isExtraSmallScreen ? (
              // Extra Small (xs) - แยกบรรทัด
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

                {/* Export Buttons - แยกบรรทัดและแยกปุ่ม */}
                <Box display="flex" flexDirection="column" gap={1}>
                  <ExportButton label="Export PDF" onClick={handleExportPDF} />
                  <ExportButton label="Export Excel" onClick={handleExportExcel} />
                </Box>
              </Box>
            ) : (
              // Small and up (sm+) - แถวเดียว
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
              >
                {/* Search & Clear Buttons */}
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

                {/* Export Buttons */}
                <Box display="flex" gap={1}>
                  <ExportButton label="Export PDF" onClick={handleExportPDF} />
                  <ExportButton label="Export Excel" onClick={handleExportExcel} />
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          // Desktop Layout (>= 1200px)
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

              {/* <SelectField
                label="ประเภทเรื่องย่อย"
                inputLabel="เลือกประเภทเรื่องย่อย"
                options={issueSubTypeOptions}
                value={String(filters.issueSubType || "")}
                onChange={handleSelectChange("issueSubType")}
                name="issueSubType"
              /> */}

              <InputText
                label="เลขที่ สรร"
                inputLabel="กรอกเลขที่ สรร"
                value={String(filters.ssoNo || "")}
                onChange={handleInputChange("ssoNo")}
                onKeyPress={handleKeyPress}
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
                value={String(filters.accusedName || "")}
                onChange={handleInputChange("accusedName")}
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
                <CleaningServicesIcon />
              </IconButton>
            </Box>

            {/* Export buttons - Responsive for xs */}
            <Box
              display="flex"
              flexDirection={isExtraSmallScreen ? "column" : "row"}
              gap={1}
              sx={{ flexShrink: 0 }}
            >
              <ExportButton label="Export PDF" onClick={handleExportPDF} />
              <ExportButton label="Export Excel" onClick={handleExportExcel} />
            </Box>
          </Box>
        )}
      </Box>

      {/* Table - Conditional Scrolling based on screen size */}
      <Box
        
        className={styles.tableWrapper}
        id="table-results"
        sx={{
          overflowX: isSmallScreen ? "auto" : "visible",
          px: 2,
          pb: 1,
        }}
      >
        <Table
          ref={tableRef}
          sx={{
            minWidth: isSmallScreen ? 1400 : "100%",
            width: isSmallScreen ? 1400 : "100%",
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
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                ประเภทเรื่อง
              </TableCell>
              <TableCell sx={{ width: 300, fontWeight: "bold" }}>
                ชื่อเรื่อง
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                ชื่อผู้ถูกร้อง
              </TableCell>
              <TableCell sx={{ width: 160, fontWeight: "bold" }}>
                เลขที่ สรร
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map((item, idx) => (
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
                  <TableCell>{item.complainant_name || "-"}</TableCell>
                  <TableCell>{item.complaint_type || "-"}</TableCell>
                  <TableCell className={styles.ellipsisCell}>
                    {item.subject || "-"}
                  </TableCell>
                  <TableCell>{item.respondent_name || "-"}</TableCell>
                  <TableCell>{item.complaint_number || "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 3, color: "#999" }}
                >
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25]}
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) =>
            onRowsPerPageChange(parseInt(e.target.value, 10))
          }
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

export default TableListWebComplaints;
