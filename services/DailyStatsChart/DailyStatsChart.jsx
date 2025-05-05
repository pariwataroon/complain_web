import React, { useState } from "react";
import { Box, Typography, TextField, Stack } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { formatThaiDateRange, formatDateWithThaiYear } from "@utils/Formats";
import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");

const mockData = [
  { date: "1 ม.ค.", value: 7, color: "#0a2cbd" },
  { date: "2 ม.ค.", value: 13, color: "#8686cc" },
  { date: "3 ม.ค.", value: 4, color: "#4299f3" },
  { date: "4 ม.ค.", value: 13, color: "#99ccff" },
  { date: "5 ม.ค.", value: 6, color: "#e6c266" },
  { date: "6 ม.ค.", value: 13, color: "#f4e6a4" },
  { date: "7 ม.ค.", value: 9, color: "#e18d85" },
];

const DailyStatsChart = () => {
  const [startDate, setStartDate] = useState(dayjs("2025-01-01"));
  const [endDate, setEndDate] = useState(dayjs("2025-01-07"));

  return (
    <Box sx={{ background: "#fff", borderRadius: 2, p: 3, boxShadow: 1 }}>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
      >
        <Typography variant="h6" fontWeight="bold" color="#001158">
          สถิติการเข้าชมเว็บไซต์รายวัน
          <br />
          <span style={{ fontWeight: "normal", fontSize: 14 }}>
            {formatThaiDateRange(startDate, endDate)}
          </span>
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
          <Stack direction="column" spacing={1}>
            <DatePicker
              label="ตั้งแต่"
              value={startDate}
              onChange={(value) => setStartDate(value)}
              format="D MMM BBBB"
              slotProps={{
                textField: {
                  size: "small",
                  variant: "outlined",
                },
              }}
            />
            <DatePicker
              label="ถึง"
              value={endDate}
              onChange={(value) => setEndDate(value)}
              format="D MMM BBBB" 
              slotProps={{
                textField: {
                  size: "small",
                  variant: "outlined",
                },
              }}
            />

          </Stack>
        </LocalizationProvider>
      </Stack>

      {/* Chart */}
      <Box mt={3} height={250}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              fill="#8884d8"
              label={{ position: "top", fill: "#555" }}
              isAnimationActive
            >
              {mockData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default DailyStatsChart;
