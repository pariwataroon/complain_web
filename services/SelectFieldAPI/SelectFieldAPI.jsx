import React, { useEffect, useState } from "react";
import {
    Autocomplete,
    TextField,
    FormControl,
    Typography,
    CircularProgress,
    InputAdornment,
    Box,
} from "@mui/material";
import {
    GetProvincesSelect,
    GetAmphuresSelect,
    GetDistrictsSelect,
    GetZipcodeSelect,
} from "@pages/api/allselect/allselect";
import styles from "./SelectFieldAPI.module.scss";

const SelectFieldAPI = ({
    label,
    inputLabel,
    value,
    disabled = true,
    onChange,
    name,
    provinceCode,
    amphureCode,
    districtCode,
}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputText, setInputText] = useState("");

    // ดึงค่า label สำหรับแสดงผล
    const selectedLabel =
        typeof value === "object" ? value?.label ?? "" : String(value ?? "");

    // ดึงค่า value สำหรับ autocomplete
    const selectedValue = (() => {
        if (!value) return null;
        if (typeof value === "object" && value !== null) return value;
        // หา option ที่ตรงกับ value
        return options.find(opt => String(opt.value) === String(value)) || null;
    })();

    // Fetch options ตามประเภทของ field
    useEffect(() => {
        if (disabled) return; // ถ้า disabled ไม่ต้อง fetch

        const fetchOptions = async () => {
            try {
                setLoading(true);
                let response = null;

                if (label === "จังหวัด") {
                    response = await GetProvincesSelect();
                } else if (label === "อำเภอ/เขต" && provinceCode) {
                    response = await GetAmphuresSelect(provinceCode);
                } else if (label === "ตำบล/แขวง" && amphureCode) {
                    response = await GetDistrictsSelect(amphureCode);
                } else if (label === "รหัสไปรษณีย์" && amphureCode) {
                    const districts = await GetDistrictsSelect(amphureCode);
                    const zipMap = new Map();
                    districts.forEach((item) => {
                        if (item.zip_code && !zipMap.has(item.zip_code)) {
                            zipMap.set(item.zip_code, item);
                        }
                    });
                    response = Array.from(zipMap.values());
                }

                if (Array.isArray(response)) {
                    const mapped = response.map(item => ({
                        value: item.code || item.id || item.zip_code,
                        label: item.name_th || item.name || item.zip_code,
                    }));
                    setOptions(mapped);
                }
            } catch (error) {
                console.error(`Error fetching ${label}:`, error);
                setOptions([]);
            } finally {
                setLoading(false);
            }
        };

        // ถ้าเป็นอำเภอ/ตำบล/รหัสไปรษณีย์ ต้องมี code ของ parent ก่อน
        if (label === "จังหวัด") {
            fetchOptions();
        } else if (label === "อำเภอ/เขต" && provinceCode) {
            fetchOptions();
        } else if ((label === "ตำบล/แขวง" || label === "รหัสไปรษณีย์") && amphureCode) {
            fetchOptions();
        }
    }, [label, provinceCode, amphureCode, disabled]);

    // กรอง options แบบ real-time
    const filterOptions = (opts, params) => {
        const filterVal = params.inputValue.trim().toLowerCase();
        if (!filterVal) return opts;
        return opts.filter(opt =>
            opt.label && String(opt.label).toLowerCase().includes(filterVal)
        );
    };

    // Handle autocomplete change
    const handleAutoChange = (event, newValue) => {
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: newValue || "",
                },
            });
        }
        setInputText(newValue?.label || "");
    };

    // Handle input change
    const handleInputChange = (event, newInputValue, reason) => {
        if (reason === "clear") {
            setInputText("");
        } else {
            setInputText(newInputValue);
        }
    };

    // ถ้า disabled ให้แสดงแบบ TextField ธรรมดา
    if (disabled) {
        return (
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                {label && (
                    <Typography
                        variant="subtitle2"
                        sx={{ color: "#1120A3", fontWeight: 600, mb: 1 }}
                    >
                        {label}
                    </Typography>
                )}

                <TextField
                    value={selectedLabel}
                    disabled={disabled}
                    InputProps={{
                        sx: {
                            height: "40px",
                            borderRadius: "10px",
                            color: "#1120A3",
                            backgroundColor: "#E8E9F6",
                            "& fieldset": {
                                borderColor: "#1120A3",
                            },
                        },
                    }}
                />
            </FormControl>
        );
    }

    // ถ้าไม่ disabled ให้แสดงแบบ Autocomplete (สามารถค้นหา/เลือกได้)
    return (
        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            {label && (
                <Typography
                    variant="subtitle2"
                    sx={{ color: "#1120A3", fontWeight: 600, mb: 1 }}
                >
                    {label}
                </Typography>
            )}

            <Autocomplete
                options={options}
                loading={loading}
                filterOptions={filterOptions}
                getOptionLabel={option =>
                    typeof option === "string" ? option : option.label || option.value || ""
                }
                value={selectedValue}
                inputValue={inputText || selectedLabel}
                onInputChange={handleInputChange}
                onChange={handleAutoChange}
                isOptionEqualToValue={(option, v) =>
                    String(option.value) === String(v?.value || v)
                }
                disableClearable
                noOptionsText={
                    loading ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#666" }}>
                            <CircularProgress size={16} />
                            กำลังโหลดข้อมูล...
                        </Box>
                    ) : (
                        <Box sx={{ color: "#666", fontStyle: "italic", textAlign: "center", py: 2 }}>
                            ไม่พบรายการ
                        </Box>
                    )
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label=""
                        name={name}
                        variant="outlined"
                        autoComplete="off"
                        placeholder={inputLabel || `เลือก${label}`}
                        InputProps={{
                            ...params.InputProps,
                            sx: {
                                height: "40px",
                                borderRadius: "10px",
                                color: "#1120A3",
                                backgroundColor: "white",
                                "& fieldset": {
                                    borderColor: "#1120A3",
                                },
                            },
                            endAdornment: (
                                <>
                                    {params.InputProps.endAdornment}
                                    {loading && (
                                        <InputAdornment position="end">
                                            <CircularProgress size={16} sx={{ color: "#1120A3" }} />
                                        </InputAdornment>
                                    )}
                                </>
                            ),
                        }}
                    />
                )}
            />
        </FormControl>
    );
};

export default SelectFieldAPI;
