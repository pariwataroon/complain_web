import React from "react";
import { Box, Typography, Select, MenuItem, FormControl } from "@mui/material";

const DashBoardCard = () => {
    return (
        <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            <Box
                sx={{
                    flex: 1,
                    backgroundColor: "#8B4513",
                    color: "white",
                    p: 2,
                    borderRadius: 2,
                    textAlign: "center",
                }}
            >
                <Typography sx={{ fontSize: "10px", mb: 0.5 }}>เก็บข้อมูลยุทธศาสตร์เดิม</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>203</Typography>
                <Typography sx={{ fontSize: "12px" }}>โรง</Typography>
                <Typography sx={{ fontSize: "9px", mt: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    📈 10% เมื่อเทียบกับปี 2564
                </Typography>
            </Box>
            <Box
                sx={{
                    flex: 1,
                    backgroundColor: "#4A5CD6",
                    color: "white",
                    p: 2,
                    borderRadius: 2,
                    textAlign: "center",
                }}
            >
                <Typography sx={{ fontSize: "10px", mb: 0.5 }}>เก็บข้อมูลยุทธศาสตร์ใหม่</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>120</Typography>
                <Typography sx={{ fontSize: "12px" }}>โรง</Typography>
                <Typography sx={{ fontSize: "9px", mt: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    📈 5% เมื่อเทียบกับปี 2564
                </Typography>
            </Box>
            <Box
                sx={{
                    flex: 1,
                    backgroundColor: "#E91E63",
                    color: "white",
                    p: 2,
                    borderRadius: 2,
                    textAlign: "center",
                }}
            >
                <Typography sx={{ fontSize: "10px", mb: 0.5 }}>เก็บข้อมูลยุทธศาสตร์ต่อเนื่อง</Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>83</Typography>
                <Typography sx={{ fontSize: "12px" }}>โรง</Typography>
                <Typography sx={{ fontSize: "9px", mt: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    📈 72% เมื่อเทียบกับปี 2564
                </Typography>
            </Box>
        </Box>
    );
};
export default DashBoardCard;