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
  onSearch = () => { },
  filterFields = [],
  actionButtonLabel = "",
  onActionClick = () => { },
}) => {
  const router = useRouter();
  const pdfRef = useRef();

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
      }}
    >
      {/* Title */}
      <Box
        className={styles.headerBar}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box />
      </Box>
      <Box
        className={styles.headerBar2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>{title}</Box>
      </Box>

      {/* Filters + Search */}
      <Box width="100%" px={2} py={1}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ flexGrow: 1, overflowX: "auto" }}
          >
            {filterFields.map((f) => (
              <Box key={f.name} flex="1 1 0" minWidth="140px" maxWidth="200px">
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

          {/* ปรับตรงนี้ให้กว้างขึ้น โดยกำหนด flex-basis เป็น 300px */}
          <Box
            display="flex"
            alignItems="center"
            sx={{
              flex: "0 0 700px",
              justifyContent: "flex-end",
            }}
          >
            {/* กล่องสำหรับปุ่มสรุปผล */}
            <Box mr={1}>
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
                  }}
                />
              )}
            </Box>

            {/* กล่องสำหรับปุ่ม Export */}
            <Box display="flex" alignItems="center" gap={1} mr={4}>
              <ExportButton
                label="Export PDF"
                onClick={() =>
                  exportElementToPDF(pdfRef, "รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่ม.pdf")
                }
              />;
              <ExportButton label="Export Excel" />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Data Table */}
      <div ref={pdfRef}>
        <Box
          className={styles.tableWrapper}
          id="table-results"
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
                  {columns.map((col) => (
                    <TableCell key={col.name} sx={{ width: col.width }}>
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
            sx={{ borderTop: "1px solid #eee" }}
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
  onSearch: () => { },
  filterFields: [],
  actionButtonLabel: "",
  onActionClick: () => { },
};

export default TableNewAddComp;
