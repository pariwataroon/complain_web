import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import ComplaintSummaryService from "@services/ComplaintSummaryService/ComplaintSummaryService";
import { GetComplaintByID } from "@pages/api/complaint/complaint";
import { GetAllSelectComplaintTypes } from "@pages/api/allselect/allselect";
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
function mapComplaintData(raw, complaintTypesMap = new Map()) {
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
      complaintType: (() => {
        // ลำดับความสำคัญ: ชื่อที่มีอยู่แล้ว -> lookup จาก UUID
        const existingName = raw.step3?.general?.complaintTypeName || raw.assignment_form?.complaint_type_name || raw.step3?.general?.complaintType;
        if (existingName && existingName !== "") return existingName;

        // ถ้าไม่มีชื่อ ให้ lookup จาก UUID
        const uuid = raw.step3?.general?.complaintTypeId || raw.assignment_form?.complaint_type_id || raw.assignment_form?.complaint_type;
        if (uuid && complaintTypesMap.has(uuid)) {
          return complaintTypesMap.get(uuid);
        }

        return uuid || "";
      })(),
      complaintTypeId: raw.step3?.general?.complaintTypeId || raw.assignment_form?.complaint_type_id || raw.assignment_form?.complaint_type || "",
      complaintTypeName: (() => {
        const existingName = raw.step3?.general?.complaintTypeName || raw.assignment_form?.complaint_type_name;
        if (existingName && existingName !== "") return existingName;

        // lookup จาก UUID
        const uuid = raw.step3?.general?.complaintTypeId || raw.assignment_form?.complaint_type_id || raw.assignment_form?.complaint_type;
        if (uuid && complaintTypesMap.has(uuid)) {
          return complaintTypesMap.get(uuid);
        }

        return "";
      })(),
      complaintSubtype: raw.step3?.general?.complaintSubtype || raw.step3?.general?.complaint_subtype || raw.step3?.general?.complaint_subtype_name || raw.step3?.general?.complaint_subtype_data?.name || raw.assignment_form?.complaint_subtype_name || raw.assignment_form?.complaint_subtype || "",
      complaintSubtypeId: raw.step3?.general?.complaintSubtypeId || raw.assignment_form?.complaint_subtype_id || raw.assignment_form?.complaint_subtype || "",
      complaintSubtypeName: raw.step3?.general?.complaint_subtype_name || raw.step3?.general?.complaint_subtype_data?.name || raw.assignment_form?.complaint_subtype_name || "",
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
    assignment_form: raw.assignment_form ? { ...raw.assignment_form } : undefined,
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
  const [rawData, setRawData] = useState(null);  // เก็บ raw data จาก API
  const [loading, setLoading] = useState(false);
  const [complaintTypesMap, setComplaintTypesMap] = useState(new Map()); // Map: UUID -> ชื่อประเภท
  const [typesLoaded, setTypesLoaded] = useState(false);
  const lastFetchRef = useRef(0);
  const initialRouteRef = useRef(true);
  const lastFocusRef = useRef(0);
  const MIN_FETCH_INTERVAL = 5000; // 5s throttle
  const FOCUS_REFETCH_INTERVAL = 30000; // 30s between focus refetch

  // Fetch complaint types master data
  useEffect(() => {
    if (typesLoaded) return;

    const fetchComplaintTypes = async () => {
      try {
        const response = await GetAllSelectComplaintTypes();
        if (response?.res_code === "0000" && response?.res_data) {
          const typesMap = new Map();
          response.res_data.forEach((type) => {
            typesMap.set(type.id, type.name);
          });
          setComplaintTypesMap(typesMap);
          setTypesLoaded(true);
          console.log('✅ Loaded complaint types for detail page:', typesMap.size, 'types');
        }
      } catch (error) {
        console.error('Failed to load complaint types:', error);
        setTypesLoaded(true);
      }
    };

    fetchComplaintTypes();
  }, [typesLoaded]);

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

  const fetchData = async ({ force = false, reason = '' } = {}) => {
    if (!id) return;
    const now = Date.now();
    if (!force) {
      if (loading) return; // prevent overlap
      if (now - lastFetchRef.current < MIN_FETCH_INTERVAL) return; // throttle
    }
    lastFetchRef.current = now;
    console.log(`=== FETCHING COMPLAINT DATA (${force ? 'force' : 'throttled'}) reason:${reason} ===`);
    setLoading(true);
    try {
      const res = await GetComplaintByID(id); // remove cache-busting param here
      if (!res?.res_data) {
        console.error("No res_data in response!");
        return;
      }
      setRawData(res.res_data); // เก็บ raw data ไว้
      const mappedData = mapComplaintData(res.res_data, complaintTypesMap);
      setData(mappedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // initial/id change
  useEffect(() => {
    if (!typesLoaded) return; // รอให้โหลด complaint types เสร็จก่อน
    fetchData({ force: true, reason: 'id-change-initial' });
  }, [id, typesLoaded]);

  // route/focus/edit flag listeners
  useEffect(() => {
    const handleRouteChange = () => {
      if (initialRouteRef.current) {
        initialRouteRef.current = false; // skip first route completion
        return;
      }
      if (router.asPath.includes(`/admin/search-complaints/${id}`) && id) {
        fetchData({ force: true, reason: 'route-return' });
      }
    };

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusRef.current > FOCUS_REFETCH_INTERVAL) {
        lastFocusRef.current = now;
        fetchData({ force: false, reason: 'window-focus' });
      }
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    const checkForUpdates = () => {
      if (wasComplaintRecentlyEdited(id)) {
        console.log('Detected recent edit flag; refetching');
        fetchData({ force: true, reason: 'edit-flag' });
        clearComplaintEditFlag(id);
      }
    };

    const interval = setInterval(checkForUpdates, 8000); // slower polling

    router.events.on('routeChangeComplete', handleRouteChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibility);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [router, id]);

  if (!id) return <div>No Complaint ID</div>;
  if (loading) return <div>Loading...</div>;
  
  // Define validation flags to prevent ReferenceError and for debugging/use later
  const hasComplainantData = !!(
    data?.complainant &&
    Object.values(data.complainant).some((val) => val !== null && val !== undefined && val !== "")
  );
  const hasDelegateData = !!(
    data?.delegate &&
    Object.values(data.delegate).some((val) => val !== null && val !== undefined && val !== "")
  );
  const hasRespondentData = !!(
    data?.respondent &&
    Object.values(data.respondent).some((val) => val !== null && val !== undefined && val !== "")
  );

  console.log("=======================================");

  return <ComplaintSummaryService
    data={{ ...data, ...rawData }}
    handleSubmit={handleSubmit}
    onRefresh={() => fetchData({ force: true, reason: 'manual-refresh' })}
  />;
};

export default ComplaintDetail;



