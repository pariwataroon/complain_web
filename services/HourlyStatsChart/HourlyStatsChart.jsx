import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { formatThaiBuddhistYear } from "@utils/Formats";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styles from "./HourlyStatsChart.module.scss";

const chartData = [
  { time: "00.00 - 03.59 u.", value: 60 },
  { time: "04.00 - 07.59 u.", value: 65 },
  { time: "08.00 - 11.59 u.", value: 70 },
  { time: "12.00 - 15.59 u.", value: 80 },
  { time: "16.00 - 19.59 u.", value: 75 },
  { time: "20.00 - 23.59 u.", value: 60 },
];

const HourlyStatsChart = () => {
  const [date, setDate] = useState(new Date("2025-01-07"));

  return (
    <Box
      sx={{ background: "#fff", borderRadius: 2, p: 2, boxShadow: 1 }}
      className={styles.hourlyStats}
    >
      <div className={styles.header}>
        <div className={styles.leftSide}>
          <Typography variant="h6" fontWeight="bold" className={styles.main}>
            สถิติการเข้าชมเว็บไซต์รายชั่วโมง
          </Typography>
          <Typography variant="subtitle1" className={styles.sub}>
            ณ วันที่ {formatThaiBuddhistYear(date)}
          </Typography>
        </div>
        <div className={styles.rightSide}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div className={styles.dateGroup}>
              <div className={styles.dateRow}>
                <span className={styles.rowLabel}>วันที่</span>
                <DatePicker
                  value={date}
                  onChange={(newDate) => setDate(newDate)}
                  renderInput={({ inputRef }) => (
                    <div
                      className={styles.inputBox}
                      onClick={() => inputRef?.current?.focus()}
                      ref={inputRef}
                    >
                      <span className={styles.dateText}>
                        {formatThaiBuddhistYear(date)}
                      </span>
                      <CalendarMonthIcon className={styles.icon} />
                    </div>
                  )}
                />
              </div>
            </div>
          </LocalizationProvider>
        </div>
      </div>

      {/* Chart area */}
      <div className={styles.chartContainer}>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fillOpacity={0.2}
                strokeWidth={2}
                dot={{ stroke: "#8884d8", strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Box>
  );
};

export default HourlyStatsChart;
