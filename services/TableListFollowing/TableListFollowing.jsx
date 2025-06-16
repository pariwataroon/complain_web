import React, { useState, useMemo } from "react";
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
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";

import styles from "./TableListFollowing.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";

const TableListFollowing = ({
  data = [],
  title = "",
  navigateTo = "",
  statusOptions = [],
  onSearch = () => { },
  emptyMessage = "ไม่มีข้อมูล",
}) => {
  const router = useRouter();

  const [filters, setFilters] = useState({
    claimantName: "",
    agency: "",
    ssoNo: "",
    status: "",
  });

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    console.log("🔍 Filter changed:", {
      user: "vampirebeam",
      timestamp: "2025-06-16 14:22:16",
      field,
      value,
      previousValue: filters[field],
      allFilters: { ...filters, [field]: value }
    });
    setFilters({ ...filters, [field]: value });
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Debug: แสดงข้อมูลทั้งหมดเพื่อตรวจสอบ
  React.useEffect(() => {
    console.log("📊 TableListFollowing Debug Info:", {
      user: "vampirebeam",
      timestamp: "2025-06-16 14:22:16",
      totalDataCount: data.length,
      statusOptionsCount: statusOptions.length,
      sampleData: data.slice(0, 3),
      statusOptions: statusOptions,
      uniqueStatusesInData: [...new Set(data.map(item => item.status))],
      currentFilters: filters
    });
  }, [data, statusOptions, filters]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    console.log("🔍 Starting filter process:", {
      user: "vampirebeam",
      timestamp: "2025-06-16 14:22:16",
      originalCount: data.length,
      filters: filters
    });

    // กรองตามชื่อผู้ร้อง
    if (filters.claimantName && filters.claimantName.trim() !== "") {
      const searchTerm = filters.claimantName.toLowerCase().trim();
      const beforeCount = filtered.length;
      filtered = filtered.filter((item) =>
        item.claimantName && item.claimantName.toLowerCase().includes(searchTerm)
      );
      console.log(`📝 Filtered by claimantName "${searchTerm}": ${beforeCount} → ${filtered.length}`);
    }

    // กรองตามหน่วยงาน
    if (filters.agency && filters.agency.trim() !== "") {
      const searchTerm = filters.agency.toLowerCase().trim();
      const beforeCount = filtered.length;
      filtered = filtered.filter((item) =>
        item.agency && item.agency.toLowerCase().includes(searchTerm)
      );
      console.log(`🏢 Filtered by agency "${searchTerm}": ${beforeCount} → ${filtered.length}`);
    }

    // กรองตามเลขสรร.
    if (filters.ssoNo && filters.ssoNo.trim() !== "") {
      const searchTerm = filters.ssoNo.toLowerCase().trim();
      const beforeCount = filtered.length;
      filtered = filtered.filter((item) =>
        item.ssoNo && item.ssoNo.toLowerCase().includes(searchTerm)
      );
      console.log(`🔢 Filtered by ssoNo "${searchTerm}": ${beforeCount} → ${filtered.length}`);
    }

    // กรองตามสถานะ - ปรับปรุงการเปรียบเทียบ
    if (filters.status && filters.status !== "") {
      const beforeCount = filtered.length;

      // ลองหาทั้งแบบตรงกันแน่นอนและแบบ contains
      const exactMatches = filtered.filter((item) => item.status === filters.status);
      const containsMatches = filtered.filter((item) =>
        item.status && item.status.toLowerCase().includes(filters.status.toLowerCase())
      );

      console.log(`📊 Status filter analysis for "${filters.status}":`, {
        user: "vampirebeam",
        timestamp: "2025-06-16 14:22:16",
        beforeCount,
        exactMatches: exactMatches.length,
        containsMatches: containsMatches.length,
        sampleDataStatuses: data.slice(0, 5).map(item => ({
          id: item.id,
          status: item.status,
          statusType: typeof item.status
        })),
        filterValue: filters.status,
        filterValueType: typeof filters.status
      });

      // ใช้ exact match ก่อน ถ้าไม่เจอให้ลอง contains
      filtered = exactMatches.length > 0 ? exactMatches : containsMatches;

      console.log(`📊 Filtered by status "${filters.status}": ${beforeCount} → ${filtered.length}`);
    }

    console.log("✅ Final filtered result:", {
      user: "vampirebeam",
      timestamp: "2025-06-16 14:22:16",
      finalCount: filtered.length,
      originalCount: data.length,
      appliedFilters: Object.entries(filters).filter(([_, value]) => value && value !== ""),
      sampleFilteredData: filtered.slice(0, 3)
    });

    return filtered;
  }, [data, filters]);

  const pagedData = useMemo(
    () => filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredData, page, rowsPerPage]
  );

  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  React.useEffect(() => {
    setPage(0);
  }, [filteredData.length]);

  const handleSearchClick = () => {
    console.log("🔍 Manual search triggered:", {
      user: "vampirebeam",
      timestamp: "2025-06-16 14:22:16",
      filters: filters,
      resultCount: filteredData.length
    });

    setPage(0);
    onSearch(filters);
  };

  const handleClearSearch = () => {
    console.log("🧹 Clear search triggered:", {
      user: "vampirebeam",
      timestamp: "2025-06-16 14:22:16",
      previousFilters: filters
    });

    const cleared = { claimantName: "", agency: "", ssoNo: "", status: "" };
    setFilters(cleared);
    setPage(0);
    onSearch(cleared);
  };

  const handleRowClick = (item) => {
    console.log("👆 Row clicked:", {
      user: "vampirebeam",
      timestamp: "2025-06-16 14:22:16",
      itemId: item.id,
      navigateTo: navigateTo,
      itemStatus: item.status
    });

    if (navigateTo && item.id) {
      router.push(`${navigateTo}/${item.id}`);
    }
  };

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

      {/* ------------------------------------------------------------------ */}
      {/*  search bar                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        mt={2}
        sx={{
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
          overflowX: "auto",
          px: 2,
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ flexWrap: "nowrap" }}
        >
          <InputText
            label="ชื่อผู้ร้อง"
            value={filters.claimantName}
            onChange={handleChange("claimantName")}
            placeholder="ค้นหาชื่อผู้ร้อง"
            sx={{ minWidth: "180px" }}
          />
          <InputText
            label="หน่วยงาน"
            value={filters.agency}
            onChange={handleChange("agency")}
            placeholder="ค้นหาหน่วยงาน"
            sx={{ minWidth: "180px" }}
          />
          <InputText
            label="เลขสรร."
            value={filters.ssoNo}
            onChange={handleChange("ssoNo")}
            placeholder="ค้นหาเลขสรร."
            sx={{ minWidth: "150px" }}
          />
          <SelectField
            label="สถานะการดำเนินการ"
            options={[
              { value: "", label: "— ทุกสถานะ —" },
              ...statusOptions
            ]}
            value={filters.status}
            onChange={handleChange("status")}
            sx={{ minWidth: "200px" }}
          />

          <IconButton
            onClick={handleSearchClick}
            sx={{
              bgcolor: "#1120A3",
              color: "#fff",
              "&:hover": {
                bgcolor: "#0b1580",
                transform: "scale(1.05)",
              },
              borderRadius: "50%",
              transition: "all 0.2s ease-in-out",
              flexShrink: 0,
            }}
            title="ค้นหา"
          >
            <SearchIcon />
          </IconButton>
          <IconButton
            onClick={handleClearSearch}
            sx={{
              bgcolor: "#dc3545",
              color: "#fff",
              "&:hover": {
                bgcolor: "#c82333",
                transform: "scale(1.05)",
              },
              borderRadius: "50%",
              transition: "all 0.2s ease-in-out",
              flexShrink: 0,
            }}
            title="ล้างการค้นหา"
          >
            <CleaningServicesIcon />
          </IconButton>
        </Box>

        <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
          <ExportButton
            label="Export PDF"
            onClick={() => {
              console.log("📄 PDF Export clicked:", {
                user: "vampirebeam",
                timestamp: "2025-06-16 14:22:16",
                dataCount: filteredData.length,
                filters: filters
              });
            }}
          />
          <ExportButton
            label="Export Excel"
            onClick={() => {
              console.log("📊 Excel Export clicked:", {
                user: "vampirebeam",
                timestamp: "2025-06-16 14:22:16",
                dataCount: filteredData.length,
                filters: filters
              });
            }}
          />
        </Box>
      </Box>

      {/* แสดงสถิติการค้นหาและ Debug Info */}
      {(filters.claimantName || filters.agency || filters.ssoNo || filters.status) && (
        <Box
          sx={{
            mx: 2,
            mt: 2,
            p: 2,
            bgcolor: '#f8f9fa',
            borderRadius: 2,
            border: '1px solid #dee2e6'
          }}
        >
          <Typography variant="body2" sx={{ color: '#495057', mb: 1 }}>
            📊 <strong>ผลการค้นหา:</strong> พบ {filteredData.length} รายการ จากทั้งหมด {data.length} รายการ
          </Typography>

          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {filters.claimantName && (
              <Chip
                label={`ชื่อผู้ร้อง: "${filters.claimantName}"`}
                size="small"
                sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                onDelete={() => setFilters({ ...filters, claimantName: "" })}
              />
            )}
            {filters.agency && (
              <Chip
                label={`หน่วยงาน: "${filters.agency}"`}
                size="small"
                sx={{ bgcolor: '#e8f5e8', color: '#2e7d32' }}
                onDelete={() => setFilters({ ...filters, agency: "" })}
              />
            )}
            {filters.ssoNo && (
              <Chip
                label={`เลขสรร.: "${filters.ssoNo}"`}
                size="small"
                sx={{ bgcolor: '#fff3e0', color: '#f57c00' }}
                onDelete={() => setFilters({ ...filters, ssoNo: "" })}
              />
            )}
            {filters.status && (
              <Chip
                label={`สถานะ: "${filters.status}"`}
                size="small"
                sx={{ bgcolor: '#f3e5f5', color: '#9c27b0' }}
                onDelete={() => setFilters({ ...filters, status: "" })}
              />
            )}
          </Box>

          {/* Debug: แสดงสถานะที่มีในข้อมูล */}
          <Typography variant="caption" sx={{ color: '#6c757d', display: 'block', mb: 1 }}>
            🔧 <strong>Debug:</strong> สถานะที่มีในข้อมูล: [
            {[...new Set(data.map(item => item.status))].join(', ')}]
          </Typography>

          {filters.status && (
            <Typography variant="caption" sx={{ color: '#6c757d', display: 'block' }}>
              🎯 <strong>กำลังค้นหาสถานะ:</strong> "{filters.status}"
              (จำนวนที่ตรงกัน: {data.filter(item => item.status === filters.status).length} รายการ)
            </Typography>
          )}
        </Box>
      )}

      <Box
        className={styles.tableWrapper}
        id="table-results"
        sx={{ overflowX: "auto", px: 2, pb: 1 }}
      >
        <Table sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow>
              <TableCell
                align="center"
                sx={{
                  width: 80,
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                }}
              >
                ลำดับ
              </TableCell>
              <TableCell
                sx={{
                  width: 200,
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                ชื่อสกุลผู้ร้อง
              </TableCell>
              <TableCell
                sx={{
                  width: 180,
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                หน่วยงานที่เกี่ยวข้อง
              </TableCell>
              <TableCell
                sx={{
                  width: 100,
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                เลขสรร.
              </TableCell>
              <TableCell
                sx={{
                  width: 250,
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                เรื่อง
              </TableCell>
              <TableCell
                sx={{
                  width: 160,
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                ประเภทเรื่อง
              </TableCell>
              <TableCell
                sx={{
                  width: 160,
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                วันที่รับเรื่อง
              </TableCell>
              <TableCell
                sx={{
                  width: 160,
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                สถานะการดำเนินการ
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{
                    padding: "40px 20px",
                    color: "#666",
                    fontSize: "16px",
                    fontStyle: "italic"
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    {(filters.claimantName || filters.agency || filters.ssoNo || filters.status)
                      ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา"
                      : emptyMessage
                    }
                  </Typography>
                  {(filters.claimantName || filters.agency || filters.ssoNo || filters.status) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      ลองปรับเปลี่ยนคำค้นหาหรือเงื่อนไขการกรอง
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((item, idx) => (
                <TableRow
                  key={item.id || idx}
                  onClick={() => handleRowClick(item)}
                  sx={{
                    cursor: navigateTo ? "pointer" : "default",
                    "&:hover": navigateTo ? {
                      backgroundColor: "#f5f7ff",
                      transform: "scale(1.001)",
                      transition: "all 0.2s ease-in-out",
                    } : {},
                    "&:nth-of-type(even)": {
                      backgroundColor: "#fafbfc"
                    }
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: "#1120A3",
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      padding: "14px 12px",
                    }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      padding: "14px 12px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item?.claimantName || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      padding: "14px 12px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item?.agency || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      padding: "14px 12px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item?.ssoNo || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      padding: "14px 12px",
                      maxWidth: "250px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={item?.issue}
                  >
                    {item?.issue || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      padding: "14px 12px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item?.issueType || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      padding: "14px 12px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item?.receiveDate || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      border: "1px solid #e0e0e0",
                      fontSize: "14px",
                      padding: "14px 12px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <Chip
                      label={item?.status || "-"}
                      size="small"
                      sx={{
                        backgroundColor: item?.status === "รอการยืนยัน" ? "#fff3cd" :
                          item?.status === "รอการยืนยัน" ? "#f8d7da" : "#e2e3e5",
                        color: item?.status === "รอการยืนยัน" ? "#856404" :
                          item?.status === "รอการยืนยัน" ? "#721c24" : "#495057",
                        fontWeight: 500,
                        fontSize: "12px"
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filteredData.length > 0 && (
          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 25, 50]}
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            labelRowsPerPage="แสดงต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`} รายการ`
            }
            sx={{
              borderTop: "1px solid #eee",
              "& .MuiTablePagination-toolbar": {
                fontSize: "14px",
                padding: "16px",
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                fontSize: "14px",
                color: "#495057"
              },
            }}
          />
        )}
      </Box>
    </Container>
  );
};

export default TableListFollowing;