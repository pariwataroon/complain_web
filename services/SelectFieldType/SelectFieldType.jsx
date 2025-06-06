import React, { useEffect, useState } from "react";
import { MenuItem, TextField, FormControl, Typography } from "@mui/material";
import styles from "./SelectFieldTypeType.module.scss";

const SelectFieldType = ({
  label,
  inputLabel,
  name,
  value,
  onChange = () => { },
  options: externalOptions = [],
  optionMapper = null,
}) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const mapped = optionMapper
      ? externalOptions.map(optionMapper)
      : externalOptions;
    setOptions(mapped);
  }, [externalOptions, optionMapper]);

 

  const allOptions = [
    { value: "", label: label || inputLabel, disabled: true },
    ...options,
  ];

  const selectedValue =
    allOptions.find(opt => opt.label === value)?.value ?? "";

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
          const picked = allOptions.find((opt) =>
            typeof opt === "object"
              ? opt.value === e.target.value
              : opt === e.target.value
          );
          onChange({ target: { name, value: picked?.label ?? e.target.value } });
        }}
        renderValue={(selected) => {
          const selOpt = allOptions.find((opt) =>
            typeof opt === "object"
              ? opt.value === selected
              : opt === selected
          );
          if (!selOpt || selOpt.value === "") {
            return (
              <span className={styles.selectPlaceholder}>
                {label || inputLabel}
              </span>
            );
          }
          return selOpt.label;
        }}
        InputProps={{
          sx: {
            height: "40px",
            borderRadius: "10px",
            color: "#1120A3",
            "& fieldset": { borderColor: "#1120A3" },
          },
        }}
      >
        {allOptions.map((opt, idx) => (
          <MenuItem
            key={idx}
            value={typeof opt === "object" ? opt.value : opt}
            disabled={typeof opt === "object" ? opt.disabled : false}
          >
            {typeof opt === "object" ? opt.label : opt}
          </MenuItem>
        ))}
      </TextField>
    </FormControl>
  );
};

export default SelectFieldType;
