import React from "react";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  "& .MuiBreadcrumbs-separator": {
    color: "#1D40F8",
    marginLeft: "0.5rem",
    marginRight: "0.5rem",
  },
}));

const BreadcrumbsService = ({ items = [], separator = ">" }) => {
  return (
    <StyledBreadcrumbs separator={separator} aria-label="breadcrumb">
      {items.map((item, index) => {
        const ContentBlock = (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              color: "#1D40F8",
              fontWeight: "bold", // ทำให้เป็นตัวหนา
              fontSize: "18px", // ปรับขนาดตัวอักษร
            }}
          >
            {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
            {item.label}
          </span>
        );

        // ถ้ามี url ให้ใช้ Link, ถ้าไม่มีให้ใช้ Typography
        return item.url ? (
          <Link
            key={index}
            href={item.url}
            underline="none"
            style={{ color: "#1D40F8" }}
          >
            {ContentBlock}
          </Link>
        ) : (
          <Typography key={index} style={{ color: "#1D40F8" }}>
            {ContentBlock}
          </Typography>
        );
      })}
    </StyledBreadcrumbs>
  );
};

export default BreadcrumbsService;
