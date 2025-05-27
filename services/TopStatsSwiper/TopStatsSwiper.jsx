import React from "react";
import { Box, Typography } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const TopStatsSwiper = ({ title, bgColor, headerColor, data }) => {
    return (
        <Box
            sx={{
                backgroundColor: bgColor,
                borderRadius: 3,
                p: 2,
                height: "100%",
            }}
        >
            <Typography
                sx={{
                    fontWeight: "bold",
                    textAlign: "center",
                    color: headerColor,
                    mb: 1,
                    fontSize: "14px",
                }}
            >
                {title}
            </Typography>
            <Typography
                sx={{
                    fontSize: "10px",
                    textAlign: "center",
                    color: "#555",
                    mb: 2,
                }}
            >
                ณ 31 มกราคม 2568 - 02 เมษายน 2568<br />
                ปีงบประมาณ 2569
            </Typography>

            <Swiper
                spaceBetween={12}
                slidesPerView={1}
                pagination={{ clickable: true }}
                modules={[Pagination]}
            >
                {data.map((pageData, slideIndex) => (
                    <SwiperSlide key={slideIndex}>
                        {pageData.map((item, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 1,
                                    backgroundColor: "rgba(255,255,255,0.5)",
                                    p: 1,
                                    borderRadius: 2,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            backgroundColor: headerColor,
                                            color: "white",
                                            borderRadius: "50%",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            fontSize: "12px",
                                            mr: 2,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {i + 1 + slideIndex * 5}
                                    </Box>
                                    <Typography sx={{ fontSize: "12px", maxWidth: 180 }} noWrap>
                                        {item.name}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: "12px", fontWeight: "bold" }}>
                                    {item.count}
                                </Typography>
                            </Box>
                        ))}
                    </SwiperSlide>
                ))}
            </Swiper>
        </Box>
    );
};

export default TopStatsSwiper;
