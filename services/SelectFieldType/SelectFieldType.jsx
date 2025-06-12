import React, { useEffect, useState } from "react";
import { MenuItem, TextField, FormControl, Typography } from "@mui/material";
import styles from "./SelectFieldTypeType.module.scss";

const SelectFieldType = ({
  label,
  inputLabel,
  name,
  value,
  onChange = () => { },
  options: externalOptions = [],
  optionMapper = null,
  required = false, // เพิ่ม prop required
  error = false,    // เพิ่ม prop error
  helperText = "",  // เพิ่ม prop helperText
  disabled = false, // เพิ่ม prop disabled
  ...props          // รองรับ props อื่นๆ
}) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const mapped = optionMapper
      ? externalOptions.map(optionMapper)
      : externalOptions;
    setOptions(mapped);
  }, [externalOptions, optionMapper]);

  const allOptions = [
    { value: "", label: label || inputLabel, disabled: true },
    ...options,
  ];

  const selectedValue =
    allOptions.find(opt => opt.label === value)?.value ?? "";

  const renderLabel = () => {
    if (!label) return null;

    return (
      <Typography
        variant="subtitle2"
        sx={{
          color: "#1120A3",
          fontWeight: 600,
          mb: 1,
          display: "block"
        }}
      >
        {label}
        {required && (
          <span style={{ color: "#f44336", marginLeft: "4px" }}>*</span>
        )}
      </Typography>
    );
  };

  return (
    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
      {renderLabel()}

      <TextField
        select
        displayEmpty
        name={name}
        value={selectedValue}
        disabled={disabled}
        error={error}
        onChange={(e) => {
          const picked = allOptions.find((opt) =>
            typeof opt === "object"
              ? opt.value === e.target.value
              : opt === e.target.value
          );
          onChange({ target: { name, value: picked?.label ?? e.target.value } });
        }}
        renderValue={(selected) => {
          const selOpt = allOptions.find((opt) =>
            typeof opt === "object"
              ? opt.value === selected
              : opt === selected
          );
          if (!selOpt || selOpt.value === "") {
            return (
              <span className={styles.selectPlaceholder}>
                {label || inputLabel}
              </span>
            );
          }
          return selOpt.label;
        }}
        InputProps={{
          sx: {
            height: "40px",
            borderRadius: "10px",
            color: "#1120A3",
            "& fieldset": {
              borderColor: error ? "#f44336" : "#1120A3"
            },
            "&:hover fieldset": {
              borderColor: error ? "#f44336" : "#1120A3"
            },
            "&.Mui-focused fieldset": {
              borderColor: error ? "#f44336" : "#1120A3"
            }
          },
        }}
        {...props} // ส่ง props อื่นๆ ต่อไป
      >
        {allOptions.map((opt, idx) => (
          <MenuItem
            key={idx}
            value={typeof opt === "object" ? opt.value : opt}
            disabled={typeof opt === "object" ? opt.disabled : false}
          >
            {typeof opt === "object" ? opt.label : opt}
          </MenuItem>
        ))}
      </TextField>

      {/* แสดง helper text (error message) */}
      {helperText && (
        <Typography
          variant="caption"
          sx={{
            color: error ? "#f44336" : "#666",
            mt: 0.5,
            fontSize: "12px",
            display: "block"
          }}
        >
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};

export default SelectFieldType;