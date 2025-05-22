/* pages/followup/[id].jsx */

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import {
    Box,
    Container,
    Typography,
    Stepper,
    Step,
    StepLabel,
    CircularProgress,
} from "@mui/material";
import {
    CheckCircle,
    HelpOutline,
    HourglassEmpty,
} from "@mui/icons-material";

import NavbarMain from "@services/navbarMain/navbarMain";
import ComplaintIDService from "@services/ComplaintIDService/ComplaintIDService";
import { GetComplaintMeByID } from "@pages/api/complaint/complaint";
import { showLoading, closeAlert, alertError } from "@utils/Alerts";
import { formatThaiDate } from "@utils/Formats";
import styles from "./FollowupDetailPage.module.scss";

const STEP_DEFS = [
    { key: "submitted", label: "รับเรื่องร้องเรียน" },
    { key: "sent", label: "ส่งหน่วยงาน" },
    { key: "in_progress", label: "อยู่ระหว่างดำเนินการ" },
    { key: "reviewed", label: "ติดตามผลการพิจารณาจากหน่วยงาน" },
    { key: "resolved", label: "การดำเนินการเสร็จสิ้น" },
];

export default function FollowupDetailPage() {
    const router = useRouter();
    const { id } = router.query;

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    const fetchedRef = useRef(false);

    useEffect(() => {
        if (!router.isReady || !id || fetchedRef.current) return;

        fetchedRef.current = true;
        (async () => {
            try {
                showLoading("กำลังโหลดข้อมูลเรื่องร้องทุกข์...");
                const res = await GetComplaintMeByID(id);
                const data = res?.data ?? res;
                const comp = data.res_data ?? data;
                setComplaint(comp);
            } catch (err) {
                console.error(err);
                setErrorMsg("ไม่สามารถโหลดข้อมูลได้");
                alertError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
            } finally {
                closeAlert();
                setLoading(false);
            }
        })();
    }, [router.isReady, id]);

    const { steps, activeStep } = useMemo(() => {
        if (!complaint) return { steps: [], activeStep: 0 };

        const history = complaint.status_history ?? [];
        const lastStatus = complaint.status;

        const built = STEP_DEFS.map((def) => {
            const logs = history.filter((h) => h.status === def.key);

            const description = logs.map((log) => {
                const dateTH = formatThaiDate(log.changed_at);
                return `${log.notes} (${dateTH})`;
            });

            const isDone = logs.length > 0 && def.key !== lastStatus;
            const isActive = def.key === lastStatus;

            let icon;
            if (isDone) icon = <CheckCircle sx={{ fontSize: 60, color: "#2499FF" }} />;
            else if (isActive) icon = <HourglassEmpty sx={{ fontSize: 60, color: "#EDC458" }} />;
            else icon = <HelpOutline sx={{ fontSize: 60, color: "#C4C4C4" }} />;

            return { label: def.label, icon, description };
        });

        const idx = Math.max(0, STEP_DEFS.findIndex((s) => s.key === lastStatus));
        return { steps: built, activeStep: idx };
    }, [complaint]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (errorMsg) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <Typography color="error">{errorMsg}</Typography>
            </Box>
        );
    }

    if (!complaint) return null;

    return (
        <>
            <NavbarMain />

            <Container maxWidth="xl">
                <Box className={styles.detailContainer}>
                    <Typography className={styles.title}>ติดตามผลการดำเนินการ</Typography>

                    <Box className={styles.headerBarBlud} />
                    <Box className={styles.headerBarBludGold}>
                        <Typography>
                            เจ้าหน้าที่ผู้รับผิดชอบ : {complaint.assigned_to || "-"}
                        </Typography>
                    </Box>

                    <Box className={styles.headerBarLightBlue}>
                        <Box display="flex" justifyContent="space-between" width="100%">
                            <Typography sx={{ color: "#1120A3" }}>
                                เรื่อง: {complaint.step3?.general?.subject || "-"}
                            </Typography>
                            <Typography sx={{ color: "#1120A3" }}>
                                วันที่รับเรื่อง : {formatThaiDate(complaint.created_at)}
                            </Typography>
                        </Box>
                    </Box>

                    <Stepper
                        activeStep={activeStep}
                        alternativeLabel
                        sx={{
                            mt: 5,
                            "& .MuiStepConnector-line": {
                                borderWidth: "3px",
                                maxWidth: "calc(100% - 40px)",
                                ml: "auto",
                                mr: "auto",
                            },
                            "& .Mui-active .MuiStepConnector-line": { borderColor: "#2499FF" },
                            "& .Mui-completed .MuiStepConnector-line": { borderColor: "#4CAF50" },
                        }}
                    >
                        {steps.map((step, idx) => (
                            <Step key={idx}>
                                <StepLabel
                                    icon={step.icon}
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: 1,
                                        textAlign: "center",
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

                    <ComplaintIDService complaint={complaint} />
                </Box>
            </Container>
        </>
    );
}