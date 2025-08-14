import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useMediaQuery,
  useTheme,
  CircularProgress,
  ListSubheader,
  Button,
} from "@mui/material";
import Chart from "chart.js/auto";
import {
  GetNameDepartments,
  GetDonutChartComplaintTypes,
} from "@pages/api/dashboard/dashboard";
import {
  GetAllSelectYears,
} from "@pages/api/allselect/allselect";

const getComplaintTypeColor = (index) => {
  const colors = [
    "#4A5CD6", "#E91E63", "#87CEEB", "#FF9800", "#4CAF50",
    "#9C27B0", "#FF5722", "#607D8B", "#795548", "#F44336"
  ];
  return colors[index % colors.length];
};

const BottomLeftService = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // States
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState("2568");
  const [departments, setDepartments] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [yearsLoading, setYearsLoading] = useState(true);

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

  // Fetch departments list
  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const result = await GetNameDepartments();

      if (result.success) {
        setDepartments(result.departments);
        // Set first department as default
        if (result.departments.length > 0) {
          setSelectedDepartment(result.departments[0].id);
        }
      } else {
        setError("ไม่สามารถโหลดรายชื่อหน่วยงานได้");
        console.error("Department fetch error:", result.message || result.error);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("เกิดข้อผิดพลาดในการโหลดหน่วยงาน");
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Fetch complaint types data
  const fetchComplaintTypes = async () => {
    if (!selectedDepartment) return;

    setLoading(true);
    setError(null);

    try {
      const year = parseInt(selectedYear) - 543; // แปลง พ.ศ. เป็น ค.ศ.
      const result = await GetDonutChartComplaintTypes(year, selectedDepartment);

      if (result.success) {
        if (result.isEmpty || result.total === 0) {
          // ไม่มีข้อมูล
          setChartData([]);
          setError("ไม่มีข้อมูลประเภทเรื่องร้องเรียนสำหรับหน่วยงานและปีที่เลือก");
        } else if (result.data && result.data.length > 0) {
          setChartData(result.data);
        } else {
          // มี total แต่ไม่มี departments data
          setChartData([]);
          setError("ไม่มีข้อมูลแยกตามประเภท");
        }
      } else {
        setError(result.message || result.error || "ไม่สามารถดึงข้อมูลได้");
        setChartData([]);
      }
    } catch (err) {
      console.error("Error fetching complaint types:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([
        fetchYears(),
        fetchDepartments()
      ]);
    };

    fetchInitialData();
  }, []);

  // Load complaint types when department or year changes
  useEffect(() => {
    if (selectedDepartment && !departmentsLoading && !yearsLoading) {
      fetchComplaintTypes();
    }
  }, [selectedDepartment, selectedYear, departmentsLoading, yearsLoading]);

  // Chart effect
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
                if (item) {
                  return `${item.name}: ${item.value} เรื่อง (${item.formattedPercent || ''})`;
                }
                return context.label;
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
              ctx.fillText("ไม่มีข้อมูล", width / 2, height / 2 + 5);
            } else if (isEmpty) {
              ctx.font = `bold ${fontSizes.centerTitle}px sans-serif`;
              ctx.fillText("ไม่มีข้อมูล", width / 2, height / 2 + 5);
            } else {
              const total = chartData.reduce((sum, d) => sum + d.value, 0);

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
                total.toLocaleString(),
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
  }, [chartData, loading, error, isMobile, isSmallMobile]);

  // Group departments by group name for better organization
  const groupedDepartments = departments.reduce((groups, dept) => {
    const groupName = dept.groupName;
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(dept);
    return groups;
  }, {});

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
                disabled={loading || departmentsLoading || yearsLoading}
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
                minWidth: { xs: 120, sm: 140, md: 200 },
              }}
            >
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={departmentsLoading || departments.length === 0}
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
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {departmentsLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    กำลังโหลด...
                  </MenuItem>
                ) : Object.keys(groupedDepartments).length > 0 ? (
                  Object.entries(groupedDepartments).map(([groupName, depts]) => [
                    <ListSubheader key={groupName} sx={{ fontSize: "11px", fontWeight: "bold", color: "#1976d2" }}>
                      {groupName}
                    </ListSubheader>,
                    ...depts.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        <Typography
                          noWrap
                          sx={{
                            maxWidth: { xs: "100px", sm: "120px", md: "180px" },
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontSize: { xs: "10px", md: "12px" },
                          }}
                          title={dept.name}
                        >
                          {dept.name}
                        </Typography>
                      </MenuItem>
                    ))
                  ]).flat()
                ) : (
                  <MenuItem disabled>ไม่มีข้อมูลหน่วยงาน</MenuItem>
                )}
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
                {item.name}: {item.value} เรื่อง
                {item.formattedPercent && ` (${item.formattedPercent})`}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default BottomLeftService;