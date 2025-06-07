import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListOPM from "@services/TableListOPM/TableListOPM";
import Cookies from "js-cookie";
import { Encode, GetTimelineHeader } from "@pages/api/opm/opm";

const Opm1111Components = () => {
  const [result, setResult] = useState("");
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const existingToken = Cookies.get("opm_token");
        if (existingToken) {
          setResult(existingToken);
        } else {
          const encodeResult = await Encode();
          setResult(encodeResult.token_id);
        }
      } catch (error) {
        console.error("Error:", error);
        setResult("Error occurred while fetching token.");
      }
    };

    fetchToken();
  }, []);

  const fetchTimelineHeader = async (take) => {
    try {
      const timelineData = await GetTimelineHeader(take);
      const parsedData = Array.isArray(timelineData) ? timelineData : timelineData;

      const mappedComplaints = parsedData.map((item) => ({
        case_id: item.case_id,
        case_code: item.case_code,
        customer_name: item.customer_name,
        type_text: item.type_text,
        secret_id: item.secret_id,
        status_text: item.status_text,
        main_status_text: item.main_status_text,
        Action: "View Details",
      }));

      setComplaints(mappedComplaints);
      setFilteredComplaints(mappedComplaints);
    } catch (error) {
      console.error("Error fetching timeline header:", error);
    }
  };

  useEffect(() => {
    fetchTimelineHeader(rowsPerPage);
  }, [rowsPerPage]);

  const handleSearch = (searchQuery) => {
    const filtered = complaints.filter((complaint) =>
      complaint.case_code.includes(searchQuery) || complaint.customer_name.includes(searchQuery)
    );
    setFilteredComplaints(filtered);
  };

  const handleNavigateTo = (path) => {
    router.push(path);
  };

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "รับเข้าข้อมูล",
            icon: (
              <img
                src="/icons/Pencil.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          { label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ OPM1111" },
        ]}
      />
      

      <TableListOPM
        data={filteredComplaints}
        title="เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ OPM1111"
        navigateTo="/admin/edit/opm1111"
        onSearch={handleSearch}
        handleNavigateTo={handleNavigateTo}
        onRowsPerPageChange={(newRowsPerPage) => setRowsPerPage(newRowsPerPage)}
      />

    </>
  );
};

export default Opm1111Components;