import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
    Box,
    Typography,
    Button,
    Paper,
    IconButton,
} from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

export default function TimeOutLogin_CardID() {
    const router = useRouter();

    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleRegisterClick = () => {
        alert("ไปขั้นตอนการลงทะเบียน");
    };

    const handleBackToLogin = () => {
        router.push("/login");
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
                   TimeOut_CardID เข้าสู่ระบบด้วย <span style={{ color: "#1e40af" }}>ThaID</span>
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={3}>
                    Linkage Management
                </Typography>

                <Box mb={3}>
                    <img
                        src="/mock_qr_thaid.png"
                        alt="QR สำหรับ ThaID"
                        style={{ width: 200, height: 200 }}
                    />
                </Box>

                <Typography variant="h6" color="#1e40af" mb={2}>
                    {countdown < 10 ? `00:0${countdown}` : `00:${countdown}`}
                </Typography>

                <Typography variant="body2" color="primary" mb={4} sx={{ lineHeight: 1.5 }}>
                    คิวอาร์โค้ดนี้เป็นสิ่งยืนยันตัวตนทางดิจิทัล<br />
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
    );
}
