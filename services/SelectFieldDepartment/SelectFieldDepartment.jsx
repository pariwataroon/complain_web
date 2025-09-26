import React, { useEffect, useState, useMemo } from "react";
import {
    MenuItem,
    TextField,
    FormControl,
    Typography,
    IconButton,
    InputAdornment,
    CircularProgress,
    Box,
    Autocomplete,
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
    enableSearch = true,
    ...props
}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [inputValue, setInputValue] = useState("");

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

    const handleClear = () => {
        setSelectedDepartment(null);
        onChange({ target: { name, value: "" } });
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

    useEffect(() => {
        if (loading) return;
        if (selectedValue) {
            const match = options.find(opt => String(opt.value) === String(selectedValue));
            if (match) setSelectedDepartment(match);
        }
    }, [options, loading, selectedValue]);

    const filteredOptions = useMemo(() => {
        if (!enableSearch || !inputValue) return validOptions;
        const t = inputValue.toLowerCase();
        return validOptions.filter(opt => [opt.label, opt.code, opt.shortName]
            .some(v => v && String(v).toLowerCase().includes(t)));
    }, [enableSearch, inputValue, validOptions]);

    const currentOption = useMemo(() => {
        if (!selectedValue) return null;
        return validOptions.find(o => String(o.value) === String(selectedValue)) || null;
    }, [selectedValue, validOptions]);

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

            <Autocomplete
                disabled={disabled || loading}
                loading={loading}
                value={currentOption}
                onChange={(e, newVal) => {
                    const id = newVal?.value || "";
                    setSelectedDepartment(newVal || null);
                    onChange({ target: { name, value: id } });
                    onDepartmentSelect(newVal || null);
                }}
                inputValue={inputValue}
                onInputChange={(e, v, reason) => {
                    if (reason === 'reset' && v === '' && !currentOption) {
                        // cleared
                        handleClear();
                    }
                    setInputValue(v);
                }}
                options={filteredOptions}
                getOptionLabel={(opt) => opt?.label || ""}
                isOptionEqualToValue={(o, v) => String(o.value) === String(v.value)}
                noOptionsText={loading ? 'กำลังโหลด...' : (apiError || 'ไม่พบหน่วยงาน')}
                clearOnBlur={false}
                popupIcon={null}
                forcePopupIcon
                fullWidth
                renderOption={(props, option) => (
                    <li {...props} key={option.value} style={{ padding: '8px 12px' }}>
                        <Box sx={{ width: '100%' }}>
                            <Typography sx={{ fontFamily: "'Sarabun','Noto Sans Thai',sans-serif", fontSize: 14 }}>
                                {option.label}
                            </Typography>
                            {showDepartmentInfo && option.code && (
                                <Typography variant="caption" sx={{ color: '#666', fontSize: '11px' }}>
                                    รหัส: {option.code}
                                </Typography>
                            )}
                        </Box>
                    </li>
                )}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={loading ? 'กำลังโหลดข้อมูล...' : (inputLabel || label)}
                        error={error || !!apiError}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                            sx: {
                                height: '40px',
                                borderRadius: '10px',
                                '& fieldset': { borderColor: error || apiError ? '#d32f2f' : '#1120A3' },
                                '&:hover fieldset': { borderColor: error || apiError ? '#d32f2f' : '#0d1a85' },
                                '&.Mui-focused fieldset': { borderColor: error || apiError ? '#d32f2f' : '#1120A3' }
                            }
                        }}
                        size="small"
                    />
                )}
                clearIcon={<CloseIcon fontSize="small" onClick={(e) => { e.stopPropagation(); handleClear(); }} />}
            />

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
                    ) : validOptions.length === 0 ? (
                        "ไม่พบบัญชีหน่วยงาน"
                    ) : helperText ? (
                        helperText
                    ) : (
                        `พบหน่วยงาน ${validOptions.length} หน่วยงาน`
                    )}
                </Typography>
            )}
        </FormControl>
    );
};

export default SelectFieldDepartment;