import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListFollowing from "@services/TableListFollowing/TableListFollowing";
import { GetComplaintsbyPageTypeAssignmentForm } from "@pages/api/stackedLineChart/stackedLineChart";
import {
  formatThaiShortDate,
  formatThaiDateTime,
  formatThaiOfficialDate
} from "@utils/Formats";

const breadcrumbItems = [
  {
    label: "ติดตามผลการดำเนินการ",
    icon: (
      <img
        src="/icons/Cube.png"
        alt="cube"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
];

const statusOptions = [
  { value: "", label: "ทั้งหมด" },
  { value: "sent_to_agency", label: "ส่งให้หน่วยงาน" },
  { value: "confirmed", label: "ยืนยันรับงานแล้ว" },
  { value: "rejected", label: "ปฏิเสธรับงาน" },
  { value: "pending", label: "รอการยืนยัน" },
  { value: "not_assigned", label: "ยังไม่ได้มอบหมาย" },
];

const StackedLineChartComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const transformComplaintData = (apiData) => {
    if (!apiData?.items) return [];

    return apiData.items.map((item, index) => {
      const complaint = item.complaint;

      return {
        id: complaint.id,
        claimantName: getClaimantNameDisplay(complaint),
        agency: complaint.assigned_to || "-",
        ssoNo: complaint.complaint_number || "-",
        issue: complaint.subject || "-",
        issueType: complaint.complaint_type || "-",
        receiveDate: formatReceiveDate(complaint.received_date_display || complaint.assigned_date),
        status: getStatusText(complaint.confirmation_status || complaint.status),
        rawData: complaint
      };
    });
  };

  const getClaimantNameDisplay = (complaint) => {
    if (complaint.complainant) {
      const { first_name, last_name, title } = complaint.complainant;
      return `${title || ""} ${first_name || ""} ${last_name || ""}`.trim() || "ไม่ระบุชื่อ";
    }

    return complaint.claimant_name || "ไม่ระบุชื่อ";
  };

  const formatReceiveDate = (dateString) => {
    if (!dateString) return "-";

    try {
      if (dateString.includes("(") && dateString.includes(")")) {
        const statusPart = dateString.split("(")[0].trim();
        const datePart = dateString.match(/\((.*?)\)/)?.[1];

        if (datePart) {
          const thaiDate = formatThaiOfficialDate(new Date(datePart));
          return `${statusPart} (${thaiDate})`;
        }
        return dateString;
      }

      // กรณีวันที่ปกติ
      return formatThaiShortDate(dateString) || formatThaiDateTime(dateString) || dateString;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // ฟังก์ชันแปลงสถานะเป็นภาษาไทย
  const getStatusText = (status) => {
    const statusMap = {
      "confirmed": "ยืนยันรับงานแล้ว",
      "rejected": "ปฏิเสธรับงาน",
      "pending": "รอการยืนยัน",
      "not_assigned": "ยังไม่ได้มอบหมาย",
      "sent_to_agency": "ส่งให้หน่วยงาน"
    };

    return statusMap[status] || status || "-";
  };

  // ดึงข้อมูลจาก API
  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await GetComplaintsbyPageTypeAssignmentForm({
          page: 1,
          page_size: 100,
          page_type: "website",
        });

        console.log("API Response:", response);

        if (response?.res_code === "0000") {
          const transformedData = transformComplaintData(response.res_data);
          console.log("Transformed Data:", transformedData);

          setAllComplaints(transformedData);
          setFilteredComplaints(transformedData);
        } else {
          throw new Error(response?.res_message || "ไม่สามารถดึงข้อมูลได้");
        }
      } catch (error) {
        console.error("Error fetching complaints:", error);
        setError(error.message);
        setAllComplaints([]);
        setFilteredComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  // ฟังก์ชันค้นหาที่ปรับปรุงแล้ว
  const handleSearch = ({ claimantName, agency, ssoNo, status }) => {
    console.log("=== 🔍 SEARCH FILTERS ===");
    console.log({ claimantName, agency, ssoNo, status });

    const result = allComplaints.filter((item) => {
      // ค้นหาชื่อผู้ร้อง (case-insensitive)
      if (claimantName && !item.claimantName.toLowerCase().includes(claimantName.toLowerCase())) {
        return false;
      }

      // ค้นหาหน่วยงาน
      if (agency && !item.agency.toLowerCase().includes(agency.toLowerCase())) {
        return false;
      }

      // ค้นหาเลข สรร.
      if (ssoNo && !item.ssoNo.toLowerCase().includes(ssoNo.toLowerCase())) {
        return false;
      }

      // ค้นหาสถานะ (ตรวจสอบทั้งใน confirmation_status และ status)
      if (status) {
        const itemConfirmStatus = item.rawData?.confirmation_status;
        const itemGeneralStatus = item.rawData?.status;
        if (itemConfirmStatus !== status && itemGeneralStatus !== status) {
          return false;
        }
      }

      return true;
    });

    console.log(`Search Results: ${result.length} items found`);
    setFilteredComplaints(result);
  };

  // กรณีกำลังโหลด
  if (loading) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div className="spinner" style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1120A3',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 2s linear infinite'
          }}></div>
          <div style={{ fontSize: '16px', color: '#666' }}>กำลังโหลดข้อมูล...</div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  // กรณีเกิดข้อผิดพลาด
  if (error) {
    return (
      <>
        <BreadcrumbsService items={breadcrumbItems} />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          color: '#d32f2f',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            เกิดข้อผิดพลาด
          </div>
          <div style={{ fontSize: '14px', marginBottom: '20px', maxWidth: '400px' }}>
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1120A3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ลองใหม่
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <BreadcrumbsService items={breadcrumbItems} />

      <TableListFollowing
        data={filteredComplaints}
        title="ติดตามผลการดำเนินการ"
        navigateTo="/admin/StackedLineChart"
        statusOptions={statusOptions}
        onSearch={handleSearch}
        emptyMessage={
          allComplaints.length === 0
            ? "ไม่มีข้อมูลเรื่องร้องเรียน"
            : "ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา"
        }
      />
    </>
  );
};

export default StackedLineChartComponents;