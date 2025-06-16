import React, { useState, useMemo } from "react";
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
import { formatThaiDateRange } from "@utils/Formats";
import { Box, Typography } from "@mui/material";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";

const generateRandomColor = () => {
  const colors = [
    "#0a2cbd", "#8686cc", "#4299f3", "#99ccff",
    "#e6c266", "#f4e6a4", "#e18d85", "#a8e6a3",
    "#ff9999", "#ffcc99", "#cc99ff", "#99ffcc"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const generateChartData = (startDate, endDate) => {
  if (!startDate || !endDate) return [];

  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const current = new Date(start);

  while (current <= end) {
    const day = current.getDate();
    const month = current.getMonth() + 1;

    const thaiMonths = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    const dateLabel = `${day} ${thaiMonths[month - 1]}`;

    const value = Math.floor(Math.random() * 20) + 1;

    data.push({
      date: dateLabel,
      value: value,
      color: generateRandomColor(),
      fullDate: new Date(current)
    });

    current.setDate(current.getDate() + 1);
  }

  return data;
};

const CustomTooltip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      <div className={styles.tooltipValue}>จำนวนผู้คน : {payload[0].value}</div>
    </div>
  ) : null;

const getInitialDates = () => {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  return {
    startDate: sevenDaysAgo.toISOString(),
    endDate: today.toISOString()
  };
};

export default function DailyStatsChart() {
  const initialDates = getInitialDates();
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);

  const chartData = useMemo(() => {
    return generateChartData(startDate, endDate);
  }, [startDate, endDate]);

  const getDisplayDate = (isoString) => {
    if (!isoString) return null;
    return new Date(isoString);
  };

  const handleStartDateChange = (newDate) => {
    setStartDate(newDate);
  };

  const handleEndDateChange = (newDate) => {
    setEndDate(newDate);
  };

  // ฟังก์ชันสำหรับจำกัด maxDate ของ startDate
  const getStartDateMaxDate = () => {
    const today = new Date().toISOString();
    const selectedEndDate = endDate;

    // ใช้วันที่น้อยกว่าระหว่างวันปัจจุบันกับ endDate
    return new Date(today) < new Date(selectedEndDate) ? today : selectedEndDate;
  };

  return (
    <div className={styles.dailyStats}>
      <div className={styles.dateGroup}>
        <div className={styles.dateRow}>
          <span className={styles.rowLabel}>ตั้งแต่</span>
          <div className={styles.datePickerWrapper}>
            <DateThaiPickerService
              value={startDate}
              onChange={handleStartDateChange}
              placeholder="เลือกวันที่เริ่มต้น"
              maxDate={getStartDateMaxDate()}
            />
          </div>
        </div>
        <div className={styles.dateRow}>
          <span className={styles.rowLabel}>ถึง</span>
          <div className={styles.datePickerWrapper}>
            <DateThaiPickerService
              value={endDate}
              onChange={handleEndDateChange}
              placeholder="เลือกวันที่สิ้นสุด"
              minDate={startDate}
              maxDate={new Date().toISOString()}
            />
          </div>
        </div>
      </div>

      <div className={styles.header}>
        <Typography variant="h6" fontWeight="bold" className={styles.main}>
          สถิติการเข้าชมเว็บไซต์รายวัน
        </Typography>
        <Typography variant="subtitle1" className={styles.sub}>
          {startDate && endDate && formatThaiDateRange(getDisplayDate(startDate), getDisplayDate(endDate))}
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