import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListOPM from "@services/TableListOPM/TableListOPM";
import Cookies from "js-cookie";
import { Encode, GetTimelineHeader } from "@pages/api/opm/opm";
import { GetComplaintsSubjectOPM } from "@pages/api/complaint/complaint";
import { showLoading, closeAlert, alertError, alertSuccess } from "@utils/Alerts";

const Opm1111Components = () => {
  const [result, setResult] = useState("");
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [readComplaints, setReadComplaints] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [timelineType, setTimelineType] = useState("I");  // "A" = ทั้งหมด, "I" = งานใหม่, "P" = กำลังดำเนินการ
  const router = useRouter();

  useEffect(() => {
    const initializeData = async () => {
      try {
        showLoading("กำลังรับรองตัวตน...");
        Cookies.remove("opm_token");
        Cookies.remove("org_id");

        const tokenData = await Encode();

        if (tokenData && tokenData.token_id) {
          setResult(tokenData.token_id);

          showLoading("กำลังโหลดข้อมูล...");

          await new Promise(resolve => setTimeout(resolve, 500));
          // เปลี่ยนจาก rowsPerPage เป็นค่าคงที่ที่ใหญ่พอ เช่น 1000
          await fetchTimelineHeader(10000, timelineType);

          closeAlert();
          setIsDataLoaded(true);

        } else {
          throw new Error("Failed to obtain token");
        }
      } catch (error) {
        console.error("Error initializing data:", error);
        closeAlert();

        alertError(
          "เกิดข้อผิดพลาด",
          "ไม่สามารถรับรองตัวตนได้ กรุณาลองใหม่อีกครั้ง"
        );

        setResult("Error occurred while fetching token.");
        setIsDataLoaded(true);
      }
    };

    initializeData();
  }, []);

  const fetchTimelineHeader = async (take, timeline_type = "I") => {
    try {
      const timelineData = await GetTimelineHeader(take, timeline_type);
      console.log('=== timelineData from API ===', timelineData);

      // แปลงเป็น array เสมอ
      let parsedData = [];
      if (Array.isArray(timelineData)) {
        parsedData = timelineData;
      } else if (timelineData && typeof timelineData === 'object') {
        // ถ้าเป็น object เดี่ยว ให้หา array ข้างใน หรือแปลงเป็น array
        if (timelineData.data && Array.isArray(timelineData.data)) {
          parsedData = timelineData.data;
        } else if (timelineData.items && Array.isArray(timelineData.items)) {
          parsedData = timelineData.items;
        } else if (timelineData.result && Array.isArray(timelineData.result)) {
          parsedData = timelineData.result;
        } else {
          parsedData = [timelineData];
        }
      }
      console.log('=== parsedData after convert ===', parsedData);

      const mappedComplaints = parsedData.map((item) => ({
        case_id: item.case_id,
        case_code: item.case_code,
        customer_name: item.customer_name,
        type_text: item.type_text,
        status_text: item.status_text,
        main_status_text: item.main_status_text,
        ShowDateTime: item.date_opened,
        date_operating: item.operating_date,
      }));
      console.log('=== mappedComplaints ===', mappedComplaints);

      setComplaints(mappedComplaints);
      setFilteredComplaints(mappedComplaints);

      const caseCodes = mappedComplaints.map(c => c.case_code);

      if (caseCodes.length > 0) {
        // แบ่ง case codes เป็น batch ละ 50 เพื่อป้องกัน URL ยาวเกิน
        const BATCH_SIZE = 50;
        const readSubjects = new Set();

        for (let i = 0; i < caseCodes.length; i += BATCH_SIZE) {
          const batch = caseCodes.slice(i, i + BATCH_SIZE);
          const subjectStr = batch.join(',');
          try {
            const complaintsSubjectRes = await GetComplaintsSubjectOPM({
              skip: 0,
              limit: 10000,
              subject: subjectStr,
            });

            const batchReadSubjects = (complaintsSubjectRes?.res_data?.items || []).map(item => item.subject);
            batchReadSubjects.forEach(s => readSubjects.add(s));
          } catch (batchError) {
            console.warn(`Failed to check read status for batch starting at ${i}:`, batchError.message);
          }
        }

        const complaintsWithReadStatus = mappedComplaints.map(item => ({
          ...item,
          isRead: readSubjects.has(item.case_code),
        }));

        setComplaints(complaintsWithReadStatus);
        setFilteredComplaints(complaintsWithReadStatus);
        setReadComplaints(Array.from(readSubjects));
      }
    } catch (error) {
      console.error("Error fetching timeline header:", error);
      alertError(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  };

  // แก้ไข useEffect สำหรับ dependency - ลบ rowsPerPage ออก
  useEffect(() => {
    if (isDataLoaded && result && result !== "Error occurred while fetching token.") {
      showLoading("กำลังโหลดข้อมูล...");

      const fetchData = async () => {
        try {
          // ใช้ 1000 แทนที่จะใช้ rowsPerPage เพื่อให้ได้ข้อมูลครบ
          await fetchTimelineHeader(10000, timelineType);
        } finally {
          closeAlert();
        }
      };

      fetchData();
    }
  }, [timelineType, isDataLoaded, result]); // ลบ rowsPerPage ออกจาก dependency

  const handleSearch = (searchQuery) => {
    const filtered = complaints.filter((complaint) =>
      complaint.case_code.includes(searchQuery) || complaint.customer_name.includes(searchQuery)
    );
    setFilteredComplaints(filtered);
  };

  const handleNavigateTo = (path) => {
    router.push(path);
  };

  const handleRefresh = async () => {
    setIsDataLoaded(false);
    showLoading("กำลังรีเฟรชข้อมูลและตรวจสอบสถานะ reopen...");
    try {
      // ใช้ 1000 แทนที่จะใช้ rowsPerPage
      await fetchTimelineHeader(10000, timelineType);
      alertSuccess("รีเฟรชข้อมูลเรียบร้อย", "ข้อมูลได้รับการอัปเดตล่าสุดแล้ว รวมถึงการตรวจสอบสถานะ reopen");
    } catch (error) {
      alertError("เกิดข้อผิดพลาด", "ไม่สามารถรีเฟรชข้อมูลได้");
    } finally {
      closeAlert();
      setIsDataLoaded(true);
    }
  };

  // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลง timeline type
  const handleTimelineTypeChange = (newTimelineType) => {
    setTimelineType(newTimelineType);
  };

  // แก้ไข onRowsPerPageChange - ไม่ต้องเรียก API ใหม่
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    // ไม่ต้องเรียก fetchTimelineHeader ใหม่ เพราะ pagination จะจัดการเองใน TableListOPM
  };

  if (!isDataLoaded) {
    return null;
  }

  if (result === "Error occurred while fetching token.") {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        gap: '16px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          fontSize: '48px',
          color: '#ef4444',
          marginBottom: '16px'
        }}>
          ⚠️
        </div>
        <h3 style={{
          color: '#ef4444',
          margin: 0,
          fontSize: '24px',
          fontWeight: '600'
        }}>
          กำลังปรับปรุงจากต้นทาง OPM1111
        </h3>
        <p style={{
          color: '#64748b',
          margin: 0,
          fontSize: '16px',
          maxWidth: '400px',
          lineHeight: '1.5'
        }}>
          กรุณารอสักครู่และลองใหม่อีกครั้ง
        </p>
        <button
          onClick={handleRefresh}
          style={{
            padding: "12px 24px",
            backgroundColor: "#1120A3",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "500",
            transition: "background-color 0.2s",
            marginTop: "8px"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#0d1a85"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#1120A3"}
        >
          🔄 ลองใหม่
        </button>
      </div>
    );
  }

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
          { label: "เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ OPM1111" },
        ]}
      />

      <TableListOPM
        data={filteredComplaints}
        title="เรื่องราวร้องทุกข์ช่องทางเว็บไซต์ OPM1111"
        navigateTo="/admin/edit/opm1111"
        onSearch={handleSearch}
        handleNavigateTo={handleNavigateTo}
        onRowsPerPageChange={handleRowsPerPageChange} // ใช้ function ใหม่
        onTimelineTypeChange={handleTimelineTypeChange}
        currentTimelineType={timelineType}
        showReopenIndicator={true}
      />
    </>
  );
};

export default Opm1111Components;