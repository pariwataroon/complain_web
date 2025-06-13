import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const lastSyncRef = useRef(null);
  const updateCountRef = useRef(0);

  /* ---------- Helper Functions ---------- */

  const forceSyncToParent = useCallback((data, source = "unknown") => {
    updateCountRef.current += 1;
    const dataString = JSON.stringify(data);

    if (lastSyncRef.current !== dataString) {
      lastSyncRef.current = dataString;

      try {
        updateStepData(stepKey, "general", data);
      } catch (error) {
        console.error("=== SYNC ERROR ===", {
          source,
          error,
          data
        });
      }
    }
  }, [stepKey, updateStepData]);

  /* ---------- Event Handlers ---------- */

  const handleChange = (field) => (valueOrEvent) => {
    let value = valueOrEvent?.target?.value ?? valueOrEvent;

    if (field === "complaintType") {
      const selectedType = complaintTypes.find((type) => type.value === value);
      value = selectedType?.label || value;
    }

    setForm(currentForm => {
      const updated = { ...currentForm, [field]: value };
      // **แก้ไข: Sync ทันทีใน setState**
      setTimeout(() => forceSyncToParent(updated, `handleChange-${field}`), 0);
      return updated;
    });
  };

  const handleDateChange = useCallback((isoString) => {
    let processedValue = isoString;
    if (!isoString) {
      processedValue = new Date().toISOString();
    }

    setForm(currentForm => {
      const updated = {
        ...currentForm,
        incidentDate: processedValue
      };

      setTimeout(() => forceSyncToParent(updated, "handleDateChange"), 0);
      return updated;
    });

  }, [forceSyncToParent]);

  const handleFileChange = useCallback((files) => {
   

    let processedFiles = null;

    if (files) {
      if (Array.isArray(files)) {
       
        const validFiles = files.filter(file =>
          file && typeof file === 'object' && (file.name || file.size)
        );

        if (validFiles.length > 0) {
          processedFiles = validFiles.slice(0, 3);
          
        }
      } else if (typeof files === 'object' && files !== null && (files.name || files.size)) {
        
      } else {
        console.warn("=== Invalid File Format ===", {
          files,
          type: typeof files,
          isObject: typeof files === 'object',
          isNull: files === null,
          hasName: !!files?.name,
          hasSize: !!files?.size
        });
      }
    } else {
    }


    setForm(currentForm => {
      const updated = { ...currentForm, attachment: processedFiles };

      setTimeout(() => {
        forceSyncToParent(updated, "handleFileChange");
      }, 0);

      return updated;
    });

  }, [forceSyncToParent, stepKey, form.attachment]);

  const getFieldError = (fieldName) => {
    return shouldShowValidation ? validationErrors[fieldName] : "";
  };

  const hasFieldError = (fieldName) => {
    return shouldShowValidation && !!getFieldError(fieldName);
  };

  /* ---------- useEffects ---------- */

  useEffect(() => {
    if (!initializationRef.current) {
      const defaultChannel = "เว็บไซต์แจ้งเรื่องราวร้องทุกข์";
      const initialData = { channel: defaultChannel, ...(tabData || {}) };

      setForm(initialData);
      setIsInitialized(true);
      initializationRef.current = true;
      forceSyncToParent(initialData, "initialization");
    }
  }, [forceSyncToParent, tabData]);

  useEffect(() => {
    if (isInitialized && tabData && Object.keys(tabData).length > 0) {
      setForm(currentForm => {
        const merged = { ...tabData };

        Object.keys(currentForm).forEach(key => {
          if (currentForm[key] !== null && currentForm[key] !== undefined) {
            if (typeof currentForm[key] === 'string' && currentForm[key] !== "") {
              merged[key] = currentForm[key];
            } else if (typeof currentForm[key] !== 'string') {
              merged[key] = currentForm[key];
            }
          }
        });

        const hasChanges = JSON.stringify(currentForm) !== JSON.stringify(merged);

        if (hasChanges) {
          setTimeout(() => forceSyncToParent(merged, "tabDataUpdate"), 0);
        }

        return hasChanges ? merged : currentForm;
      });
    }
  }, [tabData, isInitialized, forceSyncToParent]);

 

  useEffect(() => {
    const fetchComplaintTypes = async () => {
      try {
        const response = await GetAllSelectComplaintTypes();
        if (response?.res_code === "0000") {
          const activeTypes = response.res_data
            .filter((t) => t.is_active)
            .map((t) => ({ value: t.id, label: t.name }));
          setComplaintTypes(activeTypes);
        }
      } catch (err) {
        console.error("Error fetching complaint types:", err);
      }
    };
    fetchComplaintTypes();
  }, []);

  useEffect(() => {
    let isChecking = false;

    const checkDatePickerValue = () => {
      if (isChecking) return; 

      const dateInput = document.querySelector(`input[name="incidentDate"]`);
      if (dateInput && dateInput.value) {
        const displayValue = dateInput.value;

        if (displayValue && !form.incidentDate) {
          isChecking = true; 

          const fallbackDate = new Date().toISOString();

          setTimeout(() => {
            handleDateChange(fallbackDate);
            isChecking = false;
          }, 100);
        }
      }
    };

    const interval = setInterval(checkDatePickerValue, 3000);
    return () => clearInterval(interval);
  }, [form.incidentDate, handleDateChange]);

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
                onChange={handleDateChange}
                error={hasFieldError("incidentDate")}
                helperText={getFieldError("incidentDate")}
                time={true}
                required={true}
                placeholder="กรุณาเลือกวันที่และเวลา"
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
                required={true}
                placeholder="กรุณากรอกรายละเอียดเหตุการณ์..."
                minRows={4}
              />
            </Grid>

            <Grid item xs={12}>
              <InputFile
                label="เอกสารประกอบการร้องเรียน"
                name="attachment"
                onChange={(files) => {
                  handleFileChange(files);
                }}
                error={hasFieldError("attachment")}
                helperText={getFieldError("attachment") || "หมายเหตุ : แนบหลักฐาน เช่น สัญญา รูปภาพ หรือ หมายศาล รองรับไฟล์ .pdf .doc .docx .jpg .jpeg .png และไม่เกิน 10 MB"}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxFiles={3}
                maxSizeMB={10}
                required
              />
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default Tab3;