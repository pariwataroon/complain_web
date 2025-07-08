import React, { useState } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAssignedComp from "@services/TableAssignedComp/TableAssignedComp";
import { useRouter } from "next/router";
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

const mockData = [
  {
    id: 1,
    name: "นางสาวณภัทร มีความสุข",
    subject: "พฤติกรรมเจ้าหน้าที่กกต.ไม่เหมาะสม",
    docNo4: "125/26",
    docNo: "สป-กค-1234-5-678-9",
    docNo2: "สป-สร-1234-5-678-9",
    docNo3: "สตป-1234-5-678-9",
    receiveDate: "2025-01-17T00:00:00.000Z",
  },
  {
    id: 2,
    name: "นายสมชาย ใจดี",
    subject: "การเรียกเก็บค่าธรรมเนียมเกินกว่าที่กฎหมายกำหนด",
    docNo4: "126/26",
    docNo: "สป-กค-2345-6-789-0",
    docNo2: "สป-สร-2345-6-789-0",
    docNo3: "สตป-2345-6-789-0",
    receiveDate: "2025-01-18T00:00:00.000Z",
  },
  {
    id: 3,
    name: "นางสาวจารุณี สิขังสมาธิมี",
    subject: "การยื่นเอกสารล่าช้าทำให้เสียสิทธิ์",
    docNo4: "127/26",
    docNo: "สป-กค-3456-7-890-1",
    docNo2: "สป-สร-3456-7-890-1",
    docNo3: "สตป-3456-7-890-1",
    receiveDate: "2025-01-19T00:00:00.000Z",
  },
  {
    id: 4,
    name: "บริษัท สกายเทค อินโนเวชั่น จำกัด",
    subject: "ปัญหาการเบิกจ่ายงบประมาณโครงการ",
    docNo4: "128/26",
    docNo: "สป-กค-4567-8-901-2",
    docNo2: "สป-สร-4567-8-901-2",
    docNo3: "สตป-4567-8-901-2",
    receiveDate: "2025-01-20T00:00:00.000Z",
  },
  {
    id: 5,
    name: "นายปาเจรา จาริยา",
    subject: "ความล่าช้าในการอนุมัติโครงการ",
    docNo4: "129/26",
    docNo: "สป-กค-5678-9-012-3",
    docNo2: "สป-สร-5678-9-012-3",
    docNo3: "สตป-5678-9-012-3",
    receiveDate: "2025-01-21T00:00:00.000Z",
  },
  {
    id: 6,
    name: "นางวิภาดา รักษ์สันติ",
    subject: "การปฏิเสธการให้บริการโดยไม่มีเหตุผล",
    docNo4: "130/26",
    docNo: "สป-กค-6789-0-123-4",
    docNo2: "สป-สร-6789-0-123-4",
    docNo3: "สตป-6789-0-123-4",
    receiveDate: "2025-01-22T00:00:00.000Z",
  },
  {
    id: 7,
    name: "บริษัท เอ็กซ์เซลเลนท์ ซัพพลาย จำกัด",
    subject: "การชำระเงินล่าช้าตามสัญญา",
    docNo4: "131/26",
    docNo: "สป-กค-7890-1-234-5",
    docNo2: "สป-สร-7890-1-234-5",
    docNo3: "สตป-7890-1-234-5",
    receiveDate: "2025-01-23T00:00:00.000Z",
  },
  {
    id: 8,
    name: "นางสาวอภิญญา แสนสุข",
    subject: "ขอความช่วยเหลือด้านกฎหมาย",
    docNo4: "132/26",
    docNo: "สป-กค-8901-2-345-6",
    docNo2: "สป-สร-8901-2-345-6",
    docNo3: "สตป-8901-2-345-6",
    receiveDate: "2025-01-24T00:00:00.000Z",
  },
  {
    id: 9,
    name: "นายธีรพัฒน์ มั่นคง",
    subject: "การเลือกปฏิบัติในหน่วยงาน",
    docNo4: "133/26",
    docNo: "สป-กค-9012-3-456-7",
    docNo2: "สป-สร-9012-3-456-7",
    docNo3: "สตป-9012-3-456-7",
    receiveDate: "2025-01-25T00:00:00.000Z",
  },
  {
    id: 10,
    name: "บริษัท ไทยรุ่งเรือง จำกัด",
    subject: "ความไม่โปร่งใสในกระบวนการจัดซื้อจัดจ้าง",
    docNo4: "134/26",
    docNo: "สป-กค-0123-4-567-8",
    docNo2: "สป-สร-0123-4-567-8",
    docNo3: "สตป-0123-4-567-8",
    receiveDate: "2025-01-26T00:00:00.000Z",
  },
  {
    id: 11,
    name: "นางสาวมณีรัตน์ สุขใจ",
    subject: "การละเมิดข้อมูลส่วนบุคคล",
    docNo4: "135/26",
    docNo: "สป-กค-1234-5-678-0",
    docNo2: "สป-สร-1234-5-678-0",
    docNo3: "สตป-1234-5-678-0",
    receiveDate: "2025-01-27T00:00:00.000Z",
  },
  {
    id: 12,
    name: "นายอำนาจ กล้าหาญ",
    subject: "การปฏิเสธการจ่ายเงินชดเชย",
    docNo4: "136/26",
    docNo: "สป-กค-2345-6-789-1",
    docNo2: "สป-สร-2345-6-789-1",
    docNo3: "สตป-2345-6-789-1",
    receiveDate: "2025-01-28T00:00:00.000Z",
  },
  {
    id: 13,
    name: "นางสาวจันทร์เจ้า เทพรักษ์",
    subject: "ปัญหาสาธารณูปโภคในชุมชน",
    docNo4: "137/26",
    docNo: "สป-กค-3456-7-890-2",
    docNo2: "สป-สร-3456-7-890-2",
    docNo3: "สตป-3456-7-890-2",
    receiveDate: "2025-01-29T00:00:00.000Z",
  },
  {
    id: 14,
    name: "บริษัท กรีนฟิลด์ จำกัด",
    subject: "การปล่อยมลพิษไม่ตรงตามมาตรฐาน",
    docNo4: "138/26",
    docNo: "สป-กค-4567-8-901-3",
    docNo2: "สป-สร-4567-8-901-3",
    docNo3: "สตป-4567-8-901-3",
    receiveDate: "2025-01-30T00:00:00.000Z",
  },
  {
    id: 15,
    name: "นายปรเมศวร์ วัฒนกิจ",
    subject: "การรับสินบนของเจ้าหน้าที่",
    docNo4: "139/26",
    docNo: "สป-กค-5678-9-012-4",
    docNo2: "สป-สร-5678-9-012-4",
    docNo3: "สตป-5678-9-012-4",
    receiveDate: "2025-01-31T00:00:00.000Z",
  },
  {
    id: 16,
    name: "นางสาวพัชรินทร์ นิ่มนวล",
    subject: "การถูกเลิกจ้างโดยไม่เป็นธรรม",
    docNo4: "140/26",
    docNo: "สป-กค-6789-0-123-5",
    docNo2: "สป-สร-6789-0-123-5",
    docNo3: "สตป-6789-0-123-5",
    receiveDate: "2025-02-01T00:00:00.000Z",
  },
  {
    id: 17,
    name: "บริษัท ไทยซอฟต์ จำกัด",
    subject: "การละเมิดลิขสิทธิ์ซอฟต์แวร์",
    docNo4: "141/26",
    docNo: "สป-กค-7890-1-234-6",
    docNo2: "สป-สร-7890-1-234-6",
    docNo3: "สตป-7890-1-234-6",
    receiveDate: "2025-02-02T00:00:00.000Z",
  },
  {
    id: 18,
    name: "นายจักรพงษ์ แข็งแรง",
    subject: "การทุจริตในการสอบคัดเลือก",
    docNo4: "142/26",
    docNo: "สป-กค-8901-2-345-7",
    docNo2: "สป-สร-8901-2-345-7",
    docNo3: "สตป-8901-2-345-7",
    receiveDate: "2025-02-03T00:00:00.000Z",
  },
  {
    id: 19,
    name: "นางสาวมาลี มั่งคั่ง",
    subject: "การซื้อสินค้าออนไลน์แล้วไม่ได้รับสินค้า",
    docNo4: "143/26",
    docNo: "สป-กค-9012-3-456-8",
    docNo2: "สป-สร-9012-3-456-8",
    docNo3: "สตป-9012-3-456-8",
    receiveDate: "2025-02-04T00:00:00.000Z",
  },
  {
    id: 20,
    name: "บริษัท แกรนด์เทค จำกัด",
    subject: "การส่งมอบงานไม่ตรงตามข้อกำหนด",
    docNo4: "144/26",
    docNo: "สป-กค-0123-4-567-9",
    docNo2: "สป-สร-0123-4-567-9",
    docNo3: "สตป-0123-4-567-9",
    receiveDate: "2025-02-05T00:00:00.000Z",
  },
];

