import React, { useState, useCallback, useEffect } from "react";
import {
    Box,
    Grid,
    Typography,
} from "@mui/material";
import IDCardInput from "@services/IDCardInput/IDCardInput";
import InputText from "@services/InputText/InputText";
import InputPhone from "@services/InputPhone/InputPhone";
import SelectFieldPAA from "@services/SelectFieldPAA/SelectFieldPAA";
import styles from "./ComplaintCustomerForm.module.scss";
import { validateEmail, validateEmailRealtime } from "@utils/emailValidation";

const ComplaintCustomerForm = ({
    data = {},
    onChange,
    title = "ข้อมูลผู้ร้องทุกข์ (นิติบุคคล)",
    validationErrors = {},
    shouldShowValidation = false,
    fieldPrefix = "",
    formType = "mandatory",
}) => {
    const [emailRealtimeError, setEmailRealtimeError] = useState("");
    const [lastEmailValue, setLastEmailValue] = useState("");

    const handleChange = useCallback((field) => (value) => {
        let finalValue = value;

        if (typeof value === "object" && value?.target) {
            finalValue = value.target.value;
        }

        // Special handling for email field
        if (field === "email") {
            // ป้องกันการพิมพ์ภาษาไทย
            const thaiPattern = /[\u0E00-\u0E7F]/;
            if (thaiPattern.test(finalValue)) {
                setEmailRealtimeError("อีเมลต้องเป็นภาษาอังกฤษเท่านั้น ไม่สามารถใช้ภาษาไทยได้");
                return;
            }

            // Real-time validation สำหรับ email
            const realtimeError = validateEmailRealtime(finalValue);
            setEmailRealtimeError(realtimeError || "");
            setLastEmailValue(finalValue);
        }

        onChange(field, finalValue);
    }, [onChange]);

    // Handle email paste event
    const handleEmailPaste = useCallback((event) => {
        const pastedText = event.clipboardData.getData('text');
        const thaiPattern = /[\u0E00-\u0E7F]/;

        if (thaiPattern.test(pastedText)) {
            event.preventDefault();
            setEmailRealtimeError("อีเมลต้องเป็นภาษาอังกฤษเท่านั้น ไม่สามารถใช้ภาษาไทยได้");
            return false;
        }

        setTimeout(() => {
            const realtimeError = validateEmailRealtime(pastedText);
            setEmailRealtimeError(realtimeError || "");
        }, 0);
    }, []);

    // Handle email key press
    const handleEmailKeyPress = useCallback((event) => {
        const thaiPattern = /[\u0E00-\u0E7F]/;
        if (thaiPattern.test(event.key)) {
            event.preventDefault();
            setEmailRealtimeError("อีเมลต้องเป็นภาษาอังกฤษเท่านั้น ไม่สามารถใช้ภาษาไทยได้");
            return false;
        }
    }, []);

    // Reset email error when data.email changes from outside
    useEffect(() => {
        if (data.email !== lastEmailValue) {
            setLastEmailValue(data.email || "");
            if (data.email) {
                const realtimeError = validateEmailRealtime(data.email);
                setEmailRealtimeError(realtimeError || "");
            } else {
                setEmailRealtimeError("");
            }
        }
    }, [data.email, lastEmailValue]);

    const getFieldError = useCallback((fieldName) => {
        // สำหรับ email ให้แสดง real-time error ก่อน
        if (fieldName === "email") {
            if (emailRealtimeError) {
                return emailRealtimeError;
            }
        }

        const errorKey = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
        const error = shouldShowValidation ? validationErrors[errorKey] : "";

        return error;
    }, [shouldShowValidation, validationErrors, fieldPrefix, emailRealtimeError]);

    const hasFieldError = useCallback((fieldName) => {
        if (fieldName === "email") {
            return !!emailRealtimeError || (shouldShowValidation && !!getFieldError(fieldName));
        }

        return shouldShowValidation && !!getFieldError(fieldName);
    }, [shouldShowValidation, getFieldError, emailRealtimeError]);

    const formatLabel = (baseLabel) => {
        return (
            <>
                {baseLabel}
                {/* {formType === "mandatory" && (
                    <span className={styles.requiredAsterisk}>*</span>
                )} */}
            </>
        );
    };

    // Custom email change handler
    const handleEmailChange = useCallback((value) => {
        handleChange("email")(value);
    }, [handleChange]);

    return (
        <Box className={styles.formContainer}>
            <Typography className={styles.title}>
                {title}{" "}
                {formType === "optional" && (
                    <span className={styles.optionalText}></span>
                )}
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <IDCardInput
                        value={data.idCard}
                        onChange={handleChange("idCard")}
                        error={hasFieldError("idCard")}
                        helperText={getFieldError("idCard")}
                        label={formatLabel("เลขทะเบียนนิติบุคคล")}
                        placeholder="เลขทะเบียนนิติบุคคล 13 หลัก"
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label={formatLabel("ชื่อบริษัท")}
                        placeholder="ชื่อบริษัท/องค์กร"
                        value={data.companyName || ""}
                        onChange={handleChange("companyName")}
                        error={hasFieldError("companyName")}
                        helperText={getFieldError("companyName")}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label={formatLabel("ชื่อผู้มีอำนาจลงนาม")}
                        placeholder="ชื่อ - นามสกุล ผู้มีอำนาจลงนาม"
                        value={data.signatoryName || ""}
                        onChange={handleChange("signatoryName")}
                        error={hasFieldError("signatoryName")}
                        helperText={getFieldError("signatoryName")}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label={formatLabel("ที่อยู่บริษัท")}
                        placeholder="ที่อยู่บริษัท/องค์กรที่ติดต่อได้"
                        value={data.address || ""}
                        onChange={handleChange("address")}
                        error={hasFieldError("address")}
                        helperText={getFieldError("address")}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputPhone
                        label={formatLabel("หมายเลขโทรศัพท์")}
                        placeholder="หมายเลขโทรศัพท์"
                        value={data.phone || ""}
                        onChange={handleChange("phone")}
                        error={hasFieldError("phone")}
                        helperText={getFieldError("phone")}
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectFieldPAA
                        label={formatLabel("จังหวัด")}
                        value={data.province || ""}
                        onChange={(option) => onChange("province", option)}
                        error={hasFieldError("province")}
                        helperText={getFieldError("province")}
                        placeholder="เลือกจังหวัด"
                        formType={formType}
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectFieldPAA
                        label={formatLabel("อำเภอ/เขต")}
                        value={data.districts || ""}
                        provinceCode={data.province?.value}
                        onChange={(option) => onChange("districts", option)}
                        error={hasFieldError("districts")}
                        helperText={getFieldError("districts")}
                        placeholder="เลือกอำเภอ/เขต"
                        formType={formType}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <InputText
                        label={formatLabel("อีเมล")}
                        placeholder="อีเมล เช่น company@domain.com"
                        value={data.email || ""}
                        onChange={handleEmailChange}
                        error={hasFieldError("email")}
                        helperText={getFieldError("email") || "กรุณากรอกอีเมลให้ถูกรูปแบบ ภาษาอังกฤษเท่านั้น"}
                        type="email"
                        autoComplete="email"
                        inputProps={{
                            onKeyPress: handleEmailKeyPress,
                            onPaste: handleEmailPaste,
                            style: { fontFamily: 'Arial, sans-serif' }
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectFieldPAA
                        label={formatLabel("ตำบล/แขวง")}
                        value={data.subdistricts || ""}
                        amphureCode={data.districts?.value}
                        onChange={(option) => onChange("subdistricts", option)}
                        error={hasFieldError("subdistricts")}
                        helperText={getFieldError("subdistricts")}
                        placeholder="เลือกตำบล/แขวง"
                        formType={formType}
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <SelectFieldPAA
                        label={formatLabel("รหัสไปรษณีย์")}
                        value={data.zipcode || ""}
                        amphureCode={data.districts?.value}
                        onChange={(option) => onChange("zipcode", option)}
                        error={hasFieldError("zipcode")}
                        helperText={getFieldError("zipcode")}
                        placeholder="เลือกรหัสไปรษณีย์"
                        formType={formType}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ComplaintCustomerForm;