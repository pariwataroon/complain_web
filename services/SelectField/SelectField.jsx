import React, { useEffect, useState } from "react";
import {
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
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

  // Effect 1: Use provided external options (no dependency on label to avoid JSX identity churn)
  useEffect(() => {
    if (!(externalOptions && externalOptions.length > 0)) return;

    const cleanedOptions = externalOptions
      .filter((opt) => {
        if (typeof opt === "object" && opt !== null) {
          return opt.value !== undefined && opt.label !== undefined;
        }
        return typeof opt === "string" || typeof opt === "number";
      })
      .map((opt) => {
        if (typeof opt === "object" && opt !== null) {
          return {
            value: String(opt.value || ""),
            label: String(opt.label || ""),
          };
        }
        return { value: String(opt), label: String(opt) };
      });

    const mapped = optionMapper ? cleanedOptions.map(optionMapper) : cleanedOptions;
    setOptions(mapped);
  }, [externalOptions, optionMapper]);

  // Effect 2: Fetch options only when no external options are provided
  useEffect(() => {
    if (externalOptions && externalOptions.length > 0) return;

    // เงื่อนไขสำหรับ location fields
    if (
      (label === "อำเภอ/เขต" && !provinceCode) ||
      (label === "ตำบล/แขวง" && !amphureCode) ||
      (label === "รหัสไปรษณีย์" && !amphureCode)
    ) {
      return;
    }

    const fetchOptions = async () => {
      try {
        let response = null;

        if (label === "จังหวัด") {
          response = await GetProvincesSelect();
        } else if (label === "อำเภอ/เขต") {
          response = await GetAmphuresSelect(provinceCode);
        } else if (label === "ตำบล/แขวง") {
          response = await GetDistrictsSelect(amphureCode);
        } else if (label === "รหัสไปรษณีย์") {
          const districts = await GetDistrictsSelect(amphureCode);
          const zipMap = new Map();
          districts.forEach((item) => {
            if (item.zip_code && !zipMap.has(item.zip_code)) {
              zipMap.set(item.zip_code, item);
            }
          });
          response = Array.from(zipMap.values());
        }

        const finalResponse = Array.isArray(response) ? response : [];
        const mapped = optionMapper ? finalResponse.map(optionMapper) : finalResponse;
        setOptions(mapped);
      } catch (error) {
        console.error("Failed to fetch or map options:")
        setOptions([]);
      }
    };

    fetchOptions();
  }, [externalOptions, optionMapper, label, districtCode, amphureCode, provinceCode]);

  useEffect(() => {
    if (!provinceCode) return;

    if (
      label === "อำเภอ/เขต" ||
      label === "ตำบล/แขวง" ||
      label === "รหัสไปรษณีย์"
    ) {
      onChange({ target: { name, value: "" } });
    }
  }, [provinceCode]);

  useEffect(() => {
    if (!amphureCode) return;

    if (label === "ตำบล/แขวง" || label === "รหัสไปรษณีย์") {
      onChange({ target: { name, value: "" } });
    }
  }, [amphureCode]);

  return (
    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
      {label && (
        <Typography
          variant="subtitle2"
          sx={{ color: "#1120A3", fontWeight: 600, mb: 1 }}
        >
          {label}
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
