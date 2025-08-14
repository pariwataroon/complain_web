import React, { useRef, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from "@mui/material";
import Chart from "chart.js/auto";
import {
  GetDonutChartChannels,
} from "@pages/api/dashboard/dashboard";
import {
  GetAllSelectYears,
} from "@pages/api/allselect/allselect";

const chartColors = [
  "#4A5CD6", "#E91E63", "#87CEEB", "#FF9800", "#4CAF50",
  "#9C27B0", "#FF5722", "#607D8B", "#795548", "#F44336"
];

const BottomRightService = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [selectedYear, setSelectedYear] = useState("2568");
  const [yearOptions, setYearOptions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Fetch years data from API
  const fetchYears = async () => {
    setYearsLoading(true);
    try {
      const result = await GetAllSelectYears();

      if (result.success && result.yearOptions) {
        setYearOptions(result.yearOptions);
        // Set latest year as default if available
        if (result.yearOptions.length > 0) {
          const latestYear = result.yearOptions[result.yearOptions.length - 1];
          setSelectedYear(latestYear.value);
        }
      } else {
        console.warn("Failed to fetch years:", result.message);
        // Fallback to default years if API fails
        setYearOptions([
          { value: "2567", label: "2567" },
          { value: "2568", label: "2568" }
        ]);
      }
    } catch (err) {
      console.error("Error fetching years:", err);
      // Fallback to default years if API fails
      setYearOptions([
        { value: "2567", label: "2567" },
        { value: "2568", label: "2568" }
      ]);
    } finally {
      setYearsLoading(false);
    }
  };

  // Fetch chart data from API
  const fetchChartData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await GetDonutChartChannels(parseInt(selectedYear) - 543); // แปลง พ.ศ. เป็น ค.ศ.

      if (result.success && result.data) {
        // เพิ่มสีให้กับข้อมูล
        const dataWithColors = result.data.map((item, index) => ({
          ...item,
          color: chartColors[index % chartColors.length]
        }));

        setChartData(dataWithColors);
        setTotal(result.total);
      } else {
        setError(result.message || result.error || "ไม่สามารถดึงข้อมูลได้");
        setChartData([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      setChartData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Load years on component mount
  useEffect(() => {
    fetchYears();
  }, []);

  // Fetch chart data when year changes and years are loaded
  useEffect(() => {
    if (!yearsLoading && selectedYear) {
      fetchChartData();
    }
  }, [selectedYear, yearsLoading]);

  // Create chart
  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const isEmpty = loading || error || chartData.length === 0 || chartData.every((item) => item.value === 0);

    const processedChartData = isEmpty
      ? {
        labels: [loading ? "กำลังโหลด..." : error ? "เกิดข้อผิดพลาด" : "ไม่มีข้อมูล"],
        datasets: [
          {
            data: [1],
            backgroundColor: ["#e0e0e0"],
            borderWidth: 0,
          },
        ],
      }
      : {
        labels: chartData.map((item) => item.name),
        datasets: [
          {
            data: chartData.map((item) => item.value),
            backgroundColor: chartData.map((item) => item.color),
            borderWidth: isMobile ? 1 : 2,
            borderColor: "#fff",
          },
        ],
      };

    // Responsive font sizes
    const fontSizes = {
      centerTitle: isSmallMobile ? 10 : isMobile ? 12 : 14,
      centerNumber: isSmallMobile ? 16 : isMobile ? 18 : 20,
      centerUnit: isSmallMobile ? 8 : isMobile ? 10 : 12,
    };

    chartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: processedChartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: !isEmpty,
            titleFont: {
              size: isSmallMobile ? 10 : 12,
            },
            bodyFont: {
              size: isSmallMobile ? 10 : 12,
            },
            callbacks: {
              label: (context) => {
                const item = chartData[context.dataIndex];
                return `${item.name}: ${item.value} เรื่อง (${item.formattedPercent})`;
              }
            }
          },
        },
        animation: {
          duration: isMobile ? 500 : 1000,
          easing: "easeOutQuart",
        },
      },
      plugins: [
        {
          id: "centerText",
          afterDraw: (chart) => {
            const { width, height } = chart;
            const ctx = chart.ctx;
            ctx.save();
            ctx.fillStyle = "#666";
            ctx.textAlign = "center";

            if (loading) {
              ctx.font = `bold ${fontSizes.centerTitle}px sans-serif`;
              ctx.fillText("กำลังโหลด...", width / 2, height / 2 + 5);
            } else if (error) {
              ctx.font = `bold ${fontSizes.centerTitle}px sans-serif`;
              ctx.fillText("เกิดข้อผิดพลาด", width / 2, height / 2 + 5);
            } else if (isEmpty) {
              ctx.font = `bold ${fontSizes.centerTitle}px sans-serif`;
              ctx.fillText("ไม่มีข้อมูล", width / 2, height / 2 + 5);
            } else {
              // Title
              ctx.font = `bold ${fontSizes.centerTitle}px sans-serif`;
              ctx.fillText(
                "รวม",
                width / 2,
                height / 2 - (isSmallMobile ? 10 : 15)
              );

              // Number
              ctx.fillStyle = "#4A5CD6";
              ctx.font = `bold ${fontSizes.centerNumber}px sans-serif`;
              ctx.fillText(
                total,
                width / 2,
                height / 2 + (isSmallMobile ? 5 : 10)
              );

              // Unit
              ctx.fillStyle = "#666";
              ctx.font = `${fontSizes.centerUnit}px sans-serif`;
              ctx.fillText(
                "เรื่อง",
                width / 2,
                height / 2 + (isSmallMobile ? 18 : 28)
              );
            }

            ctx.restore();
          },
        },
      ],
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartData, loading, error, total, isMobile, isSmallMobile]);

  return (
    <Box sx={{ p: { xs: 0.5, md: 1 }, height: "100%" }}>
      {/* ตัวเลือกปี - ชิดขวา */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: { xs: 0.5, md: 1 },
          gap: 1,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: "bold",
            fontSize: { xs: "10px", md: "12px" },
          }}
        >
          ปีงบประมาณ:
        </Typography>
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: 60, md: 80 },
          }}
        >
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={loading || yearsLoading}
            sx={{
              fontSize: { xs: "10px", md: "12px" },
              height: { xs: "24px", md: "32px" },
              borderRadius: "8px",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#1976d2",
                borderRadius: "8px",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#1565c0",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#1976d2",
                borderWidth: "2px",
              },
            }}
          >
            {yearsLoading ? (
              <MenuItem disabled>
                <CircularProgress size={12} sx={{ mr: 1 }} />
                กำลังโหลด...
              </MenuItem>
            ) : yearOptions.length > 0 ? (
              yearOptions.map((year) => (
                <MenuItem key={year.value} value={year.value}>
                  {year.label}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>ไม่มีข้อมูลปี</MenuItem>
            )}
          </Select>
        </FormControl>
      </Box>

      {/* หัวข้อ */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          mb: { xs: 1, md: 2 },
          mt: { xs: 0, md: 7 },
          fontSize: { xs: "12px", sm: "14px", md: "16px" },
          color: "#1120A3",
        }}
      >
        ช่องทางการร้องทุกข์
      </Typography>

      {/* Chart */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: { xs: "140px", sm: "160px", md: "180px" },
          position: "relative",
          mt: { xs: 1, md: 2 },
        }}
      >
        <canvas
          ref={chartRef}
          style={{
            width: "100%",
            height: "100%",
            maxWidth: isSmallMobile ? "140px" : isMobile ? "160px" : "180px",
            maxHeight: isSmallMobile ? "140px" : isMobile ? "160px" : "180px",
          }}
        />
      </Box>

      {/* Legend สำหรับ Mobile */}
      {isMobile && !loading && !error && chartData.length > 0 && (
        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            alignItems: "center",
          }}
        >
          {chartData.map((item, index) => (
            <Box
              key={item.id || index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: "10px",
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  backgroundColor: item.color,
                  borderRadius: 1,
                }}
              />
              <Typography sx={{ fontSize: "10px", color: "#666" }}>
                {item.name}: {item.value} เรื่อง ({item.formattedPercent})
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Error message */}
      {error && !loading && (
        <Box
          sx={{
            mt: 1,
            textAlign: "center",
            color: "#f44336",
            fontSize: "12px",
          }}
        >
          {error}
        </Box>
      )}
    </Box>
  );
};

export default BottomRightService;