import { useEffect, useRef, useState } from "react";
import { Box, Typography, Select, MenuItem, FormControl } from "@mui/material";
import Chart from "chart.js/auto";

const chartDataByDepartment = {
    "1": [
        { name: "บุคลากร", count: 146, color: "#4A5CD6" },
        { name: "ร้องเรียนทั่วไป", count: 73, color: "#E91E63" },
        { name: "ไม่ระบุ", count: 31, color: "#87CEEB" },
    ],
    "2": [
        { name: "ภาษี", count: 40, color: "#4A5CD6" },
        { name: "การเงิน", count: 55, color: "#E91E63" },
        { name: "อื่น ๆ", count: 10, color: "#87CEEB" },
    ],
    "3": [
        { name: "ศุลกากร", count: 60, color: "#4A5CD6" },
        { name: "การนำเข้า", count: 30, color: "#E91E63" },
        { name: "การส่งออก", count: 20, color: "#87CEEB" },
    ],
  };


const BottomLeftService = () => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    
    const [selectedDepartment, setSelectedDepartment] = useState("1");
    const data = chartDataByDepartment[selectedDepartment] || [];

    
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
                            ctx.fillText(data[0].name, width / 2, height / 2 - 15);
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
        <Box sx={{ p: 2 }}>
            {/* ส่วนหัวและตัวเลือก */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                    {/* ปีงบประมาณ */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            ปีงบประมาณ:
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select defaultValue="2567" sx={{ fontSize: "14px" }}>
                                <MenuItem value="2567">2567</MenuItem>
                                <MenuItem value="2568">2568</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* หน่วยงาน */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            หน่วยงาน:
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                sx={{ fontSize: "14px" }}
                            >
                                {[
                                    { value: "1", label: "กรมบัญชีกลาง" },
                                    { value: "2", label: "สำนักงานเศรษฐกิจการคลัง" },
                                    { value: "3", label: "กรมศุลกากร" },
                                    { value: "4", label: "กรมสรรพากร" },
                                    { value: "5", label: "สำนักงานงบประมาณ" },
                                    { value: "6", label: "สำนักงานตรวจเงินแผ่นดิน" },
                                    { value: "7", label: "สำนักงานบริหารหนี้สาธารณะ" },
                                    { value: "8", label: "ธนาคารแห่งประเทศไทย" },
                                    { value: "9", label: "สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ" },
                                    { value: "10", label: "สำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์" },
                                ].map((item) => (
                                    <MenuItem key={item.value} value={item.value}>
                                        <Typography
                                            noWrap
                                            sx={{
                                                maxWidth: "180px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {item.label}
                                        </Typography>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                    </Box>
                </Box>
            </Box>

            {/* หัวข้อ */}
            <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", mb: 3 }}>
                ประเภทเรื่องราวร้องทุกข์
            </Typography>

            {/* ส่วนกราฟวงกลม */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "250px" }}>
                <canvas ref={chartRef} width={220} height={220} />
            </Box>
            
        </Box>
    );
};

export default BottomLeftService;