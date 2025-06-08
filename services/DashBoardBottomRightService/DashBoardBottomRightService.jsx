import React, { useRef, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Chart from "chart.js/auto";

const chartDataByYear = {
  2567: [
    { name: "เว็บไซต์", count: 80, color: "#4A5CD6" },
    { name: "อีเมล์", count: 40, color: "#E91E63" },
    { name: "จดหมาย", count: 26, color: "#87CEEB" },
  ],
  2568: [
    { name: "เว็บไซต์", count: 60, color: "#4A5CD6" },
    { name: "อีเมล์", count: 30, color: "#E91E63" },
    { name: "จดหมาย", count: 0, color: "#87CEEB" },
  ],
};

const BottomRightService = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [selectedYear, setSelectedYear] = useState("2568");
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const data = chartDataByYear[selectedYear] || [];

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const isEmpty = data.length === 0 || data.every((item) => item.count === 0);

    const chartData = isEmpty
      ? {
          labels: ["ไม่มีข้อมูล"],
          datasets: [
            {
              data: [1],
              backgroundColor: ["#e0e0e0"],
              borderWidth: 0,
            },
          ],
        }
      : {
          labels: data.map((item) => item.name),
          datasets: [
            {
              data: data.map((item) => item.count),
              backgroundColor: data.map((item) => item.color),
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
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: {
              size: isSmallMobile ? 10 : 12,
            },
            bodyFont: {
              size: isSmallMobile ? 10 : 12,
            },
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

            if (isEmpty) {
              ctx.font = `bold ${fontSizes.centerTitle}px sans-serif`;
              ctx.fillText("ไม่มีข้อมูล", width / 2, height / 2 + 5);
            } else {
              const total = data.reduce((sum, d) => sum + d.count, 0);

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
  }, [data, isMobile, isSmallMobile]);

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
            sx={{
              fontSize: { xs: "10px", md: "12px" },
              height: { xs: "24px", md: "32px" },
            }}
          >
            <MenuItem value="2567">2567</MenuItem>
            <MenuItem value="2568">2568</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* หัวข้อ - เพิ่ม margin top อีก 2 */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          mb: { xs: 1, md: 2 },
          mt: { xs: 0, md: 7 }, // เพิ่มจาก { xs: 2, md: 3 } เป็น { xs: 4, md: 5 }
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
      {isMobile && data.length > 0 && (
        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            alignItems: "center",
          }}
        >
          {data.map((item, index) => (
            <Box
              key={index}
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
                {item.name}: {item.count} เรื่อง
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default BottomRightService;
