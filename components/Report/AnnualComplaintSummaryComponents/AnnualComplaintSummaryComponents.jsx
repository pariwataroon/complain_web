import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableAnnualCompSum from "@services/TableAnnualCompSum/TableAnnualCompSum";

const mockComplaints = [
  {
    id: 1,
    agency: "สำนักงานปลัดกระทรวงการคลัง / สำนักงานรัฐมนตรี",
    total: 22,
    closed: 20,
    ongoing: 2,
    receiveDate: "2567-10-15",
    children: [
      {
        id: 101,
        agency: "กลุ่มงานบริหารงานทั่วไป",
        total: 8,
        closed: 7,
        ongoing: 1,
      },
      {
        id: 102,
        agency: "กลุ่มงานนโยบายเศรษฐกิจมหภาค",
        total: 5,
        closed: 5,
        ongoing: 0,
      },
      {
        id: 103,
        agency: "กลุ่มงานตรวจสอบภายใน",
        total: 9,
        closed: 8,
        ongoing: 1,
      },
    ],
  },
  {
    id: 2,
    agency: "กรมธนารักษ์",
    total: 16,
    closed: 9,
    ongoing: 7,
    receiveDate: "2567-10-20",
    children: [
      {
        id: 201,
        agency: "สำนักบริหารทรัพย์สิน",
        total: 6,
        closed: 4,
        ongoing: 2,
      },
      {
        id: 202,
        agency: "สำนักปฏิบัติการธนารักษ์",
        total: 4,
        closed: 2,
        ongoing: 2,
      },
      { id: 203, agency: "สำนักพัฒนาระบบ", total: 6, closed: 3, ongoing: 3 },
    ],
  },
  {
    id: 3,
    agency: "กรมบัญชีกลาง",
    total: 4,
    closed: 2,
    ongoing: 2,
    receiveDate: "2567-11-01",
    children: [
      {
        id: 301,
        agency: "กลุ่มงานเบิกจ่ายเงินเดือน",
        total: 2,
        closed: 1,
        ongoing: 1,
      },
      {
        id: 302,
        agency: "กลุ่มงานบัญชีเงินทุน",
        total: 1,
        closed: 1,
        ongoing: 0,
      },
      {
        id: 303,
        agency: "กลุ่มงานพัสดุและทรัพย์สิน",
        total: 1,
        closed: 0,
        ongoing: 1,
      },
    ],
  },
  {
    id: 4,
    agency: "กรมศุลกากร",
    total: 2,
    closed: null,
    ongoing: 2,
    receiveDate: "2567-11-05",
    children: [
      {
        id: 401,
        agency: "ด่านศุลกากรกรุงเทพฯ",
        total: 1,
        closed: null,
        ongoing: 1,
      },
      {
        id: 402,
        agency: "ด่านศุลกากรท่าเรือ",
        total: 1,
        closed: null,
        ongoing: 1,
      },
    ],
  },
  {
    id: 5,
    agency: "กรมสรรพสามิต",
    total: 4,
    closed: 1,
    ongoing: 3,
    receiveDate: "2567-11-10",
    children: [
      {
        id: 501,
        agency: "กลุ่มตรวจสอบภาษีสรรพสามิต",
        total: 2,
        closed: 1,
        ongoing: 1,
      },
      {
        id: 502,
        agency: "กลุ่มบริหารภาษีสรรพสามิต",
        total: 1,
        closed: 0,
        ongoing: 1,
      },
      { id: 503, agency: "ศูนย์ข้อมูลกลาง", total: 1, closed: 0, ongoing: 1 },
    ],
  },
  {
    id: 6,
    agency: "กรมสรรพากร (เลี่ยงภาษี/คืนภาษีล่าช้า/ร้องเรียนเจ้าหน้าที่)",
    total: 2,
    closed: 1,
    ongoing: 1,
    receiveDate: "2567-11-15",
    children: [
      {
        id: 601,
        agency: "สำนักสนับสนุนจัดเก็บภาษี",
        total: 1,
        closed: 1,
        ongoing: 0,
      },
      {
        id: 602,
        agency: "กองคืนภาษีและปรับปรุงข้อมูล",
        total: 1,
        closed: 0,
        ongoing: 1,
      },
    ],
  },
  {
    id: 7,
    agency: "สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ (สคร.)",
    total: null,
    closed: null,
    ongoing: null,
    receiveDate: "2567-11-18",
    children: [
      {
        id: 701,
        agency: "กลุ่มวิเคราะห์และติดตามผล",
        total: null,
        closed: null,
        ongoing: null,
      },
      {
        id: 702,
        agency: "กลุ่มกำกับกิจการรัฐวิสาหกิจ",
        total: null,
        closed: null,
        ongoing: null,
      },
    ],
  },
  {
    id: 8,
    agency: "สำนักงานบริหารหนี้สาธารณะ (สบน.)",
    total: 7,
    closed: 4,
    ongoing: 3,
    receiveDate: "2567-11-20",
    children: [
      {
        id: 801,
        agency: "กลุ่มบริหารหนี้สาธารณะ",
        total: 3,
        closed: 2,
        ongoing: 1,
      },
      {
        id: 802,
        agency: "กลุ่มติดตามและปรับโครงสร้างหนี้",
        total: 4,
        closed: 2,
        ongoing: 2,
      },
    ],
  },
  {
    id: 9,
    agency:
      "สำนักงานเศรษฐกิจการคลัง (สศค.) (โครงการเราชนะ/บัตรสวัสดิการฯ/หนี้สิน/เงินทุนฯ)",
    total: 4,
    closed: null,
    ongoing: 4,
    receiveDate: "2567-11-22",
    children: [
      {
        id: 901,
        agency: "กลุ่มโครงการการเงินภาคประชาชน",
        total: 2,
        closed: null,
        ongoing: 2,
      },
      {
        id: 902,
        agency: "กลุ่มวิเคราะห์นโยบายสวัสดิการ",
        total: 2,
        closed: null,
        ongoing: 2,
      },
    ],
  },
  {
    id: 10,
    agency: "อื่นๆ",
    total: 8,
    closed: 6,
    ongoing: 2,
    receiveDate: "2567-11-25",
    children: [
      {
        id: 1001,
        agency: "สำนักงานผู้ตรวจการแผ่นดิน",
        total: 2,
        closed: 1,
        ongoing: 1,
      },
      {
        id: 1002,
        agency: "คณะกรรมการการเลือกตั้ง",
        total: 2,
        closed: 2,
        ongoing: 0,
      },
      {
        id: 1003,
        agency: "สำนักงานตำรวจแห่งชาติ",
        total: 4,
        closed: 3,
        ongoing: 1,
      },
    ],
  },
];

