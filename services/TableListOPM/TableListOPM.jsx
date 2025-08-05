import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Container,
  IconButton,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Drawer,
  Button,
  Stack,
  Card,
  CardContent,
  Divider,
  Chip,
  Badge,
  Tooltip,
  Alert,
  AlertTitle,
  Snackbar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import FilterListIcon from "@mui/icons-material/FilterList";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import WarningIcon from "@mui/icons-material/Warning";
import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import BusinessIcon from "@mui/icons-material/Business";
import { green, grey, orange, blue } from "@mui/material/colors";

import styles from "./TableListOPM.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import ButtonSent from "@services/ButtonSent/ButtonSent";
import { GetOperatingsSelect } from "@pages/api/opm/opm";

const statusReadOptions = [
  { value: '', label: "ทั้งหมด" },
  { value: 'read', label: "รับเรื่อง" },
  { value: 'unread', label: "ยังไม่รับเรื่อง" },
];

const columns = [
  { name: "case_code", label: "รหัสเรื่อง", width: 100, priority: 3 },
  { name: "customer_name", label: "ชื่อผู้เดือดร้อน", width: 80, priority: 2 },
  { name: "type_text", label: "ประเภทเรืองร้องทุกข์", width: 100, priority: 4 },
  { name: "ShowDateTime", label: "วันที่และเวลา", width: 120, priority: 4 },
  { name: "main_status_text", label: "สถานะหลักของ สปน.", width: 160, priority: 2 },
  { name: "status_text", label: "สถานะย่อยของ สปน.", width: 80, priority: 4 },
  { name: "isRead", label: "สถานะการคลัง", width: 80, priority: 2 },
];

// ฟังก์ชันตรวจสอบการมีข้อมูลจากสำนักงานปลัดสำนักนายกรัฐมนตรี
const checkPMOfficeSubmission = (operatingsDetails) => {
  if (!operatingsDetails || operatingsDetails.length === 0) {
    return {
      hasPMOfficeSubmission: false,
      submissionCount: 0,
      lastSubmissionDate: null,
      submissions: []
    };
  }

  // คำสำคัญสำหรับตรวจสอบหน่วยงาน
  const PM_OFFICE_KEYWORDS = [
    'สำนักงานปลัดสำนักนายกรัฐมนตรี',
    'สปน',
    'สำนักนายกรัฐมนตรี',
    'ปลัดสำนักนายกรัฐมนตรี',
    'Prime Minister Office',
    'PMO'
  ];

  const submissions = [];

  operatingsDetails.forEach(operation => {
    const { org_text, detail, operating_type_text, operating_date, officer_text, created_by_text } = operation;

    // ตรวจสอบใน org_text, detail, operating_type_text, officer_text, created_by_text
    const textToCheck = [
      org_text,
      detail,
      operating_type_text,
      officer_text,
      created_by_text
    ].filter(Boolean).join(' ').toLowerCase();

    const isPMOfficeSubmission = PM_OFFICE_KEYWORDS.some(keyword =>
      textToCheck.includes(keyword.toLowerCase())
    );

    if (isPMOfficeSubmission) {
      submissions.push({
        date: operating_date,
        org: org_text,
        detail: detail,
        type: operating_type_text,
        officer: officer_text || created_by_text,
        operation: operation
      });
    }
  });

  // เรียงตามวันที่
  submissions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    hasPMOfficeSubmission: submissions.length > 0,
    submissionCount: submissions.length,
    lastSubmissionDate: submissions.length > 0 ? submissions[0].date : null,
    submissions: submissions
  };
};

const getVisibleColumns = (columns) => {
  if (typeof window !== "undefined") {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
    if (isMobile) {
      return columns.filter((col) => col.priority <= 2);
    }
    if (isTablet) {
      return columns.filter((col) => col.priority <= 3);
    }
  }
  return columns;
};

