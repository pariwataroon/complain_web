import React from "react";
import { TextField } from "@mui/material";
import FormLabel from "@services/FormLabel/FormLabel";

const InputZipcode = ({
    label = "รหัสไปรษณีย์",
    value,
    onChange,
    name = "zipcode",
    ...props
}) => {
    const handleZipcodeChange = (e) => {
        const input = e.target.value;
        const numericOnly = input.replace(/\D/g, "").slice(0, 5);
        onChange({ target: { name, value: numericOnly } });
    };

    return (
        <>
            {label && <FormLabel>{label}</FormLabel>}
            <TextField
                fullWidth
                variant="outlined"
                name={name}
                value={value}
                onChange={handleZipcodeChange}
                inputProps={{
                    maxLength: 5,
                }}
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
};

export default InputZipcode;
