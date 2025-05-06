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
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffIcon from "@mui/icons-material/SearchOff";

import styles from "./TableListBox.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";

// ---------------------------------------------------------------------------
// รายการตัวเลือกสำหรับฟิลด์ค้นหา
// ---------------------------------------------------------------------------
const issueTypeOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "ภารกิจ", label: "ภารกิจ" },
  { value: "การแก้ไขปัญหาหนี้สิน", label: "การแก้ไขปัญหาหนี้สิน" },
  {
    value: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
    label: "นโยบายรัฐฯ เรื่องสาธารณูปโภค",
  },
  { value: "นโยบายรัฐฯ ด้านสวัสดิการ", label: "นโยบายรัฐฯ ด้านสวัสดิการ" },
];
const subIssueTypeOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "-", label: "-" },
  {
    value: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
    label: "ข้อคิดเห็น/ข้อเสนอแนะ/แจ้งขยายเวลา",
  },
  { value: "หนี้นอกระบบ", label: "หนี้นอกระบบ" },
  { value: "หนี้และสภาพหนี้ระบบ", label: "หนี้และสภาพหนี้ระบบ" },
  { value: "โครงการสาธารณูปโภคพื้นฐาน", label: "โครงการสาธารณูปโภคพื้นฐาน" },
  {
    value: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
    label: "โครงการลงทะเบียนเพื่อสวัสดิการฯ",
  },
];
const agencyOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "กรมธนารักษ์", label: "กรมธนารักษ์" },
  { value: "โรงงานไพ่", label: "โรงงานไพ่" },
  { value: "ธนาคารอิสลามแห่งประเทศไทย", label: "ธนาคารอิสลามแห่งประเทศไทย" },
  {
    value: "สำนักงานเลขาธิการนายกรัฐมนตรี",
    label: "สำนักงานเลขาธิการนายกรัฐมนตรี",
  },
];
const officerOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "นายกานต์ วรากร", label: "นายกานต์ วรากร" },
  { value: "นางกานต์รวี วรานี", label: "นางกานต์รวี วรานี" },
  { value: "นายปิยภา ภูมิศา", label: "นายปิยภา ภูมิศา" },
];
const statusFilterOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
  { value: "ยุติ", label: "ยุติ" },
];

/* ----------------------------------------------------------------------------
 *  TableListBox
 *  - data       : array ของออบเจ็กต์รายการ
 *  - title      : ชื่อหัวตาราง / กล่อง
 *  - navigateTo : path สำหรับกดแถวไปหน้า รายละเอียด (เช่น "/detail")
 *  - onSearch   : ฟังก์ชันค้นหา (filters) → void
 * -------------------------------------------------------------------------- */
