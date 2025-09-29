import React, { useRef, useState, useCallback } from "react";
import {
    Box,
    TextField,
    Typography,
    InputAdornment,
    Stack,
    IconButton,
} from "@mui/material";
import { Add, InsertDriveFile, Close } from "@mui/icons-material";

const InputFile = ({
    label,
    onChange,
    name,
    helperText,
    accept = ".doc,.docx,.pdf,.jpg,.jpeg,.png",
    maxFiles = 1,
    maxSizeMB = 10,
    error,
    required = false,
    disabled = false,
    ...props
}) => {
    const fileRef = useRef();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [errorMsg, setErrorMsg] = useState("");

    const isValidFileType = useCallback((file) => {
        const validExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        const fileName = file.name.toLowerCase();
        return validExtensions.some(ext => fileName.endsWith(ext));
    }, []);

    const calculateTotalSize = useCallback((files) => {
        return files.reduce((total, file) => total + file.size, 0) / (1024 * 1024);
    }, []);

    const handleClick = useCallback(() => {
        if (disabled) return;
        fileRef.current?.click();
    }, [disabled]);

    const handleFileSelect = useCallback((e) => {
        if (disabled) return;

        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const remainingSlots = maxFiles - selectedFiles.length;

        if (files.length > remainingSlots) {
            setErrorMsg(`สามารถเพิ่มได้อีก ${remainingSlots} ไฟล์ (รวมทั้งหมดไม่เกิน ${maxFiles} ไฟล์)`);
            e.target.value = '';
            return;
        }

        const invalidFiles = files.filter(file => !isValidFileType(file));
        if (invalidFiles.length > 0) {
            setErrorMsg(`ไฟล์ ${invalidFiles.map(f => f.name).join(', ')} ไม่ใช่ประเภทที่รองรับ กรุณาเลือกไฟล์ .pdf, .doc, .docx, .jpg, .jpeg, .png เท่านั้น`);
            e.target.value = '';
            return;
        }

        const newFiles = files.filter(file =>
            !selectedFiles.some(existingFile =>
                existingFile.name === file.name && existingFile.size === file.size
            )
        );

        if (newFiles.length !== files.length) {
            setErrorMsg("พบไฟล์ที่ซ้ำกัน กรุณาเลือกไฟล์อื่น");
            e.target.value = '';
            return;
        }

        const updatedFiles = [...selectedFiles, ...newFiles];

        const totalSizeMB = calculateTotalSize(updatedFiles);
        if (totalSizeMB > maxSizeMB) {
            setErrorMsg(`ขนาดรวมของไฟล์ทั้งหมด ${totalSizeMB.toFixed(2)} MB เกินกำหนด ${maxSizeMB} MB`);
            e.target.value = '';
            return;
        }

        const oversizedFile = newFiles.find((f) => f.size > maxSizeMB * 1024 * 1024);
        if (oversizedFile) {
            setErrorMsg(`ไฟล์ ${oversizedFile.name} มีขนาด ${(oversizedFile.size / (1024 * 1024)).toFixed(2)} MB เกินกำหนด ${maxSizeMB} MB`);
            e.target.value = '';
            return;
        }

        setSelectedFiles(updatedFiles);
        setErrorMsg("");

        // ส่งค่าไปยัง parent component
        if (typeof onChange === 'function') {
            onChange(maxFiles === 1 ? updatedFiles[0] : updatedFiles);
        }

        e.target.value = '';
    }, [selectedFiles, maxFiles, maxSizeMB, isValidFileType, calculateTotalSize, onChange, disabled]);

    const handleRemoveFile = useCallback((indexToRemove) => {
        if (disabled) return;

        const newFiles = selectedFiles.filter((_, idx) => idx !== indexToRemove);
        setSelectedFiles(newFiles);
        setErrorMsg("");

        // ส่งค่าไปยัง parent component
        if (typeof onChange === 'function') {
            onChange(maxFiles === 1 ? (newFiles.length > 0 ? newFiles[0] : null) : newFiles);
        }
    }, [selectedFiles, maxFiles, onChange, disabled]);

    const isMaxReached = selectedFiles.length >= maxFiles;
    const currentTotalSizeMB = calculateTotalSize(selectedFiles);

    // สร้าง label แบบ custom ที่มี * สีแดง
    const renderLabel = () => {
        if (!label) return null;

        return (
            <Typography
                variant="subtitle2"
                sx={{
                    color: disabled ? "#ccc" : "#1120A3",
                    fontWeight: 600,
                    mb: 1,
                    display: "block"
                }}
            >
                {label}
                {required && (
                    <span style={{ color: disabled ? "#ccc" : "#f44336", marginLeft: "4px" }}>*</span>
                )}
            </Typography>
        );
    };

    return (
        <Box>
            {renderLabel()}

            <Box
                onClick={(!isMaxReached && !disabled) ? handleClick : undefined}
                sx={{
                    cursor: (isMaxReached || disabled) ? "not-allowed" : "pointer",
                    opacity: (isMaxReached || disabled) ? 0.6 : 1
                }}
            >
                <TextField
                    fullWidth
                    value=""
                    placeholder={
                        disabled
                            ? "ปิดการใช้งาน"
                            : isMaxReached
                                ? `อัปโหลดครบแล้ว ${maxFiles} ไฟล์`
                                : `อัปโหลดไฟล์ประกอบ (${selectedFiles.length}/${maxFiles})`
                    }
                    error={error || !!errorMsg}
                    disabled={disabled}
                    InputProps={{
                        readOnly: true,
                        endAdornment: (
                            <InputAdornment position="end">
                                <Add sx={{
                                    color: (isMaxReached || disabled) ? "#ccc" : "#1120A3"
                                }} />
                            </InputAdornment>
                        ),
                        sx: {
                            height: "40px",
                            borderRadius: "10px",
                            color: (isMaxReached || disabled) ? "#ccc" : "#1120A3",
                            "& fieldset": {
                                borderColor: error || errorMsg ? "red" : "#1120A3",
                            },
                        },
                    }}
                    {...props}
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
                disabled={disabled}
            />

            {selectedFiles.length > 0 && (
                <Box mt={1}>
                    <Stack spacing={0.5}>
                        {selectedFiles.map((file, idx) => (
                            <Box
                                key={`${file.name}-${idx}-${file.size}`} // เพิ่ม file.size เพื่อให้ key unique มากขึ้น
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
                                <Typography
                                    fontSize={12}
                                    sx={{ color: "#666", mr: 1 }}
                                >
                                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                </Typography>
                                {!disabled && (
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRemoveFile(idx)}
                                        sx={{ color: "#ff5252" }}
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        ))}
                    </Stack>
                    <Typography variant="caption" sx={{ color: "#666", mt: 1, display: "block" }}>
                        อัปโหลดแล้ว {selectedFiles.length} / {maxFiles} ไฟล์
                        | ขนาดรวม: {currentTotalSizeMB.toFixed(2)} / {maxSizeMB} MB
                        {(!isMaxReached && !disabled) && " (คลิกเพื่อเพิ่มไฟล์)"}
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
                    sx={{ color: disabled ? "#ccc" : "#888", mt: 1, display: "block" }}
                >
                    {helperText}
                </Typography>
            )}
        </Box>
    );
};

export default InputFile;