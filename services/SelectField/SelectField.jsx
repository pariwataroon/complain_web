import React from "react";
import { MenuItem, TextField, FormControl, Typography } from "@mui/material";

const SelectField = ({
  label,
  value,
  onChange,
  options = [], // คาดเป็น [{value, label}, ...]
  name,
}) => {
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
        name={name}
        value={value}
        onChange={onChange}
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
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    </FormControl>
  );
};

export default SelectField;
