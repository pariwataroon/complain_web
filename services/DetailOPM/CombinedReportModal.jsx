import React, { useState, useCallback, useEffect } from "react";
import {
    Modal,
    Box,
    Typography,
    Button,
    TextField,
    MenuItem,
    Backdrop,
    Fade,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { alertError, alertSuccess, showLoading, closeAlert } from "@utils/Alerts";
import InputFile from "@services/InputFileOPM/InputFile";
import { SetOrgSummaryResult, AddOperating, OperatingAttachment } from "@pages/api/opm/opm";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import styles from "./CombinedReportModal.module.scss";

const CombinedReportModal = ({ open, onClose, params, caseDetails, itemData, operatingsDetails }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const [fileErrors, setFileErrors] = useState({});
    const [organizationOptions, setOrganizationOptions] = useState([]);

    const { handleSubmit, control, reset, watch } = useForm();

    const dateOpened = watch("date_opened");
    const dateClosed = watch("date_closed");

    // Static options - ไม่ใช้ useMemo เพื่อป้องกัน re-render
    const citizenStatusOptions = [
        { value: 0, label: "อยู่ระหว่างดำเนินการ" },
        { value: 1, label: "ยุติเรื่อง" },
        { value: 2, label: "รับทราบไว้ชั้นต้น" },
        { value: 3, label: "ไม่อยู่ในอำนาจหน้าที่" },
    ];

    const opmTypeOptions = [
        { value: 14, label: "รายงานผลปฏิบัติงาน" },
        { value: 15, label: "รายงานผลการพิจารณาเรื่อง" },
    ];

    const getCaseId = useCallback(() => {
        if (itemData?.case_id) return itemData.case_id;
        const caseIdFromDetails = caseDetails?.find(detail => detail.field === "case_id")?.value;
        return caseIdFromDetails || params?.case_id;
    }, [itemData, caseDetails, params]);

    const getCreatedBy = useCallback(() => {
        if (itemData?.created_by) return itemData.created_by;
        return caseDetails?.find(detail => detail.field === "created_by")?.value || "system";
    }, [itemData, caseDetails]);

    // แก้ไข handleModalClose - ไม่เรียก reset ใน callback
    const handleModalClose = useCallback(() => {
        if (isSubmitting) return;
        onClose?.();
    }, [isSubmitting, onClose]);

    const formatThaiDateToMySQL = useCallback((isoString) => {
        if (!isoString) return null;

        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return null;

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch (error) {
            console.error("Date formatting error:", error);
            return null;
        }
    }, []);

    // File handling functions
    const handleFileChange = useCallback((files) => {
        setAttachments(files);
        setFileErrors({});
    }, []);

    const getFieldError = useCallback((fieldName) => {
        return fileErrors[fieldName];
    }, [fileErrors]);

    const validateFiles = useCallback(() => {
        const errors = {};
        attachments.forEach((file) => {
            const allowedTypes = ['application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg', 'image/jpg', 'image/png'];

            if (!allowedTypes.includes(file.type)) {
                errors.attachment = "ประเภทไฟล์ไม่ถูกต้อง";
            }
            if (file.size > 10 * 1024 * 1024) {
                errors.attachment = "ไฟล์มีขนาดใหญ่เกิน 10MB";
            }
        });
        setFileErrors(errors);
        return Object.keys(errors).length === 0;
    }, [attachments]);

    const validateForm = useCallback((data) => {
        const errors = [];
        if (!data.status_id && data.status_id !== 0) {
            errors.push("• กรุณาเลือกสถานะการดำเนินการ");
        }
        if (!data.org_id) {
            errors.push("• กรุณาเลือกหน่วยงานที่จะส่งรายงาน");
        }
        if (!data.type_id && data.type_id !== 0) {
            errors.push("• กรุณาเลือกประเภทเรื่องการตอบกลับ");
        }
        if (!data.date_opened) {
            errors.push("• กรุณาเลือกวันที่เปิดเรื่อง");
        }
        if (!data.date_closed) {
            errors.push("• กรุณาเลือกวันที่ปิดเรื่อง");
        }
        if (data.date_opened && data.date_closed) {
            const openDate = new Date(data.date_opened);
            const closeDate = new Date(data.date_closed);
            if (closeDate <= openDate) {
                errors.push("• วันที่ปิดเรื่องต้องมาหลังวันที่เปิดเรื่อง");
            }
        }
        if (!data.opm_details || data.opm_details.trim() === "") {
            errors.push("• กรุณากรอกรายละเอียดการปฏิบัติงาน");
        }
        return errors;
    }, []);

    const convertFilesToBase64 = useCallback(async (files) => {
        const convertFile = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve({
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        fileContent: base64
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        try {
            const converted = await Promise.all(files.map(convertFile));
            return converted;
        } catch (error) {
            console.error("File conversion error:", error);
            return [];
        }
    }, []);

    // แก้ไข useEffect สำหรับ organizationOptions - ใช้ timeout เพื่อป้องกัน infinite loop
    useEffect(() => {
        if (!open || !operatingsDetails?.length) {
            setOrganizationOptions([]);
            return;
        }

        const timeoutId = setTimeout(() => {
            const uniqueOfficers = [];
            const officerMap = new Map();

            operatingsDetails.forEach(operation => {
                if (operation.org_id === "301") {
                    const officerId = operation.created_by_org;
                    const officerText = operation.created_by_text;
                    const createdBy = operation.created_by;
                    if (officerId && officerText && !officerMap.has(officerId)) {
                        officerMap.set(officerId, true);
                        uniqueOfficers.push({ value: officerId, label: officerText, created_by: createdBy });
                    }
                }
            });

            uniqueOfficers.sort((a, b) => a.label.localeCompare(b.label, 'th'));
            setOrganizationOptions(uniqueOfficers);
        }, 0); // ใช้ setTimeout เพื่อแยก out of render cycle

        return () => clearTimeout(timeoutId);
    }, [open]); // dependency เป็น open เท่านั้น

    const getSelectedOfficerCreatedBy = useCallback((selectedOrgId) => {
        if (!selectedOrgId) return getCreatedBy();
        const selectedOfficer = organizationOptions.find(officer => officer.value === selectedOrgId);
        return selectedOfficer?.created_by || getCreatedBy();
    }, [organizationOptions, getCreatedBy]);

    // แก้ไข form reset - แยก reset ออกจาก modal close
    useEffect(() => {
        if (open) {
            // Reset form เมื่อเปิด modal
            setTimeout(() => {
                reset();
                setAttachments([]);
                setFileErrors({});
            }, 100);
        }
    }, [open, reset]);

    const handleFormSubmit = async (data) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            const caseIdValue = getCaseId();
            const selectedOfficerCreatedBy = getSelectedOfficerCreatedBy(data.org_id);

            if (!caseIdValue) {
                await alertError("เกิดข้อผิดพลาด", "ไม่พบข้อมูล case_id");
                return;
            }

            const validationErrors = validateForm(data);
            if (validationErrors.length > 0) {
                await alertError(
                    "กรุณากรอกข้อมูลให้ครบถ้วน",
                    `<div style="text-align: left;">${validationErrors.join("<br/>")}</div>`,
                    true
                );
                return;
            }

            if (!validateFiles()) {
                return;
            }

            showLoading("กำลังส่งรายงาน...");

            const opmData = {
                case_id: caseIdValue,
                type_id: data.type_id,
                status_id: data.status_id,
                created_by: selectedOfficerCreatedBy,
                org_id: data.org_id,
                contact_detail: data.contact_detail?.trim() || "",
                date_opened: formatThaiDateToMySQL(data.date_opened),
                date_closed: formatThaiDateToMySQL(data.date_closed),
                detail: data.opm_details.trim(),
                severity_id: data.severity_id || 1,
                secret_id: data.secret_id || 1,
                send_to: "OPM"
            };

            const [citizenResponse, opmResponse] = await Promise.all([
                SetOrgSummaryResult(opmData),
                AddOperating(opmData)
            ]);

            let operatingId = null;
            if (opmResponse.success && opmResponse.operating_id) {
                operatingId = opmResponse.operating_id;
            } else {
                try {
                    const xmlString = opmResponse.raw_response?.data || opmResponse.data;
                    if (xmlString) {
                        const match = xmlString.match(/<AddOperatingResult>(.*?)<\/AddOperatingResult>/);
                        if (match && match[1]) {
                            const rawResult = match[1].replace(/"/g, '');
                            if (rawResult.includes("Result:")) {
                                const resultMatch = rawResult.match(/Result:([A-F0-9]+)/i);
                                if (resultMatch && resultMatch[1]) {
                                    operatingId = resultMatch[1];
                                }
                            }
                        }
                    }
                } catch (parseError) {
                    console.error("Error in fallback operating_id extraction:", parseError);
                }
            }

            if (attachments.length > 0 && operatingId) {
                showLoading("กำลังอัปโหลดไฟล์แนบ...");
                const convertedAttachments = await convertFilesToBase64(attachments);

                const attachmentPromises = convertedAttachments.map(async (file) => {
                    const attachmentData = {
                        case_id: caseIdValue,
                        operating_id: operatingId,
                        file_name: file.fileName,
                        file_content: file.fileContent,
                        file_description: data.contact_detail?.trim() || `ไฟล์แนบ: ${file.fileName}`,
                        doc_type_id: 8,
                        doc_type: "X",
                        doc_no: "",
                        doc_date: null,
                        doc_ref_no: "",
                        doc_ref_date: null,
                        document_no: "",
                        document_date: null
                    };

                    try {
                        return await OperatingAttachment(attachmentData);
                    } catch (error) {
                        console.error(`Error uploading ${file.fileName}:`, error);
                        throw error;
                    }
                });

                try {
                    await Promise.all(attachmentPromises);
                } catch (attachmentError) {
                    console.error("Error uploading attachments:", attachmentError);
                    await alertError("คำเตือน", "ส่งรายงานสำเร็จแล้ว แต่ไม่สามารถอัปโหลดไฟล์แนบบางไฟล์ได้");
                }
            } else if (attachments.length > 0 && !operatingId) {
                await alertError("คำเตือน", "ส่งรายงานสำเร็จแล้ว แต่ไม่สามารถอัปโหลดไฟล์แนบได้ เนื่องจากไม่พบ operating_id");
            }

            closeAlert();
            handleModalClose();

            setTimeout(async () => {
                await alertSuccess("สำเร็จ", "ส่งรายงานเรียบร้อยแล้ว");
                window.location.reload();
            }, 300);

        } catch (error) {
            closeAlert();
            console.error("Form submission error:", error);
            const errorMessage = error?.response?.data?.message || error?.message ||
                "ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง";
            await alertError("เกิดข้อผิดพลาด", errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ถ้า Modal ไม่เปิด ไม่ render เลย
    if (!open) return null;

    return (
        <Modal
            open={open}
            onClose={handleModalClose}
            disableEscapeKeyDown={isSubmitting}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{
                timeout: 500,
                style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
            }}
            style={{ zIndex: isSubmitting ? 1200 : 1300 }}
        >
            <Fade in={open}>
                <Box className={styles.modalOverlay}>
                    <Box className={`${styles.modalContainer} ${isSubmitting ? styles.submitting : ''}`}>
                        <Box className={styles.modalHeader}>
                            <Typography variant="h5" className={styles.modalTitle}>
                                ส่งรายงาน
                            </Typography>
                            <Box className={styles.titleUnderline}></Box>
                        </Box>

                        <form
                            onSubmit={handleSubmit(handleFormSubmit)}
                            className={`${styles.modalForm} ${isSubmitting ? styles.submitting : ''}`}
                        >
                            {/* สถานะการดำเนินการ */}
                            <Box className={styles.fieldGroup}>
                                <Controller
                                    name="status_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: "กรุณาเลือกสถานะ",
                                        validate: value => value !== "" || "กรุณาเลือกสถานะ"
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <Box className={`${styles.fieldContainer} ${isSubmitting ? styles.loading : ''}`}>
                                            <Typography className={styles.fieldLabel}>
                                                สถานะการดำเนินการ <span className={styles.required}>*</span>
                                            </Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                {...field}
                                                error={!!error}
                                                helperText={error?.message}
                                                className={styles.selectField}
                                                placeholder="เลือกสถานะการดำเนินการ"
                                                disabled={isSubmitting}
                                            >
                                                {citizenStatusOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Box>
                                    )}
                                />
                            </Box>

                            {/* ประเภทเรื่องการตอบกลับ */}
                            <Box className={styles.fieldGroup}>
                                <Controller
                                    name="type_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: "กรุณาเลือกประเภทเรื่อง",
                                        validate: value => value !== "" || "กรุณาเลือกประเภทเรื่อง"
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <Box className={`${styles.fieldContainer} ${isSubmitting ? styles.loading : ''}`}>
                                            <Typography className={styles.fieldLabel}>
                                                ประเภทเรื่องการตอบกลับ <span className={styles.required}>*</span>
                                            </Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                {...field}
                                                error={!!error}
                                                helperText={error?.message}
                                                className={styles.selectField}
                                                placeholder="เลือกประเภทเรื่อง"
                                                disabled={isSubmitting}
                                            >
                                                {opmTypeOptions.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Box>
                                    )}
                                />
                            </Box>

                            {/* ส่งให้หน่วยงาน */}
                            <Box className={styles.fieldGroup}>
                                <Controller
                                    name="org_id"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: "กรุณาเลือกหน่วยงานที่จะส่งรายงาน"
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <Box className={`${styles.fieldContainer} ${isSubmitting ? styles.loading : ''}`}>
                                            <Typography className={styles.fieldLabel}>
                                                ตอบกลับเจ้าหน้าที่ <span className={styles.required}>*</span>
                                            </Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                {...field}
                                                error={!!error}
                                                helperText={error?.message}
                                                className={styles.selectField}
                                                placeholder="เลือกหน่วยงานที่จะส่งรายงาน"
                                                disabled={isSubmitting || organizationOptions.length === 0}
                                            >
                                                {organizationOptions.length === 0 ? (
                                                    <MenuItem value="" disabled>
                                                        ไม่พบข้อมูลหน่วยงาน
                                                    </MenuItem>
                                                ) : (
                                                    organizationOptions.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))
                                                )}
                                            </TextField>
                                            {organizationOptions.length === 0 && (
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                                    หมายเหตุ: ไม่พบข้อมูลหน่วยงานจากประวัติการดำเนินงาน
                                                </Typography>
                                            )}
                                        </Box>
                                    )}
                                />
                            </Box>

                            {/* วันที่เปิดเรื่อง และ วันที่ปิดเรื่อง */}
                            <Box className={styles.fieldRow}>
                                <Box className={styles.fieldGroup}>
                                    <Controller
                                        name="date_opened"
                                        control={control}
                                        defaultValue={null}
                                        rules={{
                                            required: "กรุณาเลือกวันที่เปิดเรื่อง",
                                            validate: {
                                                notFuture: value => {
                                                    if (!value) return true;
                                                    const selectedDate = new Date(value);
                                                    const now = new Date();
                                                    return selectedDate <= now || "วันที่เปิดเรื่องไม่สามารถเป็นวันในอนาคตได้";
                                                }
                                            }
                                        }}
                                        render={({ field, fieldState: { error } }) => (
                                            <Box className={`${styles.fieldContainer} ${isSubmitting ? styles.loading : ''}`}>
                                                <Typography className={styles.fieldLabel}>
                                                    วันที่เปิดเรื่อง <span className={styles.required}>*</span>
                                                </Typography>
                                                <DateThaiPickerService
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    name={field.name}
                                                    placeholder="กรุณาเลือกวันที่เปิดเรื่อง..."
                                                    disabled={isSubmitting}
                                                    time={true}
                                                    className={styles.datePickerField}
                                                />
                                                {error && (
                                                    <Typography className={styles.errorText}>
                                                        {error.message}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    />
                                </Box>

                                <Box className={styles.fieldGroup}>
                                    <Controller
                                        name="date_closed"
                                        control={control}
                                        defaultValue={null}
                                        rules={{
                                            required: "กรุณาเลือกวันที่ปิดเรื่อง",
                                            validate: {
                                                afterOpenDate: value => {
                                                    if (!value || !dateOpened) return true;
                                                    const openDate = new Date(dateOpened);
                                                    const closeDate = new Date(value);
                                                    return closeDate > openDate || "วันที่ปิดเรื่องต้องมาหลังวันที่เปิดเรื่อง";
                                                }
                                            }
                                        }}
                                        render={({ field, fieldState: { error } }) => (
                                            <Box className={`${styles.fieldContainer} ${isSubmitting ? styles.loading : ''}`}>
                                                <Typography className={styles.fieldLabel}>
                                                    วันที่ปิดเรื่อง <span className={styles.required}>*</span>
                                                </Typography>
                                                <DateThaiPickerService
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    name={field.name}
                                                    placeholder="กรุณาเลือกวันที่ปิดเรื่อง..."
                                                    disabled={isSubmitting}
                                                    time={true}
                                                    className={styles.datePickerField}
                                                />
                                                {error && (
                                                    <Typography className={styles.errorText}>
                                                        {error.message}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    />
                                </Box>
                            </Box>

                            {/* รายละเอียดการติดต่อ */}
                            <Box className={styles.fieldGroup}>
                                <Controller
                                    name="contact_detail"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        maxLength: {
                                            value: 500,
                                            message: "รายละเอียดการติดต่อต้องไม่เกิน 500 ตัวอักษร"
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <Box className={`${styles.fieldContainer} ${styles.optionalField} ${isSubmitting ? styles.loading : ''}`}>
                                            <Typography className={styles.fieldLabel}>
                                                รายละเอียดการติดต่อ
                                                <Typography component="span" variant="caption" style={{ marginLeft: 8, color: '#666' }}>
                                                    ({field.value?.length || 0}/500 ตัวอักษร)
                                                </Typography>
                                            </Typography>
                                            <TextField
                                                multiline
                                                rows={3}
                                                fullWidth
                                                {...field}
                                                error={!!error}
                                                helperText={error?.message}
                                                className={styles.textAreaField}
                                                placeholder="กรอกรายละเอียดการติดต่อ"
                                                disabled={isSubmitting}
                                            />
                                        </Box>
                                    )}
                                />
                            </Box>

                            {/* รายละเอียดการปฏิบัติงาน */}
                            <Box className={styles.fieldGroup}>
                                <Controller
                                    name="opm_details"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: "กรุณากรอกรายละเอียดการปฏิบัติงาน",
                                        minLength: {
                                            value: 20,
                                            message: "รายละเอียดการปฏิบัติงานต้องมีอย่างน้อย 20 ตัวอักษร"
                                        },
                                        maxLength: {
                                            value: 2000,
                                            message: "รายละเอียดต้องไม่เกิน 2000 ตัวอักษร"
                                        }
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <Box className={`${styles.fieldContainer} ${isSubmitting ? styles.loading : ''}`}>
                                            <Typography className={styles.fieldLabel}>
                                                รายละเอียดการปฏิบัติงาน <span className={styles.required}>*</span>
                                                <Typography component="span" variant="caption" style={{ marginLeft: 8, color: '#666' }}>
                                                    ({field.value?.length || 0}/2000 ตัวอักษร)
                                                </Typography>
                                            </Typography>
                                            <TextField
                                                multiline
                                                rows={6}
                                                fullWidth
                                                {...field}
                                                error={!!error}
                                                helperText={error?.message}
                                                className={styles.textAreaField}
                                                placeholder="กรุณากรอกรายละเอียดการปฏิบัติงาน..."
                                                disabled={isSubmitting}
                                            />
                                        </Box>
                                    )}
                                />
                            </Box>

                            {/* ไฟล์แนบ */}
                            <Box className={styles.fieldGroup}>
                                <Box className={`${styles.fieldContainer} ${styles.optionalField} ${isSubmitting ? styles.loading : ''}`}>
                                    <Typography className={styles.fieldLabel}>
                                        เอกสารประกอบการร้องเรียน
                                    </Typography>
                                    <InputFile
                                        label=""
                                        name="attachment"
                                        onChange={handleFileChange}
                                        error={!!fileErrors.attachment}
                                        helperText={getFieldError("attachment") || "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"}
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        maxFiles={3}
                                        maxSizeMB={10}
                                        disabled={isSubmitting}
                                    />
                                </Box>
                            </Box>

                            {/* Action Buttons */}
                            <Box className={styles.modalActions}>
                                <Button
                                    onClick={handleModalClose}
                                    className={styles.cancelButton}
                                    type="button"
                                    disabled={isSubmitting}
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "กำลังส่ง..." : "ส่งรายงาน"}
                                </Button>
                            </Box>
                        </form>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    );
};

export default CombinedReportModal;