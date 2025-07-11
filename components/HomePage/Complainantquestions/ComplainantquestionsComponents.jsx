import React, { useState, useRef } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import TextfieldService from "@services/TextfieldService/TextfieldService";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import ExportButton from "@services/ExportButton/ExportButton";
import { exportElementToPDF } from "@utils/exportPDF";
import { exportExcel } from "@utils/exportExcel";

const mockData = [
  {
    name: "นางสาวเวรุมณี สิขังสมาธิยามิ",
    date: "11 มกราคม 2568 (11.30 น.)",
    dateObj: new Date(2025, 0, 11),
  },
  {
    name: "นางสาวกานต์ธีรา วรานันต์",
    date: "8 มกราคม 2568 (18.00 น.)",
    dateObj: new Date(2025, 0, 8),
  },
  {
    name: "นายวุฒิพงศ์ จิตตั้งสกุล",
    date: "12 ธันวาคม 2567 (13.24 น.)",
    dateObj: new Date(2024, 11, 12),
  },
  {
    name: "นางสาวฐณิตา ศรีประทายู์",
    date: "1 ธันวาคม 2567 (17.24 น.)",
    dateObj: new Date(2024, 11, 1),
  },
];

const ComplainantQuestionsComponent = () => {
  const [accountName, setAccountName] = useState("");
  const [questionDate, setQuestionDate] = useState(null);
  const [filteredData, setFilteredData] = useState(mockData);
  const router = useRouter();

  // Ref สำหรับ export
  const tableRef = useRef(null);

  // Responsive breakpoints
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isSm = useMediaQuery(theme.breakpoints.down("md"));
  const isMd = useMediaQuery(theme.breakpoints.down("lg"));

  // ฟังก์ชันแปลงวันที่จาก DateThaiPicker เป็น Date object
  const parseThaiDate = (thaiDateValue) => {
    if (!thaiDateValue) return null;

    try {
      if (typeof thaiDateValue === "string") {
        return new Date(thaiDateValue);
      }

      if (
        typeof thaiDateValue === "object" &&
        thaiDateValue.day &&
        thaiDateValue.month &&
        thaiDateValue.year
      ) {
        return new Date(
          thaiDateValue.year,
          thaiDateValue.month - 1,
          thaiDateValue.day
        );
      }

      return null;
    } catch (error) {
      console.error("Error parsing thai date:", error);
      return null;
    }
  };

  // ฟังก์ชันเปรียบเทียบวันที่
  const isSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;

    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const handleSearchClick = () => {
    console.log("=== Search Debug ===");
    console.log("Account Name:", accountName);
    console.log("Question Date (raw):", questionDate);

    const keyword = accountName.trim().toLowerCase();
    const selectedDate = parseThaiDate(questionDate);

    console.log("Parsed Selected Date:", selectedDate);

    const filtered = mockData.filter((item) => {
      const matchName =
        keyword === "" || item.name.toLowerCase().includes(keyword);

      let matchDate = true;
      if (selectedDate) {
        matchDate = isSameDate(selectedDate, item.dateObj);
        console.log(
          `Comparing ${selectedDate.toDateString()} with ${item.dateObj.toDateString()}: ${matchDate}`
        );
      }

      const result = matchName && matchDate;
      console.log(
        `Item: ${item.name}, Match Name: ${matchName}, Match Date: ${matchDate}, Final: ${result}`
      );

      return result;
    });

    console.log("Filtered Results:", filtered);
    setFilteredData(filtered);
  };

  // ฟังก์ชันล้างการค้นหา
  const handleClearSearch = () => {
    setAccountName("");
    setQuestionDate(null);
    setFilteredData(mockData);
  };

  // ฟังก์ชัน Export PDF
  const handleExportPDF = () => {
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `รายงานคำถามจากผู้ร้อง_${today}.pdf`;
    exportElementToPDF(tableRef, filename);
  };

const handleExportExcel = () => {
  if (!filteredData || filteredData.length === 0) return;

  const today = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const rows = filteredData.map((row, idx) => ({
    ลำดับ: idx + 1,
    ชื่อบัญชี: row.name,
    วันที่ถาม: row.date,
  }));

  exportExcel(rows, {
    filename: `รายงานคำถามจากผู้ร้อง_${today}.xlsx`,
    sheetName: "Report",
    title: "รายงานคำถามจากผู้ร้อง",
    exportDate: `วันที่ ${today}`,
  });
};



  const breadcrumbItems = [
    {
      label: "รายงานคำถามจากผู้ร้อง",
      icon: (
        <img
          src="/icons/Notes.png"
          alt="icon"
          style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <BreadcrumbsService items={breadcrumbItems} />
        </Box>

        <Box
          sx={{
            background: "linear-gradient(90deg, #1120A3 0%, #2A62F4 100%)",
            height: 32,
            borderTopLeftRadius: "12px",
            borderTopRightRadius: "12px",
            width: "100%",
          }}
        />

        <Box
          sx={{
            padding: { xs: 2, sm: 3, md: 4 },
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 20px rgba(17, 32, 163, 0.08)",
            borderRadius: 2,
          }}
        >
          <Typography
            fontSize={{ xs: 18, sm: 20 }}
            fontWeight="bold"
            color="#1120A3"
            mb={3}
          >
            รายงานคำถามจากผู้ร้อง
          </Typography>

          {/* Responsive Layout */}
          {isXs ? (
            // Mobile Layout (< 600px) - Stack vertically
            <Stack spacing={2} mb={3} sx={{ px: 1 }}>
              {/* Search Fields */}
              <Box sx={{ p: 2, bgcolor: "#ffffff", borderRadius: 2 }}>
                <Typography
                  fontSize={16}
                  fontWeight="bold"
                  color="#1120A3"
                  mb={0.5}
                >
                  ชื่อบัญชี
                </Typography>
                <TextfieldService
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="ค้นหาชื่อบัญชี..."
                  sx={{
                    height: 40,
                    backgroundColor: "#ffffff",
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#ffffff",
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  p: 2,
                  bgcolor: "#ffffff",
                  borderRadius: 2,
                  marginBottom: "-15px",
                }}
              >
                <Typography
                  fontSize={16}
                  fontWeight="bold"
                  color="#1120A3"
                  mb={0.5}
                >
                  วันที่ถาม
                </Typography>
                <DateThaiPickerService
                  value={questionDate}
                  onChange={(val) => {
                    console.log("Date changed:", val);
                    setQuestionDate(val);
                  }}
                  placeholder="เลือกวันที่..."
                  sx={{
                    mb: 0,
                    "& .MuiFormControl-root": {
                      mb: 0,
                    },
                  }}
                />
              </Box>

              {/* Search Buttons */}
              <Box
                display="flex"
                gap={1}
                justifyContent="center"
                sx={{ pt: 2 }}
              >
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

              {/* Export Buttons */}
              <Box
                display="flex"
                gap={1}
                justifyContent="center"
                sx={{ pt: 1, pb: 2 }}
              >
                <ExportButton
                  label="Export PDF"
                  onClick={handleExportPDF}
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    px: 1.5,
                    py: 1,
                  }}
                />
                <ExportButton
                  label="Export Excel"
                  onClick={handleExportExcel}
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    px: 1.5,
                    py: 1,
                  }}
                />
              </Box>
            </Stack>
          ) : isSm ? (
            // Tablet Layout (600px - 900px) - Two rows
            <Box mb={3} sx={{ p: 2, bgcolor: "#ffffff", borderRadius: 2 }}>
              {/* First row: Search fields and buttons */}
              <Box
                display="flex"
                alignItems="end"
                gap={2}
                mb={3}
                flexWrap="wrap"
              >
                <Box sx={{ minWidth: 160, flex: 1 }}>
                  <Typography
                    fontSize={16}
                    fontWeight="bold"
                    color="#1120A3"
                    mb={0.5}
                  >
                    ชื่อบัญชี
                  </Typography>
                  <TextfieldService
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="ค้นหาชื่อบัญชี..."
                    sx={{
                      height: 40,
                      backgroundColor: "#ffffff",
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#ffffff",
                      },
                    }}
                  />
                </Box>

                <Box sx={{ minWidth: 160, flex: 1, marginBottom: "-15px" }}>
                  <Typography
                    fontSize={16}
                    fontWeight="bold"
                    color="#1120A3"
                    mb={0.5}
                  >
                    วันที่ถาม
                  </Typography>
                  <DateThaiPickerService
                    value={questionDate}
                    onChange={(val) => {
                      console.log("Date changed:", val);
                      setQuestionDate(val);
                    }}
                    placeholder="เลือกวันที่..."
                    sx={{
                      mb: 0,
                      "& .MuiFormControl-root": {
                        mb: 0,
                      },
                    }}
                  />
                </Box>

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

              {/* Second row: Export buttons */}
              <Box
                display="flex"
                gap={1.5}
                justifyContent="flex-end"
                sx={{ pt: 1 }}
              >
                <ExportButton label="Export PDF" onClick={handleExportPDF} />
                <ExportButton
                  label="Export Excel"
                  onClick={handleExportExcel}
                />
              </Box>
            </Box>
          ) : (
            // Desktop Layout (> 900px) - Single row
            <Box
              display="flex"
              alignItems="end"
              justifyContent="space-between"
              mb={3}
              flexWrap="wrap"
              gap={2}
              sx={{ p: 3, bgcolor: "#ffffff", borderRadius: 2 }}
            >
              {/* ส่วนค้นหา - ด้านซ้าย */}
              <Box display="flex" alignItems="end" gap={2} flexWrap="wrap">
                <Box sx={{ minWidth: isMd ? 160 : 200 }}>
                  <Typography
                    fontSize={16}
                    fontWeight="bold"
                    color="#1120A3"
                    mb={0.5}
                  >
                    ชื่อบัญชี
                  </Typography>
                  <TextfieldService
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="ค้นหาชื่อบัญชี..."
                    sx={{
                      height: 40,
                      backgroundColor: "#ffffff",
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "#ffffff",
                      },
                    }}
                  />
                </Box>

                <Box sx={{ minWidth: isMd ? 160 : 200, marginBottom: "-15px" }}>
                  <Typography
                    fontSize={16}
                    fontWeight="bold"
                    color="#1120A3"
                    mb={0.5}
                  >
                    วันที่ถาม
                  </Typography>
                  <DateThaiPickerService
                    value={questionDate}
                    onChange={(val) => {
                      console.log("Date changed:", val);
                      setQuestionDate(val);
                    }}
                    placeholder="เลือกวันที่..."
                    sx={{
                      mb: 0,
                      "& .MuiFormControl-root": {
                        mb: 0,
                      },
                    }}
                  />
                </Box>

                {/* ปุ่มค้นหาและล้าง */}
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

              {/* ปุ่ม Export - ด้านขวา */}
              <Box display="flex" gap={1.5}>
                <ExportButton label="Export PDF" onClick={handleExportPDF} />
                <ExportButton
                  label="Export Excel"
                  onClick={handleExportExcel}
                />
              </Box>
            </Box>
          )}

          {/* Responsive Table */}
          <div ref={tableRef}>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "12px",
                overflowX: "auto",
                mt: 2,
              }}
            >
              <Table sx={{ minWidth: isXs ? 320 : 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#EDEEF3" }}>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        fontSize: { xs: 12, sm: 14 },
                        minWidth: { xs: 50, sm: 80 },
                        p: { xs: 1.5, sm: 2 },
                      }}
                    >
                      ลำดับ
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        fontSize: { xs: 12, sm: 14 },
                        minWidth: { xs: 150, sm: 200 },
                        p: { xs: 1.5, sm: 2 },
                      }}
                    >
                      ชื่อบัญชี
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        fontSize: { xs: 12, sm: 14 },
                        minWidth: { xs: 120, sm: 150 },
                        p: { xs: 1.5, sm: 2 },
                      }}
                    >
                      วันที่ถาม
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((row, index) => (
                      <TableRow
                        key={index}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          router.push(
                            `/admin/homepage/complainant-questions/${index}`
                          )
                        }
                      >
                        <TableCell
                          sx={{
                            fontSize: { xs: 12, sm: 14 },
                            p: { xs: 1.5, sm: 2 },
                          }}
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: { xs: 12, sm: 14 },
                            wordBreak: "break-word",
                            p: { xs: 1.5, sm: 2 },
                          }}
                        >
                          {row.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: { xs: 12, sm: 14 },
                            whiteSpace: { xs: "nowrap", sm: "normal" },
                            p: { xs: 1.5, sm: 2 },
                          }}
                        >
                          {row.date}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        align="center"
                        sx={{
                          py: 6,
                          px: { xs: 1.5, sm: 2 },
                          fontSize: { xs: 12, sm: 14 },
                        }}
                      >
                        <Typography color="#666" fontSize="inherit">
                          ไม่พบข้อมูลที่ตรงกับการค้นหา
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default ComplainantQuestionsComponent;
