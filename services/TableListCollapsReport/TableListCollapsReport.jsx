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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import styles from "./TableListCollapsReport.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import ButtonService from "@services/ButtonService/ButtonService";
import InputDateNoTime from "@services/InputDateNoTime/InputDateNoTime";
import { exportElementToPDF } from "@utils/exportPDF";

const TableListBox = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => { },
  filterFields = [],
  reportTitle = "",
  reportSubTitle = "",
  dateRange = "",
}) => {
  const router = useRouter();
  const pdfRef = useRef();

  // Initial filters
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const pagedData = useMemo(
    () => data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [data, page, rowsPerPage]
  );

  // Collapse states
  const [openRow, setOpenRow] = useState(null);
  const [openChild, setOpenChild] = useState({});

  // Totals
  const totalDeptSum = data.reduce(
    (sum, item) =>
      sum + item.departmentsData.reduce((s, d) => s + (d.totalDept || 0), 0),
    0
  );
  const inProgressSum = data.reduce(
    (sum, item) =>
      sum +
      item.departmentsData.reduce((s, d) => s + (d.inProgressCnt || 0), 0),
    0
  );
  const closedSum = data.reduce(
    (sum, item) =>
      sum + item.departmentsData.reduce((s, d) => s + (d.closedCnt || 0), 0),
    0
  );

  // Handlers
  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };
  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearSearch = () => {
    setFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
  };
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };
  const handleToggle = (id) => setOpenRow(openRow === id ? null : id);
  const handleChildToggle = (parentId, idx) => {
    const key = `${parentId}_${idx}`;
    setOpenChild((o) => ({ ...o, [key]: !o[key] }));
  };

  // Columns
  const columns = [
    {
      name: "claimantName",
      label: "รายชื่อผู้ตรวจ / หน่วยงานในสังกัด",
      width: 300,
      align: "left",
    },
    { name: "totalDept", label: "จำนวน", width: 100, align: "center" },
    {
      name: "inProgressCnt",
      label: "อยู่ระหว่างดำเนินการ",
      width: 150,
      align: "center",
    },
    { name: "closedCnt", label: "ยุติ", width: 100, align: "center" },
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
      {/* Header */}
      <Box
        className={styles.headerBar}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>{title}</Box>
      </Box>

      {/* Filters */}
      <Box px={2} py={1}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" gap={1} sx={{ flexGrow: 1, overflowX: "auto" }}>
            {filterFields.map((f) => (
              <Box key={f.name} flex="1 1 0" minWidth="200px" maxWidth="300px">
                {f.type === "select" ? (
                  <SelectField
                    fullWidth
                    label={f.label}
                    options={f.options}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                  />
                ) : f.type === "date" ? ( // 👈 เพิ่มเงื่อนไขนี้
                  <Box mt={2}>
                    <InputDateNoTime
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      name={f.name}
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
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  "&:hover": { bgcolor: "#0b1580" },
                }}
              >
                <SearchIcon />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  marginLeft: "10px",
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  "&:hover": { bgcolor: "#0b1580" },
                }}
              >
                <SearchOffIcon />
              </IconButton>
            </Box>
          </Box>

          {/* ปุ่มใหญ่ตรงกลาง */}
          <Box mr={1}>
            <ButtonService
              label="ผลการดำเนินการและเรื่องค้างพิจารณา"
              color="#1120A3"
              style={{
                minWidth: 240,
                height: 40,
                borderRadius: 12,
              }}
              onClick={() =>
                router.push(
                  "/admin/document/annual-inspector-complaints-summary/resultscomplaints"
                )
              }
            />
          </Box>

          <Box display="flex" gap={1}>
            <ExportButton
              label="Export PDF"
              onClick={() =>
                exportElementToPDF(pdfRef, "รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ.pdf")
              }
            />;            
            <ExportButton label="Export Excel" />
          </Box>
        </Box>
      </Box>

      {/* Subtitle / Info Box */}
      <Box
        width="100%"
        textAlign="center"
        bgcolor="#EAF5FF"
        py={2}
        mb={2}
        sx={{ fontWeight: "bold", color: "#0d47a1" }}
      >
        {/* หัวเรื่องหลัก */}
        {reportTitle}

        {/* หัวเรื่องย่อย ถ้ามี */}
        {reportSubTitle && (
          <>
            <br />
            {reportSubTitle}
          </>
        )}

        {dateRange && (
          <>
            <br />
            {dateRange}
          </>
        )}
      </Box>

      {/* Table */}
      <div ref={pdfRef}>

        <Box id="table-results" sx={{ overflowX: "auto", px: 2, pb: 1 }}>
          <Table
            sx={{
              minWidth: columns.reduce((sum, c) => sum + c.width, 0),
              tableLayout: "fixed",
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.name}
                    align={col.align}
                    sx={{ width: col.width }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Totals */}
              <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
                {columns.map((col) => (
                  <TableCell
                    key={col.name}
                    align={col.align}
                    sx={{ width: col.width }}
                  >
                    {col.name === "claimantName"
                      ? "รวม"
                      : col.name === "totalDept"
                        ? totalDeptSum
                        : col.name === "inProgressCnt"
                          ? inProgressSum
                          : closedSum}
                  </TableCell>
                ))}
              </TableRow>

              {/* Rows */}
              {pagedData.map((item) => (
                <React.Fragment key={item.id}>
                  {/* Parent row */}
                  <TableRow
                    onClick={() => router.push(`${navigateTo}/${item.id}`)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#f5f7ff" },
                    }}
                  >
                    {columns.map((col) => {
                      const val =
                        col.name === "claimantName"
                          ? item.claimantName
                          : col.name === "totalDept"
                            ? item.departmentsData.reduce(
                              (s, d) => s + (d.totalDept || 0),
                              0
                            )
                            : col.name === "inProgressCnt"
                              ? item.departmentsData.reduce(
                                (s, d) => s + (d.inProgressCnt || 0),
                                0
                              )
                              : item.departmentsData.reduce(
                                (s, d) => s + (d.closedCnt || 0),
                                0
                              );

                      return col.name === "claimantName" ? (
                        <TableCell
                          key={col.name}
                          align={col.align}
                          sx={{ display: "flex", alignItems: "center" }}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(item.id);
                            }}
                            sx={{ mr: 1 }}
                          >
                            {openRow === item.id ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                          {val}
                        </TableCell>
                      ) : (
                        <TableCell
                          key={col.name}
                          align={col.align}
                          sx={{ width: col.width }}
                        >
                          {val}
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* First-level collapse */}
                  {openRow === item.id &&
                    item.departmentsData.map((d, idx) => {
                      const key = `${item.id}_${idx}`;
                      return (
                        <React.Fragment key={key}>
                          <TableRow sx={{ backgroundColor: "#fefaef" }}>
                            <TableCell
                              align="left"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                pl: 4,
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleChildToggle(item.id, idx)}
                                sx={{ mr: 1 }}
                              >
                                {openChild[key] ? (
                                  <ExpandLessIcon />
                                ) : (
                                  <ExpandMoreIcon />
                                )}
                              </IconButton>
                              {d.department}
                            </TableCell>
                            <TableCell align="center">{d.totalDept}</TableCell>
                            <TableCell align="center">
                              {d.inProgressCnt}
                            </TableCell>
                            <TableCell align="center">{d.closedCnt}</TableCell>
                          </TableRow>

                          {/* Second-level collapse */}
                          {d.children &&
                            openChild[key] &&
                            d.children.map((c, j) => (
                              <TableRow key={`${key}_${j}`}>
                                <TableCell
                                  align="left"
                                  sx={{ width: columns[0].width, pl: 8 }}
                                >
                                  {c.department}
                                </TableCell>
                                <TableCell align="center">
                                  {c.totalDept}
                                </TableCell>
                                <TableCell align="center">
                                  {c.inProgressCnt}
                                </TableCell>
                                <TableCell align="center">
                                  {c.closedCnt}
                                </TableCell>
                              </TableRow>
                            ))}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{ borderTop: "1px solid #eee" }}
          />
        </Box>
      </div>
    </Container>
  );
};

export default TableListBox;
