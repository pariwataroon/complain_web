import React from "react";
import { Box } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import styles from "./TopStatsSwiper.module.scss";
import { formatThaiDateMonths } from "@utils/Formats";

const TopStatsSwiper = ({
  title,
  data,
  startDate, 
  endDate, 
  variant = "high",
  loading = false,
}) => {
  const dateRangeText =
    startDate && endDate
      ? `ณ ${formatThaiDateMonths(startDate)} - ${formatThaiDateMonths(endDate)}`
      : "";

  const fiscalYear =
    endDate && typeof endDate.year === "number"
      ? endDate.year + 543
      : new Date().getFullYear() + 543;

  const isHigh = variant === "high";

  const hasData = data && data.length > 0 && data.some(chunk => chunk.length > 0);

  return (
    <Box
      className={`${styles.topStatsBox} ${isHigh ? styles.cardBlue : styles.cardRed
        }`}
    >
      <div className={styles.header}>{title}</div>

      <div className={styles.subtitle}>
        {dateRangeText}
        <br />
        ปีงบประมาณ {fiscalYear}
      </div>

      <div className={styles.slideBox}>
        {loading ? (
          <div className={styles.emptyStateContainer}>
            กำลังโหลด...
          </div>
        ) : !hasData ? (
          <div className={styles.emptyStateContainer}>
            ยังไม่มีข้อมูล
          </div>
        ) : (
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
        )}
      </div>
    </Box>
  );
};

export default TopStatsSwiper;