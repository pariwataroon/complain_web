import React, { useState, useMemo, useRef  } from "react";
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
import { exportExcel } from "@utils/exportExcel";
import { exportElementToPDF } from "@utils/exportPDF";
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

  /* ฟิลเตอร์ที่ผู้ใช้กรอก (จะส่งกลับเมื่อกดค้นหา) */
  const [filters, setFilters] = useState({
    claimantName: "",
    // citizenId: "",
    subject: "",
    docGov: "",
    agency: "",
    docKk: "",
    docSr: "",
    docStp: "",
  });

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
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
      docKk: "",
      docSr: "",
      docStp: "",
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
  const exportLabel = [
    "ลำดับ",
    "ชื่อผู้ร้อง",
    // "บัตรประชาชน",
    "ชื่อเรื่อง",
    "เลข สป.กค.",
    "เลข สป.สร.",
    "เลข สตป.",
    "เลข สรร.",
  ];

  // แปลงข้อมูลเป็น array of array (AOA)
  const exportData = data.map((item, idx) => [
    idx + 1,
    item?.name ?? "-",
    // formatCitizenId_null(item?.citizenId ?? "-"),
    item?.subject ?? "-",
    item?.docKk ?? "-",
    item?.docSr ?? "-",
    item?.docStp ?? "-",
    item?.docGov ?? "-",
  ]);

  // เว้น 1 แถวก่อน header ตามคำขอ
  const aoaWithHeader = [
    [],
    [],
    exportLabel,
    ...exportData,
  ];

  exportExcel(aoaWithHeader, {
    filename,
    sheetName: "Sheet1",
    title,
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
              <SelectField
                label="หน่วยงานอื่นที่ส่งเรื่องมายัง กค."
                inputLabel="เลือกหน่วยงาน"
                options={agencyOptions}
                value={filters.agency}
                onChange={handleChange("agency")}
              />
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
              <SelectField
                label="หน่วยงานอื่นที่ส่งเรื่องมายัง กค."
                inputLabel="เลือกหน่วยงาน"
                options={agencyOptions}
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

            {/* Export buttons - Responsive for xs */}
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
                  <TableCell className={styles.ellipsisCell}>
                    {item?.subject ?? "-"}
                  </TableCell>
                  <TableCell>{item?.docKk ?? "-"}</TableCell>
                  <TableCell>{item?.docSr ?? "-"}</TableCell>
                  <TableCell>{item?.docStp ?? "-"}</TableCell>
                  <TableCell>{item?.docGov ?? "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
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
