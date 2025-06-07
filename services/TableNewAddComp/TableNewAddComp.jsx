import React, { useState, useMemo, useRef } from "react";
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";

import styles from "./TableNewAddComp.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import ButtonService from "@services/ButtonService/ButtonService";
import { exportElementToPDF } from "@utils/exportPDF";

const TableNewAddComp = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
  filterFields = [],
  actionButtonLabel = "",
  onActionClick = () => {},
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
  const isSm = useMediaQuery(theme.breakpoints.down("md")); // < 900px
  const isBelow1200 = useMediaQuery("(max-width:1200px)");
  const isBelow1300 = useMediaQuery("(max-width:1300px)");

  // 1) initial filters จาก props.filterFields
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  // 2) handle input change
  const handleChange = (field) => (e) =>
    setFilters({ ...filters, [field]: e?.target ? e.target.value : e });

  // 3) pagination
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

  // 4) search / clear
  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearSearch = () => {
    setFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
  };

  // 5) row click → navigate
  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  // 6) กำหนดคอลัมน์ ให้ name map กับ item[name] ตาม label
  const columns = [
    { name: "receiveDate", label: "วันที่รับเรื่อง", width: 150 },
    { name: "receiptNumber", label: "เลข สรร.", width: 150 },
    { name: "claimantName", label: "ชื่อ - สกุล (ผู้ร้อง)", width: 220 },
    {
      name: "responsibleOfficer",
      label: "เจ้าหน้าที่ผู้รับผิดชอบ",
      width: 200,
    },
    { name: "agency", label: "หน่วยงาน", width: 180 },
    { name: "issueType", label: "ประเภทเรื่อง", width: 200 },
    { name: "note", label: "หมายเหตุ", width: 250 },
  ];

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
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
      >
        <Box />
      </Box>

      {/* Title and Action Buttons */}
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

          {/* Action and Export buttons section - separate for mobile/tablet */}
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
              flexDirection={{ xs: "column", sm: "row" }} // ← xs=column, sm+=row
              gap={{ xs: 1.5, sm: 1 }}
              justifyContent="center"
              alignItems="center"
            >
              {/* Action Button */}
              {actionButtonLabel && (
                <ButtonService
                  label={actionButtonLabel}
                  iconLeft={
                    <img
                      src="/icons/write.png"
                      alt="เขียน"
                      style={{ width: 16, height: 16 }}
                    />
                  }
                  color="#1120A3"
                  variant="contained"
                  onClick={onActionClick}
                  size={isXs ? "small" : "medium"}
                  sx={{
                    minWidth: { xs: "200px", sm: "150px" },
                    width: { xs: "100%", sm: "auto" },
                    maxWidth: { xs: "250px", sm: "none" },
                    height: { xs: "36px", sm: "40px" },
                  }}
                />
              )}

              {/* Export Buttons */}
              {isXs ? (
                // XS - แยกบรรทัด
                <>
                  <ExportButton
                    label="Export PDF"
                    onClick={() =>
                      exportElementToPDF(
                        pdfRef,
                        "รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่ม.pdf"
                      )
                    }
                    size="small"
                    sx={{
                      minWidth: "200px",
                      width: "100%",
                      maxWidth: "250px",
                    }}
                  />
                  <ExportButton
                    label="Export Excel"
                    size="small"
                    sx={{
                      minWidth: "200px",
                      width: "100%",
                      maxWidth: "250px",
                    }}
                  />
                </>
              ) : (
                // SM+ - อยู่แถวเดียวกัน
                <Box
                  display="flex"
                  gap={1}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: { xs: "center", sm: "flex-start" },
                  }}
                >
                  <ExportButton
                    label="Export PDF"
                    onClick={() =>
                      exportElementToPDF(
                        pdfRef,
                        "รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่ม.pdf"
                      )
                    }
                    size="medium"
                    sx={{
                      minWidth: "120px",
                      width: "auto",
                    }}
                  />
                  <ExportButton
                    label="Export Excel"
                    size="medium"
                    sx={{
                      minWidth: "120px",
                      width: "auto",
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </>
      ) : (
        // Desktop Layout - Title and Buttons in same row
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

          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              flex: "0 0 auto",
            }}
          >
            {/* Action Button */}
            {actionButtonLabel && (
              <ButtonService
                label={actionButtonLabel}
                iconLeft={
                  <img
                    src="/icons/write.png"
                    alt="เขียน"
                    style={{ width: 20, height: 20 }}
                  />
                }
                color="#1120A3"
                variant="contained"
                onClick={onActionClick}
                sx={{
                  height: "40px",
                  minWidth: "150px",
                  mr: 1,
                }}
              />
            )}

            {/* Export Buttons - แถวเดียวกันใน Desktop */}
            <ExportButton
              label="Export PDF"
              onClick={() =>
                exportElementToPDF(
                  pdfRef,
                  "รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่ม.pdf"
                )
              }
              size="medium"
            />
            <ExportButton label="Export Excel" size="medium" />
          </Box>
        </Box>
      )}

      {/* Filters + Search */}
      <Box
        width="100%"
        px={{ xs: 1.5, sm: 2 }}
        py={{ xs: 1.5, sm: 1 }}
        sx={{
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {isSm || isBelow1300 ? (
          // Mobile, Tablet & Small Desktop Layout (< 1300px) - Grid Layout
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
              sx={{
                mb: { xs: 2, sm: 2 },
                width: "100%",
                maxWidth: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
                "& > div": {
                  minWidth: 0,
                  maxWidth: "100%",
                  overflow: "hidden",
                  boxSizing: "border-box",
                  position: "relative",
                },
              }}
            >
              {filterFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: 0,
                    maxWidth: "100%",
                    width: "100%",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    position: "relative",
                  }}
                >
                  {f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size={isXs ? "small" : "medium"}
                      sx={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        "& .MuiFormControl-root": {
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                        },
                      }}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size={isXs ? "small" : "medium"}
                      sx={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        "& .MuiFormControl-root": {
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                        },
                      }}
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
          // Large Desktop Layout (>= 1300px) - Horizontal Layout
          <Box
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            sx={{
              width: "100%",
              maxWidth: "100%",
              overflow: "hidden",
              boxSizing: "border-box",
              position: "relative",
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{
                flexGrow: 1,
                minWidth: 0,
                maxWidth: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              {filterFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    flex: "1 1 140px",
                    minWidth: "140px",
                    maxWidth: "200px",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    position: "relative",
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
                      sx={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        "& .MuiFormControl-root": {
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                        },
                      }}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="medium"
                      sx={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        "& .MuiFormControl-root": {
                          width: "100%",
                          maxWidth: "100%",
                          boxSizing: "border-box",
                        },
                      }}
                    />
                  )}
                </Box>
              ))}

              <Box
                display="flex"
                gap={1}
                sx={{
                  flexShrink: 0,
                  ml: 1,
                }}
              >
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
            </Box>
          </Box>
        )}
      </Box>

      {/* Data Table */}
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
                    fontWeight: 600,
                    color: "#1120a3",
                  }}
                >
                  ลำดับ
                </TableCell>
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
                    sx={{
                      width: { xs: 60, sm: 80 },
                      fontWeight: 600,
                      color: "#1120A3",
                      fontSize: { xs: 12, sm: 14 },
                    }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
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

TableNewAddComp.propTypes = {
  data: PropTypes.array,
  title: PropTypes.string,
  navigateTo: PropTypes.string,
  onSearch: PropTypes.func,
  filterFields: PropTypes.array,
  actionButtonLabel: PropTypes.string,
  onActionClick: PropTypes.func,
};

TableNewAddComp.defaultProps = {
  data: [],
  title: "",
  navigateTo: "",
  onSearch: () => {},
  filterFields: [],
  actionButtonLabel: "",
  onActionClick: () => {},
};

export default TableNewAddComp;
