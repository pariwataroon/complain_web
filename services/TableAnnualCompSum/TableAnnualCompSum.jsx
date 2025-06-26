import React, { useState, useRef } from "react";
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
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
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
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { exportElementToPDF } from "@utils/exportPDF";

// สร้าง component แยกสำหรับ date picker เพื่อป้องกัน hooks issue
const DatePickerWrapper = ({ field, value, onChange, isMobile }) => {
  return (
    <DateThaiPickerService
      label={field.label}
      value={value}
      onChange={onChange}
      size={isMobile ? "small" : "medium"}
      sx={{
        width: "100%",
        "& .MuiFormControl-root": {
          height: isMobile ? "40px" : "56px",
        },
        "& .MuiInputBase-root": {
          height: isMobile ? "40px" : "56px",
        },
        "& .MuiOutlinedInput-root": {
          height: isMobile ? "40px" : "56px",
        },
      }}
    />
  );
};

const TableAnnualCompSum = ({
  data = [],
  filterFields = [],
  onSearch = () => {},
  navigateTo = "",
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const isExtraSmall = useMediaQuery("(max-width:640px)"); // ขนาดต่ำกว่า 640px

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
    { label: "ลำดับ", width: "80px" },
    { label: "หน่วยงาน", width: "400px" },
    { label: "จำนวน", width: "120px" },
    { label: "ยุติ", width: "120px" },
    { label: "อยู่ระหว่างดำเนินการ", width: "160px" },
  ];

  // แยก date fields และ non-date fields
  const dateFields = filterFields.filter((f) => f.type === "date");
  const nonDateFields = filterFields.filter((f) => f.type !== "date");

  // สร้าง flat list ของ rows รวมทั้ง parent และ child
  const createFlatRows = (data) => {
    const flatRows = [];
    data.forEach((parentRow, parentIndex) => {
      // เพิ่ม parent row
      flatRows.push({
        ...parentRow,
        isParent: true,
        level: 0,
        displayIndex: page * rowsPerPage + parentIndex + 1,
      });

      // เพิ่ม child rows ถ้า expanded
      if (expanded[parentRow.id] && parentRow.children) {
        parentRow.children.forEach((childRow) => {
          flatRows.push({
            ...childRow,
            isParent: false,
            level: 1,
            parentId: parentRow.id,
          });
        });
      }
    });
    return flatRows;
  };

  const flatRows = createFlatRows(pagedData);

  // ตรวจสอบว่าไม่มีข้อมูล
  const hasNoData = data.length === 0;

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

      {/* Responsive Filters */}
      <Box px={isMobile ? 1 : 2} py={isMobile ? 1.5 : 2}>
        {isExtraSmall ? (
          // Extra Small Layout (< 640px) - แยกเป็น 3 บรรทัด
          <>
            {/* Filter Fields - บรรทัดแรก */}
            <Box
              display="flex"
              alignItems="flex-end"
              justifyContent="center"
              gap={1.5}
              flexWrap="wrap"
              mb={2}
            >
              {/* Non-date fields */}
              {nonDateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "140px",
                    flex: "1 1 140px",
                    maxWidth: "300px",
                  }}
                >
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

              {/* Date fields */}
              {dateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "140px",
                    flex: "1 1 140px",
                    maxWidth: "300px",
                  }}
                >
                  <DatePickerWrapper
                    field={f}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                    isMobile={true}
                  />
                </Box>
              ))}
            </Box>

            {/* Search buttons - บรรทัดที่สอง (ตรงกลาง, ไม่มี margin-top) */}
            <Box display="flex" justifyContent="center" gap={1} mb={2}>
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  "&:hover": {
                    bgcolor: "#0f1a8f",
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleClearClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  "&:hover": {
                    bgcolor: "#0f1a8f",
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <SearchOffIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Export Buttons - บรรทัดที่สาม (ตรงกลาง) - ขนาดเท่า desktop */}
            <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ.pdf"
                  )
                }
                disabled={hasNoData}
                size="medium" // ขนาดเท่า desktop
                sx={{
                  minWidth: "120px", // ขนาดเท่า desktop
                  fontSize: "14px", // ขนาดเท่า desktop
                  height: "40px", // ขนาดเท่า desktop
                  borderRadius: "8px",
                  px: 2, // ขนาดเท่า desktop
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
              <ExportButton
                label="Export Excel"
                disabled={hasNoData}
                size="medium" // ขนาดเท่า desktop
                sx={{
                  minWidth: "120px", // ขนาดเท่า desktop
                  fontSize: "14px", // ขนาดเท่า desktop
                  height: "40px", // ขนาดเท่า desktop
                  borderRadius: "8px",
                  px: 2, // ขนาดเท่า desktop
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
            </Box>
          </>
        ) : isMobile ? (
          // Mobile Layout (640px+) - แยกเป็น 2 บรรทัด
          <>
            {/* Filter Fields + Search Buttons - บรรทัดแรก */}
            <Box
              display="flex"
              alignItems="flex-end"
              gap={1.5}
              flexWrap="wrap"
              mb={2}
            >
              {/* Non-date fields */}
              {nonDateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "140px",
                    flex: "1 1 140px",
                    maxWidth: "300px",
                  }}
                >
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

              {/* Date fields */}
              {dateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "140px",
                    flex: "1 1 140px",
                    maxWidth: "300px",
                  }}
                >
                  <DatePickerWrapper
                    field={f}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                    isMobile={true}
                  />
                </Box>
              ))}

              {/* Search buttons */}
              <Box
                display="flex"
                gap={1}
                sx={{
                  alignSelf: "flex-end",
                  height: "40px",
                  alignItems: "center",
                }}
              >
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    "&:hover": {
                      bgcolor: "#0f1a8f",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleClearClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    "&:hover": {
                      bgcolor: "#0f1a8f",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SearchOffIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Export Buttons - บรรทัดที่สอง - ขนาดเท่า desktop */}
            <Box display="flex" justifyContent="center" gap={1} flexWrap="wrap">
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ.pdf"
                  )
                }
                disabled={hasNoData}
                size="medium" // ขนาดเท่า desktop
                sx={{
                  minWidth: "120px", // ขนาดเท่า desktop
                  fontSize: "14px", // ขนาดเท่า desktop
                  height: "40px", // ขนาดเท่า desktop
                  borderRadius: "8px",
                  px: 2, // ขนาดเท่า desktop
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
              <ExportButton
                label="Export Excel"
                disabled={hasNoData}
                size="medium" // ขนาดเท่า desktop
                sx={{
                  minWidth: "120px", // ขนาดเท่า desktop
                  fontSize: "14px", // ขนาดเท่า desktop
                  height: "40px", // ขนาดเท่า desktop
                  borderRadius: "8px",
                  px: 2, // ขนาดเท่า desktop
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
            </Box>
          </>
        ) : (
          // Desktop Layout - แถวเดียว
          <Box
            display="flex"
            alignItems="flex-end"
            justifyContent="space-between"
            gap={2}
            flexWrap="wrap"
          >
            {/* Filter Fields Section */}
            <Box
              display="flex"
              alignItems="flex-end"
              gap={2}
              flexWrap="wrap"
              sx={{ flexGrow: 1 }}
            >
              {/* Non-date fields */}
              {nonDateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "180px",
                    flex: "1 1 180px",
                    maxWidth: "300px",
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

              {/* Date fields */}
              {dateFields.map((f) => (
                <Box
                  key={f.name}
                  sx={{
                    minWidth: "180px",
                    flex: "1 1 180px",
                    maxWidth: "300px",
                  }}
                >
                  <DatePickerWrapper
                    field={f}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                    isMobile={false}
                  />
                </Box>
              ))}

              {/* Search buttons */}
              <Box
                display="flex"
                gap={1}
                sx={{
                  alignSelf: "flex-end",
                  height: "70px",
                  alignItems: "center",
                }}
              >
                <IconButton
                  onClick={handleSearchClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    "&:hover": {
                      bgcolor: "#0f1a8f",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleClearClick}
                  sx={{
                    bgcolor: "#1120A3",
                    color: "#fff",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    "&:hover": {
                      bgcolor: "#0f1a8f",
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <SearchOffIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Export Buttons Section */}
            <Box
              display="flex"
              gap={1}
              flexWrap="wrap"
              sx={{
                justifyContent: "flex-end",
                alignSelf: "flex-end",
                mb: 2,
              }}
            >
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(
                    pdfRef,
                    "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ.pdf"
                  )
                }
                disabled={hasNoData}
                size="medium"
                sx={{
                  minWidth: "120px",
                  fontSize: "14px",
                  height: "40px",
                  borderRadius: "8px",
                  px: 2,
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
              <ExportButton
                label="Export Excel"
                disabled={hasNoData}
                size="medium"
                sx={{
                  minWidth: "120px",
                  fontSize: "14px",
                  height: "40px",
                  borderRadius: "8px",
                  px: 2,
                  "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Title */}
      <Box
        sx={{
          backgroundColor: "#EAF5FF",
          p: isMobile ? 1.5 : 2,
          color: "#1120A3",
          textAlign: "center",
          fontSize: isMobile ? "16px" : isTablet ? "18px" : "20px",
          fontWeight: "bold",
          lineHeight: 1.4,
        }}
      >
        รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ
        <br />
        ตั้งแต่วันที่ 1 ตุลาคม 2567 ถึงวันที่ 25 พฤศจิกายน 2567
      </Box>

      {/* Summary Table */}
      <div ref={pdfRef}>
        <Box sx={{ overflowX: "auto", px: isMobile ? 1 : 2, pb: 1 }}>
          <Table
            sx={{
              minWidth: isMobile ? 700 : 1000,
              tableLayout: "fixed",
              width: "100%",
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableCell
                    key={idx}
                    sx={{
                      width: col.width,
                      backgroundColor: "#e8e9f6",
                      fontWeight: 600,
                      color: "#1120a3",
                      fontSize: isMobile ? "12px" : "14px",
                      border: "1px solid #e0e0e0",
                      padding: isMobile ? "8px 4px" : "14px 12px",
                    }}
                    align={idx === 1 ? "left" : "center"}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {hasNoData ? (
                // แสดงข้อความไม่มีข้อมูล
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    sx={{
                      textAlign: "center",
                      padding: isMobile ? "20px 10px" : "40px 20px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: isMobile ? 1 : 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: isMobile ? 40 : 60,
                          height: isMobile ? 40 : 60,
                          borderRadius: "50%",
                          backgroundColor: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: isMobile ? 0.5 : 1,
                        }}
                      >
                        <SearchIcon
                          sx={{
                            fontSize: isMobile ? 20 : 30,
                            color: "#999",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#666",
                          fontWeight: 500,
                          fontSize: isMobile ? "14px" : "16px",
                        }}
                      >
                        ไม่พบข้อมูล
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#999",
                          fontSize: isMobile ? "12px" : "14px",
                          textAlign: "center",
                          px: isMobile ? 1 : 0,
                        }}
                      >
                        ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                        <br />
                        โปรดลองปรับเปลี่ยนเงื่อนไขการค้นหา
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                // แสดงข้อมูลปกติ
                flatRows.map((row, idx) => (
                  <TableRow
                    key={`${row.id}-${row.level}`}
                    hover
                    sx={{
                      cursor: row.isParent ? "pointer" : "default",
                      backgroundColor: row.isParent ? "white" : "#FEFAEF",
                      "&:hover": {
                        backgroundColor: row.isParent ? "#f5f5f5" : "#FEF8E7",
                      },
                    }}
                    onClick={() => {
                      if (row.isParent && navigateTo) {
                        router.push(`${navigateTo}`);
                      }
                    }}
                  >
                    {/* Column 1 - ลำดับ */}
                    <TableCell
                      align="center"
                      sx={{
                        width: columns[0].width,
                        fontWeight: row.isParent ? 600 : 400,
                        color: row.isParent ? "#1120A3" : "#333",
                        fontSize: isMobile ? "12px" : "14px",
                        border: "1px solid #e0e0e0",
                        padding: row.isParent
                          ? isMobile
                            ? "8px 4px"
                            : "14px 12px"
                          : isMobile
                          ? "6px 4px"
                          : "8px 12px",
                      }}
                    >
                      {row.isParent ? row.displayIndex : ""}
                    </TableCell>

                    {/* Column 2 - หน่วยงาน */}
                    <TableCell
                      sx={{
                        width: columns[1].width,
                        fontSize: isMobile ? "12px" : "14px",
                        border: "1px solid #e0e0e0",
                        padding: row.isParent
                          ? isMobile
                            ? "8px 4px"
                            : "14px 12px"
                          : isMobile
                          ? "6px 4px 6px 16px"
                          : "8px 12px 8px 40px",
                      }}
                    >
                      {row.isParent ? (
                        <Box display="flex" alignItems="center">
                          <IconButton
                            size="small"
                            sx={{
                              p: 0,
                              mr: isMobile ? 0.5 : 1,
                              minWidth: isMobile ? 16 : 24,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(row.id);
                            }}
                          >
                            {expanded[row.id] ? (
                              <ExpandLessIcon
                                fontSize={isMobile ? "small" : "medium"}
                              />
                            ) : (
                              <ExpandMoreIcon
                                fontSize={isMobile ? "small" : "medium"}
                              />
                            )}
                          </IconButton>
                          <Box
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: isMobile ? "nowrap" : "normal",
                            }}
                          >
                            {row.agency}
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: isMobile ? "nowrap" : "normal",
                          }}
                        >
                          {row.agency}
                        </Box>
                      )}
                    </TableCell>

                    {/* Column 3 - จำนวน */}
                    <TableCell
                      align="center"
                      sx={{
                        width: columns[2].width,
                        fontSize: isMobile ? "12px" : "14px",
                        border: "1px solid #e0e0e0",
                        padding: row.isParent
                          ? isMobile
                            ? "8px 4px"
                            : "14px 12px"
                          : isMobile
                          ? "6px 4px"
                          : "8px 12px",
                      }}
                    >
                      {row.total ?? "-"}
                    </TableCell>

                    {/* Column 4 - ยุติ */}
                    <TableCell
                      align="center"
                      sx={{
                        width: columns[3].width,
                        fontSize: isMobile ? "12px" : "14px",
                        border: "1px solid #e0e0e0",
                        padding: row.isParent
                          ? isMobile
                            ? "8px 4px"
                            : "14px 12px"
                          : isMobile
                          ? "6px 4px"
                          : "8px 12px",
                      }}
                    >
                      {row.closed ?? "-"}
                    </TableCell>

                    {/* Column 5 - อยู่ระหว่างดำเนินการ */}
                    <TableCell
                      align="center"
                      sx={{
                        width: columns[4].width,
                        fontSize: isMobile ? "12px" : "14px",
                        border: "1px solid #e0e0e0",
                        padding: row.isParent
                          ? isMobile
                            ? "8px 4px"
                            : "14px 12px"
                          : isMobile
                          ? "6px 4px"
                          : "8px 12px",
                      }}
                    >
                      {row.ongoing ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* แสดง Pagination เฉพาะเมื่อมีข้อมูล */}
          {!hasNoData && (
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
                  fontSize: isMobile ? "12px" : "14px",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? 1 : 0,
                  py: isMobile ? 1 : 0,
                },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                  {
                    fontSize: isMobile ? "12px" : "14px",
                  },
                "& .MuiTablePagination-select": {
                  fontSize: isMobile ? "12px" : "14px",
                },
              }}
            />
          )}
        </Box>
      </div>
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
