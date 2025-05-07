import React, { useState, forwardRef } from "react";
import styles from "./DailyStatsChart.module.scss";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { th } from "date-fns/locale";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { formatThaiBuddhistYear, formatThaiDateRange } from "@utils/Formats";
import { Box, Typography } from "@mui/material";

const chartData = [
  { date: "1 ม.ค.", value: 7, color: "#0a2cbd" },
  { date: "2 ม.ค.", value: 12, color: "#8686cc" },
  { date: "3 ม.ค.", value: 3, color: "#4299f3" },
  { date: "4 ม.ค.", value: 12, color: "#99ccff" },
  { date: "5 ม.ค.", value: 6, color: "#e6c266" },
  { date: "6 ม.ค.", value: 11, color: "#f4e6a4" },
  { date: "7 ม.ค.", value: 7, color: "#e18d85" },
];

const DateInput = forwardRef(({ value, onOpen }, ref) => (
  <div className={styles.inputBox} onClick={onOpen} ref={ref}>
    <span className={styles.dateText}>{value}</span>
    <CalendarMonthIcon className={styles.icon} />
  </div>
));

const CustomTooltip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      <div className={styles.tooltipValue}>จำนวนผู้คน : {payload[0].value}</div>
    </div>
  ) : null;

export default function DailyStatsChart() {
  const [start, setStart] = useState(new Date("2025-01-01"));
  const [end, setEnd] = useState(new Date("2025-01-07"));
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  return (
    <div className={styles.dailyStats}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <div className={styles.dateGroup}>
          <div className={styles.dateRow}>
            <span className={styles.rowLabel}>ตั้งแต่</span>
            <DatePicker
              value={start}
              onChange={(d) => d && setStart(d)}
              renderInput={({ inputRef }) => (
                <DateInput
                  value={formatThaiBuddhistYear(start)}
                  onOpen={() => setOpenStart(true)}
                  ref={inputRef}
                />
              )}
            />
          </div>
          <div className={styles.dateRow}>
            <span className={styles.rowLabel}>ถึง</span>
            <DatePicker
              value={end}
              onChange={(d) => d && setEnd(d)}
              renderInput={({ inputRef }) => (
                <DateInput
                  value={formatThaiBuddhistYear(end)}
                  onOpen={() => setOpenEnd(true)}
                  ref={inputRef}
                />
              )}
            />
          </div>
        </div>
      </LocalizationProvider>

      <div className={styles.header}>
        <Typography variant="h6" fontWeight="bold" className={styles.main}>
          สถิติการเข้าชมเว็บไซต์รายวัน
        </Typography>
        <Typography variant="subtitle1" className={styles.sub}>
          {formatThaiDateRange(start, end)}
        </Typography>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
          >
            <CartesianGrid
              stroke="#e0e0e0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, "dataMax + 5"]}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,.04)" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
