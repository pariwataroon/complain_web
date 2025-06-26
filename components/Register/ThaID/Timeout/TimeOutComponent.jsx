import React from "react";
import { useRouter } from "next/router";
import { Box, Typography, Button } from "@mui/material";

export default function TimeoutPage() {
  const router = useRouter();

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleGoToQR = () => {
    router.push("/register?method=ThaID");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        backgroundImage: "url(/back_groud.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Box
        component="img"
        src="/logo_No_text.png"
        alt="การคลัง"
        sx={{
          position: {
            xs: "absolute",
            md: "absolute",
          },
          top: { xs: 70, md: 24 },
          left: { xs: 125, md: 24 },
          height: { xs: 150, md: 120 },
          width: "auto",
          mx: { xs: "auto", md: 0 },
          my: { xs: 2, md: 0 },
          zIndex: 10,
        }}
      />

      <Box
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          borderRadius: 4,
          maxWidth: 600,
          width: "100%",
          textAlign: "center",
          p: 4,
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="primary" mb={1}>
          กรุณาปิดหน้านี้
        </Typography>
        <Typography variant="h6" color="primary" mb={4}>
          หมดเวลาแสดง QR code
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            onClick={handleGoToLogin}
            sx={{
              backgroundColor: "#FACC15",
              color: "#000",
              fontWeight: "bold",
              borderRadius: 8,
              px: 3,
              py: 1.5,
              "&:hover": {
                backgroundColor: "#eab308",
              },
            }}
          >
            กลับไปยังหน้าเข้าสู่ระบบ
          </Button>

          <Button
            variant="contained"
            onClick={handleGoToQR}
            sx={{
              backgroundColor: "#1e40af",
              color: "white",
              fontWeight: "bold",
              borderRadius: 8,
              px: 3,
              py: 1.5,
              "&:hover": {
                backgroundColor: "#1e3a8a",
              },
            }}
          >
            กลับไปยังหน้า QR code
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
