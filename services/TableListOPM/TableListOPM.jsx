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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import FilterListIcon from "@mui/icons-material/FilterList";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { green, grey } from "@mui/material/colors";
import dayjs from "dayjs";
import "dayjs/locale/th";

import styles from "./TableListOPM.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import ButtonSent from "@services/ButtonSent/ButtonSent";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { formatThaiShortDateTime } from "@utils/Formats";

dayjs.locale("th");

const statusReadOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "read", label: "รับเรื่อง" },
  { value: "unread", label: "ยังไม่รับเรื่อง" },
];

// เพิ่ม options สำหรับ timeline type
const timelineTypeOptions = [
  { value: "A", label: "ทั้งหมด" },
  { value: "I", label: "งานใหม่" },
  { value: "P", label: "งานกำลังดำเนินการ" },
];

const columns = [
  { name: "case_code", label: "รหัสเรื่อง", width: 100, priority: 3 },
  { name: "customer_name", label: "ชื่อผู้เดือดร้อน", width: 80, priority: 2 },
  { name: "type_text", label: "ประเภทเรืองร้องทุกข์", width: 100, priority: 4 },
  { name: "ShowDateTime", label: "วันที่และเวลา", width: 120, priority: 4 },
  {
    name: "main_status_text",
    label: "สถานะหลักของ สปน.",
    width: 160,
    priority: 2,
  },
  { name: "status_text", label: "สถานะย่อยของ สปน.", width: 80, priority: 4 },
  { name: "isRead", label: "สถานะการคลัง", width: 80, priority: 2 },
];

