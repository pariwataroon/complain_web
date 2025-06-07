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
  Collapse,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import styles from "./TableListCollaps.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";

import { exportElementToPDF } from "@utils/exportPDF";

const TableListCollaps = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
  filterFields = [],
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
  const isSm = useMediaQuery(theme.breakpoints.down("md")); // < 900px
  const isBelow1200 = useMediaQuery("(max-width:1200px)");
  const isBelow1300 = useMediaQuery("(max-width:1300px)");

  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

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

  // collapse state
  const [openRow, setOpenRow] = useState(null);
  const handleToggle = (id) => {
    setOpenRow(openRow === id ? null : id);
  };

  // search functions
  const handleSearchClick = () => {
    setPage(0);
    setAppliedFilters(filters);
    onSearch(filters);
  };

  const handleClearSearch = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
  };

  // columns definition
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
        sx={{
          fontSize: { xs: 14, sm: 16, md: 18 },
          height: { xs: 35, sm: 40, md: 50 },
          px: { xs: 1.5, sm: 2, md: 3 },
        }}
      ></Box>

      {/* title and export buttons */}
      {isSm ? (
        // Mobile & Tablet Layout
        <>
          {/* Title */}
          <Box
            className={styles.headerBar2}
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              fontSize: { xs: 16, sm: 18 },
              height: { xs: 40, sm: 50 },
              px: { xs: 2, sm: 3 },
            }}
          >
            <Box sx={{ fontWeight: "bold", textAlign: "center" }}>{title}</Box>
          </Box>

          {/* Export buttons section - separate for mobile/tablet */}
          <Box
            sx={{
              backgroundColor: "#f8f9fa",
              py: { xs: 2, sm: 1.5 },
              px: { xs: 2, sm: 3 },
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              gap={{ xs: 1.5, sm: 1 }}
              justifyContent="center"
              alignItems="center"
            >
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(pdfRef, "รายงานติดตามสถานะ.pdf")
                }
                size={isXs ? "small" : "medium"}
                sx={{
                  minWidth: { xs: "200px", sm: "140px" },
                  width: { xs: "100%", sm: "auto" },
                  maxWidth: { xs: "250px", sm: "none" },
                }}
              />
              <ExportButton
                label="Export Excel"
                size={isXs ? "small" : "medium"}
                sx={{
                  minWidth: { xs: "200px", sm: "140px" },
                  width: { xs: "100%", sm: "auto" },
                  maxWidth: { xs: "250px", sm: "none" },
                }}
              />
            </Box>
          </Box>
        </>
      ) : (
        // Desktop Layout - Title and Export in same row
        <Box
          className={styles.headerBar2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            fontSize: 18,
            height: 50,
            px: 3,
          }}
        >
          <Box sx={{ fontWeight: "bold" }}>{title}</Box>

          <Box display="flex" alignItems="center" gap={1}>
            <ExportButton
              label="Export PDF"
              onClick={() =>
                exportElementToPDF(pdfRef, "รายงานติดตามสถานะ.pdf")
              }
              size="medium"
            />
            <ExportButton label="Export Excel" size="medium" />
          </Box>
        </Box>
      )}

      {/* filters section */}
      <Box
        sx={{
          backgroundColor: "#ffffff",
          py: { xs: 2, sm: 2 },
          px: { xs: 1.5, sm: 2 },
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        {isSm || isBelow1300 ? (
          // Mobile, Tablet & Small Desktop Layout (< 1300px) - Separate rows
          <>
            {/* Filter Fields */}
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              }}
              gap={{ xs: 1.5, sm: 1.5, md: 2 }}
              sx={{ mb: { xs: 2, sm: 2 } }}
            >
              {filterFields.map((f) => (
                <Box key={f.name}>
                  {f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size={isXs ? "small" : "medium"}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size={isXs ? "small" : "medium"}
                    />
                  )}
                </Box>
              ))}
            </Box>

            {/* Search Buttons */}
            <Box
              display="flex"
              gap={{ xs: 1.5, sm: 2 }}
              justifyContent="center"
            >
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                }}
              >
                <SearchIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                }}
              >
                <SearchOffIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </IconButton>
            </Box>
          </>
        ) : (
          // Large Desktop Layout (>= 1300px) - Filters and Search in same row
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            justifyContent="space-between"
          >
            {/* Filter Fields */}
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              sx={{ flexGrow: 1 }}
            >
              {filterFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "160px",
                    maxWidth: "200px",
                    flex: "1 1 160px",
                  }}
                >
                  {f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="medium"
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="medium"
                    />
                  )}
                </Box>
              ))}
            </Box>

            {/* Search Buttons */}
            <Box display="flex" gap={1.5} sx={{ flexShrink: 0 }}>
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
                <SearchIcon sx={{ fontSize: 24 }} />
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
                <SearchOffIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* data table - เหมือนเดิม */}
      <div ref={pdfRef}>
        <Box
          className={styles.tableWrapper}
          id="table-results"
          sx={{
            overflowX: isBelow1200 ? "auto" : "visible",
            px: { xs: 1, sm: 2 },
            pb: 1,
            // Add scrollbar styling for better UX
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "#555",
              },
            },
          }}
        >
          <Table sx={{ minWidth: isBelow1200 ? 1400 : "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell
                  align="center"
                  sx={{
                    width: { xs: 60, sm: 80 },
                    fontSize: { xs: 12, sm: 14 },
                  }}
                ></TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col.name}
                    sx={{
                      width: col.width,
                      fontSize: { xs: 12, sm: 14 },
                      fontWeight: 600,
                      color: "#1120a3",
                    }}
                  >
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
                    <TableCell
                      align="center"
                      sx={{
                        width: { xs: 60, sm: 80 },
                        fontSize: { xs: 12, sm: 14 },
                      }}
                    >
                      <IconButton
                        size={isXs ? "small" : "medium"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(item.id);
                        }}
                      >
                        {openRow === item.id ? (
                          <ExpandLessIcon
                            sx={{ fontSize: { xs: 18, sm: 24 } }}
                          />
                        ) : (
                          <ExpandMoreIcon
                            sx={{ fontSize: { xs: 18, sm: 24 } }}
                          />
                        )}
                      </IconButton>
                    </TableCell>

                    {/* other cells */}
                    {columns.map((col) => (
                      <TableCell
                        key={col.name}
                        sx={{
                          width: col.width,
                          fontSize: { xs: 12, sm: 14 },
                          maxWidth: { xs: 120, sm: col.width },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
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
                                const filteredDepts = appliedFilters.department
                                  ? item.departmentsData?.filter(
                                      (d) =>
                                        d.department ===
                                        appliedFilters.department
                                    )
                                  : item.departmentsData || [];

                                if (filteredDepts.length) {
                                  return filteredDepts.map((dept, i) => (
                                    <TableRow key={i}>
                                      <TableCell
                                        sx={{ width: { xs: 60, sm: 80 } }}
                                      />
                                      <TableCell
                                        sx={{
                                          width: columns[0].width,
                                          fontSize: { xs: 11, sm: 13 },
                                        }}
                                      />
                                      <TableCell
                                        sx={{
                                          width: columns[1].width,
                                          fontSize: { xs: 11, sm: 13 },
                                        }}
                                      >
                                        {dept.department}
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          width: columns[2].width,
                                          fontSize: { xs: 11, sm: 13 },
                                        }}
                                      />
                                      <TableCell
                                        sx={{
                                          width: columns[3].width,
                                          fontSize: { xs: 11, sm: 13 },
                                        }}
                                      >
                                        {dept.receiptNumber}
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          width: columns[4].width,
                                          fontSize: { xs: 11, sm: 13 },
                                        }}
                                      >
                                        {dept.referenceNumber}
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          width: columns[5].width,
                                          fontSize: { xs: 11, sm: 13 },
                                        }}
                                      >
                                        {dept.workingDays}
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          width: columns[6].width,
                                          fontSize: { xs: 11, sm: 13 },
                                        }}
                                      >
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
                                        sx={{ fontSize: { xs: 12, sm: 14 } }}
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
            sx={{
              borderTop: "1px solid #eee",
              "& .MuiTablePagination-toolbar": {
                fontSize: { xs: 12, sm: 14 },
                minHeight: { xs: 48, sm: 52 },
              },
              "& .MuiTablePagination-selectLabel": {
                fontSize: { xs: 12, sm: 14 },
              },
              "& .MuiTablePagination-displayedRows": {
                fontSize: { xs: 12, sm: 14 },
              },
            }}
          />
        </Box>
      </div>
    </Container>
  );
};

export default TableListCollaps;
