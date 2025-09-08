import React, { useEffect, useState, useRef } from "react";
import {
  Autocomplete,
  TextField,
  FormControl,
  Typography,
  CircularProgress,
  Box,
  InputAdornment,
  IconButton,
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
  // เพิ่มรองรับกรณี "อื่นๆ"
  otherText = "",
  onOtherTextChange = () => {},
  ...props
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inputText, setInputText] = useState(""); // สำหรับควบคุม input ของ autocomplete
  const inputRef = useRef();

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);
        setApiError(null);

  const positions = await GetOutgoingReportOptions("positions");
  const arr = Array.isArray(positions) ? positions : [];
  setOptions(arr);
      } catch (error) {
        setApiError("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPositions();
  }, []);

  // filter เฉพาะ name แบบ contains (real-time, case-insensitive)
  const filterOptions = (opts, params) => {
    const filterVal = params.inputValue.trim().toLowerCase();
    if (!filterVal) return opts;
    return opts.filter(opt =>
      opt.name && String(opt.name).toLowerCase().includes(filterVal)
    );
  };

  const getOptionFromValue = (val) => {
    if (!val) return null;
    if (typeof val === "object" && val.value) return val;
    return options.find((opt) => String(opt.value) === String(val)) || null;
  };

  // กด clear: ลบข้อความ input และค่าที่เลือก
  const handleClear = () => {
    setInputText("");
    setSelectedUser(null);
    onChange({ target: { name, value: "" } });
    onUserSelect(null);
  onOtherTextChange("");
    inputRef.current?.focus();
  };

  // แสดงชื่อ (level) (description)
  const formatOptionLabel = (opt) => {
    if (!opt || typeof opt !== "object") return "";
    const name = opt.name || "";
    const level = opt.level ? opt.level : "";
    const description = opt.description ? opt.description : "";
    return (
      <>
        {name}
        {level && (
          <span style={{ color: "#888", fontSize: "85%", marginLeft: 4 }}>({level})</span>
        )}
        {description && (
          <span style={{ color: "#888", fontSize: "85%", marginLeft: 4 }}>({description})</span>
        )}
      </>
    );
  };

  // สไตล์ option ใน dropdown
  const renderOption = (props, opt, { selected }) => (
    <Box
      component="li"
      {...props}
      sx={{
        fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
        fontSize: "16px",
        padding: "10px 16px",
        borderBottom: "1px solid #f0f0f0",
        bgcolor: selected ? "#e3f2fd" : "white",
        color: selected ? "#1976d2" : "#000",
        fontWeight: selected ? 500 : 400,
        "&:hover": {
          bgcolor: "#f5f7ff",
        },
        display: "flex",
        alignItems: "center",
      }}
    >
      <Typography
        variant="body1"
        sx={{
          fontWeight: selected ? 500 : 400,
          fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
          lineHeight: 1.4,
          display: "flex",
          alignItems: "center",
        }}
      >
        {formatOptionLabel(opt)}
      </Typography>
    </Box>
  );

  // เมื่อเลือกหรือพิมพ์
  const handleAutoChange = (event, newValue) => {
    // Always use the selected option's UUID (value). Do not allow arbitrary strings.
    let actualValue = "";
    let selectedObj = null;
    if (newValue && typeof newValue === "object") {
      actualValue = newValue.value || "";
      selectedObj = newValue;
    } else {
      // cleared or invalid selection
      actualValue = "";
      selectedObj = null;
    }
    setSelectedUser(selectedObj);
    const isOther = (newValue?.name || newValue?.label) === "อื่นๆ";
    setInputText(isOther ? otherText || "" : newValue?.name || "");
    if (!isOther) onOtherTextChange("");
    onChange({ target: { name, value: actualValue } });
    onUserSelect(selectedObj);
  };

  // สำหรับ autocomplete controlled input (search-only; do not sync with otherText)
  const handleInputChange = (event, newInputValue, reason) => {
    if (reason === "clear") {
      setInputText("");
    } else {
      setInputText(newInputValue);
    }
  };

  const handleRetry = () => {
    setApiError(null);
    setLoading(true);
    const fetchPositions = async () => {
      try {
        setLoading(true);
        setApiError(null);
        const positions = await GetOutgoingReportOptions("positions");
        setOptions(Array.isArray(positions) ? positions : []);
      } catch (error) {
        setApiError("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPositions();
  };

  // เงื่อนไขแสดงปุ่ม clear: show เฉพาะตอนมีค่า หรือมีข้อความ input
  const showClear = !!getOptionFromValue(value) || inputText.length > 0;

  // เงื่อนไข placeholder: ถ้ายังไม่พิมพ์หรือเลือกค่า ให้ label อยู่ตรงกลาง (textAlign:left)
  const showPlaceholderCenter = !inputText && !getOptionFromValue(value);

  // ไม่ sync otherText มาที่ช่อง Autocomplete เพื่อให้ผู้ใช้พิมพ์ในช่องเฉพาะ (ระบุตำแหน่ง (อื่นๆ))

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
          {required && <span style={{ color: "#d32f2f", marginLeft: 4 }}>*</span>}
        </Typography>
      )}
      <Autocomplete
  freeSolo={false}
  disableClearable
        options={options}
        loading={loading}
        filterOptions={filterOptions}
        getOptionLabel={option =>
          typeof option === "string" ? option : option.name || option.label || ""
        }
        value={getOptionFromValue(value)}
        inputValue={inputText}
        onInputChange={handleInputChange}
        onChange={handleAutoChange}
        isOptionEqualToValue={(option, v) => String(option.value) === String(v.value || v)}
        renderOption={renderOption}
        noOptionsText={
          loading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#666666",
                fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                px: 2,
                py: 1,
              }}
            >
              <CircularProgress size={16} />
              กำลังโหลดรายการตำแหน่ง...
            </Box>
          ) : apiError ? (
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
          ) : (
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
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label=""
            inputRef={inputRef}
            name={name}
            error={error || !!apiError}
            helperText={apiError || helperText}
            variant="outlined"
            disabled={disabled || loading}
            autoComplete="off"
            InputProps={{
              ...params.InputProps,
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
        endAdornment: (
                <>
          {params.InputProps.endAdornment}
                  {loading ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} sx={{ color: "#1120A3", ml: 1 }} />
                    </InputAdornment>
                  ) : null}
                  {showClear && (
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
                  )}
                </>
              ),
            }}
            inputProps={{
              ...params.inputProps,
              style: showPlaceholderCenter
                ? {
                    textAlign: "left",
                    fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                  }
                : {
                    fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                  },
            }}
            placeholder={
              ((getOptionFromValue(value)?.name || getOptionFromValue(value)?.label) === "อื่นๆ")
                ? "ระบุตำแหน่ง (อื่นๆ)"
                : showPlaceholderCenter
                ? inputLabel
                : ""
            }
          />
        )}
        {...props}
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
                  fontSize: "11px",
                }}
                onClick={handleRetry}
              >
                ลองใหม่
              </Typography>
            </Box>
          ) : loading ? (
            "กำลังโหลดรายการตำแหน่ง..."
          ) : options.length === 0 ? (
            "ไม่พบรายการตำแหน่ง"
          ) : (
            helperText || `พบตำแหน่ง ${options.length} ตำแหน่ง`
          )}
        </Typography>
      )}

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
              <strong>ชื่อตำแหน่ง:</strong> {selectedUser?.name}
            </div>
            <div>
              <strong>ระดับ:</strong> {selectedUser?.level}
            </div>
            <div>
              <strong>คำอธิบาย:</strong> {selectedUser?.description}
            </div>
          </Box>
        </Box>
      )}
    </FormControl>
  );
};

export default SelectFieldsalutation;