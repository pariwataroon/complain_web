/**
 * TableListEOffice — ตารางรับเรื่องราวร้องทุกข์จากระบบสารบรรณอิเล็กทรอนิกส์
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import SendIcon from "@mui/icons-material/Send";
import ButtonSent from "@services/ButtonSent/ButtonSent";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { formatThaiOfficialDate } from "@utils/Formats";
import styles from "./TableListEOffice.module.scss";

// ── คอลัมน์ของตาราง ──
const columns = [
  { name: "book_no", label: "เลขที่หนังสือ", width: 120, priority: 2 },
  { name: "book_date", label: "วันที่หนังสือ", width: 140, priority: 2 },
  { name: "complainant_name", label: "ชื่อผู้ร้อง", width: 160, priority: 2 },
  { name: "type_name", label: "ประเภทเรื่อง", width: 130, priority: 3 },
  { name: "subject", label: "ชื่อเรื่อง", width: undefined, priority: 4 },
  { name: "priority", label: "ความเร่งด่วน", width: 100, priority: 4 },
  { name: "date_received", label: "วันที่รับเรื่อง", width: 130, priority: 3 },
  { name: "status_name", label: "สถานะ", width: 120, priority: 2 },
];

const TableListEOffice = ({
  data = [],
  totalCount = 0,
  loadedCount = 0,
  isLoadingMore = false,
  onFetchMore = () => {},
  hasMore = false,
  title = "",
  statusType = "P",
  statusTypeOptions = [],
  onStatusTypeChange = () => {},
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

  // ── helper: แปลงวันที่จาก API (พ.ศ. string) → JS Date ──
  // รับ: "2569/01/15 09:30:00" หรือ "2569-01-15" หรือ Date object
  const parseApiDate = (dateStr) => {
    if (!dateStr || dateStr === "-") return null;
    if (dateStr instanceof Date) return isNaN(dateStr) ? null : dateStr;

    const s = String(dateStr);
    // พ.ศ. format: 2569/01/15 หรือ 2569-01-15
    const match = s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (!match) {
      // fallback: ลอง parse ตรงๆ
      const d = new Date(s);
      return isNaN(d) ? null : d;
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const adjusted = year > 2400 ? year - 543 : year; // พ.ศ. → ค.ศ.
    return new Date(adjusted, month, day);
  };

  // ── filter ข้อมูล client-side ──
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          (item.case_code || "").toLowerCase().includes(lower) ||
          (item.book_no || "").toLowerCase().includes(lower) ||
          (item.complainant_name || "").toLowerCase().includes(lower) ||
          (item.subject || "").toLowerCase().includes(lower) ||
          (item.type_name || "").toLowerCase().includes(lower)
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      const fromTime = isNaN(fromDate) ? null : fromDate.getTime();
      if (fromTime !== null) {
        result = result.filter((item) => {
          const d = parseApiDate(item.date_received);
          return d && !isNaN(d) && d.getTime() >= fromTime;
        });
      }
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      const toTime = isNaN(toDate) ? null : toDate.getTime();
      if (toTime !== null) {
        result = result.filter((item) => {
          const d = parseApiDate(item.date_received);
          return d && !isNaN(d) && d.getTime() <= toTime;
        });
      }
    }

    return result;
  }, [data, searchText, dateFrom, dateTo]);

  // ── pagination ──
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
    const neededEnd = (newPage + 1) * rowsPerPage;
    if (neededEnd > loadedCount && loadedCount < totalCount) {
      onFetchMore();
    }
  };
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
              label={`ทั้งหมด ${totalCount} รายการ`}
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
            {/* สถานะ filter */}
            {statusTypeOptions.length > 0 && (
              <div className={styles.filterField}>
                <Typography variant="caption" sx={{ color: "#666", mb: 0.5, display: "block" }}>
                  สถานะ
                </Typography>
                <FormControl size="small" fullWidth>
                  <Select
                    value={statusType}
                    onChange={(e) => { onStatusTypeChange(e.target.value); setPage(0); }}
                    sx={{ height: 40, fontSize: "14px", fontFamily: "Sarabun, sans-serif" }}
                  >
                    {statusTypeOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            )}

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
                <Table sx={{ tableLayout: "fixed", width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 50, textAlign: "center" }}>ลำดับ</TableCell>
                      {visibleColumns.map((col) => (
                        <TableCell
                          key={col.name}
                          sx={{
                            ...(col.width ? { width: col.width } : {}),
                            ...(col.name === "subject" ? { width: "auto" } : {}),
                          }}
                        >
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
                            <TableCell
                              key={col.name}
                              sx={{
                                ...(col.name === "subject" || col.name === "complainant_name"
                                  ? { whiteSpace: "normal", wordBreak: "break-word" }
                                  : {}),
                              }}
                            >
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
                              ) : col.name === "book_date" || col.name === "date_received" ? (
                                <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                                  {formatThaiOfficialDate(item[col.name]) || "-"}
                                </Typography>
                              ) : col.name === "subject" ? (
                                <Box
                                  component="div"
                                  sx={{
                                    whiteSpace: "normal",
                                    fontSize: "14px",
                                    fontFamily: "Sarabun, sans-serif",
                                    lineHeight: 1.4,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {item[col.name] || "-"}
                                </Box>
                              ) : col.name === "complainant_name" ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {item[col.name] || "-"}
                                </Typography>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
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
                          วันที่รับเรื่อง: {formatThaiOfficialDate(item.date_received) || "-"}
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
                count={totalCount || filteredData.length}
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

            {/* ปุ่มโหลดเพิ่ม */}
            {hasMore && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <ButtonSent
                  label={isLoadingMore ? "กำลังโหลด..." : `โหลดเพิ่ม (${loadedCount} รายการ)`}
                  onClick={onFetchMore}
                  disabled={isLoadingMore}
                  icon={isLoadingMore ? <CircularProgress size={16} sx={{ color: "white" }} /> : undefined}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default TableListEOffice;
