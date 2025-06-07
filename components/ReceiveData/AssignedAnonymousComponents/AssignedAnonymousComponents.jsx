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

// Mock data updated to 2025 (ค.ศ.) / 2568 (พ.ศ.)
const mockData = [
  {
    id: 1,
    name: "นางสาวณภัทร มีความสุข",
    subject: "พฤติกรรมเจ้าหน้าที่กกต.ไม่เหมาะสม",
    docNo4: "125/68",
    docNo: "สป-กค-2568-5-001-125",
    docNo2: "สป-สร-2568-5-001-125",
    docNo3: "สตป-2568-001-125",
    receiveDate: "2025-05-15T00:00:00.000Z", // 15 พ.ค. 2568
  },
  {
    id: 2,
    name: "นางสาวจารุณี สิขังสมาธิมี",
    subject: "การเรียกรับผลประโยชน์ที่มิควรได้",
    docNo4: "124/68",
    docNo: "สป-กค-2568-5-002-124",
    docNo2: "สป-สร-2568-5-002-124",
    docNo3: "สตป-2568-002-124",
    receiveDate: "2025-05-16T00:00:00.000Z", // 16 พ.ค. 2568
  },
  {
    id: 3,
    name: "บริษัท สกายเทค อินโนเวชั่น จำกัด",
    subject: "ไม่สามารถเบิกค่ารักษาพยาบาลได้",
    docNo4: "123/68",
    docNo: "สป-กค-2568-5-003-123",
    docNo2: "สป-สร-2568-5-003-123",
    docNo3: "สตป-2568-003-123",
    receiveDate: "2025-05-17T00:00:00.000Z", // 17 พ.ค. 2568
  },
  {
    id: 4,
    name: "นายสมชาย เจริญสุข",
    subject: "ทุจริตในการจัดซื้อจัดจ้าง",
    docNo4: "126/68",
    docNo: "สป-กค-2568-5-004-126",
    docNo2: "สป-สร-2568-5-004-126",
    docNo3: "สตป-2568-004-126",
    receiveDate: "2025-05-20T00:00:00.000Z", // 20 พ.ค. 2568
  },
  {
    id: 5,
    name: "นางวิไลวรรณ สร้างบารมี",
    subject: "ละเว้นการปฏิบัติหน้าที่ราชการ",
    docNo4: "127/68",
    docNo: "สป-กค-2568-5-005-127",
    docNo2: "สป-สร-2568-5-005-127",
    docNo3: "สตป-2568-005-127",
    receiveDate: "2025-05-22T00:00:00.000Z", // 22 พ.ค. 2568
  },
  {
    id: 6,
    name: "นายอนุชา ใจดี",
    subject: "หลอกลวงประชาชน",
    docNo4: "128/68",
    docNo: "สป-กค-2568-5-006-128",
    docNo2: "สป-สร-2568-5-006-128",
    docNo3: "สตป-2568-006-128",
    receiveDate: "2025-05-23T00:00:00.000Z", // 23 พ.ค. 2568
  },
  {
    id: 7,
    name: "นางสาวปิยะนุช รักษ์งาม",
    subject: "การให้บริการล่าช้า",
    docNo4: "129/68",
    docNo: "สป-กค-2568-5-007-129",
    docNo2: "สป-สร-2568-5-007-129",
    docNo3: "สตป-2568-007-129",
    receiveDate: "2025-05-25T00:00:00.000Z", // 25 พ.ค. 2568
  },
  {
    id: 8,
    name: "นายธีระพงษ์ สุขใส",
    subject: "ฉ้อโกงเงินสวัสดิการ",
    docNo4: "130/68",
    docNo: "สป-กค-2568-5-008-130",
    docNo2: "สป-สร-2568-5-008-130",
    docNo3: "สตป-2568-008-130",
    receiveDate: "2025-05-27T00:00:00.000Z", // 27 พ.ค. 2568
  },
  {
    id: 9,
    name: "นางประภาพร มั่งคั่ง",
    subject: "ประพฤติมิชอบ",
    docNo4: "131/68",
    docNo: "สป-กค-2568-5-009-131",
    docNo2: "สป-สร-2568-5-009-131",
    docNo3: "สตป-2568-009-131",
    receiveDate: "2025-05-28T00:00:00.000Z", // 28 พ.ค. 2568
  },
  {
    id: 10,
    name: "นายสุรพล ดีมาก",
    subject: "ปัญหาสิ่งแวดล้อม",
    docNo4: "132/68",
    docNo: "สป-กค-2568-5-010-132",
    docNo2: "สป-สร-2568-5-010-132",
    docNo3: "สตป-2568-010-132",
    receiveDate: "2025-05-30T00:00:00.000Z", // 30 พ.ค. 2568
  },
  {
    id: 11,
    name: "นางสาวมณีรัตน์ แสงทอง",
    subject: "ข้อเสนอแนะการปรับปรุงระบบ",
    docNo4: "133/68",
    docNo: "สป-กค-2568-6-011-133",
    docNo2: "สป-สร-2568-6-011-133",
    docNo3: "สตป-2568-011-133",
    receiveDate: "2025-06-01T00:00:00.000Z", // 1 มิ.ย. 2568
  },
  {
    id: 12,
    name: "นายกิตติพงษ์ เรืองรอง",
    subject: "การซื้อขายออนไลน์ผิดกฎหมาย",
    docNo4: "134/68",
    docNo: "สป-กค-2568-6-012-134",
    docNo2: "สป-สร-2568-6-012-134",
    docNo3: "สตป-2568-012-134",
    receiveDate: "2025-06-03T00:00:00.000Z", // 3 มิ.ย. 2568
  },
  {
    id: 13,
    name: "นางอรพิน วิสุทธิ์",
    subject: "ร้องเรียนทั่วไป เรื่องการบริการ",
    docNo4: "135/68",
    docNo: "สป-กค-2568-6-013-135",
    docNo2: "สป-สร-2568-6-013-135",
    docNo3: "สตป-2568-013-135",
    receiveDate: "2025-06-05T00:00:00.000Z", // 5 มิ.ย. 2568
  },
  {
    id: 14,
    name: "นายชัยวัฒน์ สมบูรณ์",
    subject: "พฤติกรรมเจ้าหน้าที่ไม่สุภาพ",
    docNo4: "136/68",
    docNo: "สป-กค-2568-6-014-136",
    docNo2: "สป-สร-2568-6-014-136",
    docNo3: "สตป-2568-014-136",
    receiveDate: "2025-06-07T00:00:00.000Z", // 7 มิ.ย. 2568 (วันนี้)
  },
  {
    id: 15,
    name: "นางสาวสุพัตรา มีสุข",
    subject: "ทุจริตการเบิกค่าตอบแทน",
    docNo4: "137/68",
    docNo: "สป-กค-2568-6-015-137",
    docNo2: "สป-สร-2568-6-015-137",
    docNo3: "สตป-2568-015-137",
    receiveDate: "2025-06-14T00:00:00.000Z", // 14 มิ.ย. 2568 ← เพิ่มวันที่นี้เพื่อทดสอบ
  },
  {
    id: 16,
    name: "นายวิทยา อัจฉริยะ",
    subject: "ละเว้นการดูแลทรัพย์สินของรัฐ",
    docNo4: "138/68",
    docNo: "สป-กค-2568-4-016-138",
    docNo2: "สป-สร-2568-4-016-138",
    docNo3: "สตป-2568-016-138",
    receiveDate: "2025-04-20T00:00:00.000Z", // 20 เม.ย. 2568
  },
  {
    id: 17,
    name: "นางนิภา สีสวย",
    subject: "หลอกลวงการขายของออนไลน์",
    docNo4: "139/68",
    docNo: "สป-กค-2568-4-017-139",
    docNo2: "สป-สร-2568-4-017-139",
    docNo3: "สตป-2568-017-139",
    receiveDate: "2025-04-25T00:00:00.000Z", // 25 เม.ย. 2568
  },
  {
    id: 18,
    name: "นายรัตนชัย สง่างาม",
    subject: "การเรียกรับสินบนจากประชาชน",
    docNo4: "140/68",
    docNo: "สป-กค-2568-4-018-140",
    docNo2: "สป-สร-2568-4-018-140",
    docNo3: "สตป-2568-018-140",
    receiveDate: "2025-04-30T00:00:00.000Z", // 30 เม.ย. 2568
  },
  {
    id: 19,
    name: "นางสาวชนิกานต์ รื่นเริง",
    subject: "การให้บริการไม่เป็นธรรม",
    docNo4: "141/68",
    docNo: "สป-กค-2568-3-019-141",
    docNo2: "สป-สร-2568-3-019-141",
    docNo3: "สตป-2568-019-141",
    receiveDate: "2025-03-18T00:00:00.000Z", // 18 มี.ค. 2568
  },
  {
    id: 20,
    name: "นายปราโมทย์ เจษฎาวรรณ",
    subject: "ฉ้อโกงงบประมาณโครงการ",
    docNo4: "142/68",
    docNo: "สป-กค-2568-3-020-142",
    docNo2: "สป-สร-2568-3-020-142",
    docNo3: "สตป-2568-020-142",
    receiveDate: "2025-03-22T00:00:00.000Z", // 22 มี.ค. 2568
  },
  {
    id: 21,
    name: "นางขวัญจิรา พร้อมจิต",
    subject: "ประพฤติมิชอบในการปฏิบัติงาน",
    docNo4: "143/68",
    docNo: "สป-กค-2568-3-021-143",
    docNo2: "สป-สร-2568-3-021-143",
    docNo3: "สตป-2568-021-143",
    receiveDate: "2025-03-25T00:00:00.000Z", // 25 มี.ค. 2568
  },
  {
    id: 22,
    name: "นายอภิชาติ มั่นคง",
    subject: "ปัญหาสิ่งแวดล้อมในชุมชน",
    docNo4: "144/68",
    docNo: "สป-กค-2568-2-022-144",
    docNo2: "สป-สร-2568-2-022-144",
    docNo3: "สตป-2568-022-144",
    receiveDate: "2025-02-14T00:00:00.000Z", // 14 ก.พ. 2568
  },
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

  // ฟังก์ชันแปลงจาก Thai date object เป็น Date object (แก้ไขใหม่)
  const convertThaiDateToDate = (thaiDateObj) => {
    if (!thaiDateObj) return null;

    console.log("🔍 Thai date object received:", thaiDateObj);

    // ใช้ year (ค.ศ.) โดยตรงจาก DateThaiPickerService
    // เพราะ DateThaiPickerService ส่งมาทั้ง year (ค.ศ.) และ buddhistYear (พ.ศ.)
    const gregorianYear = thaiDateObj.year; // ใช้ year ที่เป็น ค.ศ. โดยตรง

    console.log(
      `🔍 Converting: ${thaiDateObj.day}/${thaiDateObj.month}/${thaiDateObj.buddhistYear} (Thai) -> ${thaiDateObj.day}/${thaiDateObj.month}/${gregorianYear} (Gregorian)`
    );

    // สร้าง Date object (เดือนใน JavaScript เริ่มจาก 0)
    return new Date(gregorianYear, thaiDateObj.month - 1, thaiDateObj.day);
  };

  // ฟังก์ชันแปลง ISO date string เป็น Date object และเปรียบเทียบ
  const isSameDate = (isoDateString, thaiDateObject) => {
    if (!isoDateString || !thaiDateObject) return false;

    console.log("🔍 Comparing dates:");
    console.log("  - ISO string:", isoDateString);
    console.log("  - Thai date object:", thaiDateObject);

    // แปลง ISO string เป็น Date
    const isoDate = new Date(isoDateString);
    console.log("  - ISO date parsed:", isoDate);

    // แปลง Thai date object เป็น Date
    const thaiDate = convertThaiDateToDate(thaiDateObject);
    console.log("  - Thai date converted:", thaiDate);

    if (!thaiDate) return false;

    // เปรียบเทียบเฉพาะวัน เดือน ปี (ไม่รวมเวลา)
    const isSame =
      isoDate.getFullYear() === thaiDate.getFullYear() &&
      isoDate.getMonth() === thaiDate.getMonth() &&
      isoDate.getDate() === thaiDate.getDate();

    console.log("  - Are they the same?", isSame);
    console.log(
      "  - ISO: ",
      `${isoDate.getDate()}/${isoDate.getMonth() + 1}/${isoDate.getFullYear()}`
    );
    console.log(
      "  - Thai:",
      `${thaiDate.getDate()}/${
        thaiDate.getMonth() + 1
      }/${thaiDate.getFullYear()}`
    );

    return isSame;
  };

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Handler สำหรับ DateThaiPickerService
  const handleDateChange = (thaiDate) => {
    console.log("🔍 Date changed to:", thaiDate);
    setFilters((prev) => ({ ...prev, receiveDate: thaiDate }));
  };

  // ฟังก์ชันกรองข้อมูล
  const handleSearch = () => {
    console.log("🔍 Searching with filters:", filters);

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

      // แก้ไขการเปรียบเทียบวันที่
      const matchDate = filters.receiveDate
        ? isSameDate(item.receiveDate, filters.receiveDate)
        : true;

      const matches = matchName && matchSubject && matchDocNo4 && matchDate;

      console.log(`🔍 Item ${item.id} (${item.name}):`, {
        matchName,
        matchSubject,
        matchDocNo4,
        matchDate,
        finalMatch: matches,
      });

      return matches;
    });

    console.log("🔍 Filtered results:", filtered);
    setFilteredRows(filtered);
  };

  const handleClearSearch = () => {
    console.log("🧹 Clearing search");
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
          บัตรสนเท่ห์ที่ได้รับมอบหมาย ({filteredRows.length} รายการ)
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
                  placeholder="กรอกชื่อผู้ร้อง"
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
                  placeholder="กรอกชื่อเรื่อง"
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
                  placeholder="กรอกเลขที่ สรร."
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
              flexDirection: isMobile ? "column" : "row",
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
                  : { xs: "100%", sm: "120px", md: "100px", lg: "auto" },
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
                flex: isBelow1350 ? 0 : { xs: 0, sm: 0, lg: 0 },
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
                  : { xs: "100%", sm: "120px", md: "100px", lg: "auto" },
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
                flex: isBelow1350 ? 0 : { xs: 0, sm: 0, lg: 0 },
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
