import React, { useState, useRef } from "react";
import { Box, Container } from "@mui/material";
import DailyStatsChart from "@services/DailyStatsChart/DailyStatsChart";
import HourlyStatsChart from "@services/HourlyStatsChart/HourlyStatsChart";
import PopularNewsStats from "@services/PopularNewsStats/PopularNewsStats";
import PopularQuestionsStats from "@services/PopularQuestionsStats/PopularQuestionsStats";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
import { exportElementToPDF } from "@utils/exportPDF";
import ExportButton from "@services/ExportButton/ExportButton";

const DashboardComponents_Home = () => {
  const pdfRef = useRef(null);

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

  const handleExportPDF = () => {
    const today = new Date().toLocaleDateString("th-TH");
    const filename = `ข้อมูลDashboard_${today}.pdf`;
    exportElementToPDF(pdfRef, filename);
  };

  return (
    <Box sx={{ minHeight: "100vh", py: 1 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          mb: 2 // เพิ่ม margin bottom ถ้าต้องการ
        }}
      >
        <BreadcrumbsService items={breadcrumbItems} />
        <ExportButton
          label="Export PDF"
          onClick={handleExportPDF}
          sx={{
            fontSize: { xs: 12, sm: 14 },
            px: 1.5,
            py: 1,
          }}
        />
      </Box>
      {/* ซ้ายบน */}
      <div ref={pdfRef}>
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
      </div>
    </Box>
  );
};

export default DashboardComponents_Home;
