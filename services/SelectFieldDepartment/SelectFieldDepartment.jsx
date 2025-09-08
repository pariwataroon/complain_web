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

const SelectFieldDepartment = ({
    label = "หน่วยงาน",
    inputLabel = "เลือกหน่วยงาน",
    value,
    onChange = () => { },
    name = "department",
    error = false,
    helperText = "",
    required = false,
    disabled = false,
    onDepartmentSelect = () => { },
    filterBySignerId = null,
    showDepartmentInfo = false,
    ...props
}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

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

        setSelectedDepartment(null);
        onChange({
            target: {
                name,
                value: "",
            },
        });
        onDepartmentSelect(null);
    };

    const handleRetry = () => {
        setApiError(null);
        setLoading(true);
        fetchDepartments();
    };

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            setApiError(null);

            // ดึงข้อมูลจาก GetAllSignatureAuthorities
            const signatureAuthorities = await GetAllSignatureAuthorities();

            if (signatureAuthorities && signatureAuthorities.length > 0) {
                let departmentOptions = [];

                if (filterBySignerId) {
                    // หาผู้ลงนามที่เลือก
                    const selectedAuthority = signatureAuthorities.find(auth =>
                        auth.value === filterBySignerId
                    );

                    if (selectedAuthority && selectedAuthority.departments) {
                        // สร้างรายการหน่วยงานทั้งหมดของผู้ลงนามที่เลือก
                        departmentOptions = selectedAuthority.departments.map(dept => ({
                            value: dept.id,
                            label: dept.name,
                            code: dept.code || "",
                            shortName: dept.shortName || "",
                            authority: selectedAuthority
                        }));
                    }

                    console.log('Departments for selected signer:', {
                        signerId: filterBySignerId,
                        signerName: selectedAuthority?.label,
                        departments: departmentOptions
                    });

                    setOptions(departmentOptions);

                } else {
                    const allDepartments = [];

                    signatureAuthorities.forEach(auth => {
                        if (auth.departments) {
                            auth.departments.forEach(dept => {
                                const exists = allDepartments.find(d => d.value === dept.id);
                                if (!exists) {
                                    allDepartments.push({
                                        value: dept.id,
                                        label: dept.name,
                                        code: dept.code || "",
                                        shortName: dept.shortName || "",
                                        authority: auth
                                    });
                                }
                            });
                        }
                    });

                    setOptions(allDepartments);
                }
            } else {
                console.warn("⚠️ SelectFieldDepartment: No signature authorities data found");
                setOptions([]);
            }
        } catch (error) {
            console.error("❌ SelectFieldDepartment: Error fetching departments data", error);
            setApiError("ไม่สามารถโหลดข้อมูลหน่วยงานได้");
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    // เมื่อ filterBySignerId เปลี่ยน ให้โหลดข้อมูลใหม่
    useEffect(() => {
        fetchDepartments();
    }, [filterBySignerId]);

    // รักษาค่าที่ Prefill: ล้างเฉพาะเมื่อค่าปัจจุบันไม่อยู่ในรายการใหม่
    useEffect(() => {
        if (!filterBySignerId) return;
        const exists = options.some(opt => String(opt.value) === String(selectedValue));
        if (!exists && selectedValue) {
            setSelectedDepartment(null);
            onChange({ target: { name, value: "" } });
            onDepartmentSelect(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterBySignerId, options]);

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
                        <span style={{ color: "#d32f2f", marginLeft: 4 }}></span>
                    )}
                </Typography>
            )}

            <TextField
                select
                displayEmpty
                name={name}
                value={selectedValue}
                disabled={disabled || loading || !filterBySignerId}
                error={error || !!apiError}
                onChange={(e) => {
                    const selectedVal = e.target.value;
                    const selectedDept = validOptions.find(opt => opt.value === selectedVal);


                    setSelectedDepartment(selectedDept);

                    onChange({
                        target: {
                            name,
                            value: selectedVal,
                        },
                    });

                    onDepartmentSelect(selectedDept);
                }}
                renderValue={(selected) => {
                    const selectedOption = validOptions.find((opt) => {
                        const optValue = typeof opt === "object" ? opt.value : opt;
                        return optValue === selected;
                    });

                    if (!selectedOption || selected === "") {
                        return (
                            <span style={{ color: "#999" }}>
                                {loading ? "กำลังโหลดข้อมูล..." :
                                    !filterBySignerId ? "เลือกผู้ลงนามก่อน" :
                                        (inputLabel || label)}
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
                            กำลังโหลดรายการหน่วยงาน...
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

                {!loading && !apiError && !filterBySignerId && (
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
                                กรุณาเลือกผู้ลงนามก่อน
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#999999" }}>
                                เพื่อแสดงหน่วยงานที่เกี่ยวข้อง
                            </Typography>
                        </Box>
                    </MenuItem>
                )}

                {!loading && !apiError && filterBySignerId && validOptions.length === 0 && (
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
                                ไม่พบหน่วยงานสำหรับผู้ลงนามที่เลือก
                            </Typography>
                        </Box>
                    </MenuItem>
                )}

                {!loading && filterBySignerId && validOptions.map((opt, idx) => {
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
                                {showDepartmentInfo && opt.code && (
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
                                        รหัส: {opt.code}
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
                        "กำลังโหลดรายการหน่วยงาน..."
                    ) : !filterBySignerId ? (
                        "เลือกผู้ลงนามเพื่อแสดงหน่วยงาน"
                    ) : validOptions.length === 0 ? (
                        "ไม่พบหน่วยงานสำหรับผู้ลงนามที่เลือก"
                    ) : (
                        helperText || `พบหน่วยงาน ${validOptions.length} หน่วยงาน`
                    )}
                </Typography>
            )}
        </FormControl>
    );
};

export default SelectFieldDepartment;