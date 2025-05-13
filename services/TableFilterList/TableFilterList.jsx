import React, { useState } from "react";
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
import SearchOffIcon from "@mui/icons-material/SearchOff";
import styles from "./TableFilterList.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";

const TableFilterList = ({
  groups = [],
  title = "",
  navigateTo = "",
  agencyOptions = [],
  onSearch = () => { },
}) => {
  const router = useRouter();

  const [filters, setFilters] = useState({
    claimantName: "",
    citizenId: "",
    subject: "",
    docNo: "",
    agency: "",
    issueType: "",
    respondentName: "",
  });

  const handleChange = (field) => (e) =>
    setFilters({ ...filters, [field]: e?.target ? e.target.value : e });

  const [paginationStates, setPaginationStates] = useState(
    groups.map(() => ({ page: 0, rowsPerPage: 10 }))
  );

  const handlePageChange = (groupIdx) => (_, newPage) => {
    setPaginationStates((prev) =>
      prev.map((p, i) => (i === groupIdx ? { ...p, page: newPage } : p))
    );
  };

  const handleRowsPerPageChange = (groupIdx) => (e) => {
    const newRowsPerPage = parseInt(e.target.value, 10);
    setPaginationStates((prev) =>
      prev.map((p, i) =>
        i === groupIdx ? { page: 0, rowsPerPage: newRowsPerPage } : p
      )
    );
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
      issueType: "",
      respondentName: "",
    };
    setFilters(cleared);
    setPaginationStates(groups.map(() => ({ page: 0, rowsPerPage: 10 })));
    onSearch(cleared);
  };

  const handleRowClick = (item) => navigateTo && router.push(`${navigateTo}/${item.id}`);
  const handleNavigateTo = () => router.push("/admin/AccountBox");

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{ backgroundColor: "#fff", borderRadius: 2, boxShadow: "0 6px 18px rgba(0,0,0,.06)" }}
    >
      <Box className={styles.headerBar}>{title}</Box>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        mt={2}
        sx={{ flexWrap: "nowrap", whiteSpace: "nowrap", overflowX: "auto", px: 2 }}
      >
        <Box display="flex" alignItems="center" gap={1} sx={{ flexWrap: "nowrap" }}>
          <InputText label="ชื่อผู้ร้อง" value={filters.claimantName} onChange={handleChange("claimantName")} />
          <SelectField label="ประเภทเรื่อง" options={agencyOptions} value={filters.issueType} onChange={handleChange("issueType")} />
          <InputText label="ชื่อเรื่อง" value={filters.subject} onChange={handleChange("subject")} />
          <SelectField label="ชื่อผู้ถูกร้อง" options={agencyOptions} value={filters.respondentName} onChange={handleChange("respondentName")} />

          <IconButton onClick={handleSearchClick} sx={{ bgcolor: "#1120A3", color: "#fff", "&:hover": { bgcolor: "#0b1580" }, flexShrink: 0 }}>
            <SearchIcon />
          </IconButton>
          <IconButton onClick={handleClearSearch} sx={{ bgcolor: "#1120A3", color: "#fff", "&:hover": { bgcolor: "#0b1580" }, flexShrink: 0 }}>
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
            สถิติการทำงานของเจ้าหน้าที่
          </Button>
        </Box>

        <Box display="flex" gap={1} sx={{ flexShrink: 0 }}>
          <ExportButton label="Export PDF" />
          <ExportButton label="Export Excel" />
        </Box>
      </Box>

      {groups.map((group, groupIdx) => {
        const { page, rowsPerPage } = paginationStates[groupIdx] || { page: 0, rowsPerPage: 10 };
        return (
          <Box key={groupIdx} sx={{ mt: 4 }}>
            <Box className={styles.headerBar}>{group.title}</Box>

            <Box className={styles.tableWrapper} sx={{ overflowX: "auto", px: 2, pb: 1 }}>
              <Table sx={{ minWidth: 1400 }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ width: 80 }}>ลำดับ</TableCell>
                    <TableCell sx={{ width: 200 }}>ชื่อผู้ร้อง</TableCell>
                    <TableCell sx={{ width: 180 }}>ประเภทเรื่อง</TableCell>
                    <TableCell sx={{ width: 300 }}>ชื่อเรื่อง</TableCell>
                    <TableCell sx={{ width: 180 }}>ชื่อผู้ถูกร้อง</TableCell>
                    <TableCell sx={{ width: 200 }}>เลขที่สป.กค</TableCell>
                    <TableCell sx={{ width: 200 }}>เลขที่สป.สร</TableCell>
                    <TableCell sx={{ width: 200 }}>เลขที่สตป.</TableCell>
                    <TableCell sx={{ width: 160 }}>เลขที่สรร</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.data
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item, idx) => (
                      <TableRow
                        key={item.id}
                        onClick={() => handleRowClick(item)}
                        sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f5f7ff" } }}
                      >
                        <TableCell align="center" sx={{ fontWeight: 600, color: "#1120A3" }}>
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell>{item?.name ?? "-"}</TableCell>
                        <TableCell>{item?.issueType ?? "-"}</TableCell>
                        <TableCell>{item?.subject ?? "-"}</TableCell>
                        <TableCell>{item?.respondentName ?? "-"}</TableCell>
                        <TableCell>{item?.docNo ?? "-"}</TableCell>
                        <TableCell>{item?.docNo2 ?? "-"}</TableCell>
                        <TableCell>{item?.docNo3 ?? "-"}</TableCell>
                        <TableCell>{item?.docNo4 ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                rowsPerPageOptions={[5, 10, 25]}
                count={group.data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange(groupIdx)}
                onRowsPerPageChange={handleRowsPerPageChange(groupIdx)}
                sx={{ borderTop: "1px solid #eee" }}
              />
            </Box>
          </Box>
        );
      })}
    </Container>
  );
};

export default TableFilterList;
