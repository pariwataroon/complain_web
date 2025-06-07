import React from "react";
import {
    Modal,
    Box,
    Typography,
    Button,
    TextField,
    MenuItem,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { alertError, alertSuccess, showLoading, closeAlert } from "@utils/Alerts";
import { AddOperating } from "@pages/api/opm/opm";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import styles from "./OPMModal.module.scss";

const OPMModal = ({ open, onClose, params, caseDetails }) => {
    const { handleSubmit, control, reset } = useForm();

    const handleModalClose = () => {
        onClose();
        reset();
    };

    // Helper function to format Thai date to MySQL datetime format
    const formatThaiDateToMySQL = (thaiDate) => {
        if (!thaiDate) return null;

        const year = thaiDate.year;
        const month = String(thaiDate.month).padStart(2, '0');
        const day = String(thaiDate.day).padStart(2, '0');
        const currentTime = new Date();
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const minutes = String(currentTime.getMinutes()).padStart(2, '0');
        const seconds = String(currentTime.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const handleFormSubmit = async (data) => {
        try {
            // Custom validation with specific field highlighting
            const errors = [];

            if (!data.type_id && data.type_id !== 0) {
                errors.push("• กรุณาเลือกประเภทเรื่อง");
            }

            if (!data.severity_id && data.severity_id !== 0) {
                errors.push("• กรุณาเลือกระดับความสำคัญ");
            }

            if (!data.secret_id && data.secret_id !== 0) {
                errors.push("• กรุณาเลือกระดับความลับ");
            }

            if (!data.date_opened) {
                errors.push("• กรุณาเลือกวันที่เปิดเรื่อง");
            }

            if (!data.date_closed) {
                errors.push("• กรุณาเลือกวันที่ปิดเรื่อง");
            }

            if (!data.detail || data.detail.trim() === "") {
                errors.push("• กรุณากรอกรายละเอียดการปฏิบัติงาน");
            }

            if (errors.length > 0) {
                await alertError(
                    "กรุณากรอกข้อมูลให้ครบถ้วน",
                    `<div style="text-align: left;">${errors.join("<br/>")}</div>`,
                    true
                );
                return;
            }

            // Show loading
            showLoading("กำลังส่งเรื่องไปยัง สปน...");

            // Prepare data for OPM submission
            const submitData = {
                type_id: data.type_id,
                objective_id: 6,
                terminal_org_id: "{{created_by_org}}", 
                terminal_owner_id: "vampirebeam", 
                contact_detail: data.contact_detail || "",
                date_opened: formatThaiDateToMySQL(data.date_opened),
                date_closed: formatThaiDateToMySQL(data.date_closed),
                detail: data.detail,
                severity_id: data.severity_id,
                secret_id: data.secret_id,
                case_id: params?.id,
                send_to: "OPM"
            };

            console.log("OPM Form Data Submitted:", submitData);

            await AddOperating(submitData);

            closeAlert();
            await alertSuccess("สำเร็จ", "ส่งเรื่องไปยัง สปน. เรียบร้อยแล้ว");

            handleModalClose();

            window.location.reload();

        } catch (error) {
            closeAlert();
            console.error("Error submitting OPM form:", error);
            await alertError("เกิดข้อผิดพลาด", "ไม่สามารถส่งเรื่องไปยัง สปน. ได้ กรุณาลองใหม่อีกครั้ง");
        }
    };

    return (
        <Modal open={open} onClose={handleModalClose}>
            <Box className={styles.modalOverlay}>
                <Box className={styles.modalContainer}>
                    <Box className={styles.modalHeader}>
                        <Typography variant="h5" className={styles.modalTitle}>
                            ส่งเรื่องไปยัง สปน.
                        </Typography>
                        <Box className={styles.titleUnderline}></Box>
                    </Box>

                    <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.modalForm}>

                        {/* Type ID */}
                        <Box className={styles.fieldGroup}>
                            <Controller
                                name="type_id"
                                control={control}
                                defaultValue=""
                                rules={{ required: "กรุณาเลือกประเภทเรื่อง" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Box className={styles.fieldContainer}>
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
                                        >
                                            <MenuItem value={14}>รายงานผลปฏิบัติงาน</MenuItem>
                                            <MenuItem value={15}>รายงานผลการพิจารณาเรื่อง</MenuItem>
                                        </TextField>
                                    </Box>
                                )}
                            />
                        </Box>

                        {/* Severity ID */}
                        <Box className={styles.fieldGroup}>
                            <Controller
                                name="severity_id"
                                control={control}
                                defaultValue=""
                                rules={{ required: "กรุณาเลือกระดับความสำคัญ" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Box className={styles.fieldContainer}>
                                        <Typography className={styles.fieldLabel}>
                                            ระดับความสำคัญ <span className={styles.required}>*</span>
                                        </Typography>
                                        <TextField
                                            select
                                            fullWidth
                                            {...field}
                                            error={!!error}
                                            helperText={error?.message}
                                            className={styles.selectField}
                                            placeholder="เลือกระดับความสำคัญ"
                                        >
                                            <MenuItem value={1}>ปกติ</MenuItem>
                                            <MenuItem value={2}>ด่วน</MenuItem>
                                            <MenuItem value={3}>ด่วนมาก</MenuItem>
                                            <MenuItem value={4}>ด่วนที่สุด</MenuItem>
                                        </TextField>
                                    </Box>
                                )}
                            />
                        </Box>

                        {/* Secret ID */}
                        <Box className={styles.fieldGroup}>
                            <Controller
                                name="secret_id"
                                control={control}
                                defaultValue=""
                                rules={{ required: "กรุณาเลือกระดับความลับ" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Box className={styles.fieldContainer}>
                                        <Typography className={styles.fieldLabel}>
                                            ระดับความลับ <span className={styles.required}>*</span>
                                        </Typography>
                                        <TextField
                                            select
                                            fullWidth
                                            {...field}
                                            error={!!error}
                                            helperText={error?.message}
                                            className={styles.selectField}
                                            placeholder="เลือกระดับความลับ"
                                        >
                                            <MenuItem value={1}>ปกติ</MenuItem>
                                            <MenuItem value={2}>ลับ</MenuItem>
                                            <MenuItem value={3}>ลับมาก</MenuItem>
                                            <MenuItem value={4}>ลับที่สุด</MenuItem>
                                        </TextField>
                                    </Box>
                                )}
                            />
                        </Box>

                        {/* Date Opened */}
                        <Box className={styles.fieldGroup}>
                            <Controller
                                name="date_opened"
                                control={control}
                                defaultValue={null}
                                rules={{ required: "กรุณาเลือกวันที่เปิดเรื่อง" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Box className={styles.fieldContainer}>
                                        <Typography className={styles.fieldLabel}>
                                            วันที่เปิดเรื่อง <span className={styles.required}>*</span>
                                        </Typography>
                                        <DateThaiPickerService
                                            value={field.value}
                                            onChange={field.onChange}
                                            name={field.name}
                                            placeholder="กรุณาเลือกวันที่เปิดเรื่อง..."
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

                        {/* Date Closed */}
                        <Box className={styles.fieldGroup}>
                            <Controller
                                name="date_closed"
                                control={control}
                                defaultValue={null}
                                rules={{ required: "กรุณาเลือกวันที่ปิดเรื่อง" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Box className={styles.fieldContainer}>
                                        <Typography className={styles.fieldLabel}>
                                            วันที่ปิดเรื่อง <span className={styles.required}>*</span>
                                        </Typography>
                                        <DateThaiPickerService
                                            value={field.value}
                                            onChange={field.onChange}
                                            name={field.name}
                                            placeholder="กรุณาเลือกวันที่ปิดเรื่อง..."
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

                        {/* Contact Detail (Optional) */}
                        <Box className={styles.fieldGroup}>
                            <Controller
                                name="contact_detail"
                                control={control}
                                defaultValue=""
                                render={({ field, fieldState: { error } }) => (
                                    <Box className={styles.fieldContainer}>
                                        <Typography className={styles.fieldLabel}>
                                            รายละเอียดการติดต่อ (ไม่บังคับ)
                                        </Typography>
                                        <TextField
                                            multiline
                                            rows={3}
                                            fullWidth
                                            {...field}
                                            error={!!error}
                                            helperText={error?.message}
                                            className={styles.textAreaField}
                                            placeholder="กรอกรายละเอียดการติดต่อ (ถ้ามี)..."
                                        />
                                    </Box>
                                )}
                            />
                        </Box>

                        {/* Detail */}
                        <Box className={styles.fieldGroup}>
                            <Controller
                                name="detail"
                                control={control}
                                defaultValue=""
                                rules={{ required: "กรุณากรอกรายละเอียดการปฏิบัติงาน" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Box className={styles.fieldContainer}>
                                        <Typography className={styles.fieldLabel}>
                                            รายละเอียดการปฏิบัติงาน <span className={styles.required}>*</span>
                                        </Typography>
                                        <TextField
                                            multiline
                                            rows={4}
                                            fullWidth
                                            {...field}
                                            error={!!error}
                                            helperText={error?.message}
                                            className={styles.textAreaField}
                                            placeholder="กรุณากรอกรายละเอียดการปฏิบัติงาน..."
                                        />
                                    </Box>
                                )}
                            />
                        </Box>

                        <Box className={styles.modalActions}>
                            <Button
                                onClick={handleModalClose}
                                className={styles.cancelButton}
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                className={styles.submitButton}
                            >
                                ส่งเรื่องไปยัง สปน.
                            </Button>
                        </Box>
                    </form>
                </Box>
            </Box>
        </Modal>
    );
};

export default OPMModal;