const getVisibleColumns = (columns) => {
  if (typeof window !== "undefined") {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
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
  onTimelineTypeChange = () => { }, // เพิ่ม prop สำหรับ timeline type change
  currentTimelineType = "I", // เพิ่ม prop สำหรับ current timeline type
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const visibleColumns = getVisibleColumns(columns);
  const extendedFilterFields = [
    ...filterFields,
    {
      name: "isRead",
      label: "สถานะอ่านแล้ว",
      type: "select",
      options: statusReadOptions,
    },
  ];

  const initialFilters = useMemo(
    () => {
      const baseFilters = extendedFilterFields.reduce((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {});
      return {
        ...baseFilters,
        startDate: null,
        endDate: null,
      };
    },
    [extendedFilterFields]
  );

  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortedData, setSortedData] = useState([]); // เก็บข้อมูลที่จัดเรียงแล้ว
  const [loading, setLoading] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // จัดเรียงข้อมูลเมื่อ data เปลี่ยน
  useEffect(() => {
    const timer = setTimeout(() => {
      const sorted = (data || []).sort((a, b) => {
        const priorityA = calculateStatusPriority(a.status_text);
        const priorityB = calculateStatusPriority(b.status_text);

        if (priorityB !== priorityA) {
          return priorityB - priorityA;
        }

        // ถ้า priority เท่ากัน เรียงตามวันที่
        const dateA = new Date(a.ShowDateTime);
        const dateB = new Date(b.ShowDateTime);
        return dateB - dateA;
      });

      setSortedData(sorted);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [data]);

  const calculateStatusPriority = (statusText) => {
    switch (statusText) {
      case "อยู่ระหว่างดำเนินการ":
        return 10;
      case "รับเรื่อง":
      case "รับทราบไว้ชั้นต้น":
        return 8;
      case "รอผลการพิจารณาของหน่วยงานอื่น":
        return 6;
      case "เสร็จสิ้น":
        return 4;
      case "ยุติเรื่อง":
      case "ไม่อยู่ในอำนาจหน้าที่":
        return 2;
      default:
        return 1;
    }
  };

  // กรองข้อมูลโดยใช้ useMemo
  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      // Filter by regular fields
      const matchesRegularFilters = Object.keys(filters).every((key) => {
        if (key === "startDate" || key === "endDate") return true; // Skip date filters here
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

      if (!matchesRegularFilters) return false;

      // Filter by date range (using ShowDateTime)
      if (filters.startDate || filters.endDate) {
        if (!item.ShowDateTime) return false;

        const itemDate = dayjs(item.ShowDateTime);
        if (!itemDate.isValid()) return false;

        if (filters.startDate) {
          const start = dayjs(filters.startDate).startOf('day');
          if (itemDate.isBefore(start)) return false;
        }

        if (filters.endDate) {
          const end = dayjs(filters.endDate).endOf('day');
          if (itemDate.isAfter(end)) return false;
        }
      }

      return true;
    });
  }, [sortedData, filters]);

  // คำนวณข้อมูลสำหรับหน้าปัจจุบัน
  const pagedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const result = filteredData.slice(startIndex, endIndex);

    // Debug log
    console.log('Pagination Debug:', {
      totalData: filteredData.length,
      page,
      rowsPerPage,
      startIndex,
      endIndex,
      resultLength: result.length
    });

    return result;
  }, [filteredData, page, rowsPerPage]);

  const handleChangeFilter = (field) => (event) => {
    const value = event?.target?.value || "";
    setFilters((prevFilters) => ({ ...prevFilters, [field]: value }));
    setPage(0); // รีเซ็ต page เมื่อ filter เปลี่ยน
  };

  // ฟังก์ชันสำหรับเปลี่ยนวันที่และค้นหาทันที
  const handleDateChange = (field) => (date) => {
    setFilters((prevFilters) => ({ ...prevFilters, [field]: date }));
    setPage(0);
  };

  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลง timeline type
  const handleTimelineTypeChange = (event) => {
    const value = event?.target?.value || "I";
    onTimelineTypeChange(value);
  };

  const handlePageChange = (_, newPage) => {
    console.log('Page change:', { currentPage: page, newPage, totalPages: Math.ceil(filteredData.length / rowsPerPage) });
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10) || 10;
    console.log('Rows per page change:', { oldRowsPerPage: rowsPerPage, newRowsPerPage });
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    onRowsPerPageChange(newRowsPerPage);
  };

  const handleSearchClick = () => {
    // ไม่ต้องทำอะไรเพิ่มเติม เพราะ filter จะทำงานอัตโนมัติผ่าน useMemo
    setPage(0); // รีเซ็ต page เมื่อค้นหา
    if (isMobile) setFilterDrawerOpen(false);
  };

  const handleClearSearch = () => {
    setFilters(initialFilters);
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
      {/* เพิ่ม Timeline Type Filter */}
      <Box sx={{ minWidth: 160, flex: 1 }}>
        <SelectField
          fullWidth
          label="ประเภทงาน"
          value={currentTimelineType}
          onChange={handleTimelineTypeChange}
          options={timelineTypeOptions}
          size={isMobile ? "small" : "medium"}
        />
      </Box>

      {columns
        .filter(
          (col) =>
            col.name !== "secret_id" &&
            col.name !== "main_status_text" && // ไม่แสดง filter สำหรับสถานะหลักของ สปน.
            col.name !== "status_text" // ไม่แสดง filter สำหรับสถานะย่อยของ สปน.
        )
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
      <Box
        display="flex"
        gap={1}
        justifyContent="center"
        sx={{ minWidth: 120 }}
      >
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

  // Mobile card view
  const MobileCardView = () => (
    <Stack spacing={2} sx={{ p: 2 }}>
      {pagedData.map((item, idx) => (
        <Card
          key={item.case_id}
          onClick={() => handleRowClick(item, router.query)}
          sx={{
            cursor: "pointer",
            "&:hover": { backgroundColor: "#f5f7ff" },
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="body2" color="primary" fontWeight="bold">
                #{page * rowsPerPage + idx + 1}
              </Typography>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>

            {visibleColumns.map((col) => (
              <Box key={col.name} mb={1}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {col.label}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {col.name === "ShowDateTime"
                    ? formatThaiShortDateTime(item.ShowDateTime) || "-"
                    : renderCellValue(col, item)}
                </Typography>
              </Box>
            ))}

            {!isMobile &&
              columns.filter((col) => col.priority > 2).length > 0 && (
                <Box mt={2} pt={1} borderTop="1px solid #e0e0e0">
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                  >
                    ข้อมูลเพิ่มเติม
                  </Typography>
                  {columns
                    .filter((col) => col.priority > 2)
                    .map((col) => (
                      <Typography
                        key={col.name}
                        variant="caption"
                        display="block"
                      >
                        {col.label}:{" "}
                        {col.name === "ShowDateTime"
                          ? formatThaiShortDateTime(item[col.name]) || "-"
                          : item[col.name] ?? "-"}
                      </Typography>
                    ))}
                </Box>
              )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  const renderCellValue = (col, item) => {
    if (col.name === "ShowDateTime") {
      return formatThaiShortDateTime(item.ShowDateTime) || "-";
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
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant={isMobile ? "h6" : "h5"} component="div">
            {title}
          </Typography>
          {/* แสดงจำนวนข้อมูลที่กรองแล้ว */}
          {filteredData.length !== sortedData.length && (
            <Chip
              label={`${filteredData.length}/${sortedData.length} รายการ`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {!isMobile && (
        <Box width="100%" py={1} marginLeft={2}>
          <Box
            display="flex"
            alignItems="center"
            width="max-content"
            gap={2}
            sx={{
              minWidth: "100%",
              maxWidth: "none",
            }}
          >
            {/* filters */}
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  minWidth: 140,
                  maxWidth: 180,
                  flex: "1 1 0",
                  flexShrink: 1,
                }}
              >
                <SelectField
                  fullWidth
                  label="ประเภทงาน"
                  value={currentTimelineType}
                  onChange={handleTimelineTypeChange}
                  options={timelineTypeOptions}
                  size="small"
                />
              </Box>

              {visibleColumns
                .filter(
                  (col) =>
                    col.name !== "main_status_text" &&
                    col.name !== "status_text"
                )
                .map((col) => (
                  <Box
                    key={col.name}
                    sx={{
                      minWidth: 140,
                      maxWidth: 180,
                      flex: "1 1 0",
                      flexShrink: 1,
                    }}
                  >
                    {col.name === "isRead" ? (
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

              {/* Date Range Filters */}
              <Box
                sx={{
                  minWidth: 140,
                  maxWidth: 180,
                  flex: "1 1 0",
                  flexShrink: 1,
                }}
              >
                <DateThaiPickerService
                  fullWidth
                  label="ตั้งแต่วันที่"
                  value={filters.startDate}
                  onChange={handleDateChange("startDate")}
                  size="small"
                  placeholder="กรุณาเลือกวันที่....."
                />
              </Box>
              <Box
                sx={{
                  minWidth: 140,
                  maxWidth: 180,
                  flex: "1 1 0",
                  flexShrink: 1,
                }}
              >
                <DateThaiPickerService
                  fullWidth
                  label="ถึงวันที่"
                  value={filters.endDate}
                  onChange={handleDateChange("endDate")}
                  size="small"
                  placeholder="กรุณาเลือกวันที่....."
                />
              </Box>
            </Box>
            {/* ปุ่ม */}
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                flexShrink: 0,
                minWidth: 0,
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
                  flexShrink: 0,
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
                  flexShrink: 0,
                }}
              >
                <SearchOffIcon />
              </IconButton>
              <ButtonSent
                label={isTablet ? "ส่งเรื่อง" : "ส่งผลการพิจารณา"}
                size={isTablet ? "small" : "medium"}
                onClick={() => handleRowSend(selectedItem)}
                sx={{
                  maxWidth: 150,
                  minWidth: 80,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: isTablet ? "0.9rem" : "1rem",
                  px: 2,
                  flexShrink: 0,
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
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>กำลังโหลดข้อมูล...</Typography>
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
                      fontSize: isTablet ? "0.875rem" : "1rem",
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedData.map((item, idx) => (
                <TableRow
                  key={item.case_id}
                  onClick={() => handleRowClick(item, router.query)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f7ff" },
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{
                      width: 80,
                      fontWeight: 600,
                      color: "#1120A3",
                      fontSize: isTablet ? "0.875rem" : "1rem",
                    }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.name}
                      sx={{
                        width: isTablet ? col.width * 0.8 : col.width,
                        fontSize: isTablet ? "0.875rem" : "1rem",
                      }}
                    >
                      {renderCellValue(col, item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25, 50]}
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