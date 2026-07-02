/**
 * EOfficeComplaints — รับเรื่องราวร้องทุกข์จากระบบสารบรรณอิเล็กทรอนิกส์
 *
 * ทำงานเหมือน Opm1111.jsx — login แล้ว fetch list จาก eofficer API (JSON)
 * Flow: login → getTimelineHeader → แสดงในตาราง
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListEOffice from "@services/TableListEOffice/TableListEOffice";
import { showLoading, closeAlert, alertError } from "@utils/Alerts";
import Cookies from "js-cookie";
import {
  loginEOffice,
  GetEOfficeComplaints,
} from "@pages/api/eoffice/eoffice";

// ── ตัวเลือกสถานะ filter ──
const statusTypeOptions = [
  { value: "A", label: "ทั้งหมด" },
  { value: "P", label: "กำลังดำเนินการ" },
  { value: "C", label: "ยุติเรื่อง" },
];

const EOfficeComplaints = () => {
  const [allComplaints, setAllComplaints] = useState([]); // ข้อมูลทั้งหมดจาก API
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusType, setStatusType] = useState("P"); // default: กำลังดำเนินการ
  const router = useRouter();

  // ── Client-side filter ตาม status ──
  const complaints = useMemo(() => {
    if (statusType === "A") return allComplaints;
    return allComplaints.filter((item) => item.status === statusType);
  }, [allComplaints, statusType]);

  // ── Login + โหลดรายการจาก EOffice API ──
  const fetchComplaints = useCallback(async () => {
    try {
      showLoading("กำลังเชื่อมต่อ EOffice...");

      // 1) Login เหมือน OPM (Encode)
      await loginEOffice();
      const token = Cookies.get("eoffice_token");

      if (!token) {
        throw new Error("Login ล้มเหลว — ไม่ได้ token");
      }

      // 2) ดึงรายการเอกสารทั้งหมด
      const response = await GetEOfficeComplaints({
        take: 500,
        skip: 0,
        folder_id: 271,
        year: 0,
      });

      // 3) แปลง response → table format
      const items = response?.data || [];
      const mapped = items.map((item) => ({
        case_id: item.id,
        case_code: item.content_no || `${item.content_year}/${item.id}` || `${item.id}`,
        book_no: item.book_no || item.content_no || "-",
        book_date: item.book_date || "-",

        complainant_name: item.owner_name || item.from_org || "-",
        subject: item.subject || item.title || item.content_title || item.description || "-",
        type_name: item.folder_id === 271 ? "หนังสือเข้า" : item.folder_id === 272 ? "หนังสือออก" : "-",

        // status: P=กำลังดำเนินการ, C=เสร็จสิ้น
        status: item.finish_flag === 1 ? "C" : "P",
        status_name: item.finish_flag === 1 ? "เสร็จสิ้น" : "อยู่ระหว่างดำเนินการ",
        status_color: item.finish_flag === 1 ? "#4caf50" : "#ff9800",

        date_received: item.content_date || item.book_date || item.created_date || "-",
        date_updated: item.updated_date || "-",

        channel_name: "รับเรื่องราวร้องทุกข์จากระบบสารบรรณอิเล็กทรอนิกส์",
        priority: item.priority === 1 ? "ปกติ" : item.priority === 4 ? "ด่วน" : "ปกติ",
      }));

      setAllComplaints(mapped);
      closeAlert();
      setIsDataLoaded(true);
      setIsRefreshing(false);
    } catch (error) {
      console.error("Error fetching EOffice complaints:", error);
      closeAlert();
      alertError(
        "เกิดข้อผิดพลาด",
        `ไม่สามารถเชื่อมต่อ EOffice ได้: ${error.message || "Unknown error"}`
      );
      setIsDataLoaded(true);
      setIsRefreshing(false);
    }
  }, []);

  // ── เรียกครั้งแรก ──
  useEffect(() => {
    fetchComplaints();
  }, []);

  // ── Refresh ──
  const handleRefresh = () => {
    setIsRefreshing(true);
    Cookies.remove("eoffice_token");
    fetchComplaints();
  };

  // ── คลิกแถว → ไป detail ──
  const handleRowClick = (item) => {
    router.push(`/admin/edit/eoffice/${item.case_id}/`);
  };

  // ── ไปหน้าส่งผล ──
  const handleSendClick = () => {
    router.push("/admin/edit/eoffice/send");
  };

  return (
    <div>
      <BreadcrumbsService
        items={[
          { label: "จัดการข้อมูลในระบบ", url: "/admin/dashboard" },
          { label: "รับเรื่องราวร้องทุกข์จากระบบสารบรรณอิเล็กทรอนิกส์" },
        ]}
      />

      <TableListEOffice
        data={complaints}
        title="รับเรื่องราวร้องทุกข์จากระบบสารบรรณอิเล็กทรอนิกส์"
        statusType={statusType}
        statusTypeOptions={statusTypeOptions}
        onStatusTypeChange={setStatusType}
        onRowClick={handleRowClick}
        onRefresh={handleRefresh}
        onSendClick={handleSendClick}
        isRefreshing={isRefreshing}
        isEmpty={!isDataLoaded || allComplaints.length === 0}
        noDataMessage={!isDataLoaded ? "กำลังเชื่อมต่อ EOffice..." : "ไม่มีข้อมูลร้องทุกข์จาก EOffice"}
      />
    </div>
  );
};

export default EOfficeComplaints;
