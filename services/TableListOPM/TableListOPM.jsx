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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import FilterListIcon from "@mui/icons-material/FilterList";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { green, grey } from "@mui/material/colors";

import styles from "./TableListOPM.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import ButtonSent from "@services/ButtonSent/ButtonSent";

const statusReadOptions = [
  { value: '', label: "ทั้งหมด" },
  { value: 'read', label: "อ่านแล้ว" },
  { value: 'unread', label: "ยังไม่ได้อ่าน" },
];

const columns = [
  { name: "case_code", label: "รหัสเรื่อง", width: 100, priority: 3 },
  { name: "customer_name", label: "ชื่อผู้เดือดร้อน", width: 180, priority: 2 },
  { name: "type_text", label: "ประเภทเรืองร้องทุกข์", width: 120, priority: 4 },
  { name: "ShowDateTime", label: "วันที่และเวลา", width: 120, priority: 4 },
  { name: "status_text", label: "สถานะหลักของเรื่อง", width: 80, priority: 4 },
  { name: "main_status_text", label: "สถานะดำเนินการของสปน", width: 160, priority: 2 },
  { name: "isRead", label: "สถานะ", width: 80, priority: 2 },
];

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilteredData(data || []);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [data]);

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
    const newFilteredData = data.filter((item) => {
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="primary" fontWeight="bold">
                #{page * rowsPerPage + idx + 1}
              </Typography>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>

            {visibleColumns.map((col) => (
              <Box key={col.name} mb={1}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {col.label}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {item[col.name] ?? "-"}
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
      ))}
    </Stack>
  );

  const renderCellValue = (col, item) => {
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
        <Typography variant={isMobile ? "h6" : "h5"} component="div">
          {title}
        </Typography>
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
            {/* FILTER INPUT: ขยายได้, scroll ได้ถ้าแน่น */}
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
            {/* ACTION BUTTONS: ชิดขวา, กว้างคงที่, ไม่ขยาย */}
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
      {
        isMobile && (
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
        )
      }

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
              ))}
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
    </Container >
  );
};

export default TableListOPM;