import React from "react";
import { TextField, Typography, FormControl } from "@mui/material";

const InputTextarea = ({
    label,
    value,
    onChange,
    name,
    required = false,
    error = false, 
    helperText = "",
    disabled = false,
    placeholder = "",
    minRows = 5,
    maxRows,
    ...props
}) => {
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
                fullWidth
                multiline
                minRows={minRows}
                maxRows={maxRows}
                value={value}
                name={name}
                onChange={onChange}
                variant="outlined"
                disabled={disabled}
                error={error}
                placeholder={placeholder}
                InputProps={{
                    sx: {
                        borderRadius: "16px",
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
                        "& .MuiInputBase-input": {
                            color: disabled ? "#999" : "#1120A3",
                        },
                        "& .MuiInputBase-input::placeholder": {
                            color: "#999",
                            opacity: 1,
                        },
                    },
                }}
                {...props}
            />

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

export default InputTextarea;