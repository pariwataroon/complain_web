import React, { useState, useEffect } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAssignedComp from "@services/TableAssignedComp/TableAssignedComp";
import { useRouter } from "next/router";
import { GetComplaintsByPageType } from "@pages/api/complaint/complaint";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

const breadcrumbItems = [
  {
    label: "เรื่องร้องเรียนที่ได้รับมอบหมาย",
    icon: (
      <img
        src="/icons/Pencil.png"
        alt="pencil"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
];

const AssignedComplaintsComponents = () => {
  const [searchFilters, setSearchFilters] = useState({
    complainant_name: "",
    subject: "",
    complaint_number: "",
    confirm_assigned_date: null,
  });

  const [rows, setRows] = useState([]); // ใช้ state นี้แทน mockData
  const [loading, setLoading] = useState(true); // สถานะโหลดข้อมูล
  const router = useRouter();

  // ฟังก์ชันสำหรับการแปลงวันที่เป็น ISO string
  const convertDateToISO = (dateInput) => {
    if (!dateInput) return null;

    try {
      // หากเป็น ISO string แล้ว
      if (typeof dateInput === "string" && dateInput.includes("T")) {
        return dateInput;
      }

      // หากเป็นอ็อบเจ็กต์จาก DateThaiPickerService
      if (
        typeof dateInput === "object" &&
        dateInput.year &&
        dateInput.month &&
        dateInput.day
      ) {
        const isoDate = new Date(dateInput.year, dateInput.month - 1, dateInput.day);
        return isoDate.toISOString();
      }

      // หากเป็น string ที่มีรูปแบบวันที่อื่น
      if (typeof dateInput === "string") {
        const parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString();
        }
      }

      return null;
    } catch (error) {
      console.error("Error converting date:", error);
      return null;
    }
  };

  // ฟังก์ชันสำหรับเปรียบเทียบวันที่
  const compareDates = (itemDate, filterDate) => {
    if (!itemDate || !filterDate) return false;

    try {
      // แปลงวันที่ฟิลเตอร์เป็น ISO
      const filterISO = convertDateToISO(filterDate);
      if (!filterISO) return false;

      // เปรียบเทียบเฉพาะวันที่ (ไม่รวมเวลา)
      const itemDateObj = new Date(itemDate);
      const filterDateObj = new Date(filterISO);

      return (
        itemDateObj.getFullYear() === filterDateObj.getFullYear() &&
        itemDateObj.getMonth() === filterDateObj.getMonth() &&
        itemDateObj.getDate() === filterDateObj.getDate()
      );
    } catch (error) {
      console.error("Error comparing dates:", error);
      return false;
    }
  };

  // ฟังก์ชันสำหรับเปลี่ยนค่า filter
  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ฟังก์ชันค้นหาข้อมูล
  const handleSearch = () => {
    console.log("🔍 Search filters:", searchFilters);

    const filtered = rows.filter((item) => {
      // ค้นหาตามชื่อผู้ร้องเรียน
      const matchName = searchFilters.complainant_name
        ? item.complainant_name
            .toLowerCase()
            .includes(searchFilters.complainant_name.toLowerCase())
        : true;

      // ค้นหาตามหัวข้อ
      const matchSubject = searchFilters.subject
        ? item.subject
            .toLowerCase()
            .includes(searchFilters.subject.toLowerCase())
        : true;

      // ค้นหาตาม complaint_number
      const matchcomplaint_number = searchFilters.complaint_number
        ? item.complaint_number.toLowerCase().includes(searchFilters.complaint_number.toLowerCase())
        : true;

      // ค้นหาตามวันที่รับเรื่อง
      const matchDate = searchFilters.confirm_assigned_date
        ? compareDates(item.confirm_assigned_date, searchFilters.confirm_assigned_date)
        : true;

      return matchName && matchSubject && matchcomplaint_number && matchDate;
    });

    console.log(
      `🎯 Filtered results: ${filtered.length} items from ${rows.length} total`
    );
    setRows(filtered);
  };

  // ฟังก์ชันเคลียร์การค้นหา
  const handleClearSearch = () => {
    setSearchFilters({
      complainant_name: "",
      subject: "",
      complaint_number: "",
      confirm_assigned_date: null,
    });
    setRows([]);  // เคลียร์แถว
  };

// ฟังก์ชันโหลดข้อมูลจาก API
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await GetComplaintsByPageType({
          pageType: "website",
          skip: 0,
          limit: 10000,
        });

        if (response?.res_code === "0000" && Array.isArray(response?.res_data?.items)) {
          const complaints = response.res_data.items.map((item) => item.complaint);
          setRows(complaints);
        } else {
          console.error("Unexpected response format", response);
        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  // ฟังก์ชันคลิกที่แถวเพื่อแก้ไขข้อมูล
  const handleRowClick = (item) => {
    if (item.id) router.push(`/admin/edit/assigned-complaints/${item.id}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />
      <TableAssignedComp
        title="เรื่องร้องเรียนที่ได้รับมอบหมาย"
        rows={rows}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        searchFilters={searchFilters}
        onFilterChange={handleFilterChange}
        handleRowClick={handleRowClick}
      />
    </>
  );
};

export default AssignedComplaintsComponents;
