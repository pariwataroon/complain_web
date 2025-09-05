import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ComplaintSummaryService from "@services/ComplaintSummaryService/ComplaintSummaryService";
import { GetComplaintByID } from "@pages/api/complaint/complaint";
import { wasComplaintRecentlyEdited, clearComplaintEditFlag } from "@utils/complaintEditState";

// mockupData ตามโครงสร้างที่ให้มา
export const mockupData = {
  complainant: {
    idCard: "",
    name: "",
    address: "",
    label: "", // ตำบล/แขวง
    district: "", // อำเภอ/เขต
    province: "", // จังหวัด
    zipcode: "",
    email: "",
    phone: "",
  },
  delegate: {
    idCard: "",
    name: "",
    address: "",
    label: "", // ตำบล/แขวง
    district: "", // อำเภอ/เขต
    province: "", // จังหวัด
    zipcode: "",
    email: "",
    phone: "",
  },
  corporate: {
    idCard: "",
    name: "",
    address: "",
    label: "",
    district: "",
    province: "",
    zipcode: "",
    email: "",
    phone: "",
  },
  signer: {
    idCard: "",
    name: "",
    address: "",
    label: "",
    district: "",
    province: "",
    zipcode: "",
    email: "",
    phone: "",
  },
  respondent: {
    idCard: "",
    name: "",
    address: "",
    label: "", // ตำบล/แขวง
    district: "", // อำเภอ/เขต
    province: "", // จังหวัด
    zipcode: "",
    email: "",
    phone: "",
  },
  corporateS2: {
    idCard: "",
    name: "",
    address: "",
    label: "",
    district: "",
    province: "",
    zipcode: "",
    email: "",
    phone: "",
  },
  government: {
    idCard: "",
    name: "",
    address: "",
    label: "",
    district: "",
    province: "",
    zipcode: "",
    email: "",
    phone: "",
  },
  complaint: {
    complaintType: "",
    subject: "",
    channel: "",
    incidentDate: "",
    description: "",
  },
  files: [{ name: "" }, { name: "" }, { name: "" }],
};

