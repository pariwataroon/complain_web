/**
 * TableListEOffice — ตารางรายการร้องทุกข์จาก Mof_EOffice
 *
 * ใช้ pattern เดียวกับ TableListOPM แต่ปรับ columns ให้ตรงกับข้อมูลจาก eofficer
 */
import React, { useState, useMemo } from "react";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Container,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import SendIcon from "@mui/icons-material/Send";
import ButtonSent from "@services/ButtonSent/ButtonSent";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import styles from "./TableListEOffice.module.scss";

// ── คอลัมน์ของตาราง ──
const columns = [
  { name: "case_code", label: "เลขที่รับเรื่อง", width: 140, priority: 2 },
  { name: "complainant_name", label: "ชื่อผู้ร้อง", width: 120, priority: 2 },
  { name: "type_name", label: "ประเภทเรื่อง", width: 160, priority: 3 },
  { name: "subject", label: "ชื่อเรื่อง", width: 200, priority: 4 },
  { name: "priority", label: "ความเร่งด่วน", width: 100, priority: 4 },
  { name: "date_received", label: "วันที่รับเรื่อง", width: 140, priority: 3 },
  { name: "status_name", label: "สถานะ", width: 140, priority: 2 },
];

const TableListEOffice = ({
  data = [],
  title = "",
  onRowClick = () => {},
  onRefresh = () => {},
  onSendClick = () => {},
  isRefreshing = false,
  isEmpty = false,
  noDataMessage = "ไม่มีข้อมูล",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── search / filter state ──
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  // ── กรองคอลัมน์ตามขนาดหน้าจอ ──
  const visibleColumns = useMemo(() => {
    if (isMobile) return columns.filter((col) => col.priority <= 2);
    if (isTablet) return columns.filter((col) => col.priority <= 3);
    return columns;
  }, [isMobile, isTablet]);

  // ── filter ข้อมูล client-side ──
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          (item.case_code || "").toLowerCase().includes(lower) ||
          (item.complainant_name || "").toLowerCase().includes(lower) ||
          (item.subject || "").toLowerCase().includes(lower) ||
          (item.type_name || "").toLowerCase().includes(lower)
      );
    }

    if (dateFrom) {
      result = result.filter((item) => {
        if (!item.date_received) return false;
        return item.date_received >= dateFrom.format("YYYY/MM/DD");
      });
    }

    if (dateTo) {
      result = result.filter((item) => {
        if (!item.date_received) return false;
        return item.date_received <= dateTo.format("YYYY/MM/DD") + " 23:59:59";
      });
    }

    return result;
  }, [data, searchText, dateFrom, dateTo]);

  // ── pagination ──
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // ── สีของ priority chip ──
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "เร่งด่วน":
        return "#f44336";
      case "ด่วน":
        return "#ff9800";
      default:
        return "#2196f3";
    }
  };

  // ── Reset filters ──
  const handleResetFilters = () => {
    setSearchText("");
    setDateFrom(null);
    setDateTo(null);
    setPage(0);
  };

  return (
    <Container maxWidth="xl" className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.headerBar}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span className={styles.headerTitle}>{title}</span>
          <Stack direction="row" spacing={1}>
            <Chip
              label={`ทั้งหมด ${filteredData.length} รายการ`}
              size="small"
              sx={{ color: "white", backgroundColor: "rgba(255,255,255,0.2)" }}
            />
          </Stack>
        </div>
      </div>

      {/* ── Search & Filter Section ── */}
      <Box className={styles.searchSection}>
        <div className={styles.filtersContainer}>
          <div className={styles.filtersGrid}>
            {/* ค้นหา */}
            <div className={styles.filterField}>
              <Typography variant="caption" sx={{ color: "#666", mb: 0.5, display: "block" }}>
                ค้นหา
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #ccc",
                  borderRadius: 2,
                  px: 1,
                  height: 40,
                }}
              >
                <SearchIcon sx={{ color: "#999", mr: 1, fontSize: 20 }} />
                <input
                  type="text"
                  placeholder="ค้นหาเลขที่รับเรื่อง, ชื่อผู้ร้อง, เรื่อง..."
                  value={searchText}
                  onChange={(e) => { setSearchText(e.target.value); setPage(0); }}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    fontSize: "14px",
                    fontFamily: "Sarabun, sans-serif",
                    background: "transparent",
                  }}
                />
              </Box>
            </div>

            {/* วันที่เริ่มต้น */}
            <div className={styles.filterField}>
              <Typography variant="caption" sx={{ color: "#666", mb: 0.5, display: "block" }}>
                วันที่เริ่มต้น
              </Typography>
              <DateThaiPickerService
                value={dateFrom}
                onChange={(val) => { setDateFrom(val); setPage(0); }}
                size="small"
              />
            </div>

            {/* วันที่สิ้นสุด */}
            <div className={styles.filterField}>
              <Typography variant="caption" sx={{ color: "#666", mb: 0.5, display: "block" }}>
                วันที่สิ้นสุด
              </Typography>
              <DateThaiPickerService
                value={dateTo}
                onChange={(val) => { setDateTo(val); setPage(0); }}
                size="small"
              />
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className={styles.actionButtons}>
          <div className={styles.buttonGroup}>
            <ButtonSent label="รีเฟรช" onClick={onRefresh} disabled={isRefreshing} />
            <ButtonSent label="ล้างค้นหา" onClick={handleResetFilters} disabled={isRefreshing} />
          </div>
          <div className={styles.buttonGroup}>
            <ButtonSent
              label="ส่งผลพิจารณา"
              onClick={onSendClick}
              icon={<SendIcon sx={{ fontSize: 18, mr: 0.5 }} />}
            />
          </div>
        </div>
      </Box>

      {/* ── Table ── */}
      <Box className={styles.tableWrapper}>
        {isEmpty ? (
          <div className={styles.emptyState}>
            {isRefreshing ? (
              <>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2">{noDataMessage}</Typography>
              </>
            ) : (
              <>
                <SearchOffIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
                <Typography variant="body1" sx={{ color: "#999" }}>
                  {noDataMessage}
                </Typography>
                {searchText && (
                  <Typography variant="body2" sx={{ color: "#bbb", mt: 1 }}>
                    ไม่พบข้อมูลที่ตรงกับ &quot;{searchText}&quot;
                  </Typography>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop/Tablet Table */}
            {!isMobile && (
              <div className={styles.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 50, textAlign: "center" }}>ลำดับ</TableCell>
                      {visibleColumns.map((col) => (
                        <TableCell key={col.name} sx={{ minWidth: col.width }}>
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={visibleColumns.length + 1} align="center" sx={{ py: 6 }}>
                          <Typography color="textSecondary">ไม่พบข้อมูล</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item, index) => (
                        <TableRow
                          key={item.case_id || index}
                          hover
                          onClick={() => onRowClick(item)}
                          sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f5f7ff" } }}
                        >
                          <TableCell align="center" sx={{ width: 50 }}>
                            {page * rowsPerPage + index + 1}
                          </TableCell>
                          {visibleColumns.map((col) => (
                            <TableCell key={col.name}>
                              {col.name === "status_name" ? (
                                <Chip
                                  label={item[col.name] || "-"}
                                  size="small"
                                  sx={{
                                    backgroundColor: item.status_color || "#9e9e9e",
                                    color: "white",
                                    fontWeight: 500,
                                    fontSize: "12px",
                                  }}
                                />
                              ) : col.name === "priority" ? (
                                <span
                                  className={styles.priorityChip}
                                  style={{
                                    backgroundColor: getPriorityColor(item[col.name]) + "20",
                                    color: getPriorityColor(item[col.name]),
                                  }}
                                >
                                  {item[col.name] || "-"}
                                </span>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    maxWidth: col.width,
                                  }}
                                >
                                  {item[col.name] || "-"}
                                </Typography>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Mobile Card View */}
            {isMobile && (
              <div className={styles.mobileView}>
                {paginatedData.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography color="textSecondary">ไม่พบข้อมูล</Typography>
                  </Box>
                ) : (
                  paginatedData.map((item, index) => (
                    <Card
                      key={item.case_id || index}
                      className={styles.mobileCard}
                      sx={{ mb: 2, cursor: "pointer" }}
                      onClick={() => onRowClick(item)}
                    >
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Chip
                            label={item.status_name || "-"}
                            size="small"
                            sx={{
                              backgroundColor: item.status_color || "#9e9e9e",
                              color: "white",
                              fontWeight: 500,
                            }}
                          />
                          <span
                            className={styles.priorityChip}
                            style={{
                              backgroundColor: getPriorityColor(item.priority) + "20",
                              color: getPriorityColor(item.priority),
                            }}
                          >
                            {item.priority || "ปกติ"}
                          </span>
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {item.case_code || "-"}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                          {item.subject || "-"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#666" }}>
                          ผู้ร้อง: {item.complainant_name || "-"} | {item.type_name || "-"}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" sx={{ color: "#999" }}>
                          วันที่รับเรื่อง: {item.date_received || "-"}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Pagination */}
            {filteredData.length > 0 && (
              <TablePagination
                component="div"
                count={filteredData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="แถวต่อหน้า:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
                sx={{
                  ".MuiTablePagination-toolbar": { px: 2 },
                  ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                    fontFamily: "Sarabun, sans-serif",
                    fontSize: "14px",
                  },
                }}
              />
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default TableListEOffice;
