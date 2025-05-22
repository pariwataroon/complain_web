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
      },
      {
        department:
          "สำนักงานสลากกินแบ่งรัฐบาล (ขอเปิดตัวสลากฯ, ต้านนโยบายสลากดิจิทัล, ขอคืนขายสลากฯ)",
        totalDept: 0,
        inProgressCnt: 0,
        closedCnt: 0,
      },
      {
        department: "ธนาคารอิสลามแห่งประเทศไทย",
        totalDept: 0,
        inProgressCnt: 0,
        closedCnt: 0,
      },
      {
        department:
          "บริษัท บริหารสินทรัพย์ ธนาคารอิสลามแห่งประเทศไทย จำกัด (บสอ.) (ปัญหาหนี้สิน)",
        totalDept: 0,
        inProgressCnt: 0,
        closedCnt: 0,
      },

      // ─── here is the multi-level node ────────────────────────────────────────
      {
        department:
          "ธนาคารแห่งประเทศไทย (ธปท.) (ปัญหาหนี้สินกับ บสย., มาตรการเยียวยา Covid-19)",
        totalDept: 3,
        inProgressCnt: 3,
        closedCnt: 0,

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
  { value: "", label: "ทั้งหมด" },
  ...mockComplaints.map((c) => ({
    value: c.claimantName,
    label: c.claimantName,
  })),
];

// ─── Component ─────────────────────────────────────────────────────────────
const AnnualInspectorComplaintsSummaryComponents = () => {
  const [filteredComplaints, setFilteredComplaints] = useState(mockComplaints);
  const router = useRouter();

  const handleSearch = (filters) => {
    const { claimantName, department, responsibleOfficer } = filters;
    let result = mockComplaints;

    if (claimantName) {
      result = result.filter((item) =>
        item.claimantName.includes(claimantName)
      );
    }
    if (department) {
      result = result.filter(
        (item) =>
          item.department === department ||
          item.departmentsData.some((d) => d.department === department)
      );
    }
    if (responsibleOfficer) {
      result = result.filter(
        (item) => item.responsibleOfficer === responsibleOfficer
      );
    }

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
        reportTitle="รายงานสรุปเรื่องราวร้องทุกข์ของผู้ตรวจ"
        reportSubTitle=""
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
            name: "department",
            label: "ตั้งแต่วันที่",
            type: "date",
          },
          {
            name: "responsibleOfficer",
            label: "ถึงวันที่",
            type: "date",
          },
        ]}
      />
    </>
  );
};

export default AnnualInspectorComplaintsSummaryComponents;
