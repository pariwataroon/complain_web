import React, { useState, useEffect } from "react";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListFollowing from "@services/TableListFollowing/TableListFollowing";
import { GetMyRelatedComplaints } from "@pages/api/complaint/complaint";
import { formatComplainantName } from "@utils/Formats";

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

const STATUS_LABELS = [
  "รับเรื่อง",
  "ส่งหน่วยงานที่เกี่ยวข้อง",
  "กำลังดำเนินการ",
  "ติดตามผล",
  "มอบหมายเจ้าหน้าที่",
  "แจ้งผลการพิจารณา",
  "อยู่ระหว่างพิจารณา",
  "ยุติเรื่องแล้ว",
];

const CLOSED_WORDS = ["ยุติเรื่อง", "ยุติเรื่องได้", "ปิดเรื่อง", "ปิดงาน"];

const toThaiLabel = (code = "") => {
  const s = String(code || "").toLowerCase();
  switch (s) {
    case "submitted": return "รับเรื่อง";
    case "sent_to_external":
    case "sent_to_agency":
    case "forwarded": return "ส่งหน่วยงานที่เกี่ยวข้อง";
    case "in_process":
    case "in_progress": return "กำลังดำเนินการ";
    case "tracking": return "ติดตามผล";
    case "assigned": return "มอบหมายเจ้าหน้าที่";
    case "reviewed": return "แจ้งผลการพิจารณา";
    case "in_review": return "อยู่ระหว่างพิจารณา";
    case "completed":
    case "cancelled":
    case "closed":
    case "resolved":
    case "done": return "ยุติเรื่องแล้ว";
    default: return code || "-";
  }
};

const closedByOutgoing = (history = []) =>
  history.some(
    (h) =>
      (h?.type === "outgoing_report" || h?.status === "outgoing_report") &&
      (h?.ext?.is_closed_by_consideration === true ||
        CLOSED_WORDS.includes(String(h?.ext?.consideration_result || "")))
  );

const diffDaysFrom = (startISO) => {
  try { return Math.max(0, Math.ceil((new Date() - new Date(startISO)) / 86400000)); } catch { return 0; }
};

const StackedLineChartComponents = () => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const transformComplaintData = (items) => {
    return items.map((it, idx) => {
      const c = it?.complaint ?? {};
      const latest = it?.latest ?? {};
      const history = Array.isArray(it?.history) ? it.history : [];

      // ชื่อผู้ร้อง — ใช้ complainant object หรือ claimant_name string
      const claimantName = formatComplainantName(c.complainant, c.claimant_name || c.complainant_name);

      // หน่วยงาน
      let deptName = "-";
      if (latest?.sent?.department_name) {
        deptName = latest.sent.department_name;
      } else {
        const sentHistory = history.find(
          (h) => h.type === "status_history" && String(h.status).toLowerCase() === "sent_to_agency"
        );
        if (sentHistory?.department_name) deptName = sentHistory.department_name;
        else {
          const anyDept = history.find((h) => h.department_name);
          if (anyDept) deptName = anyDept.department_name;
        }
      }

      // สถานะ
      const raw = String(c.status || "").toLowerCase();
      const isClosed = closedByOutgoing(history);
      const finalCode = isClosed ? "completed" : raw;
      const statusLabel = toThaiLabel(finalCode);

      return {
        id: c.id ?? `temp_${idx + 1}`,
        claimantName,
        agency: deptName,
        ssoNo: c.complaint_number ?? "-",
        issue: c.subject || "-",
        issueType: c.complaint_type || "-",
        receiveDate: c.created_at
          ? new Date(c.created_at).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          : "-",
        status: statusLabel,
        workingDays: diffDaysFrom(c.created_at),
        rawData: it,
      };
    });
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await GetMyRelatedComplaints({ skip: 0, limit: 10000 });
      const items = res?.res_data?.items ?? [];

      const transformedData = transformComplaintData(items);
      const generatedStatusOptions = STATUS_LABELS.map((l) => ({ value: l, label: l }));

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
