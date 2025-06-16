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
    claimantName: "", // ชื่อผู้ร้อง
    agency: "", // หน่วยงานที่เกี่ยวข้อง
    ssoNo: "", // เลขสรร.
    status: "", // สถานะการดำเนินการ
  });

  const handleChange = (field) => (e) =>
    setFilters({ ...filters, [field]: e?.target ? e.target.value : e });

  /* ---------------------------------------------------------------------- */
  /*  pagination                                                            */
  /* ---------------------------------------------------------------------- */
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const pagedData = useMemo(
    () => data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [data, page, rowsPerPage]
  );

  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  /* ---------------------------------------------------------------------- */
  /*  search handlers                                                       */
  /* ---------------------------------------------------------------------- */
  const handleSearchClick = () => {
    setPage(0); // รีเซ็ตหน้าเมื่อค้นหา
    onSearch(filters);
  };

  const handleClearSearch = () => {
    const cleared = { claimantName: "", agency: "", ssoNo: "", status: "" };
    setFilters(cleared);
    setPage(0);
    onSearch(cleared);
  };

  /* ---------------------------------------------------------------------- */
  /*  row click                                                             */
  /* ---------------------------------------------------------------------- */
  const handleRowClick = (item) => {
    if (navigateTo && item.id) {
      router.push(`${navigateTo}/${item.id}`);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*  render                                                                */
  /* ---------------------------------------------------------------------- */
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
          />
          <InputText
            label="หน่วยงาน"
            value={filters.agency}
            onChange={handleChange("agency")}
            placeholder="ค้นหาหน่วยงาน"
          />
          <InputText
            label="เลขสรร."
            value={filters.ssoNo}
            onChange={handleChange("ssoNo")}
            placeholder="ค้นหาเลขสรร."
          />
          <SelectField
            label="สถานะการดำเนินการ"
            options={statusOptions}
            value={filters.status}
            onChange={handleChange("status")}
          />

          {/* ปุ่มค้นหา / ล้างค้นหา */}
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

        {/* ---------------------------------------------------------------- */}
        {/*  export buttons                                                 */}
        {/* ---------------------------------------------------------------- */}
        <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
          <ExportButton label="Export PDF" />
          <ExportButton label="Export Excel" />
        </Box>
      </Box>

      {/* ------------------------------------------------------------------ */}
      {/*  table                                                             */}
      {/* ------------------------------------------------------------------ */}
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
            {data.length === 0 ? (
              // กรณีไม่มีข้อมูล
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
                    {emptyMessage}
                  </Typography>
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
                    title={item?.issue} // แสดง tooltip เมื่อ hover
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
                    {item?.status || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* pagination */}
        {data.length > 0 && (
          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 25]}
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{
              borderTop: "1px solid #eee",
              "& .MuiTablePagination-toolbar": {
                fontSize: "14px",
                padding: "16px",
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                fontSize: "14px",
              },
            }}
          />
        )}
      </Box>
    </Container>
  );
};

export default TableListFollowing;