const AssignedComplaintsComponents = () => {
  // State for search filters
  const [searchFilters, setSearchFilters] = useState({
    claimantName: "",
    subject: "",
    docNo4: "",
    receiveDate: null,
  });

  // State for filtered rows
  const [rows, setRows] = useState(mockData);
  const router = useRouter();

  // Function to convert date to ISO string
  const convertDateToISO = (dateInput) => {
    if (!dateInput) return null;

    try {
      // If already ISO string
      if (typeof dateInput === "string" && dateInput.includes("T")) {
        return dateInput;
      }

      // If object from DateThaiPickerService
      if (
        typeof dateInput === "object" &&
        dateInput.year &&
        dateInput.month &&
        dateInput.day
      ) {
        const isoDate = new Date(
          dateInput.year,
          dateInput.month - 1,
          dateInput.day
        );
        return isoDate.toISOString();
      }

      // If other string date format
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

  // Function to compare dates
  const compareDates = (itemDate, filterDate) => {
    if (!itemDate || !filterDate) return false;

    try {
      // Convert filter date to ISO
      const filterISO = convertDateToISO(filterDate);
      if (!filterISO) return false;

      // Convert to date objects for comparison
      const itemDateObj = new Date(itemDate);
      const filterDateObj = new Date(filterISO);

      // Compare only the date (not time)
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

  // Function to handle filter changes
  const handleFilterChange = (field, value) => {
    setSearchFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Function to filter data
  const handleSearch = () => {
    console.log("🔍 Search filters:", searchFilters);

    const filtered = mockData.filter((item) => {
      // Filter by claimant name
      const matchName = searchFilters.claimantName
        ? item.name
            .toLowerCase()
            .includes(searchFilters.claimantName.toLowerCase())
        : true;

      // Filter by subject
      const matchSubject = searchFilters.subject
        ? item.subject
            .toLowerCase()
            .includes(searchFilters.subject.toLowerCase())
        : true;

      // Filter by docNo4
      const matchDocNo4 = searchFilters.docNo4
        ? item.docNo4.toLowerCase().includes(searchFilters.docNo4.toLowerCase())
        : true;

      // Filter by receive date
      const matchDate = searchFilters.receiveDate
        ? compareDates(item.receiveDate, searchFilters.receiveDate)
        : true;

      return matchName && matchSubject && matchDocNo4 && matchDate;
    });

    console.log(
      `🎯 Filtered results: ${filtered.length} items from ${mockData.length} total`
    );
    setRows(filtered);
  };

  // Function to clear search
  const handleClearSearch = () => {
    setSearchFilters({
      claimantName: "",
      subject: "",
      docNo4: "",
      receiveDate: null,
    });
    setRows(mockData);
  };

  const handleRowClick = (item) => {
    if (item.id) router.push(`/admin/edit/assigned-complaints/${item.id}`);
  };

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
