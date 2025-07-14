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

import styles from "./TableListOPM.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import ButtonSent from "@services/ButtonSent/ButtonSent";

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

  const initialFilters = useMemo(
    () =>
      filterFields.reduce((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {}),
    [filterFields]
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

  const columns = [
    { name: "case_code", label: "รหัสเรื่อง", width: 100, priority: 3 },
    { name: "customer_name", label: "ชื่อ", width: 180, priority: 2 },
    { name: "type_text", label: "ประเภทเรืองร้องทุกข์", width: 120, priority: 4 },
    { name: "ShowDateTime", label: "วันที่และเวลา", width: 120, priority: 4 },
    { name: "status_text", label: "สถานะหลักของเรื่อง", width: 80, priority: 4 },
    { name: "main_status_text", label: "สถานะดำเนินการ", width: 160, priority: 3 },
  ];

  const getVisibleColumns = () => {
    if (isMobile) {
      return columns.filter((col) => col.priority <= 2);
    }
    if (isTablet) {
      return columns.filter((col) => col.priority <= 3);
    }
    return columns;
  };

  const visibleColumns = getVisibleColumns(columns);

  const FilterContent = () => (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      <Stack spacing={2}>
        {columns
          .filter((col) => col.name !== "secret_id")
          .map((col) => (
            <InputText
              key={col.name}
              fullWidth
              label={col.label}
              value={filters[col.name] || ""}
              onChange={handleChangeFilter(col.name)}
              size={isMobile ? "small" : "medium"}
            />
          ))}
        <Box display="flex" gap={1} justifyContent="center">
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
      </Stack>
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
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} sx={{ flexWrap: "wrap" }}>
            {/* Filters */}
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                flexGrow: 1,
                overflowX: "auto",
                maxWidth: isTablet ? "60%" : "70%",
                minWidth: 0,
              }}
            >
              {visibleColumns.map((col) => (
                <InputText
                  key={col.name}
                  fullWidth
                  label={col.label}
                  value={filters[col.name] || ""}
                  onChange={handleChangeFilter(col.name)}
                  size="small"
                />
              ))}
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
                label={isTablet ? "ส่งเรื่อง" : "ส่งผลการพิจราณาไปยัง สปน."}
                size={isTablet ? "small" : "medium"}
                onClick={() => handleRowSend(selectedItem)}
              />
            </Box>

            {/* Action Buttons */}
            {/* <Box
              display="flex"
              alignItems="center"
              gap={1}
              flexShrink={0}
              sx={{
                flexDirection: isTablet ? "column" : "row",
                alignItems: isTablet ? "flex-end" : "center",
                minWidth: isTablet ? "unset" : 250,
              }}
            >
              <ButtonSent
                label={isTablet ? "ส่งเรื่อง" : "ส่งผลการพิจราณาไปยัง สปน."}
                size={isTablet ? "small" : "medium"}
                onClick={() => handleRowSend(selectedItem)}
              /> */}
            {/* <ExportButton
                label={isTablet ? "PDF" : "Export PDF"}
                size={isTablet ? "small" : "medium"}
              />
              <ExportButton
                label={isTablet ? "Excel" : "Export Excel"}
                size={isTablet ? "small" : "medium"}
              /> 
            </Box> */}
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
                      {item[col.name] ?? "-"}
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
    </Container>
  );
};

export default TableListOPM;