import React from "react";
import { TextField } from "@mui/material";
import FormLabel from "@services/FormLabel/FormLabel";

const InputText = ({ label, value, onChange, name, ...props }) => (
    <>
        <FormLabel>{label}</FormLabel>
        <TextField
            fullWidth
            variant="outlined"
            value={value}
            name={name}
            onChange={onChange}
            InputProps={{
                sx: {
                    borderRadius: "10px",
                    color: "#1120A3",
                    "& fieldset": {
                        borderColor: "#1120A3",
                    },
                },
            }}
            {...props}
        />
    </>
);

export default InputText;
