import React, { useState } from "react";
import {
  Container,
  Box,
} from "@mui/material";
import NavbarMain from "@services/navbarMain/navbarMain";
import BreadcrumbsService from "@services/Breadcrumbs/breadcrumbs";
import TableAll from "@services/table/TableAll";

const mockData = [
  {
    id: 1,
    date: "15 ธ.ค. 2567",
    subject: "พฤติกรรมเจ้าหน้าที่ไม่เหมาะสม",
    type: "พฤติกรรมเจ้าหน้าที่",
    department: "กรมขนส่ง",
    sentDate: "30 ม.ค. 2568",
    status: "อยู่ระหว่างดำเนินการ",
  },
  {
    id: 2,
    date: "10 ธ.ค. 2567",
    subject: "นำคนอื่นมาบุญ ค่ารักษาพยาบาล",
    type: "นำคนอื่นมาบุญ...",
    department: "โรงงานไข่",
    sentDate: "30 ม.ค. 2568",
    status: "ติดตามผลการพิจารณา",
  },
];

export default function FollowupComponent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
  ];

  const filteredData = mockData.filter(
    (item) =>
      item.subject.includes(search) &&
      (statusFilter ? item.status === statusFilter : true)
  );

  return (
    <>
      <NavbarMain />
      <Box sx={{ minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg">
          <BreadcrumbsService items={breadcrumbItems} />
        </Container>
        <TableAll
          title="ติดตามผลการดำเนินการ"
          data={mockData}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          navigateTo="/followup"
        />
      </Box>
    </>
  );
}
