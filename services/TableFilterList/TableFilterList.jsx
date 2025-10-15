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
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import styles from "./TableFilterList.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import { exportExcel } from "@utils/exportExcel";
import { exportElementToPDF } from "@utils/exportPDF";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import dayjs from "dayjs";

const TableFilterList = ({
  groups = [],
  title = "",
  navigateTo = "",
  issueTypeOptions = [],
  respondentOptions = [],
  onSearch = () => {},
}) => {
  const router = useRouter();

  const [filters, setFilters] = useState({
    claimantName: "",
    subject: "",
    issueType: "",
    respondentName: "",
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
  ];

  const mergedData = [];

  groups.forEach((group, index) => {
    const sheetTitle = `ช่องทางการรับเรื่อง : ${group.title} (${group.data.length} รายการ)`;

    if (index !== 0) {
      mergedData.push([]); // ✅ แถวว่างระหว่างกลุ่ม
    }

    mergedData.push([sheetTitle]);   // ✅ แถวหัวข้อกลุ่ม
    mergedData.push(headers);        // ✅ แถวหัวตาราง

    if (group.data.length > 0) {
      const rows = group.data.map((item, rowIdx) => [
        rowIdx + 1,
        item?.name || "-",
        item?.issueType || "-",
        item?.subject || "-",
        item?.respondentName || "-",
        item?.docNo || "-",
        item?.docNo2 || "-",
        item?.docNo3 || "-",
        item?.docNo4 || "-",
      ]);
      mergedData.push(...rows); // ✅ แถวข้อมูลจริง
    } else {
      mergedData.push([
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
      ]);
    }
  });

  exportExcel(mergedData, {
    filename,
    sheetName: "รายงานรวม",
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
                            <TableCell>{item?.subject ?? "-"}</TableCell>
                            <TableCell>{item?.respondentName ?? "-"}</TableCell>
                            <TableCell>{item?.docNo ?? "-"}</TableCell>
                            <TableCell>{item?.docNo2 ?? "-"}</TableCell>
                            <TableCell>{item?.docNo3 ?? "-"}</TableCell>
                            <TableCell>{item?.docNo4 ?? "-"}</TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={9}
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
