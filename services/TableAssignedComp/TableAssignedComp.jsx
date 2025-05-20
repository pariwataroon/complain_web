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
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import dayjs from "dayjs";
import "dayjs/locale/th";
import styles from "./TableAssignedComp.module.scss";
import InputText from "@services/InputText/InputText";
import InputDateNoTime from "@services/InputDateNoTime/InputDateNoTime";
import ExportButton from "@services/ExportButton/ExportButton";

dayjs.locale("th");

/**
 * @param {string} title - Title displayed above the table
 * @param {Array} rows - Array of data objects to display
 * @param {Function} onSearch - Callback invoked on search action
 * @param {Function} handleRowClick - External row click handler from parent
 */
const TableAssignedComp = ({
  title = "",
  rows = [],
  onSearch = () => {},
  handleRowClick,
}) => {
  // Filter state
  const [filters, setFilters] = useState({
    claimantName: "",
    subject: "",
    docNo4: "",
    receiveDate: "",
  });
  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Search / Clear actions
  const handleSearchClick = () => {
    onSearch(filters);
    setPage(0);
  };
  const handleClearSearch = () => {
    const cleared = {
      claimantName: "",
      subject: "",
      docNo4: "",
      receiveDate: "",
    };
    setFilters(cleared);
    setPage(0);
    setRowsPerPage(10);
    onSearch(cleared);
  };

  // Filtered rows
  const filteredRows = useMemo(
    () =>
      rows.filter((item) => {
        const matchName = filters.claimantName
          ? item.name.toLowerCase().includes(filters.claimantName.toLowerCase())
          : true;
        const matchSubject = filters.subject
          ? item.subject.toLowerCase().includes(filters.subject.toLowerCase())
          : true;
        const matchDocNo4 = filters.docNo4
          ? item.docNo4.includes(filters.docNo4)
          : true;
        const matchDate = filters.receiveDate
          ? dayjs(item.receiveDate).format("YYYY-MM-DD") ===
            dayjs(filters.receiveDate).format("YYYY-MM-DD")
          : true;
        return matchName && matchSubject && matchDocNo4 && matchDate;
      }),
    [rows, filters]
  );

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
      {/* Header */}
      <Box className={styles.headerBar} />
      <Box className={styles.headerBar2}>{title}</Box>

      {/* Filters */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ overflowX: "auto", px: 2 }}
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
          />
          <InputText
            label="ชื่อเรื่อง"
            value={filters.subject}
            onChange={handleChange("subject")}
          />
          <InputText
            label="เลขที่ สรร."
            value={filters.docNo4}
            onChange={handleChange("docNo4")}
          />
          <InputDateNoTime
            label="วันที่รับเรื่อง"
            value={filters.receiveDate}
            onChange={handleChange("receiveDate")}
          />
          <IconButton
            onClick={handleSearchClick}
            sx={{
              bgcolor: "#1120A3",
              color: "#fff",
              "&:hover": { bgcolor: "#0b1580" },
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
            }}
          >
            <SearchOffIcon />
          </IconButton>
        </Box>
        <Box display="flex" gap={1}>
          <ExportButton label="Export PDF" />
          <ExportButton label="Export Excel" />
        </Box>
      </Box>

      {/* Data Table */}
      <Box sx={{ mt: 4 }} className={styles.tableWrapper}>
        <Table sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 80 }}>
                ลำดับ
              </TableCell>
              <TableCell sx={{ width: 200 }}>ชื่อผู้ร้อง</TableCell>
              <TableCell sx={{ width: 300 }}>ชื่อเรื่อง</TableCell>
              <TableCell sx={{ width: 160 }}>เลขที่ สรร.</TableCell>
              <TableCell sx={{ width: 180 }}>เลขที่ สป.กค.</TableCell>
              <TableCell sx={{ width: 180 }}>เลขที่ สป.สร.</TableCell>
              <TableCell sx={{ width: 180 }}>เลขที่ สตป.</TableCell>
              <TableCell sx={{ width: 160 }}>วันที่รับเรื่อง</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item, idx) => (
                <TableRow
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f7ff" },
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600, color: "#1120A3" }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>{item.name || "-"}</TableCell>
                  <TableCell>{item.subject || "-"}</TableCell>
                  <TableCell>{item.docNo4 || "-"}</TableCell>
                  <TableCell>{item.docNo || "-"}</TableCell>
                  <TableCell>{item.docNo2 || "-"}</TableCell>
                  <TableCell>{item.docNo3 || "-"}</TableCell>
                  <TableCell>
                    {item.receiveDate
                      ? dayjs(item.receiveDate).format("D MMM YYYY")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25]}
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sx={{ borderTop: "1px solid #eee", mt: 1 }}
        />
      </Box>
    </Container>
  );
};

export default TableAssignedComp;
