import React from "react";
import {
    MenuItem,
    TextField,
    FormControl,
    InputLabel,
    Typography,
} from "@mui/material";

const SelectField = ({
    label,
    inputLabel,
    value,
    onChange,
    options = [],
    name,
}) => {
    const labelId = `${name}-label`;

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
                name={name}
                value={value}
                onChange={onChange}
                label={!label ? inputLabel : undefined}
                InputProps={{
                    sx: {
                        height: "40px",
                        borderRadius: "10px",
                        color: "#1120A3",
                        "& fieldset": {
                            borderColor: "#1120A3",
                        },
                    },
                }}
            >
                {options.map((opt, idx) => (
                    <MenuItem key={idx} value={opt}>
                        {opt}
                    </MenuItem>
                ))}
            </TextField>
        </FormControl>
    );
};

export default SelectField;
