import React, { useEffect, useState } from "react";
import {
    MenuItem,
    TextField,
    FormControl,
    Typography,
    IconButton,
    InputAdornment,
    CircularProgress,
    Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { GetAllSignatureAuthorities } from "@pages/api/allselect/allselect";

const SelectFieldSignatureAuthority = ({
    label = "ผู้ลงนาม",
    inputLabel = "เลือกผู้ลงนาม",
    value,
    onChange = () => { },
    name = "signer",
    error = false,
    helperText = "",
    required = false,
    disabled = false,
    onUserSelect = () => { },
    onDepartmentChange = () => { },
    showUserInfo = false,
    ...props
}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    const validOptions = options.filter((opt) => {
        if (typeof opt === "object" && opt !== null) {
            return opt.value !== undefined && opt.label !== undefined;
        }
        return false;
    });

    const selectedValue = (() => {
        if (value === null || value === undefined) return "";
        if (typeof value === "object" && value !== null) {
            return value.value || "";
        }
        return String(value);
    })();

    const hasValue = selectedValue && selectedValue !== "";

    const handleClear = (e) => {
        e.stopPropagation();

        console.log("🧹 SelectFieldSignatureAuthority: Clear button clicked", {
            user: "vampirebeam",
            timestamp: "2025-06-16 17:59:30",
            component: "SelectFieldSignatureAuthority",
            previousValue: selectedValue
        });

        setSelectedUser(null);
        onChange({
            target: {
                name,
                value: "",
            },
        });
        onUserSelect(null);
        onDepartmentChange(null); // ล้างข้อมูล department ด้วย
    };

    const handleRetry = () => {
        console.log("🔄 SelectFieldSignatureAuthority: Retrying data fetch", {
            user: "vampirebeam",
            timestamp: "2025-06-16 17:59:30",
            component: "SelectFieldSignatureAuthority",
            action: "RETRY"
        });

        setApiError(null);
        setLoading(true);
        fetchSignatureAuthorities();
    };

    const fetchSignatureAuthorities = async () => {
        try {
            setLoading(true);
            setApiError(null);

            console.log("🔄 SelectFieldSignatureAuthority: Fetching signature authorities data", {
                user: "vampirebeam",
                timestamp: "2025-06-16 17:59:30",
                component: "SelectFieldSignatureAuthority",
                action: "FETCH_SIGNATURE_AUTHORITIES"
            });

            const authorities = await GetAllSignatureAuthorities();

            if (authorities && authorities.length > 0) {
                setOptions(authorities);

                console.log("✅ SelectFieldSignatureAuthority: Data loaded successfully", {
                    user: "vampirebeam",
                    timestamp: "2025-06-16 17:59:30",
                    component: "SelectFieldSignatureAuthority",
                    count: authorities.length,
                    authorities: authorities.map(a => ({
                        id: a.value,
                        name: a.label,
                        department: a.departmentName
                    }))
                });
            } else {
                console.warn("⚠️ SelectFieldSignatureAuthority: No data found", {
                    user: "vampirebeam",
                    timestamp: "2025-06-16 17:59:30",
                    component: "SelectFieldSignatureAuthority",
                    response: authorities
                });
                setOptions([]);
            }
        } catch (error) {
            console.error("❌ SelectFieldSignatureAuthority: Error fetching data", {
                user: "vampirebeam",
                timestamp: "2025-06-16 17:59:30",
                component: "SelectFieldSignatureAuthority",
                error: error.message,
                stack: error.stack
            });

            setApiError("ไม่สามารถโหลดข้อมูลผู้ลงนามได้");
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSignatureAuthorities();
    }, []);

    return (
        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            {label && (
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: error ? "#d32f2f" : "#1120A3",
                        fontWeight: 600,
                        mb: 1,
                        fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif"
                    }}
                >
                    {label}
                    {required && (
                        <span style={{ color: "#d32f2f", marginLeft: 4 }}>*</span>
                    )}
                </Typography>
            )}

            <TextField
                select
                displayEmpty
                name={name}
                value={selectedValue}
                disabled={disabled || loading}
                error={error || !!apiError}
                onChange={(e) => {
                    const selectedVal = e.target.value;
                    const selectedAuthority = validOptions.find(opt => opt.value === selectedVal);

                    console.log("✍️ SelectFieldSignatureAuthority: Value changed", {
                        user: "vampirebeam",
                        timestamp: "2025-06-16 17:59:30",
                        component: "SelectFieldSignatureAuthority",
                        selectedValue: selectedVal,
                        selectedAuthority: selectedAuthority ? {
                            id: selectedAuthority.value,
                            name: selectedAuthority.label,
                            department: selectedAuthority.departmentName
                        } : null
                    });

                    setSelectedUser(selectedAuthority);

                    onChange({
                        target: {
                            name,
                            value: selectedVal,
                        },
                    });

                    onUserSelect(selectedAuthority);

                    // ส่งข้อมูล department ไปด้วย
                    if (selectedAuthority && selectedAuthority.department) {
                        onDepartmentChange({
                            id: selectedAuthority.departmentId,
                            name: selectedAuthority.departmentName
                        });
                    } else {
                        onDepartmentChange(null);
                    }
                }}
                renderValue={(selected) => {
                    const selectedOption = validOptions.find((opt) => {
                        const optValue = typeof opt === "object" ? opt.value : opt;
                        return optValue === selected;
                    });

                    if (!selectedOption || selected === "") {
                        return (
                            <span style={{ color: "#999" }}>
                                {loading ? "กำลังโหลดข้อมูล..." : (inputLabel || label)}
                            </span>
                        );
                    }

                    return selectedOption.label || String(selectedOption);
                }}
                InputProps={{
                    sx: {
                        height: "40px",
                        borderRadius: "10px",
                        color: "#1120A3",
                        fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                        "& fieldset": {
                            borderColor: error || apiError ? "#d32f2f" : "#1120A3",
                        },
                        "&:hover fieldset": {
                            borderColor: error || apiError ? "#d32f2f" : "#0d1a85",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: error || apiError ? "#d32f2f" : "#1120A3",
                        },
                        "&.Mui-disabled": {
                            backgroundColor: "#f5f5f5",
                            opacity: 0.8,
                        }
                    },
                    startAdornment: loading && (
                        <InputAdornment position="start">
                            <CircularProgress
                                size={16}
                                sx={{ color: "#1120A3", ml: 1 }}
                            />
                        </InputAdornment>
                    ),
                    endAdornment: hasValue && !loading && (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={handleClear}
                                edge="end"
                                size="small"
                                sx={{
                                    color: "#999",
                                    "&:hover": {
                                        color: "#666",
                                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    },
                                    mr: 1,
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                SelectProps={{
                    MenuProps: {
                        PaperProps: {
                            sx: {
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                border: "1px solid #e0e0e0",
                                maxHeight: "300px",
                                marginTop: "4px"
                            }
                        }
                    }
                }}
                {...props}
            >
                {loading && (
                    <MenuItem disabled>
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "#666666",
                            fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif"
                        }}>
                            <CircularProgress size={16} />
                            กำลังโหลดรายชื่อผู้ลงนาม...
                        </Box>
                    </MenuItem>
                )}

                {apiError && (
                    <MenuItem disabled>
                        <Box sx={{
                            color: "#d32f2f",
                            fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                            textAlign: "center",
                            width: "100%",
                            py: 1
                        }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                {apiError}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "#1976d2",
                                    cursor: "pointer",
                                    textDecoration: "underline"
                                }}
                                onClick={handleRetry}
                            >
                                ลองใหม่
                            </Typography>
                        </Box>
                    </MenuItem>
                )}

                {!loading && !apiError && validOptions.length === 0 && (
                    <MenuItem disabled>
                        <Box sx={{
                            color: "#666666",
                            fontStyle: "italic",
                            textAlign: "center",
                            width: "100%",
                            py: 2,
                            fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                        }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                ไม่พบรายชื่อผู้ลงนาม
                            </Typography>
                        </Box>
                    </MenuItem>
                )}

                {!loading && validOptions.map((opt, idx) => {
                    const optionValue = String(opt.value || "");
                    const optionLabel = String(opt.label || opt.value || "");
                    const isDisabled = opt.disabled ?? false;

                    if (
                        optionLabel === "[object Object]" ||
                        optionValue === "[object Object]"
                    ) {
                        return null;
                    }

                    return (
                        <MenuItem
                            key={idx}
                            value={optionValue}
                            disabled={isDisabled}
                            sx={{
                                fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                                fontSize: "16px",
                                padding: "10px 16px",
                                borderBottom: idx < validOptions.length - 1 ? "1px solid #f0f0f0" : "none",
                                "&:hover": {
                                    backgroundColor: "#f5f7ff",
                                },
                                "&.Mui-selected": {
                                    backgroundColor: "#e3f2fd",
                                    color: "#1976d2",
                                    fontWeight: 500,
                                    "&:hover": {
                                        backgroundColor: "#e3f2fd",
                                    }
                                }
                            }}
                        >
                            <Box sx={{ width: "100%" }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontWeight: 400,
                                        fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {optionLabel}
                                </Typography>
                                {showUserInfo && opt.departmentName && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "#666666",
                                            display: "block",
                                            fontSize: "13px",
                                            marginTop: "2px",
                                            fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                                        }}
                                    >
                                        {opt.departmentName}
                                    </Typography>
                                )}
                            </Box>
                        </MenuItem>
                    );
                })}
            </TextField>

            {(helperText || apiError) && (
                <Typography
                    variant="caption"
                    sx={{
                        color: error || apiError ? "#d32f2f" : "#666666",
                        marginLeft: "8px",
                        marginTop: "4px",
                        fontSize: "12px",
                        fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                    }}
                >
                    {apiError ? (
                        <Box display="flex" alignItems="center" gap={1}>
                            <span>{apiError}</span>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "#1976d2",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    fontSize: "11px"
                                }}
                                onClick={handleRetry}
                            >
                                ลองใหม่
                            </Typography>
                        </Box>
                    ) : loading ? (
                        "กำลังโหลดรายชื่อผู้ลงนาม..."
                    ) : validOptions.length === 0 ? (
                        "ไม่พบรายชื่อผู้ลงนาม"
                    ) : (
                        helperText || `พบผู้ลงนาม ${validOptions.length} คน`
                    )}
                </Typography>
            )}
        </FormControl>
    );
};

export default SelectFieldSignatureAuthority;