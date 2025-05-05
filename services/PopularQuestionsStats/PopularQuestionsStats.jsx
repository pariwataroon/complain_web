import { Box, Typography } from "@mui/material";

const PopularQuestionsStats = () => {
  return (
    <Box sx={{ background: "#fbe8c2", borderRadius: 2, p: 2, boxShadow: 1 }}>
      <Typography variant="h6" fontWeight="bold">
        คำถามใหม่
      </Typography>
      <div>รายการคำถาม</div>
    </Box>
  );
};

export default PopularQuestionsStats;
