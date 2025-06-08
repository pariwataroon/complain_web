import React from "react";
import { Box, Typography } from "@mui/material";
import styles from "./DashBoardCard.module.scss";

const cards = [
  {
    title: "เรื่องราวร้องทุกข์ทั้งหมด",
    count: 203,
    unit: "เรื่อง",
    gradient: styles.cardBrown,
    trend: "+15%",
    compareYear: "2564",
  },
  {
    title: "เรื่องราวร้องทุกข์ยุติ",
    count: 120,
    unit: "เรื่อง",
    gradient: styles.cardBlue,
    trend: "-10%",
    compareYear: "2564",
  },
  {
    title: "เรื่องราวร้องทุกข์ดำเนินการ",
    count: 83,
    unit: "เรื่อง",
    gradient: styles.cardPink,
    trend: "+72%",
    compareYear: "2564",
  },
];

const DashBoardCard = () => {
  return (
    <Box className={styles.container}>
      {cards.map((card, index) => {
        const isPositive = card.trend.startsWith("+");
        const trendColor = isPositive ? "#4caf50" : "#f44336";
        const iconSrc = isPositive ? "/icons/up.png" : "/icons/down.png";

        return (
          <Box key={index} className={`${styles.card} ${card.gradient}`}>
            <Typography className={styles.title}>{card.title}</Typography>
            <Typography className={styles.count}>
              {card.count} <span className={styles.unit}>{card.unit}</span>
            </Typography>
            <Box className={styles.trendLine}>
              <img
                src={iconSrc}
                alt={isPositive ? "เพิ่มขึ้น" : "ลดลง"}
                className={styles.trendIcon}
              />
              <Typography className={styles.trendText}>{card.trend}</Typography>
              <Typography className={styles.compareText}>
                เมื่อเทียบกับปี {card.compareYear}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default DashBoardCard;
