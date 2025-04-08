import React from "react";
import { Box, Typography, Grid } from "@mui/material";

const Homepage4 = () => {
  return (
    <Box
      sx={{
        backgroundImage: "url('/images/bg03.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* ส่วนข้อความทางซ้าย */}
      <Box
        sx={{
          position: "absolute",
          left: "150px",
          top: "35%",
          zIndex: 1,
          maxWidth: "800px",
        }}
      >
        <Typography
          variant="h3"
          sx={{
            color: "#FFFFFF",
            fontWeight: "bold",
            textAlign: "center", // ให้ข้อความอยู่กลาง
            marginBottom: "20px", // ระยะห่างจากข้อความด้านบน
          }}
        >
          ยืนยันตัวตนผ่านแอป ThaID
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: "#000000",
            lineHeight: "1.8", // ปรับระยะห่างของบรรทัดให้สมดุล
            textAlign: "center", // ให้ข้อความทั้งหมดอยู่ตรงกลาง
            marginTop: "20px", // ระยะห่างจากข้อความด้านบน
          }}
        >
          สำหรับตรวจสอบและประเมินผล สำหรับงานงานปกติการกระทรวงคลัง
          <Box sx={{ display: "block", marginTop: "10px",}}>
            พร้อมรับฟังทุกปัญหาและข้อร้องเรียนของประชาชน
            มุ่งมั่นให้ขับเคลื่อนไปอย่างโปร่งใส เป็นธรรม
          </Box>
          <Box sx={{ display: "block", marginTop: "10px" }}>
            และรวดเร็ว เพื่อให้ทุกท่านได้รับข้อมูลที่ถูกต้องและทันสมัย
          </Box>
        </Typography>

        <Box
          sx={{
            marginTop: "30px",
            display: "flex",
            gap: "20px",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "150px",
              height: "50px",
              backgroundImage: `url('Google_Play.png')`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              display: "inline-block",
              cursor: "pointer",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)", // ทำให้ขนาดปุ่มใหญ่ขึ้นเล็กน้อยเมื่อ hover
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)", // เพิ่มเงาเมื่อ hover
              },
            }}
            onClick={() =>
              window.open(
                "https://play.google.com/store/apps/details?id=th.go.dopa.bora.dims.ddopa&pcampaignid=web_share",
                "_blank"
              )
            }
          />
          <Box
            sx={{
              width: "150px",
              height: "50px",
              backgroundImage: `url('App_Store.png')`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              display: "inline-block",
              cursor: "pointer",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
              },
            }}
            onClick={() =>
              window.open(
                "https://apps.apple.com/th/app/thaid/id1533612248",
                "_blank"
              )
            }
          />
        </Box>
      </Box>

      {/* ส่วนรูปภาพที่อยู่ขวา */}
      <Box
        sx={{
          position: "absolute",
          top: "43%",
          right: "20%",
          width: "400px",
        }}
      >
        <img
          src="/ThaID_logo_2.png"
          alt="ThaID Logo"
          style={{
            width: "466px",
            height: "466px",
          }}
        />
      </Box>

      <Box
        sx={{
          position: "absolute",
          top: "48.4%",
          right: "10%",
          transform: "rotate(8deg)",
        }}
      >
        <img
          src="/iphone_MOF_CODE.png"
          alt="Mobile Phone"
          style={{
            width: "466px",
            height: "466px",
          }}
        />
      </Box>
    </Box>
  );
};

export default Homepage4;
