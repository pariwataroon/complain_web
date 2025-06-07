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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import styles from "./TableListStaffNoti.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import { exportElementToPDF } from "@utils/exportPDF";

const TableListStaffNoti = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
  filterFields = [],
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const theme = useTheme();

  // ← Dynamic responsive breakpoints
  const isExtraSmall = useMediaQuery("(max-width:640px)");
  const isSmall = useMediaQuery("(max-width:768px)");
  const isMedium = useMediaQuery("(max-width:1024px)");
  const isLarge = useMediaQuery("(max-width:1280px)");
  const isXL = useMediaQuery("(max-width:1536px)");
  const needsScrollbar = useMediaQuery("(max-width:1560px)");

  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);

  const handleChange = (field) => (e) =>
    setFilters({ ...filters, [field]: e?.target ? e.target.value : e });

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

  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearSearch = () => {
    setFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
  };

  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  const columns = [
    { name: "claimantName", label: "ชื่อ - สกุล (ผู้ร้อง)", width: 200 },
    { name: "issue", label: "ชื่อเรื่อง", width: 200 },
    {
      name: "responsibleOfficer",
      label: "เจ้าหน้าที่ผู้รับผิดชอบ",
      width: 200,
    },
    { name: "receiptNumber", label: "เลข สรร.", width: 150 },
    {
      name: "officerReceiveDate",
      label: "วันที่เจ้าหน้าที่รับเรื่อง",
      width: 180,
    },
    { name: "issueType", label: "หัวข้อ", width: 250 },
    { name: "countTimes", label: "จำนวนครั้ง", width: 120 },
  ];

  // ← Dynamic layout calculation
  const getLayoutConfig = () => {
    if (isExtraSmall) {
      return {
        layout: "stacked",
        fieldsPerRow: 1,
        fieldWidth: "100%",
        buttonSize: "small",
        gap: 1,
        padding: 1,
      };
    } else if (isSmall) {
      return {
        layout: "stacked",
        fieldsPerRow: 2,
        fieldWidth: "calc(50% - 4px)",
        buttonSize: "small",
        gap: 1,
        padding: 1.5,
      };
    } else if (isMedium) {
      return {
        layout: "hybrid",
        fieldsPerRow: 3,
        fieldWidth: "calc(33.33% - 6px)",
        buttonSize: "medium",
        gap: 1.5,
        padding: 2,
      };
    } else if (isLarge) {
      return {
        layout: "single-row",
        fieldsPerRow: filterFields.length,
        fieldWidth: "auto",
        buttonSize: "medium",
        gap: 1.5,
        padding: 2,
      };
    } else {
      return {
        layout: "single-row",
        fieldsPerRow: filterFields.length,
        fieldWidth: "auto",
        buttonSize: "medium",
        gap: 2,
        padding: 2,
      };
    }
  };

  const layoutConfig = getLayoutConfig();

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
        overflow: "visible",
      }}
    >
      {/* Title */}
      <Box
        className={styles.headerBar}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          fontSize: isExtraSmall ? "14px" : isSmall ? "16px" : "18px",
          padding: isExtraSmall ? "0 12px" : isSmall ? "0 16px" : "0 24px",
          height: isExtraSmall ? "40px" : isSmall ? "44px" : "50px",
        }}
      >
        <Box>{title}</Box>
      </Box>

      {/* Dynamic Responsive Filters */}
      <Box
        width="100%"
        px={layoutConfig.padding}
        py={layoutConfig.padding}
        sx={{
          overflow: "visible",
          boxSizing: "border-box",
        }}
      >
        {layoutConfig.layout === "stacked" ? (
          // ← Stacked Layout (Mobile/Small screens)
          <>
            {/* Filter Fields */}
            <Box
              display="grid"
              gridTemplateColumns={`repeat(${layoutConfig.fieldsPerRow}, 1fr)`}
              gap={layoutConfig.gap}
              mb={2}
              sx={{
                overflow: "visible",
                width: "100%",
              }}
            >
              {filterFields.map((f) => (
                <Box key={f.name} sx={{ minWidth: 0 }}>
                  {f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="small"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="small"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "40px",
                        },
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>

            {/* Search Buttons */}
            <Box display="flex" justifyContent="center" gap={1} mb={2}>
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <SearchOffIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Export Buttons */}
            <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf"
                  )
                }
                size={layoutConfig.buttonSize}
                sx={{
                  minWidth: isExtraSmall ? "100px" : "120px",
                  height: "40px",
                  fontSize: "12px",
                }}
              />
              <ExportButton
                label="Export Excel"
                size={layoutConfig.buttonSize}
                sx={{
                  minWidth: isExtraSmall ? "100px" : "120px",
                  height: "40px",
                  fontSize: "12px",
                }}
              />
            </Box>
          </>
        ) : layoutConfig.layout === "hybrid" ? (
          // ← Hybrid Layout (Medium screens)
          <>
            {/* Filter Fields + Search Buttons */}
            <Box
              display="grid"
              gridTemplateColumns={`repeat(${Math.min(
                layoutConfig.fieldsPerRow,
                filterFields.length
              )}, 1fr) auto auto`}
              gap={layoutConfig.gap}
              alignItems="end"
              mb={2}
              sx={{
                overflow: "visible",
                width: "100%",
              }}
            >
              {filterFields.map((f) => (
                <Box key={f.name} sx={{ minWidth: 0 }}>
                  {f.type === "select" ? (
                    <SelectField
                      fullWidth
                      label={f.label}
                      options={f.options}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="small"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "44px",
                        },
                      }}
                    />
                  ) : (
                    <InputText
                      fullWidth
                      label={f.label}
                      value={filters[f.name]}
                      onChange={handleChange(f.name)}
                      size="small"
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "44px",
                        },
                      }}
                    />
                  )}
                </Box>
              ))}

              {/* Search Buttons */}
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <SearchIcon />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <SearchOffIcon />
              </IconButton>
            </Box>

            {/* Export Buttons */}
            <Box display="flex" justifyContent="center" gap={1}>
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf"
                  )
                }
                size={layoutConfig.buttonSize}
                sx={{
                  minWidth: "120px",
                  height: "44px",
                  fontSize: "14px",
                }}
              />
              <ExportButton
                label="Export Excel"
                size={layoutConfig.buttonSize}
                sx={{
                  minWidth: "120px",
                  height: "44px",
                  fontSize: "14px",
                }}
              />
            </Box>
          </>
        ) : (
          // ← Single Row Layout (Large screens)
          <Box
            display="flex"
            alignItems="end"
            justifyContent="space-between"
            gap={layoutConfig.gap}
            sx={{
              overflow: "visible",
              flexWrap: isLarge ? "wrap" : "nowrap",
            }}
          >
            {/* Left Section: Filters + Search */}
            <Box
              display="flex"
              alignItems="end"
              gap={layoutConfig.gap}
              sx={{
                flexGrow: 1,
                overflow: "visible",
                minWidth: 0,
                flexWrap: isLarge ? "wrap" : "nowrap",
              }}
            >
              {filterFields.map((f, index) => (
                <Box
                  key={f.name}
                  sx={{
                    flex: isLarge
                      ? `1 1 ${100 / Math.min(3, filterFields.length)}%`
                      : "1 1 0",
                    minWidth: isLarge ? "150px" : "120px",
                    maxWidth: isLarge ? "250px" : "none",
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
                        "& .MuiInputBase-root": {
                          height: "56px",
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
                        "& .MuiInputBase-root": {
                          height: "56px",
                        },
                      }}
                    />
                  )}
                </Box>
              ))}

              {/* Search Buttons */}
              <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SearchIcon />
                </IconButton>
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SearchOffIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Right Section: Export Buttons */}
            <Box
              display="flex"
              gap={1}
              sx={{
                flexShrink: 0,
                ...(isLarge && {
                  width: "100%",
                  justifyContent: "center",
                  mt: 2,
                }),
              }}
            >
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    "รายงานสรุปเรื่องร้องเรียนของหน่วยงาน.pdf"
                  )
                }
                size={layoutConfig.buttonSize}
                sx={{
                  minWidth: "120px",
                  height: "48px",
                  fontSize: "14px",
                }}
              />
              <ExportButton
                label="Export Excel"
                size={layoutConfig.buttonSize}
                sx={{
                  minWidth: "120px",
                  height: "48px",
                  fontSize: "14px",
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Data Table with conditional scrollbar */}
      <div ref={pdfRef}>
        <Box
          className={styles.tableWrapper}
          id="table-results"
          sx={{
            overflowX: needsScrollbar ? "auto" : "visible",
            px: layoutConfig.padding,
            pb: 1,
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#c1c1c1",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "#a8a8a8",
              },
            },
          }}
        >
          <Table
            sx={{
              minWidth: needsScrollbar ? 1400 : "100%",
              width: "100%",
              tableLayout: needsScrollbar ? "auto" : "fixed",
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  align="center"
                  sx={{
                    width: 80,
                    minWidth: 80,
                    backgroundColor: "#e8e9f6",
                    fontWeight: 600,
                    color: "#1120a3",
                    border: "1px solid #e0e0e0",
                    fontSize: isExtraSmall ? "11px" : isSmall ? "12px" : "14px",
                    padding: isExtraSmall
                      ? "6px 2px"
                      : isSmall
                      ? "8px 4px"
                      : "14px 12px",
                  }}
                >
                  ลำดับ
                </TableCell>
                {columns.map((col) => (
                  <TableCell
                    key={col.name}
                    sx={{
                      width: needsScrollbar ? col.width : "auto",
                      minWidth: needsScrollbar ? col.width : "auto",
                      backgroundColor: "#e8e9f6",
                      fontWeight: 600,
                      color: "#1120a3",
                      border: "1px solid #e0e0e0",
                      fontSize: isExtraSmall
                        ? "11px"
                        : isSmall
                        ? "12px"
                        : "14px",
                      padding: isExtraSmall
                        ? "6px 2px"
                        : isSmall
                        ? "8px 4px"
                        : "14px 12px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
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
                    "&:hover": {
                      backgroundColor: "#f5f7ff",
                      transform: "scale(1.001)",
                      transition: "all 0.2s ease-in-out",
                    },
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{
                      width: 80,
                      minWidth: 80,
                      fontWeight: 600,
                      color: "#1120A3",
                      border: "1px solid #e0e0e0",
                      fontSize: isExtraSmall
                        ? "10px"
                        : isSmall
                        ? "11px"
                        : "14px",
                      padding: isExtraSmall
                        ? "4px 2px"
                        : isSmall
                        ? "6px 4px"
                        : "14px 12px",
                    }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell
                      key={col.name}
                      sx={{
                        width: needsScrollbar ? col.width : "auto",
                        minWidth: needsScrollbar ? col.width : "auto",
                        border: "1px solid #e0e0e0",
                        fontSize: isExtraSmall
                          ? "10px"
                          : isSmall
                          ? "11px"
                          : "14px",
                        padding: isExtraSmall
                          ? "4px 2px"
                          : isSmall
                          ? "6px 4px"
                          : "14px 12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
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
                fontSize: isExtraSmall ? "11px" : isSmall ? "12px" : "14px",
                padding: isExtraSmall ? "6px" : isSmall ? "8px" : "16px",
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  fontSize: isExtraSmall ? "11px" : isSmall ? "12px" : "14px",
                },
            }}
          />
        </Box>
      </div>
    </Container>
  );
};

export default TableListStaffNoti;
