import { useState, useEffect } from "react";
import { Box, Grid } from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
import TopLeftService from "@services/DashBoardTopLeftService/DashBoardTopLeftService";
import TopRightService from "@services/DashBoardTopRightService/DashBoardTopRightService";
import BottomLeftService from "@services/DashBoardBottomLeftService/DashBoardBottomLeftService";
import BottomRightService from "@services/DashBoardBottomRightService/DashBoardBottomRightService";
import DashBoardCard from "@services/DashBoardCard/DashBoardCard";
import TopStatsSwiper from "@services/TopStatsSwiper/TopStatsSwiper";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";

const DashboardComponents_Main = () => {
  const [selectedYear, setSelectedYear] = useState("2567");
  const data = [selectedYear] || [];

  // State เป็น object เสมอ
  const [startDate, setStartDate] = useState({
    day: 31,
    month: 1,
    year: 2025,
  });

  const [endDate, setEndDate] = useState({
    day: 2,
    month: 4,
    year: 2025,
  });

  // Log state update
  useEffect(() => {
    console.log("state startDate (updated):", startDate);
  }, [startDate]);
  useEffect(() => {
    console.log("state endDate (updated):", endDate);
  }, [endDate]);

  // Helper function สำหรับ format วันที่แบบไทย (year + 543)
  const formatThaiDate = (dateObj) => {
    if (
      !dateObj ||
      typeof dateObj.day !== "number" ||
      typeof dateObj.month !== "number" ||
      typeof dateObj.year !== "number"
    )
      return "-";
    const thaiMonths = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    const buddhistYear = dateObj.year + 543;
    return `${dateObj.day} ${
      thaiMonths[dateObj.month - 1]
    } พ.ศ. ${buddhistYear}`;
  };

  const dateRangeText =
    startDate && endDate
      ? `ณ ${formatThaiDate(startDate)} - ${formatThaiDate(endDate)}`
      : "";

  // สำหรับส่งเข้า DateThaiPickerService (object + buddhistYear)
  const startDateWithBuddhist = startDate
    ? { ...startDate, buddhistYear: startDate.year + 543 }
    : null;

  const endDateWithBuddhist = endDate
    ? { ...endDate, buddhistYear: endDate.year + 543 }
    : null;

  // แปลง string (ISO) เป็น object ถ้าเกิดกรณี onChange ส่ง string
  const parseDateStringToObj = (value) => {
    if (typeof value === "string") {
      const d = new Date(value);
      return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      };
    }
    return value;
  };

  const breadcrumbItems = [
    {
      label: "Dashboard",
      icon: (
        <img
          src="/icons/docticon.png"
          alt="icon"
          style={{ width: "20px", height: "20px", marginBottom: "-6px" }}
        />
      ),
    },
  ];

  return (
  <Box sx={{ p: { xs: 0.5, sm: 1, md: 1.5 } }}>
  <BreadcrumbsService items={breadcrumbItems} />

  <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} mt={1}>
    {/* แผนที่ */}
    <Grid item xs={12} sm={6} lg={4}>
      <Box
        sx={{
          backgroundColor: "#fff",
          p: { xs: 1, sm: 1.5, md: 2 },
          minHeight: "400px",
          height: { xs: "auto", sm: "500px", md: "600px", lg: "860px" },
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <TopLeftService />
      </Box>
    </Grid>

    {/* กลาง - Charts และ Cards */}
    <Grid item xs={12} sm={6} lg={4}>
      <Box sx={{ mb: 3 }}>
        <DashBoardCard />
      </Box>

      <Box
        sx={{
          backgroundColor: "#fff",
          p: { xs: 1, sm: 1.5, md: 2 },
          height: { xs: "300px", sm: "350px", md: "380px" },
          borderRadius: 1,
          boxShadow: 1,
          mb: 3,
        }}
      >
        <TopRightService />
      </Box>

      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              backgroundColor: "#fff",
              p: { xs: 1, sm: 1.5, md: 2 },
              minHeight: "250px",
              height: { xs: "auto", sm: "250px", md: "300px" },
              borderRadius: 1,
              boxShadow: 1,
              mb: 3,
            }}
          >
            <BottomLeftService />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box
            sx={{
              backgroundColor: "#fff",
              p: { xs: 1, sm: 1.5, md: 2 },
              minHeight: "250px",
              height: { xs: "auto", sm: "250px", md: "300px" },
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <BottomRightService />
          </Box>
        </Grid>
      </Grid>
    </Grid>

    {/* ขวา - Stats และ Date Pickers */}
    <Grid item xs={12} sm={6} lg={4}>
      <Box
        sx={{
          backgroundColor: "#fff",
          p: { xs: 1, sm: 1.5, md: 2 },
          minHeight: "500px",
          height: { xs: "auto", sm: "550px", lg: "860px" },
          borderRadius: 1,
          boxShadow: 1,
          display: "flex",
          flexDirection: "column",
          gap: { xs: 2, sm: 3 },
          overflow: "hidden",
        }}
      >
        {/* Date Range Selector */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            width: "100%",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1, sm: 0.5 },
              alignItems: { xs: "stretch", sm: "flex-end" },
              width: "100%",
              minWidth: 0,
            }}
          >
            {/* วันที่เริ่มต้น */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                maxWidth: { xs: "100%", sm: "45%" },
              }}
            >
              <DateThaiPickerService
                label="วันที่เริ่มต้น"
                value={startDateWithBuddhist}
                onChange={(newValue) => {
                  let parsed = parseDateStringToObj(newValue);
                  if (parsed && parsed.buddhistYear) {
                    setStartDate({
                      ...parsed,
                      year: parsed.buddhistYear - 543,
                    });
                  } else {
                    setStartDate(parsed);
                  }
                }}
                placeholder="เลือกวันที่เริ่มต้น"
                maxDate={
                  endDateWithBuddhist
                    ? new Date(
                        endDateWithBuddhist.year,
                        endDateWithBuddhist.month - 1,
                        endDateWithBuddhist.day
                      )
                    : null
                }
              />
            </Box>

            {/* ข้อความ "ถึง" */}
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                fontWeight: "bold",
                color: "#1120A3",
                width: "10%",
                justifyContent: "center",
                mb: 2,
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              ถึง
            </Box>

            {/* วันที่สิ้นสุด */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                maxWidth: { xs: "100%", sm: "45%" },
              }}
            >
              <DateThaiPickerService
                label="วันที่สิ้นสุด"
                value={endDateWithBuddhist}
                onChange={(newValue) => {
                  let parsed = parseDateStringToObj(newValue);
                  if (parsed && parsed.buddhistYear) {
                    setEndDate({
                      ...parsed,
                      year: parsed.buddhistYear - 543,
                    });
                  } else {
                    setEndDate(parsed);
                  }
                }}
                placeholder="เลือกวันที่สิ้นสุด"
                minDate={
                  startDateWithBuddhist
                    ? new Date(
                        startDateWithBuddhist.year,
                        startDateWithBuddhist.month - 1,
                        startDateWithBuddhist.day
                      )
                    : null
                }
              />
            </Box>
          </Box>

          {startDate && endDate && (
            <Box
              sx={{
                p: 1,
                backgroundColor: "#f8f9ff",
                borderRadius: 1,
                border: "1px solid #e3f2fd",
                textAlign: "center",
                fontSize: { xs: "10px", md: "12px" },
                color: "#1120A3",
                fontWeight: 500,
                width: "100%",
                wordBreak: "break-word",
                boxSizing: "border-box",
              }}
            >
              ช่วงวันที่: {dateRangeText}
            </Box>
          )}
        </Box>

          <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 1, sm: 1, lg: 1 },  
            width: "100%",
            minWidth: 0,
          }}
        >
          {/* สถิติหน่วยงานที่มีเรื่องสูงมากที่สุด */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              justifyContent: "center",
              minHeight: { xs: "100px", sm: "150px", md: "250px", lg: "350px" }, 
              height: "auto", 
              width: "100%",
              marginBottom: { xs: 1, sm: 1 }, 
            }}
          >
            <TopStatsSwiper
              title="สถิติหน่วยงานที่มีเรื่องสูงมากที่สุด"
              bgColor="#64B5F6"
              headerColor="#1976D2"
              startDate={startDate}
              endDate={endDate}
              variant="high"
              data={[
                [
                  { name: "กรมสรรพสามิต", count: 29 },
                  { name: "กรมบัญชีกลาง", count: 28 },
                  { name: "ธนาคารแห่งประเทศไทย", count: 25 },
                  { name: "กรมธนารักษ์", count: 12 },
                  { name: "สำนักงานเศรษฐกิจการคลัง", count: 11 },
                ],
                [
                  { name: "กรมการขนส่งทางบก", count: 10 },
                  { name: "สำนักงานตรวจเงินแผ่นดิน", count: 9 },
                  { name: "สำนักงานตำรวจแห่งชาติ", count: 9 },
                  { name: "กรมที่ดิน", count: 8 },
                  { name: "กรมโยธาธิการ", count: 7 },
                ],
              ]}
            />
          </Box>

          {/* สถิติหน่วยงานที่มีเรื่องต่ำมากที่สุด */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              justifyContent: "center",
              minHeight: { xs: "100px", sm: "150px", md: "250px", lg: "350px" },  
              height: "auto", 
              width: "100%",
              marginBottom: { xs: 1, sm: 1 }, 
            }}
          >
            <TopStatsSwiper
              title="สถิติหน่วยงานที่มีเรื่องต่ำมากที่สุด"
              bgColor="#FFECB3"
              headerColor="#F44336"
              startDate={startDate}
              endDate={endDate}
              variant="low"
              data={[
                [
                  { name: "สำนักงานบริหารที่สาธารณะ", count: 8 },
                  { name: "สำนักงานคณะกรรมการนโยบาย...", count: 7 },
                  { name: "ธนาคารแห่งประเทศไทย", count: 5 },
                  { name: "สำนักงานเศรษฐกิจการคลัง", count: 4 },
                  { name: "กรมศุลกากร", count: 7 },
                ],
                [
                  { name: "กรมปศุสัตว์", count: 3 },
                  { name: "กรมวิชาการเกษตร", count: 2 },
                  { name: "กรมทางหลวง", count: 1 },
                  { name: "สำนักงานเศรษฐกิจพาณิชย์", count: 1 },
                  { name: "กรมตรวจบัญชีสหกรณ์", count: 1 },
                ],
              ]}
            />
          </Box>
        </Box>
      </Box>
    </Grid>
  </Grid>
</Box>
  )
};

export default DashboardComponents_Main;
