import React, { useEffect, useRef } from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import Chart from "chart.js/auto";

const TopRightChart = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const chartData = [
    { name: "สำนักงานพัฒนาการศึกษาชาวบ้าน", count: 8, color: "#1A237E" },
    { name: "กรุงเทพการ", count: 18, color: "#3949AB" },
    { name: "สำนักงานเขตกรุงเทพมหานคร", count: 12, color: "#7986CB" },
    { name: "อะชาการและเทคโนโลยี", count: 3, color: "#29B6F6" },
    { name: "สำนักงานพัฒนาวิศวกรรม", count: 12, color: "#81D4FA" },
    { name: "หน่วยงาน A", count: 6, color: "#FBC02D" },
    { name: "หน่วยงาน B", count: 11, color: "#FBE9A7" },
    { name: "หน่วยงาน C", count: 14, color: "#E91E63" },
    { name: "หน่วยงาน D", count: 8, color: "#F48FB1" },
  ];

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Responsive configuration
    const responsiveConfig = {
      barThickness: isSmallMobile ? 14 : isMobile ? 18 : 24, // ลดขนาดแท่ง
      fontSize: isSmallMobile ? 8 : isMobile ? 9 : 10,
      stepSize: isSmallMobile ? 5 : 5, // ใช้ step เดียวกัน
      suggestedMax: 20, // ลดความสูงสูงสุด
    };

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: chartData.map((item) => item.name),
        datasets: [
          {
            label: "จำนวนเรื่องร้องทุกข์",
            data: chartData.map((item) => item.count),
            backgroundColor: chartData.map((item) => item.color),
            borderRadius: isSmallMobile ? 3 : 4, // ลด border radius
            barThickness: responsiveConfig.barThickness,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: {
              size: isSmallMobile ? 10 : 12,
            },
            bodyFont: {
              size: isSmallMobile ? 10 : 12,
            },
            callbacks: {
              title: function (context) {
                const fullName = context[0].label;
                if (isMobile && fullName.length > 20) {
                  return fullName.substring(0, 20) + "...";
                }
                return fullName;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              display: false,
            },
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            max: responsiveConfig.suggestedMax, // ใช้ max แทน suggestedMax
            ticks: {
              stepSize: responsiveConfig.stepSize,
              font: {
                size: responsiveConfig.fontSize,
              },
              color: "#666",
              padding: 5, // เพิ่ม padding
            },
            grid: {
              color: "rgba(0,0,0,0.1)",
              lineWidth: 0.5,
            },
          },
        },
        layout: {
          padding: {
            left: isSmallMobile ? 8 : 12,
            right: isSmallMobile ? 8 : 12,
            top: isSmallMobile ? 8 : 12,
            bottom: isSmallMobile ? 8 : 12, // เพิ่ม bottom padding
          },
        },
        // Animation configuration
        animation: {
          duration: isMobile ? 500 : 1000,
          easing: "easeOutQuart",
        },
      },
    });

    // Cleanup function
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [isMobile, isSmallMobile]);

  return (
    <Box
      sx={{
        height: { xs: "220px", sm: "260px", md: "280px" }, // ลดความสูงรวม
        p: { xs: 0.5, md: 1 }, // ลด padding
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: "#1120A3",
          fontWeight: "bold",
          textAlign: "center",
          mt: { xs: 0.5, md: 1 },
          mb: 0.5,
          fontSize: { xs: "11px", sm: "12px", md: "13px" }, // ลด font size
          lineHeight: 1.2,
        }}
      >
        สถิติเรื่องราวร้องทุกข์
      </Typography>
      <Typography
        variant="subtitle2"
        sx={{
          color: "#1120A3",
          fontWeight: "bold",
          textAlign: "center",
          mb: { xs: 0.5, md: 1 }, // ลด margin bottom
          fontSize: { xs: "10px", sm: "11px", md: "12px" }, // ลด font size
          lineHeight: 1.1,
        }}
      >
        ณ เดือน มิถุนายน 2568
      </Typography>

      <Box
        sx={{
          flex: 1,
          position: "relative",
          minHeight: { xs: "140px", sm: "160px", md: "180px" }, // ลดความสูงของ chart area
          overflow: "hidden", // ป้องกันการล้น
        }}
      >
        <canvas
          ref={chartRef}
          style={{
            width: "100%",
            height: "100%",
            maxHeight: "100%",
          }}
        />
      </Box>

      {/* Legend for mobile - show abbreviated names */}
      {isMobile && (
        <Box
          sx={{
            mt: 0.5, // ลด margin top
            display: "flex",
            flexWrap: "wrap",
            gap: 0.3, // ลด gap
            justifyContent: "center",
            maxHeight: "40px", // จำกัดความสูงของ legend
            overflow: "hidden",
          }}
        >
          {chartData.slice(0, 5).map(
            (
              item,
              index // แสดงแค่ 5 รายการ
            ) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.3,
                  fontSize: "7px", // ลด font size
                  color: "#666",
                }}
              >
                <Box
                  sx={{
                    width: 6, // ลดขนาด
                    height: 6, // ลดขนาด
                    backgroundColor: item.color,
                    borderRadius: 0.5,
                  }}
                />
                <Typography sx={{ fontSize: "7px" }}>
                  {item.name.length > 12
                    ? item.name.substring(0, 12) + "..."
                    : item.name}
                </Typography>
              </Box>
            )
          )}
          {chartData.length > 5 && (
            <Typography sx={{ fontSize: "7px", color: "#999" }}>
              +{chartData.length - 5} อื่นๆ
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TopRightChart;
