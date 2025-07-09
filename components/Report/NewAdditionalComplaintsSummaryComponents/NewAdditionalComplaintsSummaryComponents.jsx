import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableNewAddComp from "@services/TableNewAddComp/TableNewAddComp";

// สำหรับกรองเดือน (คำย่อในวันที่)
const THAI_MONTH_ABBREV = {
  1: "ม.ค.",
  2: "ก.พ.",
  3: "มี.ค.",
  4: "เม.ย.",
  5: "พ.ค.",
  6: "มิ.ย.",
  7: "ก.ค.",
  8: "ส.ค.",
  9: "ก.ย.",
  10: "ต.ค.",
  11: "พ.ย.",
  12: "ธ.ค.",
};

// ตัวเลือกเดือน (สำหรับ SelectField)
const MONTH_OPTIONS = [
  { value: "1", label: "มกราคม" },
  { value: "2", label: "กุมภาพันธ์" },
  { value: "3", label: "มีนาคม" },
  { value: "4", label: "เมษายน" },
  { value: "5", label: "พฤษภาคม" },
  { value: "6", label: "มิถุนายน" },
  { value: "7", label: "กรกฎาคม" },
  { value: "8", label: "สิงหาคม" },
  { value: "9", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
];

// ตัวเลือกปีงบประมาณ
const FISCAL_YEAR_OPTIONS = [
  { value: "2566", label: "2566" },
  { value: "2567", label: "2567" },
  { value: "2568", label: "2568" },
  { value: "2569", label: "2569" },
  { value: "2570", label: "2570" },
];

// ─── mock data (20 รายการ) ─────────────────────────────────────────────────
const originalMockComplaints = [
  {
    id: 1,
    receiveDate: "30 ม.ค. 2568",
    receiptNumber: "97/68",
    claimantName: "นางสาวภัทร มีความสุข",
    responsibleOfficer: "นางสาววิชนิดา มณี",
    agency: "กรมธนารักษ์",
    issueType: "พฤติกรรมเจ้าหน้าที่",
    note: "ส่งเรื่องให้หน่วยงานพิจารณาให้ความช่วยเหลือแล้ว",
  },
  // ... [other mock data remains the same]
];

const NewAdditionalComplaintsSummaryComponents = () => {
  // เริ่มต้นโดยใช้ข้อมูลจาก localStorage หรือใช้ค่าเริ่มต้นถ้าไม่มี
  const [allComplaints, setAllComplaints] = useState(originalMockComplaints);
  const [filteredComplaints, setFilteredComplaints] = useState(
    originalMockComplaints
  );
  const router = useRouter();

  useEffect(() => {
    // ตรวจสอบว่ามีข้อมูลที่อัปเดตใน localStorage หรือไม่
    const updatedData = localStorage.getItem("updatedComplaints");
    if (updatedData) {
      try {
        const parsedData = JSON.parse(updatedData);
        // อัปเดตข้อมูลเฉพาะหมายเหตุ (note) จากข้อมูลที่อัพเดทแล้ว
        const updatedComplaints = allComplaints.map((complaint) => {
          const updatedComplaint = parsedData.find(
            (item) => item.id === complaint.id
          );
          return updatedComplaint
            ? { ...complaint, note: updatedComplaint.note }
            : complaint;
        });

        setAllComplaints(updatedComplaints);
        setFilteredComplaints(updatedComplaints);

        // ลบข้อมูลใน localStorage หลังจากใช้งานเสร็จ
        localStorage.removeItem("updatedComplaints");
      } catch (e) {
        console.error("เกิดข้อผิดพลาดในการอ่านข้อมูลที่อัปเดต:", e);
      }
    }
  }, []);

  // เปลี่ยนหน้า summary
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // กรองข้อมูลตามเดือนและปีงบประมาณ
  const handleSearch = ({ receiveDateFrom, receiveDateTo }) => {
    let result = allComplaints;

    if (receiveDateFrom) {
      const monthLabel = THAI_MONTH_ABBREV[receiveDateFrom];
      result = result.filter((item) => item.receiveDate.includes(monthLabel));
    }

    if (receiveDateTo) {
      result = result.filter((item) =>
        item.receiveDate.endsWith(receiveDateTo)
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
                src="/icons/Cube.png"
                alt="cube"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          { label: "รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่มทั้งหมด" },
        ]}
      />

      <TableNewAddComp
        data={filteredComplaints}
        title="รายงานสรุปเรื่องเข้าใหม่และร้องเพิ่มทั้งหมด"
        onSearch={handleSearch}
        actionButtonLabel="แก้ไขหมายเหตุ"
        onActionClick={handleSummaryByIssueType}
        filterFields={[
          {
            name: "receiveDateFrom",
            label: "เดือน",
            type: "select",
            options: MONTH_OPTIONS,
          },
          {
            name: "receiveDateTo",
            label: "ปีงบประมาณ",
            type: "select",
            options: FISCAL_YEAR_OPTIONS,
          },
        ]}
      />
    </>
  );
};

export default NewAdditionalComplaintsSummaryComponents;
