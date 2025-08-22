import React, { useEffect, useState } from "react";
import {
  MenuItem,
  TextField,
  FormControl,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./SelectFieldpositionOpts.module.scss";

const SelectFieldpositionOpts = ({
  label,
  inputLabel,
  value,
  onChange = () => { },
  name,
  options: externalOptions = [],
  optionMapper = null,
}) => {
  const [options, setOptions] = useState([]);
  console.log({ options });
  
  useEffect(() => {
    if (externalOptions && externalOptions.length > 0) {
      const cleanedOptions = externalOptions
        .filter((opt) => {
          if (typeof opt === "object" && opt !== null) {
            return opt.value !== undefined;
          }
          return typeof opt === "string" || typeof opt === "number";
        })
        .map((opt, index) => {
          if (typeof opt === "object" && opt !== null) {
            return {
              ...opt,
              value: String(opt.value ?? ""),
              label: String(opt.label ?? opt.displayLabel ?? opt.value ?? ""),
              uniqueId: opt.uniqueId || String(opt.value ?? "") || `opt_${index}`,
              sortOrder: opt.sortOrder !== undefined ? opt.sortOrder : index,
            };
          }
          return {
            value: String(opt),
            label: String(opt),
            uniqueId: `opt_${index}`,
            sortOrder: index,
          };
        });

      cleanedOptions.sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? a.sortOrder : 999;
        const orderB = b.sortOrder !== undefined ? b.sortOrder : 999;
        return orderA - orderB;
      });

      const mapped = optionMapper ? cleanedOptions.map(optionMapper) : cleanedOptions;

      setOptions(mapped);
    }
  }, [externalOptions, optionMapper]);

  // **Force value เป็น string UUID เสมอ**
  const selectedValue = value == null ? "" : String(value);

  // log เพื่อตรวจสอบ
  console.log("selectedValue:", selectedValue);
  console.log("option values:", options.map(o => o.value));

  const hasValue = selectedValue !== "";

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { name, value: "" } });
  };

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
        SelectProps={{ native: false }}
        displayEmpty
        name={name}
        value={selectedValue}
        onChange={(e) => {
          onChange({ target: { name, value: String(e.target.value) } });
        }}
        renderValue={(selected) => {
          const selectedOption = options.find((opt) => opt.value === selected);
          if (!selectedOption || selected === "") {
            return (
              <span className={styles.selectPlaceholder}>
                {label || inputLabel}
              </span>
            );
          }
          return selectedOption.displayLabel || selectedOption.label || selectedOption.value;
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
          endAdornment: hasValue && (
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
      >
        {options.map((opt, index) => (
          <MenuItem key={`${opt.value}_${index}`} value={opt.value}>
            {opt.displayLabel || opt.label || opt.value}
          </MenuItem>
        ))}
      </TextField>
    </FormControl>
  );
};

export default SelectFieldpositionOpts;