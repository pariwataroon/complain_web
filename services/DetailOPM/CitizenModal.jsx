import React, { useState } from "react";
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
import { SetOrgSummaryResult } from "@pages/api/opm/opm";
import styles from "./CitizenModal.module.scss";

const CitizenModal = ({ open, onClose, params, caseDetails }) => {
    const { handleSubmit, control, reset } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleModalClose = () => {
        if (!isSubmitting) {
            onClose();
            reset();
        }
    };

    const handleFormSubmit = async (data) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            const caseIdValue = caseDetails.find(
                (detail) => detail.field === "case_id"
            )?.value;

            if (!caseIdValue) {
                console.error("case_id is undefined or not found in caseDetails.");
                await alertError("เกิดข้อผิดพลาด", "ไม่พบข้อมูล case_id");
                setIsSubmitting(false);
                return;
            } else {
                console.log("case_id:", caseIdValue);
            }

            const errors = [];

            if (!data.status_id && data.status_id !== 0) {
                errors.push("• กรุณาเลือกสถานะ");
            }

            if (!data.details || data.details.trim() === "") {
                errors.push("• กรุณากรอกรายละเอียด");
            }

            if (errors.length > 0) {
                await alertError(
                    "กรุณากรอกข้อมูลให้ครบถ้วน",
                    `<div style="text-align: left;">${errors.join("<br/>")}</div>`,
                    true
                );
                setIsSubmitting(false);
                return;
            }

            // Show loading
            showLoading("กำลังส่งเรื่องไปยังประชาชน...");

            const submitData = {
                case_id: caseIdValue,
                status_id: data.status_id,
                details: data.details,
                send_to: "CITIZEN",
                created_by: "vampirebeam",
                created_date: new Date().toISOString()
            };

            console.log("Citizen Form Data Submitted:", submitData);

            const response = await SetOrgSummaryResult(submitData);
            console.log("API Response:", response);

            // Close loading immediately
            closeAlert();

            // Close modal first BEFORE showing success alert
            onClose();
            reset();
            setIsSubmitting(false);

            // Wait a bit for modal to close, then show success
            setTimeout(async () => {
                await alertSuccess("สำเร็จ", "ส่งเรื่องไปยังประชาชนเรียบร้อยแล้ว");
                // Reload after success alert is dismissed
                window.location.reload();
            }, 300);

        } catch (error) {
            closeAlert();
            setIsSubmitting(false);
            console.error("Error submitting Citizen form:", error);
            await alertError("เกิดข้อผิดพลาด", "ไม่สามารถส่งเรื่องไปยังประชาชนได้ กรุณาลองใหม่อีกครั้ง");
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleModalClose}
            disableEscapeKeyDown={isSubmitting} // Disable escape when submitting
            style={{ zIndex: isSubmitting ? 1200 : 1300 }} // Lower z-index when submitting
        >
            <Box className={styles.modalOverlay}>
                <Box className={styles.modalContainer}>
                    <Box className={styles.modalHeader}>
                        <Typography variant="h5" className={styles.modalTitle}>
                            ส่งเรื่องไปยังประชาชน
                        </Typography>
                        <Box className={styles.titleUnderline}></Box>
                    </Box>

                    <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.modalForm}>

                        {/* Status ID */}
                        <Box className={styles.fieldGroup}>
                            <Controller
                                name="status_id"
                                control={control}
                                defaultValue=""
                                rules={{ required: "กรุณาเลือกสถานะ" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Box className={styles.fieldContainer}>
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
                                            <MenuItem value={0}>อยู่ระหว่างดำเนินการ</MenuItem>
                                            <MenuItem value={1}>ยุติเรื่อง</MenuItem>
                                            <MenuItem value={2}>รับทราบไว้ชั้นต้น</MenuItem>
                                            <MenuItem value={3}>ไม่อยู่ในอำนาจหน้าที่</MenuItem>
                                        </TextField>
                                    </Box>
                                )}
                            />
                        </Box>

                        {/* Details */}
                        <Box className={styles.fieldGroup}>
                            <Controller
                                name="details"
                                control={control}
                                defaultValue=""
                                rules={{ required: "กรุณากรอกรายละเอียด" }}
                                render={({ field, fieldState: { error } }) => (
                                    <Box className={styles.fieldContainer}>
                                        <Typography className={styles.fieldLabel}>
                                            รายละเอียดการดำเนินการ <span className={styles.required}>*</span>
                                        </Typography>
                                        <TextField
                                            multiline
                                            rows={6}
                                            fullWidth
                                            {...field}
                                            error={!!error}
                                            helperText={error?.message}
                                            className={styles.textAreaField}
                                            placeholder="กรุณากรอกรายละเอียดการดำเนินการที่จะแจ้งให้ประชาชนทราบ..."
                                            disabled={isSubmitting}
                                        />
                                    </Box>
                                )}
                            />
                        </Box>

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
                                {isSubmitting ? "กำลังส่ง..." : "ส่งเรื่องไปยังประชาชน"}
                            </Button>
                        </Box>
                    </form>
                </Box>
            </Box>
        </Modal>
    );
};

export default CitizenModal;