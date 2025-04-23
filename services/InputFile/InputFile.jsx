import React, { useRef, useState } from "react";
import {
    Box,
    TextField,
    Typography,
    InputAdornment,
    Stack,
    IconButton,
} from "@mui/material";
import { Add, InsertDriveFile, Close } from "@mui/icons-material";
import FormLabel from "@services/FormLabel/FormLabel";

const InputFile = ({
    label,
    onChange,
    name,
    helperText,
    accept = ".doc,.docx,.pdf,.jpg,.jpeg,.png",
    maxFiles = 1,
    maxSizeMB = 10,
}) => {
    const fileRef = useRef();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [errorMsg, setErrorMsg] = useState("");

    const handleClick = () => {
        fileRef.current?.click();
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > maxFiles) {
            setErrorMsg(`สามารถอัปโหลดได้ไม่เกิน ${maxFiles} ไฟล์`);
            return;
        }

        const oversized = files.find((f) => f.size > maxSizeMB * 1024 * 1024);
        if (oversized) {
            setErrorMsg(`ไฟล์ต้องมีขนาดไม่เกิน ${maxSizeMB} MB`);
            return;
        }

        setSelectedFiles(files);
        setErrorMsg("");
        onChange(maxFiles === 1 ? files[0] : files);
    };

    const handleRemoveFile = (indexToRemove) => {
        const newFiles = selectedFiles.filter((_, idx) => idx !== indexToRemove);
        setSelectedFiles(newFiles);
        setErrorMsg("");

        onChange(maxFiles === 1 ? null : newFiles);
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
                            height: "40px",
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
                accept={accept}
                multiple={maxFiles > 1}
                onChange={handleFileSelect}
            />

            {selectedFiles.length > 0 && (
                <Box mt={1}>
                    <Stack spacing={0.5}>
                        {selectedFiles.map((file, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    background: "#F6F8FF",
                                    px: 2,
                                    py: 1,
                                    borderRadius: "8px",
                                    color: "#1120A3",
                                }}
                            >
                                <InsertDriveFile sx={{ fontSize: 20, mr: 1 }} />
                                <Typography
                                    fontSize={14}
                                    noWrap
                                    sx={{ flex: 1 }}
                                    title={file.name}
                                >
                                    {file.name}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => handleRemoveFile(idx)}
                                    sx={{ color: "#ff5252" }}
                                >
                                    <Close fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Stack>
                    <Typography variant="caption" sx={{ color: "#666", mt: 1 }}>
                        อัปโหลดแล้ว {selectedFiles.length} / {maxFiles} ไฟล์
                    </Typography>
                </Box>
            )}

            {errorMsg && (
                <Typography variant="caption" sx={{ color: "red", mt: 1, display: "block" }}>
                    {errorMsg}
                </Typography>
            )}

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
