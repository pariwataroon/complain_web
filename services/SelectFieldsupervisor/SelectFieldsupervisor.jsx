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
import {
    UsersSearchByRolesupervisor,
} from "@pages/api/allselect/allselect";
import styles from "./SelectFieldsupervisor.module.scss";

const SelectFieldsupervisor = ({
    label = "ผู้ลงนาม",
    inputLabel = "เลือกผู้ลงนาม",
    value,
    onChange = () => { },
    name = "supervisor",
    error = false,
    helperText = "",
    required = false,
    disabled = false,
    onUserSelect = () => { },
    showUserInfo = false,
    ...props
}) => {
    // State สำหรับจัดการข้อมูล
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // แก้ไข: กรอง options ให้แน่ใจว่าไม่มี invalid objects
    const validOptions = options.filter((opt) => {
        if (typeof opt === "object" && opt !== null) {
            return opt.value !== undefined && opt.label !== undefined;
        }
        return false;
    });

    // แก้ไขการจัดการ selectedValue
    const selectedValue = (() => {
        if (value === null || value === undefined) return "";

        // ถ้า value เป็น object ให้ใช้ value.value
        if (typeof value === "object" && value !== null) {
            return value.value || "";
        }

        // ถ้า value เป็น string ให้ใช้เลย
        return String(value);
    })();

    // ตรวจสอบว่ามีค่าที่เลือกหรือไม่ (สำหรับแสดงปุ่มลบ)
    const hasValue = selectedValue && selectedValue !== "";

    // ฟังก์ชันลบค่า
    const handleClear = (e) => {
        e.stopPropagation(); // ป้องกันไม่ให้เปิด dropdown

        console.log("🧹 SelectFieldsupervisor: Clear button clicked", {
            user: "vampirebeam",
            timestamp: "2025-06-16 14:06:44",
            component: "SelectFieldsupervisor",
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
    };

    // ฟังก์ชันสำหรับ retry การโหลดข้อมูล
    const handleRetry = () => {
        console.log("🔄 SelectFieldsupervisor: Retrying data fetch", {
            user: "vampirebeam",
            timestamp: "2025-06-16 14:06:44",
            component: "SelectFieldsupervisor",
            action: "RETRY"
        });

        setApiError(null);
        setLoading(true);
        fetchSupervisors();
    };

    // ฟังก์ชันดึงข้อมูลผู้ลงนาม
    const fetchSupervisors = async () => {
        try {
            setLoading(true);
            setApiError(null);

            console.log("🔄 SelectFieldsupervisor: Fetching supervisor data", {
                user: "vampirebeam",
                timestamp: "2025-06-16 14:06:44",
                component: "SelectFieldsupervisor",
                action: "FETCH_SUPERVISORS"
            });

            const users = await UsersSearchByRolesupervisor();

            if (users && users.length > 0) {
                // แปลงข้อมูลให้อยู่ในรูปแบบที่ component ใช้ได้
                const formattedUsers = users.map((user) => ({
                    value: user.value, // user.id จาก API
                    label: user.label, // user.full_name_with_title จาก API
                    fullName: user.fullName,
                    email: user.email,
                    roles: user.roles,
                    phone: user.phone,
                    titleName: user.titleName,
                    citizenId: user.citizenId
                }));

                setOptions(formattedUsers);

                console.log("✅ SelectFieldsupervisor: Data loaded successfully", {
                    user: "vampirebeam",
                    timestamp: "2025-06-16 14:06:44",
                    component: "SelectFieldsupervisor",
                    count: formattedUsers.length,
                    supervisors: formattedUsers.map(u => ({
                        id: u.value,
                        name: u.label
                    }))
                });
            } else {
                console.warn("⚠️ SelectFieldsupervisor: No supervisor data found", {
                    user: "vampirebeam",
                    timestamp: "2025-06-16 14:06:44",
                    component: "SelectFieldsupervisor",
                    response: users
                });
                setOptions([]);
            }
        } catch (error) {
            console.error("❌ SelectFieldsupervisor: Error fetching data", {
                user: "vampirebeam",
                timestamp: "2025-06-16 14:06:44",
                component: "SelectFieldsupervisor",
                error: error.message,
                stack: error.stack
            });

            setApiError("ไม่สามารถโหลดข้อมูลผู้ลงนามได้");
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    // ดึงข้อมูลเมื่อ component mount
    useEffect(() => {
        fetchSupervisors();
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
                    const selectedSupervisor = validOptions.find(opt => opt.value === selectedVal);

                    console.log("✍️ SelectFieldsupervisor: Value changed", {
                        user: "vampirebeam",
                        timestamp: "2025-06-16 14:06:44",
                        component: "SelectFieldsupervisor",
                        selectedValue: selectedVal,
                        selectedSupervisor: selectedSupervisor ? {
                            id: selectedSupervisor.value,
                            name: selectedSupervisor.label,
                            fullName: selectedSupervisor.fullName,
                            email: selectedSupervisor.email
                        } : null
                    });

                    setSelectedUser(selectedSupervisor);

                    // ส่งค่าเป็น string ไม่ใช่ object
                    onChange({
                        target: {
                            name,
                            value: selectedVal, // ส่งเป็น string value ตรงๆ
                        },
                    });

                    // เรียก callback เมื่อเลือกผู้ใช้
                    onUserSelect(selectedSupervisor);
                }}
                renderValue={(selected) => {
                    // หา option ที่ตรงกับ selected value
                    const selectedOption = validOptions.find((opt) => {
                        const optValue = typeof opt === "object" ? opt.value : opt;
                        return optValue === selected;
                    });

                    // ถ้าไม่เจอหรือเป็นค่าว่าง แสดง placeholder
                    if (!selectedOption || selected === "") {
                        return (
                            <span className={styles.selectPlaceholder}>
                                {loading ? "กำลังโหลดข้อมูล..." : (inputLabel || label)}
                            </span>
                        );
                    }

                    // แสดง label ของ option ที่เลือก
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
                {/* แสดง Loading หรือ Error State */}
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

                {/* แสดง Error State */}
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

                {/* แสดง No Data State */}
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
                            <Typography variant="caption" sx={{ color: "#999999" }}>
                                กรุณาติดต่อผู้ดูแลระบบหากเกิดปัญหา
                            </Typography>
                        </Box>
                    </MenuItem>
                )}

                {/* แสดงรายการผู้ลงนาม */}
                {!loading && validOptions.map((opt, idx) => {
                    const optionValue = String(opt.value || "");
                    const optionLabel = String(opt.label || opt.value || "");
                    const isDisabled = opt.disabled ?? false;

                    // ไม่แสดง option ที่เป็น "[object Object]"
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
                                {showUserInfo && opt.email && (
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
                                        {opt.email}
                                    </Typography>
                                )}
                            </Box>
                        </MenuItem>
                    );
                })}
            </TextField>

            {/* Helper Text */}
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

            {/* แสดงข้อมูลผู้ใช้ที่เลือก (ถ้าเปิดใช้งาน) */}
            {showUserInfo && selectedUser && (
                <Box
                    sx={{
                        mt: 2,
                        p: 2,
                        bgcolor: "#f8f9fa",
                        borderRadius: 1,
                        border: "1px solid #e0e0e0"
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 500,
                            mb: 1,
                            fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                            color: "#333333"
                        }}
                    >
                        ข้อมูลผู้ลงนาม:
                    </Typography>
                    <Box sx={{
                        fontSize: "14px",
                        color: "#555555",
                        lineHeight: 1.6,
                        fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                    }}>
                        <div><strong>ชื่อเต็ม:</strong> {selectedUser.fullName}</div>
                        {selectedUser.email && (
                            <div><strong>อีเมล:</strong> {selectedUser.email}</div>
                        )}
                        {selectedUser.phone && (
                            <div><strong>เบอร์โทร:</strong> {selectedUser.phone}</div>
                        )}
                        {selectedUser.titleName && (
                            <div><strong>คำนำหน้า:</strong> {selectedUser.titleName}</div>
                        )}
                        {selectedUser.roles && selectedUser.roles.length > 0 && (
                            <div><strong>ตำแหน่ง:</strong> {selectedUser.roles[0].role_description}</div>
                        )}
                    </Box>
                </Box>
            )}
        </FormControl>
    );
};

export default SelectFieldsupervisor;