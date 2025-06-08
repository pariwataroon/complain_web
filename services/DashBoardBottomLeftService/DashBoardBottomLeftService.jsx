import { useEffect, useRef, useState } from "react";
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

const chartDataByDepartment = {
  1: [
    { name: "บุคลากร", count: 146, color: "#4A5CD6" },
    { name: "ร้องเรียนทั่วไป", count: 73, color: "#E91E63" },
    { name: "ไม่ระบุ", count: 31, color: "#87CEEB" },
  ],
  2: [
    { name: "ภาษี", count: 40, color: "#4A5CD6" },
    { name: "การเงิน", count: 55, color: "#E91E63" },
    { name: "อื่น ๆ", count: 10, color: "#87CEEB" },
  ],
  3: [
    { name: "ศุลกากร", count: 60, color: "#4A5CD6" },
    { name: "การนำเข้า", count: 30, color: "#E91E63" },
    { name: "การส่งออก", count: 20, color: "#87CEEB" },
  ],
};

const BottomLeftService = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [selectedDepartment, setSelectedDepartment] = useState("1");
  const [selectedYear, setSelectedYear] = useState("2568");
  const data = chartDataByDepartment[selectedDepartment] || [];

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
      {/* ส่วนหัวและตัวเลือก - Responsive */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "flex-end",
          alignItems: { xs: "stretch", sm: "flex-start" },
          mb: { xs: 1, md: 2 },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "row", sm: "column" },
            alignItems: { xs: "center", sm: "flex-end" },
            gap: 1,
            justifyContent: { xs: "space-between", sm: "flex-end" },
          }}
        >
          {/* ปีงบประมาณ */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
                  borderRadius: "8px", // เพิ่ม borderRadius
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2", // สีฟ้า border
                    borderRadius: "8px",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1565c0", // สีฟ้าเข้มเมื่อ hover
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2", // สีฟ้าเมื่อ focus
                    borderWidth: "2px",
                  },
                }}
              >
                <MenuItem value="2567">2567</MenuItem>
                <MenuItem value="2568">2568</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* หน่วยงาน */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "10px", md: "12px" },
                display: { xs: "none", sm: "block" },
              }}
            >
              หน่วยงาน:
            </Typography>
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: 120, sm: 140, md: 160 },
              }}
            >
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                sx={{
                  fontSize: { xs: "10px", md: "12px" },
                  height: { xs: "24px", md: "32px" },
                  borderRadius: "8px", // เพิ่ม borderRadius
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2", // สีฟ้า border
                    borderRadius: "8px",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1565c0", // สีฟ้าเข้มเมื่อ hover
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2", // สีฟ้าเมื่อ focus
                    borderWidth: "2px",
                  },
                }}
              >
                {[
                  { value: "1", label: "กรมบัญชีกลาง" },
                  { value: "2", label: "สำนักงานเศรษฐกิจการคลัง" },
                  { value: "3", label: "กรมศุลกากร" },
                  { value: "4", label: "กรมสรรพากร" },
                  { value: "5", label: "สำนักงานงบประมาณ" },
                  { value: "6", label: "สำนักงานตรวจเงินแผ่นดิน" },
                  { value: "7", label: "สำนักงานบริหารหนี้สาธารณะ" },
                  { value: "8", label: "ธนาคารแห่งประเทศไทย" },
                  { value: "9", label: "สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ" },
                  {
                    value: "10",
                    label: "สำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์",
                  },
                ].map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    <Typography
                      noWrap
                      sx={{
                        maxWidth: { xs: "100px", sm: "120px", md: "160px" },
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: { xs: "10px", md: "12px" },
                      }}
                    >
                      {item.label}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* หัวข้อ - Responsive */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          mb: { xs: 1, md: 2 },
          fontSize: { xs: "12px", sm: "14px", md: "16px" },
          color: "#1120A3",
        }}
      >
        ประเภทเรื่องราวร้องทุกข์
      </Typography>

      {/* ส่วนกราฟวงกลม - Responsive */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: { xs: "140px", sm: "160px", md: "180px" },
          position: "relative",
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

export default BottomLeftService;
