import React, { useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAssignedComp from "@services/TableAssignedComp/TableAssignedComp";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Setup dayjs with Buddhist Era
dayjs.extend(buddhistEra);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");
const THAILAND_TIMEZONE = "Asia/Bangkok";
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

// Define the mockData array here
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
    receiveDate: "2025-06-07T00:00:00.000Z", // 7 มิ.ย. 2568
  },
  {
    id: 15,
    name: "นางสาวสุพัตรา มีสุข",
    subject: "ทุจริตการเบิกค่าตอบแทน",
    docNo4: "137/68",
    docNo: "สป-กค-2568-6-015-137",
    docNo2: "สป-สร-2568-6-015-137",
    docNo3: "สตป-2568-015-137",
    receiveDate: "2025-06-14T00:00:00.000Z", // 14 มิ.ย. 2568
  },
];

const AssignedAnonymousComponents = () => {
  // Responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.down("md")); // < 900px

  // state เก็บผลลัพธ์ที่กรองแล้ว
  const [filteredRows, setFilteredRows] = useState(mockData);

  // Filter state
  const [filters, setFilters] = useState({
    claimantName: "",
    subject: "",
    docNo4: "",
    receiveDate: null,
  });

  const router = useRouter();

  const compareDates = (itemDateStr, filterDateStr) => {
    if (!itemDateStr || !filterDateStr) return true;

    try {
      console.log("🔍 Date comparison:");
      console.log("  - Item date:", itemDateStr);
      console.log("  - Filter date:", filterDateStr);

      // แปลง string date เป็น dayjs objects และตั้งค่า timezone เป็นของไทย
      const itemDate = dayjs(itemDateStr).tz(THAILAND_TIMEZONE);
      const filterDate = dayjs(filterDateStr).tz(THAILAND_TIMEZONE);

      console.log(
        `  - Item date in Thai time: ${itemDate.format("YYYY-MM-DD")}`
      );
      console.log(
        `  - Filter date in Thai time: ${filterDate.format("YYYY-MM-DD")}`
      );

      // เปรียบเทียบเฉพาะวันที่ (ไม่รวมเวลา)
      const isMatch =
        itemDate.format("YYYY-MM-DD") === filterDate.format("YYYY-MM-DD");

      console.log(`  - Date match: ${isMatch}`);
      return isMatch;
    } catch (error) {
      console.error("Error comparing dates:", error);
      return true; // ถ้าเกิด error ให้แสดงข้อมูลทั้งหมด
    }
  };

  const handleFilterChange = (field, value) => {
    console.log(`Filter changed: ${field} = `, value);
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = () => {
    console.log("🔍 Searching with filters:", filters);

    const filtered = mockData.filter((item) => {
      // กรองตามชื่อผู้ร้อง
      const matchName = filters.claimantName
        ? item.name.toLowerCase().includes(filters.claimantName.toLowerCase())
        : true;

      // กรองตามชื่อเรื่อง
      const matchSubject = filters.subject
        ? item.subject.toLowerCase().includes(filters.subject.toLowerCase())
        : true;

      // กรองตามเลขที่ สรร.
      const matchDocNo4 = filters.docNo4
        ? item.docNo4.toLowerCase().includes(filters.docNo4.toLowerCase())
        : true;

      // กรองตามวันที่รับเรื่อง - โดยคำนึงถึง timezone
      const matchDate = compareDates(item.receiveDate, filters.receiveDate);

      const result = matchName && matchSubject && matchDocNo4 && matchDate;

      if (filters.receiveDate) {
        console.log(
          `Item ${item.id} (${item.name}): Date match = ${matchDate}`
        );
      }

      return result;
    });

    console.log(
      `🎯 Found ${filtered.length} items from ${mockData.length} total`
    );
    setFilteredRows(filtered);
  };

  // ฟังก์ชันล้างการค้นหา
  const handleClearSearch = () => {
    setFilters({
      claimantName: "",
      subject: "",
      docNo4: "",
      receiveDate: null,
    });
    setFilteredRows(mockData);
  };

  const handleRowClick = (item) => {
    if (item.id) router.push(`/admin/edit/assigned-anonymous/${item.id}`);
  };

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />

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
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          searchFilters={filters}
          onFilterChange={handleFilterChange}
          title="บัตรสนเท่ห์ที่ได้รับมอบหมาย"
        />
      </Box>
    </>
  );
};

export default AssignedAnonymousComponents;
