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
    Button,
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
import ButtonSent from "@services/ButtonSent/ButtonSent";
import CombinedReportModal from "./CombinedReportModal";
import styles from "./DetailOPM.module.scss";
import useDetailOPMData from "@hooks/admin/opm/useDetailOPMData";

const DetailOPM = ({ params, caseDetails, attachmentsDetails, operatingsDetails, loading, formatDate, itemData }) => {
    const theme = useTheme();
    const router = useRouter();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

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

    // เพิ่ม function alertInfo สำหรับการแจ้งเตือน
    const alertInfo = (title, message) => {
        alert(`${title}\n\n${message}`);
    };

    const handleCreateData = async () => {
        if (!isDataReady) {
            console.log('Data is not ready yet');
            return;
        }

        try {
            const apiData = getFormattedDataForAPI();

            console.log('=== Compiled Data Array ===');
            console.log(compiledData);

            console.log('=== Formatted Data for API ===');
            console.log(apiData);

            console.log('=== Flat Data ===');
            console.log(getFlatData());

            console.log('=== Specific Section Data ===');
            console.log('Main Info:', getSectionData('main_information'));
            console.log('Account:', getSectionData('account_details'));
            console.log('Customer:', getSectionData('customer_details'));
            console.log('Attachments:', getSectionData('attachments'));
            console.log('Organizations:', getSectionData('organizations'));
            console.log('Additional:', getSectionData('additional_information'));
            console.log('Details:', getSectionData('details_summary'));

            

            alert('ข้อมูลพร้อมสำหรับ API แล้ว! ดูใน Console');

        } catch (error) {
            console.error('Error preparing data for API:', error);
        }
    };

    // Function สำหรับ call API ใหม่ (Step format)
    const handleCreateDataNewFormat = async () => {
        if (!isDataReady) {
            console.log('Data is not ready yet');
            return;
        }

        try {
            const apiData = getFormattedDataForCreateAPI();

            console.log('=== Step Format Data for API ===');
            console.log(JSON.stringify(apiData, null, 2));

            // Call API
            const result = await createComplaintAPI(apiData);

            if (result && result.res_code === "0000") {
                alert(`✅ สร้างข้อมูลสำเร็จ!\nMessage: ${result.res_message}`);
                console.log('✅ Success Response:', result);
            } else {
                alert(`❌ เกิดข้อผิดพลาด: ${result?.res_message || 'Unknown error'}`);
                console.error('❌ Error Response:', result);
            }

        } catch (error) {
            console.error('Error preparing data for API:', error);
            alert(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        }
    };

    // Function สำหรับ call API เพื่อสร้างข้อมูลแบบแยกส่วน
    const handleCreateDataBySections = async () => {
        if (!isDataReady) {
            console.log('Data is not ready yet');
            return;
        }

        try {
            for (const section of compiledData) {
                console.log(`Processing section: ${section.section_name}`);
            }

            alert('ข้อมูลทุกส่วนพร้อมสำหรับ API แล้ว! ดูใน Console');

        } catch (error) {
            console.error('Error processing sections:', error);
        }
    };

    // Effect เพื่อ monitor ข้อมูลที่เปลี่ยน
    useEffect(() => {
        if (isDataReady) {
            console.log('📊 Data is ready!');
            console.log('Total sections:', compiledData.length);
            const mainInfo = getSectionData('main_information');
            const accountData = getAccountData();
            const customerData = getCustomerData();

            console.log('Current case ID:', mainInfo.case_id);
            console.log('Current case code:', mainInfo.case_code);
            console.log('OPM Channel ID:', opmChannelId);
            console.log('Auto-create attempted:', autoCreateAttempted);
            console.log('Is creating:', isCreating);
            console.log('📋 People Data:', {
                account: accountData.fullName,
                customer: customerData.fullName !== '-' ? customerData.fullName : 'N/A',
                willHaveStep1: !!(accountData.fullName && accountData.fullName !== '-'),
                willHaveStep2: !!(customerData.fullName && customerData.fullName !== '-' && customerData.fullName !== accountData.fullName)
            });

            if (opmChannelId && !autoCreateAttempted && !isCreating) {
                console.log('🚀 Conditions met for auto-create!');
            }
        }
    }, [isDataReady, compiledData, opmChannelId, autoCreateAttempted, isCreating]);

    // Effect เพื่อแสดงผลลัพธ์การสร้างข้อมูลอัตโนมัติ
    useEffect(() => {
        if (autoCreateAttempted && !isCreating) {
            // แสดงแจ้งเตือนเมื่อการสร้างข้อมูลอัตโนมัติเสร็จสิ้น (เฉพาะใน development)
            if (process.env.NODE_ENV === 'development') {
                const timeoutId = setTimeout(() => {
                    alertInfo(
                        'การสร้างข้อมูลอัตโนมัติเสร็จสิ้น',
                        'ระบบได้พยายามสร้างคำร้องอัตโนมัติแล้ว กรุณาตรวจสอบ Console สำหรับรายละเอียด'
                    );
                }, 2000);

                return () => clearTimeout(timeoutId);
            }
        }
    }, [autoCreateAttempted, isCreating]);

    // Effect เพื่อตรวจสอบ error states
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
            {/* หัวเรื่องพร้อมชื่อผู้ยื่นคำร้อง */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h4" className={styles.title}>
                    รายละเอียดคำร้อง {accountData.fullName && accountData.fullName !== '-' && `- ${accountData.fullName}`}
                </Typography>

                {/* แสดงสถานะการสร้างข้อมูลอัตโนมัติ */}
                {isDataReady && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!opmChannelId && (
                            <Chip
                                label="กำลังดึง Channel ID"
                                color="warning"
                                size="small"
                                variant="outlined"
                            />
                        )}
                        {opmChannelId && !autoCreateAttempted && !isCreating && isValidForAPICreation() && (
                            <Chip
                                label="พร้อมสร้างอัตโนมัติ"
                                color="info"
                                size="small"
                                variant="outlined"
                            />
                        )}
                        {autoCreateAttempted && (
                            <Chip
                                label="สร้างอัตโนมัติแล้ว"
                                color="success"
                                size="small"
                                variant="outlined"
                            />
                        )}
                    </Box>
                )}
            </Box>

            {/* Debug Panel - สำหรับดูข้อมูลที่ compile แล้ว */}
            {process.env.NODE_ENV === 'development' && (
                <Card sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Debug Panel - Data Status
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Data Ready: {isDataReady ? '✅ Yes' : '❌ No'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Total Sections: {compiledData.length}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Case ID: {getSectionData('main_information').case_id || 'Not available'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            OPM Channel ID: {opmChannelId || 'Loading...'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Creating: {isCreating ? '🔄 Yes' : '⏸️ No'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Auto-Create Status: {autoCreateAttempted ? '✅ Attempted' : '⏳ Pending'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Data Valid for API: {isValidForAPICreation() ? '✅ Yes' : '❌ No'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Account Name (Step 1): {getAccountData().fullName || 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Customer Name (Step 2): {getCustomerData().fullName !== '-' ? getCustomerData().fullName : 'N/A'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Will Include Step 1 (ผู้ยื่นคำร้อง): {getAccountData().fullName && getAccountData().fullName !== '-' ? '✅ Yes' : '❌ No'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            Will Include Step 2 (ผู้เดือดร้อน): {getCustomerData().fullName !== '-' && getCustomerData().fullName !== getAccountData().fullName ? '✅ Yes' : '❌ No'}
                        </Typography>

                        {!opmChannelId && isDataReady && (
                            <Typography variant="body2" color="warning.main" gutterBottom>
                                ⚠️ Warning: OPM Channel ID not found. Please check if "opm1111" channel exists.
                            </Typography>
                        )}

                        {isDataReady && opmChannelId && !autoCreateAttempted && isValidForAPICreation() && (
                            <Typography variant="body2" color="info.main" gutterBottom>
                                🚀 Auto-creating complaint: Step 1 ({getAccountData().fullName !== '-' ? 'ผู้ยื่นคำร้อง' : 'ไม่มี'}) + Step 2 ({getCustomerData().fullName !== '-' && getCustomerData().fullName !== getAccountData().fullName ? 'ผู้เดือดร้อน' : 'ไม่มี'})
                            </Typography>
                        )}

                        {isDataReady && (!opmChannelId || !isValidForAPICreation()) && !autoCreateAttempted && (
                            <Typography variant="body2" color="warning.main" gutterBottom>
                                ⏳ Waiting for valid data or channel ID...
                            </Typography>
                        )}

                        {autoCreateAttempted && (
                            <Typography variant="body2" color="success.main" gutterBottom>
                                ✅ Auto-create process completed. Check console for details.
                            </Typography>
                        )}
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleCreateData}
                                disabled={!isDataReady}
                            >
                                Test API Data (Original)
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleCreateDataBySections}
                                disabled={!isDataReady}
                            >
                                Test API Data (By Sections)
                            </Button>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleCreateDataNewFormat}
                                disabled={!isDataReady || isCreating || !opmChannelId}
                                color="primary"
                            >
                                {isCreating ? '🔄 Creating...' : autoCreateAttempted ? 'Manual Create (Again)' : 'Manual Create'}
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    const apiData = getFormattedDataForCreateAPI();
                                    console.log('=== Current API Data ===');
                                    console.log(JSON.stringify(apiData, null, 2));
                                    console.log('=== Data Structure ===');
                                    console.log('Has Step 1 (ผู้ยื่นคำร้อง):', !!apiData.step1);
                                    console.log('Has Step 2 (ผู้เดือดร้อน):', !!apiData.step2);
                                    console.log('Has Step 3 (ข้อมูลร้องเรียน):', !!apiData.step3);
                                    console.log('Has Step 4 (ยอมรับ):', !!apiData.step4);
                                    alert('ข้อมูลแสดงใน Console แล้ว!');
                                }}
                                disabled={!isDataReady}
                                color="secondary"
                            >
                                Show API Data
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    const accountData = getAccountData();
                                    const customerData = getCustomerData();
                                    const mainInfo = getSectionData('main_information');

                                    console.log('🔍 Validation Details:', {
                                        isDataReady,
                                        opmChannelId,
                                        autoCreateAttempted,
                                        isCreating,
                                        isValidForAPICreation: isValidForAPICreation(),
                                        mainInfo: {
                                            case_code: mainInfo.case_code,
                                            case_id: mainInfo.case_id,
                                            type_text: mainInfo.type_text
                                        },
                                        accountData: {
                                            fullName: accountData.fullName,
                                            citizenId: accountData.citizenId,
                                            phone: accountData.phone,
                                            email: accountData.email
                                        },
                                        customerData: {
                                            fullName: customerData.fullName,
                                            citizenId: customerData.citizenId,
                                            phone: customerData.phone,
                                            email: customerData.email
                                        },
                                        willIncludeStep1: !!(accountData.fullName && accountData.fullName !== '-'),
                                        willIncludeStep2: !!(customerData.fullName && customerData.fullName !== '-' && customerData.fullName !== accountData.fullName)
                                    });
                                    alert('ตรวจสอบข้อมูลใน Console แล้ว!');
                                }}
                                disabled={!isDataReady}
                                color="info"
                            >
                                Check Validation
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={getOpmChannelId}
                                disabled={isCreating}
                                color="secondary"
                            >
                                Refresh Channel ID
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            )}

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

                    <Grid container spacing={3} className={styles.infoGrid}>
                        <Grid item xs={12} md={12}>
                            <Box className={styles.infoItem}>
                                <PersonIcon className={styles.infoIcon} />
                                <Box>
                                    <Typography variant="subtitle2" className={styles.label}>
                                        ชื่อ-นามสกุล
                                    </Typography>
                                    <Typography variant="body1" className={styles.value} sx={{
                                        color: '#1976d2',
                                        fontWeight: 'medium',
                                        fontSize: '1.1rem'
                                    }}>
                                        {accountData.fullName}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {accountData.citizenId && accountData.citizenId !== '-' && (
                            <Grid item xs={12} md={6}>
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
                            <Grid item xs={12} md={6}>
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
                            <Grid item xs={12} md={6}>
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

                        {accountData.contacts?.find(c => c.detail_type === 'M')?.detail && (
                            <Grid item xs={12} md={6}>
                                <Box className={styles.infoItem}>
                                    <PhoneIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            เบอร์โทรศัพท์
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {accountData.contacts.find(c => c.detail_type === 'M')?.detail}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {accountData.address && (accountData.address.subdistrict || accountData.address.district || accountData.address.province) && (
                            <Grid item xs={12}>
                                <Box className={styles.infoItem}>
                                    <LocationIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            ที่อยู่
                                        </Typography>
                                        <Typography variant="body1" className={styles.value}>
                                            {[
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

                        <Grid container spacing={3} className={styles.infoGrid}>
                            <Grid item xs={12} md={12}>
                                <Box className={styles.infoItem}>
                                    <PersonIcon className={styles.infoIcon} />
                                    <Box>
                                        <Typography variant="subtitle2" className={styles.label}>
                                            ชื่อ-นามสกุล
                                        </Typography>
                                        <Typography variant="body1" className={styles.value} sx={{
                                            color: '#d32f2f',
                                            fontWeight: 'medium',
                                            fontSize: '1.1rem'
                                        }}>
                                            {customerData.fullName}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            {customerData.citizenId && customerData.citizenId !== '-' && (
                                <Grid item xs={12} md={6}>
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

                            {customerData.contacts?.find(c => c.detail_type === 'E')?.detail && (
                                <Grid item xs={12} md={6}>
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

                            {customerData.contacts?.find(c => c.detail_type === 'M')?.detail && (
                                <Grid item xs={12} md={6}>
                                    <Box className={styles.infoItem}>
                                        <PhoneIcon className={styles.infoIcon} />
                                        <Box>
                                            <Typography variant="subtitle2" className={styles.label}>
                                                เบอร์โทรศัพท์
                                            </Typography>
                                            <Typography variant="body1" className={styles.value}>
                                                {customerData.contacts.find(c => c.detail_type === 'M')?.detail}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                            )}

                            {customerData.address && (customerData.address.subdistrict || customerData.address.district || customerData.address.province) && (
                                <Grid item xs={12}>
                                    <Box className={styles.infoItem}>
                                        <LocationIcon className={styles.infoIcon} />
                                        <Box>
                                            <Typography variant="subtitle2" className={styles.label}>
                                                ที่อยู่
                                            </Typography>
                                            <Typography variant="body1" className={styles.value}>
                                                {[
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

                    {(!attachmentsDetails || attachmentsDetails.length === 0) ? (
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
                                มีไฟล์แนบ {attachmentsDetails.length} ไฟล์
                            </Typography>
                            {attachmentsDetails.map((file, index) => {
                                let fileUrl = "#";
                                if (file.file_content) {
                                    if (file.file_type === "application/pdf") {
                                        fileUrl = `data:application/pdf;base64,${file.file_content}`;
                                    } else if (file.file_type?.startsWith("image/")) {
                                        fileUrl = `data:${file.file_type};base64,${file.file_content}`;
                                    } else {
                                        fileUrl = `data:application/octet-stream;base64,${file.file_content}`;
                                    }
                                }

                                return (
                                    <Box key={file.attachment_id || index} className={styles.attachmentItem} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <AttachFileIcon />
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {file.file_name || `ไฟล์แนบ ${index + 1}`}
                                        </Typography>
                                        {file.file_description && (
                                            <Typography variant="caption" sx={{ ml: 1 }}>
                                                ({file.file_description})
                                            </Typography>
                                        )}
                                        {file.file_content && (
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ marginLeft: 8, color: "#1976d2", textDecoration: "underline", fontWeight: 500 }}
                                                download={file.file_name}
                                            >
                                                ดาวน์โหลด
                                            </a>
                                        )}
                                    </Box>
                                );
                            })}
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