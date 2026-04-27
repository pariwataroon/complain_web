import React, { useEffect, useState, useMemo } from "react";
import {
    TextField,
    FormControl,
    Typography,
    CircularProgress,
    Box,
    Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { GetAllOutsideDepartments, GetAllAgenciesForReport } from "@pages/api/allselect/allselect";

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
    filterBySignerId = null, // kept for API compatibility (ignored)
    showDepartmentInfo = false,
    enableSearch = true,
    allowCreate = false,
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
            // ใช้ API ใหม่ที่ดึงทั้งหน่วยงานภายในและภายนอก
            const allAgencies = await GetAllAgenciesForReport();
            // แสดงเฉพาะหน่วยงานภายในของ กค.
            const internalOnly = (allAgencies || []).filter(item => item.type === "internal");
            if (internalOnly && internalOnly.length > 0) {
                setOptions(internalOnly);
                console.log(`✅ SelectFieldDepartment: Loaded ${internalOnly.length} internal agencies`);
            } else {
                console.warn("⚠️ SelectFieldDepartment: No internal agencies data found");
                setOptions([]);
            }
        } catch (error) {
            console.error("❌ SelectFieldDepartment: Error fetching agencies data", error);
            setApiError("ไม่สามารถโหลดข้อมูลหน่วยงานได้");
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    // เมื่อ filterBySignerId เปลี่ยน ให้โหลดข้อมูลใหม่
    useEffect(() => {
        fetchDepartments();
    }, [filterBySignerId]); // filter ignored but kept dependency for backward compat

    useEffect(() => {
        if (loading) return;
        if (selectedValue) {
            const match = options.find(opt => String(opt.value) === String(selectedValue));
            if (match) {
                setSelectedDepartment(match);
                setInputValue(match.label || String(selectedValue));
            } else {
                // If selectedValue is a plain string (created by user), restore it
                // so the Autocomplete shows the created name on mount/edit.
                const created = { value: selectedValue, label: String(selectedValue) };
                setSelectedDepartment(created);
                setInputValue(String(selectedValue));
            }
        }
    }, [options, loading, selectedValue]);

    // Also react to direct `value` prop changes: if parent passes an object
    // with a label or a plain string, ensure the inputValue displays the
    // human-readable label instead of a raw id.
    useEffect(() => {
        if (loading) return;
        if (value === null || value === undefined) return;
        try {
            if (typeof value === 'object' && value !== null) {
                if (value.label) setInputValue(String(value.label));
                else if (value.value) setInputValue(String(value.value));
            } else {
                setInputValue(String(value));
            }
        } catch (_) {}
    }, [value, loading]);

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
                freeSolo={allowCreate}
                value={selectedDepartment || currentOption}
                onChange={(e, newVal) => {
                    // If freeSolo and user entered a string, newVal will be a string
                    if (typeof newVal === 'string') {
                        const nameValue = String(newVal || '').trim();
                        if (!nameValue) {
                            // treat as clear
                            setSelectedDepartment(null);
                            onChange({ target: { name, value: "" } });
                            onDepartmentSelect(null);
                            return;
                        }
                        const created = { value: nameValue, label: nameValue };
                        setSelectedDepartment(created);
                        onChange({ target: { name, value: nameValue } });
                        onDepartmentSelect(created);
                        return;
                    }
                    if (newVal === null) {
                        // cleared via clear icon
                        setSelectedDepartment(null);
                        setInputValue("");
                        onChange({ target: { name, value: "" } });
                        onDepartmentSelect(null);
                        return;
                    }
                    const id = newVal?.value || "";
                    setSelectedDepartment(newVal || null);
                    setInputValue(newVal?.label || id);
                    onChange({ target: { name, value: id } });
                    onDepartmentSelect(newVal || null);
                }}
                inputValue={inputValue}
                onInputChange={(e, v, reason) => {
                    // handle manual clear or reset
                    if ((reason === 'reset' || reason === 'clear') && v === '' && !currentOption) {
                        // cleared
                        handleClear();
                        setInputValue('');
                        return;
                    }
                    setInputValue(v);
                }}
                options={filteredOptions}
                getOptionLabel={(opt) => (typeof opt === 'string' ? opt : (opt?.label || ""))}
                isOptionEqualToValue={(o, v) => String(o.value) === String(v?.value)}
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
                clearIcon={<CloseIcon fontSize="small" />}
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
                        "ไม่พบหน่วยงาน"
                    ) : helperText ? (
                        helperText
                    ) : (
                        `พบหน่วยงานทั้งหมด ${validOptions.length} หน่วยงาน (ภายใน + ภายนอก)`
                    )}
                </Typography>
            )}
        </FormControl>
    );
};

export default SelectFieldDepartment;