const TableListOPM = ({
  data = [],
  title = "",
  navigateTo = "",
  filterFields = [],
  onRowsPerPageChange = () => { },
  showPMOfficeIndicator = true, // เปลี่ยนจาก showReopenIndicator
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const visibleColumns = getVisibleColumns(columns);
  const extendedFilterFields = [
    ...filterFields,
    { name: "isRead", label: "สถานะอ่านแล้ว", type: "select", options: statusReadOptions },
  ];

  const initialFilters = useMemo(
    () =>
      extendedFilterFields.reduce((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {}),
    [extendedFilterFields]
  );

  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filteredData, setFilteredData] = useState(data || []);
  const [loading, setLoading] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pmOfficeStatusMap, setPMOfficeStatusMap] = useState(new Map()); // เปลี่ยนจาก reopenStatusMap
  const [isCheckingPMOffice, setIsCheckingPMOffice] = useState(false); // เปลี่ยนจาก isCheckingReopen
  const [pmOfficeNotification, setPMOfficeNotification] = useState(null); // เปลี่ยนจาก reopenNotification
  const [showPMOfficeAlert, setShowPMOfficeAlert] = useState(false); // เปลี่ยนจาก showReopenAlert
  const [hasShownPMOfficeAlert, setHasShownPMOfficeAlert] = useState(false); // เปลี่ยนจาก hasShownReopenAlert

  // ตรวจสอบการมีข้อมูลจาก PM Office สำหรับข้อมูลที่โหลดมา
  useEffect(() => {
    const checkPMOfficeForAllCases = async () => {
      if (!showPMOfficeIndicator || !data.length) return;

      setIsCheckingPMOffice(true);
      const pmOfficeMap = new Map();
      let pmOfficeCases = [];

      try {
        // ตรวจสอบ PM Office submissions สำหรับแต่ละเคส
        const promises = data.map(async (item) => {
          try {
            const operatingsDetails = await GetOperatingsSelect(item.case_id);
            const pmOfficeStatus = checkPMOfficeSubmission(operatingsDetails);
            pmOfficeMap.set(item.case_id, pmOfficeStatus);

            if (pmOfficeStatus.hasPMOfficeSubmission) {
              pmOfficeCases.push({
                ...item,
                ...pmOfficeStatus
              });
            }

            return { case_id: item.case_id, ...pmOfficeStatus };
          } catch (error) {
            console.error(`Error checking PM Office submission for case ${item.case_id}:`, error);
            pmOfficeMap.set(item.case_id, {
              hasPMOfficeSubmission: false,
              submissionCount: 0,
              submissions: []
            });
            return null;
          }
        });

        await Promise.all(promises);
        setPMOfficeStatusMap(pmOfficeMap);

        // แสดง notification ถ้ามีเคสที่มีข้อมูลจาก PM Office (เฉพาะครั้งแรก)
        if (pmOfficeCases.length > 0 && !hasShownPMOfficeAlert) {
          const totalSubmissions = pmOfficeCases.reduce((sum, c) => sum + c.submissionCount, 0);
          setPMOfficeNotification({
            count: pmOfficeCases.length,
            totalSubmissions,
            cases: pmOfficeCases
          });
          setShowPMOfficeAlert(true);
          setHasShownPMOfficeAlert(true); // จำว่าแสดงแล้ว
        }

      } catch (error) {
        console.error("Error checking PM Office submissions:", error);
      } finally {
        setIsCheckingPMOffice(false);
      }
    };

    checkPMOfficeForAllCases();
  }, [data, showPMOfficeIndicator]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // เพิ่ม PM Office status เข้าไปในข้อมูล
      const dataWithPMOfficeStatus = (data || []).map(item => {
        const pmOfficeStatus = pmOfficeStatusMap.get(item.case_id) || {
          hasPMOfficeSubmission: false,
          submissionCount: 0
        };
        return {
          ...item,
          ...pmOfficeStatus,
          statusPriority: calculateStatusPriority(item.status_text, pmOfficeStatus)
        };
      });

      // เรียงลำดับให้เคสที่มีข้อมูลจาก PM Office ขึ้นด้านบน
      const sortedData = dataWithPMOfficeStatus.sort((a, b) => {
        if (b.statusPriority !== a.statusPriority) {
          return b.statusPriority - a.statusPriority;
        }
        // ถ้า priority เท่ากัน เรียงตามวันที่
        const dateA = new Date(a.lastSubmissionDate || a.ShowDateTime);
        const dateB = new Date(b.lastSubmissionDate || b.ShowDateTime);
        return dateB - dateA;
      });

      setFilteredData(sortedData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [data, pmOfficeStatusMap]);

  const calculateStatusPriority = (statusText, pmOfficeStatus) => {
    let priority = 0;

    switch (statusText) {
      case "อยู่ระหว่างดำเนินการ":
        priority = 10;
        break;
      case "รับเรื่อง":
      case "รับทราบไว้ชั้นต้น":
        priority = 8;
        break;
      case "รอผลการพิจารณาของหน่วยงานอื่น":
        priority = 6;
        break;
      case "เสร็จสิ้น":
        priority = 4;
        break;
      case "ยุติเรื่อง":
      case "ไม่อยู่ในอำนาจหน้าที่":
        priority = 2;
        break;
      default:
        priority = 1;
    }

    // เพิ่ม priority สำหรับเคสที่มีข้อมูลจาก PM Office
    if (pmOfficeStatus.hasPMOfficeSubmission) {
      priority += 30; // ให้ priority สูงกว่า reopen
      priority += pmOfficeStatus.submissionCount;
    }

    return priority;
  };

  const pagedData = useMemo(
    () => filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredData, page, rowsPerPage]
  );

  const handleChangeFilter = (field) => (event) => {
    const value = event?.target?.value || "";
    setFilters((prevFilters) => ({ ...prevFilters, [field]: value }));
  };

  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10) || 10;
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    onRowsPerPageChange(newRowsPerPage);
  };

  const handleSearchClick = () => {
    const newFilteredData = filteredData.filter((item) => {
      return Object.keys(filters).every((key) => {
        if (!filters[key]) return true;
        if (key === "isRead") {
          if (filters[key] === "read") return item.isRead === true;
          if (filters[key] === "unread") return item.isRead !== true;
          return true;
        }
        const itemValue = item[key]?.toString().toLowerCase() || "";
        const filterValue = filters[key]?.toString().toLowerCase() || "";
        return itemValue.includes(filterValue);
      });
    });

    setFilteredData(newFilteredData);
    setPage(0);
    if (isMobile) setFilterDrawerOpen(false);
  };

  const handleClearSearch = () => {
    setFilters(initialFilters);
    setFilteredData(data || []);
    setPage(0);
    if (isMobile) setFilterDrawerOpen(false);
  };

  const handleRowClick = (item, data) => {
    if (navigateTo) {
      router.push({
        pathname: `${navigateTo}/${item.case_id}`,
      });
    }
  };

  const handleRowSend = (data) => {
    if (navigateTo) {
      router.push({
        pathname: `${navigateTo}/send`,
        query: { ...data },
      });
    }
  };

  const handleClosePMOfficeAlert = () => {
    setShowPMOfficeAlert(false);
    // เมื่อปิดแล้ว ไม่แสดงซ้ำในครั้งนี้
  };

  const FilterContent = () => (
    <Box
      sx={{
        p: isMobile ? 2 : 0,
        display: "flex",
        flexDirection: "row",
        gap: 2,
        alignItems: "center",
        flexWrap: "wrap",
        width: "100%",
        overflowX: "auto",
      }}
    >
      {columns
        .filter((col) => col.name !== "secret_id")
        .map((col) =>
          col.name === "isRead" ? (
            <Box key={col.name} sx={{ minWidth: 160, flex: 1 }}>
              <SelectField
                fullWidth
                label={col.label}
                value={filters[col.name] || ""}
                onChange={handleChangeFilter(col.name)}
                options={statusReadOptions}
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          ) : (
            <Box key={col.name} sx={{ minWidth: 160, flex: 1 }}>
              <InputText
                fullWidth
                label={col.label}
                value={filters[col.name] || ""}
                onChange={handleChangeFilter(col.name)}
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )
        )}
      <Box display="flex" gap={1} justifyContent="center" sx={{ minWidth: 120 }}>
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleSearchClick}
          sx={{
            bgcolor: "#1120A3",
            "&:hover": { bgcolor: "#0b1580" },
            flex: 1,
          }}
        >
          ค้นหา
        </Button>
        <Button
          variant="outlined"
          startIcon={<SearchOffIcon />}
          onClick={handleClearSearch}
          sx={{ flex: 1 }}
        >
          ล้าง
        </Button>
      </Box>
    </Box>
  );

  // ฟังก์ชันสำหรับ render cell ที่มี PM Office indicator
  const renderCaseCodeCell = (item) => {
    const pmOfficeStatus = pmOfficeStatusMap.get(item.case_id);

    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <Typography>{item.case_code}</Typography>
        {pmOfficeStatus?.hasPMOfficeSubmission && (
          <Tooltip title={`มีข้อมูลจากสำนักงานปลัดสำนักนายกรัฐมนตรี ${pmOfficeStatus.submissionCount} รายการ`}>
            <Badge badgeContent={pmOfficeStatus.submissionCount} color="primary" max={99}>
              <BusinessIcon
                sx={{
                  color: blue[600],
                  fontSize: 16,
                  animation: 'pulse 2s infinite'
                }}
              />
            </Badge>
          </Tooltip>
        )}
      </Box>
    );
  };

  const renderCustomerNameCell = (item) => {
    const pmOfficeStatus = pmOfficeStatusMap.get(item.case_id);

    if (!pmOfficeStatus?.hasPMOfficeSubmission) {
      return item.customer_name;
    }

    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <NotificationImportantIcon
          sx={{
            color: blue[600],
            fontSize: 16,
            animation: 'blink 1.5s infinite'
          }}
        />
        <Typography sx={{ fontWeight: 500 }}>
          {item.customer_name}
        </Typography>
      </Box>
    );
  };

  // Mobile card view
  const MobileCardView = () => (
    <Stack spacing={2} sx={{ p: 2 }}>
      {pagedData.map((item, idx) => {
        const pmOfficeStatus = pmOfficeStatusMap.get(item.case_id);
        return (
          <Card
            key={item.case_id}
            onClick={() => handleRowClick(item, router.query)}
            sx={{
              cursor: "pointer",
              "&:hover": { backgroundColor: "#f5f7ff" },
              border: "1px solid #e0e0e0",
              backgroundColor: pmOfficeStatus?.hasPMOfficeSubmission ? 'rgba(33, 150, 243, 0.05)' : 'transparent',
              borderLeft: pmOfficeStatus?.hasPMOfficeSubmission ? '4px solid #2196f3' : 'none'
            }}
          >
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="primary" fontWeight="bold">
                  #{page * rowsPerPage + idx + 1}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  {pmOfficeStatus?.hasPMOfficeSubmission && (
                    <Chip
                      icon={<BusinessIcon />}
                      label="สปน."
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  )}
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>

              {visibleColumns.map((col) => (
                <Box key={col.name} mb={1}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {col.label}
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {col.name === "case_code" ? renderCaseCodeCell(item) :
                      col.name === "customer_name" ? renderCustomerNameCell(item) :
                        renderCellValue(col, item)}
                  </Typography>
                </Box>
              ))}

              {!isMobile && columns.filter(col => col.priority > 2).length > 0 && (
                <Box mt={2} pt={1} borderTop="1px solid #e0e0e0">
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    ข้อมูลเพิ่มเติม
                  </Typography>
                  {columns.filter(col => col.priority > 2).map((col) => (
                    <Typography key={col.name} variant="caption" display="block">
                      {col.label}: {item[col.name] ?? "-"}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );

  const renderCellValue = (col, item) => {
    if (col.name === "case_code") {
      return renderCaseCodeCell(item);
    }

    if (col.name === "customer_name") {
      return renderCustomerNameCell(item);
    }

    if (col.name === "isRead") {
      if (item.isRead) {
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleIcon sx={{ color: green[600], fontSize: 22 }} />
            <Typography color={green[700]} fontWeight="bold">
              รับเรื่อง
            </Typography>
          </Box>
        );
      } else {
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <RadioButtonUncheckedIcon sx={{ color: grey[600], fontSize: 22 }} />
            <Typography color={grey[700]} fontWeight="bold">
              ยังไม่รับเรื่อง
            </Typography>
          </Box>
        );
      }
    }
    return item[col.name] ?? "-";
  };

  const pmOfficeCasesCount = Array.from(pmOfficeStatusMap.values()).filter(status => status.hasPMOfficeSubmission).length;

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
        mx: isMobile ? 1 : 0,
      }}
    >
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}</style>

      {/* PM Office Alert */}
      <Snackbar
        open={showPMOfficeAlert}
        autoHideDuration={10000}
        onClose={handleClosePMOfficeAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClosePMOfficeAlert}
          severity="info"
          sx={{ width: '100%' }}
        >
          <AlertTitle>
            <BusinessIcon sx={{ mr: 1 }} />
            แจ้งเตือน: มีเคสที่ได้รับข้อมูลจากสำนักงานปลัดสำนักนายกรัฐมนตรี
          </AlertTitle>
          {pmOfficeNotification && (
            <>
              มี <strong>{pmOfficeNotification.count} เคส</strong> ที่มีข้อมูลจากสำนักงานปลัดสำนักนายกรัฐมนตรี
              <br />
              กรุณาตรวจสอบเคสที่มีเครื่องหมาย 🏢 ในตาราง
            </>
          )}
        </Alert>
      </Snackbar>

      {/* Header Bar */}
      <Box
        className={styles.headerBar}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 1 : 0,
          p: isMobile ? 1 : 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant={isMobile ? "h6" : "h5"} component="div">
            {title}
          </Typography>
          {showPMOfficeIndicator && pmOfficeCasesCount > 0 && (
            <Badge badgeContent={pmOfficeCasesCount} color="primary">
              <Chip
                icon={<BusinessIcon />}
                label={`${pmOfficeCasesCount} เคสจาก สปน.`}
                color="primary"
                size="small"
                variant="outlined"
              />
            </Badge>
          )}
          {isCheckingPMOffice && (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                กำลังตรวจสอบข้อมูล สปน....
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Search Bar - Desktop */}
      {!isMobile && (
        <Box width="100%" px={2} py={1}>
          <Box
            display="flex"
            alignItems="center"
            width="100%"
            gap={2}
            sx={{ minWidth: 0 }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              sx={{
                flex: 1,
                minWidth: 0,
                overflowX: "auto",
              }}
            >
              {visibleColumns.map((col) => (
                <Box
                  key={col.name}
                  sx={{
                    minWidth: 160,
                    maxWidth: 220,
                    flex: "1 1 0",
                    flexShrink: 1,
                  }}
                >
                  {col.name === 'isRead' ? (
                    <SelectField
                      fullWidth
                      label={col.label}
                      value={filters[col.name] || ""}
                      onChange={handleChangeFilter(col.name)}
                      options={statusReadOptions}
                      size="small"
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={col.label}
                      value={filters[col.name] || ""}
                      onChange={handleChangeFilter(col.name)}
                      size="small"
                    />
                  )}
                </Box>
              ))}
            </Box>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                flexShrink: 0,
                minWidth: isTablet ? 180 : 260,
              }}
            >
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
                  width: 40,
                  height: 40,
                }}
              >
                <SearchIcon />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
                  width: 40,
                  height: 40,
                }}
              >
                <SearchOffIcon />
              </IconButton>
              <ButtonSent
                label={isTablet ? "ส่งเรื่อง" : "ส่งผลการพิจารณา"}
                size={isTablet ? "small" : "medium"}
                onClick={() => handleRowSend(selectedItem)}
                sx={{
                  maxWidth: 300,
                  minWidth: 90,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: isTablet ? '0.9rem' : '1rem',
                  px: 2
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Mobile Search Bar */}
      {isMobile && (
        <Box px={2} py={1}>
          <Box display="flex" gap={1} mb={2}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setFilterDrawerOpen(true)}
              fullWidth
              size="small"
            >
              ตัวกรอง
            </Button>
            <ButtonSent label="ส่งเรื่อง" size="small" />
          </Box>
          <Box display="flex" gap={1}>
            <ExportButton label="PDF" size="small" fullWidth />
            <ExportButton label="Excel" size="small" fullWidth />
          </Box>
        </Box>
      )}

      {/* Filter Drawer for Mobile */}
      <Drawer
        anchor="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "80vh",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            ตัวกรองการค้นหา
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FilterContent />
        </Box>
      </Drawer>

      {/* Table/Cards */}
      <Box
        className={styles.tableWrapper}
        id="table-results"
        sx={{ overflowX: "auto", px: isMobile ? 0 : 2, pb: 1 }}
      >
        {loading || isCheckingPMOffice ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>
              {isCheckingPMOffice ? "กำลังตรวจสอบข้อมูลจาก สปน...." : "กำลังโหลดข้อมูล..."}
            </Typography>
          </Box>
        ) : filteredData.length === 0 ? (
          <Typography align="center" sx={{ py: 4 }}>
            ไม่มีข้อมูลสำหรับการแสดงผล
          </Typography>
        ) : isMobile ? (
          <MobileCardView />
        ) : (
          <Table sx={{ minWidth: isTablet ? 800 : 1400 }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 80 }}>
                  ลำดับ
                </TableCell>
                {visibleColumns.map((col) => (
                  <TableCell
                    key={col.name}
                    sx={{
                      width: isTablet ? col.width * 0.8 : col.width,
                      fontSize: isTablet ? '0.875rem' : '1rem'
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedData.map((item, idx) => {
                const pmOfficeStatus = pmOfficeStatusMap.get(item.case_id);
                return (
                  <TableRow
                    key={item.case_id}
                    onClick={() => handleRowClick(item, router.query)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#f5f7ff" },
                      backgroundColor: pmOfficeStatus?.hasPMOfficeSubmission ? 'rgba(33, 150, 243, 0.05)' : 'transparent',
                      borderLeft: pmOfficeStatus?.hasPMOfficeSubmission ? '4px solid #2196f3' : 'none'
                    }}
                  >
                    <TableCell
                      align="center"
                      sx={{
                        width: 80,
                        fontWeight: 600,
                        color: "#1120A3",
                        fontSize: isTablet ? '0.875rem' : '1rem'
                      }}
                    >
                      {page * rowsPerPage + idx + 1}
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.name}
                        sx={{
                          width: isTablet ? col.width * 0.8 : col.width,
                          fontSize: isTablet ? '0.875rem' : '1rem'
                        }}
                      >
                        {renderCellValue(col, item)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25]}
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sx={{
            borderTop: "1px solid #eee",
            "& .MuiTablePagination-toolbar": {
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 1 : 0,
            },
            "& .MuiTablePagination-spacer": {
              display: isMobile ? "none" : "flex",
            },
          }}
          labelRowsPerPage={isMobile ? "แถว:" : "แถวต่อหน้า:"}
          labelDisplayedRows={({ from, to, count }) =>
            isMobile
              ? `${from}-${to} จาก ${count}`
              : `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
          }
        />
      </Box>
    </Container>
  );
};

export default TableListOPM;