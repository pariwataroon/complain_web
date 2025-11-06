import React, { useState, useMemo, useEffect } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs.jsx";
import TableListStaffNoti from "@services/TableListStaffNoti/TableListStaffNoti";
import dayjs from "dayjs";
import { getStaffNotifications } from "@pages/api/reports/staffNotification";

const StaffNotificationComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    rejected: 0,
  });

  // Fetch data from API
  useEffect(() => {
    const fetchStaffNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getStaffNotifications();

        // Debug: log response structure
        console.log("Raw response:", response);

        // Map API response to frontend format
        // format_response wraps data in { res_code, res_message, res_data }
        const responseData = response.data || response;
        console.log("Response data:", responseData);

        const apiData = responseData.res_data || responseData.data || responseData;
        console.log("API data:", apiData);

        // Safety check
        if (!apiData || !apiData.items) {
          console.error("Invalid response structure:", apiData);
          setError("ข้อมูลจาก API ไม่ถูกต้อง");
          return;
        }

        const mappedData = apiData.items.map((item) => ({
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
        }));

        setAllComplaints(mappedData);
        setFilteredComplaints(mappedData);
        setStatistics({
          total: apiData.total || 0,
          confirmed: apiData.total_confirmed || 0,
          pending: apiData.total_pending || 0,
          rejected: apiData.total_rejected || 0,
        });
      } catch (err) {
        console.error("Error fetching staff notifications:", err);
        setError(err.response?.data?.detail || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffNotifications();
  }, []);

  // สร้าง options ออกมาก่อน
  const responsibleOfficerOptions = useMemo(() => {
    const unique = [...new Set(allComplaints.map((c) => c.responsibleOfficer))];
    return [...unique.map((v) => ({ value: v, label: v }))];
  }, [allComplaints]);

  // กำหนดตัวเลือกหัวข้อตามลำดับที่ต้องการ
  const issueTypeOptions = useMemo(() => {
    return [
      { value: "เรื่องร้องเรียนใหม่/ร้องเรียนเพิ่มเติม", label: "เรื่องร้องเรียนใหม่/ร้องเรียนเพิ่มเติม" },
      { value: "หน่วยงานรายงานผลการพิจารณา", label: "หน่วยงานรายงานผลการพิจารณา" },
      { value: "ขอให้ผู้ร้องส่งเอกสารเพิ่มเติม", label: "ขอให้ผู้ร้องส่งเอกสารเพิ่มเติม" },
    ];
  }, []);

  // คอนฟิกฟิลด์เดียว ใช้ทั้ง render และ search
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
      {
        name: "issueType",
        label: "หัวข้อ",
        type: "select",
        options: issueTypeOptions,
      },
      { name: "startDate", label: "ตั้งแต่วันที่", type: "date" },
      { name: "endDate", label: "ถึงวันที่", type: "date" },
    ],
    [responsibleOfficerOptions, issueTypeOptions]
  );

  const handleSearch = async (filters) => {
    console.log("🔍 handleSearch called with filters:", filters);

    try {
      setLoading(true);

      // Build query parameters
      const params = {};

      // Text filters
      if (filters.claimantName) {
        params.search = filters.claimantName.trim();
      }
      if (filters.issue) {
        params.issue_search = filters.issue.trim();
      }
      if (filters.receiptNumber) {
        params.complaint_number = filters.receiptNumber.trim();
      }

      // Select filters
      if (filters.responsibleOfficer) {
        const officer = typeof filters.responsibleOfficer === "object"
          ? filters.responsibleOfficer.value
          : filters.responsibleOfficer;
        params.officer_name = officer;
      }

      if (filters.issueType) {
        const issueType = typeof filters.issueType === "object"
          ? filters.issueType.value
          : filters.issueType;
        params.status = issueType;
      }

      // Date range filters
      if (filters.startDate) {
        params.start_date = dayjs(filters.startDate).format("YYYY-MM-DD");
      }
      if (filters.endDate) {
        params.end_date = dayjs(filters.endDate).format("YYYY-MM-DD");
      }

      const response = await getStaffNotifications(params);

      // Map API response to frontend format
      const responseData = response.data || response;
      const apiData = responseData.res_data || responseData.data || responseData;

      // Safety check
      if (!apiData || !apiData.items) {
        console.error("Invalid response structure:", apiData);
        setError("ข้อมูลจาก API ไม่ถูกต้อง");
        return;
      }

      const mappedData = apiData.items.map((item) => ({
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
      }));

      setFilteredComplaints(mappedData);
      setStatistics({
        total: apiData.total || 0,
        confirmed: apiData.total_confirmed || 0,
        pending: apiData.total_pending || 0,
        rejected: apiData.total_rejected || 0,
      });

      console.log(`✅ Found ${mappedData.length} matching items`);
    } catch (err) {
      console.error("Error searching staff notifications:", err);
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
      />
    </>
  );
};

export default StaffNotificationComponents;
