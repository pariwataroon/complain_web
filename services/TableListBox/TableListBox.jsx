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
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import { exportElementToPDF } from "@utils/exportPDF";

import styles from "./TableListBox.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";

/**
 * props:
 * - data: array of objects
 * - title: table title
 * - navigateTo: base path for row click (item.id appended)
 * - onRowClick: custom function for row click (optional)
 * - onSearch: function(filters) => void
 * - filterFields: [{ name, label, type, options? }]
 */
const TableListBox = ({
  data = [],
  title = "",
  navigateTo = "",
  onRowClick, // เพิ่ม prop สำหรับ custom row click
  onSearch = () => {},
  filterFields = [],
}) => {
  const router = useRouter();
  const tableRef = useRef(null);

  // Updated responsive breakpoints starting from 1305px
  const isExtraSmall = useMediaQuery("(max-width:640px)");
  const isSmall = useMediaQuery("(max-width:768px)");
  const isMedium = useMediaQuery("(max-width:1024px)");
  const isLarge = useMediaQuery("(max-width:1305px)"); // New breakpoint for responsive filters
  const needsScrollbar = useMediaQuery("(max-width:1200px)");

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

  // PDF Export handler
  const handleExportPDF = () => {
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `รายงาน${title}_${today}.pdf`;
    exportElementToPDF(tableRef, filename);
  };

  // row click - แก้ไขให้รองรับ custom onRowClick
  const handleRowClick = (item) => {
    if (onRowClick) {
      // ถ้ามี custom onRowClick ให้ใช้แทน
      onRowClick(item);
    } else if (navigateTo) {
      // ถ้าไม่มี custom onRowClick ให้ใช้ navigateTo แบบเดิม
      router.push(`${navigateTo}/${item.id}`);
    }
  };

  const columns = [
    { name: "receiveDate", label: "วันที่ร้อง", width: 100 },
    { name: "agency", label: "หน่วยงาน", width: 180 },
    { name: "claimantName", label: "ชื่อสกุลผู้ร้อง", width: 200 },
    { name: "issue", label: "เรื่อง", width: 300 },
    { name: "issueType", label: "ประเภทเรื่อง", width: 180 },
    { name: "subIssueType", label: "ประเภทเรื่องย่อย", width: 180 }, // แก้จาก issueSubType → subIssueType
    { name: "responsibleOfficer", label: "เจ้าหน้าที่รับผิดชอบ", width: 180 },
    { name: "status", label: "สถานะเรื่อง", width: 150 },
    { name: "note", label: "หมายเหตุ", width: 100 },
  ];

  // Updated dynamic layout configuration with new breakpoint
  const getLayoutConfig = () => {
    if (isExtraSmall) {
      return {
        layout: "stacked",
        fieldsPerRow: 1,
        gap: 1,
        padding: 1,
        inputHeight: "40px",
        iconSize: 36,
      };
    } else if (isSmall) {
      return {
        layout: "stacked",
        fieldsPerRow: 2,
        gap: 1,
        padding: 1.5,
        inputHeight: "40px",
        iconSize: 40,
      };
    } else if (isMedium) {
      return {
        layout: "two-row",
        fieldsPerRow: 3,
        gap: 1.5,
        padding: 2,
        inputHeight: "40px",
        iconSize: 40,
      };
    } else if (isLarge) {
      // New responsive layout for screens 1025px - 1305px
      return {
        layout: "large-responsive",
        fieldsPerRow: Math.min(4, filterFields.length),
        gap: 1.5,
        padding: 2,
        inputHeight: "40px",
        iconSize: 40,
      };
    } else {
      // Only for screens larger than 1305px
      return {
        layout: "single-row",
        fieldsPerRow: filterFields.length,
        gap: 1.5,
        padding: 2,
        inputHeight: "40px",
        iconSize: 40,
      };
    }
  };

  const layoutConfig = getLayoutConfig();

  // Common filter field styles
  const getFilterFieldStyles = () => ({
    "& .MuiInputBase-root": {
      height: layoutConfig.inputHeight,
    },
    "& .MuiInputLabel-root": {
      fontSize: isExtraSmall ? "13px" : "14px",
    },
    "& .MuiInputBase-input": {
      fontSize: isExtraSmall ? "13px" : "14px",
    },
  });

  const renderFilterField = (f) => {
    const commonProps = {
      fullWidth: true,
      label: f.label,
      value: filters[f.name],
      onChange: handleChange(f.name),
      size: "small",
      sx: getFilterFieldStyles(),
    };

    return f.type === "select" ? (
      <SelectField {...commonProps} options={f.options} />
    ) : (
      <InputText {...commonProps} />
    );
  };

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
      <Box
        className={styles.headerBar}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      ></Box>

      {/* Header with title and export buttons */}
      <Box
        mt={2}
        className={styles.headerBar2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={isExtraSmall ? 1 : 2}
        sx={{
          flexDirection: isExtraSmall ? "column" : "row",
          gap: isExtraSmall ? 1 : 0,
        }}
      >
        <Box
          sx={{
            fontSize: isExtraSmall ? "16px" : "18px",
            fontWeight: "bold",
            color: "#1120a3",
          }}
        >
          {title}
        </Box>

        {/* Export buttons */}
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            flexDirection: isExtraSmall ? "column" : "row",
            width: isExtraSmall ? "100%" : "auto",
          }}
        >
          <ExportButton
            label="Export PDF"
            sx={{
              fontSize: isExtraSmall ? "12px" : "14px",
              minWidth: isExtraSmall ? "120px" : "auto",
            }}
            onClick={handleExportPDF}
          />
          <ExportButton
            label="Export Excel"
            sx={{
              fontSize: isExtraSmall ? "12px" : "14px",
              minWidth: isExtraSmall ? "120px" : "auto",
            }}
          />
        </Box>
      </Box>

      {/* Responsive Filters */}
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
          // Stacked Layout (Mobile/Small screens)
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
                  {renderFilterField(f)}
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
                  width: layoutConfig.iconSize,
                  height: layoutConfig.iconSize,
                  borderRadius: "50%",
                  transition: "all 0.2s ease-in-out",
                }}
                title="ค้นหา"
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#dc3545", // เปลี่ยนเป็นสีแดง
                  color: "#fff",
                  "&:hover": { bgcolor: "#c82333", transform: "scale(1.05)" }, // สีแดงเข้มเมื่อ hover
                  width: layoutConfig.iconSize,
                  height: layoutConfig.iconSize,
                  borderRadius: "50%",
                  transition: "all 0.2s ease-in-out",
                }}
                title="ล้างการค้นหา"
              >
                <CleaningServicesIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        ) : layoutConfig.layout === "two-row" ? (
          // Two-row Layout (Medium screens)
          <>
            {/* First Row - First 3 fields */}
            <Box
              display="grid"
              gridTemplateColumns="repeat(3, 1fr)"
              gap={layoutConfig.gap}
              mb={2}
              sx={{
                overflow: "visible",
                width: "100%",
              }}
            >
              {filterFields.slice(0, 3).map((f) => (
                <Box key={f.name} sx={{ minWidth: 0 }}>
                  {renderFilterField(f)}
                </Box>
              ))}
            </Box>

            {/* Second Row - Remaining fields + Search Buttons */}
            <Box
              display="flex"
              alignItems="center"
              gap={layoutConfig.gap}
              mb={2}
              sx={{
                overflow: "visible",
                width: "100%",
              }}
            >
              {/* Remaining filter fields */}
              {filterFields.slice(3).map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    flex: "1 1 0",
                    minWidth: 0,
                  }}
                >
                  {renderFilterField(f)}
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
                    width: layoutConfig.iconSize,
                    height: layoutConfig.iconSize,
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                    mt: 1,
                  }}
                  title="ค้นหา"
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    bgcolor: "#dc3545", // เปลี่ยนเป็นสีแดง
                    color: "#fff",
                    "&:hover": { bgcolor: "#c82333", transform: "scale(1.05)" }, // สีแดงเข้มเมื่อ hover
                    width: layoutConfig.iconSize,
                    height: layoutConfig.iconSize,
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                    mt: 1,
                  }}
                  title="ล้างการค้นหา"
                >
                  <CleaningServicesIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </>
        ) : layoutConfig.layout === "large-responsive" ? (
          // Large Responsive Layout (1025px - 1305px)
          <>
            {/* First Row - First 4 fields or all if less than 4 */}
            <Box
              display="grid"
              gridTemplateColumns={`repeat(${Math.min(
                4,
                filterFields.length
              )}, 1fr)`}
              gap={layoutConfig.gap}
              mb={2}
              sx={{
                overflow: "visible",
                width: "100%",
              }}
            >
              {filterFields
                .slice(0, Math.min(4, filterFields.length))
                .map((f) => (
                  <Box key={f.name} sx={{ minWidth: 0 }}>
                    {renderFilterField(f)}
                  </Box>
                ))}
            </Box>

            {/* Second Row - Remaining fields + Search Buttons (if more than 4 fields) */}
            {filterFields.length > 4 && (
              <Box
                display="flex"
                alignItems="center"
                gap={layoutConfig.gap}
                mb={2}
                sx={{
                  overflow: "visible",
                  width: "100%",
                }}
              >
                {/* Remaining filter fields */}
                {filterFields.slice(4).map((f) => (
                  <Box
                    key={f.name}
                    sx={{
                      flex: "1 1 0",
                      minWidth: 0,
                    }}
                  >
                    {renderFilterField(f)}
                  </Box>
                ))}

                {/* Search Buttons */}
                <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
                  <IconButton
                    onClick={handleSearchClick}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": {
                        bgcolor: "#0b1580",
                        transform: "scale(1.05)",
                      },
                      width: layoutConfig.iconSize,
                      height: layoutConfig.iconSize,
                      borderRadius: "50%",
                      transition: "all 0.2s ease-in-out",
                      mt: 1,
                    }}
                    title="ค้นหา"
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={handleClearSearch}
                    sx={{
                      bgcolor: "#dc3545", // เปลี่ยนเป็นสีแดง
                      color: "#fff",
                      "&:hover": {
                        bgcolor: "#c82333", // สีแดงเข้มเมื่อ hover
                        transform: "scale(1.05)",
                      },
                      width: layoutConfig.iconSize,
                      height: layoutConfig.iconSize,
                      borderRadius: "50%",
                      transition: "all 0.2s ease-in-out",
                      mt: 1,
                    }}
                    title="ล้างการค้นหา"
                  >
                    <CleaningServicesIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Search buttons centered if 4 or fewer fields */}
            {filterFields.length <= 4 && (
              <Box display="flex" justifyContent="center" gap={1} mb={2}>
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    "&:hover": { bgcolor: "#0b1580", transform: "scale(1.05)" },
                    width: layoutConfig.iconSize,
                    height: layoutConfig.iconSize,
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                  }}
                  title="ค้นหา"
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleClearSearch}
                  sx={{
                    bgcolor: "#dc3545", // เปลี่ยนเป็นสีแดง
                    color: "#fff",
                    "&:hover": { bgcolor: "#c82333", transform: "scale(1.05)" }, // สีแดงเข้มเมื่อ hover
                    width: layoutConfig.iconSize,
                    height: layoutConfig.iconSize,
                    borderRadius: "50%",
                    transition: "all 0.2s ease-in-out",
                  }}
                  title="ล้างการค้นหา"
                >
                  <CleaningServicesIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </>
        ) : (
          // Single Row Layout (Screens larger than 1305px)
          <Box
            display="flex"
            alignItems="center"
            gap={layoutConfig.gap}
            sx={{
              overflow: "visible",
              flexWrap: "nowrap",
            }}
          >
            {/* Filter fields */}
            {filterFields.map((f) => (
              <Box
                key={f.name}
                sx={{
                  flex: "1 1 0",
                  minWidth: "140px",
                  maxWidth: "200px",
                }}
              >
                {renderFilterField(f)}
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
                  width: layoutConfig.iconSize,
                  height: layoutConfig.iconSize,
                  borderRadius: "50%",
                  transition: "all 0.2s ease-in-out",
                  mt: 1,
                }}
                title="ค้นหา"
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#dc3545", // เปลี่ยนเป็นสีแดง
                  color: "#fff",
                  "&:hover": { bgcolor: "#c82333", transform: "scale(1.05)" }, // สีแดงเข้มเมื่อ hover
                  width: layoutConfig.iconSize,
                  height: layoutConfig.iconSize,
                  borderRadius: "50%",
                  transition: "all 0.2s ease-in-out",
                  mt: 1,
                }}
                title="ล้างการค้นหา"
              >
                <CleaningServicesIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Data Table with conditional scrollbar */}
      <Box
        className={styles.tableWrapper}
        id="table-results"
        ref={tableRef}
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
        <Box
          sx={{
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid #e0e0e0",
          }}
        >
          <Table
            sx={{
              minWidth: needsScrollbar ? 1400 : "100%",
              width: "100%",
              tableLayout: needsScrollbar ? "auto" : "fixed",
              borderCollapse: "collapse",
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.name}
                    sx={{
                      width: needsScrollbar ? col.width : "auto",
                      minWidth: needsScrollbar ? col.width : "auto",
                      backgroundColor: "#e8e9f6",
                      fontWeight: 600,
                      color: "#1120a3",
                      borderBottom: "1px solid #e0e0e0",
                      borderRight: "1px solid #e0e0e0",
                      fontSize: "14px",
                      padding: "14px 12px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      "&:last-child": {
                        borderRight: "none",
                      },
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
                  {columns.map((col) => (
                    <TableCell
                      key={col.name}
                      sx={{
                        width: needsScrollbar ? col.width : "auto",
                        minWidth: needsScrollbar ? col.width : "auto",
                        borderBottom: "1px solid #e0e0e0",
                        borderRight: "1px solid #e0e0e0",
                        fontSize: "14px",
                        padding: "14px 12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        "&:last-child": {
                          borderRight: "none",
                        },
                      }}
                    >
                      {item[col.name] ?? "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

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
              fontSize: "14px",
              padding: "16px",
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                fontSize: "14px",
              },
          }}
        />
      </Box>
    </Container>
  );
};

export default TableListBox;
