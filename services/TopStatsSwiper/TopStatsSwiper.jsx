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
  className = "",
  ...boxProps
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

  const hasData =
    Array.isArray(data) && data.length > 0 && data.some((chunk) => chunk.length > 0);

  const formatCount = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }
    try {
      return new Intl.NumberFormat("th-TH").format(Number(value));
    } catch {
      return String(value);
    }
  };

  return (
    <Box
      className={`${styles.topStatsBox} ${
        isHigh ? styles.cardBlue : styles.cardRed
      } ${className}`}
      {...boxProps}
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
              <SwiperSlide key={`top-stats-slide-${slideIndex}`}>
                {pageData.map((item, i) => {
                  const label = item?.name || "-";
                  const count = formatCount(item?.count);
                  return (
                    <div key={`${label}-${i}`} className={styles.itemBox}>
                      <div className={styles.rankCircle}>{i + 1}</div>
                      <div className={styles.itemContent}>
                        <span className={styles.label} title={label}>
                          {label}
                        </span>
                        <span className={styles.count}>{count}</span>
                      </div>
                    </div>
                  );
                })}
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </Box>
  );
};

export default TopStatsSwiper;
