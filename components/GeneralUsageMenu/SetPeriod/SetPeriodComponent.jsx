import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Unstable_Grid2";
import { Paper, Typography } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SelectMenuService from "@services/SelectMenu/SelectMenu";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
import ButtonService from "@services/ButtonService/ButtonService";
import { alertSuccess } from "@utils/Alerts";
import { getTimeSettings, updateTimeSettingById } from "@pages/api/settinggeneral/times/times";

// Default settings with just the ID and value to match the API data
const defaultSettings = {
  new_complaint_days: { id: "c0009fbd-4593-44b5-91d1-806d4edf38ab", value: 3, name: "กำหนดระยะเวลาการส่งเรื่องอนุมัติ / เพื่อรอเอกสารเพิ่มเติม" },
  complaint_response_days: { id: "1d2c4dae-4d7f-4843-9499-5a7e2f9ec8bd", value: 15, name: "กำหนดระยะเวลาตามฐานการเพิ่มฐานจากข้อมูลเดิม" },
  department_response_days: { id: "676dbffc-a6f4-49f6-a836-63b238675786", value: 30, name: "กำหนดระยะเวลาตามขั้นตอนในขั้นที่ครบถ้วนแล้ว" },
  review_response_days: { id: "b2a77005-31e8-4009-a4a4-bd84ce463aab", value: 7, name: "กำหนดระยะเวลาตามสถานการพิจารณาตอบกลับจากหน่วยงาน" },
};

const SetPeriodComponent = () => {
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

  const [periods, setPeriods] = useState(defaultSettings);

  // ดึงข้อมูลจาก API
  const fetchSettings = async () => {
    try {
      const settings = await getTimeSettings();
      const loaded = { ...defaultSettings };

      settings.forEach((item) => {
        if (loaded.hasOwnProperty(item.key)) {
          loaded[item.key] = {
            id: item.id,
            value: Number(item.value),
            name: item.name, // เก็บชื่อจาก API
          };
        }
      });

      setPeriods(loaded);
    } catch (err) {
      console.error("โหลดข้อมูลล้มเหลว:", err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key) => (event) => {
    const value = Number(event.target.value);
    setPeriods((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
  };

  const handleReset = () => {
    fetchSettings();  // รีเซ็ตข้อมูลจาก API
  };

  const handleSave = async () => {
    try {
      const updateAll = await Promise.all(
        Object.entries(periods).map(([_, { id, value }]) =>
          updateTimeSettingById(id, { value })
        )
      );
      alertSuccess("บันทึกสำเร็จ");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดระหว่างการบันทึก:", error);
    }
  };

  const selectOptions = Array.from({ length: 30 }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));

  const RenderPaperItem = ({ iconSrc, text, keyName }) => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        padding: "20px",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 2, sm: 0 },
      }}
    >
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
        <Typography variant="body1">{text}</Typography> {/* ใช้ชื่อจาก API */}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", mt: { xs: 1, sm: 0 } }}>
        <SelectMenuService
          value={periods[keyName]?.value || ""}
          handleChange={handleChange(keyName)}
          options={selectOptions}
          width={100}
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
    <Box sx={{ minHeight: "100vh", padding: 0, margin: 0, boxSizing: "border-box" }}>
      <Box sx={{ padding: { xs: "0 8px", sm: "0 16px" } }}>
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
            <Grid xs={12}>
              <RenderPaperItem
                iconSrc="/icons/pric01.png"
                text={periods.new_complaint_days?.name || "กำหนดระยะเวลาการส่งเรื่องอนุมัติ / เพื่อรอเอกสารเพิ่มเติม"}
                keyName="new_complaint_days"
              />
            </Grid>

            <Grid xs={12}>
              <RenderPaperItem
                iconSrc="/icons/pric02.png"
                text={periods.complaint_response_days?.name || "กำหนดระยะเวลาตามฐานการเพิ่มฐานจากข้อมูลเดิม"}
                keyName="complaint_response_days"
              />
            </Grid>

            <Grid xs={12}>
              <RenderPaperItem
                iconSrc="/icons/pric03.png"
                text={periods.department_response_days?.name || "กำหนดระยะเวลาตามขั้นตอนในขั้นที่ครบถ้วนแล้ว"}
                keyName="department_response_days"
              />
            </Grid>

            <Grid xs={12}>
              <RenderPaperItem
                iconSrc="/icons/pric04.png"
                text={periods.review_response_days?.name || "กำหนดระยะเวลาตามสถานการพิจารณาตอบกลับจากหน่วยงาน"}
                keyName="review_response_days"
              />
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "center",
              alignItems: "center",
              marginTop: 4,
              gap: { xs: 1, sm: 2 },
            }}
          >
            <ButtonService
              label="ล้าง"
              variant="outlined"
              iconLeft={<CloseIcon />}
              onClick={handleReset}
              sx={{
                backgroundColor: "#ffffff",
                color: "#50ADFF",
                borderRadius: "15px",
                width: { xs: "80%", sm: "18%" }, 
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
              onClick={handleSave}
              sx={{
                backgroundColor: "#2196F3",
                color: "#FFF",
                borderRadius: "15px",
                width: { xs: "80%", sm: "18%" },
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
