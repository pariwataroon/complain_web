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
    IconButton,
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
    AttachFile as AttachFileIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
    Badge as BadgeIcon,
} from "@mui/icons-material";
import ButtonSent from "@services/ButtonSent/ButtonSent";
import CombinedReportModal from "./CombinedReportModal";
import styles from "./DetailOPM.module.scss";

const DetailOPM = ({ params, caseDetails, operatingsDetails,  loading, formatDate, itemData }) => {
    const theme = useTheme();
    const router = useRouter();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [routerItemData, setRouterItemData] = useState(null);
    const [currentItemData, setCurrentItemData] = useState(null);
    console.log({ caseDetails });
    console.log({ operatingsDetails });

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

    const handleReportClick = () => {
        setReportModalOpen(true);
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

    // ฟังก์ชันสำหรับดึงข้อมูลลูกค้า
    const getCustomerData = () => {
        if (currentItemData?.customer_name) {
            return {
                name: currentItemData.customer_name,
                fullName: currentItemData.customer_name,
            };
        }

        const customerField = caseDetails?.find((item) => item.field === "customer");
        const customerData = customerField?.value;

        if (customerData && typeof customerData === 'object') {
            const fullName = `${customerData.salutation_th || ''} ${customerData.firstname_th || ''} ${customerData.lastname_th || ''}`.trim();

            return {
                name: fullName,
                fullName: fullName,
                salutation: customerData.salutation_th,
                firstName: customerData.firstname_th,
                lastName: customerData.lastname_th,
                citizenId: customerData.citizen_id,
                gender: customerData.gender_text,
                address: {
                    subdistrict: customerData.subdistrict_text,
                    district: customerData.district_text,
                    province: customerData.province_text,
                    postcode: customerData.postcode
                },
                contacts: customerData.list_customer_detail || []
            };
        }

        return {
            name: '-',
            fullName: '-'
        };
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

    // ดึงข้อมูลที่ต้องใช้
    const customerData = getCustomerData();
    const customerName = customerData.fullName;
    const caseCode = currentItemData?.case_code || getFieldValue("case_code");
    const typeText = currentItemData?.type_text || getFieldValue("type_text");
    const statusText = currentItemData?.status_text || getFieldValue("status_text");
    const mainStatusText = currentItemData?.main_status_text || getFieldValue("main_status_text");
    const caseId = currentItemData?.case_id || params?.case_id;

    // ข้อมูลเพิ่มเติมจากลูกค้า
    const citizenId = customerData.citizenId;
    const customerEmail = customerData.contacts?.find(c => c.detail_type === 'E')?.detail || '-';
    const customerPhone = customerData.contacts?.find(c => c.detail_type === 'M')?.detail || '-';
    const customerAddress = customerData.address;

    // ข้อมูลไฟล์แนบ
    const attachmentList = Array.isArray(operatingsDetails)
        ? operatingsDetails.flatMap(item => Array.isArray(item.attachments) ? item.attachments : [])
        : [];

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
            {/* หัวเรื่องพร้อมชื่อลูกค้า */}
            <Typography variant="h4" className={styles.title}>
                รายละเอียดคำร้อง {customerName && customerName !== '-' && `- ${customerName}`}
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
                                label={isTablet ? "รายงาน" : "รายงาน"}
                                size={isTablet ? "small" : "medium"}
                                onClick={handleReportClick}
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

            {/* Customer Details Card */}
            <Card className={styles.customerCard}>
                <CardContent className={styles.cardContent}>
                    <Box className={styles.headerSection}>
                        <Avatar className={styles.headerIcon}>
                            <PersonIcon />
                        </Avatar>
                        <Typography variant="h6" className={styles.sectionTitle}>
                            ข้อมูลผู้ยื่นคำร้อง
                        </Typography>
                    </Box>

                    <Grid container spacing={3} className={styles.infoGrid}>
                        {citizenId && citizenId !== '-' && (
                            <Grid item xs={12} md={6}>
                                <Box className={styles.infoItem}>
                                    <BadgeIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            เลขบัตรประชาชน
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {citizenId}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {customerData.gender && (
                            <Grid item xs={12} md={6}>
                                <Box className={styles.infoItem}>
                                    <PersonIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            เพศ
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {customerData.gender}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {customerEmail && customerEmail !== '-' && (
                            <Grid item xs={12} md={6}>
                                <Box className={styles.infoItem}>
                                    <EmailIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            อีเมล
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {customerEmail}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {customerPhone && customerPhone !== '-' && (
                            <Grid item xs={12} md={6}>
                                <Box className={styles.infoItem}>
                                    <PhoneIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            เบอร์โทรศัพท์
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {customerPhone}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {customerAddress && (customerAddress.subdistrict || customerAddress.district || customerAddress.province) && (
                            <Grid item xs={12}>
                                <Box className={styles.infoItem}>
                                    <LocationIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            ที่อยู่
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {[
                                                customerAddress.subdistrict,
                                                customerAddress.district,
                                                customerAddress.province,
                                                customerAddress.postcode
                                            ].filter(Boolean).join(' ')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </CardContent>
            </Card>

            {/* Attachments Card */}
            <Card className={styles.attachmentCard}>
                <CardContent className={styles.cardContent}>
                    <Box className={styles.headerSection}>
                        <Avatar className={styles.headerIcon}>
                            <AttachFileIcon />
                        </Avatar>
                        <Typography variant="h6" className={styles.sectionTitle}>
                            ไฟล์แนบ
                        </Typography>
                    </Box>

                    {attachmentList.length === 0 ? (
                        <Box sx={{
                            textAlign: 'center',
                            py: 4,
                            color: 'text.secondary'
                        }}>
                            <AttachFileIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" gutterBottom>
                                ไม่มีไฟล์แนบ
                            </Typography>
                            <Typography variant="body2">
                                ไม่มีไฟล์แนบมากับคำร้องนี้
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="body1" className={styles.attachmentInfo}>
                                มีไฟล์แนบ {attachmentList.length} ไฟล์
                            </Typography>
                            {attachmentList.map((file, index) => (
                                <Box key={file.attachment_id || index} className={styles.attachmentItem}>
                                    <AttachFileIcon />
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {(file.file_name || `ไฟล์แนบ ${index + 1}`)}
                                    </Typography>
                                    {file.file_description && (
                                        <Typography variant="caption" sx={{ ml: 1 }}>
                                            ({file.file_description})
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}
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
                            หน่วยงานที่เกี่ยวข้อง
                        </Typography>
                    </Box>

                    {orgOwnerList.length === 0 ? (
                        <Box sx={{
                            textAlign: 'center',
                            py: 4,
                            color: 'text.secondary'
                        }}>
                            <BusinessIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" gutterBottom>
                                ไม่มีข้อมูลหน่วยงานที่เกี่ยวข้อง
                            </Typography>
                            <Typography variant="body2">
                                ยังไม่มีการกำหนดหน่วยงานที่เกี่ยวข้องสำหรับคำร้องนี้
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
                                            หน่วยงานที่ {org.line || index + 1}
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

            {/* Additional Information Card */}
            <Card className={styles.additionalInfoCard}>
                <CardContent className={styles.cardContent}>
                    <Box className={styles.headerSection}>
                        <Avatar className={styles.headerIcon}>
                            <InfoIcon />
                        </Avatar>
                        <Typography variant="h6" className={styles.sectionTitle}>
                            ข้อมูลเพิ่มเติม
                        </Typography>
                    </Box>

                    <Grid container spacing={3} className={styles.infoGrid}>
                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    ช่องทางการรับเรื่อง
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {getFieldValue("channel_incoming_text")}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    ระดับความสำคัญ
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {getFieldValue("priority_text")}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    ระดับความรุนแรง
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {getFieldValue("severity_text")}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    ระดับความลับ
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {getFieldValue("secret_text")}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    พื้นที่เกิดเหตุ
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {[
                                        getFieldValue("subdistrict_text"),
                                        getFieldValue("district_text"),
                                        getFieldValue("province_text")
                                    ].filter(item => item !== '-').join(' ')}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    พื้นที่เฉพาะ
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {getFieldValue("case_area")}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    วันที่เกิดเหตุ (จาก)
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {formatDate(getFieldValue("date_occurrenced_from"))}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    วันที่เกิดเหตุ (ถึง)
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {formatDate(getFieldValue("date_occurrenced_to"))}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    ในคดีความหรือไม่
                                </Typography>
                                <Chip
                                    label={getFieldValue("is_in_court_text")}
                                    color={getFieldValue("is_in_court") === "T" ? "error" : "success"}
                                    size="small"
                                    className={styles.statusChip}
                                />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    สร้างโดย
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {getFieldValue("created_by_text")}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    ผู้ถูกกล่าวหา
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {getFieldValue("defendant")}
                                </Typography>
                            </Box>
                        </Grid>

                        {getFieldValue("remark") && getFieldValue("remark") !== '-' && (
                            <Grid item xs={12}>
                                <Box className={styles.infoItem}>
                                    <Typography variant="subtitle2" className={styles.label}>
                                        หมายเหตุ
                                    </Typography>
                                    <Typography variant="body1" className={styles.value}>
                                        {getFieldValue("remark")}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
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

            {/* Combined Report Modal */}
            <CombinedReportModal
                open={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                params={params}
                caseDetails={caseDetails}
                itemData={currentItemData}
            />
        </Box>
    );
};

export default DetailOPM;