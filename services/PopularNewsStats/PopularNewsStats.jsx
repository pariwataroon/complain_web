import { Box, Typography } from "@mui/material";

const PopularNewsStats = () => {
  return (
    <Box sx={{ background: "#dceeff", borderRadius: 2, p: 2, boxShadow: 1 }}>
      <Typography variant="h6" fontWeight="bold">
        ข่าวยอดนิยม
      </Typography>
      <div>รายการข่าว</div>
    </Box>
  );
};

export default PopularNewsStats;
