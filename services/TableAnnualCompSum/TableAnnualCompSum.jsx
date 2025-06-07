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
import DateThaiPickerService from "@services/dateThaiPickerService/dateThaiPickerService";
import { exportElementToPDF } from "@utils/exportPDF";

// สร้าง component แยกสำหรับ date picker เพื่อป้องกัน hooks issue
const DatePickerWrapper = ({ field, value, onChange }) => {
  return (
    <Box mt={2}>
      <DateThaiPickerService
        label={field.label}
        value={value}
        onChange={onChange}
      />
    </Box>
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

      {/* Filters */}
      <Box px={2} py={1}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ flexGrow: 1, overflowX: "auto" }}
          >
            {/* Render non-date fields */}
            {nonDateFields.map((f) => (
              <Box key={f.name} flex="1 1 0" minWidth="140px" maxWidth="300px">
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

            {/* Render date fields separately */}
            {dateFields.map((f) => (
              <Box key={f.name} flex="1 1 0" minWidth="140px" maxWidth="300px">
                <DatePickerWrapper
                  field={f}
                  value={filters[f.name]}
                  onChange={handleChange(f.name)}
                />
              </Box>
            ))}

            <Box mt={3}>
              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: 40,
                  height: 40,
                  ml: 1,
                  "&:hover": {
                    bgcolor: "#1120A3",
                  },
                }}
              >
                <SearchIcon />
              </IconButton>
              <IconButton
                onClick={handleClearClick}
                sx={{
                  marginLeft: "10px",
                  bgcolor: "#1120A3",
                  color: "#fff",
                  width: 40,
                  height: 40,
                  "&:hover": {
                    bgcolor: "#1120A3",
                  },
                }}
              >
                <SearchOffIcon />
              </IconButton>
            </Box>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            sx={{ flex: "1 0 300px", justifyContent: "flex-end" }}
          >
            <ExportButton
              label="Export PDF"
              onClick={() =>
                exportElementToPDF(
                  pdfRef,
                  "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ.pdf"
                )
              }
            />
            <ExportButton label="Export Excel" />
          </Box>
        </Box>
      </Box>

      {/* Title */}
      <Box
        sx={{
          backgroundColor: "#EAF5FF",
          p: 2,
          color: "#1120A3",
          textAlign: "center",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ
        <br />
        ตั้งแต่วันที่ 1 ตุลาคม 2567 ถึงวันที่ 25 พฤศจิกายน 2567
      </Box>

      {/* Summary Table */}
      <div ref={pdfRef}>
        <Box sx={{ overflowX: "auto", px: 2, pb: 1 }}>
          <Table
            sx={{
              minWidth: 1000,
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
                      fontSize: "14px",
                      border: "1px solid #e0e0e0",
                      padding: "14px 12px",
                    }}
                    align={idx === 1 ? "left" : "center"}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {flatRows.map((row, idx) => (
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
                      fontSize: "14px",
                      border: "1px solid #e0e0e0",
                      padding: row.isParent ? "14px 12px" : "8px 12px",
                    }}
                  >
                    {row.isParent ? row.displayIndex : ""}
                  </TableCell>

                  {/* Column 2 - หน่วยงาน */}
                  <TableCell
                    sx={{
                      width: columns[1].width,
                      fontSize: "14px",
                      border: "1px solid #e0e0e0",
                      padding: row.isParent ? "14px 12px" : "8px 12px 8px 40px",
                    }}
                  >
                    {row.isParent ? (
                      <Box display="flex" alignItems="center">
                        <IconButton
                          size="small"
                          sx={{ p: 0, mr: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(row.id);
                          }}
                        >
                          {expanded[row.id] ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                        {row.agency}
                      </Box>
                    ) : (
                      row.agency
                    )}
                  </TableCell>

                  {/* Column 3 - จำนวน */}
                  <TableCell
                    align="center"
                    sx={{
                      width: columns[2].width,
                      fontSize: "14px",
                      border: "1px solid #e0e0e0",
                      padding: row.isParent ? "14px 12px" : "8px 12px",
                    }}
                  >
                    {row.total ?? "-"}
                  </TableCell>

                  {/* Column 4 - ยุติ */}
                  <TableCell
                    align="center"
                    sx={{
                      width: columns[3].width,
                      fontSize: "14px",
                      border: "1px solid #e0e0e0",
                      padding: row.isParent ? "14px 12px" : "8px 12px",
                    }}
                  >
                    {row.closed ?? "-"}
                  </TableCell>

                  {/* Column 5 - อยู่ระหว่างดำเนินการ */}
                  <TableCell
                    align="center"
                    sx={{
                      width: columns[4].width,
                      fontSize: "14px",
                      border: "1px solid #e0e0e0",
                      padding: row.isParent ? "14px 12px" : "8px 12px",
                    }}
                  >
                    {row.ongoing ?? "-"}
                  </TableCell>
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
            sx={{ borderTop: "1px solid #eee" }}
          />
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
