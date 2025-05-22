import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Tabs,
  Tab,
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

import styles from "./TableListTab.module.scss";
import InputText from "@services/InputText/InputText";
import ExportButton from "@services/ExportButton/ExportButton";
import { exportElementToPDF } from "@utils/exportPDF";

const TableListAgency = ({
  summaryData = [],
  pendingData = [],
  onSearch = () => { },
  filterFields = [],
  navigateTo = "",
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  // tab state
  const [tabIndex, setTabIndex] = useState(0);
  const handleTabChange = (_, idx) => {
    setTabIndex(idx);
    setPage(0);
  };

  // filters state
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  // pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // define columns for each tab
  const columnsByTab = [
    // Tab 0: ผลการดำเนินเรื่องร้องทุกข์
    [
      {
        field: "claimantName",
        headerName: "ผู้ตรวจราชการกระทรวงการคลัง",
        align: "left",
      },
      { field: "totalDept", headerName: "จำนวน", align: "center" },
      {
        field: "inProgressCnt",
        headerName: "อยู่ระหว่างดำเนินการ",
        align: "center",
      },
      { field: "closedCnt", headerName: "ยุติ", align: "center" },
    ],
    // Tab 1: เรื่องค้างการพิจารณา
    [
      {
        field: "claimantName",
        headerName: "ผู้ตรวจราชการกระทรวงการคลัง",
        align: "left",
      },
      {
        field: "pendingBetween",
        headerName: "เรื่องค้างพิจารณาระหว่าง ปีงบประมาณ พ.ศ. 2558 - 2567",
        align: "center",
      },
      {
        field: "inProcessFY2568",
        headerName: "อยู่ระหว่างดำเนินการ ปีงบประมาณ พ.ศ. 2568",
        align: "center",
      },
      { field: "total", headerName: "รวม", align: "center" },
    ],
  ];

  const currentColumns = columnsByTab[tabIndex];
  const currentData = tabIndex === 0 ? summaryData : pendingData;

  // pagedData recalculated when currentData, page or rowsPerPage change
  const pagedData = useMemo(
    () =>
      currentData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [currentData, page, rowsPerPage]
  );

  // filter handlers
  const handleChangeFilter = (name) => (e) =>
    setFilters({ ...filters, [name]: e.target.value });
  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearClick = () => {
    setFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
  };

  // pagination handlers
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };

  // compute totals for summary row
  const totals = currentColumns.reduce((acc, col) => {
    if (col.field !== "claimantName") {
      acc[col.field] = currentData.reduce(
        (sum, row) => sum + (Number(row[col.field]) || 0),
        0
      );
    }
    return acc;
  }, {});

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
      {/* Tabs */}
      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "relative", zIndex: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            sx={{ ".MuiTabs-indicator": { display: "none" } }}
          >
            <Tab
              label="ผลการดำเนินเรื่องร้องทุกข์"
              sx={{
                textTransform: "none",
                minWidth: 180,
                px: 3,
                height: 40,
                lineHeight: "40px",
                backgroundColor: "#878FD0",
                color: "#fff",
                borderTopLeftRadius: 10,
                borderTopRightRadius: 25,
                "&:hover": { backgroundColor: "#9AA4FF" },
                "&.Mui-selected": {
                  backgroundColor: "#1120A3",
                  color: "#fff",
                  zIndex: 3,
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: -8,
                    left: 0,
                    width: "100%",
                    height: 8,
                    backgroundColor: "#1120A3",
                  },
                },
              }}
            />
            <Tab
              label="เรื่องค้างการพิจารณา"
              sx={{
                textTransform: "none",
                minWidth: 180,
                px: 3,
                mr: 1,
                height: 40,
                lineHeight: "40px",
                backgroundColor: "#878FD0",
                color: "#fff",
                borderTopLeftRadius: 10,
                borderTopRightRadius: 25,
                "&:hover": { backgroundColor: "#9AA4FF" },
                "&.Mui-selected": {
                  backgroundColor: "#1120A3",
                  color: "#fff",
                  zIndex: 3,
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: -8,
                    left: 0,
                    width: "100%",
                    height: 8,
                    backgroundColor: "#1120A3",
                  },
                },
              }}
            />
          </Tabs>
        </Box>
        <Box className={styles.headerBar} />
      </Box>

      {/* Filters */}
      <Box px={2} py={1}>
        <Box display="flex" alignItems="center" gap={1}>
          {filterFields.map((f) => (
            <Box key={f.name} flex="1 1 0" minWidth="200px">
              <InputText
                fullWidth
                label={f.label}
                value={filters[f.name]}
                onChange={handleChangeFilter(f.name)}
              />
            </Box>
          ))}

          <IconButton
            onClick={handleSearchClick}
            sx={{
              bgcolor: "#1120A3",
              color: "#fff",
              width: 40,
              height: 40,
              "&:hover": { bgcolor: "#0b1580" },
            }}
          >
            <SearchIcon />
          </IconButton>
          <IconButton
            onClick={handleClearClick}
            sx={{
              bgcolor: "#1120A3",
              color: "#fff",
              width: 40,
              height: 40,
              "&:hover": { bgcolor: "#0b1580" },
            }}
          >
            <SearchOffIcon />
          </IconButton>

          <Box flexGrow={1} />
          <ExportButton
            label="Export PDF"
            onClick={() =>
              exportElementToPDF(pdfRef, "ผลการดำเนินการและเรื่องค้างพิจารณา.pdf")
            }
          />;
          <ExportButton label="Export Excel" />
        </Box>
      </Box>

      {/* Table */}
      <div ref={pdfRef}>
        <Box
          className={styles.tableWrapper}
          sx={{ overflowX: "auto", px: 2, pb: 1 }}
        >
          <Table sx={{ minWidth: 600, tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                {currentColumns.map((col) => (
                  <TableCell key={col.field} align={col.align}>
                    {col.headerName}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedData.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() =>
                    navigateTo && router.push(`${navigateTo}/${row.id}`)
                  }
                >
                  {currentColumns.map((col) => (
                    <TableCell key={col.field} align={col.align}>
                      {row[col.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* summary row */}
              <TableRow sx={{ backgroundColor: "#e3f2fd", fontWeight: "bold" }}>
                {currentColumns.map((col) =>
                  col.field === "claimantName" ? (
                    <TableCell key={col.field}>รวม</TableCell>
                  ) : (
                    <TableCell key={col.field} align={col.align}>
                      {totals[col.field]}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={currentData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{ borderTop: "1px solid #eee" }}
          />
        </Box>
      </div>
    </Container >
  );
};

export default TableListAgency;