const TableListBox = ({
  data = [],
  title = "",
  navigateTo = "",
  onSearch = () => {},
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  // filters state
  const [filters, setFilters] = useState({
    ชื่อผู้ร้อง: "",
    เรื่อง: "",
    ประเภทเรื่อง: "",
    ประเภทเรื่องย่อย: "",
    หน่วยงาน: "",
    เจ้าหน้าที่รับผิดชอบ: "",
    สถานะเรื่อง: "",
  });
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
  const handleSearchClick = () => onSearch(filters);
  const handleClearSearch = () => {
    const cleared = {
      ชื่อผู้ร้อง: "",
      เรื่อง: "",
      ประเภทเรื่อง: "",
      ประเภทเรื่องย่อย: "",
      หน่วยงาน: "",
      เจ้าหน้าที่รับผิดชอบ: "",
      สถานะเรื่อง: "",
    };
    setFilters(cleared);
    setPage(0);
    onSearch(cleared);
  };

  // row click
  const handleRowClick = (item) =>
    navigateTo && router.push(`${navigateTo}/${item.id}`);

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
      <Box
        className={styles.headerBar2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>{title}</Box>
        <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
          <ExportButton label="Export PDF" />
          <ExportButton label="Export Excel" />
        </Box>
      </Box>

      {/* search bar */}
      <Box width="100%" px={2} py={1} overflowX="auto">
        <Box
          display="flex"
          alignItems="center"
          flexWrap="wrap"
          gap={0.5}
          sx={{ overflowX: "auto", justifyContent: "flex-start" }}
        >
          {[
            {
              component: InputText,
              props: {
                label: "ชื่อผู้ร้อง",
                value: filters["ชื่อผู้ร้อง"],
                onChange: handleChange("ชื่อผู้ร้อง"),
              },
            },
            {
              component: InputText,
              props: {
                label: "เรื่อง",
                value: filters["เรื่อง"],
                onChange: handleChange("เรื่อง"),
              },
            },
            {
              component: SelectField,
              props: {
                label: "ประเภทเรื่อง",
                options: issueTypeOptions,
                value: filters["ประเภทเรื่อง"],
                onChange: handleChange("ประเภทเรื่อง"),
              },
            },
            {
              component: SelectField,
              props: {
                label: "ประเภทเรื่องย่อย",
                options: subIssueTypeOptions,
                value: filters["ประเภทเรื่องย่อย"],
                onChange: handleChange("ประเภทเรื่องย่อย"),
              },
            },
            {
              component: SelectField,
              props: {
                label: "หน่วยงาน",
                options: agencyOptions,
                value: filters["หน่วยงาน"],
                onChange: handleChange("หน่วยงาน"),
              },
            },
            {
              component: SelectField,
              props: {
                label: "เจ้าหน้าที่รับผิดชอบ",
                options: officerOptions,
                value: filters["เจ้าหน้าที่รับผิดชอบ"],
                onChange: handleChange("เจ้าหน้าที่รับผิดชอบ"),
              },
            },
            {
              component: SelectField,
              props: {
                label: "สถานะเรื่อง",
                options: statusFilterOptions,
                value: filters["สถานะเรื่อง"],
                onChange: handleChange("สถานะเรื่อง"),
              },
            },
          ].map(({ component: Component, props }, idx) => (
            <Box key={idx} flex="1 1 0" minWidth="120px" maxWidth="180px">
              {" "}
              {/* ปรับขนาดใหม่ */}
              <Component fullWidth {...props} />
            </Box>
          ))}

          {/* ปุ่มค้นหา */}
          <Box flex="0 0 auto" display="flex" alignItems="center">
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
                ml: 1,
              }}
            >
              <SearchOffIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* table */}
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
              <TableCell sx={{ width: 200 }}>วันที่ร้อง</TableCell>
              <TableCell sx={{ width: 180 }}>หน่วยงาน</TableCell>
              <TableCell sx={{ width: 300 }}>ชื่อสกุลผู้ร้อง</TableCell>
              <TableCell sx={{ width: 180 }}>เรื่อง</TableCell>
              <TableCell sx={{ width: 160 }}>ประเภทเรื่อง</TableCell>
              <TableCell sx={{ width: 160 }}>ประเภทเรื่องย่อย</TableCell>
              <TableCell sx={{ width: 160 }}>เจ้าหน้าที่รับผิดชอบ</TableCell>
              <TableCell sx={{ width: 160 }}>สถานะเรื่อง</TableCell>
              <TableCell sx={{ width: 160 }}>หมายเหตุ</TableCell>
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
                <TableCell sx={{ width: 200 }}>{item.receiveDate}</TableCell>
                <TableCell sx={{ width: 180 }}>{item.agency}</TableCell>
                <TableCell sx={{ width: 300 }}>{item.claimantName}</TableCell>
                <TableCell sx={{ width: 180 }}>{item.issue}</TableCell>
                <TableCell sx={{ width: 160 }}>{item.issueType}</TableCell>
                <TableCell sx={{ width: 160 }}>{item.subIssueType}</TableCell>
                <TableCell sx={{ width: 160 }}>
                  {item.responsibleOfficer}
                </TableCell>
                <TableCell sx={{ width: 160 }}>{item.status}</TableCell>
                <TableCell sx={{ width: 160 }}>{item.note}</TableCell>
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
    </Container>
  );
};

export default TableListBox;
