import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import Chart from "chart.js/auto";

const TopRightChart = () => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    const chartData = [
        { name: "สำนักงานพัฒนาการศึกษาชาวบ้าน", count: 8, color: "#1A237E" },
        { name: "กรุงเทพการ", count: 18, color: "#3949AB" },
        { name: "สำนักงานเขตกรุงเทพมหานคร", count: 12, color: "#7986CB" },
        { name: "อะชาการและเทคโนโลยี", count: 3, color: "#29B6F6" },
        { name: "สำนักงานพัฒนาวิศวกรรม", count: 12, color: "#81D4FA" },
        { name: "หน่วยงาน A", count: 6, color: "#FBC02D" },
        { name: "หน่วยงาน B", count: 11, color: "#FBE9A7" },
        { name: "หน่วยงาน C", count: 14, color: "#E91E63" },
        { name: "หน่วยงาน D", count: 8, color: "#F48FB1" },
    ];

    useEffect(() => {
        const ctx = chartRef.current.getContext("2d");

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels: chartData.map((item) => item.name),
                datasets: [
                    {
                        label: "จำนวนเรื่องร้องทุกข์",
                        data: chartData.map((item) => item.count),
                        backgroundColor: chartData.map((item) => item.color),
                        borderRadius: 6,
                        barThickness: 28,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        ticks: {
                            display: false,
                        },
                        grid: {
                            display: false,
                        },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 5,
                            font: { size: 10 },
                        },
                        suggestedMax: 22,
                    },
                },
            },
        });
    }, []);

    return (
        <Box sx={{ height: "500px" }}>
            <Typography
                variant="subtitle2"
                sx={{
                    color: "#1120A3",
                    fontWeight: "bold",
                    textAlign: "center",
                    mt: 1,
                    mb: 0.5,
                    fontSize: "14px",
                }}
            >
                สถิติเรื่องราวร้องทุกข์
            </Typography>
            <Typography
                variant="subtitle2"
                sx={{
                    color: "#1120A3",
                    fontWeight: "bold",
                    textAlign: "center",
                    mb: 2,
                    fontSize: "14px",
                }}
            >
                ณ เดือน สิงหาคม 2568
            </Typography>

            <Box>
                <canvas ref={chartRef} height="200" />
            </Box>
        </Box>
    );
};

export default TopRightChart;