const AnnualComplaintSummaryComponents = () => {
  const [allComplaints] = useState(mockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  // เปลี่ยนหน้า summary
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // ฟังก์ชันแปลงวันที่จาก Thai date picker object ให้เป็น Buddhist year string
  const formatDateForComparison = (dateInput) => {
    if (!dateInput) return null;

    // ถ้าเป็น object ที่มี buddhistYear, month, day
    if (dateInput && typeof dateInput === "object" && dateInput.buddhistYear) {
      const year = dateInput.buddhistYear;
      const month = String(dateInput.month).padStart(2, "0");
      const day = String(dateInput.day).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // ถ้าเป็น Date object ให้แปลงเป็น Buddhist year
    if (dateInput instanceof Date) {
      const year = dateInput.getFullYear() + 543; // แปลงเป็น พ.ศ.
      const month = String(dateInput.getMonth() + 1).padStart(2, "0");
      const day = String(dateInput.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // ถ้าเป็น string แล้ว
    if (typeof dateInput === "string") {
      return dateInput.split("T")[0];
    }

    return String(dateInput);
  };

  // กรองข้อมูลตามวันที่
  const handleSearch = ({ receiveDateFrom, receiveDateTo, issueType }) => {
    console.log("Search params:", {
      receiveDateFrom,
      receiveDateTo,
      issueType,
    }); // Debug log

    let result = allComplaints;

    // กรองตามวันที่เริ่มต้น
    if (receiveDateFrom) {
      const fromDate = formatDateForComparison(receiveDateFrom);
      console.log("From date formatted:", fromDate); // Debug log

      result = result.filter((item) => {
        if (!item.receiveDate) return false;
        const itemDate = formatDateForComparison(item.receiveDate);
        console.log(
          `Comparing ${itemDate} >= ${fromDate}:`,
          itemDate >= fromDate
        ); // Debug log
        return itemDate >= fromDate;
      });
    }

    // กรองตามวันที่สิ้นสุด
    if (receiveDateTo) {
      const toDate = formatDateForComparison(receiveDateTo);
      console.log("To date formatted:", toDate); // Debug log

      result = result.filter((item) => {
        if (!item.receiveDate) return false;
        const itemDate = formatDateForComparison(item.receiveDate);
        console.log(`Comparing ${itemDate} <= ${toDate}:`, itemDate <= toDate); // Debug log
        return itemDate <= toDate;
      });
    }

    // กรองตามประเภทเรื่อง (ถ้ามี)
    if (issueType) {
      result = result.filter((item) => item.issueType === issueType);
    }

    console.log("Filtered result:", result); // Debug log
    setFilteredComplaints(result);
  };

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "เมนูรายงาน",
            icon: (
              <img
                src="/icons/Cube.png"
                alt="cube"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          { label: "รายงานสรุปเรื่องร้องเรียนประจำปีงบประมาณ" },
        ]}
      />

      <TableAnnualCompSum
        data={filteredComplaints}
        onSearch={handleSearch}
        actionButtonLabel="สรุปผลตามประเภทเรื่อง"
        onActionClick={handleSummaryByIssueType}
        navigateTo="/admin/document/annual-complaint-summary/reportresults"
        filterFields={[
          {
            name: "receiveDateFrom",
            label: "ตั้งแต่วันที่",
            type: "date",
          },
          {
            name: "receiveDateTo",
            label: "ถึงวันที่",
            type: "date",
          },
        ]}
      />
    </>
  );
};

export default AnnualComplaintSummaryComponents;
