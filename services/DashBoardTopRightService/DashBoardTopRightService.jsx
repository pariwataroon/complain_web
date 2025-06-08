import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Modal,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Popover,
  Grid,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SelectField from "@services/SelectField/SelectField";
import Chart from "chart.js/auto";

const TopRightChart = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openModal, setOpenModal] = useState(null);

  // States for current display mode
  const [currentMode, setCurrentMode] = useState("monthly");
  const [currentPeriod, setCurrentPeriod] = useState("สิงหาคม 2568");

  // States for form values
  const [monthlyForm, setMonthlyForm] = useState({
    month: "สิงหาคม",
    year: "2568",
  });
  const [quarterlyForm, setQuarterlyForm] = useState({ year: "2568" });
  const [yearlyForm, setYearlyForm] = useState({ year: "2568" });
  const [departmentForm, setDepartmentForm] = useState({
    fromYear: "2565",
    toYear: "2567",
  });

  // Mock data for different periods with varied patterns
  const getMockData = (mode, period) => {
    const baseData = [
      { name: "สำนักงานพัฒนาการศึกษาชาวบ้าน", color: "#1A237E" },
      { name: "กรุงเทพการ", color: "#3949AB" },
      { name: "สำนักงานเขตกรุงเทพมหานคร", color: "#7986CB" },
      { name: "อะชาการและเทคโนโลยี", color: "#29B6F6" },
      { name: "สำนักงานพัฒนาวิศวกรรม", color: "#81D4FA" },
      { name: "หน่วยงาน A", color: "#FBC02D" },
      { name: "หน่วยงาน B", color: "#FBE9A7" },
      { name: "หน่วยงาน C", color: "#E91E63" },
      { name: "หน่วยงาน D", color: "#F48FB1" },
    ];

    // Base pattern values สำหรับแต่ละโหมด
    const getBaseValues = (mode, period) => {
      switch (mode) {
        case "monthly":
          if (period.includes("มกราคม"))
            return [8, 18, 12, 3, 12, 6, 11, 14, 8];
          if (period.includes("กุมภาพันธ์"))
            return [15, 7, 20, 9, 4, 16, 2, 19, 11];
          if (period.includes("มีนาคม"))
            return [5, 22, 8, 17, 10, 3, 14, 6, 19];
          if (period.includes("เมษายน"))
            return [12, 4, 16, 8, 21, 5, 18, 9, 13];
          if (period.includes("พฤษภาคม"))
            return [9, 17, 6, 14, 3, 20, 7, 15, 4];
          if (period.includes("มิถุนายน"))
            return [16, 5, 19, 10, 8, 12, 22, 3, 17];
          if (period.includes("กรกฎาคม"))
            return [6, 19, 11, 4, 18, 8, 15, 12, 7];
          if (period.includes("สิงหาคม"))
            return [8, 18, 12, 3, 12, 6, 11, 14, 8];
          if (period.includes("กันยายน"))
            return [14, 6, 17, 11, 5, 19, 8, 16, 10];
          if (period.includes("ตุลาคม"))
            return [7, 20, 9, 16, 12, 4, 18, 5, 15];
          if (period.includes("พฤศจิกายน"))
            return [11, 8, 21, 6, 16, 13, 3, 17, 9];
          if (period.includes("ธันวาคม"))
            return [18, 4, 14, 12, 7, 20, 9, 6, 16];
          return [8, 18, 12, 3, 12, 6, 11, 14, 8];

        case "quarterly":
          if (period.includes("ไตรมาสที่ 1"))
            return [12, 8, 19, 5, 16, 10, 22, 7, 14];
          if (period.includes("ไตรมาสที่ 2"))
            return [9, 21, 6, 17, 4, 18, 8, 15, 11];
          if (period.includes("ไตรมาสที่ 3"))
            return [16, 3, 14, 11, 20, 6, 17, 9, 13];
          if (period.includes("ไตรมาสที่ 4"))
            return [7, 18, 10, 4, 15, 12, 5, 19, 8];
          return [12, 8, 19, 5, 16, 10, 22, 7, 14];

        case "yearly":
          if (period.includes("2565")) return [10, 15, 8, 19, 6, 21, 4, 16, 12];
          if (period.includes("2566")) return [14, 7, 18, 9, 22, 5, 17, 11, 6];
          if (period.includes("2567")) return [6, 20, 11, 4, 16, 9, 23, 7, 15];
          if (period.includes("2568")) return [13, 5, 19, 12, 8, 17, 10, 20, 7];
          return [13, 5, 19, 12, 8, 17, 10, 20, 7];

        case "department":
          // Random-ish but consistent pattern for comparison
          const seed = period.charCodeAt(0) + period.length;
          const patterns = [
            [11, 6, 17, 9, 4, 19, 12, 8, 15],
            [8, 16, 5, 20, 11, 7, 18, 13, 9],
            [15, 4, 21, 8, 17, 6, 14, 10, 19],
            [9, 18, 7, 15, 5, 22, 11, 6, 16],
          ];
          return patterns[seed % patterns.length];

        default:
          return [8, 18, 12, 3, 12, 6, 11, 14, 8];
      }
    };

    const values = getBaseValues(mode, period);

    return baseData.map((item, index) => ({
      ...item,
      count: values[index] || 8,
    }));
  };

  const [chartData, setChartData] = useState(() =>
    getMockData("monthly", "สิงหาคม 2568")
  );

  const menuItems = [
    { text: "รายเดือน", id: "monthly" },
    { text: "รายไตรมาส", id: "quarterly" },
    { text: "รายปี", id: "yearly" },
    { text: "เปลี่ยนแผนกภาพระบวง", id: "department" },
  ];

  // Options for SelectField
  const monthOptions = [
    { value: "มกราคม", label: "มกราคม" },
    { value: "กุมภาพันธ์", label: "กุมภาพันธ์" },
    { value: "มีนาคม", label: "มีนาคม" },
    { value: "เมษายน", label: "เมษายน" },
    { value: "พฤษภาคม", label: "พฤษภาคม" },
    { value: "มิถุนายน", label: "มิถุนายน" },
    { value: "กรกฎาคม", label: "กรกฎาคม" },
    { value: "สิงหาคม", label: "สิงหาคม" },
    { value: "กันยายน", label: "กันยายน" },
    { value: "ตุลาคม", label: "ตุลาคม" },
    { value: "พฤศจิกายน", label: "พฤศจิกายน" },
    { value: "ธันวาคม", label: "ธันวาคม" },
  ];

  const yearOptions = [
    { value: "2565", label: "2565" },
    { value: "2566", label: "2566" },
    { value: "2567", label: "2567" },
    { value: "2568", label: "2568" },
  ];

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (modalId) => {
    setOpenModal(modalId);
    setAnchorEl(null);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
  };

  // Handle form changes with data update
  const handleMonthlyChange = (field) => (e) => {
    const newForm = { ...monthlyForm, [field]: e.target.value };
    setMonthlyForm(newForm);

    // Update chart data immediately
    const newPeriod = `${newForm.month} ${newForm.year}`;
    setCurrentPeriod(newPeriod);
    setCurrentMode("monthly");
    setChartData(getMockData("monthly", newPeriod));
  };

  const handleQuarterlyChange = (e) => {
    const newForm = { year: e.target.value };
    setQuarterlyForm(newForm);
  };

  const handleYearlyChange = (e) => {
    const newForm = { year: e.target.value };
    setYearlyForm(newForm);

    // Update chart data immediately
    const newPeriod = `ปี ${newForm.year}`;
    setCurrentPeriod(newPeriod);
    setCurrentMode("yearly");
    setChartData(getMockData("yearly", newPeriod));
  };

  const handleDepartmentChange = (field) => (e) => {
    const newForm = { ...departmentForm, [field]: e.target.value };
    setDepartmentForm(newForm);

    // Update chart data immediately
    const newPeriod = `เปรียบเทียบ ${newForm.fromYear}-${newForm.toYear}`;
    setCurrentPeriod(newPeriod);
    setCurrentMode("department");
    setChartData(getMockData("department", newPeriod));
  };

  // Handle quarter selection
  const handleQuarterSelect = (quarterLabel) => {
    const newPeriod = `${quarterLabel} ปี ${quarterlyForm.year}`;
    setCurrentPeriod(newPeriod);
    setCurrentMode("quarterly");
    setChartData(getMockData("quarterly", quarterLabel));
    handleCloseModal();
  };

  // Render Modal Content
  const renderModalContent = () => {
    switch (openModal) {
      case "monthly":
        return (
          <Paper
            sx={{
              position: "relative",
              width: { xs: "360px", md: "420px" },
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: 24,
              p: 3,
            }}
          >
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                color: "#666",
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>

            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "16px",
                color: "#333",
                mb: 3,
                mt: 1,
              }}
            >
              สถิติเรื่องราวร้องทุกข์ประจำเดือน
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ fontSize: "14px", minWidth: "60px" }}>
                  เดือน :
                </Typography>
                <Box sx={{ minWidth: 200 }}>
                  <SelectField
                    options={monthOptions}
                    value={monthlyForm.month}
                    onChange={handleMonthlyChange("month")}
                    name="month"
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ fontSize: "14px", minWidth: "60px" }}>
                  ปีงบประมาณ :
                </Typography>
                <Box sx={{ minWidth: 200 }}>
                  <SelectField
                    options={yearOptions}
                    value={monthlyForm.year}
                    onChange={handleMonthlyChange("year")}
                    name="year"
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        );

      case "quarterly":
        return (
          <Paper
            sx={{
              position: "relative",
              width: { xs: "400px", md: "500px" },
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: 24,
              p: 3,
            }}
          >
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                color: "#666",
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>

            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "16px",
                color: "#333",
                mb: 3,
                mt: 1,
              }}
            >
              สถิติเรื่องราวร้องทุกข์ประจำไตรมาส
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Typography sx={{ fontSize: "14px", minWidth: "80px" }}>
                ปีงบประมาณ :
              </Typography>
              <Box sx={{ minWidth: 120 }}>
                <SelectField
                  options={yearOptions}
                  value={quarterlyForm.year}
                  onChange={handleQuarterlyChange}
                  name="quarterlyYear"
                  size="small"
                />
              </Box>
            </Box>

            <Grid container spacing={2}>
              {[
                { label: "ไตรมาสที่ 1", period: "(ต.ค. - ธ.ค.)" },
                { label: "ไตรมาสที่ 2", period: "(ม.ค. - มี.ค.)" },
                { label: "ไตรมาสที่ 3", period: "(เม.ย. - มิ.ย.)" },
                { label: "ไตรมาสที่ 4", period: "(ก.ค. - ก.ย.)" },
              ].map((quarter, index) => (
                <Grid item xs={6} key={index}>
                  <Button
                    variant="outlined"
                    sx={{
                      width: "100%",
                      height: "70px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      borderColor: "#ddd",
                      color: "#333",
                      "&:hover": {
                        borderColor: "#1976d2",
                        backgroundColor: "rgba(25, 118, 210, 0.04)",
                      },
                    }}
                    onClick={() => handleQuarterSelect(quarter.label)}
                  >
                    <Typography sx={{ fontSize: "13px", fontWeight: "500" }}>
                      {quarter.label}
                    </Typography>
                    <Typography sx={{ fontSize: "11px", color: "#666" }}>
                      {quarter.period}
                    </Typography>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        );

      case "yearly":
        return (
          <Paper
            sx={{
              position: "relative",
              width: { xs: "300px", md: "350px" },
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: 24,
              p: 3,
            }}
          >
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                color: "#666",
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>

            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "16px",
                color: "#333",
                mb: 3,
                mt: 1,
              }}
            >
              สถิติเรื่องราวร้องทุกข์ประจำปี
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography sx={{ fontSize: "14px", minWidth: "30px" }}>
                ปี :
              </Typography>
              <Box sx={{ minWidth: 150 }}>
                <SelectField
                  options={yearOptions}
                  value={yearlyForm.year}
                  onChange={handleYearlyChange}
                  name="yearlyYear"
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        );

      case "department":
        return (
          <Paper
            sx={{
              position: "relative",
              width: { xs: "360px", md: "420px" },
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: 24,
              p: 3,
            }}
          >
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                color: "#666",
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>

            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "16px",
                color: "#333",
                mb: 3,
                mt: 1,
              }}
            >
              เปรียบเทียบประเภทเรื่องราวร้องทุกข์
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ fontSize: "14px", minWidth: "30px" }}>
                  ปี :
                </Typography>
                <Box sx={{ minWidth: 150 }}>
                  <SelectField
                    options={yearOptions}
                    value={departmentForm.fromYear}
                    onChange={handleDepartmentChange("fromYear")}
                    name="fromYear"
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ fontSize: "14px", minWidth: "30px" }}>
                  ปี :
                </Typography>
                <Box sx={{ minWidth: 150 }}>
                  <SelectField
                    options={yearOptions}
                    value={departmentForm.toYear}
                    onChange={handleDepartmentChange("toYear")}
                    name="toYear"
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const responsiveConfig = {
      barThickness: isSmallMobile ? 12 : isMobile ? 15 : 30,
      fontSize: isSmallMobile ? 8 : isMobile ? 9 : 10,
      stepSize: 5,
      suggestedMax: Math.max(
        25,
        Math.max(...chartData.map((item) => item.count)) + 3
      ),
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
            borderRadius: 3,
            barThickness: responsiveConfig.barThickness,
            maxBarThickness: responsiveConfig.barThickness + 2,
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
                if (isMobile && fullName.length > 15) {
                  return fullName.substring(0, 15) + "...";
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
            categoryPercentage: 0.7,
            barPercentage: 0.8,
          },
          y: {
            beginAtZero: true,
            max: responsiveConfig.suggestedMax,
            ticks: {
              stepSize: responsiveConfig.stepSize,
              font: {
                size: responsiveConfig.fontSize,
              },
              color: "#666",
              padding: 6,
            },
            grid: {
              color: "rgba(0,0,0,0.1)",
              lineWidth: 0.5,
            },
          },
        },
        layout: {
          padding: {
            left: isSmallMobile ? 8 : 10,
            right: isSmallMobile ? 8 : 10,
            top: isSmallMobile ? 5 : 8,
            bottom: isSmallMobile ? 5 : 8,
          },
        },
        animation: {
          duration: isMobile ? 300 : 500,
          easing: "easeOutQuart",
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartData, isMobile, isSmallMobile]);

  const open = Boolean(anchorEl);

  return (
    <>
      <Box
        sx={{
          height: "100%",
          width: "100%",
          p: { xs: 0.8, md: 1 },
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            mb: { xs: 0.5, md: 0.8 },
            position: "relative",
          }}
        >
          <IconButton
            onClick={handleMenuClick}
            sx={{
              position: "absolute",
              top: -8,
              right: 8,
              color: "#666",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.04)",
              },
            }}
            size="small"
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          <Typography
            variant="subtitle2"
            sx={{
              color: "#1120A3",
              fontWeight: "bold",
              textAlign: "center",
              fontSize: { xs: "10px", sm: "11px", md: "12px" },
              lineHeight: 1.2,
              mb: 0.2,
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
              fontSize: { xs: "9px", sm: "10px", md: "11px" },
              lineHeight: 1.1,
            }}
          >
            ณ {currentPeriod}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            position: "relative",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <canvas
            ref={chartRef}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
        </Box>

        {isMobile && (
          <Box
            sx={{
              flexShrink: 0,
              mt: 0.5,
              display: "flex",
              flexWrap: "wrap",
              gap: 0.3,
              justifyContent: "center",
              maxHeight: "30px",
              overflow: "hidden",
            }}
          >
            {chartData.slice(0, 4).map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.2,
                  fontSize: "6px",
                  color: "#666",
                  backgroundColor: "rgba(0,0,0,0.02)",
                  borderRadius: 0.5,
                  px: 0.3,
                  py: 0.1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    backgroundColor: item.color,
                    borderRadius: 0.5,
                  }}
                />
                <Typography sx={{ fontSize: "6px" }}>
                  {item.name.length > 8
                    ? item.name.substring(0, 8) + "..."
                    : item.name}
                </Typography>
              </Box>
            ))}
            {chartData.length > 4 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.02)",
                  borderRadius: 0.5,
                  px: 0.3,
                  py: 0.1,
                }}
              >
                <Typography sx={{ fontSize: "6px", color: "#999" }}>
                  +{chartData.length - 4}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0px 4px 20px rgba(0,0,0,0.15)",
            minWidth: "180px",
          },
        }}
      >
        <List sx={{ p: 0 }}>
          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem
                button
                onClick={() => handleMenuItemClick(item.id)}
                sx={{
                  py: 1.2,
                  px: 2,
                  "&:hover": {
                    backgroundColor: "rgba(17, 32, 163, 0.04)",
                  },
                }}
              >
                <ListItemText
                  primary={item.text}
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: "14px",
                      fontWeight: "400",
                      color: "#333",
                    },
                  }}
                />
              </ListItem>
              {index < menuItems.length - 1 && <Divider sx={{ mx: 1 }} />}
            </React.Fragment>
          ))}
        </List>
      </Popover>

      {openModal && (
        <Modal
          open={!!openModal}
          onClose={handleCloseModal}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <>{renderModalContent()}</>
        </Modal>
      )}
    </>
  );
};

export default TopRightChart;
