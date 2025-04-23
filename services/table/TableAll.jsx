import React from "react";
import { useRouter } from "next/router";
import { Box, Table, TableHead, TableRow, TableCell, TableBody, Container } from "@mui/material";
import styles from "./TableAll.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";

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
    const filteredData = data.filter(
        (item) =>
            item.subject.includes(search) &&
            (statusFilter ? item.status === statusFilter : true)
    );
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
                        required
                    />
                    <SelectField
                        label="สถานะการดำเนินการ"
                        options={["อยู่ระหว่างดำเนินการ", "ติดตามผลการพิจารณา", "ส่งหน่วยงาน"]}
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
                        {filteredData.map((item, index) => (
                            <TableRow
                                key={item.id}
                                onClick={() => handleRowClick(item)}
                                sx={{
                                    cursor: "pointer",
                                    "&:hover": {
                                        backgroundColor: "#f5f7ff",
                                    },
                                }}
                            >
                                <TableCell align="center" sx={{ fontWeight: 600, color: "#1120A3" }}>
                                    {index + 1}
                                </TableCell>
                                <TableCell>{item.date}</TableCell>
                                <TableCell className={styles.ellipsisCell}>{item.subject}</TableCell>
                                <TableCell className={styles.ellipsisCell}>{item.type}</TableCell>
                                <TableCell>{item.department}</TableCell>
                                <TableCell>{item.sentDate}</TableCell>
                                <TableCell>{item.status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                </Table>
            </Box>
        </Container>
    );
};

export default TableAll;
