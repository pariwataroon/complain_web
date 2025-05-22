import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
} from "@mui/material";
import NavbarMain from "@services/navbarMain/navbarMain";
import BreadcrumbsService from "@services/Breadcrumbs/breadcrumbs";
import TableAll from "@services/table/TableAll";
import { GetMeAllComplaints } from "@pages/api/complaint/complaint";

export default function FollowupComponent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  
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

  const fetchComplaints = async () => {
    const skip = page * limit;
    try {
      const res = await GetMeAllComplaints({ skip, limit });
      setAllComplaints(res?.res_data?.items || []);
      setFilteredComplaints(res?.res_data?.items || []);
      setTotalCount(res?.res_data?.pagination?.total || 0);
    } catch (error) {
      console.error("Load complaints failed", error);
    }
  };

  useEffect(() => {
    let filtered = allComplaints;

    if (search) {
      filtered = filtered.filter((item) =>
        item.subject?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const statusValue =
      typeof statusFilter === "string"
        ? statusFilter
        : statusFilter?.value ?? "";

    if (statusValue) {
      filtered = filtered.filter((item) => item.status === statusValue);
    }

    setFilteredComplaints(filtered);
  }, [search, statusFilter, allComplaints]);
  

  
  useEffect(() => {
    fetchComplaints();
  }, [page, limit]);


  return (
    <>
      <NavbarMain />
      <Box sx={{ minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg">
          <BreadcrumbsService items={breadcrumbItems} />
        </Container>

        <TableAll
          title="ติดตามผลการดำเนินการ"
          data={filteredComplaints}
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
