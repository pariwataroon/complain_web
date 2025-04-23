import React from "react";
import { useRouter } from "next/router";
import { Box, Container, Typography } from "@mui/material";
import NavbarMain from "@services/navbarMain/navbarMain";
import BreadcrumbsService from "@services/Breadcrumbs/breadcrumbs";

export default function FollowupDetailPage() {
  const router = useRouter();
  const { id } = router.query;
    
  const breadcrumbItems = [
    {
      label: "เมนูติดตามผลการดำเนินการ",
      icon: (
        <img
          src="/icons/docticon.png"
          alt="icon"
          style={{ width: "24px", height: "24px", marginBottom: "-8px" }}
        />
      ),
    },
    {
      label: `รายละเอียด #${id}`,
    },
  ];


  return (
    <>
      <NavbarMain />
      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          <BreadcrumbsService items={breadcrumbItems} />

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              รายละเอียดการติดตาม ID: {id}
            </Typography>

            <Typography sx={{ color: "#555" }}>
              (แสดงข้อมูลเพิ่มเติมของเรื่องร้องทุกข์ตาม ID นี้
              เช่นรายละเอียดเพิ่มเติมของการร้องเรียน, สถานะล่าสุด,
              หรือแนบไฟล์ต่าง ๆ)
            </Typography>
          </Box>
        </Container>
      </Box>
    </>
  );
}
