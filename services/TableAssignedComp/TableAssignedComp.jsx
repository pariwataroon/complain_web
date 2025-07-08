import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Container,
  useMediaQuery,
  Typography,
  IconButton,
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import styles from "./TableAssignedComp.module.scss";
import ExportButton from "@services/ExportButton/ExportButton";
import InputText from "@services/InputText/InputText";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { exportElementToPDF } from "@utils/exportPDF";

// Setup dayjs with Buddhist Era
dayjs.extend(buddhistEra);
dayjs.locale("th");

const TableAssignedComp = ({
  rows = [],
  handleRowClick,
  onSearch = () => {},
  onClearSearch = () => {},
  searchFilters = {
    claimantName: "",
    subject: "",
    docNo4: "",
    receiveDate: null,
  },
  onFilterChange = () => {},
  title = "รายการข้อมูล",
}) => {
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Ref สำหรับ export PDF
  const tableRef = useRef(null);

  const handleExportPDF = () => {
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `รายงาน${title}_${today}.pdf`;
    exportElementToPDF(tableRef, filename);
  };

  // Custom breakpoint สำหรับ 1350px
  const isBelow1350 = useMediaQuery("(max-width: 1350px)");
  const isExtraSmall = useMediaQuery("(max-width:640px)");
  const isSmall = useMediaQuery("(max-width:768px)");
  const isMedium = useMediaQuery("(max-width:1024px)");

  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [rows]);

  const handleFilterChange = (field) => (e) => {
    let value;

    if (field === "receiveDate") {
      // For date picker, pass the value directly
      value = e;
      console.log("DatePicker returned value:", e);
    } else {
      // For regular inputs, get the value from event target
      value = e?.target ? e.target.value : e;
    }

    onFilterChange(field, value);
  };

  const handleSearchClick = () => {
    setPage(0);
    onSearch(searchFilters); // Pass the current searchFilters
  };

  const handleClearSearch = () => {
    setPage(0);
    onClearSearch();
  };

  // Dynamic layout configuration
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
    } else {
      return {
        layout: "single-row",
        fieldsPerRow: 4,
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

  const renderFilterField = (field, label, type = "text") => {
    const commonProps = {
      fullWidth: true,
      label: label,
      value: searchFilters[field] || "",
      onChange: handleFilterChange(field),
      size: "small",
      sx: getFilterFieldStyles(),
    };

    if (type === "date") {
      return (
        <DateThaiPickerService
          {...commonProps}
          value={searchFilters[field]}
          placeholder="กรุณาเลือกวันที่....."
        />
      );
    }

    return <InputText {...commonProps} />;
  };

  // Update the date formatting function in TableAssignedComp.jsx
  const formatThaiDate = (dateString) => {
    if (!dateString) return "-";

    // Use dayjs with timezone
    return dayjs(dateString)
      .tz("Asia/Bangkok") // Ensure we're in Thai timezone
      .format("D MMM BBBB"); // BBBB gives Buddhist Era year
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
        position: "relative",
      }}
    >
      {/* Header Bar */}
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
            onClick={handleExportPDF}
            sx={{
              fontSize: isExtraSmall ? "12px" : "14px",
              minWidth: isExtraSmall ? "120px" : "auto",
            }}
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
              {renderFilterField("claimantName", "ชื่อผู้ร้อง")}
              {renderFilterField("subject", "ชื่อเรื่อง")}
              {renderFilterField("docNo4", "เลขที่ สรร.")}
              {renderFilterField("receiveDate", "วันที่รับเรื่อง", "date")}
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
                  bgcolor: "#dc3545",
                  color: "#fff",
                  "&:hover": { bgcolor: "#c82333", transform: "scale(1.05)" },
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
              {renderFilterField("claimantName", "ชื่อผู้ร้อง")}
              {renderFilterField("subject", "ชื่อเรื่อง")}
              {renderFilterField("docNo4", "เลขที่ สรร.")}
            </Box>

            {/* Second Row - Last field + Search Buttons */}
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
              {/* Date field */}
              <Box
                sx={{
                  flex: "1 1 0",
                  minWidth: 0,
                }}
              >
                {renderFilterField("receiveDate", "วันที่รับเรื่อง", "date")}
              </Box>

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
                    bgcolor: "#dc3545",
                    color: "#fff",
                    "&:hover": { bgcolor: "#c82333", transform: "scale(1.05)" },
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
        ) : (
          // Single Row Layout (Large screens)
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
            <Box
              sx={{
                flex: "1 1 0",
                minWidth: "140px",
                maxWidth: "200px",
              }}
            >
              {renderFilterField("claimantName", "ชื่อผู้ร้อง")}
            </Box>
            <Box
              sx={{
                flex: "1 1 0",
                minWidth: "140px",
                maxWidth: "200px",
              }}
            >
              {renderFilterField("subject", "ชื่อเรื่อง")}
            </Box>
            <Box
              sx={{
                flex: "1 1 0",
                minWidth: "140px",
                maxWidth: "200px",
              }}
            >
              {renderFilterField("docNo4", "เลขที่ สรร.")}
            </Box>
            <Box
              sx={{
                flex: "1 1 0",
                minWidth: "140px",
                maxWidth: "200px",
              }}
            >
              {renderFilterField("receiveDate", "วันที่รับเรื่อง", "date")}
            </Box>

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
                  bgcolor: "#dc3545",
                  color: "#fff",
                  "&:hover": { bgcolor: "#c82333", transform: "scale(1.05)" },
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

      {/* Clean Modern Table */}
      <Box
        ref={tableRef}
        sx={{
          mx: isExtraSmall ? 1 : 3,
          mb: 3,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
          border: "1px solid #f1f3f4",
          // Responsive overflow handling
          overflowX: isBelow1350 ? "auto" : "visible",
          "&::-webkit-scrollbar": {
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f8f9fa",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#dee2e6",
            borderRadius: "3px",
            "&:hover": {
              backgroundColor: "#adb5bd",
            },
          },
        }}
      >
        <Table
          sx={{
            minWidth: isBelow1350 ? 1400 : "100%",
            backgroundColor: "#fff",
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#f8f9fa",
                "& th": {
                  borderBottom: "1px solid #e9ecef",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#495057",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: "16px 20px",
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableCell align="center" sx={{ width: 80, minWidth: 80 }}>
                ลำดับ
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 200 : "auto",
                  minWidth: isBelow1350 ? 200 : "auto",
                }}
              >
                ชื่อผู้ร้อง
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 300 : "auto",
                  minWidth: isBelow1350 ? 300 : "auto",
                }}
              >
                ชื่อเรื่อง
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 160 : "auto",
                  minWidth: isBelow1350 ? 160 : "auto",
                }}
              >
                เลขที่ สรร.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 180 : "auto",
                  minWidth: isBelow1350 ? 180 : "auto",
                }}
              >
                เลขที่ สป.กค.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 180 : "auto",
                  minWidth: isBelow1350 ? 180 : "auto",
                }}
              >
                เลขที่ สป.สร.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 180 : "auto",
                  minWidth: isBelow1350 ? 180 : "auto",
                }}
              >
                เลขที่ สตป.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 160 : "auto",
                  minWidth: isBelow1350 ? 160 : "auto",
                }}
              >
                วันที่รับเรื่อง
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{
                    padding: "60px 20px",
                    borderBottom: "none",
                  }}
                >
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap={2}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        backgroundColor: "#f8f9fa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography sx={{ fontSize: "24px", color: "#6c757d" }}>
                        📄
                      </Typography>
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#6c757d",
                        fontWeight: 500,
                        fontSize: "16px",
                      }}
                    >
                      ไม่พบข้อมูลที่ค้นหา
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#adb5bd",
                        fontSize: "14px",
                      }}
                    >
                      กรุณาลองปรับเปลี่ยนเงื่อนไขการค้นหา
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, idx) => (
                  <TableRow
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    sx={{
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f3f4",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "#f8f9fa",
                      },
                      "&:last-child": {
                        borderBottom: "none",
                      },
                      "& td": {
                        borderBottom: "none",
                        padding: "16px 20px",
                        fontSize: "14px",
                        color: "#495057",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
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
                      }}
                    >
                      {page * rowsPerPage + idx + 1}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 200 : "auto",
                        minWidth: isBelow1350 ? 200 : "auto",
                      }}
                    >
                      {item.name ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 300 : "auto",
                        minWidth: isBelow1350 ? 300 : "auto",
                      }}
                    >
                      {item.subject ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 160 : "auto",
                        minWidth: isBelow1350 ? 160 : "auto",
                      }}
                    >
                      {item.docNo4 ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 180 : "auto",
                        minWidth: isBelow1350 ? 180 : "auto",
                      }}
                    >
                      {item.docNo ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 180 : "auto",
                        minWidth: isBelow1350 ? 180 : "auto",
                      }}
                    >
                      {item.docNo2 ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 180 : "auto",
                        minWidth: isBelow1350 ? 180 : "auto",
                      }}
                    >
                      {item.docNo3 ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 160 : "auto",
                        minWidth: isBelow1350 ? 160 : "auto",
                      }}
                    >
                      {/* Use formatThaiDate to display date in Buddhist Era */}
                      {formatThaiDate(item.receiveDate)}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>

        {/* Clean Modern Pagination */}
        <Box
          sx={{
            borderTop: "1px solid #f1f3f4",
            backgroundColor: "#fafbfc",
          }}
        >
          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 25, 50]}
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{
              "& .MuiTablePagination-toolbar": {
                padding: "12px 20px",
                minHeight: "auto",
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  fontSize: "14px",
                  color: "#6c757d",
                  fontWeight: 500,
                },
              "& .MuiTablePagination-select": {
                fontSize: "14px",
                backgroundColor: "#fff",
                border: "1px solid #e9ecef",
                borderRadius: "6px",
                padding: "4px 8px",
                "&:focus": {
                  backgroundColor: "#fff",
                  borderColor: "#1120a3",
                },
              },
              "& .MuiTablePagination-actions": {
                marginLeft: "16px",
                "& button": {
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
                  backgroundColor: "#fff",
                  color: "#6c757d",
                  "&:hover": {
                    backgroundColor: "#f8f9fa",
                    borderColor: "#1120a3",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "#f8f9fa",
                    borderColor: "#e9ecef",
                    color: "#adb5bd",
                  },
                },
              },
            }}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default TableAssignedComp;
