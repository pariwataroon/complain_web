import React, { useState, useEffect } from "react";
import { Container, Box } from "@mui/material";
import NavbarMain from "@services/navbarMain/navbarMain";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
import TableAll from "@services/table/TableAll";
import { GetMeAllComplaints } from "@pages/api/complaint/complaint";

// Map label สถานะ (ไทย) → code (เช่น in_process)
const STATUS_MAP = {
  "รับเรื่อง": "submitted",
  "ส่งหน่วยงานภายนอก": "sent_to_external",
  "กำลังดำเนินการ": "in_process",
  "ติดตามผล": "tracking",
  "มอบหมายเจ้าหน้าที่": "assigned",
  "แจ้งผลการพิจารณา": "decision",
  "อยู่ระหว่างพิจารณา": "considering",
  "ปิดเรื่อง": ["completed", "cancelled"],
};

export default function FollowupComponent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [allComplaints, setAllComplaints] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
const fetchComplaints = async ({
  searchParam = search,
  statusParam = statusFilter,
} = {}) => {
  try {
    let statusCode = statusParam && STATUS_MAP[statusParam]
      ? STATUS_MAP[statusParam]
      : statusParam;
    let allResults = [];

    // โหลดทีละ status หรือทั้งหมด
    if (Array.isArray(statusCode)) {
      for (const s of statusCode) {
        const res = await GetMeAllComplaints({
          skip: 0,
          limit: 10000, // โหลดทั้งหมด
          search: searchParam,
          status: s,
        });
        allResults = allResults.concat(res?.res_data?.items || []);
      }
    } else {
      const res = await GetMeAllComplaints({
        skip: 0,
        limit: 10000, // โหลดทั้งหมด
        search: searchParam,
        // status: statusCode,
      });
      allResults = res?.res_data?.items || [];
    }

    // remove duplicates
    const unique = allResults.filter(
      (v, i, a) => a.findIndex(t => t.id === v.id) === i
    );

    setAllComplaints(unique);
    setTotalCount(unique.length);
    setPage(0);
  } catch (error) {
    setAllComplaints([]);
    setTotalCount(0);
    console.error("Load complaints failed", error);
  }
};

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line
  }, [page, rowsPerPage, search, statusFilter]);

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <>
      <NavbarMain />
      <Box sx={{ minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg">
          <BreadcrumbsService items={breadcrumbItems} />
        </Container>

        <TableAll
          title="ติดตามผลการดำเนินการ"
          data={allComplaints}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          navigateTo="/followup"
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Box>
    </>
  );
}