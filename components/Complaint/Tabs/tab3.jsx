import React, { useState, useEffect } from "react";
import { Box, Grid, Typography } from "@mui/material";
import styles from "./TabNav.module.scss";

import InputText from "@services/InputText/InputText";
import SelectFieldType from "@services/SelectFieldType/SelectFieldType";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import InputFile from "@services/InputFile/InputFile";
import InputTextarea from "@services/InputTextarea/InputTextarea";

import { GetAllSelectComplaintTypes } from "@pages/api/allselect/allselect";

const Tab3 = ({
  stepKey,
  tabData,
  updateStepData,
  validationErrors = {},
  shouldShowValidation = false
}) => {
  const [form, setForm] = useState({});
  const [complaintTypes, setComplaintTypes] = useState([]);

  /* ---------- handler ---------- */
  const handleChange = (field) => (valueOrEvent) => {
    let value = valueOrEvent?.target?.value ?? valueOrEvent;

    if (field === "complaintType") {
      const selectedType = complaintTypes.find((type) => type.value === value);
      value = selectedType?.label || value;
    }

    const updated = { ...form, [field]: value };
    setForm(updated);
    const updatedGeneral = { ...updated };

    if (updatedGeneral.complaintType && typeof updatedGeneral.complaintType === "string") {
      updatedGeneral.complaintType = updatedGeneral.complaintType;
    }

    updateStepData(stepKey, "general", updatedGeneral);
  };

  // Helper function to get field error
  const getFieldError = (fieldName) => {
    return shouldShowValidation ? validationErrors[fieldName] : "";
  };

  // Helper function to check if field has error
  const hasFieldError = (fieldName) => {
    return shouldShowValidation && !!getFieldError(fieldName);
  };

  /* ---------- mount ---------- */
  useEffect(() => {
    setForm(tabData || {});
  }, []);

  /* ---------- preset default channel ---------- */
  useEffect(() => {
    const defaultChannel = "เว็บไซต์แจ้งเรื่องราวร้องทุกข์";
    const initial = { channel: defaultChannel, ...(tabData || {}) };
    setForm(initial);
    updateStepData(stepKey, "general", initial);
  }, []);

  /* ---------- load complaint types ---------- */
  useEffect(() => {
    const fetchComplaintTypes = async () => {
      try {
        const response = await GetAllSelectComplaintTypes();
        if (response?.res_code === "0000") {
          const activeTypes = response.res_data
            .filter((t) => t.is_active)
            .map((t) => ({ value: t.id, label: t.name }));

          setComplaintTypes(activeTypes);
        } else {
          console.error("Fetch complaint types failed:", response?.res_message);
        }
      } catch (err) {
        console.error("Error fetching complaint types:", err);
      }
    };
    fetchComplaintTypes();
  }, []);

  /* ---------- render ---------- */
  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <Box>
          <Typography className={styles.title}>
            รายละเอียดเรื่องราวร้องทุกข์
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <InputText
                label="ช่องทางร้องทุกข์"
                value={form.channel || ""}
                name="channel"
                InputProps={{ readOnly: true }}
                error={hasFieldError("channel")}
                helperText={getFieldError("channel")}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <SelectFieldType
                label="ประเภทเรื่องราวร้องทุกข์"
                name="complaintType"
                value={form.complaintType || ""}
                options={complaintTypes}
                onChange={handleChange("complaintType")}
                error={hasFieldError("complaintType")}
                helperText={getFieldError("complaintType")}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <InputText
                label="ชื่อเรื่อง"
                name="subject"
                value={form.subject || ""}
                onChange={handleChange("subject")}
                error={hasFieldError("subject")}
                helperText={getFieldError("subject")}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <DateThaiPickerService
                label="วันและเวลาที่เกิดเหตุ"
                name="incidentDate"
                value={form.incidentDate || ""}
                onChange={handleChange("incidentDate")}
                error={hasFieldError("incidentDate")}
                helperText={getFieldError("incidentDate")}
                time={true}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <InputTextarea
                label="รายละเอียดเหตุการณ์"
                name="description"
                value={form.description || ""}
                onChange={handleChange("description")}
                error={hasFieldError("description")}
                helperText={getFieldError("description")}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <InputFile
                label="เอกสารประกอบการร้องเรียน"
                name="attachment"
                onChange={(file) => handleChange("attachment")(file)}
                error={hasFieldError("attachment")}
                helperText={getFieldError("attachment") || "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxFiles={3}
                maxSizeMB={10}
              />
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default Tab3;