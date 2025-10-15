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
    startDate: null,
    endDate: null,
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
  const handleSearch = (filters = searchFilters) => {
    console.log("🔍 Search filters:", filters);

    const filtered = rows.filter((item) => {
      // ค้นหาตามชื่อผู้ร้องเรียน
      const matchName = filters.complainant_name
        ? item.complainant_name
            .toLowerCase()
            .includes(filters.complainant_name.toLowerCase())
        : true;

      // ค้นหาตามหัวข้อ
      const matchSubject = filters.subject
        ? item.subject
            .toLowerCase()
            .includes(filters.subject.toLowerCase())
        : true;

      // ค้นหาตาม complaint_number
      const matchcomplaint_number = filters.complaint_number
        ? item.complaint_number.toLowerCase().includes(filters.complaint_number.toLowerCase())
        : true;

      // ค้นหาตามวันที่รับเรื่อง (แบบเดิม)
      const matchDate = filters.confirm_assigned_date
        ? compareDates(item.confirm_assigned_date, filters.confirm_assigned_date)
        : true;

      // Filter ตามช่วงวันที่สร้าง
      let matchDateRange = true;
      if (filters.startDate || filters.endDate) {
        if (!item.created_at) {
          matchDateRange = false;
        } else {
          const itemDate = dayjs(item.created_at);
          if (!itemDate.isValid()) {
            matchDateRange = false;
          } else {
            // ถ้ามี startDate ให้เช็คว่าวันที่สร้างต้อง >= startDate
            if (filters.startDate) {
              const start = dayjs(filters.startDate).startOf('day');
              if (itemDate.isBefore(start)) matchDateRange = false;
            }

            // ถ้ามี endDate ให้เช็คว่าวันที่สร้างต้อง <= endDate
            if (filters.endDate) {
              const end = dayjs(filters.endDate).endOf('day');
              if (itemDate.isAfter(end)) matchDateRange = false;
            }
          }
        }
      }

      return matchName && matchSubject && matchcomplaint_number && matchDate && matchDateRange;
    });

    console.log(
      `🎯 Filtered results: ${filtered.length} items from ${rows.length} total`
    );
    setRows(filtered);
  };

  // ฟังก์ชันโหลดข้อมูลจาก API
  const fetchComplaints = async () => {
    try {
      setLoading(true);
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

  // ฟังก์ชันเคลียร์การค้นหา
  const handleClearSearch = () => {
    setSearchFilters({
      complainant_name: "",
      subject: "",
      complaint_number: "",
      confirm_assigned_date: null,
      startDate: null,
      endDate: null,
    });
    // โหลดข้อมูลใหม่ทั้งหมด
    fetchComplaints();
  };

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
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
