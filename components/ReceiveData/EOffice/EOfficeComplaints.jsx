/**
 * EOfficeComplaints — รายการร้องทุกข์จากเว็บไซต์ Mof_EOffice
 *
 * ทำงานเหมือน Opm1111.jsx แต่ดึงข้อมูลจาก eofficer REST API (JSON) แทน SOAP
 * ข้อมูลจะมาจากฟังก์ชันใน @pages/api/eoffice/eoffice.js
 */
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListEOffice from "@services/TableListEOffice/TableListEOffice";
import { showLoading, closeAlert, alertError } from "@utils/Alerts";
import {
  GetEOfficeComplaints,
} from "@pages/api/eoffice/eoffice";

// ตัวเลือกสถานะสำหรับ filter
const statusTypeOptions = [
  { value: "A", label: "ทั้งหมด" },
  { value: "I", label: "รับเรื่องใหม่" },
  { value: "P", label: "กำลังดำเนินการ" },
  { value: "C", label: "ยุติเรื่อง" },
];

const EOfficeComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [statusType, setStatusType] = useState("I"); // default: แสดงแค่งานใหม่
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // ── โหลดข้อมูลรายการร้องทุกข์จาก EOffice API ──
  const fetchComplaints = useCallback(async (status = "I") => {
    try {
      showLoading("กำลังโหลดข้อมูลจาก EOffice...");

      // TODO: เรียก API จริง — ฟังก์ชันนี้จะไปเรียก GetEOfficeComplaints
      // เมื่อ eofficer API พร้อม ข้อมูลจะมาแปะตรงนี้เลย
      const data = await GetEOfficeComplaints({ take: 10000, status });

      // แปลงข้อมูลจาก JSON response ของ eofficer ให้ตรงกับ column ของ table
      const mapped = (data || []).map((item) => ({
        case_id: item.case_id,
        case_code: item.case_id,
        complainant_name: item.complainant_name,
        subject: item.subject,
        type_name: item.type_name,
        status: item.status,
        status_name: item.status_name,
        status_color: item.status_color || "#9e9e9e",
        channel_name: item.channel_name,
        date_received: item.date_received,
        date_updated: item.date_updated,
        priority: item.priority,
      }));

      setComplaints(mapped);
      closeAlert();
      setIsDataLoaded(true);
      setIsRefreshing(false);
    } catch (error) {
      console.error("Error fetching EOffice complaints:", error);
      closeAlert();
      alertError(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถโหลดข้อมูลจาก EOffice ได้ กรุณาลองใหม่อีกครั้ง"
      );
      setIsDataLoaded(true);
      setIsRefreshing(false);
    }
  }, []);

  // ── เรียกครั้งแรก ──
  useEffect(() => {
    fetchComplaints(statusType);
  }, []);

  // ── เมื่อเปลี่ยนสถานะ filter ──
  useEffect(() => {
    if (isDataLoaded) {
      fetchComplaints(statusType);
    }
  }, [statusType]);

  // ── Refresh ด้วยมือ ──
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchComplaints(statusType);
  };

  // ── คลิกแถว → ไปหน้า detail ──
  const handleRowClick = (item) => {
    router.push(`/admin/edit/eoffice/${item.case_id}`);
  };

  // ── ไปหน้าส่งผลพิจารณา ──
  const handleSendClick = () => {
    router.push("/admin/edit/eoffice/send");
  };

  return (
    <div>
      <BreadcrumbsService
        items={[
          { label: "จัดการข้อมูลในระบบ", url: "/admin/dashboard" },
          { label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ Mof_EOffice" },
        ]}
      />

      <TableListEOffice
        data={complaints}
        title="รายการร้องทุกข์จาก Mof_EOffice"
        onRowClick={handleRowClick}
        onRefresh={handleRefresh}
        onSendClick={handleSendClick}
        isRefreshing={isRefreshing}
        isEmpty={!isDataLoaded || complaints.length === 0}
        noDataMessage={!isDataLoaded ? "กำลังโหลดข้อมูล..." : "ไม่มีข้อมูลร้องทุกข์จาก EOffice"}
      />
    </div>
  );
};

export default EOfficeComplaints;
