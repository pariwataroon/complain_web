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
  Button,
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
  onSearch = () => {},
  handleNavigateTo,
}) => {
  const router = useRouter();

  /* ---------------------------------------------------------------------- */
  /*  filters                                                               */
  /* ---------------------------------------------------------------------- */
  const [filters, setFilters] = useState({
    claimantName: "", // ชื่อผู้ร้อง
    issueType: "", // ประเภทเรื่อง
    subject: "", // ชื่อเรื่อง
    accusedName: "", // ชื่อผู้ถูกร้อง
    ssoNo: "", // เลขที่ สสร
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
    onSearch(filters);
  };

  const handleClearSearch = () => {
    const cleared = {
      claimantName: "",
      issueType: "",
      subject: "",
      accusedName: "",
      ssoNo: "",
    };
    setFilters(cleared);
    setPage(0);
    onSearch(cleared);
  };

  /* ---------------------------------------------------------------------- */
  /*  row click                                                             */
  /* ---------------------------------------------------------------------- */
  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

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
          />
          <InputText
            label="ประเภทเรื่อง"
            value={filters.issueType}
            onChange={handleChange("issueType")}
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
          <InputText
            label="เลขที่ สสร"
            value={filters.ssoNo}
            onChange={handleChange("ssoNo")}
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
              <TableCell align="center" sx={{ width: 80 }}>
                ลำดับ
              </TableCell>
              <TableCell sx={{ width: 200 }}>ชื่อผู้ร้อง</TableCell>
              <TableCell sx={{ width: 180 }}>ประเภทเรื่อง</TableCell>
              <TableCell sx={{ width: 300 }}>ชื่อเรื่อง</TableCell>
              <TableCell sx={{ width: 180 }}>ชื่อผู้ถูกร้อง</TableCell>
              <TableCell sx={{ width: 160 }}>เลขที่ สสร</TableCell>
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
                <TableCell>{item?.claimantName ?? "-"}</TableCell>
                <TableCell>{item?.issueType ?? "-"}</TableCell>
                <TableCell className={styles.ellipsisCell}>
                  {item?.subject ?? "-"}
                </TableCell>
                <TableCell>{item?.accusedName ?? "-"}</TableCell>
                <TableCell>{item?.ssoNo ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* pagination */}
        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25]}
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sx={{ borderTop: "1px solid #eee" }}
        />
      </Box>
    </Container>
  );
};

export default TableListWebComplaints;
