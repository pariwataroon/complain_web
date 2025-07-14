import React, { useState, useMemo, useRef, useEffect } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import styles from "./TableList.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import { exportExcel } from "@utils/exportExcel";
import { exportElementToPDF } from "@utils/exportPDF";
import { getDepartments } from "@pages/api/department/department";
import { alertSuccess, alertWarning } from "@utils/Alerts";

const TableList = ({
  data = [],
  title = "",
  navigateTo = "",
  handleNavigateTo,
}) => {
  const router = useRouter();
  const isSmallScreen = useMediaQuery("(max-width:1200px)");
  const isExtraSmallScreen = useMediaQuery("(max-width:600px)");

  const [filters, setFilters] = useState({
    claimantName: "",
    subject: "",
    docGov: "",
    agency: "",
    docKk: "",
    docSr: "",
    docStp: "",
  });

  const [searchFilters, setSearchFilters] = useState({
    claimantName: "",
    subject: "",
    docGov: "",
    agency: "",
    docKk: "",
    docSr: "",
    docStp: "",
  });

  // สำหรับ department options
  const hasFetchedDepartments = useRef(false);
  const [departmentOptions, setDepartmentOptions] = useState([
    { value: "", label: "เลือกหน่วยงาน" },
  ]);

  useEffect(() => {
    if (hasFetchedDepartments.current) return;
    hasFetchedDepartments.current = true;
    const fetchDepartments = async () => {
      try {
        const res = await getDepartments();
        if (res?.res_code === "0000" && Array.isArray(res.res_data)) {
          const depts = res.res_data.map((d) => ({
            value: d.id,
            label: d.name,
          }));
          setDepartmentOptions([
            { value: "", label: "เลือกหน่วยงาน" },
            ...depts,
          ]);
        } else {
          setDepartmentOptions([{ value: "", label: "เลือกหน่วยงาน" }]);
        }
      } catch (err) {
        setDepartmentOptions([{ value: "", label: "เลือกหน่วยงาน" }]);
      }
    };
    fetchDepartments();
  }, []);

  // สำหรับ filter & pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ฟังก์ชัน safeIncludes สำหรับตรวจสอบ string
  const safeIncludes = (text, query) =>
    (text ?? "")
      .toString()
      .toLowerCase()
      .includes((query ?? "").toString().toLowerCase());

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (
        searchFilters.claimantName &&
        !safeIncludes(item.complainant_name, searchFilters.claimantName)
      ) {
        return false;
      }
      if (
        searchFilters.subject &&
        !safeIncludes(item.subject, searchFilters.subject)
      ) {
        return false;
      }
      if (
        searchFilters.docGov &&
        !safeIncludes(item.reference_number4, searchFilters.docGov)
      ) {
        return false;
      }
      if (
        searchFilters.agency &&
        item.sender_agency_id !== searchFilters.agency &&
        item.sender_agency !== searchFilters.agency &&
        item.agency_id !== searchFilters.agency
      ) {
        return false;
      }
      return true;
    });
  }, [data, searchFilters]);

  // pagination
  const pagedData = useMemo(
    () =>
      filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredData, page, rowsPerPage]
  );

  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleSearchClick = () => {
    setPage(0);
    setSearchFilters(filters);
    // Show alert depending on search result
    setTimeout(() => {
      if (data.length > 0 && filteredData.length === 0) {
        alertWarning("ไม่พบข้อมูล", "ไม่พบข้อมูลที่ค้นหา");
      } else {
        alertSuccess("ค้นหาสำเร็จ", "ค้นหาข้อมูลสำเร็จแล้ว");
      }
    }, 0);
  };

  const handleClearSearch = () => {
    const cleared = {
      claimantName: "",
      subject: "",
      docGov: "",
      agency: "",
      docKk: "",
      docSr: "",
      docStp: "",
    };
    setFilters(cleared);
    setSearchFilters(cleared);
    setPage(0);
  };

  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  // Handle Enter key press for search
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  const tableRef = useRef(null);

  const handleExportPDF = () => {
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `รายงาน${title}_${today}.pdf`;
    exportElementToPDF(tableRef, filename);
  };

  const handleExportExcel = () => {
    if (!filteredData || filteredData.length === 0) return;
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `รายงาน${title}_${today}.xlsx`;

    // กำหนดหัวตาราง
    const exportLabel = [
      "ลำดับ",
      "ชื่อผู้ร้อง",
      "ชื่อเรื่อง",
      "เลขที่ สป.กค.",
      "เลขที่ สป.สร.",
      "เลขที่ สตป.",
      "เลขที่ สรร.",
    ];

    // แปลงข้อมูลเป็น array of array (AOA)
    const exportData = filteredData.map((item, idx) => [
      idx + 1,
      item?.complainant_name ?? "-",
      item?.subject ?? "-",
      item?.reference_number ?? "-",
      item?.reference_number2 ?? "-",
      item?.reference_number3 ?? "-",
      item?.reference_number4 ?? "-",
    ]);

    const aoaWithHeader = [[], [], exportLabel, ...exportData];

    exportExcel(aoaWithHeader, {
      filename,
      sheetName: "Sheet1",
      title,
      exportDate: `วันที่ ${today}`,
    });
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
      <Box sx={{ px: 2, py: 2 }}>
        {isSmallScreen ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
              }}
              gap={2}
            >
              <InputText
                label="ชื่อผู้ร้อง"
                inputLabel="กรอกชื่อผู้ร้อง"
                value={filters.claimantName}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    claimantName: e.target.value,
                  }))
                }
                onKeyPress={handleKeyPress}
              />
              <InputText
                label="ชื่อเรื่อง"
                inputLabel="กรอกชื่อเรื่อง"
                value={filters.subject}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                onKeyPress={handleKeyPress}
              />
              <InputText
                label="เลขที่ สรร."
                inputLabel="กรอกเลขที่ สรร."
                value={filters.docGov}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    docGov: e.target.value,
                  }))
                }
                onKeyPress={handleKeyPress}
              />
              <SelectField
                label="หน่วยงานอื่นที่ส่งเรื่องมายัง กค."
                inputLabel="เลือกหน่วยงาน"
                options={departmentOptions}
                value={filters.agency}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    agency: e.target.value,
                  }))
                }
              />
            </Box>
            {isExtraSmallScreen ? (
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="center" gap={1}>
                  <IconButton
                    onClick={handleSearchClick}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": { bgcolor: "#0b1580" },
                      height: 40,
                      width: 40,
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
                      "&:hover": { bgcolor: "#c82333" },
                      height: 40,
                      width: 40,
                    }}
                    title="ล้างการค้นหา"
                  >
                    <CleaningServicesIcon />
                  </IconButton>
                </Box>
                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    onClick={handleNavigateTo}
                    sx={{
                      backgroundColor: "#1120A3",
                      color: "#fff",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      px: 3,
                      py: 1,
                      height: 40,
                      "&:hover": { backgroundColor: "#0b1580" },
                      width: "100%",
                      maxWidth: 300,
                    }}
                  >
                    คัดกรองเรื่องร้องเรียน
                  </Button>
                </Box>
                <Box display="flex" flexDirection="column" gap={1}>
                  <ExportButton label="Export PDF" onClick={handleExportPDF} />
                  <ExportButton
                    label="Export Excel"
                    onClick={handleExportExcel}
                  />
                </Box>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
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
                      sx={{
                        bgcolor: "#1120A3",
                        color: "#fff",
                        "&:hover": { bgcolor: "#0b1580" },
                        height: 40,
                        width: 40,
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
                        "&:hover": { bgcolor: "#c82333" },
                        height: 40,
                        width: 40,
                      }}
                      title="ล้างการค้นหา"
                    >
                      <CleaningServicesIcon />
                    </IconButton>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleNavigateTo}
                    sx={{
                      backgroundColor: "#1120A3",
                      color: "#fff",
                      borderRadius: "12px",
                      fontWeight: "bold",
                      px: 3,
                      py: 1,
                      height: 40,
                      "&:hover": { backgroundColor: "#0b1580" },
                      minWidth: 220,
                    }}
                  >
                    คัดกรองเรื่องร้องเรียน
                  </Button>
                </Box>
                <Box display="flex" justifyContent="center" gap={1}>
                  <ExportButton label="Export PDF" onClick={handleExportPDF} />
                  <ExportButton
                    label="Export Excel"
                    onClick={handleExportExcel}
                  />
                </Box>
              </Box>
            )}
          </Box>
        ) : (
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
              <InputText
                label="ชื่อผู้ร้อง"
                inputLabel="กรอกชื่อผู้ร้อง"
                value={filters.claimantName}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    claimantName: e.target.value,
                  }))
                }
                onKeyPress={handleKeyPress}
              />
              <InputText
                label="ชื่อเรื่อง"
                inputLabel="กรอกชื่อเรื่อง"
                value={filters.subject}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                onKeyPress={handleKeyPress}
              />
              <InputText
                label="เลขที่ สรร."
                inputLabel="กรอกเลขที่ สรร."
                value={filters.docGov}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    docGov: e.target.value,
                  }))
                }
                onKeyPress={handleKeyPress}
              />
              <SelectField
                label="หน่วยงานอื่นที่ส่งเรื่องมายัง กค."
                inputLabel="เลือกหน่วยงาน"
                options={departmentOptions}
                value={filters.agency}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    agency: e.target.value,
                  }))
                }
              />
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
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
                sx={{
                  bgcolor: "#dc3545",
                  color: "#fff",
                  "&:hover": { bgcolor: "#c82333" },
                  flexShrink: 0,
                  height: 40,
                  width: 40,
                }}
                title="ล้างการค้นหา"
              >
                <CleaningServicesIcon />
              </IconButton>
              <Button
                variant="contained"
                onClick={handleNavigateTo}
                sx={{
                  backgroundColor: "#1120A3",
                  color: "#fff",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  px: 3,
                  py: 1,
                  minWidth: 220,
                  height: 40,
                  "&:hover": { backgroundColor: "#0b1580" },
                  flexShrink: 0,
                }}
              >
                คัดกรองเรื่องร้องเรียน
              </Button>
            </Box>
            <Box
              display="flex"
              flexDirection={isExtraSmallScreen ? "column" : "row"}
              gap={1}
              sx={{ flexShrink: 0 }}
            >
              <ExportButton label="Export PDF" onClick={handleExportPDF} />
              <ExportButton label="Export Excel" onClick={handleExportExcel} />
            </Box>
          </Box>
        )}
      </Box>
      <Box sx={{ px: 2, py: 1 }}>
        <Box sx={{ color: "#666", fontSize: "0.9rem" }}>
          พบข้อมูล {filteredData.length} รายการ
        </Box>
      </Box>
      <Box
        ref={tableRef}
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
            minWidth: isSmallScreen ? 1600 : "100%",
            width: isSmallScreen ? 1600 : "100%",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 80, fontWeight: "bold" }}>
                ลำดับ
              </TableCell>
              <TableCell sx={{ width: 200, fontWeight: "bold" }}>
                ชื่อผู้ร้อง
              </TableCell>
              <TableCell sx={{ width: 300, fontWeight: "bold" }}>
                ชื่อเรื่อง
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                เลขที่ สป.กค.
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                เลขที่ สป.สร.
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                เลขที่ สตป.
              </TableCell>
              <TableCell sx={{ width: 180, fontWeight: "bold" }}>
                เลขที่ สรร.
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedData.length > 0 ? (
              pagedData.map((item, idx) => (
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
                  <TableCell>{item?.complainant_name ?? "-"}</TableCell>
                  <TableCell className={styles.ellipsisCell}>
                    {item?.subject ?? "-"}
                  </TableCell>
                  <TableCell>{item?.reference_number ?? "-"}</TableCell>
                  <TableCell>{item?.reference_number2 ?? "-"}</TableCell>
                  <TableCell>{item?.reference_number3 ?? "-"}</TableCell>
                  <TableCell>{item?.reference_number4 ?? "-"}</TableCell>
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
        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25, 50]}
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="แถวต่อหน้า:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
          }
          sx={{ borderTop: "1px solid #eee" }}
        />
      </Box>
    </Container>
  );
};

export default TableList;
