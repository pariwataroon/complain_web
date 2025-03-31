import React from "react";
import { useRouter } from "next/router";
import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

export default function HowTo_ThaID() {
    const router = useRouter();

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

            {/* Content Box */}
            
            <Box
                sx={{
                    backgroundColor: "white",
                    borderRadius: 4,
                    boxShadow: 3,
                    maxWidth: 1100,
                    width: "100%",
                    px: 4,
                    py: 6,
                    textAlign: "center",
                    position: "relative",
                }}
            >
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
                    mb={4}
                >
                    ขั้นตอนการลงทะเบียนผ่าน ThaID
                </Typography>
                
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        justifyContent: "center",
                        alignItems: "flex-start",
                        gap: 4,
                    }}
                >
                    
                    <Box sx={{ textAlign: "center" }}>
                        <Box
                            component="img"
                            src="/howto_step1.png"
                            alt="ดาวน์โหลดแอป"
                            sx={{ width: 200, height: "auto", mb: 2 }}
                        />
                        <Typography>ดาวน์โหลดแอปพลิเคชัน THAID</Typography>
                    </Box>

                    <Box sx={{ textAlign: "center" }}>
                        <Box
                            component="img"
                            src="/howto_step2.png"
                            alt="ยืนยันตัวตน"
                            sx={{ width: 200, height: "auto", mb: 2 }}
                        />
                        <Typography>ลงทะเบียนยืนยันตัวตน<br />ผ่านแอปพลิเคชัน</Typography>
                    </Box>

                    <Box sx={{ textAlign: "center" }}>
                        <Box
                            component="img"
                            src="/howto_step3.png"
                            alt="สแกน QR"
                            sx={{ width: 200, height: "auto", mb: 2 }}
                        />
                        <Typography>สแกนคิวอาร์โค้ดเพื่อเข้าใช้งานได้เลย</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
