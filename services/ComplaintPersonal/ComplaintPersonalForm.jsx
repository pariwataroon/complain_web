import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import IDCardInput from "@services/IDCardInput/IDCardInput";
import InputText from "@services/InputText/InputText";
import InputPhone from "@services/InputPhone/InputPhone";
import SelectFieldPAA from "@services/SelectFieldPAA/SelectFieldPAA";
import styles from "./ComplaintPersonalForm.module.scss";

const ComplaintPersonalForm = ({
    data = {},
    onChange,
    title = "ข้อมูลผู้ร้องทุกข์",
    validationErrors = {},
    shouldShowValidation = false,
    fieldPrefix = "",
    formType = "mandatory",
}) => {
    const handleChange = (field) => (value) => {
        let finalValue = value;

        if (typeof value === "object" && value?.target) {
            finalValue = value.target.value;
        }

        onChange(field, finalValue);
    };

    const getFieldError = (fieldName) => {
        const errorKey = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
        const error = shouldShowValidation ? validationErrors[errorKey] : "";

        // Debug สำหรับ ID Card
        // if (fieldName === 'idCard') {
        //     console.log('ID Card Debug:', {
        //         fieldName,
        //         errorKey,
        //         shouldShowValidation,
        //         validationErrors,
        //         error,
        //         currentValue: data.idCard,
        //         valueLength: data.idCard?.length
        //     });
        // }

        return error;
    };

    const hasFieldError = (fieldName) => {
        return shouldShowValidation && !!getFieldError(fieldName);
    };

    const formatLabel = (baseLabel) => {
        return (
            <>
                {baseLabel}{" "}
                {formType === "mandatory" && (
                    <span className={styles.requiredAsterisk}>*</span>
                )}
            </>
        );
    };

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
                        label={formatLabel("เลขบัตรประจำตัวประชาชน")}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <InputText
                        label={formatLabel("ชื่อ - นามสกุล")}
                        placeholder="ชื่อ - นามสกุล"
                        value={data.name}
                        onChange={handleChange("name")}
                        error={hasFieldError("name")}
                        helperText={getFieldError("name")}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <InputText
                        label={formatLabel("ที่อยู่ที่สามารถติดต่อได้")}
                        placeholder="ที่อยู่ที่สามารถติดต่อได้"
                        value={data.address}
                        onChange={handleChange("address")}
                        error={hasFieldError("address")}
                        helperText={getFieldError("address")}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <InputPhone
                        label={formatLabel("หมายเลขโทรศัพท์")}
                        placeholder="หมายเลขโทรศัพท์"
                        value={data.phone}
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
                        placeholder="อีเมล"
                        value={data.email}
                        onChange={handleChange("email")}
                        error={hasFieldError("email")}
                        helperText={getFieldError("email")}
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

export default ComplaintPersonalForm;