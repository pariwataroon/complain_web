import React from "react";
import { Box } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import styles from "./TopStatsSwiper.module.scss";

const TopStatsSwiper = ({
  title,
  data,
  startDate,
  endDate,
  variant = "high",
}) => {
  // Helper function สำหรับ format Thai date
  const formatThaiDate = (dateObj) => {
    if (!dateObj) return "";

    const thaiMonths = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];

    return `${dateObj.day} ${thaiMonths[dateObj.month - 1]} พ.ศ. ${
      dateObj.buddhistYear
    }`;
  };

  // สร้าง date range text และ fiscal year
  const dateRangeText =
    startDate && endDate
      ? `ณ ${formatThaiDate(startDate)} - ${formatThaiDate(endDate)}`
      : "";

  const fiscalYear = endDate?.buddhistYear || new Date().getFullYear() + 543;

  const isHigh = variant === "high";

  return (
    <Box
      className={`${styles.topStatsBox} ${
        isHigh ? styles.cardBlue : styles.cardRed
      }`}
    >
      <div className={styles.header}>{title}</div>

      <div className={styles.subtitle}>
        {dateRangeText}
        <br />
        ปีงบประมาณ {fiscalYear}
      </div>

      <div className={styles.slideBox}>
        <Swiper
          slidesPerView={1}
          spaceBetween={12}
          pagination={{ clickable: true }}
          modules={[Pagination]}
          autoHeight={true}
        >
          {data.map((pageData, slideIndex) => (
            <SwiperSlide key={slideIndex}>
              {pageData.map((item, i) => (
                <div key={i} className={styles.itemBox}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <div className={styles.rankCircle}>{i + 1}</div>
                    <div className={styles.label}>{item.name}</div>
                  </Box>
                  <div className={styles.count}>{item.count}</div>
                </div>
              ))}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </Box>
  );
};

export default TopStatsSwiper;
