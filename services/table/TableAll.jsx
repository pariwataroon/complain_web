import React, { useRef, useMemo } from "react";
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
import { exportExcel } from "@utils/exportExcel";
import { exportElementToPDF } from "@utils/exportPDF";

// กลุ่มสถานะที่รองรับทุกสถานะ backend จริง รวมถึง 'completed' และ 'cancelled'
const STATUS_GROUPS = [
  {
    statusKey: "submitted",
    label: "รับเรื่อง",
    statuses: ["รับเรื่อง", "submitted"],
  },
  {
    statusKey: "sent_to_external",
    label: "ส่งหน่วยงานภายนอก",
    statuses: ["ส่งหน่วยงานภายนอก", "sent_to_external"],
  },
  {
    statusKey: "in_process",
    label: "กำลังดำเนินการ",
    statuses: ["กำลังดำเนินการ", "in_process"],
  },
  {
    statusKey: "tracking",
    label: "ติดตามผล",
    statuses: ["ติดตามผล", "tracking"],
  },
  {
    statusKey: "assigned",
    label: "มอบหมายเจ้าหน้าที่",
    statuses: ["มอบหมายเจ้าหน้าที่", "assigned"],
  },
  {
    statusKey: "decision",
    label: "แจ้งผลการพิจารณา",
    statuses: ["แจ้งผลการพิจารณา", "decision"],
  },
  {
    statusKey: "considering",
    label: "อยู่ระหว่างพิจารณา",
    statuses: ["อยู่ระหว่างพิจารณา", "considering"],
  },
  {
    statusKey: "closed",
    label: "ปิดเรื่อง",
    statuses: ["ปิดเรื่อง", "completed", "cancelled"],
  }
];

// สีของแต่ละสถานะ
const statusColors = {
  submitted: "#FFA726",
  sent_to_external: "#AB47BC",
  in_process: "#26C6DA",
  tracking: "#FF7043",
  assigned: "#42A5F5",
  decision: "#388E3C",
  considering: "#FFCA28",
  closed: "#757575",
  completed: "#66BB6A",
  cancelled: "#EF5350",
};

const statusTextColors = {
  submitted: "#fff",
  sent_to_external: "#fff",
  in_process: "#fff",
  tracking: "#fff",
  assigned: "#fff",
  decision: "#fff",
  considering: "#fff",
  closed: "#fff",
  completed: "#fff",
  cancelled: "#fff",
};

// filter dropdown
const STATUS_LABELS = STATUS_GROUPS.map(g => g.label);

// ฟิลด์ที่ใช้ในการค้นหา (เพิ่ม "id")
const SEARCH_FIELDS = [
  "id", "complaint_number", "subject", "complaint_type", "department", "complainant_name"
];

// ฟังก์ชัน robust สำหรับหา group จาก status จริง (trim)
function getStatusGroup(status) {
  const s = (status || "").trim();
  for (const group of STATUS_GROUPS) {
    if (group.statuses.some(x => x.trim() === s)) return group;
  }
  for (const group of STATUS_GROUPS) {
    if (group.label.trim() === s) return group;
  }
  return null;
}

function getStatusStyle(status) {
  const group = getStatusGroup(status);
  let statusKey = group ? group.statusKey : null;
  // กรณี closed ให้แยกสีตาม completed/cancelled หรือใช้ closed
  if (group && group.statusKey === "closed") {
    if (status.trim() === "completed") statusKey = "completed";
    else if (status.trim() === "cancelled") statusKey = "cancelled";
    else statusKey = "closed";
  }
  const color = statusKey ? statusColors[statusKey] : "#bdbdbd";
  const textColor = statusKey ? statusTextColors[statusKey] : "#fff";
  const label = group ? group.label : (status || "").trim();
  return { color, textColor, label };
}

