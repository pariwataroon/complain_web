import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import styles from "./DashBoardCard.module.scss";
import {
  GetComplaintSummary,
} from "@pages/api/dashboard/dashboard";


const DashBoardCard = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await GetComplaintSummary();

      if (result.success && result.dashboardCards) {
        setCards(result.dashboardCards);
      } else {
        setError(result.message || result.error || "ไม่สามารถดึงข้อมูลได้");
        setCards([
          {
            title: "ไม่สามารถโหลดข้อมูลได้",
            count: 0,
            unit: "เรื่อง",
            gradient: "cardBrown",
            trend: "0%",
            compareYear: "----",
            isPositive: false
          }
        ]);
      }
    } catch (err) {
      console.error("Error fetching card data:", err);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchCardData();
  }, []);

  // Format trend text to include + or - sign
  const formatTrend = (trend, isPositive) => {
    if (!trend) return "0%";

    // ถ้า trend ไม่มี + หรือ - ให้เพิ่มเอง
    if (!trend.startsWith("+") && !trend.startsWith("-")) {
      return isPositive ? `+${trend}` : trend === "0%" ? trend : `-${trend}`;
    }

    return trend;
  };

  // Loading state
  if (loading) {
    return (
      <Box className={styles.container}>
        {[1, 2, 3].map((index) => (
          <Box key={index} className={`${styles.card} ${styles.cardBrown}`}>
            <Typography className={styles.title}>กำลังโหลด...</Typography>
            <Typography className={styles.count}>
              -- <span className={styles.unit}>เรื่อง</span>
            </Typography>
            <Box className={styles.trendLine}>
              <Typography className={styles.trendText}>--%</Typography>
              <Typography className={styles.compareText}>
                เมื่อเทียบกับปี ----
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // Error state
  if (error && cards.length === 0) {
    return (
      <Box className={styles.container}>
        <Box className={`${styles.card} ${styles.cardBrown}`}>
          <Typography className={styles.title}>เกิดข้อผิดพลาด</Typography>
          <Typography className={styles.count}>
            -- <span className={styles.unit}>เรื่อง</span>
          </Typography>
          <Box className={styles.trendLine}>
            <Typography className={styles.trendText}>{error}</Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      {cards.map((card, index) => {
        // ใช้ isPositive จาก API หรือคำนวณจาก trend
        const isPositive = card.isPositive !== undefined
          ? card.isPositive
          : card.trend && (card.trend.startsWith("+") || (!card.trend.startsWith("-") && card.trend !== "0%"));

        const trendColor = isPositive ? "#4caf50" : "#f44336";
        const iconSrc = isPositive ? "/icons/up.png" : "/icons/down.png";

        // ใช้ styles[card.gradient] เพื่อให้ได้ CSS class
        const gradientClass = styles[card.gradient] || styles.cardBrown;

        // Format trend text
        const formattedTrend = formatTrend(card.trend, isPositive);

        return (
          <Box key={card.id || index} className={`${styles.card} ${gradientClass}`}>
            <Typography className={styles.title}>{card.title}</Typography>
            <Typography className={styles.count}>
              {card.count.toLocaleString()} <span className={styles.unit}>{card.unit}</span>
            </Typography>
            <Box className={styles.trendLine}>
              <img
                src={iconSrc}
                alt={isPositive ? "เพิ่มขึ้น" : "ลดลง"}
                className={styles.trendIcon}
              />
              <Typography className={styles.trendText} style={{ color: trendColor }}>
                {formattedTrend}
              </Typography>
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