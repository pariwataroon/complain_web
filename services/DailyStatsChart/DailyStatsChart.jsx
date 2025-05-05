import React, { useState, forwardRef } from "react";
import styles from "./DailyStatsChart.module.scss";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell
} from "recharts";
import {
  LocalizationProvider,
  DatePicker,
} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { th } from "date-fns/locale";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import {
  formatThaiBuddhistYear,
  formatThaiDateRange,
} from "@utils/Formats";


const data = [
  { date: "1 ม.ค.", value: 7, color: "#0a2cbd" },
  { date: "2 ม.ค.", value: 12, color: "#8686cc" },
  { date: "3 ม.ค.", value: 3, color: "#4299f3" },
  { date: "4 ม.ค.", value: 12, color: "#99ccff" },
  { date: "5 ม.ค.", value: 6, color: "#e6c266" },
  { date: "6 ม.ค.", value: 11, color: "#f4e6a4" },
  { date: "7 ม.ค.", value: 7, color: "#e18d85" },
];

const DateInput = forwardRef(({ label, value, onClick }, ref) => (
  <label className={styles.inputLabel}>
    <span>{label}</span>
    <div className={styles.inputBox} onClick={onClick} ref={ref}>
      <span className={styles.dateText}>
        {formatThaiBuddhistYear(value)}
      </span>
      <CalendarMonthIcon className={styles.icon} />
    </div>
  </label>
));

export default function DailyStatsChart() {
  const [start, setStart] = useState(new Date("2025-01-01"));
  const [end, setEnd] = useState(new Date("2025-01-07"));

  const CustomTooltip = ({ active, payload, label }) =>
    active && payload?.length ? (
      <div className={styles.tooltip}>
        <div className={styles.tooltipValue}>
          จำนวนผู้คน : {payload[0].value}
        </div>
      </div>
    ) : null;

  return (
    <div className={styles.dailyStats}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <div className={styles.dateGroup}>
          <DatePicker
            value={start}
            onChange={(d) => d && setStart(d)}
            renderInput={({ inputRef }) => (
              <DateInput
                label="ตั้งแต่"
                value={start}
                onClick={() => inputRef?.current?.focus()}
                ref={inputRef}
              />
            )}
          />
          <DatePicker
            value={end}
            onChange={(d) => d && setEnd(d)}
            renderInput={({ inputRef }) => (
              <DateInput
                label="ถึง"
                value={end}
                onClick={() => inputRef?.current?.focus()}
                ref={inputRef}
              />
            )}
          />
        </div>
      </LocalizationProvider>

      <div className={styles.header}>
        <h3 className={styles.main}>สถิติการเข้าชมเว็บไซต์รายวัน</h3>
        <p className={styles.sub}>{formatThaiDateRange(start, end)}</p>
      </div>

      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, "dataMax + 5"]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,.04)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
              {data.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
