import React, { useEffect, useState } from "react";
import {
  Autocomplete,
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
  onChange = () => {},
  name = "signer",
  error = false,
  helperText = "",
  required = false,
  disabled = false,
  onUserSelect = () => {},
  onDepartmentChange = () => {},
  showUserInfo = false,
  ...props
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inputText, setInputText] = useState("");

  // ดึงข้อมูลผู้ลงนาม
  const fetchSignatureAuthorities = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const authorities = await GetAllSignatureAuthorities();
      if (authorities && authorities.length > 0) {
        setOptions(authorities);
      } else {
        setOptions([]);
      }
    } catch (error) {
      setApiError("ไม่สามารถโหลดข้อมูลผู้ลงนามได้");
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignatureAuthorities();
  }, []);

  // filter real-time
  const filterOptions = (opts, params) => {
    const filterVal = params.inputValue.trim().toLowerCase();
    if (!filterVal) return opts;
    return opts.filter(opt =>
      opt.label && String(opt.label).toLowerCase().includes(filterVal)
    );
  };

  // หา option จาก value (รองรับ object หรือ string)
  const getOptionFromValue = (val) => {
    if (!val) return null;
    if (typeof val === "object" && val.value) return val;
    return options.find((opt) => String(opt.value) === String(val)) || null;
  };

  // handle clear
  const handleClear = () => {
    setInputText("");
    setSelectedUser(null);
    onChange({ target: { name, value: "" } });
    onUserSelect(null);
    onDepartmentChange(null);
  };

  // handle select
  const handleAutoChange = (event, newValue) => {
    let actualValue = "";
    let selectedObj = null;
    if (newValue && typeof newValue === "object") {
      actualValue = newValue.value || "";
      selectedObj = newValue;
    } else {
      actualValue = "";
      selectedObj = null;
    }
    setSelectedUser(selectedObj);
    setInputText(newValue?.label || "");
    onChange({ target: { name, value: actualValue } });
    onUserSelect(selectedObj);
    // ส่งข้อมูล department ไปด้วย
    if (selectedObj && selectedObj.department) {
      onDepartmentChange({
        id: selectedObj.departmentId,
        name: selectedObj.departmentName,
      });
    } else {
      onDepartmentChange(null);
    }
  };

  // handle input change
  const handleInputChange = (event, newInputValue, reason) => {
    if (reason === "clear") {
      setInputText("");
    } else {
      setInputText(newInputValue);
    }
  };

  // retry
  const handleRetry = () => {
    setApiError(null);
    setLoading(true);
    fetchSignatureAuthorities();
  };

  // เงื่อนไขแสดงปุ่ม clear (custom, ไม่ใช้ของ MUI)
  const showClear = !!getOptionFromValue(value) || inputText.length > 0;
  const showPlaceholderCenter = !inputText && !getOptionFromValue(value);

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
      <Autocomplete
        options={options}
        loading={loading}
        filterOptions={filterOptions}
        getOptionLabel={option =>
          typeof option === "string" ? option : option.label || option.value || ""
        }
        value={getOptionFromValue(value)}
        inputValue={inputText}
        onInputChange={handleInputChange}
        onChange={handleAutoChange}
        isOptionEqualToValue={(option, v) => String(option.value) === String(v.value || v)}
        disableClearable // ปิดปุ่ม X ของ MUI
        renderOption={(props, opt, { selected }) => (
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
              {opt.label}
              {showUserInfo && opt.departmentName && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#666666",
                    display: "block",
                    fontSize: "13px",
                    marginLeft: "10px",
                    fontFamily: "'Sarabun', 'Noto Sans Thai', Arial, sans-serif",
                  }}
                >
                  {opt.departmentName}
                </Typography>
              )}
            </Typography>
          </Box>
        )}
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
              กำลังโหลดรายชื่อผู้ลงนาม...
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
                ไม่พบรายชื่อผู้ลงนาม
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
              showPlaceholderCenter
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
            "กำลังโหลดรายชื่อผู้ลงนาม..."
          ) : options.length === 0 ? (
            "ไม่พบรายชื่อผู้ลงนาม"
          ) : (
            helperText || `พบผู้ลงนาม ${options.length} คน`
          )}
        </Typography>
      )}
    </FormControl>
  );
};

export default SelectFieldSignatureAuthority;
