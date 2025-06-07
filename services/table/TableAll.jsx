import React from "react";
import { useRouter } from "next/router";
import {
    Box,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Container,
    TablePagination,
} from "@mui/material";

import styles from "./TableAll.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField"; // ✅ ใช้ SelectField ที่ถูกต้อง
import ExportButton from "@services/ExportButton/ExportButton";
import { formatThaiDateTime } from "@utils/Formats";

const TableAll = ({
    data = [],
    search = "",
    onSearchChange = () => { },
    statusFilter = "",
    onStatusChange = () => { },
    title = "",
    navigateTo = "",
}) => {
    const router = useRouter();
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const filteredData = data;

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const statusMap = {
        submitted: { label: "รับเรื่อง", color: "green" },
        in_progress: { label: "อยู่ระหว่างดำเนินการ", color: "#f57c00" },
        reviewed: { label: "ติดตามผลการพิจารณา", color: "#1976d2" },
        sent: { label: "ส่งหน่วยงาน", color: "#9c27b0" },
        resolved: { label: "เสร็จสิ้น", color: "#2e7d32" },
        rejected: { label: "ไม่รับดำเนินการ", color: "#d32f2f" },
    };

    const handleRowClick = (item) => {
        if (navigateTo) {
            router.push(`${navigateTo}/${item.id}`);
        }
    };

    return (
        <Container maxWidth="lg">
            <Box className={styles.headerBar}>{title}</Box>

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
                mt={2}
            >
                <Box display="flex" gap={1}>
                    <InputText
                        label="เรื่องที่ร้องเรียนร้องทุกข์"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        required
                    />
                    <SelectField
                        label="สถานะการดำเนินการ"
                        value={statusFilter}
                        onChange={(e) => {
                            console.log("Status filter onChange:", e);

                            if (e && e.target && e.target.value !== undefined) {
                                onStatusChange(e.target.value);
                            } else {
                                onStatusChange(e || "");
                            }
                        }}
                        options={[
                            { value: "", label: "— ทุกสถานะ —" },
                            ...Object.entries(statusMap).map(([key, value]) => ({
                                value: key,
                                label: value.label,
                            })),
                        ]}
                        required
                    />
                </Box>

                <Box display="flex" gap={1}>
                    <ExportButton label="Export PDF" />
                    <ExportButton label="Export Excel" />
                </Box>
            </Box>

            <Box className={styles.tableWrapper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">ลำดับ</TableCell>
                            <TableCell>วันที่ยื่นเรื่อง</TableCell>
                            <TableCell>เรื่อง</TableCell>
                            <TableCell>ประเภทเรื่อง</TableCell>
                            <TableCell>หน่วยงาน</TableCell>
                            <TableCell>วันที่ส่งหน่วยงาน</TableCell>
                            <TableCell>สถานะการดำเนินการ</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    align="center"
                                    sx={{ color: "#999", py: 5 }}
                                >
                                    ยังไม่มีเรื่องร้องทุกข์
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((item, index) => (
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
                                            sx={{ fontWeight: 600, color: "#1120A3" }}
                                        >
                                            {page * rowsPerPage + index + 1}
                                        </TableCell>
                                        <TableCell>
                                            {formatThaiDateTime(item.created_at)}
                                        </TableCell>
                                        <TableCell className={styles.ellipsisCell}>
                                            {item.subject}
                                        </TableCell>
                                        <TableCell className={styles.ellipsisCell}>
                                            {item.complaint_type}
                                        </TableCell>
                                        <TableCell>{item.department}</TableCell>
                                        <TableCell>{item.sentDate}</TableCell>
                                        <TableCell
                                            sx={{
                                                color: statusMap[item.status]?.color || "inherit",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {statusMap[item.status]?.label || item.status}
                                        </TableCell>
                                    </TableRow>
                                ))
                        )}
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    rowsPerPageOptions={[5, 10, 25]}
                    count={filteredData.length}
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

export default TableAll;