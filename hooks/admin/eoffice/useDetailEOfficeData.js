/**
 * useDetailEOfficeData — Hook สำหรับจัดการข้อมูล EOffice แล้วส่งเข้าคลังเอกสาร
 *
 * ทำงานเหมือน useDetailOPMData แต่สำหรับข้อมูลจาก eofficer REST API (JSON)
 * - แปลงข้อมูล EOffice เป็น format ของ complaint system
 * - Auto-create complaint เข้าคลังเอกสาร (ตรวจสอบซ้ำก่อน)
 * - ใช้ CreateComplaint API เหมือน OPM1111
 */
import { useState, useEffect, useRef } from "react";
import { GetAllComplaintChannels } from "@pages/api/allselect/allselect";
import { CreateComplaint, UpdateComplaint, GetComplaintByReferenceNumber5 } from "@pages/api/complaint/complaint";

const useDetailEOfficeData = ({ caseDetail, attachments, operatings }) => {
  const [eofficeChannelId, setEofficeChannelId] = useState(null);
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const channelFetchedRef = useRef(false);

  // ── ตรวจสอบว่าข้อมูลพร้อม ──
  useEffect(() => {
    if (caseDetail && caseDetail.case_id) {
      setIsDataReady(true);
    }
  }, [caseDetail]);

  // ── ดึง Channel ID ของ EOffice ──
  const getEofficeChannelId = async () => {
    try {
      console.log("[EOffice] 📡 กำลังดึง channel ID...");
      const data = await GetAllComplaintChannels();
      const items = data.res_data?.items || [];
      console.log("[EOffice] 📡 ได้ channels:", items.length, "รายการ");

      const eofficeChannel = items.find(
        (item) =>
          item.name?.includes("EOffice") ||
          item.name?.includes("eoffice") ||
          item.name?.includes("Mof_EOffice")
      );
      if (eofficeChannel) {
        console.log("[EOffice] ✅ พบ EOffice channel:", eofficeChannel.id);
        setEofficeChannelId(eofficeChannel.id);
        return eofficeChannel.id;
      } else {
        // ถ้าไม่เจอ channel EOffice ให้ใช้ channel เริ่มต้น (website)
        const websiteChannel = items.find(
          (item) => item.name?.includes("เว็บไซต์")
        );
        if (websiteChannel) {
          console.log("[EOffice] ⚠️ ไม่เจอ EOffice channel ใช้ website:", websiteChannel.id);
          setEofficeChannelId(websiteChannel.id);
          return websiteChannel.id;
        }
        throw new Error("EOffice Channel not found — no channels available");
      }
    } catch (error) {
      console.error("[EOffice] ❌ Error fetching Channel ID:", error);
      return null;
    }
  };

  // ── แปลงข้อมูล EOffice เป็น format สำหรับ CreateComplaint API ──
  const getFormattedDataForCreateAPI = () => {
    if (!caseDetail) return null;

    const complainant = caseDetail.complainant || {};
    const respondent = caseDetail.respondent || {};

    // แปลงวันที่ (EOffice ส่ง ISO date หรือ timestamp string)
    let incidentDate = caseDetail.date_received || "";
    if (incidentDate) {
      try {
        // ลอง parse แบบต่างๆ
        if (incidentDate.includes("T")) {
          // ISO format: "2026-06-19T00:00:00"
          const d = new Date(incidentDate);
          if (!isNaN(d.getTime())) incidentDate = d.toISOString();
        } else {
          // Thai format: "2569/01/15 09:30:00"
          const parts = incidentDate.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
          if (parts) {
            const year = parseInt(parts[1]) - 543;
            incidentDate = new Date(year, parseInt(parts[2]) - 1, parseInt(parts[3]), parseInt(parts[4]), parseInt(parts[5]), parseInt(parts[6])).toISOString();
          }
        }
      } catch (e) {
        incidentDate = new Date().toISOString();
      }
    } else {
      incidentDate = new Date().toISOString();
    }

    // step1: ผู้ร้อง — EOffice ใช้ complainant.name (ชื่อ-นามสกุล เต็ม)
    const complainantName = complainant.name || caseDetail.from_org || "";
    const step1 = {
      general: {
        general: {
          idCard: complainant.citizen_id || "",
          name: complainantName,
          address: complainant.address || "",
          phone: complainant.phone || "",
          email: complainant.email || "",
          province: complainant.province ? { label: complainant.province } : undefined,
          districts: complainant.district ? { label: complainant.district } : undefined,
          subdistricts: complainant.sub_district ? { label: complainant.sub_district } : undefined,
          zipcode: complainant.zipcode ? { label: complainant.zipcode } : undefined,
        },
      },
    };

    // step2: ผู้ถูกร้อง (ถ้ามีและต่างจากผู้ร้อง)
    const respondentName = respondent.name || caseDetail.to_org || "";
    let step2 = undefined;
    if (respondentName && respondentName !== "-" && respondentName !== complainantName) {
      step2 = {
        general: {
          individual: {
            idCard: "",
            name: respondentName,
            email: "",
            address: "",
            phone: respondent.phone || "",
          },
          activeType: "individual",
        },
      };
    }

    // step3: รายละเอียดเรื่อง — subject ใช้ชื่อเรื่องจริง, case_id เก็บใน reference_number5
    const step3 = {
      general: {
        complaintType: caseDetail.type_name || "",
        subject: caseDetail.subject || caseDetail.title || caseDetail.content_title || caseDetail.description || "",
        incidentDate: incidentDate,
        description: caseDetail.description || caseDetail.subject || caseDetail.title || "",
        attachment:
          attachments?.map((file) => ({
            id: file.id || file.attachment_id,
            name: file.file_name,
            type: file.file_type,
            size: file.file_size,
            description: "",
            content: file.file_content || null,
          })) || [],
      },
    };

    // step4: metadata + reference tracking
    const step4 = {
      general: {
        accepted: true,
        reference_number5: String(caseDetail.case_id || ""), // เก็บ case_id ของ EOffice สำหรับ dedup
        _eoffice_meta: {
          case_id: caseDetail.case_id,
          status: caseDetail.status,
          channel: caseDetail.channel_name,
          synced_at: new Date().toISOString(),
        },
      },
    };

    const payload = {
      step1,
      ...(step2 ? { step2 } : {}),
      step3,
      step4,
    };

    console.log("[EOffice] 📦 Payload preview:", {
      subject: payload.step3.general.subject,
      complainantName: complainantName,
      respondentName,
      incidentDate,
      channel: caseDetail.channel_name,
    });

    return payload;
  };

  // ── ตรวจสอบว่าเรื่องนี้มีในระบบแล้วหรือยัง ──
  // 1) เช็ค localStorage ก่อน (เร็ว, ไม่ต้องรอ backend)
  // 2) ถ้าไม่เจอ → เช็ค backend (reference_number5 filter)
  // คืนค่า { found, item } — found=true พบซ้ำ, found=false ไม่พบ, found=null ตรวจล้มเหลว
  const checkDuplicate = async () => {
    if (!caseDetail?.case_id) return { found: false, item: null };
    const caseIdStr = String(caseDetail.case_id);

    // ── 1) localStorage check (ป้องกันซ้ำแม้ backend ยังไม่ restart) ──
    try {
      const createdIds = JSON.parse(localStorage.getItem("eoffice_created_ids") || "[]");
      if (createdIds.includes(caseIdStr)) {
        console.log(`[EOffice] ✅ พบเรื่องซ้ำใน localStorage case_id=${caseIdStr}`);
        return { found: true, item: { id: "localStorage" } };
      }
    } catch (lsErr) {
      // localStorage error — ข้าม ไปเช็ค backend
    }

    // ── 2) backend check (reference_number5 filter) ──
    try {
      const existingRes = await GetComplaintByReferenceNumber5({
        reference_number5: caseIdStr,
        limit: 10,
      });

      const existingItems = existingRes?.res_data?.items || [];
      const existingItem = existingItems.find(
        (item) => String(item.reference_number5) === caseIdStr
      );

      if (existingItem) {
        console.log(`[EOffice] ✅ พบเรื่องซ้ำจาก backend case_id=${caseIdStr} → complaint id=${existingItem.id}`);
        // เก็บลง localStorage ด้วย ครั้งหน้าจะได้ไม่ต้องเช็ค backend
        saveCreatedId(caseIdStr);
        return { found: true, item: existingItem };
      }

      console.log(`[EOffice] 🔍 ไม่พบเรื่องซ้ำ case_id=${caseIdStr}`);
      return { found: false, item: null };
    } catch (checkError) {
      console.error("[EOffice] ❌ เช็คเรื่องซ้ำล้มเหลว:", checkError.message);
      return { found: null, item: null }; // null = ตรวจไม่สำเร็จ
    }
  };

  // ── บันทึก case_id ลง localStorage (ป้องกันสร้างซ้ำ) ──
  const saveCreatedId = (caseIdStr) => {
    try {
      const createdIds = JSON.parse(localStorage.getItem("eoffice_created_ids") || "[]");
      if (!createdIds.includes(caseIdStr)) {
        createdIds.push(caseIdStr);
        localStorage.setItem("eoffice_created_ids", JSON.stringify(createdIds));
      }
    } catch (e) {
      // ignore localStorage errors
    }
  };

  // ── สร้าง complaint ในระบบ ──
  const createComplaintAPI = async (apiData) => {
    try {
      setIsCreating(true);
      const result = await CreateComplaint(eofficeChannelId, apiData);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // ── Auto-create complaint เข้าคลังเอกสาร ──
  const autoCreateComplaint = async () => {
    try {
      setAutoCreateAttempted(true);
      console.log(`[EOffice] 🚀 เริ่ม auto-create เรื่อง ${caseDetail?.case_id}...`);

      // เช็คก่อนว่าเรื่องนี้มีอยู่แล้วหรือยัง
      const { found, item: existingItem } = await checkDuplicate();

      // ── ตรวจล้มเหลว → ห้ามสร้าง เพื่อป้องกันสร้างซ้ำ ──
      if (found === null) {
        console.error(`[EOffice] 🛑 เช็คเรื่องซ้ำล้มเหลว → ยกเลิกการสร้าง case_id=${caseDetail?.case_id}`);
        return null;
      }

      // ── พบซ้ำ → ข้าม (หรืออัปเดต description) ──
      if (found) {
        console.log(`[EOffice] ⏭️ เรื่อง ${caseDetail.case_id} มีอยู่แล้ว ข้ามการสร้าง`);
        return null;
      }

      // ── ไม่พบซ้ำ → สร้างใหม่ ──
      const apiData = getFormattedDataForCreateAPI();
      if (!apiData) {
        console.warn("[EOffice] ⚠️ ไม่มีข้อมูลสำหรับสร้าง complaint");
        return null;
      }

      console.log(`[EOffice] 📤 กำลังสร้าง complaint... (channel: ${eofficeChannelId})`);
      const result = await createComplaintAPI(apiData);
      console.log(`[EOffice] ✅ สร้าง complaint เรื่อง ${caseDetail.case_id} สำเร็จ!`, result);

      // บันทึก case_id ลง localStorage ป้องกันสร้างซ้ำ (hot-reload / เข้าหน้าเดิม)
      saveCreatedId(String(caseDetail.case_id));

      return result;
    } catch (error) {
      console.error("[EOffice] ❌ Error auto-creating complaint:", error?.response?.data || error?.message || error);
      throw error;
    }
  };

  // ── Auto-create หลังจากดูข้อมูล 18 วินาที (เหมือน OPM1111) ──
  useEffect(() => {
    let timeoutId;
    console.log("[EOffice] ⏱️ Timer check:", { isDataReady, eofficeChannelId, autoCreateAttempted, isCreating });
    if (
      isDataReady &&
      eofficeChannelId &&
      !autoCreateAttempted &&
      !isCreating
    ) {
      console.log("[EOffice] ⏱️ เริ่มนับ 18 วินาที...");
      timeoutId = setTimeout(() => {
        console.log("[EOffice] ⏱️ 18 วินาทีผ่าน! เริ่ม auto-create");
        autoCreateComplaint();
      }, 18000); // 18 วินาที
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isDataReady, eofficeChannelId, autoCreateAttempted, isCreating]);

  // ── ดึง Channel ID เมื่อข้อมูลพร้อม ──
  useEffect(() => {
    if (isDataReady && !eofficeChannelId && !channelFetchedRef.current) {
      channelFetchedRef.current = true;
      getEofficeChannelId();
    }
  }, [isDataReady, eofficeChannelId]);

  return {
    isDataReady,
    isCreating,
    autoCreateAttempted,
    eofficeChannelId,

    getFormattedDataForCreateAPI,
    createComplaintAPI,
    autoCreateComplaint,
    checkDuplicate,
    getEofficeChannelId,

    setAutoCreateAttempted,
    setIsCreating,
  };
};

export default useDetailEOfficeData;
