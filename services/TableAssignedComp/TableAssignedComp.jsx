import React, { useState } from "react";
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
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/th";
import styles from "./TableAssignedComp.module.scss";

dayjs.locale("th");

/**
 * @param {Array} rows - Array of filtered data objects to display
 * @param {Function} handleRowClick - External row click handler from parent
 */
const TableAssignedComp = ({ rows = [], handleRowClick }) => {
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Custom breakpoint สำหรับ 1350px
  const isBelow1350 = useMediaQuery("(max-width: 1350px)");

  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
        overflow: "visible", // เพิ่ม overflow visible สำหรับ DatePicker
        position: "relative", // เพิ่ม position relative
      }}
    >
      {/* Data Table */}
      <Box
        sx={{
          mt: 2,
          // Responsive overflow handling
          overflowX: isBelow1350 ? "auto" : "visible",
          overflowY: "visible", // ยังคง visible สำหรับ DatePicker popup
          position: "relative",
          // เพิ่ม scrollbar styling สำหรับ webkit browsers
          "&::-webkit-scrollbar": {
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f5f5f5",
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
            minWidth: isBelow1350 ? 1400 : "auto", // Fixed min-width เมื่อ below 1350
            width: isBelow1350 ? 1400 : "100%", // Fixed width เมื่อ below 1350
          }}
        >
          <TableHead className={styles.tableHead}>
            <TableRow>
              <TableCell
                align="center"
                sx={{
                  width: isBelow1350 ? 80 : 80,
                  minWidth: isBelow1350 ? 80 : "auto",
                }}
                className={styles.headerCell}
              >
                ลำดับ
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 200 : 200,
                  minWidth: isBelow1350 ? 200 : "auto",
                }}
                className={styles.headerCell}
              >
                ชื่อผู้ร้อง
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 300 : 300,
                  minWidth: isBelow1350 ? 300 : "auto",
                }}
                className={styles.headerCell}
              >
                ชื่อเรื่อง
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 160 : 160,
                  minWidth: isBelow1350 ? 160 : "auto",
                }}
                className={styles.headerCell}
              >
                เลขที่ สรร.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 180 : 180,
                  minWidth: isBelow1350 ? 180 : "auto",
                }}
                className={styles.headerCell}
              >
                เลขที่ สป.กค.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 180 : 180,
                  minWidth: isBelow1350 ? 180 : "auto",
                }}
                className={styles.headerCell}
              >
                เลขที่ สป.สร.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 180 : 180,
                  minWidth: isBelow1350 ? 180 : "auto",
                }}
                className={styles.headerCell}
              >
                เลขที่ สตป.
              </TableCell>
              <TableCell
                sx={{
                  width: isBelow1350 ? 160 : 160,
                  minWidth: isBelow1350 ? 160 : "auto",
                }}
                className={styles.headerCell}
              >
                วันที่รับเรื่อง
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item, idx) => (
                <TableRow
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "#f5f7ff !important",
                      transition: "background-color 0.2s ease",
                    },
                  }}
                  className={styles.tableRow}
                >
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 600,
                      color: "#1120A3",
                      fontSize: "14px",
                      minWidth: isBelow1350 ? 80 : "auto",
                    }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "14px",
                      minWidth: isBelow1350 ? 200 : "auto",
                      maxWidth: isBelow1350 ? 200 : "none",
                      whiteSpace: isBelow1350 ? "nowrap" : "normal",
                      overflow: isBelow1350 ? "hidden" : "visible",
                      textOverflow: isBelow1350 ? "ellipsis" : "clip",
                    }}
                  >
                    {item.name || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "14px",
                      minWidth: isBelow1350 ? 300 : "auto",
                      maxWidth: isBelow1350 ? 300 : "none",
                      whiteSpace: isBelow1350 ? "nowrap" : "normal",
                      overflow: isBelow1350 ? "hidden" : "visible",
                      textOverflow: isBelow1350 ? "ellipsis" : "clip",
                    }}
                  >
                    {item.subject || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "14px",
                      minWidth: isBelow1350 ? 160 : "auto",
                    }}
                  >
                    {item.docNo4 || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "14px",
                      minWidth: isBelow1350 ? 180 : "auto",
                    }}
                  >
                    {item.docNo || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "14px",
                      minWidth: isBelow1350 ? 180 : "auto",
                    }}
                  >
                    {item.docNo2 || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "14px",
                      minWidth: isBelow1350 ? 180 : "auto",
                    }}
                  >
                    {item.docNo3 || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "14px",
                      minWidth: isBelow1350 ? 160 : "auto",
                    }}
                  >
                    {item.receiveDate
                      ? dayjs(item.receiveDate).format("D MMM YYYY")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
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
            mt: 1,
            "& .MuiTablePagination-toolbar": {
              padding: "16px",
            },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              {
                fontSize: "14px",
                color: "#666",
              },
            "& .MuiTablePagination-select": {
              fontSize: "14px",
            },
            "& .MuiTablePagination-actions button": {
              color: "#1120a3",
              "&:hover": {
                backgroundColor: "#f5f7ff",
              },
              "&.Mui-disabled": {
                color: "#ccc",
              },
            },
          }}
        />
      </Box>
    </Container>
  );
};

export default TableAssignedComp;
