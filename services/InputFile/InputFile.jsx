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
    error,
    required = false,
    ...props
}) => {
    const fileRef = useRef();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [errorMsg, setErrorMsg] = useState("");

    const isValidFileType = (file) => {
        const validExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        const fileName = file.name.toLowerCase();
        return validExtensions.some(ext => fileName.endsWith(ext));
    };

    const calculateTotalSize = (files) => {
        return files.reduce((total, file) => total + file.size, 0) / (1024 * 1024);
    };

    const handleClick = () => {
        fileRef.current?.click();
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);

        const remainingSlots = maxFiles - selectedFiles.length;

        if (files.length > remainingSlots) {
            setErrorMsg(`สามารถเพิ่มได้อีก ${remainingSlots} ไฟล์ (รวมทั้งหมดไม่เกิน ${maxFiles} ไฟล์)`);
            return;
        }

        const invalidFiles = files.filter(file => !isValidFileType(file));
        if (invalidFiles.length > 0) {
            setErrorMsg(`ไฟล์ ${invalidFiles.map(f => f.name).join(', ')} ไม่ใช่ประเภทที่รองรับ กรุณาเลือกไฟล์ .pdf, .doc, .docx, .jpg, .jpeg, .png เท่านั้น`);
            return;
        }

        const newFiles = files.filter(file =>
            !selectedFiles.some(existingFile =>
                existingFile.name === file.name && existingFile.size === file.size
            )
        );

        if (newFiles.length !== files.length) {
            setErrorMsg("พบไฟล์ที่ซ้ำกัน กรุณาเลือกไฟล์อื่น");
            return;
        }

        const updatedFiles = [...selectedFiles, ...newFiles];

        const totalSizeMB = calculateTotalSize(updatedFiles);
        if (totalSizeMB > maxSizeMB) {
            setErrorMsg(`ขนาดรวมของไฟล์ทั้งหมด ${totalSizeMB.toFixed(2)} MB เกินกำหนด ${maxSizeMB} MB`);
            return;
        }

        const oversizedFile = newFiles.find((f) => f.size > maxSizeMB * 1024 * 1024);
        if (oversizedFile) {
            setErrorMsg(`ไฟล์ ${oversizedFile.name} มีขนาด ${(oversizedFile.size / (1024 * 1024)).toFixed(2)} MB เกินกำหนด ${maxSizeMB} MB`);
            return;
        }

        setSelectedFiles(updatedFiles);
        setErrorMsg("");

        onChange(maxFiles === 1 ? updatedFiles[0] : updatedFiles);

        e.target.value = '';
    };

    const handleRemoveFile = (indexToRemove) => {
        const newFiles = selectedFiles.filter((_, idx) => idx !== indexToRemove);
        setSelectedFiles(newFiles);
        setErrorMsg("");

        onChange(maxFiles === 1 ? (newFiles.length > 0 ? newFiles[0] : null) : newFiles);
    };

    const isMaxReached = selectedFiles.length >= maxFiles;
    const currentTotalSizeMB = calculateTotalSize(selectedFiles);

    // สร้าง label แบบ custom ที่มี * สีแดง
    const renderLabel = () => {
        if (!label) return null;

        return (
            <Typography
                variant="subtitle2"
                sx={{
                    color: "#1120A3",
                    fontWeight: 600,
                    mb: 1,
                    display: "block"
                }}
            >
                {label}
                {required && (
                    <span style={{ color: "#f44336", marginLeft: "4px" }}>*</span>
                )}
            </Typography>
        );
    };

    return (
        <Box>
            {/* แสดง label แบบ custom แทน FormLabel */}
            {renderLabel()}

            <Box
                onClick={!isMaxReached ? handleClick : undefined}
                sx={{
                    cursor: isMaxReached ? "not-allowed" : "pointer",
                    opacity: isMaxReached ? 0.6 : 1
                }}
            >
                <TextField
                    fullWidth
                    value=""
                    placeholder={
                        isMaxReached
                            ? `อัปโหลดครบแล้ว ${maxFiles} ไฟล์`
                            : `อัปโหลดไฟล์ประกอบ (${selectedFiles.length}/${maxFiles})`
                    }
                    error={error || !!errorMsg}
                    InputProps={{
                        readOnly: true,
                        endAdornment: (
                            <InputAdornment position="end">
                                <Add sx={{
                                    color: isMaxReached ? "#ccc" : "#1120A3"
                                }} />
                            </InputAdornment>
                        ),
                        sx: {
                            height: "40px",
                            borderRadius: "10px",
                            color: isMaxReached ? "#ccc" : "#1120A3",
                            "& fieldset": {
                                borderColor: error || errorMsg ? "red" : "#1120A3",
                            },
                        },
                    }}
                    {...props} // ส่ง props อื่นๆ ต่อไป
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
                                key={`${file.name}-${idx}`}
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
                    <Typography variant="caption" sx={{ color: "#666", mt: 1, display: "block" }}>
                        อัปโหลดแล้ว {selectedFiles.length} / {maxFiles} ไฟล์
                        | ขนาดรวม: {currentTotalSizeMB.toFixed(2)} / {maxSizeMB} MB
                        {selectedFiles.length < maxFiles && " (คลิกเพื่อเพิ่มไฟล์)"}
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