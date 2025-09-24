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
  CircularProgress,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SelectField from "@services/SelectField/SelectField";
import Chart from "chart.js/auto";
import { GetComplaintSummary } from "@pages/api/dashboard/dashboard";
import { GetAllSelectYears } from "@pages/api/allselect/allselect";

const TopRightChart = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openModal, setOpenModal] = useState(null);

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

  const getCurrentThaiYear = () => new Date().getFullYear() + 543;
  const getCurrentThaiMonthLabel = () => TH_MONTHS[new Date().getMonth()];

  // API data states
  const [apiData, setApiData] = useState(null);
  const [yearOptions, setYearOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for current display mode
  const [currentMode, setCurrentMode] = useState("monthly");
  const [currentPeriod, setCurrentPeriod] = useState(
    `${getCurrentThaiMonthLabel()} ${getCurrentThaiYear()}`
  );

  // States for form values
  const [monthlyForm, setMonthlyForm] = useState({
    month: getCurrentThaiMonthLabel(),
    year: String(getCurrentThaiYear()),
  });
  const [quarterlyForm, setQuarterlyForm] = useState({
    year: String(getCurrentThaiYear()),
    quarter: null,
  });
  const [yearlyForm, setYearlyForm] = useState({
    year: String(getCurrentThaiYear()),
  });
  const [departmentForm, setDepartmentForm] = useState({
    fromYear: String(getCurrentThaiYear() - 1), 
    toYear: String(getCurrentThaiYear()), 
  });
  // เพิ่ม state สำหรับดูหน่วยงาน
  const [departmentViewForm, setDepartmentViewForm] = useState({
    month: getCurrentThaiMonthLabel(),
    year: String(getCurrentThaiYear()),
  });

  const [chartData, setChartData] = useState([]);

  const toInt = (v) =>
    v == null ? null : parseInt(String(v).replace(/[^\d]/g, ""), 10);
  const toTH = (y) => {
    const n = toInt(y);
    if (!n) return "";
    return n >= 2400 ? n : n + 543; 
  };

  // Fetch years data from API
  const fetchYears = async () => {
    setYearsLoading(true);
    try {
      const result = await GetAllSelectYears();
      const currentTH = String(getCurrentThaiYear());

      if (result?.success && Array.isArray(result?.yearOptions)) {
        const thOptions = result.yearOptions.map((y) => {
          const rawVal = y?.value ?? y;
          return {
            value: String(toTH(rawVal)),
            label: String(toTH(y?.label ?? rawVal)),
          };
        });
        setYearOptions(thOptions);

        const latest = thOptions[thOptions.length - 1];
        const displayYear = thOptions.some((y) => String(y.value) === currentTH)
          ? currentTH
          : String(latest?.value ?? currentTH);

        setMonthlyForm((prev) => ({
          ...prev,
          year: displayYear,
          month: prev.month || getCurrentThaiMonthLabel(),
        }));
        setQuarterlyForm((prev) => ({ 
          ...prev, 
          year: displayYear 
        }));
        setYearlyForm({ year: displayYear });
        setDepartmentForm((prev) => ({ 
          ...prev, 
          toYear: displayYear,
          fromYear: prev.fromYear || String(Number(displayYear) - 1)
        }));
        setDepartmentViewForm((prev) => ({
          ...prev,
          year: displayYear,
          month: prev.month || getCurrentThaiMonthLabel(),
        }));

        setCurrentPeriod(`${getCurrentThaiMonthLabel()} ${displayYear}`);
      } else {
        const y = getCurrentThaiYear();
        const fallback = [
          { value: String(y - 3), label: String(y - 3) },
          { value: String(y - 2), label: String(y - 2) },
          { value: String(y - 1), label: String(y - 1) },
          { value: String(y), label: String(y) },
        ];
        setYearOptions(fallback);
        
        setMonthlyForm((prev) => ({
          ...prev,
          year: String(y),
          month: prev.month || getCurrentThaiMonthLabel(),
        }));
        setQuarterlyForm((prev) => ({ 
          ...prev, 
          year: String(y) 
        }));
        setYearlyForm({ year: String(y) });
        setDepartmentForm({
          fromYear: String(y - 1),
          toYear: String(y)
        });
        setDepartmentViewForm((prev) => ({
          ...prev,
          year: String(y),
          month: prev.month || getCurrentThaiMonthLabel(),
        }));
        setCurrentPeriod(`${getCurrentThaiMonthLabel()} ${y}`);
      }
    } catch (err) {
      console.error("Error fetching years:", err);
      const y = getCurrentThaiYear();
      const fallback = [{ value: String(y), label: String(y) }];
      setYearOptions(fallback);
      
      setMonthlyForm((prev) => ({
        ...prev,
        year: String(y),
        month: prev.month || getCurrentThaiMonthLabel(),
      }));
      setQuarterlyForm((prev) => ({ 
        ...prev, 
        year: String(y) 
      }));
      setYearlyForm({ year: String(y) });
      setDepartmentForm({
        fromYear: String(y - 1),
        toYear: String(y)
      });
      setDepartmentViewForm((prev) => ({
        ...prev,
        year: String(y),
        month: prev.month || getCurrentThaiMonthLabel(),
      }));
      setCurrentPeriod(`${getCurrentThaiMonthLabel()} ${y}`);
    } finally {
      setYearsLoading(false);
    }
  };

  // Improved fetchApiData function
  const fetchApiData = async (filterParams = null) => {
  setLoading(true);
  setError(null);

  try {
    console.log('Fetching API data with params:', filterParams);
    
    // ถ้าเป็นโหมด department_view ให้ส่ง mode เป็น yearly แทน
    let apiParams = filterParams;
    if (filterParams?.mode === 'department_view') {
      apiParams = {
        mode: 'yearly',
        year: filterParams.year
      };
      console.log('Converted to yearly mode, API params:', apiParams);
    }
    
    const result = await GetComplaintSummary(apiParams);
    
    console.log('API Response:', result);
    
    if (result.success || result.res_code === "0000") {
      setApiData(result);

      // ตรวจสอบว่าเป็นโหมดดูหน่วยงานหรือไม่
      if (filterParams?.mode === 'department_view') {
        console.log('=== Department View Mode ===');
        console.log('Selected month:', filterParams.month);
        console.log('Month index:', TH_MONTHS.indexOf(filterParams.month));
        
        // แก้ไข: ใช้ result.chartData แทน
        const chartData = result.chartData;
        console.log('Has chartData:', !!chartData);
        console.log('Has monthly_breakdown_department:', !!chartData?.monthly_breakdown_department);
        
        // แสดงข้อมูลหน่วยงาน
        if (chartData?.monthly_breakdown_department) {
          const monthIndex = TH_MONTHS.indexOf(filterParams.month);
          const monthData = chartData.monthly_breakdown_department[monthIndex];
          
          console.log('Month data:', monthData);
          console.log('Departments count:', monthData?.departments?.length);
          
          if (monthData && monthData.departments && monthData.departments.length > 0) {
            // จำกัดแสดงแค่ 10 หน่วยงานแรกที่มีเรื่องร้องเรียนมากที่สุด
            const topDepartments = monthData.departments
              .sort((a, b) => b.count - a.count) // เรียงจากมากไปน้อย
              .slice(0, 5); // เอาแค่ 10 อันดับแรก
            
            const processedData = topDepartments.map((dept, index) => ({
              name: dept.department_name,
              count: dept.count,
              color: getChartColor(index),
              id: dept.department_id || `dept-${index}`,
              percent: monthData.total > 0 ? ((dept.count / monthData.total) * 100).toFixed(1) : 0,
            }));
            
            console.log(`Department Chart Data (top 10 of ${monthData.departments.length}):`, processedData);
            setChartData(processedData);
          } else {
            console.log('No departments data for this month');
            setChartData([
              {
                name: "ไม่มีข้อมูลในเดือนนี้",
                count: 0,
                color: "#e0e0e0",
                id: "no-data",
                percent: 0,
              },
            ]);
          }
        } else {
          console.log('No monthly_breakdown_department in response');
          setChartData([
            {
              name: "ไม่มีข้อมูล",
              count: 0,
              color: "#e0e0e0",
              id: "no-data",
              percent: 0,
            },
          ]);
        }
      } else if (result.departmentData && result.departmentData.length > 0) {
        const processedData = result.departmentData.map((dept, index) => ({
          name: dept.name,
          count: dept.count || Math.round((dept.percent / 100) * result.latestMonthTotal),
          color: getChartColor(index),
          id: dept.id,
          percent: dept.percent || 0,
        }));
        
        console.log('Processed Chart Data:', processedData);
        setChartData(processedData);
        
      } else if (result.dashboardCards && result.dashboardCards.length > 0) {
        const summaryData = result.dashboardCards.map((card, index) => ({
          name: card.title.replace("เรื่องราวร้องทุกข์", "").trim(),
          count: card.count,
          color: getChartColor(index),
          id: card.id,
          percent: 0,
        }));
        
        console.log('Dashboard Chart Data:', summaryData);
        setChartData(summaryData);
      } else {
        setChartData([
          {
            name: "ไม่มีข้อมูล",
            count: 0,
            color: "#e0e0e0",
            id: "no-data",
            percent: 0,
          },
        ]);
      }
    } else {
      setError("ไม่สามารถดึงข้อมูลได้");
      setChartData([
        {
          name: "ไม่มีข้อมูล",
          count: 0,
          color: "#e0e0e0",
          id: "no-data",
          percent: 0,
        },
      ]);
    }
  } catch (err) {
    console.error("Error fetching API data:", err);
    setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    setChartData([
      {
        name: "เกิดข้อผิดพลาด",
        count: 0,
        color: "#f44336",
        id: "error",
        percent: 0,
      },
    ]);
  } finally {
    setLoading(false);
  }
};

  // Generate chart colors
  const getChartColor = (index) => {
    const colors = [
      "#1A237E",
      "#3949AB",
      "#7986CB",
      "#29B6F6",
      "#81D4FA",
      "#FBC02D",
      "#FBE9A7",
      "#E91E63",
      "#F48FB1",
      "#4CAF50",
      "#8BC34A",
      "#CDDC39",
      "#FF9800",
      "#FF5722",
      "#795548",
    ];
    return colors[index % colors.length];
  };

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([fetchYears(), fetchApiData()]);
    };

    fetchInitialData();
  }, []);

  const menuItems = [
    { text: "รายเดือน", id: "monthly" },
    { text: "รายไตรมาส", id: "quarterly" },
    { text: "รายปี", id: "yearly" },
    { text: "เปรียบเทียบระหว่างปี", id: "department" },
    { text: "ดูตามหน่วยงาน", id: "department_view" }, // เพิ่มเมนูใหม่
  ];

  // Options for SelectField - months remain static
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

  // Handle form changes
  const handleMonthlyChange = (field) => (e) => {
    const newValue = e.target.value;
    const newForm = { ...monthlyForm, [field]: newValue };
    setMonthlyForm(newForm);
  };

  const handleMonthlySubmit = async () => {
    const newPeriod = `${monthlyForm.month} ${monthlyForm.year}`;
    setCurrentPeriod(newPeriod);
    setCurrentMode("monthly");
    
    await fetchApiData({
      mode: "monthly",
      month: monthlyForm.month,
      year: monthlyForm.year
    });
    
    handleCloseModal();
  };

  const handleQuarterlyChange = (e) => {
    const newForm = { ...quarterlyForm, year: e.target.value };
    setQuarterlyForm(newForm);
  };

  const handleYearlyChange = (e) => {
    const newForm = { ...yearlyForm, year: e.target.value };
    setYearlyForm(newForm);
  };

  const handleYearlySubmit = async () => {
    const newPeriod = `ปี ${yearlyForm.year}`;
    setCurrentPeriod(newPeriod);
    setCurrentMode("yearly");
    
    await fetchApiData({
      mode: "yearly",
      year: yearlyForm.year
    });
    
    handleCloseModal();
  };

  const handleDepartmentChange = (field) => (e) => {
    const newValue = e.target.value;
    const newForm = { ...departmentForm, [field]: newValue };
    setDepartmentForm(newForm);
  };

  const handleDepartmentSubmit = async () => {
    const newPeriod = `เปรียบเทียบ ${departmentForm.fromYear}-${departmentForm.toYear}`;
    setCurrentPeriod(newPeriod);
    setCurrentMode("department");
    
    await fetchApiData({
      mode: "compare",
      fromYear: departmentForm.fromYear,
      toYear: departmentForm.toYear
    });
    
    handleCloseModal();
  };

  const handleQuarterSelect = async (quarterLabel) => {
    const newForm = { ...quarterlyForm, quarter: quarterLabel };
    setQuarterlyForm(newForm);
    
    const newPeriod = `${quarterLabel} ปี ${quarterlyForm.year}`;
    setCurrentPeriod(newPeriod);
    setCurrentMode("quarterly");
    
    await fetchApiData({
      mode: "quarterly",
      quarter: quarterLabel,
      year: quarterlyForm.year
    });
    
    handleCloseModal();
  };

  // เพิ่ม handler สำหรับดูหน่วยงาน
  const handleDepartmentViewChange = (field) => (e) => {
    const newValue = e.target.value;
    const newForm = { ...departmentViewForm, [field]: newValue };
    setDepartmentViewForm(newForm);
  };

  const handleDepartmentViewSubmit = async () => {
  const newPeriod = `หน่วยงาน ${departmentViewForm.month} ${departmentViewForm.year}`;
  setCurrentPeriod(newPeriod);
  setCurrentMode("department_view");
  
  await fetchApiData({
    mode: "department_view",
    month: departmentViewForm.month,
    year: departmentViewForm.year
  });
  
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
                    clearable={false}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ fontSize: "14px", minWidth: "60px" }}>
                  ปีงบประมาณ :
                </Typography>
                <Box sx={{ minWidth: 200 }}>
                  {yearsLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography sx={{ fontSize: "12px" }}>
                        กำลังโหลด...
                      </Typography>
                    </Box>
                  ) : (
                    <SelectField
                      options={yearOptions}
                      value={monthlyForm.year}
                      onChange={handleMonthlyChange("year")}
                      name="year"
                      size="small"
                      clearable={false}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleMonthlySubmit}
                  disabled={loading}
                  sx={{ 
                    minWidth: 120,
                    fontSize: "14px"
                  }}
                >
                  {loading ? <CircularProgress size={20} /> : "แสดงข้อมูล"}
                </Button>
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
                {yearsLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography sx={{ fontSize: "12px" }}>
                      กำลังโหลด...
                    </Typography>
                  </Box>
                ) : (
                  <SelectField
                    options={yearOptions}
                    value={quarterlyForm.year}
                    onChange={handleQuarterlyChange}
                    name="quarterlyYear"
                    size="small"
                  />
                )}
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
                      ...(quarterlyForm.quarter === quarter.label && {
                        borderColor: "#1976d2",
                        backgroundColor: "rgba(25, 118, 210, 0.08)",
                      }),
                    }}
                    onClick={() => handleQuarterSelect(quarter.label)}
                    disabled={loading}
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

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Typography sx={{ fontSize: "14px", minWidth: "30px" }}>
                ปี :
              </Typography>
              <Box sx={{ minWidth: 150 }}>
                {yearsLoading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography sx={{ fontSize: "12px" }}>
                      กำลังโหลด...
                    </Typography>
                  </Box>
                ) : (
                  <SelectField
                    options={yearOptions}
                    value={yearlyForm.year}
                    onChange={handleYearlyChange}
                    name="yearlyYear"
                    size="small"
                  />
                )}
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={handleYearlySubmit}
                disabled={loading}
                sx={{ 
                  minWidth: 120,
                  fontSize: "14px"
                }}
              >
                {loading ? <CircularProgress size={20} /> : "แสดงข้อมูล"}
              </Button>
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
                <Typography sx={{ fontSize: "14px", minWidth: "80px" }}>
                  ปีเปรียบเทียบ :
                </Typography>
                <Box sx={{ minWidth: 150 }}>
                  {yearsLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography sx={{ fontSize: "12px" }}>
                        กำลังโหลด...
                      </Typography>
                    </Box>
                  ) : (
                    <SelectField
                      options={yearOptions}
                      value={departmentForm.fromYear}
                      onChange={handleDepartmentChange("fromYear")}
                      name="fromYear"
                      size="small"
                    />
                  )}
                </Box>
                </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ fontSize: "14px", minWidth: "80px" }}>
                  ปีปัจจุบัน :
                </Typography>
                <Box sx={{ minWidth: 150 }}>
                  {yearsLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography sx={{ fontSize: "12px" }}>
                        กำลังโหลด...
                      </Typography>
                    </Box>
                  ) : (
                    <SelectField
                      options={yearOptions}
                      value={departmentForm.toYear}
                      onChange={handleDepartmentChange("toYear")}
                      name="toYear"
                      size="small"
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleDepartmentSubmit}
                  disabled={loading}
                  sx={{ 
                    minWidth: 120,
                    fontSize: "14px"
                  }}
                >
                  {loading ? <CircularProgress size={20} /> : "แสดงข้อมูล"}
                </Button>
              </Box>
            </Box>
          </Paper>
        );

      case "department_view":
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
              สถิติเรื่องร้องทุกข์แยกตามหน่วยงาน
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ fontSize: "14px", minWidth: "60px" }}>
                  เดือน :
                </Typography>
                <Box sx={{ minWidth: 200 }}>
                  <SelectField
                    options={monthOptions}
                    value={departmentViewForm.month}
                    onChange={handleDepartmentViewChange("month")}
                    name="departmentMonth"
                    size="small"
                    clearable={false}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography sx={{ fontSize: "14px", minWidth: "60px" }}>
                  ปีงบประมาณ :
                </Typography>
                <Box sx={{ minWidth: 200 }}>
                  {yearsLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography sx={{ fontSize: "12px" }}>
                        กำลังโหลด...
                      </Typography>
                    </Box>
                  ) : (
                    <SelectField
                      options={yearOptions}
                      value={departmentViewForm.year}
                      onChange={handleDepartmentViewChange("year")}
                      name="departmentYear"
                      size="small"
                      clearable={false}
                    />
                  )}
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleDepartmentViewSubmit}
                  disabled={loading}
                  sx={{ 
                    minWidth: 120,
                    fontSize: "14px"
                  }}
                >
                  {loading ? <CircularProgress size={20} /> : "แสดงข้อมูล"}
                </Button>
              </Box>
            </Box>
          </Paper>
        );

      default:
        return null;
    }
  };

  // Chart effect
  useEffect(() => {
    if (!chartRef.current || loading) return;

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
            barThickness: currentMode === "department_view" ? 20 : (isSmallMobile ? 12 : isMobile ? 15 : 30),
        maxBarThickness: currentMode === "department_view" ? 25 : (responsiveConfig.barThickness + 2),
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
              label: function (context) {
                const dataIndex = context.dataIndex;
                const item = chartData[dataIndex];
                let label = `${context.dataset.label}: ${context.parsed.y} เรื่อง`;
                if (currentMode === "department_view" && item.percent > 0) {
                  label += ` (${item.percent}%)`;
                }
                return label;
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
  }, [chartData, isMobile, isSmallMobile, loading, currentMode]);

  const open = Boolean(anchorEl);

  // Loading state
  if (loading && !chartData.length) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="textSecondary">
          กำลังโหลดข้อมูล...
        </Typography>
      </Box>
    );
  }

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
            {currentMode === "department_view" 
              ? "สถิติเรื่องร้องทุกข์แยกตามหน่วยงาน"
              : "สถิติเรื่องราวร้องทุกข์"}
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

          {error && (
            <Typography
              variant="caption"
              sx={{
                color: "#f44336",
                textAlign: "center",
                fontSize: { xs: "8px", sm: "9px" },
                display: "block",
                mt: 0.5,
              }}
            >
              {error}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            position: "relative",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {chartData.length > 0 ? (
            <canvas
              ref={chartRef}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
              }}
            />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                fontSize: "14px",
              }}
            >
              ไม่มีข้อมูลแสดง
            </Box>
          )}
        </Box>

        {isMobile && chartData.length > 0 && (
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
                key={item.id || index}
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

        {error && (
          <Box sx={{ textAlign: "center", mt: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => fetchApiData()}
              sx={{ fontSize: "10px", py: 0.5, px: 1 }}
            >
              ลองใหม่
            </Button>
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