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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import styles from "./TableListWebComplaints.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import SearchOffIcon from "@mui/icons-material/SearchOff";

const TableListWebComplaints = ({
  data = [],
  title = "",
  navigateTo = "",
  agencyOptions = [],
  issueTypeOptions = [],
  issueSubTypeOptions = [],
  onSearch = () => { },
  handleNavigateTo,
  page,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  total = 0,
}) => {
  const router = useRouter();

  const [filters, setFilters] = useState({
    claimantName: "",
    issueType: "",
    issueSubType: "",
    subject: "",
    accusedName: "",
    ssoNo: "",
  });
  const handleChange = (field) => (e) =>
    setFilters({ ...filters, [field]: e?.target ? e.target.value : e });
  const pagedData = data;
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleSearchClick = () => {
    onSearch(filters);
  };

  const handleClearSearch = () => {
    const cleared = {
      claimantName: "",
      issueType: "",
      issueSubType: "",
      subject: "",
      accusedName: "",
      ssoNo: "",
    };
    setFilters(cleared);
    setPage(0);
    onSearch(cleared);
  };
  
  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

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

      {/* search bar */}
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
          />
          <SelectField
            label="ประเภทเรื่อง"
            options={issueTypeOptions}
            value={filters.issueType}
            onChange={handleChange("issueType")}
          />
          <SelectField
            label="ประเภทเรื่องย่อย"
            options={issueSubTypeOptions}
            value={filters.issueSubType}
            onChange={handleChange("issueSubType")}
          />
          <InputText
            label="เลขที่ สรร"
            value={filters.ssoNo}
            onChange={handleChange("ssoNo")}
          />
          <InputText
            label="ชื่อเรื่อง"
            value={filters.subject}
            onChange={handleChange("subject")}
          />
          <SelectField
            label="ชื่อผู้ถูกร้อง"
            options={agencyOptions}
            value={filters.accusedName}
            onChange={handleChange("accusedName")}
          />

          <IconButton
            onClick={handleSearchClick}
            sx={{
              bgcolor: "#1120A3",
              color: "#fff",
              "&:hover": { bgcolor: "#0b1580" },
              flexShrink: 0,
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
              flexShrink: 0,
            }}
          >
            <SearchOffIcon />
          </IconButton>
        </Box>

        {/* export buttons */}
        <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
          <ExportButton label="Export PDF" />
          <ExportButton label="Export Excel" />
        </Box>
      </Box>

      {/* table */}
      <Box
        className={styles.tableWrapper}
        id="table-results"
        sx={{ overflowX: "auto", px: 2, pb: 1 }}
      >
        <Table sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 80 }}>
                ลำดับ
              </TableCell>
              <TableCell sx={{ width: 200 }}>ชื่อผู้ร้อง</TableCell>
              <TableCell sx={{ width: 180 }}>ประเภทเรื่อง</TableCell>
              <TableCell sx={{ width: 300 }}>ชื่อเรื่อง</TableCell>
              <TableCell sx={{ width: 180 }}>ชื่อผู้ถูกร้อง</TableCell>
              <TableCell sx={{ width: 160 }}>เลขที่ สรร</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedData.map((item, idx) => (
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
                <TableCell>{item.complainant_name || "-"}</TableCell>
                <TableCell>{item.complaint_type || "-"}</TableCell>
                <TableCell className={styles.ellipsisCell}>
                  {item.subject || "-"}
                </TableCell>
                <TableCell>{item.respondent_name || "-"}</TableCell>
                <TableCell>{item.complaint_number || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25]}
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
          sx={{ borderTop: "1px solid #eee" }}
        />
      </Box>
    </Container>
  );
};

export default TableListWebComplaints;
