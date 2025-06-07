import React, { useEffect, useState } from "react";
import {
  MenuItem,
  TextField,
  FormControl,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  GetProvincesSelect,
  GetAmphuresSelect,
  GetDistrictsSelect,
  GetZipcodeSelect,
} from "@pages/api/allselect/allselect";
import styles from "./SelectField.module.scss";

const SelectField = ({
  label,
  inputLabel,
  value,
  onChange = () => { },
  name,
  districtCode,
  amphureCode,
  provinceCode,
  zipcodeCode,
  options: externalOptions = [],
  optionMapper = null,
  placeholder,
  error = false,
  helperText = "",
  required = false,
  disabled = false,
  fullWidth = true,
  variant = "outlined",
  size = "medium",
  ...otherProps
}) => {
  const [options, setOptions] = useState([]);

  // แก้ไข: กรอง externalOptions ให้แน่ใจว่าไม่มี invalid objects
  const validOptions = options.filter((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return opt.value !== undefined && opt.label !== undefined;
    }
    return typeof opt === "string" || typeof opt === "number";
  });

  // แก้ไข: เอา placeholder option สีเทาออก - ใช้เฉพาะ validOptions
  const allOptions = [...validOptions];

  // แก้ไขการจัดการ selectedValue
  const selectedValue = (() => {
    if (value === null || value === undefined) return "";

    // ถ้า value เป็น object ให้ใช้ value.value
    if (typeof value === "object" && value !== null) {
      return value.value || "";
    }

    // ถ้า value เป็น string ให้ใช้เลย
    return String(value);
  })();

  // ตรวจสอบว่ามีค่าที่เลือกหรือไม่ (สำหรับแสดงปุ่มลบ)
  const hasValue = selectedValue && selectedValue !== "";

  // ฟังก์ชันลบค่า
  const handleClear = (e) => {
    e.stopPropagation(); // ป้องกันไม่ให้เปิด dropdown
    onChange({
      target: {
        name,
        value: "",
      },
    });
  };

  useEffect(() => {
    const fetchOptions = async () => {
      // ถ้ามี external options ให้ใช้เลย ไม่ต้อง fetch
      if (externalOptions && externalOptions.length > 0) {
        // แก้ไข: ตรวจสอบและทำความสะอาด externalOptions
        const cleanedOptions = externalOptions
          .filter((opt) => {
            // กรองเฉพาะ options ที่ valid
            if (typeof opt === "object" && opt !== null) {
              return opt.value !== undefined && opt.label !== undefined;
            }
            return typeof opt === "string" || typeof opt === "number";
          })
          .map((opt) => {
            // แปลงให้เป็น format ที่ถูกต้อง
            if (typeof opt === "object" && opt !== null) {
              return {
                value: String(opt.value || ""),
                label: String(opt.label || ""),
              };
            }
            return {
              value: String(opt),
              label: String(opt),
            };
          });

        const mapped = optionMapper
          ? cleanedOptions.map(optionMapper)
          : cleanedOptions;

        setOptions(mapped);
        return;
      }

      // เงื่อนไขสำหรับ location fields
      if (
        (label === "อำเภอ/เขต" && !provinceCode) ||
        (label === "ตำบล/แขวง" && !amphureCode) ||
        (label === "รหัสไปรษณีย์" && !amphureCode)
      ) {
        return;
      }

      try {
        let response = null;

        if (labelText === "อำเภอ/เขต" && provinceCode) {
          response = await GetAmphuresSelect(provinceCode);
        } else if (labelText === "ตำบล/แขวง" && amphureCode) {
          response = await GetDistrictsSelect(amphureCode);
        } else if (labelText === "รหัสไปรษณีย์" && amphureCode) {

          const districts = await GetDistrictsSelect(amphureCode);

          const zipMap = new Map();
          districts.forEach((item) => {
            const zipValue = item.zip_code || item.zipcode || item.postal_code || item.postcode;

            if (zipValue && !zipMap.has(zipValue)) {
              zipMap.set(zipValue, {
                value: zipValue,
                label: zipValue,
                id: item.id,
                district_code: item.district_code,
                name_th: item.name_th,
                name_en: item.name_en
              });
            }
          });

          response = Array.from(zipMap.values());
        }

        const finalResponse = Array.isArray(response) ? response : [];
        const mapped = finalResponse.map(item => {
          if (typeof item === 'object' && item !== null) {
            if (labelText === "รหัสไปรษณีย์" && item.value && item.label) {
              return {
                value: item.value,
                label: item.label
              };
            }

            return {
              value: item.value || item.id || item.code || item.province_code || item.amphure_code || item.district_code,
              label: item.label || item.name || item.title || item.name_th || String(item)
            };
          }
          return { value: item, label: String(item) };
        });

        setOptions(mapped);
      } catch (error) {
        console.error(`❌ Failed to fetch options for ${labelText}:`, error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [
    label,
    externalOptions,
    optionMapper,
    districtCode,
    amphureCode,
    provinceCode,
  ]);

  const handleChange = (event) => {
    const selectedOptionValue = event.target.value;

    

    const selectedOption = allOptions.find((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return opt.value === selectedOptionValue;
      }
      return opt === selectedOptionValue;
    });


    if (selectedOption && selectedOption.value !== "") {
      onChange(selectedOption);
    } else {
      onChange("");
    }
  };

  const renderValue = (selected) => {
    const selectedOption = allOptions.find((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return opt.value === selected;
      }
      return opt === selected;
    });

    if (!selectedOption || selectedOption.value === "") {
      return (
        <span className={styles.selectPlaceholder}>
          {placeholderText}
        </span>
      );
    }

    return selectedOption.label;
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      variant={variant}
      error={error}
      disabled={isFieldDisabled}
      sx={{ mb: 2 }}
      className={styles.selectFormControl}
    >
      {label && (
        <Typography
          variant="subtitle2"
          className={styles.selectLabel}
          sx={{
            color: error ? "#ef4444" : "#334155",
            fontWeight: 600,
            mb: 1,
            opacity: isFieldDisabled ? 0.6 : 1
          }}
        >
          {label}
          {required && !isFieldDisabled && (
            <span className={styles.requiredAsterisk}> *</span>
          )}
        </Typography>
      )}

      <TextField
        select
        displayEmpty
        name={name}
        value={selectedValue}
        onChange={(e) => {
          const selectedVal = e.target.value;

          // ส่งค่าเป็น string ไม่ใช่ object
          onChange({
            target: {
              name,
              value: selectedVal, // ส่งเป็น string value ตรงๆ
            },
          });
        }}
        renderValue={(selected) => {
          // หา option ที่ตรงกับ selected value
          const selectedOption = allOptions.find((opt) => {
            const optValue = typeof opt === "object" ? opt.value : opt;
            return optValue === selected;
          });

          // แก้ไข: ถ้าไม่เจอหรือเป็นค่าว่าง แสดง placeholder
          if (!selectedOption || selected === "") {
            return (
              <span className={styles.selectPlaceholder}>
                {label || inputLabel}
              </span>
            );
          }

          // แสดง label ของ option ที่เลือก
          return selectedOption.label || String(selectedOption);
        }}
        InputProps={{
          sx: {
            height: "40px",
            borderRadius: "10px",
            color: "#1120A3",
            "& fieldset": {
              borderColor: "#1120A3",
            },
          },
          endAdornment: hasValue && (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClear}
                edge="end"
                size="small"
                sx={{
                  color: "#999",
                  "&:hover": {
                    color: "#666",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                  mr: 1,
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      >
        {allOptions.map((opt, idx) => {
          const isPrimitive = typeof opt !== "object";
          const optionValue = isPrimitive
            ? String(opt)
            : String(opt.value || "");
          const optionLabel = isPrimitive
            ? String(opt)
            : String(opt.label || opt.value || "");
          const isDisabled = isPrimitive ? false : opt.disabled ?? false;

          // แก้ไข: ไม่แสดง option ที่เป็น "[object Object]"
          if (
            optionLabel === "[object Object]" ||
            optionValue === "[object Object]"
          ) {
            return null;
          }

          return (
            <MenuItem key={idx} value={optionValue} disabled={isDisabled}>
              {optionLabel}
            </MenuItem>
          );
        })}
      </TextField>
    </FormControl>
  );
};

export default SelectField;