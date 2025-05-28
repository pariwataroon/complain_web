import { useState } from "react";
import { Box, Grid } from "@mui/material";
import BreadcrumbsService from "@services/Breadcrumbs/breadcrumbs";
import TopLeftService from "@services/DashBoardTopLeftService/DashBoardTopLeftService";
import TopRightService from "@services/DashBoardTopRightService/DashBoardTopRightService";
import BottomLeftService from "@services/DashBoardBottomLeftService/DashBoardBottomLeftService";
import BottomRightService from "@services/DashBoardBottomRightService/DashBoardBottomRightService";
import DashBoardCard from "@services/DashBoardCard/DashBoardCard";
import TopStatsSwiper from "@services/TopStatsSwiper/TopStatsSwiper";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
dayjs.extend(buddhistEra);
dayjs.locale("th");


const DashboardComponents_Main = () => {
  const [selectedYear, setSelectedYear] = useState("2567");
  const data = [selectedYear] || [];
  const [startDate, setStartDate] = useState(dayjs("2025-01-31"));
  const [endDate, setEndDate] = useState(dayjs("2025-04-02"));
  const dateRangeText = `ณ ${startDate.format("DD MMMM BBBB")} - ${endDate.format("DD MMMM BBBB")}`;

  const breadcrumbItems = [
    {
      label: "Dashboard",
      icon: (
        <img
          src="/icons/docticon.png"
          alt="icon"
          style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
        />
      ),
    },
  ];

  return (
    <Box>
      <BreadcrumbsService items={breadcrumbItems} />
      <Grid container spacing={2} mt={1}>
        {/* ซ้าย - แผนที่ */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              backgroundColor: "#fff",
              p: 2,
              height: "1235px",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <TopLeftService />
          </Box>
        </Grid>
        {/* ซ้ายบนกลาง - Card */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              height: "120px",
            }}
          >
            <DashBoardCard />
          </Box>
          {/* ซ้ายบนกลาง - Chart */}
          <Box
            sx={{
              marginTop: 2,
              backgroundColor: "#fff",
              p: 2,
              height: "550px",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <TopRightService />
          </Box>

          {/* กลางล่าง - ประเภท - ช่องทางการร้องทุกข์ */}
          <Grid container spacing={2} justifyContent="space-between">
            <Grid item xs={12} md={6} >
              <Box
                sx={{
                  marginTop: 1,
                  backgroundColor: "#fff",
                  p: 2,
                  height: "500px",
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                <BottomLeftService />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  marginTop: 1,
                  backgroundColor: "#fff",
                  p: 2,
                  height: "500px",
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                <BottomRightService />
              </Box>
            </Grid>
          </Grid>

        </Grid>

        <Grid item xs={12} md={4}>

          <Box
            sx={{
              backgroundColor: "#fff",
              p: 2,
              height: "1235px",
              borderRadius: 2,
              boxShadow: 1,
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <DatePicker
                  label="วันที่เริ่มต้น"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
                <Box sx={{ display: "flex", alignItems: "center", fontWeight: "bold" }}>
                  ถึง
                </Box>
                <DatePicker
                  label="วันที่สิ้นสุด"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </Box>
            </LocalizationProvider>

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
                  { name: "กรมธนารักษ์", count: 12 },
                  { name: "สำนักงานเศรษฐกิจการคลัง", count: 11 },
                  { name: "กรมธนารักษ์", count: 12 },
                  { name: "สำนักงานเศรษฐกิจการคลัง", count: 11 },
                ],
                [
                  { name: "กรมการขนส่งทางบก", count: 10 },
                  { name: "สำนักงานตรวจเงินแผ่นดิน", count: 9 },
                  { name: "สำนักงานตำรวจแห่งชาติ", count: 9 },
                  { name: "กรมที่ดิน", count: 8 },
                  { name: "กรมโยธาธิการ", count: 7 },
                ]
              ]}
            />

            {/* ส่วนที่สอง: เรื่องต่ำสุด */}
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
                  { name: "สำนักงานบริหารที่สาธารณะ", count: 8 },
                  { name: "กรมศุลกากร", count: 7 },
                  { name: "สำนักงานคณะกรรมการนโยบาย...", count: 7 },
                  { name: "ธนาคารแห่งประเทศไทย", count: 5 },
                  { name: "สำนักงานเศรษฐกิจการคลัง", count: 4 },
                ],
                [
                  { name: "กรมปศุสัตว์", count: 3 },
                  { name: "กรมวิชาการเกษตร", count: 2 },
                  { name: "กรมทางหลวง", count: 1 },
                  { name: "สำนักงานเศรษฐกิจพาณิชย์", count: 1 },
                  { name: "กรมตรวจบัญชีสหกรณ์", count: 1 },
                ]
              ]}
            />
          </Box>
        </Grid>

      </Grid>
    </Box>
  );
};

export default DashboardComponents_Main;