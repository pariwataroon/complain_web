// SelectMenuService.js
import React from "react";
import { styled } from "@mui/material/styles";
import { FormControl, Select, MenuItem } from "@mui/material";

const StyledSelect = styled(Select)(({ theme }) => ({
  minWidth: 200,
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
  // ปรับสไตล์ให้ข้อความภายในเลือกมีความสูง 40px
  "& .MuiSelect-select": {
    paddingTop: "0px",
    paddingBottom: "0px",
    height: "40px",
    display: "flex",
    alignItems: "center",
  },
}));

/**
 * SelectMenuService - บริการเลือกสรร
 * รับ props: options, handleChange, value
 */
const SelectMenuService = ({ options, handleChange, value }) => {
  return (
    <FormControl variant="outlined">
      {/* เอา InputLabel ออก เพื่อไม่ให้ “ตัวเลือก” ลอยอยู่ด้านบน */}
      <StyledSelect
        value={value}
        onChange={handleChange}
        displayEmpty // หากอยากแสดงค่าเปล่าในตอนแรก
        renderValue={(selected) => {
          // ถ้าไม่เลือกอะไรเลย ให้ขึ้นเป็นข้อความ placeholder
          if (selected === "") {
            return <span style={{ color: "#999" }}>-- เลือกตัวเลือก --</span>;
          }
          return (
            options.find((option) => option.value === selected)?.label || ""
          );
        }}
      >
        {options.map((option, index) => (
          <MenuItem key={index} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </StyledSelect>
    </FormControl>
  );
};

export default SelectMenuService;
