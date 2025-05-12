// components/services/TableListCollaps/TableListCollaps.jsx

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
  Collapse,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import styles from "./TableListCollaps.module.scss";
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

  // 1) build initialFilters
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});

  // 2) filters reflect the inputs
  const [filters, setFilters] = useState(initialFilters);
  // 3) appliedFilters only updates on 🔍 or clear
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // 4) update filters on change (no search yet)
  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // 5) pagination state
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

  // 6) collapse state
  const [openRow, setOpenRow] = useState(null);
  const handleToggle = (id) => {
    setOpenRow(openRow === id ? null : id);
  };

  // 7) fire search only when user clicks 🔍
  const handleSearchClick = () => {
    setPage(0);
    setAppliedFilters(filters);
    onSearch(filters);
  };

  // 8) clear filters AND re-run search
  const handleClearSearch = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
  };

  // 9) columns definition
  const columns = [
    { name: "claimantName", label: "ชื่อเรื่อง", width: 200 },
    { name: "department", label: "หน่วยงาน", width: 180 },
    {
      name: "responsibleOfficer",
      label: "เจ้าหน้าที่ผู้รับผิดชอบ",
      width: 300,
    },
    { name: "receiptNumber", label: "เลขรับ สรร.", width: 180 },
    { name: "referenceNumber", label: "เลขที่อ้างอิง", width: 160 },
    { name: "workingDays", label: "ระยะเวลา (วันทำการ)", width: 160 },
    { name: "status", label: "สถานะเรื่อง", width: 160 },
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
      {/* header */}
      <Box
        className={styles.headerBar}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>{title}</Box>
      </Box>

      {/* filters bar */}
      <Box width="100%" px={2} py={1}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ flexGrow: 1, overflowX: "auto" }}
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
          <Box display="flex" alignItems="center" gap={1} flexShrink={0} mr={4}>
            <ExportButton label="Export PDF" />
            <ExportButton label="Export Excel" />
          </Box>
        </Box>
      </Box>

      {/* data table */}
      <Box
        className={styles.tableWrapper}
        id="table-results"
        sx={{ overflowX: "auto", px: 2, pb: 1 }}
      >
        <Table sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 80 }}></TableCell>
              {columns.map((col) => (
                <TableCell key={col.name} sx={{ width: col.width }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedData.map((item, idx) => (
              <React.Fragment key={item.id}>
                <TableRow
                  onClick={() => router.push(`${navigateTo}/${item.id}`)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f7ff" },
                  }}
                >
                  {/* Icon cell */}
                  <TableCell align="center" sx={{ width: 80 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(item.id);
                      }}
                    >
                      {openRow === item.id ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </TableCell>

                  {/* other cells */}
                  {columns.map((col) => (
                    <TableCell key={col.name} sx={{ width: col.width }}>
                      {col.name === "department" ? "" : item[col.name] ?? ""}
                    </TableCell>
                  ))}
                </TableRow>

                {/* collapse details */}
                <TableRow>
                  <TableCell
                    style={{ padding: 0 }}
                    colSpan={columns.length + 1}
                    sx={{ backgroundColor: "#fefaef" }}
                  >
                    <Collapse
                      in={openRow === item.id}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box>
                        <Table size="small">
                          <TableBody>
                            {(() => {
                              // use appliedFilters.department
                              const filteredDepts = appliedFilters.department
                                ? item.departmentsData.filter(
                                    (d) =>
                                      d.department === appliedFilters.department
                                  )
                                : item.departmentsData;

                              if (filteredDepts.length) {
                                return filteredDepts.map((dept, i) => (
                                  <TableRow key={i}>
                                    <TableCell sx={{ width: 80 }} />
                                    <TableCell
                                      sx={{ width: columns[0].width }}
                                    />
                                    <TableCell sx={{ width: columns[1].width }}>
                                      {dept.department}
                                    </TableCell>
                                    <TableCell
                                      sx={{ width: columns[2].width }}
                                    />
                                    <TableCell sx={{ width: columns[3].width }}>
                                      {dept.receiptNumber}
                                    </TableCell>
                                    <TableCell sx={{ width: columns[4].width }}>
                                      {dept.referenceNumber}
                                    </TableCell>
                                    <TableCell sx={{ width: columns[5].width }}>
                                      {dept.workingDays}
                                    </TableCell>
                                    <TableCell sx={{ width: columns[6].width }}>
                                      {dept.status}
                                    </TableCell>
                                  </TableRow>
                                ));
                              } else {
                                return (
                                  <TableRow>
                                    <TableCell
                                      colSpan={columns.length + 1}
                                      align="center"
                                    >
                                      ไม่มีข้อมูลหน่วยงาน
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            })()}
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

export default TableListBox;