// ฟังก์ชัน mapping ที่ควรใช้ค่าจาก API มาฝังใส่ mockupData
function mapComplaintData(raw) {
  if (!raw) {
    console.log("No raw data provided, returning mockup");
    return { ...mockupData };
  }

  console.log("=== MAPPING COMPLAINT DATA ===");
  console.log("Raw API data structure:", JSON.stringify(raw, null, 2));
  
  // ตรวจสอบ step1 data
  console.log("Step1 data:", raw.step1);
  console.log("Step1 general:", raw.step1?.general);
  console.log("Step1 corporate:", raw.step1?.corporate);
  console.log("Step1 delegate:", raw.step1?.delegate);
  
  // ตรวจสอบ step2 data
  console.log("Step2 data:", raw.step2);
  console.log("Step2 individual:", raw.step2?.individual);
  console.log("Step2 corporate:", raw.step2?.corporate);
  console.log("Step2 government:", raw.step2?.government);

  // ตัวอย่าง mapping: ให้ copy โครง mockupData มา แล้วฝังค่าจาก raw ลงในแต่ละ field
  const mappedData = {
    complainant: {
      idCard: raw.step1?.general?.general?.idCard || "",
      name: raw.step1?.general?.general?.name || "",
      address: raw.step1?.general?.general?.address || "",
      subdistricts: raw.step1?.general?.general?.subdistricts?.label || raw.step1?.general?.general?.subdistricts || "",
      district: raw.step1?.general?.general?.districts?.label || raw.step1?.general?.general?.districts || "",
      province: raw.step1?.general?.general?.province?.label || raw.step1?.general?.general?.province || "",
      zipcode: raw.step1?.general?.general?.zipcode?.label || raw.step1?.general?.general?.zipcode || "",
      email: raw.step1?.general?.general?.email || "",
      phone: raw.step1?.general?.general?.phone || "",
    },
    delegate: {
      idCard: raw.step1?.general?.delegate?.idCard || "",
      name: raw.step1?.general?.delegate?.name || "",
      address: raw.step1?.general?.delegate?.address || "",
      subdistricts: raw.step1?.general?.delegate?.subdistricts?.label || raw.step1?.general?.delegate?.subdistricts || "",
      district: raw.step1?.general?.delegate?.districts?.label || raw.step1?.general?.delegate?.districts || "",
      province: raw.step1?.general?.delegate?.province?.label || raw.step1?.general?.delegate?.province || "",
      zipcode: raw.step1?.general?.delegate?.zipcode?.label || raw.step1?.general?.delegate?.zipcode || "",
      email: raw.step1?.general?.delegate?.email || "",
      phone: raw.step1?.general?.delegate?.phone || "",
    },
    corporate: {
      idCard: raw.step1?.corporate?.idCard || "",
      name: raw.step1?.corporate?.name || "",
      address: raw.step1?.corporate?.address || "",
      subdistricts: raw.step1?.corporate?.subdistricts?.label || raw.step1?.corporate?.subdistricts || "",
      district: raw.step1?.corporate?.districts?.label || raw.step1?.corporate?.districts || "",
      province: raw.step1?.corporate?.province?.label || raw.step1?.corporate?.province || "",
      zipcode: raw.step1?.corporate?.zipcode?.label || raw.step1?.corporate?.zipcode || "",
      email: raw.step1?.corporate?.email || "",
      phone: raw.step1?.corporate?.phone || "",
    },
    signer: {
      idCard: raw.step1?.signer?.idCard || "",
      name: raw.step1?.signer?.name || "",
      address: raw.step1?.signer?.address || "",
      subdistricts: raw.step1?.signer?.subdistricts?.label || raw.step1?.signer?.subdistricts || "",
      district: raw.step1?.signer?.districts?.label || raw.step1?.signer?.districts || "",
      province: raw.step1?.signer?.province?.label || raw.step1?.signer?.province || "",
      zipcode: raw.step1?.signer?.zipcode?.label || raw.step1?.signer?.zipcode || "",
      email: raw.step1?.signer?.email || "",
      phone: raw.step1?.signer?.phone || "",
    },
    respondent: {
      idCard: raw.step2?.general?.individual?.idCard || raw.step2?.general?.corporate?.idCard || raw.step2?.general?.government?.idCard || "",
      name: raw.step2?.general?.individual?.name || raw.step2?.general?.corporate?.name || raw.step2?.general?.government?.name || "",
      address: raw.step2?.general?.individual?.address || raw.step2?.general?.corporate?.address || raw.step2?.general?.government?.address || "",
      subdistricts: raw.step2?.general?.individual?.subdistricts?.label || raw.step2?.general?.individual?.subdistricts || raw.step2?.general?.corporate?.subdistricts?.label || raw.step2?.general?.corporate?.subdistricts || raw.step2?.general?.government?.subdistricts?.label || raw.step2?.general?.government?.subdistricts || "",
      district: raw.step2?.general?.individual?.districts?.label || raw.step2?.general?.individual?.districts || raw.step2?.general?.corporate?.districts?.label || raw.step2?.general?.corporate?.districts || raw.step2?.general?.government?.districts?.label || raw.step2?.general?.government?.districts || "",
      province: raw.step2?.general?.individual?.province?.label || raw.step2?.general?.individual?.province || raw.step2?.general?.corporate?.province?.label || raw.step2?.general?.corporate?.province || raw.step2?.general?.government?.province?.label || raw.step2?.general?.government?.province || "",
      zipcode: raw.step2?.general?.individual?.zipcode?.label || raw.step2?.general?.individual?.zipcode || raw.step2?.general?.corporate?.zipcode?.label || raw.step2?.general?.corporate?.zipcode || raw.step2?.general?.government?.zipcode?.label || raw.step2?.general?.government?.zipcode || "",
      email: raw.step2?.general?.individual?.email || raw.step2?.general?.corporate?.email || raw.step2?.general?.government?.email || "",
      phone: raw.step2?.general?.individual?.phone || raw.step2?.general?.corporate?.phone || raw.step2?.general?.government?.phone || "",
    },
    corporateS2: {
      idCard: raw.step2?.corporate?.idCard || raw.step2?.general?.corporate?.idCard || "",
      name: raw.step2?.corporate?.name || raw.step2?.general?.corporate?.name || "",
      address: raw.step2?.corporate?.address || raw.step2?.general?.corporate?.address || "",
      subdistricts: raw.step2?.corporate?.subdistricts?.label || raw.step2?.corporate?.subdistricts || raw.step2?.general?.corporate?.subdistricts?.label || raw.step2?.general?.corporate?.subdistricts || "",
      district: raw.step2?.corporate?.districts?.label || raw.step2?.corporate?.districts || raw.step2?.general?.corporate?.districts?.label || raw.step2?.general?.corporate?.districts || "",
      province: raw.step2?.corporate?.province?.label || raw.step2?.corporate?.province || raw.step2?.general?.corporate?.province?.label || raw.step2?.general?.corporate?.province || "",
      zipcode: raw.step2?.corporate?.zipcode?.label || raw.step2?.corporate?.zipcode || raw.step2?.general?.corporate?.zipcode?.label || raw.step2?.general?.corporate?.zipcode || "",
      email: raw.step2?.corporate?.email || raw.step2?.general?.corporate?.email || "",
      phone: raw.step2?.corporate?.phone || raw.step2?.general?.corporate?.phone || "",
    },
    government: {
      idCard: raw.step2?.government?.idCard || raw.step2?.general?.government?.idCard || "",
      name: raw.step2?.government?.name || raw.step2?.general?.government?.name || "",
      address: raw.step2?.government?.address || raw.step2?.general?.government?.address || "",
      subdistricts: raw.step2?.government?.subdistricts?.label || raw.step2?.government?.subdistricts || raw.step2?.general?.government?.subdistricts?.label || raw.step2?.general?.government?.subdistricts || "",
      district: raw.step2?.government?.districts?.label || raw.step2?.government?.districts || raw.step2?.general?.government?.districts?.label || raw.step2?.general?.government?.districts || "",
      province: raw.step2?.government?.province?.label || raw.step2?.government?.province || raw.step2?.general?.government?.province?.label || raw.step2?.general?.government?.province || "",
      zipcode: raw.step2?.government?.zipcode?.label || raw.step2?.government?.zipcode || raw.step2?.general?.government?.zipcode?.label || raw.step2?.general?.government?.zipcode || "",
      email: raw.step2?.government?.email || raw.step2?.general?.government?.email || "",
      phone: raw.step2?.government?.phone || raw.step2?.general?.government?.phone || "",
    },
    complaint: {
      id: raw.id || raw.assignment_form?.id || "",
      complaintType: raw.step3?.general?.complaintType || raw.assignment_form?.complaint_type || "",
      subject: raw.step3?.general?.subject || raw.assignment_form?.subject || "",
      channel: raw.step3?.general?.complaintChannelName || raw.assignment_form?.complaint_channel_name || "",
      incidentDate: raw.step3?.general?.incidentDate || raw.step4?.general?.incident_date || "",
      description: raw.step3?.general?.description || "",
    },
    files: Array.isArray(raw.step3?.general?.attachment)
      ? raw.step3.general.attachment.map((f) => ({
          name: f.fileName || f.name || f.filename || "",
          url: f.fileUrl || f.url || "",
        }))
      : [],
  };

  console.log("=== MAPPED DATA RESULT ===");
  console.log("Mapped complainant:", mappedData.complainant);
  console.log("Mapped delegate:", mappedData.delegate);
  console.log("Mapped respondent:", mappedData.respondent);
  console.log("Mapped complaint:", mappedData.complaint);
  console.log("================================");

  return mappedData;
}

