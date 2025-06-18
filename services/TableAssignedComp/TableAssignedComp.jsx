import React, { useState, useEffect } from "react";
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
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import styles from "./TableAssignedComp.module.scss";
import ExportButton from "@services/ExportButton/ExportButton";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";

dayjs.locale("th");

const TableAssignedComp = ({
  rows = [],
  handleRowClick,
  onSearch = () => { },
  onClearSearch = () => { },
  searchFilters = {
    claimantName: "",
    subject: "",
    docNo4: "",
    receiveDate: null,
  },
  onFilterChange = () => { },
  title = "รายการข้อมูล",
}) => {
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Filter handlers - ส่งกลับไปยัง parent
  const handleFilterChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    onFilterChange(field, value);
  };

  const handleSearchClick = () => {
    setPage(0);
    onSearch();
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
              {renderFilterField("claimantName", "ชื่อผู้ร้องเรียน")}
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
              {renderFilterField("claimantName", "ชื่อผู้ร้องเรียน")}
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
              {renderFilterField("claimantName", "ชื่อผู้ร้องเรียน")}
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

      {/* Data Table */}
      <Box
        sx={{
          mt: 2,
          // Responsive overflow handling
          overflowX: isBelow1350 ? "auto" : "visible",
          overflowY: "visible",
          position: "relative",
          px: isExtraSmall ? 1 : 2,
          pb: 1,
          // เพิ่ม scrollbar styling สำหรับ webkit browsers
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
        className={styles.tableWrapper}
      >
        <Table
          sx={{
            minWidth: isBelow1350 ? 1400 : "100%",
            width: "100%",
            tableLayout: isBelow1350 ? "auto" : "fixed",
          }}
        >
          <TableHead className={styles.tableHead}>
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
                  fontSize: "14px",
                  padding: "14px 12px",
                }}
                className={styles.headerCell}
              >
                ลำดับ
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 200 : "auto",
                  minWidth: isBelow1350 ? 200 : "auto",
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                className={styles.headerCell}
              >
                ชื่อผู้ร้อง
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 300 : "auto",
                  minWidth: isBelow1350 ? 300 : "auto",
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                className={styles.headerCell}
              >
                ชื่อเรื่อง
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 160 : "auto",
                  minWidth: isBelow1350 ? 160 : "auto",
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                className={styles.headerCell}
              >
                เลขที่ สรร.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 180 : "auto",
                  minWidth: isBelow1350 ? 180 : "auto",
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                className={styles.headerCell}
              >
                เลขที่ สป.กค.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 180 : "auto",
                  minWidth: isBelow1350 ? 180 : "auto",
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                className={styles.headerCell}
              >
                เลขที่ สป.สร.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 180 : "auto",
                  minWidth: isBelow1350 ? 180 : "auto",
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                className={styles.headerCell}
              >
                เลขที่ สตป.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 160 : "auto",
                  minWidth: isBelow1350 ? 160 : "auto",
                  backgroundColor: "#e8e9f6",
                  fontWeight: 600,
                  color: "#1120a3",
                  border: "1px solid #e0e0e0",
                  fontSize: "14px",
                  padding: "14px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                className={styles.headerCell}
              >
                วันที่รับเรื่อง
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ padding: "40px" }}>
                  <Typography variant="body1" color="textSecondary">
                    ไม่พบข้อมูลที่ค้นหา
                  </Typography>
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
                      "&:hover": {
                        backgroundColor: "#f5f7ff",
                        transform: "scale(1.001)",
                        transition: "all 0.2s ease-in-out",
                      },
                    }}
                    className={styles.tableRow}
                  >
                    <TableCell
                      align="center"
                      sx={{
                        width: 80,
                        minWidth: 80,
                        fontWeight: 600,
                        color: "#1120A3",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px",
                        padding: "14px 12px",
                      }}
                    >
                      {page * rowsPerPage + idx + 1}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 200 : "auto",
                        minWidth: isBelow1350 ? 200 : "auto",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px",
                        padding: "14px 12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 300 : "auto",
                        minWidth: isBelow1350 ? 300 : "auto",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px",
                        padding: "14px 12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.subject ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 160 : "auto",
                        minWidth: isBelow1350 ? 160 : "auto",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px",
                        padding: "14px 12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.docNo4 ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 180 : "auto",
                        minWidth: isBelow1350 ? 180 : "auto",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px",
                        padding: "14px 12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.docNo ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 180 : "auto",
                        minWidth: isBelow1350 ? 180 : "auto",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px",
                        padding: "14px 12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.docNo2 ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 180 : "auto",
                        minWidth: isBelow1350 ? 180 : "auto",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px",
                        padding: "14px 12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.docNo3 ?? "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: isBelow1350 ? 160 : "auto",
                        minWidth: isBelow1350 ? 160 : "auto",
                        border: "1px solid #e0e0e0",
                        fontSize: "14px",
                        padding: "14px 12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.receiveDate
                        ? dayjs(item.receiveDate).format("D MMM YYYY")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25]}
          count={rows.length}
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

export default TableAssignedComp;