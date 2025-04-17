import React, { useRef } from "react";
import { TextField, Box } from "@mui/material";
import FormLabel from "@services/FormLabel/FormLabel";

const InputDate = ({ label, value, onChange, name }) => {
    const inputRef = useRef();
    const handleFocus = () => {
        inputRef.current?.showPicker?.();
        inputRef.current?.focus();
    };

    return (
        <Box onClick={handleFocus} sx={{ cursor: "pointer" }}>
            <FormLabel>{label}</FormLabel>
            <TextField
                inputRef={inputRef}
                type="datetime-local"
                fullWidth
                name={name}
                value={value}
                onChange={onChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                    sx: {
                        borderRadius: "10px",
                        color: "#1120A3",
                        "& fieldset": {
                            borderColor: "#1120A3",
                        },
                    },
                }}
            />
        </Box>
    );
};

export default InputDate;