const TableAll = ({
    data = [],
    search = "",
    onSearchChange = () => {},
    statusFilter = "",
    onStatusChange = () => {},
    title = "",
    navigateTo = "",
    page = 0,
    rowsPerPage = 10,
    totalCount = 0,
    onPageChange = () => {},
    onRowsPerPageChange = () => {},
}) => {
    const router = useRouter();

    const handleRowClick = (item) => {
        if (navigateTo) {
            router.push(`${navigateTo}/${item.id}`);
        }
    };

    const tableRef = useRef(null);

    const handleExportPDF = () => {
        const today = new Date().toLocaleDateString("th-TH");
        const filename = `ติดตามผลการดำเนินการ_${today}.pdf`;
        exportElementToPDF(tableRef, filename);
    };

    const handleExportExcel = () => {
        if (!data || data.length === 0) return;

        const today = new Date().toLocaleDateString("th-TH", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });

        const exportColumns = [
            "ลำดับ",
            "วันที่ยื่นเรื่อง",
            "เลขที่ร้องเรียน",
            "เรื่อง",
            "ประเภทเรื่อง",
            "หน่วยงาน",
            "ชื่อผู้ร้องเรียน",
            "สถานะการดำเนินการ",
        ];

        const exportData = data.map((item, index) => [
            (index + 1).toString(),
            formatThaiDateTime(item.created_at),
            item.complaint_number || "-",
            item.subject || "-",
            item.complaint_type || "-",
            item.department || "-",
            item.complainant_name || "-",
            getStatusStyle(item.status).label || "-",
        ]);

        const finalExportData = [
            Array(exportColumns.length).fill(""),
            [`ติดตามผลการดำเนินการ_${today}`],
            exportColumns,
            ...exportData,
        ];

        exportExcel(finalExportData, {
            filename: `ติดตามผลการดำเนินการ_${today}.xlsx`,
            sheetName: "Report",
            title: `ติดตามผลการดำเนินการ`,
            exportDate: `วันที่ส่งออก: ${today}`,
        });
    };

    // ฟิลเตอร์ข้อมูลแบบเรียลไทม์
    const filteredData = useMemo(() => {
      let filtered = data;

      // กรองด้วยสถานะ (ให้ตรงกับ label ที่โชว์) และ trim ทั้งสองฝั่ง
      if (statusFilter) {
        filtered = filtered.filter(
          item => getStatusStyle(item.status).label.trim() === statusFilter.trim()
        );
      }

      // กรองด้วย search (ทุกฟิลด์ที่กำหนด + label สถานะ + statusKey)
      if (search && search.trim() !== "") {
        const searchText = search.trim().toLowerCase();
        filtered = filtered.filter(item => {
          const fieldMatch = SEARCH_FIELDS.some(field =>
            (item[field] || "").toString().toLowerCase().includes(searchText)
          );
          const statusLabel = getStatusStyle(item.status).label || "";
          const statusLabelMatch = statusLabel.toLowerCase().includes(searchText);
          const group = getStatusGroup(item.status);
          let statusKey = group ? group.statusKey : "";
          // เพิ่มสำหรับ closed
          if (group && group.statusKey === "closed") {
            if ((item.status || "").trim() === "completed") statusKey = "completed";
            else if ((item.status || "").trim() === "cancelled") statusKey = "cancelled";
          }
          const statusKeyMatch = statusKey.toString().toLowerCase().includes(searchText);
          return fieldMatch || statusLabelMatch || statusKeyMatch;
        });
      }

      return filtered;
    }, [data, search, statusFilter]);

    // --- แก้ไขตรงนี้: Slice ข้อมูลเฉพาะหน้าปัจจุบัน ---
    const pagedFilteredData = useMemo(() => {
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      return filteredData.slice(start, end);
    }, [filteredData, page, rowsPerPage]);

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
                            onChange={(e) => onSearchChange(e.target.value)}
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
                                onStatusChange(value.trim());
                            }}
                            options={[
                                { value: "", },
                                ...STATUS_LABELS.map(label => ({
                                    value: label, label: label
                                })),
                            ]}
                        />
                    </Box>
                </Box>
                <Box display="flex" gap={1} flexDirection={{ xs: "row", md: "row" }}>
                    <ExportButton
                        label="Export PDF"
                        onClick={handleExportPDF}
                    />
                    <ExportButton
                        label="Export Excel"
                        onClick={handleExportExcel}
                    />
                </Box>
            </Box>
            <Box className={styles.tableWrapper} >
                <Table ref={tableRef}>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                ลำดับ
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                วันที่ยื่นเรื่อง
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                เลขที่ร้องเรียน
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
                                ชื่อผู้ร้องเรียน
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: '#f8f9fa' }}>
                                สถานะการดำเนินการ
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pagedFilteredData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
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
                            pagedFilteredData.map((item, index) => {
                                const { color, textColor, label } = getStatusStyle(item.status);
                                return (
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
                                        <TableCell align="center" sx={{ fontWeight: 600, color: "#1120A3" }}>
                                            {page * rowsPerPage + index + 1}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '14px' }}>
                                            {formatThaiDateTime(item.created_at)}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '14px' }}>
                                            {item.complaint_number || "-"}
                                        </TableCell>
                                        <TableCell className={styles.ellipsisCell} sx={{ maxWidth: '200px' }}>
                                            {item.subject || "-"}
                                        </TableCell>
                                        <TableCell className={styles.ellipsisCell} sx={{ maxWidth: '150px' }}>
                                            {item.complaint_type || "-"}
                                        </TableCell>
                                        <TableCell className={styles.ellipsisCell} sx={{ maxWidth: '150px' }}>
                                            {item.department || "-"}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: '150px' }}>
                                            {item.complainant_name || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={label}
                                                size="small"
                                                sx={{
                                                    backgroundColor: color,
                                                    color: textColor,
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
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    count={filteredData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => onPageChange(newPage)}
                    onRowsPerPageChange={(e) =>
                        onRowsPerPageChange(parseInt(e.target.value, 10))
                    }
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