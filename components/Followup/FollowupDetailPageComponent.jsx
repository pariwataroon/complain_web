import React from "react";
import NavbarMain from "@services/navbarMain/navbarMain";
import { Box, Container, Typography, Stepper, Step, StepLabel } from "@mui/material";
import { CheckCircle, HelpOutline, AccessTime, HourglassEmpty } from "@mui/icons-material";
import styles from "./FollowupDetailPage.module.scss";
import Tab5 from "@components/Complaint/Tabs/tab5";

export default function FollowupDetailPage() {
    const steps = [
        {
            label: "ส่งหน่วยงาน",
            icon: <CheckCircle sx={{ fontSize: 60, color: "#2499FF" }} />,
            description: [
                "กรมธนารักษ์ (15 ม.ค. 2568)",
                "สำนักงานเศรษฐกิจการคลัง (16 ม.ค. 2568)",
            ],
            active: true,
        },
        {
            label: "อยู่ระหว่างดำเนินการ",
            icon: <CheckCircle sx={{ fontSize: 60, color: "#2499FF" }} />,
            description: [
                "กรมธนารักษ์",
                "สำนักงานเศรษฐกิจการคลัง",
            ],
            active: false,
        },
        {
            label: "ติดตามผลการพิจารณาจากหน่วยงาน",
            icon: <HelpOutline sx={{ fontSize: 60, color: "#C4C4C4" }} />,
            description: [],
            active: false,
        },
        {
            label: "การดำเนินการเสร็จสิ้น",
            icon: <HourglassEmpty sx={{ fontSize: 60, color: "#EDC458" }} />,
            description: [
                "กรมธนารักษ์ แจ้งผู้ร้อง",
                "ครั้งที่ 1 (1 มี.ค. 2568)",
                "สำนักงานเศรษฐกิจการคลัง แจ้งผู้ร้อง",
                "ครั้งที่ 1 (3 มี.ค. 2568)",
            ],
            active: false,
        },
    ];

    return (
        <>
            <NavbarMain />
            <Container maxWidth="xl">
                <Box className={styles.detailContainer}>
                    <Typography className={styles.title}>ติดตามผลการดำเนินการ</Typography>

                    <Box className={styles.headerBarBlud}></Box>
                    <Box className={styles.headerBarBludGold}>
                        <Typography>เจ้าหน้าที่ผู้รับผิดชอบ : นาย เป็นสุข จุ๊กกรู๊ว</Typography>
                    </Box>

                    <Box className={styles.headerBarLightBlue}>
                        <Box display="flex" justifyContent="space-between" width="100%">
                            <Typography sx={{ color: "#1120A3" }}>
                                เรื่อง: พฤติกรรมเจ้าหน้าที่กรมธนารักษ์ไม่เหมาะสม
                            </Typography>
                            <Typography sx={{ color: "#1120A3" }}>
                                วันที่รับเรื่อง : 15 ธ.ค. 2567
                            </Typography>
                        </Box>
                    </Box>


                    {/* MUI Stepper with Alternative Label */}
                    <Stepper
                        activeStep={1}
                        alternativeLabel
                        sx={{
                            marginTop: '40px',
                            '& .MuiStepConnector-line': {
                                borderWidth: '3px',
                                maxWidth: 'calc(100% - 40px)',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                            },
                            '& .Mui-active .MuiStepConnector-line': {
                                borderColor: '#2499FF',
                            },
                            '& .Mui-completed .MuiStepConnector-line': {
                                borderColor: '#4CAF50',
                            },
                        }}
                    >
                        {steps.map((step, index) => (
                            <Step key={index}>
                                <StepLabel
                                    icon={step.icon}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textAlign: 'center',

                                    }}
                                >
                                    <Typography className={styles.stepLabel}>{step.label}</Typography>
                                    {step.description.length > 0 && (
                                        <ul className={styles.stepDescription}>
                                            {step.description.map((line, i) => (
                                                <li key={i}>{line}</li>
                                            ))}
                                        </ul>
                                    )}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    <Box className={styles.headerBarLightBlue}>
                        <Typography sx={{ color: "#1120A3" }}>
                            แบบรับคำร้องเรียน / เรียนทุกข์กระทรวงการคลัง
                        </Typography>
                    </Box>
                    
                    <Tab5 />
                    
                </Box>
            </Container>
        </>
    );
}