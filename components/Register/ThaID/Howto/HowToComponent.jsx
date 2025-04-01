import React from "react";
import { useRouter } from "next/router";
import { Box, Typography, IconButton, Hidden } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export default function HowTo_ThaID() {
  const router = useRouter();

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: "url(/back_groud.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        position: "relative",
        flexDirection: "column",
      }}
    >
      {/* Logo ด้านบน กลางจอ */}
      <Hidden mdUp>
        <Box
          component="img"
          src="/logo_No_text.png"
          alt="การคลัง"
          sx={{
            height: 100,
            width: "auto",
            mb: 2,
          }}
        />
      </Hidden>

      <Hidden mdDown>
        <Box
          component="img"
          src="/logo_No_text.png"
          alt="การคลัง"
          sx={{
            position: "absolute",
            top: 24,
            left: 24,
            height: 120,
            width: "auto",
            zIndex: 10,
          }}
        />
      </Hidden>
      <Box
        sx={{
          backgroundColor: "white",
          borderRadius: 4,
          boxShadow: 3,
          maxWidth: 1100,
          width: "100%",
          p: { xs: 3, md: 6 },
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* ปุ่ม Back */}
        <IconButton
          onClick={handleBackToLogin}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "grey.700",
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>

        <Typography
          variant="h5"
          fontWeight="bold"
          color="#1e40af"
          mb={{ xs: 3, md: 4 }}
        >
          ขั้นตอนการลงทะเบียนผ่าน ThaID
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "center",
            alignItems: "center",
            gap: { xs: 4, md: 6 },
          }}
        >
          {/* Step 1 */}
          <Box sx={{ textAlign: "center", maxWidth: 220 }}>
            <Box
              component="img"
              src="/How_To_1.png"
              alt="ดาวน์โหลดแอป"
              sx={{ width: "100%", height: "auto", mb: 2 }}
            />
            <Typography>ดาวน์โหลดแอปพลิเคชัน THAID</Typography>
          </Box>

          <ArrowForwardIosIcon
            sx={{
              display: { xs: "none", md: "inline-flex" },
              color: "#1e40af",
              mx: 1,
            }}
          />
          <ArrowDownwardIcon
            sx={{
              display: { xs: "inline-flex", md: "none" },
              color: "#1e40af",
              my: 1,
            }}
          />

          {/* Step 2 */}
          <Box sx={{ textAlign: "center", maxWidth: 220 }}>
            <Box
              component="img"
              src="/How_To_2.png"
              alt="ยืนยันตัวตน"
              sx={{ width: "100%", height: "auto", mb: 2 }}
            />
            <Typography>
              ลงทะเบียนยืนยันตัวตน
              <br />
              ผ่านแอปพลิเคชัน
            </Typography>
          </Box>

          <ArrowForwardIosIcon
            sx={{
              display: { xs: "none", md: "inline-flex" },
              color: "#1e40af",
              mx: 1,
            }}
          />
          <ArrowDownwardIcon
            sx={{
              display: { xs: "inline-flex", md: "none" },
              color: "#1e40af",
              my: 1,
            }}
          />

          {/* Step 3 */}
          <Box sx={{ textAlign: "center", maxWidth: 220 }}>
            <Box
              component="img"
              src="/How_To_3.png"
              alt="สแกน QR"
              sx={{ width: "100%", height: "auto", mb: 2 }}
            />
            <Typography>สแกนคิวอาร์โค้ดเพื่อเข้าใช้งานได้เลย</Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "center", md: "flex-start" },
            gap: 1.5,
            flexWrap: "wrap",
            mt: 1,
          }}
        >
          <Box
            component="img"
            src="/App_Store.png"
            alt="Download on App Store"
            sx={{ height: 40, width: "auto" }}
          />
          <Box
            component="img"
            src="/Google_Play.png"
            alt="Download on Play Store"
            sx={{ height: 40, width: "auto" }}
          />
        </Box>
      </Box>
    </Box>
  );
}
