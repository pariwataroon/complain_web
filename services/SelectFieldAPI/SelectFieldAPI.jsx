import React from "react";
import {
    TextField,
    FormControl,
    Typography,
} from "@mui/material";
import styles from "./SelectFieldAPI.module.scss";

const SelectFieldAPI = ({
    label,
    inputLabel,
    value,
    disabled = true,
}) => {
    const selectedLabel =
        typeof value === "object" ? value?.label ?? "" : String(value ?? "");

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
                value={selectedLabel}
                disabled={disabled}
                InputProps={{
                    sx: {
                        height: "40px",
                        borderRadius: "10px",
                        color: "#1120A3",
                        backgroundColor: disabled ? "#E8E9F6" : "white",
                        "& fieldset": {
                            borderColor: "#1120A3",
                        },
                    },
                }}
            />

        </FormControl>
    );
};

export default SelectFieldAPI;
