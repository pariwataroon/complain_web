import React, { useRef } from "react";
import {
    Box,
    TextField,
    Typography,
    InputAdornment,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import FormLabel from "@services/FormLabel/FormLabel";

const InputFile = ({ label, onChange, name, helperText }) => {
    const fileRef = useRef();

    const handleClick = () => {
        fileRef.current?.click();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) onChange(file);
    };

    return (
        <Box>
            <FormLabel>{label}</FormLabel>
            <Box onClick={handleClick} sx={{ cursor: "pointer" }}>
                <TextField
                    fullWidth
                    value="" 
                    placeholder="อัปโหลดไฟล์ประกอบ"
                    InputProps={{
                        readOnly: true,
                        endAdornment: (
                            <InputAdornment position="end">
                                <Add sx={{ color: "#1120A3" }} />
                            </InputAdornment>
                        ),
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
            <input
                type="file"
                ref={fileRef}
                name={name}
                style={{ display: "none" }}
                onChange={handleFileSelect}
            />

            {helperText && (
                <Typography
                    variant="caption"
                    sx={{ color: "#888", mt: 1, display: "block" }}
                >
                    {helperText}
                </Typography>
            )}
        </Box>
    );
};

export default InputFile;
