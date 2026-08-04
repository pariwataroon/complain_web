import React, { useState, useEffect, useRef } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListFollowing from "@services/TableListFollowing/TableListFollowing";
import { GetMyRelatedComplaints, GetDepartments } from "@pages/api/complaint/complaint";

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

/** แปลงวันที่ ISO → ภาษาไทย */
const formatDate = (iso) => {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "-";
  }
};

const StackedLineChartComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Master data หน่วยงาน: Map<id, name>
  const deptMapRef = useRef(new Map());

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);

    try {
      // โหลด master data หน่วยงานพร้อมกัน
      const [res, depRes] = await Promise.all([
        GetMyRelatedComplaints({ skip: 0, limit: 10000 }),
        GetDepartments().catch(() => null),
      ]);

      // สร้าง Map department_id → name
      const depList = depRes?.res_data ?? [];
      depList.forEach((d) => {
        if (d.id && d.name) deptMapRef.current.set(String(d.id), d.name);
      });

      const items = res?.res_data?.items ?? [];

      const actualStatuses = [...new Set(
        items.map((it) => it?.complaint?.status_label).filter(Boolean)
      )];
      const generatedStatusOptions = actualStatuses.map((s) => ({ value: s, label: s }));

      const transformedData = items.map((it, idx) => {
        const c = it?.complaint ?? {};

        const complainantName = c.complainant_name || "-";

        // หน่วยงาน — ใช้ department_id หาชื่อจาก master data
        const deptId = c.department?.id || c.department_id;
        const deptName = (deptId && deptMapRef.current.get(String(deptId))) || "-";

        return {
          id: c.id ?? `temp_${idx + 1}`,
          claimantName: complainantName,
          agency: deptName,
          ssoNo: c.complaint_number ?? "-",
          issue: c.subject || "-",
          issueType: c.complaint_type || "-",
          receiveDate: formatDate(c.created_at),
          status: c.status_label || c.status || "-",
          rawData: it,
        };
      });

      setAllComplaints(transformedData);
      setFilteredComplaints(transformedData);
      setStatusOptions(generatedStatusOptions);
    } catch (err) {
      setError(err.message || "ไม่สามารถดึงข้อมูลได้");
      setAllComplaints([]);
      setFilteredComplaints([]);
      setStatusOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSearch = ({ claimantName, agency, ssoNo, status }) => {
    const result = allComplaints.filter((item) => {
      if (claimantName && claimantName.trim() !== "") {
        const searchTerm = claimantName.toLowerCase().trim();
        if (!item.claimantName?.toLowerCase().includes(searchTerm)) return false;
      }
      if (agency && agency.trim() !== "") {
        const searchTerm = agency.toLowerCase().trim();
        if (!item.agency?.toLowerCase().includes(searchTerm)) return false;
      }
      if (ssoNo && ssoNo.trim() !== "") {
        const searchTerm = ssoNo.toLowerCase().trim();
        if (!item.ssoNo?.toLowerCase().includes(searchTerm)) return false;
      }
      if (status && status !== "") {
        if (item.status !== status) return false;
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
            onClick={fetchComplaints}
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
