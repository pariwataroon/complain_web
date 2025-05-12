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
import SearchOffIcon from "@mui/icons-material/SearchOff";

import styles from "./TableListBox.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";

/**
 * props:
 * - data: array of objects
 * - title: table title
 * - navigateTo: base path for row click (item.id appended)
 * - onSearch: function(filters) => void
 * - filterFields: [{ name, label, type, options? }]
 */
const TableListBox = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
  filterFields = [],
}) => {
  const router = useRouter();

  // initialize filter state based on filterFields prop
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);
  const handleChange = (field) => (e) =>
    setFilters({ ...filters, [field]: e?.target ? e.target.value : e });

  // pagination
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

  // search handlers
  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearSearch = () => {
    setFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
  };

  // row click
  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  // define the 5 columns to show
  const columns = [
    { name: "claimantName", label: "ชื่อผู้ร้อง", width: 200 },
    { name: "issueType", label: "ประเภทเรื่อง", width: 180 },
    { name: "subject", label: "ชื่อเรื่อง", width: 300 },
    { name: "accusedName", label: "ชื่อผู้ถูกร้อง", width: 180 },
    { name: "ssoNo", label: "เลขที่ สรร.", width: 160 },
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
      <Box
        className={styles.headerBar}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>{title}</Box>
      </Box>

      {/* search bar */}
      <Box width="100%" px={2} py={1}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {/* ฝั่งซ้าย: filters + search (เลื่อนซ้าย–ขวาได้) */}
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              flexGrow: 1,
              overflowX: "auto",
            }}
          >
            {filterFields.map((f) => (
              <Box key={f.name} flex="1 1 0" minWidth="140px" maxWidth="200px">
                {f.type === "select" ? (
                  <SelectField
                    fullWidth
                    label={f.label}
                    options={f.options}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                  />
                ) : (
                  <InputText
                    fullWidth
                    label={f.label}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                  />
                )}
              </Box>
            ))}

            <IconButton
              onClick={handleSearchClick}
              sx={{
                bgcolor: "#1120A3",
                color: "#fff",
                "&:hover": { bgcolor: "#0b1580" },
                width: 40,
                height: 40,
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
                width: 40,
                height: 40,
              }}
            >
              <SearchOffIcon />
            </IconButton>
          </Box>

          {/* ฝั่งขวา: export ปุ่มไม่เลื่อน */}
          <Box display="flex" alignItems="center" gap={1} flexShrink={0} mr={4}>
            <ExportButton label="Export PDF" />
            <ExportButton label="Export Excel" />
          </Box>
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
              {columns.map((col) => (
                <TableCell key={col.name} sx={{ width: col.width }}>
                  {col.label}
                </TableCell>
              ))}
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
                  sx={{ width: 80, fontWeight: 600, color: "#1120A3" }}
                >
                  {page * rowsPerPage + idx + 1}
                </TableCell>
                {columns.map((col) => (
                  <TableCell key={col.name} sx={{ width: col.width }}>
                    {item[col.name] ?? "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

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

export default TableListBox;
