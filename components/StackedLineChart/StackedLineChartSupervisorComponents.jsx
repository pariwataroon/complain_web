import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListFollowing from "@services/TableListFollowing/TableListFollowing";
import { GetComplaintsbyPageTypeAssignmentForm } from "@pages/api/stackedLineChart/stackedLineChart";
import {
  formatComplaintReceiveDate,
  formatComplainantName,
  formatComplaintNumber,
  formatAgencyName,
  formatComplaintType,
  formatComplaintSubject,
  formatConfirmationStatus
} from "@utils/Formats";

const breadcrumbItems = [
  {
    label: "ติดตามผลการพิจารณา",
    icon: (
      <img
        src="/icons/Cube.png"
        alt="cube"
        style={{ width: 24, height: 24, marginBottom: -8 }}
      />
    ),
  },
];

const StackedLineChartSupervisorComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // ฟังก์ชันแปลงข้อมูล API เป็นข้อมูลสำหรับตาราง
  const transformComplaintData = (apiData) => {
    if (!apiData?.items) return [];

    return apiData.items.map((item, index) => {
      const complaint = item.complaint;
      const claimantName = formatComplainantName(
        complaint.complainant,
        complaint.claimant_name
      );

      const agencyName = formatAgencyName(complaint.assigned_to);
      const complaintNumber = formatComplaintNumber(complaint.complaint_number);
      const complaintType = formatComplaintType(complaint.complaint_type);
      const complaintSubject = formatComplaintSubject(complaint.subject, 80);
      const receiveDate = formatComplaintReceiveDate(complaint.received_date_display);
      const status = formatConfirmationStatus(
        complaint.confirmation_status || complaint.status,
        complaint.confirmation_status_text
      );

      const transformedItem = {
        id: complaint.id,
        claimantName,
        agency: agencyName,
        ssoNo: complaintNumber,
        issue: complaintSubject,
        issueType: complaintType,
        receiveDate,
        status,
        originalStatus: complaint.confirmation_status || complaint.status,
        rawData: complaint
      };
      return transformedItem;
    });
  };

  const generateStatusOptions = (apiData) => {
    const legend = apiData?.legend?.confirmation_status;

    if (legend) {
      const options = Object.entries(legend).map(([key, value]) => ({
        value: value,
        label: value
      }));

      const result = [
        ...options
      ];


      return result;
    }

    // fallback: สร้างจากข้อมูลที่มีในตาราง
    const actualStatuses = [...new Set(
      apiData?.items?.map(item =>
        formatConfirmationStatus(
          item.complaint.confirmation_status || item.complaint.status,
          item.complaint.confirmation_status_text
        )
      ).filter(Boolean)
    )];

    const options = actualStatuses.map(status => ({
      value: status,
      label: status
    }));

    return [
      ...options
    ];
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

        if (response?.res_code === "0000") {
          const apiData = response.res_data;
          const transformedData = transformComplaintData(apiData);
          const generatedStatusOptions = generateStatusOptions(apiData);
          setAllComplaints(transformedData);
          setFilteredComplaints(transformedData);
          setStatusOptions(generatedStatusOptions);

        } else {
          throw new Error(response?.res_message || "ไม่สามารถดึงข้อมูลได้");
        }
      } catch (error) {
       
        setError(error.message);
        setAllComplaints([]);
        setFilteredComplaints([]);
        setStatusOptions([{ value: "", label: "— ทุกสถานะ —" }]);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  // ฟังก์ชันค้นหาที่ปรับปรุงแล้ว
  const handleSearch = ({ claimantName, agency, ssoNo, status }) => {
    
    const result = allComplaints.filter((item) => {
      if (claimantName && claimantName.trim() !== "") {
        const searchTerm = claimantName.toLowerCase().trim();
        if (!item.claimantName.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      if (agency && agency.trim() !== "") {
        const searchTerm = agency.toLowerCase().trim();
        if (!item.agency.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      if (ssoNo && ssoNo.trim() !== "") {
        const searchTerm = ssoNo.toLowerCase().trim();
        if (!item.ssoNo.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      if (status && status !== "") {
        if (item.status !== status) {
          return false;
        }
      }

      return true;
    });

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
          <div style={{ fontSize: '14px', marginBottom: '10px', maxWidth: '400px' }}>
            {error}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
            User: vampirebeam | Time: 2025-06-16 14:34:45
          </div>
          <button
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
        title="ติดตามผลการพิจารณา"
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

export default StackedLineChartSupervisorComponents;