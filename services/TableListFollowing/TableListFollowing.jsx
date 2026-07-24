import React, { useState, useMemo, useRef } from "react";
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
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";

import styles from "./TableListFollowing.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";



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

  const [debugMode, setDebugMode] = useState(true);

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters({ ...filters, [field]: value });
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const enhancedStatusOptions = useMemo(() => {
    const actualStatuses = [...new Set(data.map(item => item.status).filter(Boolean))];

    if (statusOptions && statusOptions.length > 0) {
      return [
        ...statusOptions
      ];
    } else {
      const autoOptions = actualStatuses.map(status => ({
        value: status,
        label: status
      }));

      return [
        { value: "", label: "— ทุกสถานะ —" },
        ...autoOptions
      ];
    }
  }, [statusOptions, data]);

  const filteredData = useMemo(() => {
    let filtered = [...data];



    // กรองตามชื่อผู้ร้อง
    if (filters.claimantName && filters.claimantName.trim() !== "") {
      const searchTerm = filters.claimantName.toLowerCase().trim();
      const beforeCount = filtered.length;
      filtered = filtered.filter((item) =>
        item.claimantName && item.claimantName.toLowerCase().includes(searchTerm)
      );
    }

    // กรองตามหน่วยงาน
    if (filters.agency && filters.agency.trim() !== "") {
      const searchTerm = filters.agency.toLowerCase().trim();
      const beforeCount = filtered.length;
      filtered = filtered.filter((item) =>
        item.agency && item.agency.toLowerCase().includes(searchTerm)
      );
    }

    // กรองตามเลขสรร.
    if (filters.ssoNo && filters.ssoNo.trim() !== "") {
      const searchTerm = filters.ssoNo.toLowerCase().trim();
      const beforeCount = filtered.length;
      filtered = filtered.filter((item) =>
        item.ssoNo && item.ssoNo.toLowerCase().includes(searchTerm)
      );
    }

    // กรองตามสถานะ - ปรับปรุงการเปรียบเทียบให้ครอบคลุมทุกกรณี
    if (filters.status && filters.status !== "") {
      const beforeCount = filtered.length;
      const filterValue = filters.status;

      filtered = filtered.filter((item) => {
        const itemStatus = item.status;

        if (itemStatus === filterValue) return true;

        if (String(itemStatus).trim() === String(filterValue).trim()) return true;

        if (String(itemStatus).toLowerCase().trim() === String(filterValue).toLowerCase().trim()) return true;

        if (String(itemStatus).toLowerCase().includes(String(filterValue).toLowerCase())) return true;

        return false;
      });


      if (filtered.length > 0) {
      } else {
      }
    }


    return filtered;
  }, [data, filters, enhancedStatusOptions]);

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
    

    setPage(0);
    onSearch(filters);
  };

  const handleClearSearch = () => {
    

    const cleared = { claimantName: "", agency: "", ssoNo: "", status: "" };
    setFilters(cleared);
    setPage(0);
    onSearch(cleared);
  };

  const handleRowClick = (item) => {
   

    if (navigateTo && item.id) {
      router.push(`${navigateTo}/${item.id}`);
    }
  };

  // ข้อมูลสำหรับ debug
  const debugInfo = useMemo(() => {
    const allStatuses = [...new Set(data.map(item => item.status).filter(Boolean))];
    const statusCounts = allStatuses.map(status => ({
      status,
      count: data.filter(item => item.status === status).length
    }));

    return {
      totalData: data.length,
      allStatuses,
      statusCounts,
      currentFilter: filters.status,
      enhancedStatusOptionsCount: enhancedStatusOptions.length
    };
  }, [data, filters.status, enhancedStatusOptions]);

  const tableRef = useRef(null);
      
    const handleExportPDF = () => {
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `ติดตามผลการดำเนินการ_${today}.pdf`;
    exportElementToPDF(tableRef, filename);
  };
const handleExportExcel = () => {
  const today = new Date().toLocaleDateString("th-TH");
  const filename = `ติดตามผลการดำเนินการ_${today}.xlsx`;

  // ตรวจสอบว่า pagedData มีข้อมูลหรือไม่
  if (!pagedData || pagedData.length === 0) {
    alert("ไม่มีข้อมูลให้ส่งออก");
    return;
  }

  const exportData = pagedData.map((item, idx) => ({
    ลำดับ: page * rowsPerPage + idx + 1,
    "ชื่อผู้ร้อง": item.claimantName || "-",
    "หน่วยงานที่เกี่ยวข้อง": item.agency || "-",
    "เลขสรร.": item.ssoNo || "-",
    "เรื่อง": item.issue || "-",
    "ประเภทเรื่อง": item.issueType || "-",
    "วันที่รับเรื่อง": item.receiveDate || "-",
    "สถานะการดำเนินการ": item.status || "-",
  }));

  // ✅ ส่งออก JSON โดยตรง ไม่ต้องอิง ref
  exportExcel(exportData, filename);
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
        width="100%"
      display="flex"
      alignItems="center"
      gap={1}
      sx={{
      flexWrap: { xs: "wrap", sm: "nowrap" }, 
      whiteSpace: "nowrap",
      px: 2,
      }}
        >
          <InputText
          label="เลขที่อ้างอิง"
          value={filters.claimantName}
          onChange={handleChange("claimantName")}
          placeholder="ค้นหาชื่อเรื่อง"
          sx={{ minWidth: { xs: "100%", sm: "180px" }, marginBottom: { xs: "8px", sm: 0 } }} // Full width on small screens, 180px on larger screens
          />
          <InputText
          label="หน่วยงาน"
          value={filters.agency}
          onChange={handleChange("agency")}
          placeholder="ค้นหาหน่วยงาน"
          sx={{ minWidth: { xs: "100%", sm: "180px" }, marginBottom: { xs: "8px", sm: 0 } }} // Same behavior for this input
          />
          <InputText
          label="เลขสรร."
          value={filters.ssoNo}
          onChange={handleChange("ssoNo")}
          placeholder="ค้นหาเลขสรร."
          sx={{ minWidth: { xs: "100%", sm: "150px" }, marginBottom: { xs: "8px", sm: 0 } }} // Full width on small screens, 150px on larger screens
          />
          <SelectField
            label="สถานะการดำเนินการ"
            options={enhancedStatusOptions}
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
          <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
          <ExportButton
            label="Export PDF"
            onClick={handleExportPDF}
          />
          <ExportButton
            label="Export Excel"
            onClick={handleExportExcel}
          />
        </Box>
        </Box>
        
      </Box>
      
      <Box
        className={styles.tableWrapper}
        id="table-results"
        sx={{ overflowX: "auto", px: 2, pb: 1 }}
      >
        <Table sx={{ minWidth: 1400 }} ref={tableRef}>
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
                เลขที่อ้างอิง
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
                        backgroundColor:
                          item?.status === "รอการยืนยัน" ? "#fff3cd" :
                            item?.status === "รับเรื่อง" ? "#d4edda" :
                              item?.status === "ดำเนินการแล้ว" ? "#cce5ff" : "#e2e3e5",
                        color:
                          item?.status === "รอการยืนยัน" ? "#856404" :
                            item?.status === "รับเรื่อง" ? "#155724" :
                              item?.status === "ดำเนินการแล้ว" ? "#004085" : "#495057",
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