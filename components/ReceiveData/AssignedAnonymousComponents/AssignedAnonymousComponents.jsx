import React, { useState, useEffect } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAssignedComp from "@services/TableAssignedComp/TableAssignedComp";
import { useRouter } from "next/router";
import { GetComplaintsByPageTypeCard } from "@pages/api/complaint/complaint"; // Import the function
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Setup dayjs with Buddhist Era
dayjs.extend(buddhistEra);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("th");
const THAILAND_TIMEZONE = "Asia/Bangkok";

const breadcrumbItems = [
  {
    label: "บัตรสนเท่ห์ที่ได้รับมอบหมาย",
    icon: (
      <img
        src="/icons/Pencil.png"
        alt="pencil"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
];

const AssignedAnonymousComponents = () => {
  const [filteredRows, setFilteredRows] = useState([]); // State to store the filtered rows
  const [filters, setFilters] = useState({
    complainant_name: "",
    subject: "",
    complaint_number: "",
    confirm_assigned_date: null,
  });
  const [loading, setLoading] = useState(true); // Loading state

  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // Convert date to ISO string
  const convertDateToISO = (dateInput) => {
    if (!dateInput) return null;
    const parsedDate = new Date(dateInput);
    return parsedDate.toISOString();
  };

  // Compare dates
  const compareDates = (itemDateStr, filterDateStr) => {
    if (!itemDateStr || !filterDateStr) return true;

    try {
      const itemDate = dayjs(itemDateStr).tz(THAILAND_TIMEZONE);
      const filterDate = dayjs(filterDateStr).tz(THAILAND_TIMEZONE);

      return itemDate.isSame(filterDate, "day");
    } catch (error) {
      console.error("Error comparing dates:", error);
      return true; // Return all items if error occurs
    }
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Search function
  const handleSearch = () => {
    const filtered = filteredRows.filter((item) => {
      const matchName =
        filters.complainant_name && item.complainant_name
          ? item.complainant_name.toLowerCase().includes(filters.complainant_name.toLowerCase())
          : true;

      const matchSubject =
        filters.subject && item.subject
          ? item.subject.toLowerCase().includes(filters.subject.toLowerCase())
          : true;

      const matchcomplaint_number =
        filters.complaint_number && item.complaint_number
          ? item.complaint_number.toLowerCase().includes(filters.complaint_number.toLowerCase())
          : true;

      const matchDate = compareDates(item.confirm_assigned_date, filters.confirm_assigned_date);

      return matchName && matchSubject && matchcomplaint_number && matchDate;
    });

    setFilteredRows(filtered);
  };

  // Clear search filters
  const handleClearSearch = () => {
    setFilters({
      complainant_name: "",
      subject: "",
      complaint_number: "",
      confirm_assigned_date: null,
    });
    setFilteredRows([]);
  };

  // Fetch complaints from the API
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await GetComplaintsByPageTypeCard({
          pageType: "card", // Using the card pageType
          skip: 0,
          limit: 100,
          status: "SUBMITTED", // Default status
        });

        if (Array.isArray(data)) {
          setFilteredRows(data); // Set filtered rows with fetched data
        } else {
          console.error("Received data is not an array", data);
        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
      } finally {
        setLoading(false); // Stop loading once data is fetched
      }
    };

    fetchComplaints(); // Call the fetch function when component mounts
  }, []);

  // Row click handler
  const handleRowClick = (item) => {
    if (item.id) router.push(`/admin/edit/assigned-anonymous/${item.id}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />

      <Box
        sx={{
          overflowX: isTablet ? "auto" : "visible",
          overflowY: "visible",
          position: "relative",
        }}
      >
        <TableAssignedComp
          rows={filteredRows}
          handleRowClick={handleRowClick}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          searchFilters={filters}
          onFilterChange={handleFilterChange}
          title="บัตรสนเท่ห์ที่ได้รับมอบหมาย"
        />
      </Box>
    </>
  );
};

export default AssignedAnonymousComponents;
