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
    Typography,
    Chip,
} from "@mui/material";

import styles from "./TableAll.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
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

    // ระบบค้นหาและกรองข้อมูล
    const filteredData = React.useMemo(() => {
        let filtered = [...data];

        // กรองตามการค้นหา
        if (search && search.trim() !== "") {
            const searchTerm = search.toLowerCase().trim();
            filtered = filtered.filter((item) => {
                return (
                    // ค้นหาในเรื่อง
                    (item.subject && item.subject.toLowerCase().includes(searchTerm)) ||
                    // ค้นหาในประเภทเรื่อง
                    (item.complaint_type && item.complaint_type.toLowerCase().includes(searchTerm)) ||
                    // ค้นหาในหน่วยงาน
                    (item.department && item.department.toLowerCase().includes(searchTerm)) ||
                    // ค้นหาใน ID
                    (item.id && item.id.toString().includes(searchTerm)) ||
                    // ค้นหาในรหัสเรื่อง (ถ้ามี)
                    (item.case_code && item.case_code.toLowerCase().includes(searchTerm)) ||
                    // ค้นหาในผู้แจ้ง (ถ้ามี)
                    (item.reporter_name && item.reporter_name.toLowerCase().includes(searchTerm)) ||
                    // ค้นหาในรายละเอียด (ถ้ามี)
                    (item.description && item.description.toLowerCase().includes(searchTerm))
                );
            });
        }

        // กรองตามสถานะ
        if (statusFilter && statusFilter !== "") {
            filtered = filtered.filter((item) => item.status === statusFilter);
        }

        return filtered;
    }, [data, search, statusFilter]);

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    React.useEffect(() => {
        setPage(0);
    }, [search, statusFilter]);

    // แก้ไข statusMap ให้ตรงกับข้อมูลจริง
    const statusMap = {
        "รับเรื่อง": { label: "รับเรื่อง", color: "#4caf50", bgColor: "#e8f5e8" },
        "อยู่ระหว่างดำเนินการ": { label: "อยู่ระหว่างดำเนินการ", color: "#f57c00", bgColor: "#fff3e0" },
        "ติดตามผลการพิจารณา": { label: "ติดตามผลการพิจารณา", color: "#1976d2", bgColor: "#e3f2fd" },
        "ส่งหน่วยงาน": { label: "ส่งหน่วยงาน", color: "#9c27b0", bgColor: "#f3e5f5" },
        "เสร็จสิ้น": { label: "เสร็จสิ้น", color: "#2e7d32", bgColor: "#e8f5e8" },
        "ไม่รับดำเนินการ": { label: "ไม่รับดำเนินการ", color: "#d32f2f", bgColor: "#ffebee" },

        // เพิ่ม mapping แบบเก่าเผื่อมีข้อมูลแบบ key
        submitted: { label: "รับเรื่อง", color: "#4caf50", bgColor: "#e8f5e8" },
        in_progress: { label: "อยู่ระหว่างดำเนินการ", color: "#f57c00", bgColor: "#fff3e0" },
        reviewed: { label: "ติดตามผลการพิจารณา", color: "#1976d2", bgColor: "#e3f2fd" },
        sent: { label: "ส่งหน่วยงาน", color: "#9c27b0", bgColor: "#f3e5f5" },
        resolved: { label: "เสร็จสิ้น", color: "#2e7d32", bgColor: "#e8f5e8" },
        rejected: { label: "ไม่รับดำเนินการ", color: "#d32f2f", bgColor: "#ffebee" },
    };

    const handleRowClick = (item) => {
        if (navigateTo) {
            console.log(`🔗 Navigating to: ${navigateTo}/${item.id}`, {
                user: "vampirebeam",
                timestamp: "2025-06-16 13:36:32",
                itemId: item.id
            });
            router.push(`${navigateTo}/${item.id}`);
        }
    };

    return (
        <Container maxWidth="lg">
            <Box className={styles.headerBar}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: '#ffff' }}>
                    {title}
                </Typography>
            </Box>

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={3}
                mt={2}
                flexDirection={{ xs: "column", md: "row" }}
                gap={2}
            >
                <Box display="flex" gap={2} flexDirection={{ xs: "column", sm: "row" }} flex={1}>
                    <Box sx={{ minWidth: { xs: "100%", sm: "300px" } }}>
                        <InputText
                            label="ค้นหาเรื่องร้องเรียนร้องทุกข์"
                            placeholder="ค้นหาด้วยเรื่อง, ประเภท, หน่วยงาน, รหัสเรื่อง หรือผู้แจ้ง..."
                            value={search}
                            onChange={(e) => {
                                const value = e.target.value;
                                onSearchChange(value);
                            }}
                            InputProps={{
                                endAdornment: search && (
                                    <Box
                                        sx={{
                                            cursor: 'pointer',
                                            color: '#6c757d',
                                            '&:hover': { color: '#dc3545' }
                                        }}
                                        onClick={() => onSearchChange("")}
                                    >
                                        ✕
                                    </Box>
                                )
                            }}
                        />
                    </Box>

                    <Box sx={{ minWidth: { xs: "100%", sm: "200px" } }}>
                        <SelectField
                            label="สถานะการดำเนินการ"
                            value={statusFilter}
                            onChange={(e) => {
                                const value = e && e.target && e.target.value !== undefined
                                    ? e.target.value
                                    : e || "";

                                console.log("📊 Status filter changed:", {
                                    user: "vampirebeam",
                                    timestamp: "2025-06-16 13:36:32",
                                    newStatus: value,
                                    previousStatus: statusFilter
                                });

                                onStatusChange(value);
                            }}
                            options={[
                                { value: "", label: "— ทุกสถานะ —" },
                                { value: "รับเรื่อง", label: "รับเรื่อง" },
                                { value: "อยู่ระหว่างดำเนินการ", label: "อยู่ระหว่างดำเนินการ" },
                                { value: "ติดตามผลการพิจารณา", label: "ติดตามผลการพิจารณา" },
                                { value: "ส่งหน่วยงาน", label: "ส่งหน่วยงาน" },
                                { value: "เสร็จสิ้น", label: "เสร็จสิ้น" },
                                { value: "ไม่รับดำเนินการ", label: "ไม่รับดำเนินการ" },
                            ]}
                        />
                    </Box>
                </Box>

                <Box display="flex" gap={1} flexDirection={{ xs: "row", md: "row" }}>
                    <ExportButton
                        label="Export PDF"
                        onClick={() => {
                            console.log("📄 PDF Export clicked:", {
                                user: "vampirebeam",
                                timestamp: "2025-06-16 13:36:32",
                                dataCount: filteredData.length
                            });
                        }}
                    />
                    <ExportButton
                        label="Export Excel"
                        onClick={() => {
                            console.log("📊 Excel Export clicked:", {
                                user: "vampirebeam",
                                timestamp: "2025-06-16 13:36:32",
                                dataCount: filteredData.length
                            });
                        }}
                    />
                </Box>
            </Box>

            <Box className={styles.tableWrapper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                ลำดับ
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                วันที่ยื่นเรื่อง
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                เรื่อง
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                ประเภทเรื่อง
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                หน่วยงาน
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                วันที่ส่งหน่วยงาน
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                สถานะการดำเนินการ
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    align="center"
                                    sx={{
                                        color: "#6c757d",
                                        py: 5,
                                        fontSize: '16px'
                                    }}
                                >
                                    {search || statusFilter ? (
                                        <Box>
                                            <Typography variant="h6" sx={{ color: '#495057', mb: 1 }}>
                                                ไม่พบข้อมูลที่ค้นหา
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#6c757d' }}>
                                                ลองปรับเปลี่ยนคำค้นหาหรือเงื่อนไขการกรอง
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <Typography variant="h6" sx={{ color: '#495057', mb: 1 }}>
                                                ยังไม่มีเรื่องร้องทุกข์
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#6c757d' }}>
                                                เมื่อมีการยื่นเรื่องร้องทุกข์ จะแสดงในตารางนี้
                                            </Typography>
                                        </Box>
                                    )}
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
                                            "&:hover": {
                                                backgroundColor: "#f5f7ff",
                                                transform: "scale(1.001)",
                                                transition: "all 0.2s ease"
                                            },
                                            "&:nth-of-type(even)": {
                                                backgroundColor: "#fafbfc"
                                            }
                                        }}
                                    >
                                        <TableCell
                                            align="center"
                                            sx={{ fontWeight: 600, color: "#1120A3" }}
                                        >
                                            {page * rowsPerPage + index + 1}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '14px' }}>
                                            {formatThaiDateTime(item.created_at)}
                                        </TableCell>
                                        <TableCell
                                            className={styles.ellipsisCell}
                                            sx={{ maxWidth: '300px' }}
                                        >
                                            {item.subject}
                                        </TableCell>
                                        <TableCell
                                            className={styles.ellipsisCell}
                                            sx={{ maxWidth: '200px' }}
                                        >
                                            {item.complaint_type}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: '200px' }}>
                                            {item.department}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '14px' }}>
                                            {item.sentDate ? formatThaiDateTime(item.sentDate) : (
                                                <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                                    ยังไม่ได้ส่ง
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={statusMap[item.status]?.label || item.status}
                                                size="small"
                                                sx={{
                                                    backgroundColor: statusMap[item.status]?.bgColor || '#f5f5f5',
                                                    color: statusMap[item.status]?.color || '#495057',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    borderRadius: '16px',
                                                    '& .MuiChip-label': {
                                                        px: 2
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                        )}
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    count={filteredData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    labelRowsPerPage="แสดงต่อหน้า:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`} รายการ`
                    }
                    sx={{
                        borderTop: "1px solid #eee",
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            fontSize: '14px',
                            color: '#495057'
                        }
                    }}
                />
            </Box>
        </Container>
    );
};

export default TableAll;