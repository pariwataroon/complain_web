import { Box, Typography } from "@mui/material";

const HourlyStatsChart = () => {
  return (
    <Box sx={{ background: "#fff", borderRadius: 2, p: 2, boxShadow: 1 }}>
      <Typography variant="h6" fontWeight="bold">
        สถิติการเข้าชมเว็บไซต์รายชั่วโมง
      </Typography>
      <div>Chart รายชั่วโมง</div>
    </Box>
  );
};

export default HourlyStatsChart;
