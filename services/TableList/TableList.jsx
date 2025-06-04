import React, { useState, useMemo } from "react";
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
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import styles from "./TableList.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import SearchOffIcon from '@mui/icons-material/SearchOff';
import {
  formatCitizenId_null,
} from "@utils/Formats";

const TableList = ({
  data = [],
  title = "",
  navigateTo = "",
  agencyOptions = [],
  onSearch = () => { },
  handleNavigateTo,
}) => {
  const router = useRouter();

  /* ฟิลเตอร์ที่ผู้ใช้กรอก (จะส่งกลับเมื่อกดค้นหา) */
  const [filters, setFilters] = useState({
    claimantName: "",
    citizenId: "",
    subject: "",
    docNo: "",
    agency: "",
    docKk: "",
    docSr: "",
    docStp: "",
    docGov: "",
  });
  const handleChange = (field) => (e) =>
    setFilters({ ...filters, [field]: e?.target ? e.target.value : e });

  /* pagination */
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
    onSearch(filters);
  };

  const handleClearSearch = () => {
    const cleared = {
      claimantName: "",
      citizenId: "",
      subject: "",
      docNo: "",
      agency: "",
      docKk: "",
      docSr: "",
      docStp: "",
      docGov: "",
    };
    setFilters(cleared);
    setPage(0);
    onSearch(cleared);
  };

  const handleRowClick = (item) => navigateTo && router.push(`${navigateTo}/${item.id}`);

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
      <Box className={styles.headerBar}>{title}</Box>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        mt={2}
        sx={{
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
          overflowX: "auto",
          px: 2,
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ flexWrap: "nowrap" }}
        >
          <InputText
            label="ชื่อผู้ร้อง"
            value={filters.claimantName}
            onChange={handleChange("claimantName")}
          />
          <InputText
            label="เลขบัตรประชาชน"
            value={filters.citizenId}
            onChange={handleChange("citizenId")}
          />
          <InputText
            label="ชื่อเรื่อง"
            value={filters.subject}
            onChange={handleChange("subject")}
          />
          <InputText
            label="เลขที่ส่วนรับราชการ"
            value={filters.docGov}
            onChange={handleChange("docGov")}
          />
          <SelectField
            label="หน่วยงานอื่นที่ส่งเรื่องมายัง กก."
            options={agencyOptions}
            value={filters.agency}
            onChange={handleChange("agency")}
          />

          <IconButton
            onClick={handleSearchClick}
            sx={{
              bgcolor: "#1120A3",
              color: "#fff",
              "&:hover": { bgcolor: "#0b1580" },
              flexShrink: 0,
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
              flexShrink: 0,
            }}
          >
            <SearchOffIcon />
          </IconButton>

          <Button
            variant="contained"
            onClick={handleNavigateTo}
            sx={{
              backgroundColor: "#1120A3",
              color: "#fff",
              borderRadius: "12px",
              fontWeight: "bold",
              px: 3,
              py: 1,
              minWidth: 220,
              "&:hover": { backgroundColor: "#0b1580" },
              flexShrink: 0,
            }}
          >
            คัดกรองเรื่องร้องเรียน
          </Button>
        </Box>

        {/* ปุ่ม Export */}
        <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
          <ExportButton label="Export PDF" />
          <ExportButton label="Export Excel" />
        </Box>
      </Box>

      {/* table + pagination */}
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
              <TableCell sx={{ width: 200 }}>ชื่อผู้ร้อง</TableCell>
              <TableCell sx={{ width: 180 }}>บัตรประชาชน</TableCell>
              <TableCell sx={{ width: 300 }}>ชื่อเรื่อง</TableCell>
              <TableCell sx={{ width: 180 }}>เลขที่สป.กค.</TableCell>
              <TableCell sx={{ width: 180 }}>เลขที่สป.สร.</TableCell>
              <TableCell sx={{ width: 180 }}>เลขที่สตป.</TableCell>
              <TableCell sx={{ width: 180 }}>เลขที่ส่วนรับราชการ</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pagedData.length > 0 ? (
              pagedData.map((item, idx) => (
                <TableRow
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f7ff" },
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 600, color: "#1120A3" }}>
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>{item?.name ?? "-"}</TableCell>
                  <TableCell>{formatCitizenId_null(item?.citizenId ?? "-")}</TableCell>
                  <TableCell className={styles.ellipsisCell}>
                    {item?.subject ?? "-"}
                  </TableCell>
                  <TableCell>{item?.docKk ?? "-"}</TableCell>
                  <TableCell>{item?.docSr ?? "-"}</TableCell>
                  <TableCell>{item?.docStp ?? "-"}</TableCell>
                  <TableCell>{item?.docGov ?? "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3, color: "#999" }}>
                  ไม่พบข้อมูลที่ค้นหา
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* pagination bar */}
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
    </Container>
  );
};

export default TableList;
