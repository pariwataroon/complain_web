import React, { useState, useCallback } from "react";
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
  useMediaQuery,
  useTheme,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import styles from "./TableDepartments_External.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EditDepartments_ExternalModal from "@components/GeneralUsageMenu/Departments_External/modal/EditDepartments_ExternalModal";
import { DeleteOutsideDepartment } from "@pages/api/outsideDepartments/outsideDepartments";
import {
  alertSuccess,
  alertError,
  showConfirm,
} from "@utils/Alerts";

const TableDepartments_External = ({
  data = [],
  title = "",
  levelOptions = [],
  onSearch = () => { },
  onDataRefresh = () => { },
  page,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  total = 0,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery("(max-width:1200px)");
  const isExtraSmallScreen = useMediaQuery("(max-width:600px)");

  // State สำหรับ Edit Modal
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [filters, setFilters] = useState({
    name: "",
    level: "",
    description: "",
    status: "",
  });

  // ฟังก์ชันเปิด Edit Modal
  const handleEditClick = (item) => {
    setSelectedItem(item);
    setOpenEditModal(true);
  };

  // ฟังก์ชันปิด Edit Modal
  const handleCloseEditModal = () => {
    setSelectedItem(null);
    setOpenEditModal(false);
  };

  // ฟังก์ชันจัดการ Delete
  const handleDeleteClick = async (item) => {
    try {
      const isConfirmed = await showConfirm(
        "ยืนยันการลบ",
        `คุณต้องการลบกลุ่มหน่วยงาน "${item.name}" ใช่หรือไม่?`,
        "ลบ",
        "ยกเลิก"
      );

      if (!isConfirmed) {
        return;
      }

      console.log('Deleting department ID:', item.id);
      const result = await DeleteOutsideDepartment(item.id);

      if (result && (result.res_code === "0000" || result.res_code === "0001")) {
        await alertSuccess("สำเร็จ", "ลบกลุ่มหน่วยงานสำเร็จ");
        onDataRefresh();
      } else if (result && result.res_code === "4090") {
        await alertError("ไม่สามารถลบได้", "กลุ่มหน่วยงานนี้ถูกใช้งานอยู่ ไม่สามารถลบได้");
      } else {
        await alertError(
          "เกิดข้อผิดพลาด",
          result?.res_message || result?.res_desc || "ไม่สามารถลบกลุ่มหน่วยงานได้"
        );
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      await alertError("เกิดข้อผิดพลาด", "ไม่สามารถลบกลุ่มหน่วยงานได้");
    }
  };

  const handleInputChange = (field) => (e) => {
    const value = e?.target?.value || "";
    setFilters((prev) => ({
      ...prev,
      [field]: String(value),
    }));
  };

  const handleSelectChange = (field) => (e) => {
    let finalValue = "";

    if (e && typeof e === "object") {
      if (e.target && e.target.value !== undefined) {
        const selectedValue = e.target.value;

        if (typeof selectedValue === "object" && selectedValue !== null) {
          finalValue = String(selectedValue.value || "");
        } else {
          finalValue = String(selectedValue || "");
        }
      } else if (e.value !== undefined) {
        finalValue = String(e.value || "");
      }
    } else {
      finalValue = String(e || "");
    }

    setFilters((prev) => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  const handleSearchClick = useCallback(() => {
    console.log('Search clicked with filters:', filters);

    // กรอง filters ที่มีค่า
    const activeFilters = Object.keys(filters).reduce((acc, key) => {
      if (filters[key] && String(filters[key]).trim() !== '') {
        acc[key] = String(filters[key]).trim();
      }
      return acc;
    }, {});

    console.log('Active filters:', activeFilters);
    onSearch(activeFilters);
  }, [filters, onSearch]);

  const handleClearSearch = useCallback(() => {
    const cleared = {
      name: "",
      level: "",
      description: "",
      status: "",
    };
    setFilters(cleared);
    onPageChange(0);
    onSearch({});
  }, [onPageChange, onSearch]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  const statusOptions = [
    { value: "true", label: "ใช้งาน" },
    { value: "false", label: "ไม่ใช้งาน" },
  ];

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        boxShadow: "0 6px 18px rgba(0,0,0,.06)",
        mt: 2,
      }}
    >
      <Box className={styles.headerBar}>{title}</Box>

      {/* Search Bar - Responsive Layout */}
      <Box sx={{ px: 2, py: 2 }}>
        {isSmallScreen ? (
          // Mobile/Tablet Layout (< 1200px)
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Search Fields Grid */}
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
              }}
              gap={2}
            >
              <InputText
                label="ชื่อหน่วยงาน"
                inputLabel="กรอกชื่อหน่วยงาน"
                value={String(filters.name || "")}
                onChange={handleInputChange("name")}
                onKeyPress={handleKeyPress}
              />

              <SelectField
                label="ลำดับหน่วยงาน"
                inputLabel="เลือกลำดับหน่วยงาน"
                options={levelOptions}
                value={String(filters.level || "")}
                onChange={handleSelectChange("level")}
                name="level"
              />

              <InputText
                label="คำอธิบาย"
                inputLabel="กรอกคำอธิบาย"
                value={String(filters.description || "")}
                onChange={handleInputChange("description")}
                onKeyPress={handleKeyPress}
              />

              <SelectField
                label="สถานะ"
                inputLabel="เลือกสถานะ"
                options={statusOptions}
                value={String(filters.status || "")}
                onChange={handleSelectChange("status")}
                name="status"
              />
            </Box>

            {/* Action Buttons - Responsive Layout */}
            {isExtraSmallScreen ? (
              // Extra Small (xs) - แยกบรรทัด
              <Box display="flex" flexDirection="column" gap={2}>
                {/* Search & Clear Buttons */}
                <Box display="flex" justifyContent="center" gap={1}>
                  <IconButton
                    onClick={handleSearchClick}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": { bgcolor: "#0b1580" },
                      height: 40,
                      width: 40,
                    }}
                    title="ค้นหา"
                  >
                    <SearchIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleClearSearch}
                    sx={{
                      bgcolor: "#dc3545",
                      color: "#fff",
                      "&:hover": { bgcolor: "#c82333" },
                      height: 40,
                      width: 40,
                    }}
                    title="ล้างการค้นหา"
                  >
                    <CleaningServicesIcon />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              // Small and up (sm+) - แถวเดียว
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
              >
                {/* Search & Clear Buttons */}
                <Box display="flex" gap={1}>
                  <IconButton
                    onClick={handleSearchClick}
                    sx={{
                      bgcolor: "#1120A3",
                      color: "#fff",
                      "&:hover": { bgcolor: "#0b1580" },
                      height: 40,
                      width: 40,
                    }}
                    title="ค้นหา"
                  >
                    <SearchIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleClearSearch}
                    sx={{
                      bgcolor: "#dc3545",
                      color: "#fff",
                      "&:hover": { bgcolor: "#c82333" },
                      height: 40,
                      width: 40,
                    }}
                    title="ล้างการค้นหา"
                  >
                    <CleaningServicesIcon />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          // Desktop Layout (>= 1200px)
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
            sx={{
              flexWrap: "nowrap",
              whiteSpace: "nowrap",
              overflowX: "auto",
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              sx={{ flexWrap: "nowrap" }}
            >
              <InputText
                label="ชื่อหน่วยงาน"
                inputLabel="กรอกชื่อหน่วยงาน"
                value={String(filters.name || "")}
                onChange={handleInputChange("name")}
                onKeyPress={handleKeyPress}
              />

              <SelectField
                label="ลำดับหน่วยงาน"
                inputLabel="เลือกลำดับหน่วยงาน"
                options={levelOptions}
                value={String(filters.level || "")}
                onChange={handleSelectChange("level")}
                name="level"
              />

              <InputText
                label="คำอธิบาย"
                inputLabel="กรอกคำอธิบาย"
                value={String(filters.description || "")}
                onChange={handleInputChange("description")}
                onKeyPress={handleKeyPress}
              />

              <SelectField
                label="สถานะ"
                inputLabel="เลือกสถานะ"
                options={statusOptions}
                value={String(filters.status || "")}
                onChange={handleSelectChange("status")}
                name="status"
              />

              <IconButton
                onClick={handleSearchClick}
                sx={{
                  bgcolor: "#1120A3",
                  color: "#fff",
                  "&:hover": { bgcolor: "#0b1580" },
                  flexShrink: 0,
                  height: 40,
                  width: 40,
                }}
                title="ค้นหา"
              >
                <SearchIcon />
              </IconButton>
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  bgcolor: "#dc3545",
                  color: "#fff",
                  "&:hover": { bgcolor: "#c82333" },
                  flexShrink: 0,
                  height: 40,
                  width: 40,
                }}
                title="ล้างการค้นหา"
              >
                <CleaningServicesIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Table - Conditional Scrolling based on screen size */}
      <Box
        className={styles.tableWrapper}
        id="table-results"
        sx={{
          overflowX: isSmallScreen ? "auto" : "visible",
          px: 2,
          pb: 1,
        }}
      >
        <Table
          sx={{
            minWidth: isSmallScreen ? 1200 : "100%",
            width: isSmallScreen ? 1200 : "100%",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 80, fontWeight: "bold" }}>
                ลำดับ
              </TableCell>
              <TableCell sx={{ width: 300, fontWeight: "bold" }}>
                ชื่อหน่วยงาน
              </TableCell>
              <TableCell sx={{ width: 150, fontWeight: "bold" }}>
                ลำดับหน่วยงาน
              </TableCell>
              <TableCell sx={{ width: 300, fontWeight: "bold" }}>
                คำอธิบาย
              </TableCell>
              <TableCell sx={{ width: 120, fontWeight: "bold" }}>
                สถานะ
              </TableCell>
              <TableCell sx={{ width: 150, fontWeight: "bold" }}>
                วันที่สร้าง
              </TableCell>
              <TableCell align="center" sx={{ width: 120, fontWeight: "bold" }}>
                จัดการ
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map((item, idx) => (
                <TableRow
                  key={item.id}
                  sx={{
                    "&:hover": { backgroundColor: "#f5f7ff" },
                    "&:nth-of-type(even)": { backgroundColor: "#fafafa" },
                  }}
                >
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600, color: "#1120A3" }}
                  >
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {item.name || "-"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.level || "-"}
                      size="small"
                      sx={{
                        backgroundColor: "#e8f5e8",
                        color: "#388e3c",
                      }}
                    />
                  </TableCell>
                  <TableCell className={styles.ellipsisCell}>
                    {item.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.is_active ? "ใช้งาน" : "ไม่ใช้งาน"}
                      size="small"
                      color={item.is_active ? "success" : "error"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString('th-TH')
                      : "-"
                    }
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5} justifyContent="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(item)}
                        title="แก้ไข"
                        sx={{
                          bgcolor: "#f0f8ff",
                          "&:hover": {
                            bgcolor: "#e3f2fd",
                            transform: "scale(1.05)"
                          },
                          transition: "all 0.2s"
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(item)}
                        title="ลบ"
                        sx={{
                          bgcolor: "#fff5f5",
                          "&:hover": {
                            bgcolor: "#ffebee",
                            transform: "scale(1.05)"
                          },
                          transition: "all 0.2s"
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 3, color: "#999" }}
                >
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Edit Modal */}
        <EditDepartments_ExternalModal
          open={openEditModal}
          onClose={handleCloseEditModal}
          editingItem={selectedItem}
          onSuccess={() => {
            handleCloseEditModal();
            onDataRefresh();
          }}
        />

        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25]}
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) =>
            onRowsPerPageChange(parseInt(e.target.value, 10))
          }
          labelRowsPerPage="แถวต่อหน้า:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
          }
          sx={{ borderTop: "1px solid #eee" }}
        />
      </Box>
    </Container>
  );
};

export default TableDepartments_External;