import React from "react";
import { MenuItem, TextField } from "@mui/material";
import FormLabel from "@services/FormLabel/FormLabel";

const SelectField = ({ label, value, onChange, options = [], name }) => (
    <>
        <FormLabel>{label}</FormLabel>
        <TextField
            fullWidth
            select
            value={value}
            name={name}
            onChange={onChange}
            variant="outlined"
            InputProps={{
                sx: {
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
    </>
);

export default SelectField;
