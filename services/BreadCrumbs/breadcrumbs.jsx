// BreadcrumbsService.js
import React from "react";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

// สไตล์ Breadcrumbs ให้มีพื้นหลังฟ้าอ่อน ตัวหนังสือสีน้ำเงิน
const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  backgroundColor: "#E7F1FF", // ฟ้าอ่อน ๆ
  padding: theme.spacing(1.5), // เพิ่มระยะห่างสวยงาม
  borderRadius: "8px", // โค้งมนเล็กน้อย
  display: "flex",
  alignItems: "center",
  "& .MuiBreadcrumbs-separator": {
    color: "#1D40F8", // สีเครื่องหมายคั่น
    marginLeft: "0.5rem",
    marginRight: "0.5rem",
  },
}));

/**
 * BreadcrumbsService - บริการนำทางแห่งคำที่สรรค์สร้างด้วยใจ
 * รับ props:
 * - items: [{ label, url, icon }] (icon ส่งเข้ามาเป็น React Node ได้เลย)
 * - separator: เครื่องหมายคั่นระหว่างเส้นทาง (ค่าเริ่มต้น ">" )
 */
const BreadcrumbsService = ({ items = [], separator = ">" }) => {
  return (
    <StyledBreadcrumbs separator={separator} aria-label="breadcrumb">
      {items.map((item, index) => {
        // เตรียม Block สำหรับแสดง icon (ถ้ามี) และ label
        const ContentBlock = (
          <span
            style={{ display: "flex", alignItems: "center", color: "#1D40F8" }}
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
