import React, { useState, useEffect } from "react";
import { Box, Grid, Typography } from "@mui/material";
import styles from "./TabNav.module.scss";
import InputText from "@services/InputText/InputText";
import SelectField from "@services/SelectField/SelectField";
import InputDate from "@services/InputDate/InputDate";
import InputFile from "@services/InputFile/InputFile";
import InputTextarea from "@services/InputTextarea/InputTextarea";

const Tab3 = ({ stepKey, tabData, updateStepData }) => {
  const [form, setForm] = useState({});

  

  const handleChange = (field) => (valueOrEvent) => {
    const value = valueOrEvent?.target?.value ?? valueOrEvent;
    const updated = { ...form, [field]: value };
    setForm(updated);
    updateStepData(stepKey, "general", updated);
  };

  useEffect(() => {
    setForm(tabData || {});
  }, []);

  useEffect(() => {
    const defaultChannel = "เว็บไซต์แจ้งเรื่องราวร้องทุกข์";
    const initial = {
      channel: defaultChannel,
      ...(tabData || {}),
    };
    setForm(initial);
    updateStepData(stepKey, "general", initial);
  }, []);


  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <Box>
          <Typography className={styles.title}>รายละเอียดเรื่องราวร้องทุกข์</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <InputText
                label="ช่องทางร้องทุกข์"
                value={form.channel || ""}
                name="channel"
                InputProps={{ readOnly: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SelectField
                label="ประเภทเรื่องราวร้องทุกข์"
                value={form.complaintType || ""}
                name="complaintType"
                options={["การทุจริต", "บริการไม่เหมาะสม", "อื่นๆ"]}
                onChange={handleChange("complaintType")}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <InputText
                label="ชื่อเรื่อง"
                name="subject"
                value={form.subject || ""}
                onChange={handleChange("subject")}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <InputDate
                label="วันและเวลาที่เกิดเหตุ"
                name="incidentDate"
                value={form.incidentDate || ""}
                onChange={handleChange("incidentDate")}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <InputTextarea
                label="รายละเอียดเหตุการณ์"
                name="description"
                value={form.description || ""}
                onChange={handleChange("description")}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <InputFile
                label="เอกสารประกอบการร้องเรียน"
                name="attachment"
                onChange={(file) => handleChange("attachment")(file)}
                helperText="หมายเหตุ : หลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล และไม่เกิน 10 MB"
                accept=".pdf, .doc, .docx, .jpg, .jpeg, .png"
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
