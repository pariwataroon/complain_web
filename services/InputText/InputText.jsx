import React from "react";
import { TextField, InputLabel, FormControl, Typography } from "@mui/material";
import FormLabel from "@services/FormLabel/FormLabel";

const InputText = ({
    label,           // แบบด้านนอก
    inputLabel,      // แบบใน TextField
    value,
    onChange,
    name,
    disabled,
    InputProps = {},
    ...props
}) => {
    const isReadOnly = InputProps?.readOnly;

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
                fullWidth
                variant="outlined"
                value={value}
                name={name}
                label={!label ? inputLabel : undefined}
                onChange={onChange}
                disabled={disabled}
                InputProps={{
                    ...InputProps,
                    sx: {
                        height: "40px",
                        borderRadius: "10px",
                        backgroundColor: disabled ? "#E8E9F6" : "white",
                        color: "#1120A3",
                        "& fieldset": {
                            borderColor: "#1120A3",
                        },
                        ...(isReadOnly && {
                            backgroundColor: "#f5f5f5",
                            cursor: "not-allowed",
                            "& input": {
                                color: "#999",
                            },
                        }),
                        ...InputProps.sx,
                    },
                }}
                {...props}
            />
        </FormControl>
    );
};

export default InputText;
