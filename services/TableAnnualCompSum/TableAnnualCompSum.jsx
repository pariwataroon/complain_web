import React, { useState } from "react";
import PropTypes from "prop-types";
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
  Collapse,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  SearchOff as SearchOffIcon,
} from "@mui/icons-material";

import styles from "./TableAnnualCompSum.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import InputDateNoTime from "@services/InputDateNoTime/InputDateNoTime";

const TableAnnualCompSum = ({
  data = [],
  filterFields = [],
  onSearch = () => {},
  navigateTo = "",
}) => {
  const router = useRouter();

  // Filters state
  const initialFilters = filterFields.reduce(
    (acc, f) => ({ ...acc, [f.name]: "" }),
    {}
  );
  const [filters, setFilters] = useState(initialFilters);
  const handleChange = (name) => (e) =>
    setFilters({ ...filters, [name]: e?.target?.value ?? e });

  const handleSearchClick = () => onSearch(filters);
  const handleClearClick = () => {
    setFilters(initialFilters);
    onSearch(initialFilters);
  };

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const pagedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };

  // Collapse state per row
  const [expanded, setExpanded] = useState({});
  const toggleRow = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Columns config
  const columns = [
    { label: "ลำดับ", width: 80 },
    { label: "หน่วยงาน", width: 400 },
    { label: "จำนวน", width: 120 },
    { label: "ยุติ", width: 120 },
    { label: "อยู่ระหว่างดำเนินการ", width: 160 },
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
      <Box className={styles.headerBar} />

      {/* Filters */}
      <Box px={2} py={1}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ flexGrow: 1, overflowX: "auto" }}
          >
            {filterFields.map((f) => (
              <Box key={f.name} flex="1 1 0" minWidth="140px" maxWidth="300px">
                {f.type === "select" ? (
                  <SelectField
                    fullWidth
                    label={f.label}
                    options={f.options}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                  />
                ) : f.type === "date" ? (
                  <Box mt={2}>
                    <InputDateNoTime
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                    />{" "}
                  </Box>
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
            <Box mt={3}>
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: 40,
                  height: 40,
                  ml: 1,
                  "&:hover": {
                    bgcolor: "#1120A3", // คงสีเดิมไว้ตอน hover
                  },
                }}
              >
                <SearchIcon />
              </IconButton>
              <IconButton
                onClick={handleClearClick}
                sx={{
                  marginLeft: "10px",
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: 40,
                  height: 40,
                  "&:hover": {
                    bgcolor: "#1120A3", // คงสีเดิมไว้ตอน hover
                  },
                }}
              >
                <SearchOffIcon />
              </IconButton>
            </Box>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            sx={{ flex: "1 0 300px", justifyContent: "flex-end" }}
          >
            <ExportButton label="Export PDF" />
            <ExportButton label="Export Excel" />
          </Box>
        </Box>
      </Box>

      {/* Title */}
      <Box
        sx={{
          backgroundColor: "#EAF5FF",
          p: 2,
          color: "#1120A3",
          textAlign: "center",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ
        <br />
        ตั้งแต่วันที่ 1 ตุลาคม 2567 ถึงวันที่ 25 พฤศจิกายน 2567
      </Box>

      {/* Summary Table with collapsible children */}
      <Box sx={{ overflowX: "auto", px: 2, pb: 1 }}>
        <Table sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableCell
                  key={idx}
                  sx={{ width: col.width }}
                  align={idx === 1 ? "left" : "center"}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedData.map((row, idx) => (
              <React.Fragment key={row.id}>
                <TableRow
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigateTo && router.push(`${navigateTo}`)}
                >
                  <TableCell
                    align="center"
                    sx={{
                      width: columns[0].width,
                      fontWeight: 600,
                      color: "#1120A3",
                    }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: columns[1].width,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <IconButton
                      size="small"
                      sx={{ p: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(row.id);
                      }}
                    >
                      {expanded[row.id] ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                    {row.agency}
                  </TableCell>
                  <TableCell
                    sx={{ width: columns[2].width, textAlign: "center" }}
                  >
                    {row.total ?? "-"}
                  </TableCell>
                  <TableCell
                    sx={{ width: columns[3].width, textAlign: "center" }}
                  >
                    {row.closed ?? "-"}
                  </TableCell>
                  <TableCell
                    sx={{ width: columns[4].width, textAlign: "center" }}
                  >
                    {row.ongoing ?? "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ padding: 0 }} colSpan={columns.length}>
                    <Collapse
                      in={expanded[row.id]}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box>
                        <Table size="small">
                          <TableBody>
                            {(row.children || []).map((child) => (
                              <TableRow
                                key={child.id}
                                sx={{ backgroundColor: "#FEFAEF" }}
                                hover
                              >
                                <TableCell sx={{ width: columns[0].width }} />
                                <TableCell sx={{ width: columns[1].width }}>
                                  {child.agency}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    width: columns[2].width,
                                    textAlign: "center",
                                  }}
                                >
                                  {child.total ?? "-"}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    width: columns[3].width,
                                    textAlign: "center",
                                  }}
                                >
                                  {child.closed ?? "-"}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    width: columns[4].width,
                                    textAlign: "center",
                                  }}
                                >
                                  {child.ongoing ?? "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
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

TableAnnualCompSum.propTypes = {
  data: PropTypes.array,
  filterFields: PropTypes.array,
  onSearch: PropTypes.func,
  navigateTo: PropTypes.string,
};

export default TableAnnualCompSum;
