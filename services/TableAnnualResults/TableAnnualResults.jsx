import React, { useState } from "react";
import PropTypes from "prop-types";
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
  Search as SearchIcon,
  SearchOff as SearchOffIcon,
} from "@mui/icons-material";

import styles from "./TableAnnualResults.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import InputDate from "@services/InputDate/InputDate";

const TableAnnualResults = ({
  data = [],
  filterFields = [],
  onSearch = () => {},
}) => {
  // Filters state
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

  // Columns config
  const columns = [
    { label: "ลำดับ", width: 80, align: "center" },
    { label: "เลขรับ สรร.", field: "receiptNumber", width: 120 },
    { label: "ลงวันที่", field: "receiptDate", width: 120 },
    { label: "ชื่อ-สกุล (ผู้ร้อง)", field: "complainant", width: 200 },
    { label: "ชื่อเรื่อง", field: "complaint", width: 300 },
    { label: "ประเภทเรื่อง", field: "issueType", width: 200 },
    {
      label: "หนังสือส่งหน่วยงาน/ติดตามผล",
      width: 200,
      render: (row) => (
        <>
          {row.letterRef}
          <br />
          <small>({row.letterDate})</small>
        </>
      ),
    },
    {
      label: "เจ้าหน้าที่ผู้รับผิดชอบ",
      field: "responsibleOfficer",
      width: 200,
    },
    { label: "สถานะเรื่อง", field: "status", width: 140, align: "center" },
    {
      label: "ระยะเวลาในการดำเนินงาน",
      field: "elapsedTime",
      width: 160,
      align: "center",
    },
  ];

  // Split data by status
  const closedData = data.filter((r) => r.status === "ยุติ");
  const ongoingData = data.filter((r) => r.status === "อยู่ระหว่างดำเนินการ");

  const renderTable = (dataset) => (
    <Table sx={{ minWidth: 1200 }}>
      <TableHead>
        <TableRow>
          {columns.map((col, idx) => (
            <TableCell
              key={idx}
              sx={{ width: col.width }}
              align={col.align || (idx === 1 ? "left" : "center")}
            >
              {col.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {dataset.map((row, idx) => (
          <TableRow key={row.id} hover>
            {columns.map((col, cIdx) => {
              let content;
              if (cIdx === 0) {
                content = idx + 1;
              } else if (col.render) {
                content = col.render(row);
              } else {
                content = row[col.field] ?? "-";
              }
              return (
                <TableCell
                  key={cIdx}
                  sx={{ width: col.width }}
                  align={col.align || (cIdx === 1 ? "left" : "center")}
                >
                  {content}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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
      {/* Filters */}
      <Box px={2} py={1}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ flexGrow: 1, overflowX: "auto" }}
          >
            {filterFields.map((f) => (
              <Box key={f.name} flex="1 1 0" minWidth="140px" maxWidth="300px">
                {f.type === "select" ? (
                  <SelectField
                    fullWidth
                    label={f.label}
                    options={f.options}
                    value={filters[f.name]}
                    onChange={handleChange(f.name)}
                  />
                ) : f.type === "date" ? (
                  <InputDate
                    label={f.label}
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
            <IconButton
              onClick={handleSearchClick}
              sx={{
                bgcolor: "#1120A3",
                color: "#fff",
                width: 40,
                height: 40,
                ml: 1,
                "&:hover": { bgcolor: "#1120A3" },
              }}
            >
              <SearchIcon />
            </IconButton>
            <IconButton
              onClick={handleClearClick}
              sx={{
                bgcolor: "#1120A3",
                color: "#fff",
                width: 40,
                height: 40,
                "&:hover": { bgcolor: "#1120A3" },
              }}
            >
              <SearchOffIcon />
            </IconButton>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            sx={{ flex: "1 0 300px", justifyContent: "flex-end" }}
          >
            <ExportButton label="Export PDF" />
            <ExportButton label="Export Excel" />
          </Box>
        </Box>
      </Box>

      {/* Closed Section */}
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
        รายงานสรุปเรื่องร้องเรียนสำนักงานปลัดกระทรวงการคลัง / สำนักงานรัฐมนตรี
        <br />
        ประจำปีงบประมาณ 2568 ตั้งแต่วันที่ 1 ตุลาคม 2567 - 31 ธันวาคม 2567
        <br />
        สถานะ ยุติแล้ว
      </Box>
      <Box sx={{ overflowX: "auto", px: 2, pb: 4 }}>
        {renderTable(closedData)}
      </Box>

      {/* Ongoing Section */}
      <Box
        sx={{
          backgroundColor: "#FEECEC",
          p: 2,
          color: "#D32F2F",
          textAlign: "center",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        รายงานสรุปเรื่องร้องเรียนสำนักงานปลัดกระทรวงการคลัง / สำนักงานรัฐมนตรี
        <br />
        ประจำปีงบประมาณ 2568 ตั้งแต่วันที่ 1 ตุลาคม 2567 - 31 ธันวาคม 2567
        <br />
        สถานะ อยู่ระหว่างดำเนินการ
      </Box>
      <Box sx={{ overflowX: "auto", px: 2, pb: 4 }}>
        {renderTable(ongoingData)}
      </Box>
    </Container>
  );
};

TableAnnualResults.propTypes = {
  data: PropTypes.array.isRequired,
  filterFields: PropTypes.array,
  onSearch: PropTypes.func,
};

export default TableAnnualResults;