const ComplaintDetail = () => {
  const router = useRouter();
  const { id } = router.query;  // ดึง id จาก URL query
  const [data, setData] = useState(mockupData);  // ค่าเริ่มต้น
  const [loading, setLoading] = useState(false);

  // Debug state changes
  useEffect(() => {
    console.log("=== DATA STATE CHANGED ===");
    console.log("New data state:", JSON.stringify(data, null, 2));
    console.log("Complainant has data:", data?.complainant && Object.values(data.complainant).some(val => val && val !== ""));
    console.log("Delegate has data:", data?.delegate && Object.values(data.delegate).some(val => val && val !== ""));
    console.log("Respondent has data:", data?.respondent && Object.values(data.respondent).some(val => val && val !== ""));
    console.log("===========================");
  }, [data]);

  const handleSubmit = () => {
    router.push(`/admin/edit/website-complaints/${id}`);  // ส่งไปหน้าแก้ไข
  };

  const fetchData = async () => {
    if (!id) {
      console.log("No ID provided, skipping fetch");
      return;
    }
    
    console.log("=== FETCHING COMPLAINT DATA ===");
    console.log("Complaint ID:", id);
    console.log("Current timestamp:", new Date().toISOString());
    
    setLoading(true);
    try {
      // เพิ่ม timestamp เพื่อป้องกัน cache
      const res = await GetComplaintByID(id + '?t=' + Date.now()); 
      console.log("API Response:", res);
      console.log("API Response Data:", res?.res_data);
      
      if (!res?.res_data) {
        console.error("No res_data in response!");
        return;
      }
      
      const mappedData = mapComplaintData(res?.res_data);
      console.log("Final mapped data being set to state:", mappedData);
      
      setData(mappedData);
      
      // Force re-render โดยการ set state ใหม่
      setTimeout(() => {
        console.log("Force checking state after 100ms:", mappedData);
        setData(prev => ({ ...mappedData }));
      }, 100);
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch ข้อมูลเมื่อ id เปลี่ยน
  useEffect(() => {
    fetchData();
  }, [id]);

  // Refetch ข้อมูลเมื่อกลับมาจากหน้าอื่น (router focus)
  useEffect(() => {
    const handleRouteChange = () => {
      // เมื่อ route เปลี่ยนกลับมาหน้านี้ ให้ refetch ข้อมูล
      if (router.asPath.includes(`/admin/search-complaints/${id}`) && id) {
        console.log("Route changed back to complaint detail, refetching data...");
        fetchData();
      }
    };

    const handleFocus = () => {
      // เมื่อ window กลับมา focus (เช่น กลับจาก tab อื่น)
      if (id) {
        console.log("Window focused, refetching data...");
        fetchData();
      }
    };

    // ตรวจสอบ localStorage เพื่อดูว่ามีการแก้ไขหรือไม่
    const checkForUpdates = () => {
      if (wasComplaintRecentlyEdited(id)) {
        console.log("Complaint was recently edited, refetching data...");
        fetchData();
        clearComplaintEditFlag(id); // ลบ flag หลังจาก refetch
      }
    };

    const interval = setInterval(checkForUpdates, 1000); // ตรวจสอบทุกวินาที

    router.events.on('routeChangeComplete', handleRouteChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    });

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [router, id]);

  if (!id) return <div>No Complaint ID</div>;
  if (loading) return <div>Loading...</div>;
  
  console.log("Data validation:", {
    hasComplainantData,
    hasDelegateData, 
    hasRespondentData
  });
  console.log("=======================================");

  return <ComplaintSummaryService 
    data={data} 
    handleSubmit={handleSubmit} 
    onRefresh={fetchData}
  />;
};

export default ComplaintDetail;



