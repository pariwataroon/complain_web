import React, { useEffect, useState } from "react";
import {
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Typography,
} from "@mui/material";
import { GetProvincesSelect, GetAmphuresSelect, GetDistrictsSelect, GetZipcodeSelect } from "@pages/api/allselect/allselect";
import styles from "./SelectField.module.scss";

const SelectField = ({
  label,
  inputLabel,
  value,
  onChange = () => {},
  name,
  districtCode,
  amphureCode,
  provinceCode,
  zipcodeCode,
  options: externalOptions = [],
  optionMapper = null,
}) => {
    const [options, setOptions] = useState([]);
    const allOptions = [
        { value: "", label: label || inputLabel, disabled: true },
        ...options,
    ];
    const selectedValue = typeof value === "object"
        ? value?.value ?? ""
        : value ?? "";


  useEffect(() => {
    const fetchOptions = async () => {
      if (
        (label === "อำเภอ/เขต" && !provinceCode) ||
        (label === "ตำบล/แขวง" && !amphureCode) ||
        (label === "รหัสไปรษณีย์" && !amphureCode)
      ) {
        return;
      }

      if (externalOptions && externalOptions.length > 0) {
        const mapped = optionMapper
          ? externalOptions.map(optionMapper)
          : externalOptions;
        setOptions(mapped);
        return;
      }

      try {
        let response = null;

        if (label === "จังหวัด") {
          response = await GetProvincesSelect();
        } else if (label === "อำเภอ/เขต") {
          response = await GetAmphuresSelect(provinceCode);
        } else if (label === "ตำบล/แขวง") {
          response = await GetDistrictsSelect(amphureCode);
        } else if (label === "รหัสไปรษณีย์") {
          const districts = await GetDistrictsSelect(amphureCode);
          const zipMap = new Map();
          districts.forEach((item) => {
            if (item.zip_code && !zipMap.has(item.zip_code)) {
              zipMap.set(item.zip_code, item);
            }
          });
          response = Array.from(zipMap.values());
        }

        const finalResponse = Array.isArray(response) ? response : [];
        const mapped = optionMapper
          ? finalResponse.map(optionMapper)
          : finalResponse;
        setOptions(mapped);
      } catch (error) {
        console.error("Failed to fetch or map options:", error);
        setOptions([]);
      }
    };

    fetchOptions();
  }, [label, districtCode, amphureCode, provinceCode]);

  useEffect(() => {
    if (!provinceCode) return;

    if (
      label === "อำเภอ/เขต" ||
      label === "ตำบล/แขวง" ||
      label === "รหัสไปรษณีย์"
    ) {
      onChange({ target: { name, value: "" } });
    }
  }, [provinceCode]);

  useEffect(() => {
    if (!amphureCode) return;

    if (label === "ตำบล/แขวง" || label === "รหัสไปรษณีย์") {
      onChange({ target: { name, value: "" } });
    }
  }, [amphureCode]);

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
                select
                displayEmpty
                name={name}
                value={selectedValue}
                onChange={(e) => {
                    const selected = allOptions.find((opt) =>
                        typeof opt === "object"
                            ? opt.value === e.target.value
                            : opt === e.target.value
                    );
                    onChange({ target: { name, value: selected ?? e.target.value } });
                }}
                renderValue={(selected) => {
                    const selectedOption = allOptions.find((opt) =>
                        typeof opt === "object"
                            ? opt.value === selected
                            : opt === selected
                    );

                    if (!selectedOption || selectedOption.value === "") {
                        return (
                            <span className={styles.selectPlaceholder}>
                                {label || inputLabel}
                            </span>
                        );
                    }

                    return selectedOption.label;
                }}
                                    
                InputProps={{
                    sx: {
                        height: "40px",
                        borderRadius: "10px",
                        color: "#1120A3",
                        "& fieldset": {
                            borderColor: "#1120A3",
                        },
                    },
                }}
            >
                {allOptions.map((opt, idx) => {
                    const isPrimitive = typeof opt !== "object";
                    const optionValue = isPrimitive ? opt : opt.value;
                    const optionLabel = isPrimitive ? String(opt) : String(opt.label);
                    const isDisabled = isPrimitive ? false : opt.disabled ?? false;

                    return (
                        <MenuItem key={idx} value={optionValue} disabled={isDisabled}>
                            {optionLabel}
                        </MenuItem>
                    );
                })}
            </TextField>
        </FormControl>
    );
};

export default SelectField;
