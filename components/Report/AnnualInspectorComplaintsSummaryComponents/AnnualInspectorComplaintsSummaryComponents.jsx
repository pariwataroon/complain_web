import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListCollapsReport from "@services/TableListCollapsReport/TableListCollapsReport";
import { GetAllReportsInspector } from "@pages/api/report/report";

// ─── Component ─────────────────────────────────────────────────────────────
const AnnualInspectorComplaintsSummaryComponents = () => {
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [claimantOptions, setClaimantOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(""); // สำหรับแสดงช่วงวันที่
  const [searchFilters, setSearchFilters] = useState({
    receiveDateFrom: "",
    receiveDateTo: "",
  });
  const router = useRouter();

  // Helper: แปลงข้อมูล API ให้ตรงกับโครงสร้าง TableListCollapsReport
  const transformApiData = (apiItems = []) => {
    const groupByInspector = {};
    apiItems.forEach(item => {
      const inspectorId = item.signature_authority_user_id;
      if (!groupByInspector[inspectorId]) {
        groupByInspector[inspectorId] = {
          id: inspectorId,
          claimantName: `${item.signature_authority_user_name}`,
          departmentsData: [],
        };
      }
      groupByInspector[inspectorId].departmentsData.push({
        department: item.outside_department_name || "ไม่ระบุหน่วยงาน",
        totalDept: item.total_sent,
        inProgressCnt: item.total_in_progress,
        closedCnt: item.total_closed,
        receiveDate: "-", // API ไม่มีวันที่ต่อแถว
      });
    });
    return Object.values(groupByInspector);
  };

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    fetchData({});
  }, []);

  // ฟังก์ชันโหลดข้อมูล
  const fetchData = async (filters = {}) => {
    setLoading(true);
    try {
      // เลือกปีจาก receiveDateFrom ถ้ามี หากไม่มีใช้ปีปัจจุบัน
      let year = "2025";
      if (filters.receiveDateFrom) {
        year = new Date(filters.receiveDateFrom).getFullYear().toString();
      }

      // Call API
      const res = await GetAllReportsInspector(year, "", "", "");
      const apiItems = res?.res_data?.items || [];
      const transformed = transformApiData(apiItems);
      setFilteredComplaints(transformed);

      // สร้าง options สำหรับ select รายชื่อผู้ตรวจ
      setClaimantOptions(
        [...new Map(apiItems.map(i => [
          i.signature_authority_user_id,
          { value: i.signature_authority_user_id, label: i.signature_authority_user_name }
        ])).values()]
      );
    } catch (e) {
      setFilteredComplaints([]);
      setClaimantOptions([]);
    }
    setLoading(false);
  };

  // Helper: แปลงวันที่เป็นรูปแบบไทย (พ.ศ.)
  const formatDateThai = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${(d.getFullYear() + 543)}`;
  };

  // handle การค้นหา
  const handleSearch = async (filters) => {
    setSearchFilters(filters);
    // update dateRange label
    let range = "";
    if (filters.receiveDateFrom && filters.receiveDateTo) {
      range = `ตั้งแต่วันที่ ${formatDateThai(filters.receiveDateFrom)} ถึงวันที่ ${formatDateThai(filters.receiveDateTo)}`;
    } else if (filters.receiveDateFrom) {
      range = `ตั้งแต่วันที่ ${formatDateThai(filters.receiveDateFrom)}`;
    } else if (filters.receiveDateTo) {
      range = `ถึงวันที่ ${formatDateThai(filters.receiveDateTo)}`;
    }
    setDateRange(range);

    // ค้นหาใหม่ (filter API)
    // ถ้าต้องกรอง inspector_id, department_id, status สามารถ map filter ได้ที่นี่
    await fetchData(filters);
  };

  // Set default dateRange ถ้าไม่มี filter
  useEffect(() => {
    if (!searchFilters.receiveDateFrom && !searchFilters.receiveDateTo) {
      // setDateRange("ประจำปีงบประมาณ พ.ศ.2568");
    }
  }, [searchFilters]);

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
        dateRange={dateRange}
        onSearch={handleSearch}
        loading={loading}
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