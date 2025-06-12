import React from "react";
import { TextField, FormControl, Typography } from "@mui/material";

const InputText = ({
  label,
  inputLabel,
  value,
  onChange,
  name,
  disabled,
  InputProps = {},
  multiline,
  rows,
  required = false, // เพิ่ม prop required
  error = false,    // เพิ่ม prop error
  helperText = "",  // เพิ่ม prop helperText
  ...props
}) => {
  const isReadOnly = InputProps?.readOnly;
  const isMultiline = multiline || rows > 1;

  // สร้าง label แบบ custom ที่มี * สีแดง
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
      {/* แสดง label แบบ custom แทน label เดิม */}
      {renderLabel()}

      <TextField
        fullWidth
        variant="outlined"
        value={value}
        name={name}
        label={!label ? inputLabel : undefined}
        onChange={onChange}
        disabled={disabled}
        multiline={isMultiline}
        rows={rows}
        error={error} // เพิ่ม error prop
        InputProps={{
          ...InputProps,
          sx: {
            ...(isMultiline ? {} : { height: "40px" }),
            borderRadius: "10px",
            backgroundColor: disabled ? "#E8E9F6" : "white",
            color: "#1120A3",
            "& fieldset": {
              borderColor: error ? "#f44336" : "#1120A3",
            },
            "&:hover fieldset": {
              borderColor: error ? "#f44336" : "#1120A3",
            },
            "&.Mui-focused fieldset": {
              borderColor: error ? "#f44336" : "#1120A3",
            },
            ...(isReadOnly && {
              backgroundColor: "#f5f5f5",
              cursor: "not-allowed",
              "& input": {
                color: "#999",
              },
              "& textarea": {
                color: "#999",
              },
            }),
            ...(isMultiline && {
              "& .MuiInputBase-input": {},
            }),
            ...InputProps.sx,
          },
        }}
        {...props}
      />

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

export default InputText;