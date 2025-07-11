import React, { useState, useMemo, useEffect, useRef } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import styles from "./TableNewAddCompResults.module.scss";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";
const TableNewAddCompResults = ({
  data,
  title,
  summaryTitle,
  summaryDate,
  summaryCategory,
  navigateTo,
  onSearch,
  filterFields,
  NOTE_OPTIONS = [],
  onAddNote,
  onNoteChange,
}) => {
  const router = useRouter();
  const pdfRef = useRef();
  const [tableData, setTableData] = useState(data);
  useEffect(() => setTableData(data), [data]);

  const initialFilters = filterFields.reduce(
    (acc, f) => ({ ...acc, [f.name]: "" }),
    {}
  );
  const [filters, setFilters] = useState(initialFilters);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const pagedData = useMemo(
    () => tableData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [tableData, page, rowsPerPage]
  );

  const handleFilterChange = (field) => (e) => {
    const value = e.target ? e.target.value : e;
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
  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

  const columns = [
    { name: "claimantName", label: "ชื่อ - สกุล (ผู้ร้อง)", width: 220 },
    { name: "issue", label: "ชื่อเรื่อง", width: 200 },
    { name: "subIssueType", label: "ประเภทเรื่องย่อย", width: 180 },
    {
      name: "note",
      label: "หมายเหตุ",
      width: 200,
      type: "select",
      options: NOTE_OPTIONS,
    },
  ];

  const handleNoteSelectChange = (itemId, selectedValue) => {
    if (selectedValue === "__add") {
      onAddNote?.(itemId);
      return;
    }

    if (onNoteChange) {
      onNoteChange(itemId, selectedValue);
    } else {
      setTableData((prev) =>
        prev.map((r) => (r.id === itemId ? { ...r, note: selectedValue } : r))
      );
    }
  };
  const handleExportExcel = () => {
    const exportData = tableData.map((item) => ({
      "ชื่อ - สกุล (ผู้ร้อง)": item.claimantName || "-",
      "ชื่อเรื่อง": item.issue || "-",
      "ประเภทเรื่องย่อย": item.subIssueType || "-",
      "หมายเหตุ": item.note || "-",
    }));

    exportExcel(exportData, {
      filename: `สรุปผลตามประเภทเรื่อง_${new Date().toLocaleDateString("th-TH")}.xlsx`,
      sheetName: "Sheet1",
      title: "สรุปผลตามประเภทเรื่อง",
      exportDate: `วันที่ ${new Date().toLocaleDateString("th-TH")}`,
    });
  };

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
      <Box className={styles.headerBar2}>
        <Typography variant="h6">{title}</Typography>
      </Box>

      {/* Filters + Search */}
      <Box px={2} py={1}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" gap={1} sx={{ flexGrow: 1, overflowX: "auto" }}>
            {filterFields.map((f) => (
              <Box key={f.name} flex="1 1 0" minWidth="140px" maxWidth="200px">
                {f.type === "select" ? (
                  <SelectField
                    fullWidth
                    label={f.label}
                    options={f.options}
                    value={filters[f.name] || ""}
                    onChange={handleFilterChange(f.name)}
                    name={f.name}
                  />
                ) : (
                  <InputText
                    fullWidth
                    label={f.label}
                    value={filters[f.name] || ""}
                    onChange={handleFilterChange(f.name)}
                    name={f.name}
                  />
                )}
              </Box>
            ))}
            <Box
              display="flex"
              gap={1}
              sx={{
                flexShrink: 0,
                alignItems: "center", // ← จัดให้อยู่ตรงกลางในแนวตั้ง
                justifyContent: "center", // ← จัดให้อยู่ตรงกลางในแนวนอน
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

          <Box
            display="flex"
            alignItems="center"
            gap={1}
            mr={4}
            sx={{ flex: "0 0 700px", justifyContent: "flex-end" }}
          >
            <ExportButton
              label="Export PDF"
              onClick={() =>
                exportElementToPDF(pdfRef, "สรุปผลตามประเภทเรื่อง.pdf")
              }
            />
            <ExportButton label="Export Excel" 
            onClick={handleExportExcel} />
          </Box>
        </Box>
      </Box>

      {/* Summary Box */}
      <Box
        sx={{
          bgcolor: "#EAF5FF",
          p: 2,
          mb: 2,
          borderRadius: 1,
          textAlign: "center",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ color: "#1120A3", fontWeight: "bold" }}
        >
          {summaryTitle}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: "#1120A3", fontWeight: "bold" }}
        >
          ณ {summaryDate}
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: "#1120A3", fontWeight: "bold", mt: 1 }}
        >
          ได้รับเรื่องร้องเรียนจำนวน {tableData.length} เรื่อง
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ color: "#1120A3", fontWeight: "bold", mt: 0.5 }}
        >
          {summaryCategory}
        </Typography>
      </Box>

      {/* Data Table */}
      <div ref={pdfRef}>
        <Box
          className={styles.tableWrapper}
          sx={{ overflowX: "auto", px: 2, pb: 1 }}
        >
          <Table sx={{ minWidth: 1400 }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 80 }}>
                  ลำดับ
                </TableCell>
                {columns.map((col) => (
                  <TableCell key={col.name} sx={{ width: col.width }}>
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
                    sx={{ width: 80, fontWeight: 600, color: "#1120A3" }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  {columns.map((col) => {
                    const value = item[col.name] ?? "";
                    return (
                      <TableCell key={col.name} sx={{ width: col.width }}>
                        {col.type === "select" ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            style={{ width: "100%" }}
                          >
                            <SelectField
                              options={col.options}
                              value={value}
                              onChange={(valueOrEvent) => {
                                let selectedValue;

                                if (valueOrEvent && valueOrEvent.target) {
                                  selectedValue = valueOrEvent.target.value;
                                  if (
                                    typeof valueOrEvent.stopPropagation ===
                                    "function"
                                  ) {
                                    valueOrEvent.stopPropagation();
                                  }
                                } else {
                                  selectedValue = valueOrEvent;
                                }

                                handleNoteSelectChange(item.id, selectedValue);
                              }}
                              name={`${col.name}_${item.id}`}
                            />
                          </div>
                        ) : (
                          value
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 25]}
            count={tableData.length}
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

TableNewAddCompResults.propTypes = {
  data: PropTypes.array.isRequired,
  title: PropTypes.string,
  summaryTitle: PropTypes.string,
  summaryDate: PropTypes.string,
  summaryCategory: PropTypes.string,
  navigateTo: PropTypes.string,
  onSearch: PropTypes.func,
  filterFields: PropTypes.array,
  NOTE_OPTIONS: PropTypes.array,
  onAddNote: PropTypes.func,
  onNoteChange: PropTypes.func,
};

TableNewAddCompResults.defaultProps = {
  data: [],
  title: "",
  summaryTitle: "",
  summaryDate: "",
  summaryCategory: "",
  navigateTo: "",
  onSearch: () => {},
  filterFields: [],
  NOTE_OPTIONS: [],
  onAddNote: () => {},
  onNoteChange: null,
};

export default TableNewAddCompResults;
