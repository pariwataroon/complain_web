import React from "react";
import { TextField } from "@mui/material";
import FormLabel from "@services/FormLabel/FormLabel";

const InputPhone = ({
    label = "หมายเลขโทรศัพท์",
    value,
    onChange,
    name,
    disabled,
    ...props
}) => {
    const handleChange = (e) => {
        let val = e.target.value.replace(/\D/g, "");
        if (val.length > 10) val = val.slice(0, 10);

        if (val && val[0] !== "0") {
            return;
        }

        onChange({
            target: {
                name,
                value: val,
            },
        });
    };

    const handleKeyDown = (e) => {
        if (
            ["e", "E", "+", "-", ".", ",", " "].includes(e.key) ||
            isNaN(Number(e.key)) && e.key !== "Backspace" && e.key !== "Tab"
        ) {
            e.preventDefault();
        }
    };

    return (
        <>
            <FormLabel>{label}</FormLabel>
            <TextField
                fullWidth
                variant="outlined"
                value={value}
                name={name}
                disabled={disabled}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="โทรศัพท์มือถือ 0XX-XXX-XXXX"
                inputProps={{
                    maxLength: 10,
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                }}
                sx={{
                    backgroundColor: disabled ? "#E8E9F6" : "white",
                    "& .MuiOutlinedInput-root": {
                        height: "40px",
                        borderRadius: "10px",
                    },
                    "& fieldset": {
                        borderColor: "#1120A3",
                    },
                    "& input": {
                        color: "#1120A3",
                    },
                }}
                {...props}
            />
        </>
    );
};

export default InputPhone;
