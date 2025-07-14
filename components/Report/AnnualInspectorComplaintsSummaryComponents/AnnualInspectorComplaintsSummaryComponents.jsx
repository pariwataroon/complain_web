import React, { useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListCollapsReport from "@services/TableListCollapsReport/TableListCollapsReport";

// ─── mock data ───────────────────────────────────────────────────────
const mockComplaints = [
  {
    id: 1,
    claimantName: "หัวหน้าผู้ตรวจราชการกระทรวงการคลัง : นายปิยกร อภิบาลศรี",
    departmentsData: [
      {
        department:
          "กรมสรรพากร (ตรวจสอบการยื่นภาษีเงินได้, ร้องเรียนเจ้าหน้าที่, ขอคืนภาษี)",
        totalDept: 3,
        inProgressCnt: 2,
        closedCnt: 1,
        receiveDate: "2567-10-15",
      },
      {
        department:
          "สำนักงานสลากกินแบ่งรัฐบาล (ขอเปิดตัวสลากฯ, ต้านนโยบายสลากดิจิทัล, ขอคืนขายสลากฯ)",
        totalDept: 0,
        inProgressCnt: 0,
        closedCnt: 0,
        receiveDate: "2567-11-15"
      },
      {
        department: "ธนาคารอิสลามแห่งประเทศไทย",
        totalDept: 0,
        inProgressCnt: 0,
        closedCnt: 0,
        receiveDate: "2567-12-15",
      },
      {
        department:
          "บริษัท บริหารสินทรัพย์ ธนาคารอิสลามแห่งประเทศไทย จำกัด (บสอ.) (ปัญหาหนี้สิน)",
        totalDept: 0,
        inProgressCnt: 0,
        closedCnt: 0,
        receiveDate: "2568-1-15",
      },

      // ─── here is the multi-level node ────────────────────────────────────────
      {
        department:
          "ธนาคารแห่งประเทศไทย (ธปท.) (ปัญหาหนี้สินกับ บสย., มาตรการเยียวยา Covid-19)",
        totalDept: 3,
        inProgressCnt: 3,
        closedCnt: 0,
        receiveDate: "2568-1-18",

        // add a `children` array for the next level
        children: [
          {
            department:
              "บริษัท บริหารสินทรัพย์กรุงเทพพาณิชย์ จำกัด (บสก.) (ปัญหาหนี้สิน)",
            totalDept: 1,
            inProgressCnt: 1,
            closedCnt: 0,
          },
          {
            department:
              "บริษัท บริหารสินทรัพย์สุขุมวิท จำกัด (บสส.) (ปัญหาหนี้สิน)",
            totalDept: 1,
            inProgressCnt: 0,
            closedCnt: 1,
          },
          {
            department:
              "บริษัท บริหารสินทรัพย์ การ์เด้น เอกรัฐ จำกัด (ปัญหาหนี้สิน)",
            totalDept: 0,
            inProgressCnt: 0,
            closedCnt: 0,
          },
          {
            department: "บริษัท บริหารสินทรัพย์ เจเค จำกัด (ปัญหาหนี้สิน)",
            totalDept: 0,
            inProgressCnt: 0,
            closedCnt: 0,
          },
        ],
      },

      // ─── the rest of this level ─────────────────────────────────────────────
      {
        department:
          "บริษัท บริหารสินทรัพย์ ธนาคารอิสลามแห่งประเทศไทย จำกัด (บสอ.) (ปัญหาหนี้สิน)",
        totalDept: 0,
        inProgressCnt: 0,
        closedCnt: 0,
        receiveDate: "2568-2-5",
      },
      /* …etc… */
    ],
  },

  // You can repeat the same pattern for id:2–6:
  {
    id: 2,
    claimantName: "ผู้ตรวจราชการกระทรวงการคลัง : นายจุมพล…",
    departmentsData: [
      /* … */
      {
        department: "หน่วยงาน A",
        totalDept: 2,
        inProgressCnt: 1,
        closedCnt: 1,
        receiveDate: "2568-2-15",
        children: [
          /* next level… */
        ],
      },
      /* … */
    ],
  },

  // etc.
];

// ─── filter options ─────────────────────────────────────────────────────────
const claimantOptions = [
  ...mockComplaints.map((c) => ({
    value: c.claimantName,
    label: c.claimantName,
  })),
];

// ─── Component ─────────────────────────────────────────────────────────────
const AnnualInspectorComplaintsSummaryComponents = () => {
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  const convertADToBuddhist = (dateInput) => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    const year = date.getFullYear() + 543;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // พ.ศ.
  };

  const normalizeBuddhistDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-");
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const handleSearch = (filters) => {
    const {
      claimantName,
      department,
      responsibleOfficer,
      receiveDateFrom,
      receiveDateTo,
    } = filters;

    const fromDate = receiveDateFrom
      ? convertADToBuddhist(receiveDateFrom)
      : null;
    const toDate = receiveDateTo
      ? convertADToBuddhist(receiveDateTo)
      : null;

    const matchesDateRange = (dateStr) => {
      if (!dateStr) return false;
      const normalized = normalizeBuddhistDate(dateStr);
      if (!normalized) return false;
      if (fromDate && normalized < fromDate) return false;
      if (toDate && normalized > toDate) return false;
      return true;
    };

    const result = mockComplaints
      .map((item) => {
        // กรองรายชื่อผู้ตรวจ (parent level)
        if (claimantName && !item.claimantName.includes(claimantName)) return null;

        // กรองเจ้าหน้าที่รับผิดชอบ (ถ้ามี)
        if (responsibleOfficer && item.responsibleOfficer !== responsibleOfficer) return null;

        // คัดกรองเฉพาะ departmentsData ที่ตรงกับช่วงวันที่
        const filteredDepartments = item.departmentsData
          .map((dept) => {
            const matchedChildren = dept.children?.filter((child) =>
              matchesDateRange(child.receiveDate)
            );

            const matchedThisLevel = matchesDateRange(dept.receiveDate);

            if (matchedThisLevel || (matchedChildren && matchedChildren.length > 0)) {
              return {
                ...dept,
                children: matchedChildren?.length > 0 ? matchedChildren : undefined,
              };
            }

            return null;
          })
          .filter(Boolean); // ลบ null ออก

        if (filteredDepartments.length === 0) return null;

        return {
          ...item,
          departmentsData: filteredDepartments,
        };
      })
      .filter(Boolean); // ลบ null item ที่ไม่เข้าเงื่อนไข

    console.log("Filtered result:", result);
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
                src="/icons/note.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          {
            label: "รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ",
          },
        ]}
      />

      <TableListCollapsReport
        data={filteredComplaints}
        title="รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ"
        reportTitle="รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจประจำปีงบประมาณ"
        dateRange="ประจำปีงบประมาณ พ.ศ.2568"
        onSearch={handleSearch}
        filterFields={[
          {
            name: "claimantName",
            label: "รายชื่อผู้ตรวจ",
            type: "select",
            options: claimantOptions,
          },
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

export default AnnualInspectorComplaintsSummaryComponents;
