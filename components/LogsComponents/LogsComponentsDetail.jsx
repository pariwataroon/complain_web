import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BreadcrumbsService from '@services/BreadCrumbs/breadcrumbs';
import { GetLogDetails } from '@pages/api/logs/logs';
import styles from './LogsComponentsDetail.module.scss';
import {
    Info as InfoIcon,
    AccessTime as ClockIcon,
    Code as CodeIcon,
    Storage as DatabaseIcon,
    Person as UserIcon,
    CalendarToday as CalendarIcon,
    Language as GlobeIcon,
    ArrowBack as ArrowLeftIcon,
    Computer as ServerIcon,
    Speed as SpeedIcon,
    Http as HttpIcon,
    LocationOn as LocationIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';
import {
    formatThaiOfficialDateTimeTimeseven,
    formatElapsedThaiTime,
} from '@utils/Formats';
import HistoryIcon from '@mui/icons-material/History';

const breadcrumbItems = [
    {
        label: "บันทึกการใช้งานของระบบ",
        icon: (
            <HistoryIcon />
        ),
        url: "/admin/logs/",
    },
    {
        label: "รายละเอียดการใช้งานของระบบ",
    },
];

const LogsComponentsDetail = () => {
    const router = useRouter();
    const { id } = router.query;
    const [logData, setLogData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchLogDetails();
        }
    }, [id]);

    const fetchLogDetails = async () => {
        try {
            setLoading(true);
            const response = await GetLogDetails(id);

            if (response && response.res_code === "0000") {
                setLogData(response.res_data);
            } else {
                setError("ไม่พบข้อมูลที่ต้องการ");
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
            console.error("Error fetching log details:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (statusCode) => {
        if (statusCode >= 200 && statusCode < 300) return "success";
        if (statusCode >= 400 && statusCode < 500) return "warning";
        if (statusCode >= 500) return "error";
        return "info";
    };

    const getMethodColor = (method) => {
        switch (method?.toLowerCase()) {
            case "get": return "get";
            case "post": return "post";
            case "put": return "put";
            case "delete": return "delete";
            case "patch": return "patch";
            default: return "get";
        }
    };

    const formatJSON = (jsonString) => {
        if (!jsonString) return null;
        try {
            const parsed = JSON.parse(jsonString);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return jsonString;
        }
    };

    const handleBackClick = () => {
        router.push('/admin/logs');
    };

    // ฟังก์ชันจัดรูปแบบเวลาประมวลผล
    const formatProcessTime = (processTimeMs) => {
        if (!processTimeMs) return "-";

        const timeMs = parseFloat(processTimeMs);

        if (timeMs < 1000) {
            return `${timeMs.toFixed(2)} มิลลิวินาที`;
        } else if (timeMs < 60000) {
            return `${(timeMs / 1000).toFixed(2)} วินาที`;
        } else {
            const minutes = Math.floor(timeMs / 60000);
            const seconds = ((timeMs % 60000) / 1000).toFixed(2);
            return `${minutes} นาที ${seconds} วินาที`;
        }
    };

    // ฟังก์ชันจัดรูปแบบสถานะ HTTP
    const formatHttpStatus = (statusCode) => {
        const statusText = {
            200: "OK - สำเร็จ",
            201: "Created - สร้างสำเร็จ",
            400: "Bad Request - คำขอไม่ถูกต้อง",
            401: "Unauthorized - ไม่ได้รับอนุญาต",
            403: "Forbidden - ถูกปฏิเสธ",
            404: "Not Found - ไม่พบ",
            500: "Internal Server Error - ข้อผิดพลาดเซิร์ฟเวอร์",
            502: "Bad Gateway - Gateway ผิดพลาด",
            503: "Service Unavailable - บริการไม่พร้อมใช้งาน",
        };

        return statusText[statusCode] || `${statusCode} - ไม่ทราบสถานะ`;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <BreadcrumbsService items={breadcrumbItems} />
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    if (error || !logData) {
        return (
            <div className={styles.container}>
                <BreadcrumbsService items={breadcrumbItems} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <BreadcrumbsService items={breadcrumbItems} />
            {/* Basic Information Card */}
            <div className={styles.detailCard}>
                <div className={styles.cardHeader}>
                    <h2>
                        <InfoIcon className={styles.iconMd} />
                        ข้อมูลพื้นฐาน
                    </h2>
                    <p className={styles.subtitle}>รายละเอียดการเรียกใช้ API</p>
                </div>
                <div className={styles.cardContent}>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <DatabaseIcon className={styles.iconSm} />
                                Log ID
                            </div>
                            <div className={styles.infoValue}>{logData.id}</div>
                        </div>

                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <CodeIcon className={styles.iconSm} />
                                Request ID
                            </div>
                            <div className={styles.infoValue}>{logData.request_id}</div>
                        </div>

                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <CalendarIcon className={styles.iconSm} />
                                วันที่และเวลาที่บันทึก
                            </div>
                            <div className={styles.infoValue}>
                                {formatThaiOfficialDateTimeTimeseven(logData.created_at)}
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <ClockIcon className={styles.iconSm} />
                                เวลาที่ผ่านมา
                            </div>
                            <div className={styles.infoValue}>
                                <span className={styles.elapsedTime}>
                                    {formatElapsedThaiTime(logData.created_at)}
                                </span>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <UserIcon className={styles.iconSm} />
                                User ID
                            </div>
                            <div className={styles.infoValue}>
                                {logData.user_id || "ไม่ระบุผู้ใช้"}
                            </div>
                        </div>

                        {/* เพิ่ม User Name ตรงนี้ */}
                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <UserIcon className={styles.iconSm} />
                                User Name
                            </div>
                            <div className={styles.infoValue}>
                                {logData.user_name || "ไม่ระบุชื่อผู้ใช้"}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Request Information Card */}
            <div className={styles.detailCard}>
                <div className={styles.cardHeader}>
                    <h2>
                        <GlobeIcon className={styles.iconMd} />
                        ข้อมูล Request
                    </h2>
                    <p className={styles.subtitle}>รายละเอียดการส่งคำขอ</p>
                </div>
                <div className={styles.cardContent}>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <HttpIcon className={styles.iconSm} />
                                HTTP Method
                            </div>
                            <div className={styles.infoValue}>
                                <span className={`${styles.methodChip} ${styles[getMethodColor(logData.method)]}`}>
                                    {logData.method}
                                </span>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <CodeIcon className={styles.iconSm} />
                                API Path
                            </div>
                            <div className={styles.infoValue}>{logData.path}</div>
                        </div>

                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <LocationIcon className={styles.iconSm} />
                                Client IP Address
                            </div>
                            <div className={styles.infoValue}>
                                <span className={styles.ipAddress}>{logData.client_ip}</span>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <DatabaseIcon className={styles.iconSm} />
                                Query Parameters
                            </div>
                            <div className={styles.infoValue}>
                                {logData.query_params ? (
                                    <div className={styles.jsonContainer}>
                                        <pre>{formatJSON(logData.query_params)}</pre>
                                    </div>
                                ) : (
                                    <div className={styles.noData}>ไม่มี Query Parameters</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Response Information Card */}
            <div className={styles.detailCard}>
                <div className={styles.cardHeader}>
                    <h2>
                        <ServerIcon className={styles.iconMd} />
                        ข้อมูล Response
                    </h2>
                    <p className={styles.subtitle}>รายละเอียดการตอบกลับ</p>
                </div>
                <div className={styles.cardContent}>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <ServerIcon className={styles.iconSm} />
                                Status Code
                            </div>
                            <div className={styles.infoValue}>
                                <span className={`${styles.statusChip} ${styles[getStatusColor(logData.status_code)]}`}>
                                    {logData.status_code}
                                </span>
                                <div className={styles.statusDescription}>
                                    {formatHttpStatus(logData.status_code)}
                                </div>
                            </div>
                        </div>

                        <div className={styles.infoItem}>
                            <div className={styles.infoLabel}>
                                <SpeedIcon className={styles.iconSm} />
                                Process Time
                            </div>
                            <div className={styles.infoValue}>
                                <span className={styles.processTime}>
                                    <ClockIcon className={styles.iconSm} />
                                    {formatProcessTime(logData.process_time_ms)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Headers Card */}
            <div className={styles.detailCard}>
                <div className={styles.cardHeader}>
                    <h2>
                        <CodeIcon className={styles.iconMd} />
                        Request Headers
                    </h2>
                    <p className={styles.subtitle}>ข้อมูล Headers ที่ส่งมาพร้อมคำขอ</p>
                </div>
                <div className={styles.cardContent}>
                    {logData.request_headers ? (
                        <div className={styles.jsonContainer}>
                            <pre>{formatJSON(logData.request_headers)}</pre>
                        </div>
                    ) : (
                        <div className={styles.noData}>ไม่มี Request Headers</div>
                    )}
                </div>
            </div>

            {/* Request Body Card */}
            <div className={styles.detailCard}>
                <div className={styles.cardHeader}>
                    <h2>
                        <DatabaseIcon className={styles.iconMd} />
                        Request Body
                    </h2>
                    <p className={styles.subtitle}>ข้อมูลที่ส่งมาใน Body ของคำขอ</p>
                </div>
                <div className={styles.cardContent}>
                    {logData.request_body ? (
                        <div className={styles.jsonContainer}>
                            <pre>{formatJSON(logData.request_body)}</pre>
                        </div>
                    ) : (
                        <div className={styles.noData}>ไม่มี Request Body</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogsComponentsDetail;