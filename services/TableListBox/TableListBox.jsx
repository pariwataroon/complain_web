import React, { useState, useMemo, useRef, useEffect } from "react";
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
  Typography,
  Paper,
  Chip,
  Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import { exportElementToPDF } from "@utils/exportPDF";

import styles from "./TableListBox.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import ExportButton from "@services/ExportButton/ExportButton";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { exportExcel } from "@utils/exportExcel";
import { getDepartmentsPrefix } from "@pages/api/department/department";
import { GetAllOutsideDepartments } from "@pages/api/outsideDepartments/outsideDepartments";

const TableListBox = ({
  data = [],
  title = "",
  navigateTo = "",
  onRowClick,
  onSearch = () => {},
  onResetSearch,
  filterFields = [],
}) => {
  const router = useRouter();
  const tableWrapperRef = useRef(null);

  // Breakpoints
  const isExtraSmall = useMediaQuery("(max-width:640px)");
  const isSmall = useMediaQuery("(max-width:768px)");
  const isMedium = useMediaQuery("(max-width:1024px)");
  const isLarge = useMediaQuery("(max-width:1305px)");
  const needsScrollbar = useMediaQuery("(max-width:1200px)");

  // State สำหรับ options หน่วยงาน
  const [departmentOptions, setDepartmentOptions] = useState([]);

  // State สำหรับ options หน่วยงานภายนอก
  const [outsidedepartmentOptions, setOutsideDepartmentOptions] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await getDepartmentsPrefix();
        if (Array.isArray(res?.res_data)) {
          const mapped = res.res_data.map((dep) => ({
            value: dep.name,
            label: dep.name,
          }));
          setDepartmentOptions(mapped);
        } else {
          setDepartmentOptions([]);
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
        setDepartmentOptions([]);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchOutsideDepartments = async () => {
    try {
      const res = await GetAllOutsideDepartments();
      // รองรับหลายโครงสร้าง response
      const list = res?.res_data?.items || res?.res_data || res || [];
      const mapped = (Array.isArray(list) ? list : []).map((d) => {
        const name =
            d?.name ||
            d?.department_name ||
            d?.title ||
            d?.shortName ||
            d?.code ||
            "";
          return name ? { value: name, label: name } : null;
        }).filter(Boolean);
        setOutsideDepartmentOptions(mapped);
      } catch (err) {
        console.error("Error fetching outside departments:", err);
        setOutsideDepartmentOptions([]);
      }
    };
    fetchOutsideDepartments();
  }, []);

  // Filters
  const initialFilters = filterFields.reduce((acc, f) => {
    acc[f.name] = f.type === "date" ? null : "";
    return acc;
  }, {});
  const [filters, setFilters] = useState(initialFilters);
  
  // แก้ไข handleChange ให้รองรับ SelectField และ DatePicker
  const handleChange = (field) => (e) => {
    let value;

    // Check if this is a date field
    const fieldConfig = filterFields.find(f => f.name === field);
    if (fieldConfig?.type === "date") {
      // For date picker, use the value directly (could be date object or null)
      value = e;
    } else if (e?.target) {
      // กรณี input text ธรรมดา
      value = e.target.value;
    } else if (typeof e === 'string') {
      // กรณี SelectField ที่ return value โดยตรง
      value = e;
    } else if (e?.value) {
      // กรณี SelectField ที่ return object {value, label}
      value = e.value;
    } else {
      // กรณีอื่นๆ
      value = e || "";
    }

    setFilters({ ...filters, [field]: value });
  };

  // Pagination
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

  // Search
  const handleSearchClick = () => {
    setPage(0);
    onSearch(filters);
  };
  const handleClearSearch = () => {
    setFilters(initialFilters);
    setPage(0);
    if (onResetSearch) onResetSearch();
    else onSearch(initialFilters);
  };

  // Export PDF
  const handleExportPDF = () => {
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `คลังเรื่องราวร้องทุกข์_${title}_${today}.pdf`;
    exportElementToPDF(tableWrapperRef, filename);
  };

  // Columns with enhanced design - ปรับขนาดคอลัมน์ สถานะเรื่อง
  const columns = [
    {
      name: "rowNumber",
      label: "ลำดับ",
      width: 80,
      align: "center",
    },
    {
      name: "receiveDate",
      label: "วันที่ร้อง",
      width: 120,
      align: "center",
    },
    {
      name: "agency2",
      label: "หน่วยงานภายใน",
      width: 200,
      align: "left",  
    },
    {
      name: "agency",
      label: "หน่วยงานภายนอก",
      width: 200,
      align: "left",
    },
    {
      name: "claimantName",
      label: "ชื่อสกุลผู้ร้อง",
      width: 180,
      align: "left",
    },
    {
      name: "issue",
      label: "เรื่อง",
      width: 200,
      align: "left",
    },
    {
      name: "issueType",
      label: "ประเภทเรื่อง",
      width: 200,
      align: "center",
    },
    {
      name: "subIssueType",
      label: "ประเภทเรื่องย่อย",
      width: 150,
      align: "center",
    },
    {
      name: "responsibleOfficer",
      label: "เจ้าหน้าที่รับผิดชอบ",
      width: 180,
      align: "left",
    },
    {
      name: "status",
      label: "สถานะเรื่อง",
      width: 170, // เพิ่มจาก 160 เป็น 220
      align: "center",
    },
    {
      name: "complaintNumberSorn", // เพิ่มคอลัมน์ เลข สรร.
      label: "เลข สรร.",
      width: 180,
      align: "center",
    },
    {
      name: "note",
      label: "หมายเหตุ",
      width: 160,
      align: "left",
    },
  ];

  // Export Excel
  const handleExportExcel = () => {
    if (!Array.isArray(pagedData) || pagedData.length === 0) {
      alert("ไม่มีข้อมูลที่จะแสดงใน Excel");
      return;
    }
    const exportData = pagedData.map((item, idx) => {
      const row = { ลำดับ: page * rowsPerPage + idx + 1 };
      columns.forEach((col) => {
        row[col.label] = item[col.name] ?? "-";
      });
      return row;
    });
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `คลังเรื่องราวร้องทุกข์_${today}.xlsx`;
    exportExcel(exportData, filename);
  };

  // Row click
  const handleRowClick = (item) => {
    if (onRowClick) {
      onRowClick(item);
    } else if (navigateTo) {
      router.push(`${navigateTo}/${item.id}`);
    }
  };

  // Layout config
  const getLayoutConfig = () => {
    if (isExtraSmall) {
      return {
        layout: "stacked",
        fieldsPerRow: 1,
        gap: 1.5,
        padding: 1.5,
        inputHeight: "48px",
        iconSize: 40,
      };
    } else if (isSmall) {
      return {
        layout: "stacked",
        fieldsPerRow: 2,
        gap: 1.5,
        padding: 2,
        inputHeight: "48px",
        iconSize: 44,
      };
    } else if (isMedium) {
      return {
        layout: "two-row",
        fieldsPerRow: 3,
        gap: 2,
        padding: 2.5,
        inputHeight: "48px",
        iconSize: 44,
      };
    } else if (isLarge) {
      return {
        layout: "large-responsive",
        fieldsPerRow: Math.min(5, filterFields.length),
        gap: 2,
        padding: 3,
        inputHeight: "48px",
        iconSize: 44,
      };
    }
    return {
      layout: "single-row",
      fieldsPerRow: filterFields.length,
      gap: 2,
      padding: 3,
      inputHeight: "48px",
      iconSize: 44,
    };
  };
  const layoutConfig = getLayoutConfig();

  // Enhanced filter styles
  const getFilterFieldStyles = () => ({
    "& .MuiInputBase-root": {
      height: layoutConfig.inputHeight,
      borderRadius: "12px",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(8px)",
      border: "1px solid #e3f2fd",
      transition: "all 0.3s ease",
      "&:hover": {
        borderColor: "#1976d2",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px rgba(25, 118, 210, 0.15)",
      },
      "&.Mui-focused": {
        borderColor: "#1976d2",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.1)",
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: isExtraSmall ? "14px" : "15px",
      fontWeight: 500,
      color: "#1565c0",
    },
    "& .MuiInputBase-input": {
      fontSize: isExtraSmall ? "14px" : "15px",
      fontWeight: 400,
    },
  });

  const renderFilterField = (f) => {
    const commonProps = {
      fullWidth: true,
      label: f.label,
      value: filters[f.name],
      onChange: handleChange(f.name),
      size: "small",
      sx: getFilterFieldStyles(),
    };

    // เพิ่ม onKeyDown สำหรับช่องที่เป็น text เพื่อรองรับ Enter key
    if (f.type === "text" || !f.type) {
      commonProps.onKeyDown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSearchClick(); // เรียก function search
        }
      };
    }

    // แก้ไขการจัดการ agency, agency2 และ outagency
    if (f.name === "agency") {
      return (
        <SelectField
          {...commonProps}
          options={departmentOptions}
        />
      );
    }

    if (f.name === "agency2") {
      return (
        <SelectField
          {...commonProps}
          options={departmentOptions}
        />
      );
    }

    if (f.name === "outagency") {
        return (
          <SelectField
            {...commonProps}
            options={outsidedepartmentOptions}
          />
        );
    }

    // รองรับ type date
    if (f.type === "date") {
      return (
        <DateThaiPickerService
          {...commonProps}
          placeholder="กรุณาเลือกวันที่....."
        />
      );
    }

    return f.type === "select" ? (
      <SelectField {...commonProps} options={f.options} />
    ) : (
      <InputText {...commonProps} />
    );
  };

  // Enhanced status cell with modern chip design
  const renderStatusCell = (item) => {
    const getStatusChipProps = (statusColor, status) => {
      const lightColor = statusColor + "20";
      const darkColor = statusColor;

      return {
        label: status ?? "-",
        size: "small",
        sx: {
          backgroundColor: lightColor,
          color: darkColor,
          fontWeight: 600,
          fontSize: "12px",
          height: "28px",
          borderRadius: "14px",
          border: `1px solid ${statusColor}40`,
          "& .MuiChip-label": {
            padding: "0 12px",
          },
          "& .MuiChip-avatar": {
            width: 8,
            height: 8,
            backgroundColor: darkColor,
            marginLeft: "8px",
            marginRight: "-4px",
          },
        },
        avatar: (
          <Avatar
            sx={{ width: 8, height: 8, backgroundColor: item.statusColor }}
          />
        ),
      };
    };

    return (
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Chip
          {...getStatusChipProps(item.statusColor || "#9E9E9E", item.status)}
        />
      </Box>
    );
  };

  // Enhanced cell renderers
  const renderEnhancedCell = (item, col, index) => {
    const value = item[col.name] ?? "-";

    switch (col.name) {
      case "rowNumber":
        return (
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#1565c0",
              textAlign: "center",
            }}
          >
            {page * rowsPerPage + index + 1}
          </Typography>
        );

      case "status":
        return renderStatusCell(item);

      case "claimantName":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: item.isMaster ? "#1565c0" : "#94ccf9ff" }} />
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 500,
                color: item.isMaster ? "#1565c0" : "#94ccf9ff",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={value}
            >
              {value}
            </Typography>
          </Box>
        );

      case "agency":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BusinessIcon
              sx={{ fontSize: 18, color: item.isMaster ? "#1565c0" : "#94ccf9ff" }}
            />
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: item.isMaster ? "#1565c0" : "#94ccf9ff",
              }}
              title={value}
            >
              {value}
            </Typography>
          </Box>
        );

      case "agency2":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BusinessIcon
              sx={{ fontSize: 18, color: item.isMaster ? "#1565c0" : "#94ccf9ff" }}
            />
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: item.isMaster ? "#1565c0" : "#94ccf9ff",
              }}
              title={value}
            >
              {value}
            </Typography>
          </Box>
        );

      case "issue":
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DescriptionIcon
              sx={{ fontSize: 18, color: item.isMaster ? "#1565c0" : "#94ccf9ff" }}
            />
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "200px",
                color: item.isMaster ? "#1565c0" : "#94ccf9ff",
              }}
              title={value}
            >
              {value}
            </Typography>
          </Box>
        );

      case "receiveDate":
        return (
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#1565c0",
              textAlign: "center",
            }}
          >
            {value}
          </Typography>
        );

      case "issueType":
      case "subIssueType":
        return value !== "-" ? (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Chip
              label={value}
              size="small"
              variant="outlined"
              sx={{
                fontSize: "12px",
                height: "24px",
                borderColor: "#e3f2fd",
                color: "#1565c0",
                backgroundColor: "#f8fbff",
                "& .MuiChip-label": {
                  padding: "0 8px",
                },
              }}
            />
          </Box>
        ) : (
          <Typography sx={{ textAlign: "center", color: "#9e9e9e" }}>
            -
          </Typography>
        );

      default:
        return (
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: col.align || "left",
            }}
            title={value}
          >
            {value}
          </Typography>
        );
    }
  };

  // Enhanced search buttons
  const SearchButton = ({
    onClick,
    icon,
    color,
    hoverColor,
    title,
    bgColor,
  }) => (
    <IconButton
      onClick={onClick}
      sx={{
        background: `linear-gradient(135deg, ${bgColor}, ${color})`,
        color: "#fff",
        width: layoutConfig.iconSize,
        height: layoutConfig.iconSize,
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          background: `linear-gradient(135deg, ${hoverColor}, ${color})`,
          transform: "translateY(-2px)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
        },
        "&:active": {
          transform: "translateY(0px)",
        },
      }}
      title={title}
    >
      {icon}
    </IconButton>
  );

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        background: "linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%)",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        overflow: "visible",
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      {/* Enhanced Header */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #2196f3 100%)",
          height: isExtraSmall ? 60 : 70,
          borderRadius: "20px 20px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent 50%)",
          },
        }}
      >
        <Typography
          sx={{
            color: "#ffffff",
            fontSize: isExtraSmall ? "18px" : "24px",
            fontWeight: 700,
            textAlign: "center",
            textShadow: "0 2px 4px rgba(0,0,0,0.2)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Enhanced Title + Export Section */}
      <Box
        sx={{
          padding: isExtraSmall ? "20px 16px" : "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: isExtraSmall ? "column" : "row",
          gap: isExtraSmall ? 2 : 0,
          borderBottom: "1px solid #e3f2fd",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 24,
              background: "linear-gradient(to bottom, #1976d2, #2196f3)",
              borderRadius: "2px",
            }}
          />
          <Typography
            sx={{
              fontSize: isExtraSmall ? "16px" : "18px",
              fontWeight: 600,
              color: "#1565c0",
            }}
          >
            ข้อมูลทั้งหมด {data.length} รายการ
          </Typography>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={2}
          sx={{
            flexDirection: isExtraSmall ? "column" : "row",
            width: isExtraSmall ? "100%" : "auto",
          }}
        >
          <ExportButton
            label="ส่งออก PDF"
            sx={{
              background: "linear-gradient(135deg, #e53935, #f44336)",
              color: "#ffffff",
              borderRadius: "12px",
              fontSize: isExtraSmall ? "13px" : "14px",
              fontWeight: 600,
              minWidth: isExtraSmall ? "140px" : "auto",
              height: "40px",
              boxShadow: "0 4px 12px rgba(229, 57, 53, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #d32f2f, #e53935)",
                transform: "translateY(-1px)",
                boxShadow: "0 6px 16px rgba(229, 57, 53, 0.4)",
              },
            }}
            onClick={handleExportPDF}
          />
          <ExportButton
            label="ส่งออก Excel"
            onClick={handleExportExcel}
            sx={{
              background: "linear-gradient(135deg, #2e7d32, #4caf50)",
              color: "#ffffff",
              borderRadius: "12px",
              fontSize: isExtraSmall ? "13px" : "14px",
              fontWeight: 600,
              minWidth: isExtraSmall ? "140px" : "auto",
              height: "40px",
              boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
                transform: "translateY(-1px)",
                boxShadow: "0 6px 16px rgba(46, 125, 50, 0.4)",
              },
            }}
          />
        </Box>
      </Box>

      {/* Enhanced Filters Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #fafbff 0%, #f0f4ff 100%)",
          borderRadius: "16px",
          margin: layoutConfig.padding,
          padding: layoutConfig.padding,
          border: "1px solid #e3f2fd",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {layoutConfig.layout === "stacked" ? (
          <>
            <Box
              display="grid"
              gridTemplateColumns={`repeat(${layoutConfig.fieldsPerRow}, 1fr)`}
              gap={layoutConfig.gap}
              mb={3}
            >
              {filterFields.map((f) => (
                <Box key={f.name}>{renderFilterField(f)}</Box>
              ))}
            </Box>

            <Box display="flex" justifyContent="center" gap={2}>
              <SearchButton
                onClick={handleSearchClick}
                icon={<SearchIcon />}
                color="#1976d2"
                hoverColor="#1565c0"
                bgColor="#2196f3"
                title="ค้นหาข้อมูล"
              />
              <SearchButton
                onClick={handleClearSearch}
                icon={<CleaningServicesIcon />}
                color="#f44336"
                hoverColor="#e53935"
                bgColor="#ff5722"
                title="ล้างการค้นหา"
              />
            </Box>
          </>
        ) : layoutConfig.layout === "two-row" ? (
          <>
            <Box
              display="grid"
              gridTemplateColumns="repeat(3, 1fr)"
              gap={layoutConfig.gap}
              mb={3}
            >
              {filterFields.slice(0, 3).map((f) => (
                <Box key={f.name}>{renderFilterField(f)}</Box>
              ))}
            </Box>

            <Box display="flex" alignItems="center" gap={layoutConfig.gap}>
              {filterFields.slice(3).map((f) => (
                <Box key={f.name} sx={{ flex: 1 }}>
                  {renderFilterField(f)}
                </Box>
              ))}
              <Box
                display="flex"
                gap={2}
                sx={{ flexShrink: 0, marginTop: "8px" }}
              >
                <SearchButton
                  onClick={handleSearchClick}
                  icon={<SearchIcon />}
                  color="#1976d2"
                  hoverColor="#1565c0"
                  bgColor="#2196f3"
                  title="ค้นหาข้อมูล"
                />
                <SearchButton
                  onClick={handleClearSearch}
                  icon={<CleaningServicesIcon />}
                  color="#f44336"
                  hoverColor="#e53935"
                  bgColor="#ff5722"
                  title="ล้างการค้นหา"
                />
              </Box>
            </Box>
          </>
        ) : layoutConfig.layout === "large-responsive" ? (
          <>
            <Box
              display="grid"
              gridTemplateColumns={`repeat(${Math.min(
                5,
                filterFields.length
              )}, 1fr)`}
              gap={layoutConfig.gap}
              mb={3}
            >
              {filterFields
                .slice(0, Math.min(5, filterFields.length))
                .map((f) => (
                  <Box key={f.name}>{renderFilterField(f)}</Box>
                ))}
            </Box>

            {filterFields.length > 5 && (
              <Box
                display="flex"
                alignItems="center"
                gap={layoutConfig.gap}
                mb={2}
              >
                {filterFields.slice(5).map((f) => (
                  <Box key={f.name} sx={{ flex: 1 }}>
                    {renderFilterField(f)}
                  </Box>
                ))}
                <Box
                  display="flex"
                  gap={2}
                  sx={{ flexShrink: 0, marginTop: "8px" }}
                >
                  <SearchButton
                    onClick={handleSearchClick}
                    icon={<SearchIcon />}
                    color="#1976d2"
                    hoverColor="#1565c0"
                    bgColor="#2196f3"
                    title="ค้นหาข้อมูล"
                  />
                  <SearchButton
                    onClick={handleClearSearch}
                    icon={<CleaningServicesIcon />}
                    color="#f44336"
                    hoverColor="#e53935"
                    bgColor="#ff5722"
                    title="ล้างการค้นหา"
                  />
                </Box>
              </Box>
            )}

            {filterFields.length <= 5 && (
              <Box display="flex" justifyContent="center" gap={2}>
                <SearchButton
                  onClick={handleSearchClick}
                  icon={<SearchIcon />}
                  color="#1976d2"
                  hoverColor="#1565c0"
                  bgColor="#2196f3"
                  title="ค้นหาข้อมูล"
                />
                <SearchButton
                  onClick={handleClearSearch}
                  icon={<CleaningServicesIcon />}
                  color="#f44336"
                  hoverColor="#e53935"
                  bgColor="#ff5722"
                  title="ล้างการค้นหา"
                />
              </Box>
            )}
          </>
        ) : filterFields.length > 9 ? (
          // Single Row - แต่ถ้าฟิลด์เกิน 9 ให้แยก 2 แถว
          <>
            {/* แถวที่ 1: 5 ฟิลด์แรก */}
            <Box
              display="grid"
              gridTemplateColumns="repeat(5, 1fr)"
              gap={layoutConfig.gap}
              mb={3}
            >
              {filterFields.slice(0, 5).map((f) => (
                <Box key={f.name}>{renderFilterField(f)}</Box>
              ))}
            </Box>

            {/* แถวที่ 2: ฟิลด์ที่เหลือ + ปุ่ม */}
            <Box
              display="flex"
              alignItems="center"
              gap={layoutConfig.gap}
              mb={2}
            >
              {filterFields.slice(5).map((f) => (
                <Box key={f.name} sx={{ flex: 1 }}>
                  {renderFilterField(f)}
                </Box>
              ))}
              <Box
                display="flex"
                gap={2}
                sx={{ flexShrink: 0, marginTop: "8px" }}
              >
                <SearchButton
                  onClick={handleSearchClick}
                  icon={<SearchIcon />}
                  color="#1976d2"
                  hoverColor="#1565c0"
                  bgColor="#2196f3"
                  title="ค้นหาข้อมูล"
                />
                <SearchButton
                  onClick={handleClearSearch}
                  icon={<CleaningServicesIcon />}
                  color="#f44336"
                  hoverColor="#e53935"
                  bgColor="#ff5722"
                  title="ล้างการค้นหา"
                />
              </Box>
            </Box>
          </>
        ) : (
          // Single Row - ฟิลด์ไม่เกิน 9 แสดงแถวเดียว
          <Box
            display="flex"
            alignItems="center"
            gap={layoutConfig.gap}
            sx={{ flexWrap: "nowrap" }}
          >
            {filterFields.map((f) => (
              <Box
                key={f.name}
                sx={{ flex: "1 1 0", minWidth: "160px", maxWidth: "220px" }}
              >
                {renderFilterField(f)}
              </Box>
            ))}

            <Box
              display="flex"
              gap={2}
              sx={{ flexShrink: 0, marginTop: "8px" }}
            >
              <SearchButton
                onClick={handleSearchClick}
                icon={<SearchIcon />}
                color="#1976d2"
                hoverColor="#1565c0"
                bgColor="#2196f3"
                title="ค้นหาข้อมูล"
              />
              <SearchButton
                onClick={handleClearSearch}
                icon={<CleaningServicesIcon />}
                color="#f44336"
                hoverColor="#e53935"
                bgColor="#ff5722"
                title="ล้างการค้นหา"
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Enhanced Data Table */}
      <Box sx={{ padding: layoutConfig.padding }}>
        <Paper
          ref={tableWrapperRef}
          elevation={0}
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid #e3f2fd",
            background: "linear-gradient(to bottom, #ffffff, #fafbff)",
          }}
        >
          <Box
            sx={{
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                height: "8px",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f5f5f5",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "linear-gradient(to right, #bbdefb, #90caf9)",
                borderRadius: "4px",
                "&:hover": {
                  background: "linear-gradient(to right, #90caf9, #64b5f6)",
                },
              },
            }}
          >
            <Table
              sx={{
                minWidth: needsScrollbar ? 1600 : "100%",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                {columns.map((col) => (
                  <col key={col.name} style={{ width: col.width }} />
                ))}
              </colgroup>

              <TableHead>
                <TableRow>
                  {columns.map((col, index) => (
                    <TableCell
                      key={col.name}
                      align={col.align}
                      sx={{
                        background: "linear-gradient(135deg, #1565c0, #1976d2)",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "14px",
                        padding: "18px 16px",
                        textAlign: col.align,
                        borderRight:
                          index < columns.length - 1
                            ? "1px solid rgba(255,255,255,0.2)"
                            : "none",
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {pagedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      align="center"
                      sx={{
                        padding: "80px 20px",
                        borderBottom: "none",
                        backgroundColor: "#fafbff",
                      }}
                    >
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        gap={3}
                      >
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #e3f2fd, #bbdefb)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        >
                          <Typography sx={{ fontSize: "32px" }}>📋</Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{
                            color: "#1565c0",
                            fontWeight: 600,
                            fontSize: "18px",
                          }}
                        >
                          ไม่พบข้อมูลที่ค้นหา
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#757575",
                            fontSize: "15px",
                            textAlign: "center",
                            maxWidth: "300px",
                          }}
                        >
                          กรุณาลองปรับเปลี่ยนเงื่อนไขการค้นหา
                          หรือลองใช้คำค้นหาอื่น
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedData.map((item, index) => (
                    <TableRow
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : "#fafbff",
                        "&:hover": {
                          backgroundColor: "#e3f2fd",
                          transform: "translateY(-1px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        },
                        "& .MuiTableCell-root": {
                          borderBottom: "1px solid #e8eaf6",
                        },
                      }}
                    >
                      {columns.map((col, cellIndex) => (
                        <TableCell
                          key={col.name}
                          align={col.align}
                          sx={{
                            padding: "16px",
                            borderRight:
                              cellIndex < columns.length - 1
                                ? "1px solid #f0f2f5"
                                : "none",
                            verticalAlign: "middle",
                          }}
                        >
                          {renderEnhancedCell(item, col, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>

        {/* Enhanced Pagination */}
        <Box
          sx={{
            marginTop: 3,
            padding: "16px 24px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e3f2fd",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 25, 50]}
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            labelRowsPerPage="แสดงข้อมูลต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} จาก ${
                count !== -1 ? count : `มากกว่า ${to}`
              } รายการ`
            }
            sx={{
              "& .MuiTablePagination-toolbar": {
                fontSize: "14px",
                padding: 0,
                minHeight: "auto",
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#1565c0",
                },
              "& .MuiSelect-select": {
                fontSize: "14px",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "#f8fbff",
                border: "1px solid #e3f2fd",
              },
              "& .MuiIconButton-root": {
                color: "#1976d2",
                "&:hover": {
                  backgroundColor: "#e3f2fd",
                },
                "&.Mui-disabled": {
                  color: "#bdbdbd",
                },
              },
            }}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default TableListBox;