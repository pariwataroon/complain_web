import React, { useState, useMemo, useEffect, useCallback } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
import TableListStaffNoti from "@services/TableListStaffNoti/TableListStaffNoti";
import dayjs from "dayjs";
import { getStaffNotifications } from "@pages/api/reports/staffNotification";

const StaffNotificationComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapApiData = (apiData) => {
    return apiData.items.map((item) => ({
      id: item.id,
      claimantName: item.claimant_name || "-",
      issue: item.issue || "-",
      responsibleOfficer: item.responsible_officer || "-",
      receiptNumber: item.complaint_number || "-",
      officerReceiveDate: item.officer_receive_date || "-",
      officerReceiveDateISO: item.officer_receive_date_iso || null,
      issueType: item.issue_type || "-",
      countTimes: item.count_times || 0,
      status: item.status || null,
      confirmAssignedStatus: item.confirm_assigned_status,
      timeStatus: item.time_status || null,
      daysRemaining: item.days_remaining ?? null,
      timeLimitDays: item.time_limit_days ?? null,
      timeLimitLabel: item.time_limit_label || null,
    }));
  };

  const TERMINAL_STATUSES = new Set(["completed", "reviewed", "cancelled"]);

  const processResponse = (response) => {
    const responseData = response.data || response;
    const apiData = responseData.res_data || responseData.data || responseData;
    if (!apiData || !apiData.items) {
      setError("ข้อมูลจาก API ไม่ถูกต้อง");
      return false;
    }
    const mappedData = mapApiData(apiData);
    const activeData = mappedData.filter((item) => !TERMINAL_STATUSES.has(item.status));
    setAllComplaints(activeData);
    setFilteredComplaints(activeData);
    return true;
  };

  // Fetch data from API
  useEffect(() => {
    const fetchStaffNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getStaffNotifications({ limit: 1000 });
        processResponse(response);
      } catch (err) {
        setError(err.response?.data?.detail || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    fetchStaffNotifications();
  }, []);

  // คำนวณ statistics จาก allComplaints แบบ real-time
  const statistics = useMemo(() => {
    const stats = { total: 0, confirmed: 0, pending: 0, rejected: 0, overdue: 0, warning: 0, normal: 0 };
    allComplaints.forEach((item) => {
      stats.total += 1;
      if (item.confirmAssignedStatus === true) stats.confirmed += 1;
      else if (item.confirmAssignedStatus === false) stats.rejected += 1;
      else stats.pending += 1;
      if (item.timeStatus === "overdue") stats.overdue += 1;
      else if (item.timeStatus === "warning") stats.warning += 1;
      else if (item.timeStatus === "normal") stats.normal += 1;
    });
    return stats;
  }, [allComplaints]);

  const handleStatFilter = useCallback((activeKeys) => {
    if (activeKeys.length === 0) {
      setFilteredComplaints(allComplaints);
      return;
    }
    const filtered = allComplaints.filter((item) => {
      return activeKeys.some((key) => {
        switch (key) {
          case "confirmed": return item.confirmAssignedStatus === true;
          case "pending": return item.confirmAssignedStatus === null || item.confirmAssignedStatus === undefined;
          case "rejected": return item.confirmAssignedStatus === false;
          case "overdue": return item.timeStatus === "overdue";
          case "warning": return item.timeStatus === "warning";
          case "normal": return item.timeStatus === "normal";
          default: return true;
        }
      });
    });
    setFilteredComplaints(filtered);
  }, [allComplaints]);

  // สร้าง options ออกมาก่อน
  const responsibleOfficerOptions = useMemo(() => {
    const unique = [...new Set(allComplaints.map((c) => c.responsibleOfficer))];
    return [...unique.map((v) => ({ value: v, label: v }))];
  }, [allComplaints]);

  const filterFields = useMemo(
    () => [
      {
        name: "responsibleOfficer",
        label: "เจ้าหน้าที่ผู้รับผิดชอบ",
        type: "select",
        options: responsibleOfficerOptions,
      },
      { name: "claimantName", label: "ชื่อ - สกุล (ผู้ร้อง)", type: "text" },
      { name: "receiptNumber", label: "เลข สรร.", type: "text" },
      { name: "issue", label: "ชื่อเรื่อง", type: "text" },
      { name: "startDate", label: "ตั้งแต่วันที่", type: "date" },
      { name: "endDate", label: "ถึงวันที่", type: "date" },
    ],
    [responsibleOfficerOptions]
  );

  const handleSearch = async (filters) => {
    try {
      setLoading(true);
      const params = { limit: 1000 };

      const searchParts = [];
      if (filters.claimantName) searchParts.push(filters.claimantName.trim());
      if (filters.receiptNumber) searchParts.push(filters.receiptNumber.trim());
      if (filters.issue) searchParts.push(filters.issue.trim());
      if (searchParts.length > 0) {
        params.search = searchParts.join(" ");
      }

      if (filters.startDate) {
        params.date_from = dayjs(filters.startDate).format("YYYY-MM-DD");
      }
      if (filters.endDate) {
        params.date_to = dayjs(filters.endDate).format("YYYY-MM-DD");
      }

      if (filters.responsibleOfficer) {
        params.search = [params.search, filters.responsibleOfficer].filter(Boolean).join(" ");
      }

      const response = await getStaffNotifications(params);
      processResponse(response);
    } catch (err) {
      setError(err.response?.data?.detail || "เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setLoading(false);
    }
  };

  if (loading && allComplaints.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
        <p>เกิดข้อผิดพลาด: {error}</p>
        <button onClick={() => window.location.reload()}>โหลดใหม่</button>
      </div>
    );
  }

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
          { label: "รายงานการแจ้งเตือนเจ้าหน้าที่" },
        ]}
      />

      <TableListStaffNoti
        data={filteredComplaints}
        title="รายงานการแจ้งเตือนเจ้าหน้าที่"
        onSearch={handleSearch}
        filterFields={filterFields}
        loading={loading}
        statistics={statistics}
        onStatFilter={handleStatFilter}
      />
    </>
  );
};

export default StaffNotificationComponents;
