import React from "react";
import { Autocomplete, TextField, FormControl, Typography } from "@mui/material";

const InputTags = ({
  label,
  value = [],
  onChange,
  name,
  disabled,
  placeholder,
  ...props
}) => {
  return (
    <FormControl fullWidth sx={{ mb: 2 }}>
      {label && (
        <Typography
          variant="subtitle2"
          sx={{ color: "#1120A3", fontWeight: 600, mb: 1 }}
        >
          {label}
        </Typography>
      )}
      <Autocomplete
        multiple
        freeSolo
        options={[]}
        value={value}
        onChange={(event, newValue) => {
          onChange({
            target: {
              name,
              value: newValue,
            },
          });
        }}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              backgroundColor: disabled ? "#E8E9F6" : "white",
              "& .MuiOutlinedInput-root": {
                color: "#1120A3",
                "& fieldset": {
                  borderColor: "#1120A3",
                },
              },
            }}
          />
        )}
        {...props}
      />
    </FormControl>
  );
};

export default InputTags;
