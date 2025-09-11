import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  FormControl,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Box,
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
  onChange = () => {},
  name,
  districtCode,
  amphureCode,
  provinceCode,
  zipcodeCode,
  options: externalOptions = [],
  optionMapper = null,
  loading: externalLoading = false,
  ...props
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(externalLoading);
  const [inputText, setInputText] = useState("");

  // กรอง externalOptions ให้แน่ใจว่าไม่มี invalid objects
  const validOptions = options.filter((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return opt.value !== undefined && opt.label !== undefined;
    }
    return typeof opt === "string" || typeof opt === "number";
  });

  const allOptions = [...validOptions];

  // ค้นหาแบบ real-time
  const filterOptions = (opts, params) => {
    const filterVal = params.inputValue.trim().toLowerCase();
    if (!filterVal) return opts;
    return opts.filter(opt =>
      opt.label && String(opt.label).toLowerCase().includes(filterVal)
    );
  };

  // หา option จาก value (รองรับ object หรือ string)
  const getOptionFromValue = (val) => {
    if (!val) return null;
    if (typeof val === "object" && val.value) return val;
    return allOptions.find((opt) => String(opt.value) === String(val)) || null;
  };

  // จัดการ selectedValue
  const selectedValue = (() => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object" && value !== null) {
      return value.value || "";
    }
    return String(value);
  })();

  // ตรวจสอบว่ามีค่าที่เลือกหรือไม่ (สำหรับแสดงปุ่มลบ)
  const hasValue = !!getOptionFromValue(value) || inputText.length > 0;

  // ฟังก์ชันลบค่า
  const handleClear = () => {
    setInputText("");
    onChange({
      target: {
        name,
        value: "",
      },
    });
  };

  // handle select
  const handleAutoChange = (event, newValue) => {
    let actualValue = "";
    if (newValue && typeof newValue === "object") {
      actualValue = newValue.value || "";
    }
    setInputText(newValue?.label || "");
    onChange({
      target: {
        name,
        value: actualValue,
      },
    });
  };

  // handle input change
  const handleInputChange = (event, newInputValue, reason) => {
    if (reason === "clear") {
      setInputText("");
    } else {
      setInputText(newInputValue);
    }
  };

  // Effect 1: Use provided external options
  useEffect(() => {
    if (!(externalOptions && externalOptions.length > 0)) return;
    setLoading(false);
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
    if (
      (label === "อำเภอ/เขต" && !provinceCode) ||
      (label === "ตำบล/แขวง" && !amphureCode) ||
      (label === "รหัสไปรษณีย์" && !amphureCode)
    ) {
      return;
    }
    const fetchOptions = async () => {
      try {
        setLoading(true);
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
        setOptions([]);
      } finally {
        setLoading(false);
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

  // เงื่อนไข placeholder
  const showPlaceholderCenter = !inputText && !getOptionFromValue(value);

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

      <Autocomplete
        options={allOptions}
        loading={loading}
        filterOptions={filterOptions}
        getOptionLabel={option =>
          typeof option === "string" ? option : option.label || option.value || ""
        }
        value={getOptionFromValue(value)}
        inputValue={inputText}
        onInputChange={handleInputChange}
        onChange={handleAutoChange}
        isOptionEqualToValue={(option, v) => String(option.value) === String(v.value || v)}
        disableClearable
        noOptionsText={
          loading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#666666",
                fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                px: 2,
                py: 1,
              }}
            >
              <CircularProgress size={16} />
              กำลังโหลดข้อมูล...
            </Box>
          ) : (
            <Box
              sx={{
                color: "#666666",
                fontStyle: "italic",
                textAlign: "center",
                width: "100%",
                py: 2,
                fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                ไม่พบรายการ
              </Typography>
              <Typography variant="caption" sx={{ color: "#999999" }}>
                กรุณาติดต่อผู้ดูแลระบบหากเกิดปัญหา
              </Typography>
            </Box>
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label=""
            name={name}
            variant="outlined"
            autoComplete="off"
            InputProps={{
              ...params.InputProps,
              sx: {
                height: "40px",
                borderRadius: "10px",
                color: "#1120A3",
                "& fieldset": {
                  borderColor: "#1120A3",
                },
              },
              endAdornment: (
                <>
                  {params.InputProps.endAdornment}
                  {loading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} sx={{ color: "#1120A3", ml: 1 }} />
                    </InputAdornment>
                  ) : null}
                  {hasValue && (
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
                  )}
                </>
              ),
            }}
            inputProps={{
              ...params.inputProps,
              style: showPlaceholderCenter
                ? {
                    textAlign: "left",
                    fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                  }
                : {
                    fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                  },
            }}
            placeholder={
              showPlaceholderCenter
                ? inputLabel
                : ""
            }
          />
        )}
        {...props}
      />
    </FormControl>
  );
};

export default SelectField;