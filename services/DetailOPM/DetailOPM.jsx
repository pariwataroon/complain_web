import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Divider,
    Chip,
    Avatar,
    useTheme,
    useMediaQuery,
    Stepper,
    Step,
    StepLabel,
    StepContent,
} from "@mui/material";
import {
    Assignment as AssignmentIcon,
    DateRange as DateRangeIcon,
    Category as CategoryIcon,
    Info as InfoIcon,
    Business as BusinessIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Cancel as CancelIcon,
} from "@mui/icons-material";
import ButtonSent from "@services/ButtonSent/ButtonSent";
import OPMModal from "./OPMModal";
import CitizenModal from "./CitizenModal";
import styles from "./DetailOPM.module.scss";

const DetailOPM = ({ params, caseDetails, loading, formatDate, itemData }) => {
    const theme = useTheme();
    const router = useRouter();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

    const [opmModalOpen, setOpmModalOpen] = useState(false);
    const [citizenModalOpen, setCitizenModalOpen] = useState(false);
    const [routerItemData, setRouterItemData] = useState(null);
    const [currentItemData, setCurrentItemData] = useState(null);

    // รับข้อมูลจาก router state
    useEffect(() => {
        if (router.isReady) {
            const queryData = router.query;

            if (queryData) {
                setCurrentItemData(queryData);
            } else {
                console.log("No router query data found");
            }
        }
    }, [router.isReady]);


    const handleRowSendOPM = () => {
        setOpmModalOpen(true);
    };

    const handleRowSendCitizen = () => {
        setCitizenModalOpen(true);
    };

    const getFieldValue = (fieldName) => {
        if (currentItemData && currentItemData[fieldName]) {
            return currentItemData[fieldName];
        }

        const field = caseDetails?.find((item) => item.field === fieldName);
        return field?.value || "-";
    };

    const getFieldArrayValue = (fieldName) => {
        const field = caseDetails?.find((item) => item.field === fieldName);
        const value = field?.value;

        if (Array.isArray(value)) {
            return value;
        }

        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.warn(`Failed to parse JSON for field ${fieldName}:`, error);
                return [];
            }
        }

        if (value && typeof value === 'object') {
            return [value];
        }

        return [];
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "รับเรื่อง":
            case "รับทราบไว้ชั้นต้น":
                return "primary";
            case "อยู่ระหว่างดำเนินการ":
            case "รอผลการพิจารณาของหน่วยงานอื่น":
                return "warning";
            case "เสร็จสิ้น":
                return "success";
            case "ยุติเรื่อง":
            case "ไม่อยู่ในอำนาจหน้าที่":
                return "error";
            default:
                return "default";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "รับเรื่อง":
            case "รับทราบไว้ชั้นต้น":
                return <CheckCircleIcon />;
            case "อยู่ระหว่างดำเนินการ":
            case "รอผลการพิจารณาของหน่วยงานอื่น":
                return <ScheduleIcon />;
            case "เสร็จสิ้น":
                return <CheckCircleIcon />;
            case "ยุติเรื่อง":
            case "ไม่อยู่ในอำนาจหน้าที่":
                return <CancelIcon />;
            default:
                return <BusinessIcon />;
        }
    };

    const customerName = currentItemData?.customer_name || getFieldValue("customer_name");
    const caseCode = currentItemData?.case_code || getFieldValue("case_code");
    const typeText = currentItemData?.type_text || getFieldValue("type_text");
    const statusText = currentItemData?.status_text || getFieldValue("status_text");
    const mainStatusText = currentItemData?.main_status_text || getFieldValue("main_status_text");
    const caseId = currentItemData?.case_id || params?.case_id;

    if (loading) {
        return (
            <Box className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <Typography variant="body1" className={styles.loadingText}>
                    กำลังโหลดข้อมูล...
                </Typography>
            </Box>
        );
    }

    if (!caseDetails && !currentItemData) {
        return (
            <Box className={styles.noDataContainer}>
                <InfoIcon className={styles.noDataIcon} />
                <Typography variant="h6" className={styles.noDataText}>
                    ไม่พบข้อมูลคำร้อง
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    กรุณาเข้าถึงหน้านี้ผ่านการคลิกจากตาราง
                </Typography>
            </Box>
        );
    }

    const orgOwnerList = getFieldArrayValue("list_case_org_owner");

    return (
        <Box className={styles.detailContainer}>
            {/* เพิ่มชื่อลูกค้าในหัวเรื่อง */}
            <Typography variant="h4" className={styles.title}>
                รายละเอียดคำร้อง {customerName && `- ${customerName}`}
            </Typography>
            {/* Main Information Card */}
            <Card className={styles.mainCard}>
                <CardContent className={styles.cardContent}>
                    <Box className={styles.headerSection}>
                        <Avatar className={styles.headerIcon}>
                            <AssignmentIcon />
                        </Avatar>
                        <Typography variant="h6" className={styles.sectionTitle}>
                            ข้อมูลหลัก 
                        </Typography>
                        <Box sx={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                            <ButtonSent
                                label={isTablet ? "ส่งเรื่อง สปน." : "ส่งเรื่อง สปน."}
                                size={isTablet ? "small" : "medium"}
                                onClick={handleRowSendOPM}
                            />
                            <ButtonSent
                                label={isTablet ? "ส่งประชาชน" : "ส่งเรื่องประชาชน"}
                                size={isTablet ? "small" : "medium"}
                                onClick={handleRowSendCitizen}
                            />
                        </Box>
                    </Box>

                    <Grid container spacing={3} className={styles.infoGrid}>
                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    รหัสคำร้อง
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {getFieldValue("ref_id") || caseId}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    รหัสเรื่อง
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {caseCode}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    ชื่อ
                                </Typography>
                                <Typography variant="body1" className={styles.value} sx={{
                                    color: '#1976d2',
                                    fontWeight: 'medium',
                                    fontSize: '1.1rem'
                                }}>
                                    {customerName}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    วัตถุประสงค์
                                </Typography>
                                <Chip
                                    label={getFieldValue("objective_text") || typeText}
                                    className={styles.objectiveChip}
                                    icon={<CategoryIcon />}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    ประเภท
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {typeText}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    วันที่เปิดคำร้อง
                                </Typography>
                                <Box className={styles.dateContainer}>
                                    <DateRangeIcon className={styles.dateIcon} />
                                    <Typography variant="body1" className={styles.valuetime}>
                                        {formatDate(getFieldValue("date_opened"))}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    สถานะ
                                </Typography>
                                <Chip
                                    label={statusText}
                                    color={getStatusColor(statusText)}
                                    className={styles.statusChip}
                                    icon={getStatusIcon(statusText)}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    สถานะหลัก
                                </Typography>
                                <Chip
                                    label={mainStatusText}
                                    color={getStatusColor(mainStatusText)}
                                    className={styles.statusChip}
                                    icon={getStatusIcon(mainStatusText)}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Process Steps Card */}
            <Card className={styles.timelineCard}>
                <CardContent className={styles.cardContent}>
                    <Box className={styles.headerSection}>
                        <Avatar className={styles.headerIcon}>
                            <BusinessIcon />
                        </Avatar>
                        <Typography variant="h6" className={styles.sectionTitle}>
                            ขั้นตอนการดำเนินงาน
                        </Typography>
                    </Box>

                    {/* Show message if no org owner data */}
                    {orgOwnerList.length === 0 ? (
                        <Box sx={{
                            textAlign: 'center',
                            py: 4,
                            color: 'text.secondary'
                        }}>
                            <BusinessIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" gutterBottom>
                                ไม่มีข้อมูลขั้นตอนการดำเนินงาน
                            </Typography>
                            <Typography variant="body2">
                                ยังไม่มีการกำหนดขั้นตอนการดำเนินงานสำหรับคำร้องนี้
                            </Typography>
                        </Box>
                    ) : (
                        <Stepper orientation="vertical" className={styles.stepper}>
                            {orgOwnerList.map((org, index) => (
                                <Step key={index} active={true} completed={org.case_org_status_text === "เสร็จสิ้น"}>
                                    <StepLabel
                                        icon={
                                            <Avatar
                                                className={styles.stepAvatar}
                                                sx={{
                                                    bgcolor: theme.palette[getStatusColor(org.case_org_status_text)]?.main || '#gray'
                                                }}
                                            >
                                                {org.line || index + 1}
                                            </Avatar>
                                        }
                                    >
                                        <Typography variant="h6" className={styles.stepTitle}>
                                            ขั้นตอนที่ {org.line || index + 1}
                                        </Typography>
                                    </StepLabel>
                                    <StepContent>
                                        <Card className={styles.stepCard}>
                                            <CardContent className={styles.stepContent}>
                                                <Box className={styles.stepInfo}>
                                                    <BusinessIcon className={styles.stepIcon} />
                                                    <Box>
                                                        <Typography variant="subtitle2" className={styles.stepLabel}>
                                                            หน่วยงาน
                                                        </Typography>
                                                        <Typography variant="body1" className={styles.stepValue}>
                                                            {org.org_text || 'ไม่ระบุหน่วยงาน'}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box className={styles.stepInfo}>
                                                    <Box className={styles.statusContainer}>
                                                        <Typography variant="subtitle2" className={styles.stepLabel}>
                                                            สถานะ
                                                        </Typography>
                                                        <Chip
                                                            label={org.case_org_status_text || 'ไม่ระบุสถานะ'}
                                                            color={getStatusColor(org.case_org_status_text)}
                                                            className={styles.statusChip}
                                                            size="small"
                                                            icon={getStatusIcon(org.case_org_status_text)}
                                                        />
                                                    </Box>
                                                </Box>

                                                {org.case_org_summary_result && (
                                                    <Box className={styles.summaryResult}>
                                                        <Typography variant="subtitle2" className={styles.stepLabel}>
                                                            สรุปผลการดำเนินงาน
                                                        </Typography>
                                                        <Typography variant="body2" className={styles.summaryText}>
                                                            {org.case_org_summary_result}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                <Box className={styles.createdBy}>
                                                    <Typography variant="caption" className={styles.createdByText}>
                                                        สร้างโดย: {org.created_by_text || 'ไม่ระบุ'}
                                                    </Typography>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </StepContent>
                                </Step>
                            ))}
                        </Stepper>
                    )}
                </CardContent>
            </Card>

            {/* Details Card */}
            <Card className={styles.detailsCard}>
                <CardContent className={styles.cardContent}>
                    <Box className={styles.headerSection}>
                        <Avatar className={styles.headerIcon}>
                            <InfoIcon />
                        </Avatar>
                        <Typography variant="h6" className={styles.sectionTitle}>
                            รายละเอียดและสรุป
                        </Typography>
                    </Box>

                    <Box className={styles.detailSection}>
                        <Typography variant="subtitle2" className={styles.label}>
                            รายละเอียด
                        </Typography>
                        <Box className={styles.detailBox}>
                            <Typography variant="body1" className={styles.detailText}>
                                {getFieldValue("detail")}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider className={styles.divider} />

                    <Box className={styles.detailSection}>
                        <Typography variant="subtitle2" className={styles.label}>
                            สรุป
                        </Typography>
                        <Box className={styles.summaryBox}>
                            <Typography variant="body1" className={styles.summaryText}>
                                {getFieldValue("summary")}
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Modals */}
            <OPMModal
                open={opmModalOpen}
                onClose={() => setOpmModalOpen(false)}
                params={params}
                caseDetails={caseDetails}
                itemData={currentItemData}
            />

            <CitizenModal
                open={citizenModalOpen}
                onClose={() => setCitizenModalOpen(false)}
                params={params}
                caseDetails={caseDetails}
                itemData={currentItemData}
            />
        </Box>
    );
};

export default DetailOPM;