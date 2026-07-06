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
  const [hasMore, setHasMore] = useState(true);
  const [statusType, setStatusType] = useState("P");
  const router = useRouter();
  const fetchingRef = useRef(false);

  // ── Client-side filter ตาม status ──
  const complaints = useMemo(() => {
    if (statusType === "A") return allComplaints;
    return allComplaints.filter((item) => item.status === statusType);
  }, [allComplaints, statusType]);

  // ── Fetch ทั้งหมด: แสดง 50 แรกทันที + โหลดเบื้องหลังต่อ ──
  const fetchComplaints = useCallback(async () => {
    try {
      showLoading("กำลังเชื่อมต่อ EOffice...");
      await loginEOffice();
      const token = Cookies.get("eoffice_token");
      if (!token) throw new Error("Login ล้มเหลว — ไม่ได้ token");

      // โหลด 50 แรก → แสดงทันที
      const firstResponse = await GetEOfficeComplaints({
        take: BATCH_SIZE,
        skip: 0,
        folder_id: 271,
        year: 0,
      });

      const firstItems = firstResponse?.data || [];
      setAllComplaints(firstItems.map(mapItem));
      setTotalCount(firstItems.length);
      setHasMore(firstItems.length >= BATCH_SIZE);
      closeAlert();
      setIsDataLoaded(true);
      setIsRefreshing(false);

      // โหลดเบื้องหลังต่อทีละ 50 (ไม่ block UI)
      let allItems = [...firstItems.map(mapItem)];
      let skip = firstItems.length;
      let hasMoreData = firstItems.length >= BATCH_SIZE;

      while (hasMoreData) {
        const response = await GetEOfficeComplaints({
          take: BATCH_SIZE,
          skip,
          folder_id: 271,
          year: 0,
        });

        const items = response?.data || [];
        allItems = [...allItems, ...items.map(mapItem)];
        skip += items.length;

        setAllComplaints([...allItems]);
        setTotalCount(allItems.length);
        setHasMore(items.length >= BATCH_SIZE);

        if (items.length < BATCH_SIZE || items.length === 0) {
          hasMoreData = false;
        }
      }

      setHasMore(false);
      console.log(`[EOffice] ✅ โหลดเบื้องหลังเสร็จ ${allItems.length} รายการ`);
    } catch (error) {
      console.error("Error fetching EOffice complaints:", error);
      closeAlert();
      alertError("เกิดข้อผิดพลาด", `ไม่สามารถเชื่อมต่อ EOffice ได้: ${error.message || "Unknown error"}`);
      setIsDataLoaded(true);
      setIsRefreshing(false);
    }
  }, []);

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
        isLoadingMore={!isDataLoaded || isRefreshing}
        onFetchMore={() => {}}
        hasMore={hasMore}
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
