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
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
            {item.label}
          </span>
        );

        return item.url ? (
          <Link
            key={index}
            underline="none"
            style={{ color: "#1D40F8", cursor: "pointer" }}
            // ใช้ onClick ถ้ามี, ถ้าไม่มี fallback เป็น href เดิม
            onClick={(e) => {
              e.preventDefault();
              if (item.onClick) {
                item.onClick();
              } else {
                window.location.href = item.url;
              }
            }}
            href={item.url}
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
