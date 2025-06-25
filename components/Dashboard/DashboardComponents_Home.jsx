import React, { useState } from "react";
import { Box, Container } from "@mui/material";
import BreadcrumbsService from "@services/Breadcrumbs/Breadcrumbs";
import DailyStatsChart from "@services/DailyStatsChart/DailyStatsChart";
import HourlyStatsChart from "@services/HourlyStatsChart/HourlyStatsChart";
import PopularNewsStats from "@services/PopularNewsStats/PopularNewsStats";
import PopularQuestionsStats from "@services/PopularQuestionsStats/PopularQuestionsStats";

const DashboardComponents_Home = () => {
  const breadcrumbItems = [
    {
      label: "Dashboard",
      icon: (
        <img
          src="/icons/docticon.png"
          alt="icon"
          style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
        />
      ),
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", py: 1 }}>
      <BreadcrumbsService items={breadcrumbItems} />
      {/* ซ้ายบน */}
      <Container maxWidth={false} disableGutters>
        {/* แถวบน */}
        <Box display="flex" gap={3} mb={6} mt={2} flexWrap="wrap">
          <Box flex={1} minWidth="300px">
            <DailyStatsChart />
          </Box>
          <Box flex={1} minWidth="300px">
            <HourlyStatsChart />
          </Box>
        </Box>

        {/* แถวล่าง */}
        <Box display="flex" gap={3} mb={6} mt={2} flexWrap="wrap">
          <Box flex={1} minWidth="300px">
            <PopularNewsStats />
          </Box>
          <Box flex={1} minWidth="300px">
            <PopularQuestionsStats />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardComponents_Home;
