import React, { useEffect, useState, useMemo } from "react";
import {
  MenuItem,
  TextField,
  FormControl,
  Typography,
  FormHelperText,
} from "@mui/material";
import styles from "./SelectFieldPAAOPM.module.scss";
import { GetDistricts, GetSubDistricts, GetOperatingChannel, GetCaseStatus, GetCaseType } from "@pages/api/opm/opm";

const SelectFieldPAAOPM = ({
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  variant = "outlined",
  size = "medium",
  options = [],
  placeholder,
  selectedProvince,
  selectedDistrict,
  ...otherProps
}) => {
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);
  const [operatingChannels, setOperatingChannels] = useState([]);
  const [caseStatuses, setCaseStatuses] = useState([]);
  const [caseTypes, setCaseTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const isChannelLocked = name === "channel";
  
  const provinceData = useMemo(() => [
    { "ID": "11", "Name": "กระบี่" },
    { "ID": "12", "Name": "กรุงเทพมหานคร" },
    { "ID": "13", "Name": "กาญจนบุรี" },
    { "ID": "14", "Name": "กาฬสินธุ์" },
    { "ID": "15", "Name": "กำแพงเพชร" },
    { "ID": "16", "Name": "ขอนแก่น" },
    { "ID": "17", "Name": "จันทบุรี" },
    { "ID": "18", "Name": "ฉะเชิงเทรา" },
    { "ID": "19", "Name": "ชลบุรี" },
    { "ID": "20", "Name": "ชัยนาท" },
    { "ID": "21", "Name": "ชัยภูมิ" },
    { "ID": "22", "Name": "ชุมพร" },
    { "ID": "25", "Name": "ตรัง" },
    { "ID": "26", "Name": "ตราด" },
    { "ID": "27", "Name": "ตาก" },
    { "ID": "90", "Name": "ต่างประเทศ" },
    { "ID": "28", "Name": "นครนายก" },
    { "ID": "29", "Name": "นครปฐม" },
    { "ID": "30", "Name": "นครพนม" },
    { "ID": "31", "Name": "นครราชสีมา" },
    { "ID": "32", "Name": "นครศรีธรรมราช" },
    { "ID": "33", "Name": "นครสวรรค์" },
    { "ID": "34", "Name": "นนทบุรี" },
    { "ID": "35", "Name": "นราธิวาส" },
    { "ID": "36", "Name": "น่าน" },
    { "ID": "91", "Name": "บึงกาฬ" },
    { "ID": "37", "Name": "บุรีรัมย์" },
    { "ID": "38", "Name": "ปทุมธานี" },
    { "ID": "39", "Name": "ประจวบคีรีขันธ์" },
    { "ID": "40", "Name": "ปราจีนบุรี" },
    { "ID": "41", "Name": "ปัตตานี" },
    { "ID": "42", "Name": "พระนครศรีอยุธยา" },
    { "ID": "43", "Name": "พะเยา" },
    { "ID": "44", "Name": "พังงา" },
    { "ID": "45", "Name": "พัทลุง" },
    { "ID": "46", "Name": "พิจิตร" },
    { "ID": "47", "Name": "พิษณุโลก" },
    { "ID": "51", "Name": "ภูเก็ต" },
    { "ID": "52", "Name": "มหาสารคาม" },
    { "ID": "53", "Name": "มุกดาหาร" },
    { "ID": "56", "Name": "ยะลา" },
    { "ID": "55", "Name": "ยโสธร" },
    { "ID": "58", "Name": "ระนอง" },
    { "ID": "59", "Name": "ระยอง" },
    { "ID": "60", "Name": "ราชบุรี" },
    { "ID": "57", "Name": "ร้อยเอ็ด" },
    { "ID": "61", "Name": "ลพบุรี" },
    { "ID": "62", "Name": "ลำปาง" },
    { "ID": "63", "Name": "ลำพูน" },
    { "ID": "65", "Name": "ศรีสะเกษ" },
    { "ID": "66", "Name": "สกลนคร" },
    { "ID": "67", "Name": "สงขลา" },
    { "ID": "68", "Name": "สตูล" },
    { "ID": "69", "Name": "สมุทรปราการ" },
    { "ID": "70", "Name": "สมุทรสงคราม" },
    { "ID": "71", "Name": "สมุทรสาคร" },
    { "ID": "73", "Name": "สระบุรี" },
    { "ID": "72", "Name": "สระแก้ว" },
    { "ID": "74", "Name": "สิงห์บุรี" },
    { "ID": "76", "Name": "สุพรรณบุรี" },
    { "ID": "77", "Name": "สุราษฎร์ธานี" },
    { "ID": "78", "Name": "สุรินทร์" },
    { "ID": "75", "Name": "สุโขทัย" },
    { "ID": "79", "Name": "หนองคาย" },
    { "ID": "80", "Name": "หนองบัวลำภู" },
    { "ID": "82", "Name": "อำนาจเจริญ" },
    { "ID": "83", "Name": "อุดรธานี" },
    { "ID": "84", "Name": "อุตรดิตถ์" },
    { "ID": "85", "Name": "อุทัยธานี" },
    { "ID": "86", "Name": "อุบลราชธานี" },
    { "ID": "81", "Name": "อ่างทอง" },
    { "ID": "23", "Name": "เชียงราย" },
    { "ID": "24", "Name": "เชียงใหม่" },
    { "ID": "48", "Name": "เพชรบุรี" },
    { "ID": "49", "Name": "เพชรบูรณ์" },
    { "ID": "64", "Name": "เลย" },
    { "ID": "50", "Name": "แพร่" },
    { "ID": "54", "Name": "แม่ฮ่องสอน" }
  ], []);

  // เรียก API ดึงข้อมูลประเภทของเคสเมื่อ name === "type"
  useEffect(() => {
    if (name === "type") {
      const fetchCaseTypes = async () => {
        try {
          setLoading(true);

          const result = await GetCaseType();
          if (result && result.success && result.data && Array.isArray(result.data)) {
            setCaseTypes(result.data);
          } else {
            setCaseTypes([]);
            console.error("Failed to fetch case types:", result?.message);
          }
        } catch (error) {
          console.error("Error fetching case types:", error);
          setCaseTypes([]);
        } finally {
          setLoading(false);
        }
      };

      fetchCaseTypes();
    } else if (name === "type") {
      setCaseTypes([]);
    }
  }, [name]);

  // เรียก API ดึงข้อมูลอำเภอเมื่อมีการเลือกจังหวัด
  useEffect(() => {
    if (name === "district" && selectedProvince) {
      const fetchDistricts = async () => {
        try {
          setLoading(true);

          const result = await GetDistricts(selectedProvince);
          if (result && result.success && result.data && Array.isArray(result.data)) {
            setDistricts(result.data);
          } else {
            setDistricts([]);
            console.error("Failed to fetch districts:", result?.message);
          }
        } catch (error) {
          console.error("Error fetching districts:", error);
          setDistricts([]);
        } finally {
          setLoading(false);
        }
      };

      fetchDistricts();
    } else if (name === "district") {
      setDistricts([]);
    }
  }, [name, selectedProvince]);

  // เรียก API ดึงข้อมูลตำบลเมื่อมีการเลือกอำเภอ
  useEffect(() => {
    if (name === "subdistrict" && selectedDistrict) {
      const fetchSubDistricts = async () => {
        try {
          setLoading(true);

          const result = await GetSubDistricts(selectedDistrict);
          if (result && result.success && result.data && Array.isArray(result.data)) {
            setSubDistricts(result.data);
          } else {
            setSubDistricts([]);
            console.error("Failed to fetch sub-districts:", result?.message);
          }
        } catch (error) {
          console.error("Error fetching sub-districts:", error);
          setSubDistricts([]);
        } finally {
          setLoading(false);
        }
      };

      fetchSubDistricts();
    } else if (name === "subdistrict") {
      setSubDistricts([]);
    }
  }, [name, selectedDistrict]);

  // เรียก API ดึงข้อมูล Operating Channel
  useEffect(() => {
    if (name === "channel") {
      const fetchOperatingChannels = async () => {
        try {
          setLoading(true);

          const result = await GetOperatingChannel();
          if (result && result.success && result.data && Array.isArray(result.data)) {
            setOperatingChannels(result.data);
          } else {
            setOperatingChannels([]);
            console.error("Failed to fetch operating channels:", result?.message);
          }
        } catch (error) {
          console.error("Error fetching operating channels:", error);
          setOperatingChannels([]);
        } finally {
          setLoading(false);
        }
      };

      fetchOperatingChannels();
    } else if (name === "channel") {
      setOperatingChannels([]);
    }
  }, [name]);

  // เรียก API ดึงข้อมูล Case Status
  useEffect(() => {
    if (name === "status") {
      const fetchCaseStatuses = async () => {
        try {
          setLoading(true);

          const result = await GetCaseStatus();
          if (result && result.success && result.data && Array.isArray(result.data)) {
            setCaseStatuses(result.data);
          } else {
            setCaseStatuses([]);
            console.error("Failed to fetch case statuses:", result?.message);
          }
        } catch (error) {
          console.error("Error fetching case statuses:", error);
          setCaseStatuses([]);
        } finally {
          setLoading(false);
        }
      };

      fetchCaseStatuses();
    } else if (name === "status") {
      setCaseStatuses([]);
    }
  }, [name]);

  const handleDropdownChange = (event) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  // จัดการข้อมูล options ตาม name
  const allOptions = useMemo(() => {
    // ถ้ามี options ส่งเข้ามาและไม่ว่างเปล่า ให้ใช้ options นั้นก่อน
    if (options && options.length > 0) {
      return options;
    }

    switch (name) {
      case "province":
        return provinceData.map(province => ({
          value: province.ID,
          label: province.Name
        }));
      case "district":
        return districts.map(district => ({
          value: district.ID,
          label: district.Name
        }));
      case "subdistrict":
        return subDistricts.map(subDistrict => ({
          value: subDistrict.ID,
          label: subDistrict.Name
        }));
      case "channel":
        return operatingChannels
          .filter(channel => channel.val === "6")
          .map(channel => ({
            value: channel.val,
            label: channel.text
          }));
      case "status":
        const apiStatuses = caseStatuses
          .sort((a, b) => (a.seq || 0) - (b.seq || 0))
          .map(status => ({
            value: status.val || status.value || status.ID,
            label: status.text || status.label || status.Name
          }));
        const additionalStatuses = [
          { value: "88", label: "อยู่ระหว่างดำเนินการ" },
          { value: "99", label: "ยุติเรื่อง" }
        ];
        return [...apiStatuses, ...additionalStatuses];
      case "type":
        return caseTypes.map(caseType => ({
          value: caseType.val,
          label: caseType.text
        }));
      default:
        return options;
    }
  }, [name, provinceData, districts, subDistricts, operatingChannels, caseStatuses, caseTypes, options]);

  const isFieldDisabled = disabled || loading;

  // ปรับ placeholder text ตาม name และสถานะ loading
  const getPlaceholderText = () => {
    if (loading) {
      switch (name) {
        case "district":
          return "กำลังโหลดข้อมูลอำเภอ...";
        case "subdistrict":
          return "กำลังโหลดข้อมูลตำบล...";
        case "channel":
          return "กำลังโหลดข้อมูลช่องทาง...";
        case "status":
          return "กำลังโหลดข้อมูลสถานะ...";
        case "type":
          return "กำลังโหลดข้อมูลประเภท...";
        default:
          return "กำลังโหลด...";
      }
    }

    if (placeholder) return placeholder;

    switch (name) {
      case "province":
        return "เลือกจังหวัด";
      case "district":
        return selectedProvince ? "เลือกอำเภอ" : "กรุณาเลือกจังหวัดก่อน";
      case "subdistrict":
        return selectedDistrict ? "เลือกตำบล" : "กรุณาเลือกอำเภอก่อน";
      case "channel":
        return "เลือกช่องทางดำเนินการ";
      case "status":
        return "เลือกสถานะการดำเนินการ";
      case "type":
        return "เลือกประเภทของเคส";
      default:
        return `เลือก${label || ""}`;
    }
  };

  const placeholderText = getPlaceholderText();

  return (
    <FormControl
      fullWidth={fullWidth}
      variant={variant}
      error={error}
      disabled={isFieldDisabled}
      sx={{ mb: 2 }}
      className={`${styles.selectFormControl} ${loading ? styles.loading : ''}`}
    >
      {label && (
        <Typography
          variant="subtitle2"
          className={styles.selectLabel}
          sx={{
            color: error ? "#ef4444" : "#334155",
            fontWeight: 600,
            mb: 1,
            opacity: isFieldDisabled ? 0.6 : 1,
          }}
        >
          {label}
          {required && !isFieldDisabled && (
            <span className={styles.requiredAsterisk}> *</span>
          )}
        </Typography>
      )}

      <TextField
        select
        displayEmpty
        name={name}
        value={isChannelLocked ? "6" : (value || "")}
        onChange={isChannelLocked ? undefined : (onChange || handleDropdownChange)}
        disabled={isChannelLocked ? true : isFieldDisabled}
        error={error}
        size={size}
        placeholder={placeholderText}
        className={styles.selectTextField}
        SelectProps={{
          displayEmpty: true,
          renderValue: (selected) => {
            if (!selected || selected === "") {
              return (
                <span style={{
                  color: loading ? "#6b7280" : "#9ca3af",
                  fontStyle: loading ? "italic" : "normal",
                  fontSize: "inherit"
                }}>
                  {placeholderText}
                </span>
              );
            }

            const selectedOption = allOptions.find(opt =>
              (typeof opt === "object" ? opt.value : opt) === selected
            );

            if (selectedOption) {
              return typeof selectedOption === "object" ? selectedOption.label : selectedOption;
            }

            return selected;
          },
          ...otherProps.SelectProps,
        }}
        InputProps={{
          sx: {
            height: "40px",
            borderRadius: "12px",
            color: "#000000",
            backgroundColor: isFieldDisabled ? "#f8fafc" : "transparent",
            "& fieldset": {
              borderColor: error ? "#ef4444" : "#1120A3",
              borderWidth: error ? "2px" : "1.5px",
            },
            "&:hover fieldset": {
              borderColor: error ? "#dc2626" : "#0d1a85",
            },
            "&.Mui-focused fieldset": {
              borderColor: error ? "#ef4444" : "#1120A3",
              borderWidth: "2px",
              boxShadow: error
                ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
                : "0 0 0 3px rgba(17, 32, 163, 0.15)",
            },
            "& .MuiSelect-icon": {
              color: error ? "#ef4444" : "#1120A3",
            },
          },
          ...otherProps.InputProps,
        }}
        {...otherProps}
      >
        {allOptions.length === 0 && !loading && (
          <MenuItem disabled className={`${styles.selectMenuItem} ${styles.empty}`}>
            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
              {name === "district" && !selectedProvince && "กรุณาเลือกจังหวัดก่อน"}
              {name === "subdistrict" && !selectedDistrict && "กรุณาเลือกอำเภอก่อน"}
              {name === "district" && selectedProvince && "ไม่พบข้อมูลอำเภอ"}
              {name === "subdistrict" && selectedDistrict && "ไม่พบข้อมูลตำบล"}
              {name === "channel" && "ไม่พบข้อมูลช่องทางดำเนินการ"}
              {name === "province" && "ไม่พบข้อมูลจังหวัด"}
              {name === "type" && "ไม่พบข้อมูลประเภท"}
              {!["province", "district", "subdistrict", "channel", "type"].includes(name) && "ไม่พบข้อมูล"}
            </span>
          </MenuItem>
        )}

        {loading && (
          <MenuItem disabled className={`${styles.selectMenuItem} ${styles.loading}`}>
            <span style={{ color: "#6b7280", fontStyle: "italic" }}>
              กำลังโหลดข้อมูล...
            </span>
          </MenuItem>
        )}

        {allOptions.map((opt, idx) => {
          const isPrimitive = typeof opt !== "object" || opt === null;
          const optionValue = isPrimitive ? opt : opt.value;
          const optionLabel = isPrimitive ? String(opt) : String(opt.label);
          const isDisabled = isPrimitive ? false : opt.disabled ?? false;

          return (
            <MenuItem
              key={`${name}-${optionValue}-${idx}`} // เพิ่ม name ใน key เพื่อป้องกัน conflict
              value={optionValue}
              disabled={isDisabled}
              className={styles.selectMenuItem}
              sx={{
                color: isDisabled ? "#94a3b8" : "#000000",
                fontStyle: isDisabled ? "italic" : "normal",
                "&:hover": {
                  backgroundColor: isDisabled ? "transparent" : "#f1f5f9",
                },
                "&.Mui-selected": {
                  backgroundColor: "#e0f2fe",
                  color: "#0891b2",
                  "&:hover": {
                    backgroundColor: "#bae6fd",
                  },
                },
              }}
            >
              {optionLabel}
            </MenuItem>
          );
        })}
      </TextField>

      {helperText && (
        <FormHelperText
          error={error}
          className={styles.selectHelperText}
          sx={{
            marginLeft: "6px",
            marginTop: "8px",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            "&.Mui-error": {
              color: "#ef4444",
              fontWeight: 500,
              "&::before": {
                content: "'⚠'",
                marginRight: "6px",
                fontSize: "1rem",
              },
            },
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default SelectFieldPAAOPM;