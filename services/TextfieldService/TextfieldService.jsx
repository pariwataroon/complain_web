// TextfieldService.js
import React from "react";
import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px", // ขอบโค้งมน
    height: "40px", // กำหนดความสูงของคอมโพเนนต์
    "& fieldset": {
      borderColor: "#B2B7FF", // สีม่วงอ่อนตามภาพ
    },
    "&:hover fieldset": {
      borderColor: "#B2B7FF", // สีขอบเมื่อ hover
    },
    "&.Mui-focused fieldset": {
      borderColor: "#1D40F8", // สีขอบเมื่อ focused
    },
    "& .MuiOutlinedInput-input": {
      height: "40px", // กำหนดความสูงของ input เอง
      padding: "0 14px", // ลด padding ให้เหมาะสม
      boxSizing: "border-box",
    },
  },
}));

/**
 * TextfieldService - บริการรับข้อความที่เปี่ยมด้วยความงาม
 * รับ props:
 * - placeholder: ข้อความ placeholder ที่จะแสดงในช่องกรอก
 * - value: ค่าที่จะแสดงใน TextField
 * - onChange: ฟังก์ชันเรียกเมื่อมีการเปลี่ยนแปลง
 * - props: props อื่น ๆ ตามใจปรารถนา
 */
const TextfieldService = ({
  value,
  onChange,
  placeholder = "Enter text",
  ...props
}) => {
  return (
    <StyledTextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variant="outlined"
      fullWidth
      {...props}
    />
  );
};

export default TextfieldService;
