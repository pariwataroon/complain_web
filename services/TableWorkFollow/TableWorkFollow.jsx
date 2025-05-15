import React, { useState, useMemo } from "react";
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
  Collapse,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  SearchOff as SearchOffIcon,
} from "@mui/icons-material";

import styles from "./TableWorkFollow.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import InputDate from "@services/InputDate/InputDate";

const TableWorkFollow = ({
  data = [],
  filterFields = [],
  onSearch = () => {},
  navigateTo = "",
}) => {
  const router = useRouter();

  // Group data by responsibleOfficer
  const groupedData = useMemo(
    () =>
      data.reduce((acc, item) => {
        const key = item.responsibleOfficer || "ไม่ระบุ";
        acc[key] = acc[key] || [];
        acc[key].push(item);
        return acc;
      }, {}),
    [data]
  );
  const groupKeys = Object.keys(groupedData);

  // Collapse state for each group
  const [expandedGroups, setExpandedGroups] = useState({});
  const toggleGroup = (key) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // Filters state
  const initialFilters = filterFields.reduce(
    (acc, f) => ({ ...acc, [f.name]: "" }),
    {}
  );
  const [filters, setFilters] = useState(initialFilters);
  const handleChange = (name) => (e) =>
    setFilters({ ...filters, [name]: e?.target?.value ?? e });

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const flatData = groupKeys.flatMap((key) => groupedData[key]);
  const pagedGroups = groupKeys.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };

  // Search / Clear
  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearClick = () => {
    setFilters(initialFilters);
    setPage(0);
    onSearch(initialFilters);
  };

  // Columns configuration
  const columns = [
    { label: "ลำดับ", width: 80 },
    {
      label: "เลขรับ สรร.",
      width: 120,
      render: (item) => (
        <>
          {item.receiptNumber}
          <br />
          <small>({item.receiptDate})</small>
        </>
      ),
    },
    {
      label: "เลขที่อ้างอิง",
      width: 120,
      render: (item) => (
        <>
          {item.referenceNumber}
          <br />
          <small>({item.proposeDate})</small>
        </>
      ),
    },
    { label: "เรื่อง", width: 300, field: "complaint" },
    { label: "วันที่รับงาน", width: 140, field: "receiveDate" },
    { label: "วันที่เสนอ ผอ.สรร.", width: 160, field: "proposeDate" },
    { label: "หน่วยงานในสังกัด", width: 200, field: "agency" },
    { label: "เลขที่หนังสือจากส่วนราชการ", width: 160, field: "letterNumber" },
    { label: "สถานะเรื่อง", width: 140, field: "status" },
    { label: "ดำเนินการมาแล้ว (วัน)", width: 180, field: "elapsedDays" },
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
      <Box className={styles.headerBar}></Box>
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
                "&:hover": { bgcolor: "#0b1580" },
                width: 40,
                height: 40,
              }}
            >
              <SearchIcon />
            </IconButton>
            <IconButton
              onClick={handleClearClick}
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
        รายงานการติดตามงานค้าง
        <br />
        ตั้งแต่วันที่ 1 ตุลาคม 2567 ถึงวันที่ 25 พฤศจิกายน 2567
        <br />
        ประเภท เรื่องร้องเรียนเพิ่มเติม
      </Box>

      {/* Table with grouped collapsible rows */}
      <Box sx={{ overflowX: "auto", px: 2, pb: 1 }}>
        <Table sx={{ minWidth: 1400 }}>
          <TableHead>
            <TableRow>
              {columns.map((col, i) => (
                <TableCell
                  key={i}
                  align={i === 0 ? "center" : "left"}
                  sx={{ width: col.width }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedGroups.map((groupKey) => {
              const items = groupedData[groupKey];
              return (
                <React.Fragment key={groupKey}>
                  <TableRow sx={{ "&:hover": { backgroundColor: "#f5f7ff" } }}>
                    <TableCell align="center" sx={{ width: 60 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleGroup(groupKey)}
                      >
                        {expandedGroups[groupKey] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell colSpan={columns.length + 1} sx={{ width: 300 }}>
                      {`เจ้าหน้าที่ผู้รับผิดชอบ : ${groupKey}`}
                    </TableCell>
                  </TableRow>
                  {/* Detail rows */}
                  <TableRow>
                    <TableCell
                      style={{ padding: 0 }}
                      colSpan={columns.length + 2}
                    >
                      <Collapse
                        in={expandedGroups[groupKey]}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box>
                          <Table size="small">
                            <TableBody sx={{ backgroundColor: "#FEFAEF" }}>
                              {items.map((item, idx) => (
                                <TableRow
                                  key={item.id}
                                  sx={{
                                    "&:hover": { backgroundColor: "#f5f7ff" },
                                  }}
                                  onClick={() =>
                                    navigateTo &&
                                    router.push(`${navigateTo}/${item.id}`)
                                  }
                                >
                                  {/* ลำดับ */}
                                  <TableCell
                                    align="center"
                                    sx={{
                                      width: columns[0].width,
                                      fontWeight: 600,
                                      color: "#1120A3",
                                    }}
                                  >
                                    {page * rowsPerPage + idx + 1}
                                  </TableCell>
                                  {/* remaining columns */}
                                  {columns.slice(1).map((col, i) => (
                                    <TableCell
                                      key={i}
                                      sx={{ width: col.width }}
                                    >
                                      {col.render
                                        ? col.render(item)
                                        : item[col.field] || "-"}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25]}
          count={flatData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sx={{ borderTop: "1px solid #eee" }}
        />
      </Box>
    </Container>
  );
};

TableWorkFollow.propTypes = {
  data: PropTypes.array,
  filterFields: PropTypes.array,
  onSearch: PropTypes.func,
  navigateTo: PropTypes.string,
};

export default TableWorkFollow;
