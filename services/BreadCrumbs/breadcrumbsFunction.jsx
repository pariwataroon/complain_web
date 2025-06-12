import React from "react";
import { Breadcrumbs, Typography, Link } from "@mui/material";
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

const BreadcrumbsServiceF = ({ items = [], separator = ">" }) => {
  return (
    <StyledBreadcrumbs separator={separator} aria-label="breadcrumb">
      {items.map((item, index) => {
        const isClickable = typeof item.onClick === "function" || !!item.url;

        const ContentBlock = (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              color: "#1D40F8",
              fontWeight: "bold",
              fontSize: "18px",
              cursor: isClickable ? "pointer" : "default",
            }}
          >
            {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
            {item.label}
          </span>
        );
        if (isClickable) {
          return (
            <Link
              key={index}
              underline="none"
              onClick={item.onClick}
              href={item.url || "#"}
              style={{ color: "#1D40F8" }}
            >
              {ContentBlock}
            </Link>
          );
        }

        return (
          <Typography key={index} style={{ color: "#1D40F8" }}>
            {ContentBlock}
          </Typography>
        );
      })}
    </StyledBreadcrumbs>
  );
};

export default BreadcrumbsServiceF;
