import React from "react";
import { TextField } from "@mui/material";
import FormLabel from "@services/FormLabel/FormLabel";

const InputTextarea = ({ label, value, onChange, name }) => (
    <>
        <FormLabel>{label}</FormLabel>
        <TextField
            fullWidth
            multiline
            minRows={5}
            value={value}
            name={name}
            onChange={onChange}
            variant="outlined"
            InputProps={{
                sx: {
                    borderRadius: "16px",
                    color: "#1120A3",
                    "& fieldset": {
                        borderColor: "#1120A3",
                    },
                },
            }}
        />
    </>
);

export default InputTextarea;
