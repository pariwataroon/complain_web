import { useState, useEffect, useRef } from "react";
import { Box, Grid } from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
import TopLeftService from "@services/DashBoardTopLeftService/DashBoardTopLeftService";
import TopRightService from "@services/DashBoardTopRightService/DashBoardTopRightService";
import BottomLeftService from "@services/DashBoardBottomLeftService/DashBoardBottomLeftService";
import BottomRightService from "@services/DashBoardBottomRightService/DashBoardBottomRightService";
import DashBoardCard from "@services/DashBoardCard/DashBoardCard";
import TopStatsSwiper from "@services/TopStatsSwiper/TopStatsSwiper";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { GetDepartmentRanking } from "@pages/api/dashboard/dashboard";
import {
  formatDateForAPI,
  formatThaiDateMonths,
  parseDateStringToObj,
  chunkArray,
} from "@utils/Formats";
import { exportElementToPDF } from "@utils/exportPDF";
import ExportButton from "@services/ExportButton/ExportButton";

const DashboardComponents_Main = () => {
  const TH_MONTHS = [
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

  const getCurrentADYear = () => new Date().getFullYear();
  const getCurrentThaiYear = () => getCurrentADYear() + 543;

  const startOfYear = (adYear) => ({ day: 1, month: 1, year: adYear });
  const endOfYear = (adYear) => ({ day: 31, month: 12, year: adYear });

  const formatThaiBEFromAD = (d) =>
    `${d.day} ${TH_MONTHS[d.month - 1]} ${d.year + 543}`;
  const [selectedYear, setSelectedYear] = useState(
    String(getCurrentThaiYear())
  );
  const data = [selectedYear] || [];
  const [departmentRanking, setDepartmentRanking] = useState({
    topDepartments: [],
    topProvinces: []
  });
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(startOfYear(getCurrentADYear()));
  const [endDate, setEndDate] = useState(endOfYear(getCurrentADYear()));
  const pdfRef = useRef();
  // Function to handle department ranking data
 const handleGetDepartmentRanking = async () => {
  if (!startDate || !endDate) return;

  setLoading(true);
  try {
    const dateFrom = formatDateForAPI(startDate);
    const dateTo = formatDateForAPI(endDate);

    const response = await GetDepartmentRanking(
      dateFrom,
      dateTo,
      5, // limit_top
      5 // limit_bottom
    );

    if (response?.filters && response?.departments) {
      // แยกข้อมูลเป็น top departments
      const sortedDepartments = [...response.departments].sort(
        (a, b) => b.complaintCount - a.complaintCount
      );

      const topDepts = sortedDepartments.slice(0, 5).map((dept) => ({
        name: dept.departmentName,
        count: dept.complaintCount,
      }));

      const topProvinces = (response.provinces || []).map((prov) => ({
        name: prov.provinceName,
        count: prov.complaintCount,
      }));

      setDepartmentRanking({
        topDepartments: topDepts,
        topProvinces: topProvinces, 
      });
    }
  } catch (error) {
    console.error("Error fetching department ranking:", error);
    setDepartmentRanking({
      topDepartments: [{ name: "ไม่สามารถโหลดข้อมูลได้", count: 0 }],
      topProvinces: [{ name: "ไม่สามารถโหลดข้อมูลได้", count: 0 }], // เปลี่ยน
    });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    handleGetDepartmentRanking();
  }, [startDate, endDate]);

  const dateRangeText =
    startDate && endDate
      ? `ณ ${formatThaiBEFromAD(startDate)} - ${formatThaiBEFromAD(endDate)}`
      : "";

  const startDateWithBuddhist = startDate
    ? { ...startDate, buddhistYear: startDate.year + 543 }
    : null;

  const endDateWithBuddhist = endDate
    ? { ...endDate, buddhistYear: endDate.year + 543 }
    : null;

  const topDepartmentChunks = chunkArray(departmentRanking.topDepartments, 5);
  const topProvinceChunks = chunkArray(departmentRanking.topProvinces, 5);

  const handleExportPDF = () => {
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `ข้อมูลDashboard_${today}.pdf`;
    exportElementToPDF(pdfRef, filename);
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
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          mb: 2 // เพิ่ม margin bottom ถ้าต้องการ
        }}
      >
        <BreadcrumbsService items={breadcrumbItems} />
        <ExportButton
          label="Export PDF"
          onClick={handleExportPDF}
          sx={{
            fontSize: { xs: 12, sm: 14 },
            px: 1.5,
            py: 1,
          }}
        />
      </Box>
      <div ref={pdfRef}>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} mt={1}>
          {/* แผนที่ */}
          <Grid item xs={12} sm={6} lg={4}>
            <Box
              sx={{
                backgroundColor: "#fff",
                p: { xs: 1, sm: 1.5, md: 2 },
                minHeight: "400px",
                height: { xs: "auto", sm: "500px", md: "600px", lg: "960px" },
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
                    height: { xs: "auto", sm: "250px", md: "330px" },
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
                    height: { xs: "auto", sm: "250px", md: "330px" },
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
                height: { xs: "auto", sm: "550px", lg: "960px" },
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
                    minHeight: {
                      xs: "100px",
                      sm: "150px",
                      md: "250px",
                      lg: "350px",
                    },
                    height: { xs: "auto", sm: "150px", md: "250px", lg: "350px" },
                    width: "100%",
                    marginBottom: { xs: 1, sm: 1 },
                  }}
                >
                  <TopStatsSwiper
                    title="สถิติหน่วยงานที่มีเรื่องร้องเรียนมากที่สุด"
                    bgColor="#64B5F6"
                    headerColor="#1976D2"
                    startDate={startDate}
                    endDate={endDate}
                    variant="high"
                    data={topDepartmentChunks}
                    loading={loading}
                    style={{ height: "100%", width: "100%" }}
                  />
                </Box>

                {/* สถิติหน่วยงานที่มีเรื่องต่ำมากที่สุด */}
                <Box
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    justifyContent: "center",
                    minHeight: {
                      xs: "100px",
                      sm: "150px",
                      md: "250px",
                      lg: "350px",
                    },
                    height: { xs: "auto", sm: "150px", md: "250px", lg: "350px" },
                    width: "100%",
                    marginBottom: { xs: 1, sm: 1 },
                  }}
                >
                  <TopStatsSwiper
                    title="สถิติจังหวัดที่มีเรื่องร้องเรียนมากที่สุด"
                    bgColor="#FFECB3"
                    headerColor="#F44336"
                    startDate={startDate}
                    endDate={endDate}
                    variant="province"
                    data={topProvinceChunks}
                    loading={loading}
                    style={{ height: "100%", width: "100%" }}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </div>
    </Box>
  );
};

export default DashboardComponents_Main;
