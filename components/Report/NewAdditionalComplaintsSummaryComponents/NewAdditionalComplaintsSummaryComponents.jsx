import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableNewAddComp from "@services/TableNewAddComp/TableNewAddComp";
import { getNewAdditionalComplaintsReport } from "@pages/api/complaintreports/reports";

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

// Helper: แปลงวันที่ ISO เป็นรูปแบบ "30 ม.ค. 2568"
function formatApiDateThai(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date)) return "-";
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear() + 543;
  return `${day} ${THAI_MONTH_ABBREV[month]} ${year}`;
}

// แปลง filing_type เป็นภาษาไทย
const FILING_TYPE_LABELS = {
  new: "เรื่องร้องเรียนใหม่",
  additional: "เรื่องร้องเรียนเพิ่มเติม",
  committee: "คณะกรรมการ",
};

const NewAdditionalComplaintsSummaryComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ดึงข้อมูลจาก API
  const fetchData = async () => {
    setLoading(true);
    try {
      // หากอยากส่ง filter จริงๆ ให้ส่งใน params ได้เลย
      const response = await getNewAdditionalComplaintsReport({
        skip: 0,
        limit: 1000, // API limit สูงสุด 1000
        // สามารถใส่ filter เพิ่มได้ เช่น date_from, date_to, department_id, officer_id, search
      });

      if (
        response &&
        response.res_code === "0000" &&
        response.res_data &&
        Array.isArray(response.res_data.items)
      ) {
        // แปลงข้อมูลให้อยู่ในโครงสร้างที่ TableNewAddComp ใช้
        const transformed = response.res_data.items.map((item) => ({
          id: item.id,
          receiveDate: formatApiDateThai(item.received_date),
          receiptNumber: item.complaint_number || "-",
          claimantName: item.complainant_name || "-",
          responsibleOfficer: item.assigned_officer_name || "-",
          // แปลง department_name จาก UUID เป็นชื่อหน่วยงาน (ถ้าเป็น UUID ให้แสดงชื่อหน่วยงานภายในจาก assigned_department_name)
          agency: item.assigned_department_name || item.department_name || "-",
          // แปลง filing_type เป็นภาษาไทย
          issueType: FILING_TYPE_LABELS[item.filing_type] || item.filing_type || "-",
          note: item.remark || "",
          filingType: FILING_TYPE_LABELS[item.filing_type] || item.filing_type || "-",
        }));
        setAllComplaints(transformed);
        setFilteredComplaints(transformed);
      } else {
        setAllComplaints([]);
        setFilteredComplaints([]);
      }
    } catch (e) {
      setAllComplaints([]);
      setFilteredComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // ตรวจสอบว่ามีข้อมูลที่อัปเดตใน localStorage หรือไม่
    const updatedData = localStorage.getItem("updatedComplaints");
    if (updatedData) {
      try {
        const parsedData = JSON.parse(updatedData);
        // อัปเดตข้อมูลเฉพาะหมายเหตุ (note) จากข้อมูลที่อัพเดทแล้ว
        setAllComplaints((prev) =>
          prev.map((complaint) => {
            const updatedComplaint = parsedData.find(
              (item) => item.id === complaint.id
            );
            return updatedComplaint
              ? { ...complaint, note: updatedComplaint.note }
              : complaint;
          })
        );
        setFilteredComplaints((prev) =>
          prev.map((complaint) => {
            const updatedComplaint = parsedData.find(
              (item) => item.id === complaint.id
            );
            return updatedComplaint
              ? { ...complaint, note: updatedComplaint.note }
              : complaint;
          })
        );
        localStorage.removeItem("updatedComplaints");
      } catch (e) {
        console.error("เกิดข้อผิดพลาดในการอ่านข้อมูลที่อัปเดต:", e);
      }
    }
    // eslint-disable-next-line
  }, []);

  // เปลี่ยนหน้า summary
  const handleSummaryByIssueType = () => {
    router.push(
      "/admin/document/new-additional-complaints-summary/summaryresults"
    );
  };

  // ฟังก์ชันกรองข้อมูลตามเดือนและปีงบประมาณ
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
        data={loading ? [] : filteredComplaints}
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
        loading={loading}
      />
    </>
  );
};

export default NewAdditionalComplaintsSummaryComponents;