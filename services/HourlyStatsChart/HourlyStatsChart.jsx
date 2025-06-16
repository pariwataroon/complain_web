import React, { useState, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { formatThaiBuddhistYear } from "@utils/Formats";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import DateThaiPickerService from "@services/DateThaiPickerService/DateThaiPickerService";
import styles from "./HourlyStatsChart.module.scss";

const generateHourlyData = (selectedDate) => {
  if (!selectedDate) {
    return [
      { time: "00.00 - 03.59 น.", value: 60, shortTime: "00-04" },
      { time: "04.00 - 07.59 น.", value: 65, shortTime: "04-08" },
      { time: "08.00 - 11.59 น.", value: 70, shortTime: "08-12" },
      { time: "12.00 - 15.59 น.", value: 80, shortTime: "12-16" },
      { time: "16.00 - 19.59 น.", value: 75, shortTime: "16-20" },
      { time: "20.00 - 23.59 น.", value: 60, shortTime: "20-24" },
    ];
  }

  const date = new Date(selectedDate);
  const seed = date.getDate() + date.getMonth() * 31 + date.getFullYear() * 365;

  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const timeSlots = [
    { time: "00.00 - 03.59 น.", shortTime: "00-04" },
    { time: "04.00 - 07.59 น.", shortTime: "04-08" },
    { time: "08.00 - 11.59 น.", shortTime: "08-12" },
    { time: "12.00 - 15.59 น.", shortTime: "12-16" },
    { time: "16.00 - 19.59 น.", shortTime: "16-20" },
    { time: "20.00 - 23.59 น.", shortTime: "20-24" }
  ];

  return timeSlots.map((slot, index) => {
    const baseValues = [45, 35, 75, 85, 80, 65];
    const randomVariation = Math.floor(seededRandom(seed + index * 100) * 30) - 15;
    const value = Math.max(10, baseValues[index] + randomVariation);

    return {
      ...slot,
      value,
      timeSlot: index
    };
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipLabel}>{label}</div>
        <div className={styles.tooltipValue}>
          จำนวนผู้เข้าชม: {payload[0].value} คน
        </div>
      </div>
    );
  }
  return null;
};

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString();
};

const HourlyStatsChart = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const chartData = useMemo(() => {
    return generateHourlyData(selectedDate);
  }, [selectedDate]);

  const getDisplayDate = (isoString) => {
    if (!isoString) return null;
    return new Date(isoString);
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  return (
    <Box className={styles.hourlyStats}>
      {/* Date Picker - positioned absolutely */}
      <div className={styles.dateGroup}>
        <div className={styles.dateRow}>
          <span className={styles.rowLabel}>วันที่</span>
          <div className={styles.datePickerWrapper}>
            <DateThaiPickerService
              value={selectedDate}
              onChange={handleDateChange}
              placeholder="เลือกวันที่"
              maxDate={new Date().toISOString()}
            />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <Typography variant="h6" className={styles.main}>
          สถิติการเข้าชมเว็บไซต์รายชั่วโมง
        </Typography>
        <Typography variant="subtitle1" className={styles.sub}>
          ณ วันที่ {selectedDate ? formatThaiBuddhistYear(getDisplayDate(selectedDate)) : ''}
        </Typography>
      </div>

      {/* Chart Container */}
      <div className={styles.chartContainer}>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 10, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e0e0"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="shortTime"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#666' }}
                interval={0}
                height={60}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#666' }}
                domain={[0, 100]}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1120A3"
                strokeWidth={3}
                dot={{
                  stroke: "#1120A3",
                  strokeWidth: 2,
                  r: 5,
                  fill: "#ffffff"
                }}
                activeDot={{
                  r: 7,
                  stroke: "#1120A3",
                  strokeWidth: 2,
                  fill: "#1120A3"
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Box>
  );
};

export default HourlyStatsChart;