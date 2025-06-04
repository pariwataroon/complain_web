import React from "react";
import { styled } from "@mui/material/styles";
import { Box, FormControl, Select, MenuItem, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/* -------------------------------------------------------------------------- */
/*  styled components                                                         */
/* -------------------------------------------------------------------------- */
const StyledSelect = styled(Select)({
  height: "40px",
  color: "#1D40F8",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#B2B7FF",
    borderRadius: "12px",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#1D40F8",
  },
  "& .MuiSvgIcon-root": {
    color: "#1D40F8",
  },
  "& .MuiSelect-select": {
    paddingTop: 0,
    paddingBottom: 0,
    height: "40px",
    display: "flex",
    alignItems: "center",
  },
});

const StyledMenuItem = styled(MenuItem)({
  paddingTop: 4,
  paddingBottom: 4,
  fontSize: 14,
  minHeight: "unset",
});

/* -------------------------------------------------------------------------- */
/*  dropdown max‑height                                                       */
/* -------------------------------------------------------------------------- */
const ITEM_HEIGHT = 36;
const ITEM_PADDING_TOP = 8;
const menuProps = {
  PaperProps: {
    style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP },
  },
};

/* -------------------------------------------------------------------------- */
/*  SelectMenuService                                                         */
/* -------------------------------------------------------------------------- */
/**
 * @param {Object[]}  options       [{ label, value }]
 * @param {Function}  handleChange  (event) => void
 * @param {string}    value
 * @param {string}    width         css width (default auto)
 * @param {string}    name          input name
 */
const SelectMenuService = ({
  options = [],
  handleChange,
  value = "",
  width,
  name,
}) => {
  /* -------------------------- clear current value ------------------------- */
  const handleClear = () => {
    // ส่ง event จำลองให้ parent รับเหมือน onChange ปกติ
    handleChange({ target: { name, value: "" } });
  };

  return (
    <Box sx={{ position: "relative", width: width || "auto" }}>
      <FormControl variant="outlined" sx={{ width: "100%" }}>
        <StyledSelect
          value={value}
          onChange={handleChange}
          displayEmpty
          MenuProps={menuProps}
          name={name}
          renderValue={(selected) =>
            selected === "" ? (
              <span style={{ color: "#999" }}></span>
            ) : (
              options.find((o) => o.value === selected)?.label || ""
            )
          }
        >
          {options.map((option, idx) => (
            <StyledMenuItem key={idx} value={option.value}>
              {option.label}
            </StyledMenuItem>
          ))}
        </StyledSelect>
      </FormControl>

      {/* clear icon (show only when value is not empty) */}
      {value && (
        <IconButton
          size="small"
          onClick={handleClear}
          sx={{
            position: "absolute",
            right: 30,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#1D40F8",
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

export default SelectMenuService;
