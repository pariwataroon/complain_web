import { useState } from "react";
import { Box, Grid } from "@mui/material";
import BreadcrumbsService from "@services/Breadcrumbs/Breadcrumbs";
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

  // เปลี่ยนเป็น Thai date format
  const [startDate, setStartDate] = useState({
    day: 31,
    month: 1,
    year: 2025,
    buddhistYear: 2568,
  });

  const [endDate, setEndDate] = useState({
    day: 2,
    month: 4,
    year: 2025,
    buddhistYear: 2568,
  });

  // สร้าง helper function สำหรับ format วันที่
  const formatThaiDate = (dateObj) => {
    if (!dateObj) return "";

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

    return `${dateObj.day} ${thaiMonths[dateObj.month - 1]} พ.ศ. ${
      dateObj.buddhistYear
    }`;
  };

  const dateRangeText = `ณ ${formatThaiDate(startDate)} - ${formatThaiDate(
    endDate
  )}`;

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
    <Box sx={{ p: { xs: 0.5, md: 1 } }}>
      <BreadcrumbsService items={breadcrumbItems} />

      <Grid container spacing={{ xs: 0.5, md: 1 }} mt={0.5}>
        {/* แผนที่ - ใช้ความสูง 860px lg */}
        <Grid item xs={12} lg={4}>
          <Box
            sx={{
              backgroundColor: "#fff",
              p: { xs: 0.5, md: 1 },
              height: { xs: "400px", md: "550px", lg: "860px" },
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <TopLeftService />
          </Box>
        </Grid>

        {/* กลาง - Charts และ Cards - ปรับให้เท่ากับ 860px */}
        <Grid item xs={12} lg={4}>
          {/* Cards - ลดขนาดลง */}
          <Box sx={{ height: { xs: "auto", md: "80px" }, mb: 2 }}>
            <DashBoardCard />
          </Box>

          {/* Chart ด้านบน - เพิ่มความสูง */}
          <Box
            sx={{
              backgroundColor: "#fff",
              p: { xs: 0.5, md: 1 },
              height: { xs: "250px", md: "300px", lg: "380px" },
              borderRadius: 1,
              boxShadow: 1,
              mb: 1,
            }}
          >
            <TopRightService />
          </Box>

          {/* Charts ด้านล่าง - 2 อัน - เพิ่มความสูง */}
          <Grid container spacing={{ xs: 0.5, md: 1 }}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  backgroundColor: "#fff",
                  p: { xs: 0.5, md: 1 },
                  height: { xs: "250px", md: "280px", lg: "360px" },
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <BottomLeftService />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  backgroundColor: "#fff",
                  p: { xs: 0.5, md: 1 },
                  height: { xs: "250px", md: "280px", lg: "360px" },
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <BottomRightService />
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* ขวา - Stats และ Date Pickers - ใช้ความสูง 860px lg */}
        <Grid item xs={12} lg={4}>
          <Box
            sx={{
              backgroundColor: "#fff",
              p: { xs: 0.5, md: 1 },
              height: { xs: "auto", md: "550px", lg: "860px" },
              borderRadius: 1,
              boxShadow: 1,
              display: "flex",
              flexDirection: "column",
              gap: { xs: 1, md: 1.5 },
              overflow: "hidden", // ป้องกันการทะลุ
            }}
          >
            {/* Date Range Selector - แก้ไขการจัด layout */}
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
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    placeholder="เลือกวันที่เริ่มต้น"
                    maxDate={
                      endDate
                        ? new Date(endDate.year, endDate.month - 1, endDate.day)
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
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    placeholder="เลือกวันที่สิ้นสุด"
                    minDate={
                      startDate
                        ? new Date(
                            startDate.year,
                            startDate.month - 1,
                            startDate.day
                          )
                        : null
                    }
                  />
                </Box>
              </Box>

              {/* แสดงช่วงวันที่ */}
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
                    boxSizing: "border-box", // ป้องกันการทะลุ
                  }}
                >
                  ช่วงวันที่: {dateRangeText}
                </Box>
              )}
            </Box>

            {/* Stats Swipers */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: { xs: 2, md: 3, lg: 8 },
                width: "100%",
                minWidth: 0,
              }}
            >
              {/* เรื่องสูงสุด */}
              <Box sx={{ height: { xs: "180px", md: "220px", lg: "300px" } }}>
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

              {/* เรื่องต่ำสุด */}
              <Box sx={{ height: { xs: "180px", md: "220px", lg: "300px" } }}>
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
  );
};

export default DashboardComponents_Main;
