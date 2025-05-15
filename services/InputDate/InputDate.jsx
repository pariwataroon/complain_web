import React, { useState, useRef } from "react";
import { Box } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/th";
import FormLabel from "@services/FormLabel/FormLabel";

dayjs.locale("th");

const InputDate = ({ label, value, onChange, name }) => {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef();

  return (
    <Box mt={-2}>
      <FormLabel>{label}</FormLabel>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
        <DateTimePicker
          ampm={false}
          open={open}
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          inputRef={pickerRef}
          format="DD MMMM YYYY HH:mm"
          value={value ? dayjs(value) : null}
          onChange={(newVal) =>
            onChange({ target: { name, value: newVal?.toISOString() || "" } })
          }
          slotProps={{
            textField: {
              fullWidth: true,
              size: "small",
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

export default InputDate;
