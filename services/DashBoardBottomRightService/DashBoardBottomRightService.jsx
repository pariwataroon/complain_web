import React, { useRef, useEffect, useState } from "react";
import { Box, Typography, Select, MenuItem, FormControl } from "@mui/material";
import Chart from "chart.js/auto";

const chartDataByYear = {
    "2567": [
        { name: "เว็บไซต์", count: 80, color: "#4A5CD6" },
        { name: "อีเมล์", count: 40, color: "#E91E63" },
        { name: "จดหมาย", count: 26, color: "#87CEEB" },
    ],
    "2568": [
        { name: "เว็บไซต์", count: 60, color: "#4A5CD6" },
        { name: "อีเมล์", count: 30, color: "#E91E63" },
        { name: "จดหมาย", count: 0, color: "#87CEEB" },
    ],
};

const BottomRightService = () => {
    const [selectedYear, setSelectedYear] = useState("2567");
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const data = chartDataByYear[selectedYear] || [];

    useEffect(() => {
        const ctx = chartRef.current.getContext("2d");

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const isEmpty = data.length === 0 || data.every((item) => item.count === 0);

        const chartData = isEmpty
            ? {
                labels: ["ไม่มีข้อมูล"],
                datasets: [
                    {
                        data: [1],
                        backgroundColor: ["#e0e0e0"],
                        borderWidth: 0,
                    },
                ],
            }
            : {
                labels: data.map((item) => item.name),
                datasets: [
                    {
                        data: data.map((item) => item.count),
                        backgroundColor: data.map((item) => item.color),
                        borderWidth: 2,
                        borderColor: "#fff",
                    },
                ],
            };

        chartInstanceRef.current = new Chart(ctx, {
            type: "doughnut",
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "65%",
                plugins: {
                    legend: { display: false },
                },
            },
            plugins: [
                {
                    id: "centerText",
                    afterDraw: (chart) => {
                        const { width, height } = chart;
                        const ctx = chart.ctx;
                        ctx.save();
                        ctx.fillStyle = "#666";
                        ctx.textAlign = "center";

                        if (isEmpty) {
                            ctx.font = "bold 14px sans-serif";
                            ctx.fillText("ไม่มีข้อมูล", width / 2, height / 2 + 5);
                        } else {
                            const total = data.reduce((sum, d) => sum + d.count, 0);
                            ctx.font = "bold 14px sans-serif";
                            ctx.fillText("รวม", width / 2, height / 2 - 15);
                            ctx.fillStyle = "#4A5CD6";
                            ctx.font = "bold 20px sans-serif";
                            ctx.fillText(total, width / 2, height / 2 + 10);
                            ctx.fillStyle = "#666";
                            ctx.font = "12px sans-serif";
                            ctx.fillText("เรื่อง", width / 2, height / 2 + 28);
                        }

                        ctx.restore();
                    },
                },
            ],
        });
    }, [data]);

    return (
        <Box sx={{ height: "400px", p: 2 }}>
            {/* ตัวเลือกปี */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        ปีงบประมาณ:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80, mt: 0.5 }}>
                        <Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            sx={{ fontSize: "14px" }}
                        >
                            <MenuItem value="2567">2567</MenuItem>
                            <MenuItem value="2568">2568</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* หัวข้อ */}
            <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", mb: 3 }}>
                ช่องทางการร้องทุกข์
            </Typography>

            {/* Chart */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "250px" }}>
                <canvas ref={chartRef} width={220} height={220} />
            </Box>
        </Box>
    );
};

export default BottomRightService;
