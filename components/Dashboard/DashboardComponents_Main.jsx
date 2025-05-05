import React, { useState } from "react";
import { Box, Grid } from "@mui/material";
import BreadcrumbsService from "@services/Breadcrumbs/breadcrumbs";

const DashboardComponents_Main = () => {
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
    <Box>
      <BreadcrumbsService items={breadcrumbItems} />
      <Grid container spacing={2} mt={1}>
        {/* ซ้ายบน */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              backgroundColor: "#fff",
              p: 2,
              height: "100%",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <div>test ซ้ายบน</div>
          </Box>
        </Grid>

        {/* ขวาบน */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              backgroundColor: "#fff",
              p: 2,
              height: "100%",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <div>test ขวาบน</div>
          </Box>
        </Grid>

        {/* ซ้ายล่าง */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              backgroundColor: "#fff",
              p: 2,
              height: "100%",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <div>test ซ้ายล่าง</div>
          </Box>
        </Grid>

        {/* ขวาล่าง */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              backgroundColor: "#fff",
              p: 2,
              height: "100%",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <div>test ขวาล่าง</div>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardComponents_Main;
