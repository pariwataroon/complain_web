import React from "react";
import { TextField } from "@mui/material";
import FormLabel from "@services/FormLabel/FormLabel";

const InputText = ({ label, value, onChange, name, InputProps = {}, ...props }) => {
    const isReadOnly = InputProps?.readOnly;

    return (
        <>
            <FormLabel>{label}</FormLabel>
            <TextField
                fullWidth
                variant="outlined"
                value={value}
                name={name}
                onChange={onChange}
                InputProps={{
                    ...InputProps,
                    sx: {
                        height: "40px",
                        borderRadius: "10px",
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
        </>
    );
};

export default InputText;
