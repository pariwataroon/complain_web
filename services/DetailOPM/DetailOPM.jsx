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
    AccountBox as AccountBoxIcon,
    PersonOutline as PersonOutlineIcon,
} from "@mui/icons-material";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DownloadIcon from '@mui/icons-material/Download';
import ButtonSent from "@services/ButtonSent/ButtonSent";
import CombinedReportModal from "./CombinedReportModal";
import styles from "./DetailOPM.module.scss";
import useDetailOPMData from "@hooks/admin/opm/useDetailOPMData";
import { formatThaiOfficialDateTime } from "@utils/Formats";
import DetailOPMExportPDF from "@services/DetailOPM/DetailOPMExport PDF";
const DetailOPM = ({ params, caseDetails, attachmentsDetails, operatingsDetails, loading, formatDate, itemData }) => {
    const theme = useTheme();
    const router = useRouter();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
    // console.log({ operatingsDetails });
    
    const [reportModalOpen, setReportModalOpen] = useState(false);

    const {
        compiledData,
        isDataReady,
        isCreating,
        autoCreateAttempted,
        currentItemData,
        opmChannelId,
        getSectionData,
        getFlatData,
        getFormattedDataForAPI,
        getFormattedDataForCreateAPI,
        createComplaintAPI,
        autoCreateComplaint,
        isValidForAPICreation,
        getOpmChannelId,
        getAccountData,
        getCustomerData,
        getFieldValue,
        getFieldArrayValue
    } = useDetailOPMData({
        caseDetails,
        attachmentsDetails,
        operatingsDetails,
        params,
        itemData
    });

    const alertInfo = (title, message) => {
        alert(`${title}\n\n${message}`);
    };

    useEffect(() => {
        if (isDataReady) {
            const mainInfo = getSectionData('main_information');
            const accountData = getAccountData();

            const customerData = getCustomerData();
            // console.log({ caseDetails });
            // console.log({ accountData });
            // console.log({ customerData });

            if (opmChannelId && !autoCreateAttempted && !isCreating) {
            }
        }
    }, [isDataReady, opmChannelId, autoCreateAttempted, isCreating]);

    useEffect(() => {
        if (isDataReady && !opmChannelId && !isCreating) {
            const timeoutId = setTimeout(() => {
                if (!opmChannelId) {
                    console.warn('⚠️ OPM Channel ID not found after data ready');
                }
            }, 5000);

            return () => clearTimeout(timeoutId);
        }
    }, [isDataReady, opmChannelId, isCreating]);

    const handleReportClick = () => {
        setReportModalOpen(true);
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

    // ใช้ข้อมูลจาก hook
    const accountData = getAccountData();

    const customerData = getCustomerData();
    const caseCode = currentItemData?.case_code || getFieldValue("case_code");
    const typeText = currentItemData?.type_text || getFieldValue("type_text");
    const statusText = currentItemData?.status_text || getFieldValue("status_text");
    const mainStatusText = currentItemData?.main_status_text || getFieldValue("main_status_text");
    const caseId = currentItemData?.case_id || params?.case_id;
    const orgOwnerList = getFieldArrayValue("list_case_org_owner");

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

    // แสดง loading เมื่อกำลังสร้างข้อมูลอัตโนมัติ
    if (isCreating && !autoCreateAttempted) {
        return (
            <Box className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <Typography variant="body1" className={styles.loadingText}>
                    กำลังสร้างคำร้องอัตโนมัติ...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    กรุณารอสักครู่
                </Typography>
            </Box>
        );
    }

    return (
        <Box className={styles.detailContainer}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h5" className={styles.title}>
                    รายละเอียดคำร้อง {accountData.fullName && accountData.fullName !== '-' && `- ${accountData.fullName}`}
                </Typography>
            </Box>


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
                            <DetailOPMExportPDF
                            caseDetails={caseDetails}
                            operatingsDetails={operatingsDetails}
                            accountData={accountData}
                            customerData={customerData}
                            />
                            <ButtonSent
                                label={isTablet ? "รายงาน" : "รายงาน"}
                                size={isTablet ? "small" : "medium"}
                                onClick={handleReportClick}
                            />
                        </Box>
                    </Box>

                    <Grid container spacing={3} className={styles.infoGrid}>
                        <Grid item xs={12} md={4}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    รหัสเรื่อง
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {caseCode}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
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

                        <Grid item xs={12} md={4}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    ประเภท
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {typeText}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
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

                        <Grid item xs={12} md={4}>
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

                        <Grid item xs={12} md={4}>
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
                    </Grid>
                </CardContent>
            </Card>

            {/* Account Details Card - ผู้ยื่นคำร้อง */}
            <Card className={styles.customerCard}>
                <CardContent className={styles.cardContent}>
                    <Box className={styles.headerSection}>
                        <Avatar className={styles.headerIcon}>
                            <AccountBoxIcon />
                        </Avatar>
                        <Typography variant="h6" className={styles.sectionTitle}>
                            ข้อมูลผู้ยื่นคำร้อง
                        </Typography>
                    </Box>

                    <Grid container spacing={2} className={styles.infoGrid}>
                        <Grid item xs={12} md={4}>
                            <Box className={styles.infoItem}>
                                <PersonIcon className={styles.infoIcon} />
                                <Box>
                                    <Typography variant="subtitle2" className={styles.label}>
                                        ชื่อ-นามสกุล
                                    </Typography>
                                    <Typography variant="body1" className={styles.value} sx={{
                                        color: '#1976d2',
                                        fontWeight: 'medium'
                                    }}>
                                        {accountData.fullName}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {accountData.citizenId && accountData.citizenId !== '-' && (
                            <Grid item xs={12} md={4}>
                                <Box className={styles.infoItem}>
                                    <BadgeIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            เลขบัตรประชาชน
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {accountData.citizenId}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {accountData.gender && (
                            <Grid item xs={12} md={4}>
                                <Box className={styles.infoItem}>
                                    <PersonIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            เพศ
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {accountData.gender}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {accountData.contacts?.find(c => c.detail_type === 'E')?.detail && (
                            <Grid item xs={12} md={4}>
                                <Box className={styles.infoItem}>
                                    <EmailIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            อีเมล
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {accountData.contacts.find(c => c.detail_type === 'E')?.detail}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {(() => {
                            const phoneNumbers = accountData.contacts
                                ?.filter(c => c.detail_type === 'M')
                                ?.map(c => c.detail)
                                ?.filter(Boolean) || [];

                            return phoneNumbers.length > 0 ? (
                                <Grid item xs={12} md={4}>
                                    <Box className={styles.infoItem}>
                                        <PhoneIcon className={styles.infoIcon} />
                                        <Box>
                                            <Typography variant="subtitle2" className={styles.label}>
                                                เบอร์โทรศัพท์
                                            </Typography>
                                            <Typography variant="body1" className={styles.value}>
                                                {phoneNumbers.join(' , ')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            ) : null;
                        })()}

                        {accountData.address && (accountData.address.address ||accountData.address.subdistrict || accountData.address.district || accountData.address.province) && (
                            <Grid item xs={12}>
                                <Box className={styles.infoItem}>
                                    <LocationIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            ที่อยู่
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {[
                                                accountData.address.address || '',
                                                accountData.address.subdistrict,
                                                accountData.address.district,
                                                accountData.address.province,
                                                accountData.address.postcode
                                            ].filter(Boolean).join(' ')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </CardContent>
            </Card>

            {/* Customer Details Card - ผู้เดือดร้อน */}
            {customerData.fullName !== '-' && (
                <Card className={styles.customerCard}>
                    <CardContent className={styles.cardContent}>
                        <Box className={styles.headerSection}>
                            <Avatar className={styles.headerIcon}>
                                <PersonOutlineIcon />
                            </Avatar>
                            <Typography variant="h6" className={styles.sectionTitle}>
                                ข้อมูลผู้เดือดร้อน
                            </Typography>
                        </Box>

                        <Grid container spacing={2} className={styles.infoGrid}>
                            <Grid item xs={12} md={4}>
                                <Box className={styles.infoItem}>
                                    <PersonIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            ชื่อ-นามสกุล
                                        </Typography>
                                        <Typography variant="body1" className={styles.value} sx={{
                                            color: '#d32f2f',
                                            fontWeight: 'medium'
                                        }}>
                                            {customerData.fullName}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            {customerData.citizenId && customerData.citizenId !== '-' && (
                                <Grid item xs={12} md={4}>
                                    <Box className={styles.infoItem}>
                                        <BadgeIcon className={styles.infoIcon} />
                                        <Box>
                                            <Typography variant="subtitle2" className={styles.label}>
                                                เลขบัตรประชาชน
                                            </Typography>
                                            <Typography variant="body1" className={styles.value}>
                                                {customerData.citizenId}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}

                            {customerData.gender && (
                                <Grid item xs={12} md={4}>
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

                            {customerData.contacts?.find(c => c.detail_type === 'E')?.detail && (
                                <Grid item xs={12} md={4}>
                                    <Box className={styles.infoItem}>
                                        <EmailIcon className={styles.infoIcon} />
                                        <Box>
                                            <Typography variant="subtitle2" className={styles.label}>
                                                อีเมล
                                            </Typography>
                                            <Typography variant="body1" className={styles.value}>
                                                {customerData.contacts.find(c => c.detail_type === 'E')?.detail}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}

                            {(() => {
                                const phoneNumbers = customerData.contacts
                                    ?.filter(c => c.detail_type === 'M')
                                    ?.map(c => c.detail)
                                    ?.filter(Boolean) || [];

                                return phoneNumbers.length > 0 ? (
                                    <Grid item xs={12} md={4}>
                                        <Box className={styles.infoItem}>
                                            <PhoneIcon className={styles.infoIcon} />
                                            <Box>
                                                <Typography variant="subtitle2" className={styles.label}>
                                                    เบอร์โทรศัพท์
                                                </Typography>
                                                <Typography variant="body1" className={styles.value}>
                                                    {phoneNumbers.join(' , ')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                ) : null;
                            })()}

                            {customerData.address && (customerData.address.address || customerData.address.subdistrict || customerData.address.district || customerData.address.province) && (
                                <Grid item xs={12}>
                                    <Box className={styles.infoItem}>
                                        <LocationIcon className={styles.infoIcon} />
                                        <Box>
                                            <Typography variant="subtitle2" className={styles.label}>
                                                ที่อยู่
                                            </Typography>
                                            <Typography variant="body1" className={styles.value}>
                                                {[
                                                    customerData.address.address || '',
                                                    customerData.address.subdistrict,
                                                    customerData.address.district,
                                                    customerData.address.province,
                                                    customerData.address.postcode
                                                ].filter(Boolean).join(' ')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </CardContent>
                </Card>
            )}

        


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
                        <Box className={styles.orgList}>
                            {/* Header */}
                            <Box className={styles.orgListHeader}>
                                <Typography variant="subtitle2" className={styles.orgListHeaderText}>ลำดับ</Typography>
                                <Typography variant="subtitle2" className={styles.orgListHeaderText}>หน่วยงาน</Typography>
                                <Typography variant="subtitle2" className={styles.orgListHeaderText}>สถานะ</Typography>
                                <Typography variant="subtitle2" className={styles.orgListHeaderText}>ผลการดำเนินงาน</Typography>
                            </Box>
                            {orgOwnerList.map((org, index) => (
                                <Box key={index} className={styles.orgListRow}>
                                    <Box className={styles.orgListCell}>
                                        <Avatar
                                            sx={{
                                                width: 28,
                                                height: 28,
                                                fontSize: '0.8rem',
                                                bgcolor: theme.palette[getStatusColor(org.case_org_status_text)]?.main || '#9e9e9e'
                                            }}
                                        >
                                            {org.line || index + 1}
                                        </Avatar>
                                    </Box>
                                    <Box className={styles.orgListCell}>
                                        <BusinessIcon sx={{ fontSize: 16, color: '#0a2cbd', mr: 1 }} />
                                        <Typography variant="body1" className={styles.orgListValue}>
                                            {org.org_text || 'ไม่ระบุหน่วยงาน'}
                                        </Typography>
                                    </Box>
                                    <Box className={styles.orgListCell}>
                                        <Chip
                                            label={org.case_org_status_text || 'ไม่ระบุสถานะ'}
                                            color={getStatusColor(org.case_org_status_text)}
                                            size="small"
                                            icon={getStatusIcon(org.case_org_status_text)}
                                            sx={{ height: 24, fontSize: '0.75rem' }}
                                        />
                                    </Box>
                                    <Box className={styles.orgListCell}>
                                        <Typography variant="body1" className={styles.orgListValue}>
                                            {org.case_org_summary_result || '-'}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
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
                                    ระดับความเร่งด่วน
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

                        <Grid item xs={12} md={12}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    พื้นที่เกิดเหตุ
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {[
                                        getFieldValue("case_area"),
                                        getFieldValue("subdistrict_text"),
                                        getFieldValue("district_text"),
                                        getFieldValue("province_text")
                                    ].filter(item => item !== '-').join(' ')}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={12}>
                            <Grid item xs={12}>
                                <Box className={styles.infoItem}>
                                    <Typography variant="subtitle2" className={styles.label}>
                                        ช่วงเวลาที่เกิดเหตุ
                                    </Typography>
                                    <Typography variant="body1" className={styles.value}>
                                        {getFieldValue("time_occurrenced")}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={12}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    วันที่เกิดเหตุ (จาก - ถึง)
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {formatDate(getFieldValue("date_occurrenced_from"))}
                                    {" - "}
                                    {formatDate(getFieldValue("date_occurrenced_to"))}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    อยู่ระหว่างการฟ้องร้อง / พิจารณาในชั้นศาล
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
                            <Grid item xs={12}>
                                <Box className={styles.infoItem}>
                                    <Typography variant="subtitle2" className={styles.label}>
                                        ผู้ถูกร้อง
                                    </Typography>
                                    <Typography variant="body1" className={styles.value}>
                                        {getFieldValue("defendant")}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={12}>
                            <Box className={styles.infoItem}>
                                <Typography variant="subtitle2" className={styles.label}>
                                    สร้างโดย
                                </Typography>
                                <Typography variant="body1" className={styles.value}>
                                    {getFieldValue("created_by_text")}
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
            {/* Attachments Card */}
            <Card className={styles.timelineCard}>
                <CardContent className={styles.cardContent}>
                    <Box className={styles.headerSection}>
                        <Avatar className={styles.headerIcon}>
                            <AssignmentIcon />
                        </Avatar>
                        <Typography variant="h6" className={styles.sectionTitle}>
                            ขั้นตอนการดำเนินงาน
                        </Typography>
                    </Box>

                    {(!operatingsDetails || operatingsDetails.length === 0) ? (
                        <Box sx={{
                            textAlign: 'center',
                            py: 4,
                            color: 'text.secondary'
                        }}>
                            <AssignmentIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" gutterBottom>
                                ไม่มีข้อมูลขั้นตอนการดำเนินงาน
                            </Typography>
                            <Typography variant="body2">
                                ยังไม่มีการบันทึกขั้นตอนการดำเนินงานสำหรับคำร้องนี้
                            </Typography>
                        </Box>
                    ) : (
                        <Box className={styles.commentsContainer}>
                            {operatingsDetails.map((operation, index) => (
                                <Box key={operation.id || index} className={styles.commentItem}>
                                    {/* Comment Header */}
                                    <Box className={styles.commentHeader}>
                                        <Avatar
                                            className={styles.commentAvatar}
                                            sx={{
                                                bgcolor: theme.palette[getStatusColor(operation.status_text)]?.main || '#1976d2',
                                                width: 40,
                                                height: 40
                                            }}
                                        >
                                            {operation.line || index + 1}
                                        </Avatar>
                                        <Box className={styles.commentMeta}>
                                            <Typography variant="subtitle1" className={styles.commentTitle}>
                                                ขั้นตอนที่ {operation.line || index + 1}: {operation.operating_type_text}
                                            </Typography>
                                            <Box className={styles.commentInfo}>
                                                <Typography variant="caption" className={styles.commentAuthor}>
                                                    {operation.created_by_text || operation.officer_text || 'ไม่ระบุผู้ปฏิบัติ'}
                                                </Typography>
                                                {operation.ShowDateTime && (
                                                    <>
                                                        <Typography variant="caption" sx={{ mx: 1 }}>•</Typography>
                                                        <Typography variant="caption" className={styles.commentTime}>
                                                            {operation.ShowDateTime}
                                                        </Typography>
                                                    </>
                                                )}
                                                <Chip
                                                    label={operation.status_text || 'ไม่ระบุสถานะ'}
                                                    color={getStatusColor(operation.status_text)}
                                                    size="small"
                                                    icon={getStatusIcon(operation.status_text)}
                                                    sx={{ ml: 2, height: 20 }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Comment Body */}
                                    <Box className={styles.commentBody}>
                                        <Card className={styles.commentCard} variant="outlined">
                                            <CardContent className={styles.commentContent}>
                                                {/* รายละเอียดหลัก */}
                                                {operation.detail && (
                                                    <Typography variant="body1" className={styles.commentText} sx={{ mb: 2 }}>
                                                        {operation.detail}
                                                    </Typography>
                                                )}
                                                {/* ข้อมูลเพิ่มเติม */}
                                                <Box className={styles.commentDetails}>
                                                    {/* หน่วยงาน */}
                                                    <Box className={styles.detailItem}>
                                                        <BusinessIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            หน่วยงาน: {operation.org_text || 'ไม่ระบุ'}
                                                        </Typography>
                                                    </Box>

                                                    {/* วัตถุประสงค์ */}
                                                    {operation.operating_objective_text && (
                                                        <Box className={styles.detailItem}>
                                                            <InfoIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                วัตถุประสงค์: {operation.operating_objective_text}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    {/* วันที่ดำเนินการ */}
                                                    {operation.ShowDateTime && (
                                                        <Box className={styles.detailItem}>
                                                            <DateRangeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                วันที่ดำเนินการ: {operation.ShowDateTime}
                                                            </Typography>
                                                        </Box>
                                                    )}

                                                    {/* ช่องทางการดำเนินการ */}
                                                    {operation.operating_channel_text && (
                                                        <Box className={styles.detailItem}>
                                                            <InfoIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                ช่องทาง: {operation.operating_channel_text}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>

                                                {/* ไฟล์แนบ */}
                                                {(() => {
                                                    const operationAttachments = operation.attachments || [];
                                                    const attachmentDetails = operationAttachments.map(att => {
                                                        const detailedAttachment = attachmentsDetails?.find(detail =>
                                                            detail.attachment_id === att.attachment_id
                                                        );
                                                        return detailedAttachment || att;
                                                    });

                                                    return attachmentDetails.length > 0 ? (
                                                        <Box className={styles.attachmentSection} sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                <AttachFileIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                                                ไฟล์แนบ ({attachmentDetails.length} ไฟล์)
                                                            </Typography>
                                                            <Box className={styles.attachmentList}>
                                                                {attachmentDetails.map((file, fileIndex) => {
                                                                    let fileUrl = "#";
                                                                    let isImage = false;
                                                                    let isPdf = false;

                                                                    if (file.file_content) {
                                                                        if (file.file_type === "application/pdf") {
                                                                            fileUrl = `data:application/pdf;base64,${file.file_content}`;
                                                                            isPdf = true;
                                                                        } else if (file.file_type?.startsWith("image/")) {
                                                                            fileUrl = `data:${file.file_type};base64,${file.file_content}`;
                                                                            isImage = true;
                                                                        } else {
                                                                            fileUrl = `data:application/octet-stream;base64,${file.file_content}`;
                                                                        }
                                                                    }

                                                                    return (
                                                                        <Box key={file.attachment_id || fileIndex} className={styles.attachmentItem} sx={{ mb: 1 }}>
                                                                            {/* ไฟล์ที่ไม่ใช่รูปภาพ */}
                                                                            {!isImage && (
                                                                                <Box sx={{
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    gap: 1,
                                                                                    p: 1,
                                                                                    borderRadius: 1,
                                                                                    bgcolor: 'grey.50',
                                                                                    border: '1px solid',
                                                                                    borderColor: 'grey.200'
                                                                                }}>
                                                                                    {isPdf ? (
                                                                                        <PictureAsPdfIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                                                                    ) : (
                                                                                        <AttachFileIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                                                    )}
                                                                                    <Box sx={{ flex: 1 }}>
                                                                                        <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.8rem' }}>
                                                                                            {file.file_name || `ไฟล์แนบ ${fileIndex + 1}`}
                                                                                        </Typography>
                                                                                        {file.file_description && (
                                                                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                                                                                {file.file_description}
                                                                                            </Typography>
                                                                                        )}
                                                                                    </Box>
                                                                                    {file.file_content && (
                                                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                                                            <a
                                                                                                href={fileUrl}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                style={{
                                                                                                    color: "#1976d2",
                                                                                                    textDecoration: "none",
                                                                                                    fontWeight: 500,
                                                                                                    fontSize: '0.75rem'
                                                                                                }}
                                                                                                download={file.file_name}
                                                                                            >
                                                                                                ดาวน์โหลด
                                                                                            </a>
                                                                                        </Box>
                                                                                    )}
                                                                                </Box>
                                                                            )}

                                                                            {/* ไฟล์รูปภาพ - แสดง preview */}
                                                                            {isImage && (
                                                                                <Box sx={{
                                                                                    border: '1px solid',
                                                                                    borderColor: 'grey.200',
                                                                                    borderRadius: 2,
                                                                                    overflow: 'hidden',
                                                                                    bgcolor: 'white'
                                                                                }}>
                                                                                    {/* Image Preview */}
                                                                                    <Box sx={{
                                                                                        position: 'relative',
                                                                                        maxWidth: '100%',
                                                                                        maxHeight: 300,
                                                                                        overflow: 'hidden',
                                                                                        cursor: 'pointer'
                                                                                    }}
                                                                                        onClick={() => window.open(fileUrl, '_blank')}
                                                                                    >
                                                                                        <img
                                                                                            src={fileUrl}
                                                                                            alt={file.file_name || `รูปภาพ ${fileIndex + 1}`}
                                                                                            style={{
                                                                                                width: '100%',
                                                                                                height: 'auto',
                                                                                                maxHeight: '300px',
                                                                                                objectFit: 'cover',
                                                                                                display: 'block'
                                                                                            }}
                                                                                            onError={(e) => {
                                                                                                e.target.style.display = 'none';
                                                                                                e.target.nextSibling.style.display = 'flex';
                                                                                            }}
                                                                                        />
                                                                                        {/* Fallback for broken images */}
                                                                                        <Box sx={{
                                                                                            display: 'none',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center',
                                                                                            height: 100,
                                                                                            bgcolor: 'grey.100',
                                                                                            color: 'text.secondary'
                                                                                        }}>
                                                                                            <ImageIcon sx={{ fontSize: 32 }} />
                                                                                            <Typography variant="caption" sx={{ ml: 1 }}>
                                                                                                ไม่สามารถแสดงรูปภาพได้
                                                                                            </Typography>
                                                                                        </Box>
                                                                                    </Box>

                                                                                    {/* Image Info Bar */}
                                                                                    <Box sx={{
                                                                                        p: 1.5,
                                                                                        bgcolor: 'grey.50',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'space-between'
                                                                                    }}>
                                                                                        <Box>
                                                                                            <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.8rem' }}>
                                                                                                {file.file_name || `รูปภาพ ${fileIndex + 1}`}
                                                                                            </Typography>
                                                                                            {file.file_description && (
                                                                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                                                                                    {file.file_description}
                                                                                                </Typography>
                                                                                            )}
                                                                                        </Box>
                                                                                        {file.file_content && (
                                                                                            <Box sx={{ display: 'flex', gap: 1 }}>

                                                                                                <a
                                                                                                    href={fileUrl}
                                                                                                    download={file.file_name}
                                                                                                    style={{ textDecoration: 'none' }}
                                                                                                >
                                                                                                    <IconButton
                                                                                                        size="small"
                                                                                                        title="ดาวน์โหลด"
                                                                                                    >
                                                                                                        <DownloadIcon sx={{ fontSize: 16 }} />
                                                                                                    </IconButton>
                                                                                                </a>
                                                                                            </Box>
                                                                                        )}
                                                                                    </Box>
                                                                                </Box>
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Box>
                                                        </Box>
                                                    ) : null;
                                                })()}
                                            </CardContent>
                                        </Card>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </CardContent>
            </Card>
            {/* Combined Report Modal */}
            <CombinedReportModal
                open={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                params={params}
                caseDetails={caseDetails}
                operatingsDetails={operatingsDetails}
                itemData={currentItemData}
            />
        </Box>
    );
};

export default DetailOPM;