import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import DetailOPM from "@services/DetailOPM/DetailOPM";
import { GetCase, GetOperatings, GetAttachment } from "@pages/api/opm/opm";

const SearchComplaints = () => {
  const router = useRouter();
  const queryParams = router.query;
  
  const [operatingsDetails, setOperatingsDetails] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOperatings, setLoadingOperatings] = useState(true);
  const [attachmentsDetails, setAttachmentsDetails] = useState([]);
  
  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        if (queryParams.id) {
          const caseResponse = await GetCase(queryParams.id);
          setCaseDetails(caseResponse);
        }
      } catch (error) {
        console.error("Error fetching case details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [queryParams.id]);

  useEffect(() => {
    const fetchOperatingDetails = async () => {
      try {
        if (queryParams.id) {
          const operatingsResponse = await GetOperatings(queryParams.id);
          setOperatingsDetails(operatingsResponse);
        }
      } catch (error) {
        console.error("Error fetching operatings details:", error);
      } finally {
        setLoadingOperatings(false);
      }
    };

    fetchOperatingDetails();
  }, [queryParams.id]);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!operatingsDetails) return;
      const attachmentIds = [];
      operatingsDetails.forEach(op => {
        if (Array.isArray(op.attachments)) {
          op.attachments.forEach(att => {
            if (att.attachment_id) {
              attachmentIds.push(att.attachment_id);
            }
          });
        }
      });

      try {
        const attachmentsData = await Promise.all(
          attachmentIds.map(id => GetAttachment(id))
        );
        setAttachmentsDetails(attachmentsData);
      } catch (error) {
        console.error("Error fetching attachment details:", error);
        setAttachmentsDetails([]);
      }
    };

    fetchAttachments();
  }, [operatingsDetails]);

  const formatDate = (dateString, fallback) => {
    if (!dateString || dateString === "-") {
      // ถ้ามี fallback ให้ใช้ fallback แทน
      if (fallback) return formatDate(fallback);
      return "ไม่ระบุ";
    }
    try {
      let dateObj;

      // .NET date format: "/Date(1234567890000)/" or "/Date(-62135596800000)/"
      if (typeof dateString === 'string' && dateString.includes('/Date(')) {
        const match = dateString.match(/-?\d+/);
        if (!match) return "ไม่ระบุ";
        const timestamp = parseInt(match[0], 10);
        // .NET DateTime.MinValue (-62135596800000) = วันที่ว่าง
        if (timestamp <= 0) {
          if (fallback) return formatDate(fallback);
          return "ไม่ระบุ";
        }
        dateObj = new Date(timestamp);
      }
      // ISO format with T: "2025-01-03T00:00:00"
      else if (typeof dateString === 'string' && dateString.includes('T')) {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        let hour = 0, minute = 0;
        if (timePart) {
          [hour, minute] = timePart.split(':').map(Number);
        }
        dateObj = new Date(year, month - 1, day, hour, minute, 0);
      }
      // Plain string: "2025-01-03" or "2025-01-03 00:00:00"
      else if (typeof dateString === 'string') {
        dateObj = new Date(dateString.replace(' ', 'T'));
      }
      // Number (timestamp)
      else if (typeof dateString === 'number') {
        dateObj = new Date(dateString);
      }
      else {
        return "ไม่ระบุ";
      }

      if (isNaN(dateObj.getTime())) return "ไม่ระบุ";
      const buddhistYear = dateObj.getFullYear() + 543;
      const day = dateObj.getDate();
      const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
        "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
        "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
      ];
      const month = monthNames[dateObj.getMonth()];
      return `${day} ${month} ${buddhistYear}`;
    } catch (e) {
      return "ไม่ระบุ";
    }
  };

  const getCaseCode = () => {
    if (!caseDetails || !Array.isArray(caseDetails)) return "กำลังโหลด...";

    const caseCodeItem = caseDetails.find(item => item.field === "case_code");
    return caseCodeItem?.value || queryParams.id || "ไม่พบรหัสเรื่อง";
  };

  return (
    <>
      <BreadcrumbsService
        items={[
          {
            label: "จัดการข้อมูลในระบบ",
            icon: (
              <img
                src="/icons/Pencil.png"
                alt="pencil"
                style={{ width: 24, height: 24, marginBottom: -8 }}
              />
            ),
          },
          {
            label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ OPM1111",
            url: "/admin/edit/opm1111",
          },
          {
            label: getCaseCode(),
          },
        ]}
      />

      <DetailOPM
        params={queryParams.id}
        caseDetails={caseDetails}
        operatingsDetails={operatingsDetails}
        loading={loading}
        formatDate={formatDate}
        attachmentsDetails={attachmentsDetails}
      />
    </>
  );
};

export default SearchComplaints;