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
  Button,
  useMediaQuery,
  useTheme,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import styles from "./TableLogs.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";

const TableLogs = ({
  data = [],
  total = 0,
  title = "",
  navigateTo = "",
  onSearch = () => { },
  onPaginationChange = () => { },
  handleNavigateTo,
  loading = false,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery("(max-width:1200px)");
  const isExtraSmallScreen = useMediaQuery("(max-width:600px)");

  /* ฟิลเตอร์ที่ผู้ใช้กรอก */
  const [filters, setFilters] = useState({
    method: "",
    path: "",
    clientIp: "",
    statusCode: "",
    userId: "",
  });

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  /* pagination */
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // เมื่อ pagination เปลี่ยน ให้ส่งข้อมูลไปยัง parent component
  useEffect(() => {
    const skip = page * rowsPerPage;
    onPaginationChange({
      skip,
      limit: rowsPerPage,
      page,
    });
  }, [page, rowsPerPage, onPaginationChange]);

  const handlePageChange = (_, newPage) => setPage(newPage);

  const handleRowsPerPageChange = (e) => {
    const newRowsPerPage = parseInt(e.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page
  };

  const handleSearchClick = () => {
    console.log("Searching with filters:", filters);
    setPage(0); // Reset to first page when searching
    onSearch(filters);
  };

  const handleClearSearch = () => {
    const cleared = {
      method: "",
      path: "",
      clientIp: "",
      statusCode: "",
      userId: "",
    };
    setFilters(cleared);
    setPage(0);
    onSearch(cleared);
  };

  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  // Handle Enter key press for search
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  // Format date
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Get status color
  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return "success";
    if (statusCode >= 400 && statusCode < 500) return "warning";
    if (statusCode >= 500) return "error";
    return "default";
  };

  // Method options for filter
  const methodOptions = [
    { value: "", label: "ทั้งหมด" },
    { value: "GET", label: "GET" },
    { value: "POST", label: "POST" },
    { value: "PUT", label: "PUT" },
    { value: "DELETE", label: "DELETE" },
    { value: "PATCH", label: "PATCH" },
  ];

  // Status code options for filter
  const statusOptions = [
    { value: "", label: "ทั้งหมด" },
    { value: "200", label: "200 - Success" },
    { value: "400", label: "400 - Bad Request" },
    { value: "401", label: "401 - Unauthorized" },
    { value: "403", label: "403 - Forbidden" },
    { value: "404", label: "404 - Not Found" },
    { value: "500", label: "500 - Server Error" },
  ];

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
      }}
    >
      <Box className={styles.headerBar}>{title}</Box>

      {/* Search Bar - Responsive Layout */}
      <Box sx={{ px: 2, py: 2 }}>
        {isSmallScreen ? (
          // Mobile/Tablet Layout (< 1200px)
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Search Fields Grid */}
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
              }}
              gap={2}
            >
              <SelectField
                label="Method"
                inputLabel="เลือก HTTP Method"
                options={methodOptions}
                value={filters.method}
                onChange={handleChange("method")}
              />
              <InputText
                label="API Path"
                inputLabel="กรอก API Path"
                value={filters.path}
                onChange={handleChange("path")}
                onKeyPress={handleKeyPress}
              />
              {/* <InputText
                label="Client IP"
                inputLabel="กรอก IP Address"
                value={filters.clientIp}
                onChange={handleChange("clientIp")}
                onKeyPress={handleKeyPress}
              /> */}
              <SelectField
                label="Status Code"
                inputLabel="เลือก Status Code"
                options={statusOptions}
                value={filters.statusCode}
                onChange={handleChange("statusCode")}
              />
              {/* <InputText
                label="User ID"
                inputLabel="กรอก User ID"
                value={filters.userId}
                onChange={handleChange("userId")}
                onKeyPress={handleKeyPress}
              /> */}
            </Box>

            {/* Action Buttons - Responsive Layout */}
            {isExtraSmallScreen ? (
              // Extra Small (xs) - แยกบรรทัดและเรียงแนวตั้ง
              <Box display="flex" flexDirection="column" gap={2}>
                {/* Search & Clear Buttons */}
                <Box display="flex" justifyContent="center" gap={1}>
                  <IconButton
                    onClick={handleSearchClick}
                    disabled={loading}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": { bgcolor: "#0b1580" },
                      "&:disabled": { bgcolor: "#ccc" },
                      height: 40,
                      width: 40,
                    }}
                    title="ค้นหา"
                  >
                    <SearchIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleClearSearch}
                    disabled={loading}
                    sx={{
                      bgcolor: "#dc3545",
                      color: "#fff",
                      "&:hover": { bgcolor: "#c82333" },
                      "&:disabled": { bgcolor: "#ccc" },
                      height: 40,
                      width: 40,
                    }}
                    title="ล้างการค้นหา"
                  >
                    <CleaningServicesIcon />
                  </IconButton>
                </Box>

                {/* Export Buttons - แยกบรรทัด */}
                <Box display="flex" flexDirection="column" gap={1}>
                  <ExportButton label="Export PDF" />
                  <ExportButton label="Export Excel" />
                </Box>
              </Box>
            ) : (
              // Small and up (sm+) - จัดเป็น 2 แถว
              <Box display="flex" flexDirection="column" gap={2}>
                {/* แถวที่ 1: Search, Clear */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Box display="flex" gap={1}>
                    <IconButton
                      onClick={handleSearchClick}
                      disabled={loading}
                      sx={{
                        bgcolor: "#1120A3",
                        color: "#fff",
                        "&:hover": { bgcolor: "#0b1580" },
                        "&:disabled": { bgcolor: "#ccc" },
                        height: 40,
                        width: 40,
                      }}
                      title="ค้นหา"
                    >
                      <SearchIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleClearSearch}
                      disabled={loading}
                      sx={{
                        bgcolor: "#dc3545",
                        color: "#fff",
                        "&:hover": { bgcolor: "#c82333" },
                        "&:disabled": { bgcolor: "#ccc" },
                        height: 40,
                        width: 40,
                      }}
                      title="ล้างการค้นหา"
                    >
                      <CleaningServicesIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* แถวที่ 2: Export Buttons */}
                <Box display="flex" justifyContent="center" gap={1}>
                  <ExportButton label="Export PDF" />
                  <ExportButton label="Export Excel" />
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          // Desktop Layout (>= 1200px)
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
            sx={{
              flexWrap: "nowrap",
              whiteSpace: "nowrap",
              overflowX: "auto",
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{ flexWrap: "nowrap" }}
            >
              <SelectField
                label="Method"
                inputLabel="เลือก HTTP Method"
                options={methodOptions}
                value={filters.method}
                onChange={handleChange("method")}
              />
              <InputText
                label="API Path"
                inputLabel="กรอก API Path"
                value={filters.path}
                onChange={handleChange("path")}
                onKeyPress={handleKeyPress}
              />
              {/* <InputText
                label="Client IP"
                inputLabel="กรอก IP Address"
                value={filters.clientIp}
                onChange={handleChange("clientIp")}
                onKeyPress={handleKeyPress}
              /> */}
              <SelectField
                label="Status Code"
                inputLabel="เลือก Status Code"
                options={statusOptions}
                value={filters.statusCode}
                onChange={handleChange("statusCode")}
              />
              {/* <InputText
                label="User ID"
                inputLabel="กรอก User ID"
                value={filters.userId}
                onChange={handleChange("userId")}
                onKeyPress={handleKeyPress}
              /> */}

              <IconButton
                onClick={handleSearchClick}
                disabled={loading}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
                  "&:disabled": { bgcolor: "#ccc" },
                  flexShrink: 0,
                  height: 40,
                  width: 40,
                }}
                title="ค้นหา"
              >
                <SearchIcon />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                disabled={loading}
                sx={{
                  bgcolor: "#dc3545",
                  color: "#fff",
                  "&:hover": { bgcolor: "#c82333" },
                  "&:disabled": { bgcolor: "#ccc" },
                  flexShrink: 0,
                  height: 40,
                  width: 40,
                }}
                title="ล้างการค้นหา"
              >
                <CleaningServicesIcon />
              </IconButton>
            </Box>

            {/* Export buttons */}
            <Box
              display="flex"
              flexDirection={isExtraSmallScreen ? "column" : "row"}
              gap={1}
              sx={{ flexShrink: 0 }}
            >
              <ExportButton label="Export PDF" />
              <ExportButton label="Export Excel" />
            </Box>
          </Box>
        )}
      </Box>

      {/* Results Summary */}
      <Box sx={{ px: 2, py: 1 }}>
        <Box sx={{ color: "#666", fontSize: "0.9rem" }}>
          พบข้อมูล {total} รายการ
          {loading && " (กำลังโหลด...)"}
        </Box>
      </Box>

      {/* Table - Conditional Scrolling based on screen size */}
      <Box
        className={styles.tableWrapper}
        id="table-results"
        sx={{
          overflowX: isSmallScreen ? "auto" : "visible",
          px: 2,
          pb: 1,
        }}
      >
        <Table
          sx={{
            minWidth: isSmallScreen ? 1800 : "100%",
            width: isSmallScreen ? 1800 : "100%",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 80, fontWeight: "bold" }}>
                ลำดับ
              </TableCell>
              <TableCell sx={{ width: 120, fontWeight: "bold" }}>
                Method
              </TableCell>
              <TableCell sx={{ width: 300, fontWeight: "bold" }}>
                API Path
              </TableCell>
              <TableCell sx={{ width: 150, fontWeight: "bold" }}>
                Client IP
              </TableCell>
              <TableCell sx={{ width: 120, fontWeight: "bold" }}>
                Status Code
              </TableCell>
              <TableCell sx={{ width: 120, fontWeight: "bold" }}>
                Process Time (ms)
              </TableCell>
              <TableCell sx={{ width: 250, fontWeight: "bold" }}>
                User ID
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                Created At
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 3, color: "#999" }}
                >
                  กำลังโหลดข้อมูล...
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              data.map((item, idx) => (
                <TableRow
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f7ff" },
                    "&:nth-of-type(even)": { backgroundColor: "#fafafa" },
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600, color: "#1120A3" }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item?.method ?? "-"}
                      size="small"
                      variant="outlined"
                      color={
                        item?.method === "GET"
                          ? "primary"
                          : item?.method === "POST"
                            ? "success"
                            : item?.method === "PUT"
                              ? "warning"
                              : item?.method === "DELETE"
                                ? "error"
                                : "default"
                      }
                    />
                  </TableCell>
                  <TableCell className={styles.ellipsisCell}>
                    {item?.path ?? "-"}
                  </TableCell>
                  <TableCell>{item?.client_ip ?? "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={item?.status_code ?? "-"}
                      size="small"
                      color={getStatusColor(item?.status_code)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {item?.process_time_ms ? item.process_time_ms.toFixed(2) : "-"}
                  </TableCell>
                  <TableCell className={styles.ellipsisCell}>
                    {item?.user_id ?? "-"}
                  </TableCell>
                  <TableCell>{formatDateTime(item?.created_at)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{ py: 3, color: "#999" }}
                >
                  ไม่พบข้อมูลที่ค้นหา
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="แถวต่อหน้า:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
          }
          sx={{ borderTop: "1px solid #eee" }}
          disabled={loading}
        />
      </Box>
    </Container>
  );
};

export default TableLogs;