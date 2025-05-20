import React, { useState, useRef } from "react";
import { Box } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker"; // 👈 เปลี่ยนตรงนี้
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/th";
import FormLabel from "@services/FormLabel/FormLabel";

dayjs.locale("th");

const InputDateNoTime = ({ label, value, onChange, name }) => {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  return (
    <Box mt={-2}>
      <FormLabel>{label}</FormLabel>

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
        <DatePicker
          // ---------- กำหนดให้เลือกได้แค่วัน / เดือน / ปี ----------
          views={["year", "month", "day"]} // default ก็มีอยู่แล้ว แต่อยากระบุให้ชัด
          format="DD MMMM YYYY" // ไม่มี HH:mm
          // ---------- logic เปิด–ปิด ----------
          open={open}
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          inputRef={pickerRef}
          // ---------- ค่าและการคืนค่า ----------
          value={value ? dayjs(value) : null}
          onChange={(newVal) =>
            onChange({
              target: {
                name,
                // ส่ง ISO ที่ truncate เวลาให้เป็น 00:00:00 (หรือดัดแปลงตามที่ระบบคุณต้องการ)
                value: newVal ? newVal.startOf("day").toISOString() : "",
              },
            })
          }
          // ---------- สไตล์ ----------
          slotProps={{
            textField: {
              fullWidth: true,
              size: "small",
              InputProps: {
                sx: {
                  borderRadius: "10px",
                  "& fieldset": {
                    borderRadius: "10px",
                    borderColor: "#1120A3 !important",
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "#1120A3",
                    "&::placeholder": {
                      color: "#1120A3",
                      opacity: 1,
                    },
                  },
                },
              },
              inputProps: {
                readOnly: true,
                onClick: (e) => {
                  e.stopPropagation();
                  setOpen(true);
                },
              },
            },
          }}
        />
      </LocalizationProvider>
    </Box>
  );
};

export default InputDateNoTime;
