import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import { Paper, Button, Select, MenuItem, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
// Breadcrumbs (ปรับ path ให้ตรงกับโครงสร้างโปรเจ็กต์)
import BreadcrumbsService from "@services/Breadcrumbs/breadcrumbs";

const SetPeriodComponent = () => {
  // Breadcrumbs
  const breadcrumbItems = [
    {
      label: "เมนูกำหนดการใช้งานทั่วไป",
      icon: <SettingsIcon />,
    },
    {
      label: "กำหนดระยะเวลา",
    },
  ];

  // state สำหรับรับค่าแต่ละช่อง
  const [period1, setPeriod1] = useState(3);
  const [period2, setPeriod2] = useState(15);
  const [period3, setPeriod3] = useState(30);
  const [period4, setPeriod4] = useState(7);

  // สร้างตัวเลือกสำหรับ dropdown (1-30 วัน)
  const dayOptions = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <Box
      sx={{
        backgroundColor: "#EFF3F8",
        minHeight: "100vh",
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ padding: "0 16px" }}>
        <Box
          sx={{
            borderRadius: 3,
            padding: 2,
            marginTop: 2,
            maxWidth: "1200px",
            margin: "16px auto",
          }}
        >
          <BreadcrumbsService items={breadcrumbItems} />
        </Box>
        <Box
          sx={{
            backgroundImage: "url('/bgbluegd.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            borderRadius: 3,
            padding: 10,
            marginTop: 2,
            maxWidth: "1200px",
            margin: "16px auto",
          }}
        >
          {/* กล่องข้อมูลขาว 4 อัน */}
          <Grid container spacing={2}>
            {/* บล็อกที่ 1 */}
            <Grid xs={12}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    component="div"
                    sx={{
                      marginRight: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src="/icons/pric01.png"
                      alt="Document"
                      width="50"
                      height="50"
                    />
                  </Box>
                  <Typography variant="body1">
                    กำหนดระยะเวลาการส่งเรื่องอนุมัติ / เพื่อรอเอกสารเพิ่มเติม
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Select
                    value={period1}
                    onChange={(e) => setPeriod1(e.target.value)}
                    size="small"
                    sx={{
                      width: 80,
                      marginRight: 1,
                      textAlign: "center",
                    }}
                  >
                    {dayOptions.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="body1">วัน</Typography>
                </Box>
              </Paper>
            </Grid>

            {/* บล็อกที่ 2 */}
            <Grid xs={12}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    component="div"
                    sx={{
                      marginRight: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src="/documents-stack.png"
                      alt="Documents"
                      width="50"
                      height="50"
                    />
                  </Box>
                  <Typography variant="body1">
                    กำหนดระยะเวลาตามฐานการเพิ่มฐานจากข้อมูลเดิม
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Select
                    value={period2}
                    onChange={(e) => setPeriod2(e.target.value)}
                    size="small"
                    sx={{
                      width: 80,
                      marginRight: 1,
                      textAlign: "center",
                    }}
                  >
                    {dayOptions.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="body1">วัน</Typography>
                </Box>
              </Paper>
            </Grid>

            {/* บล็อกที่ 3 */}
            <Grid xs={12}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    component="div"
                    sx={{
                      marginRight: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src="/documents-process.png"
                      alt="Process"
                      width="50"
                      height="50"
                    />
                  </Box>
                  <Typography variant="body1">
                    กำหนดระยะเวลาตามขั้นตอนในขั้นที่ครบถ้วนแล้ว
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Select
                    value={period3}
                    onChange={(e) => setPeriod3(e.target.value)}
                    size="small"
                    sx={{
                      width: 80,
                      marginRight: 1,
                      textAlign: "center",
                    }}
                  >
                    {dayOptions.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="body1">วัน</Typography>
                </Box>
              </Paper>
            </Grid>

            {/* บล็อกที่ 4 */}
            <Grid xs={12}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  padding: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    component="div"
                    sx={{
                      marginRight: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src="/approval-network.png"
                      alt="Approval"
                      width="50"
                      height="50"
                    />
                  </Box>
                  <Typography variant="body1">
                    กำหนดระยะเวลาตามสถานการพิจารณาตอบกลับจากหน่วยงาน
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Select
                    value={period4}
                    onChange={(e) => setPeriod4(e.target.value)}
                    size="small"
                    sx={{
                      width: 80,
                      marginRight: 1,
                      textAlign: "center",
                    }}
                  >
                    {dayOptions.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="body1">วัน</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ปุ่ม "ย้อนกลับ" และ "บันทึก" */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              marginTop: 2,
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              sx={{
                borderColor: "#FFF",
                color: "#FFF",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 4,
                paddingX: 4,
                minWidth: 120,
              }}
            >
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <Box component="span" sx={{ marginRight: 1 }}>
                  ×
                </Box>
                ย้อนกลับ
              </Box>
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#0088FF",
                borderRadius: 4,
                paddingX: 4,
                minWidth: 120,
              }}
            >
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center" }}
              >
                บันทึก
                <Box component="span" sx={{ marginLeft: 1 }}>
                  ✓
                </Box>
              </Box>
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SetPeriodComponent;
