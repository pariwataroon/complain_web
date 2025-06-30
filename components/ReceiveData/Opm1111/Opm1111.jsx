import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import BreadcrumbsService from "@services/BreadCrumbs/breadcrumbs";
import TableListOPM from "@services/TableListOPM/TableListOPM";
import Cookies from "js-cookie";
import { Encode, GetTimelineHeader } from "@pages/api/opm/opm";
import { showLoading, closeAlert, alertError } from "@utils/Alerts";

const Opm1111Components = () => {
  const [result, setResult] = useState("");
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
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
          await fetchTimelineHeader(rowsPerPage);

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

  const fetchTimelineHeader = async (take) => {
    try {

      const timelineData = await GetTimelineHeader(take);
      const parsedData = Array.isArray(timelineData) ? timelineData : timelineData;

      const mappedComplaints = parsedData.map((item) => {
        // console.log({ item }); 
        return {
          case_id: item.case_id,
          case_code: item.case_code,
          customer_name: item.customer_name,
          type_text: item.type_text,
          status_text: item.status_text,
          main_status_text: item.main_status_text,
          ShowDateTime: item.ShowDateTime,
        };
      });

      setComplaints(mappedComplaints);
      setFilteredComplaints(mappedComplaints);
    } catch (error) {
      console.error("Error fetching timeline header:", error);
      alertError(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  };

  useEffect(() => {
    if (isDataLoaded && result && result !== "Error occurred while fetching token.") {
      showLoading("กำลังโหลดข้อมูล...");

      const fetchData = async () => {
        try {
          await fetchTimelineHeader(rowsPerPage);
        } finally {
          closeAlert();
        }
      };

      fetchData();
    }
  }, [rowsPerPage, isDataLoaded, result]);

  const handleSearch = (searchQuery) => {
    const filtered = complaints.filter((complaint) =>
      complaint.case_code.includes(searchQuery) || complaint.customer_name.includes(searchQuery)
    );
    setFilteredComplaints(filtered);
  };

  const handleNavigateTo = (path) => {
    router.push(path);
  };

  const handleRefresh = () => {
    window.location.reload();
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
          เกิดข้อผิดพลาด
        </h3>
        <p style={{
          color: '#64748b',
          margin: 0,
          fontSize: '16px',
          maxWidth: '400px',
          lineHeight: '1.5'
        }}>
          ไม่สามารถรับรองตัวตนได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และลองใหม่อีกครั้ง
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
        onRowsPerPageChange={(newRowsPerPage) => setRowsPerPage(newRowsPerPage)}
      />
    </>
  );
};

export default Opm1111Components;