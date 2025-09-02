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
import { GetOutgoingReportOptions } from "@pages/api/allselect/allselect";
import styles from "./SelectFieldsalutation.module.scss";

const SelectFieldsalutation = ({
  label = "เรียน",
  inputLabel = "เลือกตำแหน่ง",
  value,
  onChange = () => {},
  name = "position",
  error = false,
  helperText = "",
  required = false,
  disabled = false,
  onUserSelect = () => {},
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
    setApiError(null);
    setLoading(true);
    fetchPositions();
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      setApiError(null);

      const positions = await GetOutgoingReportOptions("positions");

      if (positions && positions.length > 0) {
        setOptions(positions);
      } else {
        console.warn("⚠️ SelectFieldsalutation: No positions data found", {
          user: "vampirebeam",
          timestamp: "2025-06-16 17:49:30",
          component: "SelectFieldsalutation",
          response: positions,
        });
        setOptions([]);
      }
    } catch (error) {
      setApiError("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  // ฟังก์ชันสำหรับสร้าง label ในรูปแบบ Name (level) (description)
  const formatOptionLabel = (opt) => {
    if (!opt || typeof opt !== "object") return "";
    const name = opt.name || "";
    const level = opt.level ? opt.level : "";
    const description = opt.description ? opt.description : "";

    return (
      <>
        {name}
        {level && (
          <span
            style={{
              color: "#888",
              fontSize: "85%",
              marginLeft: 4,
            }}
          >
            ({level})
          </span>
        )}
        {description && (
          <span
            style={{
              color: "#888",
              fontSize: "85%",
              marginLeft: 4,
            }}
          >
            ({description})
          </span>
        )}
      </>
    );
  };

  return (
    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
      {label && (
        <Typography
          variant="subtitle2"
          sx={{
            color: error ? "#d32f2f" : "#1120A3",
            fontWeight: 600,
            mb: 1,
            fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
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
          const selectedPosition = validOptions.find(
            (opt) => opt.value === selectedVal
          );

          setSelectedUser(selectedPosition);

          onChange({
            target: {
              name,
              value: selectedVal,
            },
          });

          onUserSelect(selectedPosition);
        }}
        renderValue={(selected) => {
          const selectedOption = validOptions.find((opt) => {
            const optValue = typeof opt === "object" ? opt.value : opt;
            return optValue === selected;
          });

          if (!selectedOption || selected === "") {
            return (
              <span className={styles.selectPlaceholder}>
                {loading ? "กำลังโหลดข้อมูล..." : inputLabel || label}
              </span>
            );
          }

          // แสดง Name (level) (description) โดย () เป็นสีเทาและตัวเล็ก
          return formatOptionLabel(selectedOption);
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
            },
          },
          startAdornment: loading && (
            <InputAdornment position="start">
              <CircularProgress size={16} sx={{ color: "#1120A3", ml: 1 }} />
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
                marginTop: "4px",
              },
            },
          },
        }}
        {...props}
      >
        {/* แสดง Loading หรือ Error State */}
        {loading && (
          <MenuItem disabled>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#666666",
                fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
              }}
            >
              <CircularProgress size={16} />
              กำลังโหลดรายการตำแหน่ง...
            </Box>
          </MenuItem>
        )}

        {/* แสดง Error State */}
        {apiError && (
          <MenuItem disabled>
            <Box
              sx={{
                color: "#d32f2f",
                fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                textAlign: "center",
                width: "100%",
                py: 1,
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                {apiError}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#1976d2",
                  cursor: "pointer",
                  textDecoration: "underline",
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
            <Box
              sx={{
                color: "#666666",
                fontStyle: "italic",
                textAlign: "center",
                width: "100%",
                py: 2,
                fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                ไม่พบรายการตำแหน่ง
              </Typography>
              <Typography variant="caption" sx={{ color: "#999999" }}>
                กรุณาติดต่อผู้ดูแลระบบหากเกิดปัญหา
              </Typography>
            </Box>
          </MenuItem>
        )}

        {/* แสดงรายการตำแหน่ง */}
        {!loading &&
          validOptions.map((opt, idx) => {
            const optionValue = String(opt.value || "");
            const isDisabled = opt.disabled ?? false;

            // ไม่แสดง option ที่เป็น "[object Object]"
            if (
              (opt.label || opt.value || "") === "[object Object]" ||
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
                  borderBottom:
                    idx < validOptions.length - 1
                      ? "1px solid #f0f0f0"
                      : "none",
                  "&:hover": {
                    backgroundColor: "#f5f7ff",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "#e3f2fd",
                    color: "#1976d2",
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "#e3f2fd",
                    },
                  },
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 400,
                      fontFamily:
                        "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                      lineHeight: 1.4,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {formatOptionLabel(opt)}
                  </Typography>
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
                  fontSize: "11px",
                }}
                onClick={handleRetry}
              >
                ลองใหม่
              </Typography>
            </Box>
          ) : loading ? (
            "กำลังโหลดรายการตำแหน่ง..."
          ) : validOptions.length === 0 ? (
            "ไม่พบรายการตำแหน่ง"
          ) : (
            helperText || `พบตำแหน่ง ${validOptions.length} ตำแหน่ง`
          )}
        </Typography>
      )}

      {/* แสดงข้อมูลตำแหน่งที่เลือก (ถ้าเปิดใช้งาน) */}
      {showUserInfo && selectedUser && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "#f8f9fa",
            borderRadius: 1,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 500,
              mb: 1,
              fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
              color: "#333333",
            }}
          >
            ข้อมูลตำแหน่ง:
          </Typography>
          <Box
            sx={{
              fontSize: "14px",
              color: "#555555",
              lineHeight: 1.6,
              fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
            }}
          >
            <div>
              <strong>ชื่อตำแหน่ง:</strong> {selectedUser.name}
            </div>
            <div>
              <strong>ระดับ:</strong> {selectedUser.level}
            </div>
            <div>
              <strong>คำอธิบาย:</strong> {selectedUser.description}
            </div>
          </Box>
        </Box>
      )}
    </FormControl>
  );
};

export default SelectFieldsalutation;
