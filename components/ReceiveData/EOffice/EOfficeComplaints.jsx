/**
 * EOfficeComplaints — รับเรื่องราวร้องทุกข์จากระบบสารบรรณอิเล็กทรอนิกส์
 *
 * Server-side pagination: ดึงทีละ 50 รายการ, กดหน้าถัดไปค่อยดึงเพิ่ม
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

// ── Map EOffice item → table row ──
const mapItem = (item) => ({
  case_id: item.id,
  case_code: item.content_no || `${item.content_year}/${item.id}` || `${item.id}`,
  book_no: item.book_no || item.content_no || "-",
  book_date: item.book_date || "-",
  complainant_name: item.owner_name || item.from_org || "-",
  subject: item.subject || item.title || item.content_title || item.description || "-",
  type_name: item.folder_id === 271 ? "หนังสือเข้า" : item.folder_id === 272 ? "หนังสือออก" : "-",
  status: item.finish_flag === 1 ? "C" : "P",
  status_name: item.finish_flag === 1 ? "เสร็จสิ้น" : "อยู่ระหว่างดำเนินการ",
  status_color: item.finish_flag === 1 ? "#4caf50" : "#ff9800",
  date_received: item.content_date || item.book_date || item.created_date || "-",
  date_updated: item.updated_date || "-",
  channel_name: "รับเรื่องราวร้องทุกข์จากระบบสารบรรณอิเล็กทรอนิกส์",
  priority: item.priority === 1 ? "ปกติ" : item.priority === 4 ? "ด่วน" : "ปกติ",
});

const BATCH_SIZE = 50;

const EOfficeComplaints = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [statusType, setStatusType] = useState("P");
  const router = useRouter();
  const fetchingRef = useRef(false);

  // ── Client-side filter ตาม status ──
  const complaints = useMemo(() => {
    if (statusType === "A") return allComplaints;
    return allComplaints.filter((item) => item.status === statusType);
  }, [allComplaints, statusType]);

  // ── Fetch ชุดแรก ──
  const fetchComplaints = useCallback(async () => {
    try {
      showLoading("กำลังเชื่อมต่อ EOffice...");
      await loginEOffice();
      const token = Cookies.get("eoffice_token");
      if (!token) throw new Error("Login ล้มเหลว — ไม่ได้ token");

      const response = await GetEOfficeComplaints({
        take: BATCH_SIZE,
        skip: 0,
        folder_id: 271,
        year: 0,
      });

      console.log("[EOffice] 🔍 API response keys:", Object.keys(response || {}));
      console.log("[EOffice] 🔍 totalSize:", response?.totalSize, "total:", response?.total, "count:", response?.count, "totalItems:", response?.totalItems);

      const items = response?.data || [];
      setAllComplaints(items.map(mapItem));
      // รองรับหลาย field name สำหรับ total count
      const total = response?.totalSize || response?.total || response?.count || response?.totalItems || items.length;
      setTotalCount(total);
      closeAlert();
      setIsDataLoaded(true);
      setIsRefreshing(false);
    } catch (error) {
      console.error("Error fetching EOffice complaints:", error);
      closeAlert();
      alertError("เกิดข้อผิดพลาด", `ไม่สามารถเชื่อมต่อ EOffice ได้: ${error.message || "Unknown error"}`);
      setIsDataLoaded(true);
      setIsRefreshing(false);
    }
  }, []);

  // ── Fetch หน้าถัดไป (เรียกจาก TableListEOffice เมื่อกด page) ──
  const fetchMore = useCallback(async () => {
    if (fetchingRef.current || allComplaints.length >= totalCount) return;
    try {
      fetchingRef.current = true;
      setIsFetchingMore(true);

      const token = Cookies.get("eoffice_token");
      if (!token) throw new Error("No token");

      const response = await GetEOfficeComplaints({
        take: BATCH_SIZE,
        skip: allComplaints.length,
        folder_id: 271,
        year: 0,
      });

      const items = response?.data || [];
      setAllComplaints((prev) => [...prev, ...items.map(mapItem)]);
      const total = response?.totalSize || response?.total || response?.count || response?.totalItems || totalCount;
      setTotalCount(total);
      setIsFetchingMore(false);
    } catch (error) {
      console.error("Error fetching more:", error);
      setIsFetchingMore(false);
    } finally {
      fetchingRef.current = false;
    }
  }, [allComplaints.length, totalCount]);

  useEffect(() => { fetchComplaints(); }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Cookies.remove("eoffice_token");
    fetchComplaints();
  };

  const handleRowClick = (item) => {
    router.push(`/admin/edit/eoffice/${item.case_id}/`);
  };

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
        totalCount={totalCount}
        loadedCount={allComplaints.length}
        isLoadingMore={isFetchingMore}
        onFetchMore={fetchMore}
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
