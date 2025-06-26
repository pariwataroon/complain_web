import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Box, Typography, Button, Paper, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

export default function ThaIDPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [state, setState] = useState("login");

  const handleRegisterClick = () => {
    router.push({
      pathname: "/register",
      query: { method: "HowTo_ThaID" },
    });
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  //! PRODUCTION
  useEffect(() => {
    handleRedirect();
  }, []);

  const handleRedirect = () => {
    const baseUrl = process.env.NEXT_PUBLIC_DOPA;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
      redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
      state: state || "login",
    });
    console.log({ params });

    const redirectUrl = `${baseUrl}?${params.toString()}&scope=pid given_name address family_name gender title house_address`;
    window.location.href = redirectUrl;
  };


  //! SANDBOX
  // useEffect(() => {
  //   if (countdown === 0) {
  //     handleRedirect();
  //     return;
  //   }

  //   const timer = setInterval(() => {
  //     setCountdown((prev) => prev - 1);
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [countdown]);

  // const handleRedirect = () => {
  //   const baseUrl = process.env.NEXT_PUBLIC_LOCALE;
  //   const params = new URLSearchParams({
  //     response_type: "code",
  //     client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
  //     redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
  //     state: state || "login",
  //   });
  //   console.log({ params });

  //   const redirectUrl = `${baseUrl}?${params.toString()}&scope=pid given_name address family_name gender title house_address`;
  //   window.location.href = redirectUrl;
  // };

  return (
    //! PRODUCTION
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
          position: "absolute",
          top: { xs: 24, md: 24 },
          left: {
            xs: "50%",
            md: 24,
          },
          transform: {
            xs: "translateX(-50%)",
            md: "none",
          },
          height: { xs: 120, md: 120 },
          width: "auto",
          zIndex: 10,
        }}
      />

      <Paper
        elevation={6}
        sx={{
          borderRadius: 4,
          maxWidth: 400,
          width: "100%",
          p: 4,
          pt: 6,
          textAlign: "center",
          backgroundColor: "white",
          position: "relative",
        }}
      >
        <IconButton
          onClick={handleBackToLogin}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "grey.600",
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>

        <Typography variant="h5" fontWeight="bold" gutterBottom>
          เข้าสู่ระบบด้วย <span style={{ color: "#1e40af" }}>ThaID</span>
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Linkage Management
        </Typography>

        <Typography variant="h6" color="#1e40af" mb={2}>
          {countdown < 10 ? `00:0${countdown}` : `00:${countdown}`}
        </Typography>

        <Typography
          variant="body2"
          color="primary"
          mb={4}
          sx={{ lineHeight: 1.5 }}
        >
          คิวอาร์โค้ดนี้เป็นสิ่งยืนยันตัวตนทางดิจิทัล
          <br />
          ออกให้โดยกรมการปกครอง กระทรวงมหาดไทย
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleRegisterClick}
          sx={{ borderRadius: 10, textTransform: "none" }}
        >
          ขั้นตอนการลงทะเบียน
        </Button>
      </Paper>
    </Box>

    //! SANDBOX
    // <Box
    //   sx={{
    //     minHeight: "100vh",
    //     position: "relative",
    //     backgroundImage: "url(/back_groud.png)",
    //     backgroundSize: "cover",
    //     backgroundPosition: "center",
    //     display: "flex",
    //     alignItems: "center",
    //     justifyContent: "center",
    //     p: 2,
    //   }}
    // >
    //   <Box
    //     component="img"
    //     src="/logo_No_text.png"
    //     alt="การคลัง"
    //     sx={{
    //       position: "absolute",
    //       top: { xs: 24, md: 24 },
    //       left: {
    //         xs: "50%",
    //         md: 24,
    //       },
    //       transform: {
    //         xs: "translateX(-50%)",
    //         md: "none",
    //       },
    //       height: { xs: 120, md: 120 },
    //       width: "auto",
    //       zIndex: 10,
    //     }}
    //   />

    //   <Paper
    //     elevation={6}
    //     sx={{
    //       borderRadius: 4,
    //       maxWidth: 400,
    //       width: "100%",
    //       p: 4,
    //       pt: 6,
    //       textAlign: "center",
    //       backgroundColor: "white",
    //       position: "relative",
    //     }}
    //   >
    //     <IconButton
    //       onClick={handleBackToLogin}
    //       sx={{
    //         position: "absolute",
    //         top: 8,
    //         right: 8,
    //         color: "grey.600",
    //       }}
    //     >
    //       <ArrowBackIosNewIcon />
    //     </IconButton>

    //     <Typography variant="h5" fontWeight="bold" gutterBottom>
    //       เข้าสู่ระบบด้วย <span style={{ color: "#1e40af" }}>ThaID</span>
    //     </Typography>

    //     <Typography variant="body2" color="text.secondary" mb={3}>
    //       Linkage Management
    //     </Typography>

    //     <Box mb={3}>
    //       <img
    //         src="/qr_code_test.png"
    //         alt="QR สำหรับ ThaID"
    //         style={{ width: 200, height: 200 }}
    //       />
    //     </Box>

    //     <Typography variant="h6" color="#1e40af" mb={2}>
    //       {countdown < 10 ? `00:0${countdown}` : `00:${countdown}`}
    //     </Typography>

    //     <Typography
    //       variant="body2"
    //       color="primary"
    //       mb={4}
    //       sx={{ lineHeight: 1.5 }}
    //     >
    //       คิวอาร์โค้ดนี้เป็นสิ่งยืนยันตัวตนทางดิจิทัล
    //       <br />
    //       ออกให้โดยกรมการปกครอง กระทรวงมหาดไทย
    //     </Typography>

    //     <Button
    //       variant="contained"
    //       size="large"
    //       fullWidth
    //       onClick={handleRegisterClick}
    //       sx={{ borderRadius: 10, textTransform: "none" }}
    //     >
    //       ขั้นตอนการลงทะเบียน
    //     </Button>
    //   </Paper>
    // </Box>
  );
}
