import React, { useState } from "react";
import { Box, IconButton, useMediaQuery, useTheme } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAssignedComp from "@services/TableAssignedComp/TableAssignedComp";
import InputText from "@services/InputText/InputText";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import ExportButton from "@services/ExportButton/ExportButton";
import { useRouter } from "next/router";
import styles from "@services/TableAssignedComp/TableAssignedComp.module.scss";

const breadcrumbItems = [
  {
    label: "บัตรสนเท่ห์ที่ได้รับมอบหมาย",
    icon: (
      <img
        src="/icons/Pencil.png"
        alt="pencil"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
];

// Mock data matching the table columns in the design
const mockData = [
  {
    id: 1,
    name: "นางสาวณภัทร มีความสุข",
    subject: "พฤติกรรมเจ้าหน้าที่กกต.ไม่เหมาะสม",
    docNo4: "125/26",
    docNo: "สป-กค-1234-5-678-9",
    docNo2: "สป-สร-1234-5-678-9",
    docNo3: "สตป-1234-5-678-9",
    receiveDate: "2025-01-17T00:00:00.000Z",
  },
  {
    id: 2,
    name: "นางสาวจารุณี สิขังสมาธิมี",
    subject: "พฤติกรรมเจ้าหน้าที่กกต.ไม่เหมาะสม",
    docNo4: "124/26",
    docNo: "สป-กค-1234-5-678-9",
    docNo2: "สป-สร-1234-5-678-9",
    docNo3: "สตป-1234-5-678-9",
    receiveDate: "2025-01-18T00:00:00.000Z",
  },
  {
    id: 3,
    name: "บริษัท สกายเทค อินโนเวชั่น จำกัด",
    subject: "ไม่สามารถเบิกค่ารักษาพยาบาลได้",
    docNo4: "123/26",
    docNo: "สป-กค-1234-5-678-9",
    docNo2: "สป-สร-1234-5-678-9",
    docNo3: "สตป-1234-5-678-9",
    receiveDate: "2025-01-18T00:00:00.000Z",
  },
  // ... เหลือข้อมูล mockData เหมือนเดิม
];

const AssignedAnonymousComponents = () => {
  // Responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.down("md")); // < 900px
  const isSmallLaptop = useMediaQuery(theme.breakpoints.down("lg")); // < 1200px

  // Custom breakpoint สำหรับ 1350px
  const isBelow1350 = useMediaQuery("(max-width: 1350px)");

  // state เก็บผลลัพธ์ที่กรองแล้ว
  const [filteredRows, setFilteredRows] = useState(mockData);

  // Filter state (เก็บเฉพาะค่าที่กรอกใน form)
  const [filters, setFilters] = useState({
    claimantName: "",
    subject: "",
    docNo4: "",
    receiveDate: null,
  });

  const router = useRouter();

  // ฟังก์ชันแปลงจาก Thai date object เป็น Date object
  const convertThaiDateToDate = (thaiDate) => {
    if (!thaiDate) return null;
    return new Date(thaiDate.year, thaiDate.month - 1, thaiDate.day);
  };

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Handler สำหรับ DateThaiPickerService
  const handleDateChange = (thaiDate) => {
    setFilters((prev) => ({ ...prev, receiveDate: thaiDate }));
  };

  // ฟังก์ชันกรองข้อมูล
  const handleSearch = () => {
    const filtered = mockData.filter((item) => {
      const matchName = filters.claimantName
        ? item.name.toLowerCase().includes(filters.claimantName.toLowerCase())
        : true;
      const matchSubject = filters.subject
        ? item.subject.toLowerCase().includes(filters.subject.toLowerCase())
        : true;
      const matchDocNo4 = filters.docNo4
        ? item.docNo4.includes(filters.docNo4)
        : true;

      // แก้ไขการเปรียบเทียบวันที่สำหรับ DateThaiPickerService
      const matchDate = filters.receiveDate
        ? (() => {
            const selectedDate = convertThaiDateToDate(filters.receiveDate);
            const itemDate = new Date(item.receiveDate);

            // เปรียบเทียบเฉพาะวัน เดือน ปี (ไม่รวมเวลา)
            return (
              selectedDate &&
              selectedDate.getFullYear() === itemDate.getFullYear() &&
              selectedDate.getMonth() === itemDate.getMonth() &&
              selectedDate.getDate() === itemDate.getDate()
            );
          })()
        : true;

      return matchName && matchSubject && matchDocNo4 && matchDate;
    });
    setFilteredRows(filtered);
  };

  const handleClearSearch = () => {
    const cleared = {
      claimantName: "",
      subject: "",
      docNo4: "",
      receiveDate: null,
    };
    setFilters(cleared);
    setFilteredRows(mockData); // รีเซ็ตข้อมูลกลับเป็นทั้งหมด
  };

  const handleRowClick = (item) => {
    if (item.id) router.push(`/admin/edit/assigned-anonymous/${item.id}`);
  };

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />

      {/* Container สำหรับ Header และ Filters */}
      <Box
        sx={{
          backgroundColor: "#fff",
          borderRadius: 2,
          boxShadow: "0 6px 18px rgba(0,0,0,.06)",
          mb: 2,
          overflow: "visible",
          position: "relative",
          mx: isMobile ? 1 : 0,
        }}
      >
        {/* Header */}
        <Box
          className={styles.headerBar}
          sx={{
            height: isMobile ? 40 : 50,
            fontSize: isMobile ? "14px" : "18px",
            padding: isMobile ? "0 16px" : "0 24px",
          }}
        />
        <Box
          className={styles.headerBar2}
          sx={{
            height: isMobile ? 40 : 50,
            fontSize: isMobile ? "16px" : "18px",
            padding: isMobile ? "0 16px" : "0 24px",
          }}
        >
          บัตรสนเท่ห์ที่ได้รับมอบหมาย
        </Box>

        {/* Filters */}
        <Box
          sx={{
            px: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
            pb: { xs: 1.5, sm: 2, md: 2 },
            pt: { xs: 0.5, sm: 1, md: 1 },
            display: "flex",
            flexDirection: isBelow1350 || isMobile ? "column" : "row",
            gap: { xs: 2, sm: 1.5, md: 1 },
            justifyContent: "space-between",
            alignItems: isBelow1350 || isMobile ? "stretch" : "flex-end",
          }}
        >
          {/* Filter Controls */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              flexWrap: isBelow1350
                ? "wrap"
                : { xs: "nowrap", sm: "wrap", lg: "nowrap" },
              gap: { xs: 1.5, sm: 1.2, md: 1 },
              width: { xs: "100%" },
              alignItems: isBelow1350
                ? "stretch"
                : { xs: "stretch", lg: "flex-end" },
              justifyContent: { xs: "stretch", sm: "flex-start" },
            }}
          >
            {/* Input Fields Container */}
            <Box
              sx={{
                display: isMobile
                  ? "flex"
                  : isBelow1350
                  ? "grid"
                  : { xs: "flex", sm: "grid", lg: "flex" },
                flexDirection: isMobile
                  ? "column"
                  : { xs: "column", lg: "row" },
                gridTemplateColumns:
                  isBelow1350 && !isMobile
                    ? "repeat(2, 1fr)"
                    : {
                        sm: "repeat(2, 1fr)",
                        md: "repeat(2, minmax(140px, 1fr))",
                        lg: "none",
                      },
                gap: { xs: 1.5, sm: 1.2, md: 1, lg: 1 },
                width: { xs: "100%" },
                alignItems: isBelow1350
                  ? "stretch"
                  : { xs: "stretch", lg: "flex-end" },
              }}
            >
              {/* ชื่อผู้ร้อง */}
              <Box
                sx={{
                  width: isBelow1350 ? "100%" : { xs: "100%" },
                  minWidth: isBelow1350
                    ? "100%"
                    : { sm: 140, md: 160, lg: 180 },
                  maxWidth: isBelow1350
                    ? "100%"
                    : { sm: 200, md: 220, lg: 240 },
                  gridColumn: isMobile
                    ? "unset"
                    : isBelow1350
                    ? "auto"
                    : { sm: "auto", md: "auto" },
                }}
              >
                <InputText
                  label="ชื่อผู้ร้อง"
                  value={filters.claimantName}
                  onChange={handleChange("claimantName")}
                />
              </Box>

              {/* ชื่อเรื่อง */}
              <Box
                sx={{
                  width: isBelow1350 ? "100%" : { xs: "100%" },
                  minWidth: isBelow1350
                    ? "100%"
                    : { sm: 140, md: 160, lg: 180 },
                  maxWidth: isBelow1350
                    ? "100%"
                    : { sm: 200, md: 220, lg: 240 },
                  gridColumn: isMobile
                    ? "unset"
                    : isBelow1350
                    ? "auto"
                    : { sm: "auto", md: "auto" },
                }}
              >
                <InputText
                  label="ชื่อเรื่อง"
                  value={filters.subject}
                  onChange={handleChange("subject")}
                />
              </Box>

              {/* เลขที่ สรร. */}
              <Box
                sx={{
                  width: isBelow1350 ? "100%" : { xs: "100%" },
                  minWidth: isBelow1350
                    ? "100%"
                    : { sm: 120, md: 140, lg: 160 },
                  maxWidth: isBelow1350
                    ? "100%"
                    : { sm: 180, md: 200, lg: 220 },
                  gridColumn: isMobile
                    ? "unset"
                    : isBelow1350
                    ? "1"
                    : { sm: "1", md: "1" },
                }}
              >
                <InputText
                  label="เลขที่ สรร."
                  value={filters.docNo4}
                  onChange={handleChange("docNo4")}
                />
              </Box>

              {/* วันที่รับเรื่อง */}
              <Box
                sx={{
                  width: isBelow1350 ? "100%" : { xs: "100%" },
                  minWidth: isBelow1350
                    ? "100%"
                    : { sm: 160, md: 180, lg: 200 },
                  maxWidth: isBelow1350
                    ? "100%"
                    : { sm: 220, md: 240, lg: 280 },
                  position: "relative",
                  zIndex: 1,
                  gridColumn: isMobile
                    ? "unset"
                    : isBelow1350
                    ? "2"
                    : { sm: "2", md: "2" },
                }}
              >
                <DateThaiPickerService
                  label="วันที่รับเรื่อง"
                  value={filters.receiveDate}
                  onChange={handleDateChange}
                  placeholder="เลือกวันที่รับเรื่อง"
                />
              </Box>
            </Box>

            {/* Search Buttons */}
            <Box
              sx={{
                display: "flex",
                gap: { xs: 1.5, sm: 1, md: 1 },
                alignItems: isBelow1350
                  ? "center"
                  : { xs: "center", lg: "flex-end" },
                justifyContent: isBelow1350
                  ? "center"
                  : {
                      xs: "center",
                      sm: "flex-start",
                      lg: "flex-start",
                    },
                width: isBelow1350 ? "100%" : { xs: "100%", sm: "auto" },
                mt: { xs: 1, sm: 0 },
                mb: isBelow1350 ? 0 : { xs: 0, sm: 0, lg: "16px" },
                gridColumn: isBelow1350
                  ? "1 / -1"
                  : { sm: "1 / -1", lg: "auto" },
                order: isBelow1350 ? 1 : { sm: 1, lg: 0 },
              }}
            >
              <IconButton
                onClick={handleSearch}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
                  width: isBelow1350 ? 44 : { xs: 56, sm: 44, md: 42, lg: 40 },
                  height: isBelow1350 ? 44 : { xs: 56, sm: 44, md: 42, lg: 40 },
                }}
              >
                <SearchIcon fontSize={isMobile ? "large" : "medium"} />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
                  width: isBelow1350 ? 44 : { xs: 56, sm: 44, md: 42, lg: 40 },
                  height: isBelow1350 ? 44 : { xs: 56, sm: 44, md: 42, lg: 40 },
                }}
              >
                <SearchOffIcon fontSize={isMobile ? "large" : "medium"} />
              </IconButton>
            </Box>
          </Box>

          {/* Export Buttons */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row", // เพิ่ม flexDirection
              gap: { xs: 1.5, sm: 1, md: 1.2 },
              justifyContent: isBelow1350
                ? "center"
                : { xs: "center", sm: "center", lg: "flex-end" },
              width: isBelow1350
                ? "100%"
                : { xs: "100%", sm: "100%", lg: "auto" },
              alignItems: isBelow1350
                ? "center"
                : { xs: "center", lg: "flex-end" },
              mt: { xs: 1, sm: 1 },
              mb: isBelow1350 ? 0 : { xs: 0, sm: 0, lg: "16px" },
              flexWrap: { xs: "nowrap", sm: "wrap", lg: "nowrap" },
              maxWidth: isBelow1350 ? "none" : { lg: "300px" },
            }}
          >
            <ExportButton
              label={
                isMobile
                  ? "PDF"
                  : isBelow1350 || isTablet
                  ? "PDF"
                  : "Export PDF"
              }
              sx={{
                minWidth: isBelow1350
                  ? "120px"
                  : { xs: "100%", sm: "120px", md: "100px", lg: "auto" }, // เปลี่ยน xs เป็น 100%
                fontSize: isBelow1350
                  ? "12px"
                  : { xs: "14px", sm: "12px", md: "13px", lg: "14px" },
                padding: isBelow1350
                  ? "8px 14px"
                  : {
                      xs: "12px 16px",
                      sm: "8px 14px",
                      md: "9px 16px",
                      lg: "8px 16px",
                    },
                fontWeight: 600,
                height: isBelow1350
                  ? "40px"
                  : { xs: "auto", sm: "40px", lg: "40px" },
                flex: isBelow1350 ? 0 : { xs: 0, sm: 0, lg: 0 }, // เปลี่ยน xs เป็น 0
              }}
            />
            <ExportButton
              label={
                isMobile
                  ? "Excel"
                  : isBelow1350 || isTablet
                  ? "Excel"
                  : "Export Excel"
              }
              sx={{
                minWidth: isBelow1350
                  ? "120px"
                  : { xs: "100%", sm: "120px", md: "100px", lg: "auto" }, // เปลี่ยน xs เป็น 100%
                fontSize: isBelow1350
                  ? "12px"
                  : { xs: "14px", sm: "12px", md: "13px", lg: "14px" },
                padding: isBelow1350
                  ? "8px 14px"
                  : {
                      xs: "12px 16px",
                      sm: "8px 14px",
                      md: "9px 16px",
                      lg: "8px 16px",
                    },
                fontWeight: 600,
                height: isBelow1350
                  ? "40px"
                  : { xs: "auto", sm: "40px", lg: "40px" },
                flex: isBelow1350 ? 0 : { xs: 0, sm: 0, lg: 0 }, // เปลี่ยน xs เป็น 0
              }}
            />
          </Box>
        </Box>

        {/* Table Component */}
        <Box
          sx={{
            overflowX: isTablet ? "auto" : "visible",
            overflowY: "visible",
            position: "relative",
          }}
        >
          <TableAssignedComp
            rows={filteredRows}
            handleRowClick={handleRowClick}
          />
        </Box>
      </Box>
    </>
  );
};

export default AssignedAnonymousComponents;
