import React, { useEffect, useState } from "react";
import {
  MenuItem,
  TextField,
  FormControl,
  Typography,
  FormHelperText,
} from "@mui/material";
import { GetProvincesSelect, GetAmphuresSelect, GetDistrictsSelect, GetZipcodeSelect } from "@pages/api/allselect/allselect";
import styles from "./SelectFieldPAA.module.scss";

const SelectFieldPAA = ({
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
  const [loading, setLoading] = useState(false);

  const getLabelText = (label) => {
    if (typeof label === 'string') {
      return label;
    }
    if (label && label.props && label.props.children) {
      if (Array.isArray(label.props.children)) {
        return label.props.children[0] || '';
      }
      return label.props.children;
    }
    return '';
  };

  const labelText = getLabelText(label);

  const placeholderText = placeholder || labelText || inputLabel || "เลือก...";

  const allOptions = [
    { value: "", label: placeholderText, disabled: true },
    ...options,
  ];

  const selectedValue = (typeof value === "object" && value !== null)
    ? (value?.value ?? "")
    : (value ?? "");

  const isFieldDisabled = disabled || loading || (
    (labelText === "อำเภอ/เขต" && !provinceCode) ||
    (labelText === "ตำบล/แขวง" && !amphureCode) ||
    (labelText === "รหัสไปรษณีย์" && !amphureCode)
  );

  useEffect(() => {
    if (labelText === "จังหวัด") {
      const loadProvinces = async () => {
        setLoading(true);
        try {
          const response = await GetProvincesSelect();

          const finalResponse = Array.isArray(response) ? response : [];
          const mapped = finalResponse.map(item => {
            if (typeof item === 'object' && item !== null) {
              return {
                value: item.value || item.id || item.code || item.province_code || item.amphure_code || item.district_code,
                label: item.label || item.name || item.title || item.name_th || String(item)
              };
            }
            return { value: item, label: String(item) };
          });

          setOptions(mapped);
        } catch (error) {
          console.error("❌ Failed to load provinces:", error);
          setOptions([]);
        } finally {
          setLoading(false);
        }
      };

      loadProvinces();
    }
  }, [labelText]);

  useEffect(() => {

    if (labelText === "จังหวัด") {
      return;
    }

    const fetchOptions = async () => {
      if (
        (labelText === "อำเภอ/เขต" && !provinceCode) ||
        (labelText === "ตำบล/แขวง" && !amphureCode) ||
        (labelText === "รหัสไปรษณีย์" && !amphureCode)
      ) {
        setOptions([]);
        return;
      }

      if (externalOptions && externalOptions.length > 0) {
        const mapped = optionMapper
          ? externalOptions.map(optionMapper)
          : externalOptions;
        setOptions(mapped);
        return;
      }

      if (!["อำเภอ/เขต", "ตำบล/แขวง", "รหัสไปรษณีย์"].includes(labelText)) {
        setOptions([]);
        return;
      }

      setLoading(true);
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

            if (item.zip_code && !zipMap.has(item.zip_code)) {
              zipMap.set(item.zip_code, {
                value: item.zip_code,
                label: item.zip_code,
                originalData: item 
              });
            }
          });

          response = Array.from(zipMap.values());
        }

        const finalResponse = Array.isArray(response) ? response : [];
        const mapped = finalResponse.map(item => {
          if (typeof item === 'object' && item !== null) {
            if (labelText === "รหัสไปรษณีย์") {
              if (item.value && item.label) {
                return {
                  value: item.value,
                  label: item.label
                };
              }
              const zipValue = item.zip_code || item.zipcode || item.postal_code;
              if (zipValue) {
                return {
                  value: zipValue,
                  label: zipValue
                };
              }
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
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [labelText, provinceCode, amphureCode, externalOptions.length]);

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
        onChange={handleChange}
        disabled={isFieldDisabled}
        error={error}
        size={size}
        placeholder={placeholderText}
        renderValue={renderValue}
        SelectProps={{
          displayEmpty: true,
          ...otherProps.SelectProps,
        }}
        InputProps={{
          sx: {
            height: "56px",
            borderRadius: "12px",
            color: "#000000",
            backgroundColor: isFieldDisabled ? "#f8fafc" : "transparent",
            "& fieldset": {
              borderColor: error ? "#ef4444" : "#d1d5db",
              borderWidth: error ? "2px" : "1px",
            },
            "&:hover fieldset": {
              borderColor: error ? "#dc2626" : "#7dd3fc",
            },
            "&.Mui-focused fieldset": {
              borderColor: error ? "#ef4444" : "#0ea5e9",
              borderWidth: "2px",
              boxShadow: error
                ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
                : "0 0 0 3px rgba(14, 165, 233, 0.1)",
            },
            "& .MuiSelect-icon": {
              color: error ? "#ef4444" : "#64748b",
            },
          },
          ...otherProps.InputProps,
        }}
        {...otherProps}
      >
        {allOptions.map((opt, idx) => {
          const isPrimitive = typeof opt !== "object" || opt === null;
          const optionValue = isPrimitive ? opt : opt.value;
          const optionLabel = isPrimitive ? String(opt) : String(opt.label);
          const isDisabled = isPrimitive ? false : opt.disabled ?? false;

          return (
            <MenuItem
              key={`${optionValue}-${idx}`}
              value={optionValue}
              disabled={isDisabled}
              className={styles.selectMenuItem}
              sx={{
                color: isDisabled ? "#94a3b8" : "#000000",
                fontStyle: isDisabled ? "italic" : "normal",
                "&:hover": {
                  backgroundColor: isDisabled ? "transparent" : "#f1f5f9",
                },
                "&.Mui-selected": {
                  backgroundColor: "#e0f2fe",
                  color: "#0891b2",
                  "&:hover": {
                    backgroundColor: "#bae6fd",
                  },
                },
              }}
            >
              {optionLabel}
            </MenuItem>
          );
        })}
      </TextField>

      {helperText && (
        <FormHelperText
          error={error}
          className={styles.selectHelperText}
          sx={{
            marginLeft: "6px",
            marginTop: "8px",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            "&.Mui-error": {
              color: "#ef4444",
              fontWeight: 500,
              "&::before": {
                content: "'⚠'",
                marginRight: "6px",
                fontSize: "1rem",
              },
            },
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default SelectFieldPAA;