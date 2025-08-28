import React, { useState, useCallback, useEffect } from "react";
import { Box, Grid, Typography } from "@mui/material";
import IDCardInput from "@services/IDCardInput/IDCardInput";
import InputText from "@services/InputText/InputText";
import InputPhone from "@services/InputPhone/InputPhone";
import SelectFieldPAA from "@services/SelectFieldPAA/SelectFieldPAA";
import styles from "./ComplaintPersonalForm.module.scss";
import { validateEmail, validateEmailRealtime } from "@utils/emailValidation";

const ComplaintPersonalForm = ({
  data = {},
  onChange,
  title = "ข้อมูลผู้ร้องทุกข์",
  validationErrors = {},
  shouldShowValidation = false,
  fieldPrefix = "",
  formType = "mandatory",
  dataMe = {},
  isLoadingAuthMe = false,
}) => {
  const [emailRealtimeError, setEmailRealtimeError] = useState("");
  const [lastEmailValue, setLastEmailValue] = useState("");
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);
  const [localData, setLocalData] = useState({});

  const currentData = {
    ...localData,
    ...data
  };

  useEffect(() => {
    const autoPopulateUserData = () => {
      if (hasAutoPopulated || !dataMe || Object.keys(dataMe).length === 0 || isLoadingAuthMe) {
        return;
      }

      try {
        setTimeout(() => {
          const newLocalData = {};

          // ตรวจสอบและใส่ข้อมูลที่มีค่า
          if (dataMe.citizen_id?.trim()) {
            newLocalData.idCard = dataMe.citizen_id;
            onChange("idCard", dataMe.citizen_id);
          }

          if (dataMe.email?.trim()) {
            newLocalData.email = dataMe.email;
            onChange("email", dataMe.email);
          }

          if (dataMe.phone?.trim()) {
            newLocalData.phone = dataMe.phone;
            onChange("phone", dataMe.phone);
          }

          if (dataMe.full_name?.trim()) {
            newLocalData.name = dataMe.full_name;
            onChange("name", dataMe.full_name);
          }

          setLocalData(newLocalData);
          setHasAutoPopulated(true);
        }, 100);

      } catch (error) {
        console.error("Error auto-populating user data:", error);
      }
    };

    autoPopulateUserData();
  }, [onChange, hasAutoPopulated, dataMe, isLoadingAuthMe]);


  // useEffect(() => {
  //   const autoPopulateUserData = () => {
  //     if (hasAutoPopulated || !dataMe || Object.keys(dataMe).length === 0) {
  //       return;
  //     }

  //     try {
  //       setTimeout(() => {
  //         const newLocalData = {};

  //         if (dataMe.citizen_id) {
  //           newLocalData.idCard = dataMe.citizen_id;
  //           onChange("idCard", dataMe.citizen_id);
  //         }

  //         if (dataMe.email) {
  //           newLocalData.email = dataMe.email;
  //           onChange("email", dataMe.email);
  //         }

  //         if (dataMe.phone) {
  //           newLocalData.phone = dataMe.phone;
  //           onChange("phone", dataMe.phone);
  //         }

  //         if (dataMe.full_name) {
  //           newLocalData.name = dataMe.full_name;
  //           onChange("name", dataMe.full_name);
  //         }

  //         setLocalData(newLocalData);
  //         setHasAutoPopulated(true);
  //       }, 0);

  //     } catch (error) {
  //       console.error("Error auto-populating user data:", error);
  //     }
  //   };

  //   autoPopulateUserData();
  // }, [onChange, hasAutoPopulated, dataMe]);

  const handleChange = useCallback(
    (field) => (value) => {
      let finalValue = value;

      if (typeof value === "object" && value?.target) {
        finalValue = value.target.value;
      }

      if (field === "email") {
        const thaiPattern = /[\u0E00-\u0E7F]/;
        if (thaiPattern.test(finalValue)) {
          setEmailRealtimeError(
            "อีเมลต้องเป็นภาษาอังกฤษเท่านั้น ไม่สามารถใช้ภาษาไทยได้"
          );
          return;
        }

        const realtimeError = validateEmailRealtime(finalValue);
        setEmailRealtimeError(realtimeError || "");
        setLastEmailValue(finalValue);
      }

      onChange(field, finalValue);
      setLocalData(prev => ({
        ...prev,
        [field]: finalValue
      }));
    },
    [onChange]
  );

  const handleEmailPaste = useCallback((event) => {
    const pastedText = event.clipboardData.getData("text");
    const thaiPattern = /[\u0E00-\u0E7F]/;

    if (thaiPattern.test(pastedText)) {
      event.preventDefault();
      setEmailRealtimeError(
        "อีเมลต้องเป็นภาษาอังกฤษเท่านั้น ไม่สามารถใช้ภาษาไทยได้"
      );
      return false;
    }

    setTimeout(() => {
      const realtimeError = validateEmailRealtime(pastedText);
      setEmailRealtimeError(realtimeError || "");
    }, 0);
  }, []);

  const handleEmailKeyPress = useCallback((event) => {
    const thaiPattern = /[\u0E00-\u0E7F]/;
    if (thaiPattern.test(event.key)) {
      event.preventDefault();
      setEmailRealtimeError(
        "อีเมลต้องเป็นภาษาอังกฤษเท่านั้น ไม่สามารถใช้ภาษาไทยได้"
      );
      return false;
    }
  }, []);

  useEffect(() => {
    if (currentData.email !== lastEmailValue) {
      setLastEmailValue(currentData.email || "");
      if (currentData.email) {
        const realtimeError = validateEmailRealtime(currentData.email);
        setEmailRealtimeError(realtimeError || "");
      } else {
        setEmailRealtimeError("");
      }
    }
  }, [currentData.email, lastEmailValue]);

  const getFieldError = useCallback(
    (fieldName) => {
      if (fieldName === "email") {
        if (emailRealtimeError) {
          return emailRealtimeError;
        }
      }

      const errorKey = fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
      const error = shouldShowValidation ? validationErrors[errorKey] : "";

      return error;
    },
    [shouldShowValidation, validationErrors, fieldPrefix, emailRealtimeError]
  );

  const hasFieldError = useCallback(
    (fieldName) => {
      if (fieldName === "email") {
        return (
          !!emailRealtimeError ||
          (shouldShowValidation && !!getFieldError(fieldName))
        );
      }

      return shouldShowValidation && !!getFieldError(fieldName);
    },
    [shouldShowValidation, getFieldError, emailRealtimeError]
  );

  const formatLabel = (baseLabel) => {
    return (
      <>
        {baseLabel}
        {formType === "mandatory" && (
          <span className={styles.requiredAsterisk}>*</span>
        )}
      </>
    );
  };

  const handleEmailChange = useCallback(
    (value) => {
      handleChange("email")(value);
    },
    [handleChange]
  );

  return (
    <Box className={styles.formContainer}>
      <Typography className={styles.title}>
        {title}
        {formType === "optional" && (
          <span className={styles.optionalText}></span>
        )}
        {isLoadingAuthMe && (
          <span className={styles.loadingText}> (กำลังโหลดข้อมูล...)</span>
        )}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <IDCardInput
            value={currentData.idCard || ""}
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
            value={currentData.name || ""}
            onChange={handleChange("name")}
            error={hasFieldError("name")}
            helperText={getFieldError("name")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <InputText
            label={formatLabel("ที่อยู่ที่สามารถติดต่อได้")}
            placeholder="ที่อยู่ที่สามารถติดต่อได้"
            value={currentData.address || ""}
            onChange={handleChange("address")}
            error={hasFieldError("address")}
            helperText={getFieldError("address")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <InputPhone
            label={formatLabel("หมายเลขโทรศัพท์")}
            placeholder="หมายเลขโทรศัพท์"
            value={currentData.phone || ""}
            onChange={handleChange("phone")}
            error={hasFieldError("phone")}
            helperText={getFieldError("phone")}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <SelectFieldPAA
            label={formatLabel("จังหวัด")}
            value={currentData.province || ""}
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
            value={currentData.districts || ""}
            provinceCode={currentData.province?.value}
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
            placeholder="อีเมล เช่น example@domain.com"
            value={currentData.email || ""}
            onChange={handleEmailChange}
            error={hasFieldError("email")}
            helperText={
              getFieldError("email") ||
              "กรุณากรอกอีเมลให้ถูกรูปแบบ ภาษาอังกฤษเท่านั้น"
            }
            type="email"
            autoComplete="email"
            inputProps={{
              onKeyPress: handleEmailKeyPress,
              onPaste: handleEmailPaste,
            }}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <SelectFieldPAA
            label={formatLabel("ตำบล/แขวง")}
            value={currentData.subdistricts || ""}
            amphureCode={currentData.districts?.value}
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
            value={currentData.zipcode || ""}
            amphureCode={currentData.districts?.value}
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