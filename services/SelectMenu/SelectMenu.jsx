import React from "react";
import { styled } from "@mui/material/styles";
import { FormControl, Select, MenuItem } from "@mui/material";

// กำหนด StyledSelect สำหรับปรับสไตล์ของ Select
const StyledSelect = styled(Select)(({ theme }) => ({
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

// กำหนด StyledMenuItem เพื่อลด padding และทำให้ความสูงของรายการลดลง
const StyledMenuItem = styled(MenuItem)(() => ({
  paddingTop: 4,
  paddingBottom: 4,
  fontSize: 14,
  minHeight: "unset",
}));

// กำหนด menuProps สำหรับควบคุมความสูงของ Dropdown
const ITEM_HEIGHT = 36;
const ITEM_PADDING_TOP = 8;
const menuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, // ตัวอย่าง: แสดงได้ 4.5 รายการแล้วเลื่อนสกอลล์
    },
  },
};

/**
 * SelectMenuService - บริการเลือกสรร
 * รับ props: options, handleChange, value, width
 */
const SelectMenuService = ({ options, handleChange, value, width }) => {
  return (
    <FormControl variant="outlined" sx={{ width: width || "auto" }}>
      {/* เอา InputLabel ออกเพื่อไม่ให้ “ตัวเลือก” ลอยอยู่ด้านบน */}
      <StyledSelect
        value={value}
        onChange={handleChange}
        displayEmpty
        MenuProps={menuProps}
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
          <StyledMenuItem key={index} value={option.value}>
            {option.label}
          </StyledMenuItem>
        ))}
      </StyledSelect>
    </FormControl>
  );
};

export default SelectMenuService;
