import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import { Paper, Typography } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import BreadcrumbsService from "@services/Breadcrumbs/breadcrumbs";
import ButtonService from "@services/ButtonService/ButtonService";
import CloseIcon from "@mui/icons-material/Close";

const SetPeriodComponent = () => {
  // Breadcrumbs
  const breadcrumbItems = [
    {
      label: "เมนูกำหนดการใช้งานทั่วไป",
      icon: (
        <img
          src="/icons/settingico.png"
          alt="Settings Icon"
          style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
        />
      ),
    },
    {
      label: "กำหนดระยะเวลา",
    },
  ];

  // State สำหรับรับค่าแต่ละช่อง
  const [period1, setPeriod1] = useState(3);
  const [period2, setPeriod2] = useState(15);
  const [period3, setPeriod3] = useState(30);
  const [period4, setPeriod4] = useState(7);

  // สร้างตัวเลือกสำหรับ dropdown (1-30 วัน)
  const dayOptions = Array.from({ length: 30 }, (_, i) => i + 1);
  const selectOptions = dayOptions.map((day) => ({
    label: day.toString(),
    value: day,
  }));

  // ฟังก์ชันจัดการเลือกแต่ละช่อง
  const handlePeriod1Change = (event) => setPeriod1(event.target.value);
  const handlePeriod2Change = (event) => setPeriod2(event.target.value);
  const handlePeriod3Change = (event) => setPeriod3(event.target.value);
  const handlePeriod4Change = (event) => setPeriod4(event.target.value);

  // Component ย่อย แสดง Paper พร้อม icon + ข้อความ และ Select + "วัน"
  const RenderPaperItem = ({ iconSrc, text, value, onChange }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        padding: "20px",
        display: "flex",
        // แม่เป็น flex row ในจอใหญ่, แต่จอเล็กจะสลับเป็นคอลัมน์
        flexDirection: { xs: "column", sm: "row" },
        // จัดวางให้ไอคอน+ข้อความ และ Select+วัน อยู่คนละฝั่ง
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 2, sm: 0 },
      }}
    >
      {/* ส่วนซ้าย: ไอคอน + ข้อความ */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "center", sm: "center" },
          textAlign: { xs: "center", sm: "left" },
          gap: 1,
        }}
      >
        <img src={iconSrc} alt="Icon" width="50" height="50" />
        <Typography variant="body1">{text}</Typography>
      </Box>

      {/* ส่วนขวา: Select + "วัน" */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          // ถ้าจอเล็ก ให้เว้นระยะห่างด้านบนเล็กน้อย กันไม่ให้ชิดไอคอน
          mt: { xs: 1, sm: 0 },
        }}
      >
        <SelectMenuService
          value={value}
          handleChange={onChange}
          options={selectOptions}
          width={80}
          sx={{ marginRight: 1, textAlign: "center" }}
          size="small"
        />
        <Typography variant="body1" sx={{ marginLeft: 1 }}>
          วัน
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ padding: { xs: "0 8px", sm: "0 16px" } }}>
        {/* Breadcrumbs */}
        <Box
          sx={{
            borderRadius: 3,
            padding: 2,
            marginTop: 2,
            maxWidth: { xs: "95%", sm: "90%", md: "1200px" },
            margin: "16px auto",
          }}
        >
          <BreadcrumbsService items={breadcrumbItems} />
        </Box>

        {/* Content Box ที่มีพื้นหลัง */}
        <Box
          sx={{
            backgroundImage: "url('/bgbluegd.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            borderRadius: 3,
            padding: { xs: 4, sm: 6, md: 10 },
            marginTop: 2,
            maxWidth: { xs: "95%", sm: "90%", md: "1200px" },
            margin: "16px auto",
          }}
        >
          <Grid container spacing={2}>
            {/* บล็อกที่ 1 */}
            <Grid xs={12}>
              <RenderPaperItem
                iconSrc="/icons/pric01.png"
                text="กำหนดระยะเวลาการส่งเรื่องอนุมัติ / เพื่อรอเอกสารเพิ่มเติม"
                value={period1}
                onChange={handlePeriod1Change}
              />
            </Grid>

            {/* บล็อกที่ 2 */}
            <Grid xs={12}>
              <RenderPaperItem
                iconSrc="/icons/pric02.png"
                text="กำหนดระยะเวลาตามฐานการเพิ่มฐานจากข้อมูลเดิม"
                value={period2}
                onChange={handlePeriod2Change}
              />
            </Grid>

            {/* บล็อกที่ 3 */}
            <Grid xs={12}>
              <RenderPaperItem
                iconSrc="/icons/pric03.png"
                text="กำหนดระยะเวลาตามขั้นตอนในขั้นที่ครบถ้วนแล้ว"
                value={period3}
                onChange={handlePeriod3Change}
              />
            </Grid>

            {/* บล็อกที่ 4 */}
            <Grid xs={12}>
              <RenderPaperItem
                iconSrc="/icons/pric04.png"
                text="กำหนดระยะเวลาตามสถานการพิจารณาตอบกลับจากหน่วยงาน"
                value={period4}
                onChange={handlePeriod4Change}
              />
            </Grid>
          </Grid>

          {/* ปุ่ม "ล้าง" และ "บันทึก" */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "center",
              alignItems: "center",
              marginTop: 4,
              gap: 2,
            }}
          >
            <ButtonService
              label="ล้าง"
              variant="outlined"
              iconLeft={<CloseIcon />}
              onClick={[]} // ใส่ฟังก์ชันที่ต้องการจะทำเมื่อคลิก
              sx={{
                backgroundColor: "#ffffff",
                color: "#50ADFF",
                borderRadius: "15px",
                width: "18%",
                height: "55px",
                fontSize: "24px",
                "&:hover": {
                  backgroundColor: "#1E88E5",
                },
              }}
            />

            <ButtonService
              label="บันทึก"
              variant="contained"
              iconRight={<CheckOutlinedIcon />}
              onClick={[]} // ใส่ฟังก์ชันที่ต้องการจะทำเมื่อคลิก
              sx={{
                backgroundColor: "#2196F3",
                color: "#FFF",
                borderRadius: "15px",
                width: "18%",
                height: "55px",
                fontSize: "24px",
                "&:hover": {
                  backgroundColor: "#1E88E5",
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SetPeriodComponent;
