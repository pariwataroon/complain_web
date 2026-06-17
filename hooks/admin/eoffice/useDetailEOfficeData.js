/**
 * useDetailEOfficeData — Hook สำหรับจัดการข้อมูล EOffice แล้วส่งเข้าคลังเอกสาร
 *
 * ทำงานเหมือน useDetailOPMData แต่สำหรับข้อมูลจาก eofficer REST API (JSON)
 * - แปลงข้อมูล EOffice เป็น format ของ complaint system
 * - Auto-create complaint เข้าคลังเอกสาร (ตรวจสอบซ้ำก่อน)
 * - ใช้ CreateComplaint API เหมือน OPM1111
 */
import { useState, useEffect, useMemo } from "react";
import { GetAllComplaintChannels } from "@pages/api/allselect/allselect";
import { CreateComplaint, GetComplaintsSubjectOPM } from "@pages/api/complaint/complaint";

const useDetailEOfficeData = ({ caseDetail, attachments, operatings }) => {
  const [eofficeChannelId, setEofficeChannelId] = useState(null);
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  // ── ตรวจสอบว่าข้อมูลพร้อม ──
  useEffect(() => {
    if (caseDetail && caseDetail.case_id) {
      setIsDataReady(true);
    }
  }, [caseDetail]);

  // ── ดึง Channel ID ของ EOffice ──
  const getEofficeChannelId = async () => {
    try {
      setIsCreating(true);
      const data = await GetAllComplaintChannels();
      const eofficeChannel = data.res_data?.items?.find(
        (item) =>
          item.name?.includes("EOffice") ||
          item.name?.includes("eoffice") ||
          item.name?.includes("Mof_EOffice")
      );
      if (eofficeChannel) {
        setEofficeChannelId(eofficeChannel.id);
        return eofficeChannel.id;
      } else {
        // ถ้าไม่เจอ channel EOffice ให้ใช้ channel เริ่มต้น (website)
        const websiteChannel = data.res_data?.items?.find(
          (item) => item.name?.includes("เว็บไซต์")
        );
        if (websiteChannel) {
          setEofficeChannelId(websiteChannel.id);
          return websiteChannel.id;
        }
        throw new Error("EOffice Channel not found");
      }
    } catch (error) {
      console.error("❌ Error fetching EOffice Channel ID:", error);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // ── แปลงข้อมูล EOffice เป็น format สำหรับ CreateComplaint API ──
  const getFormattedDataForCreateAPI = () => {
    if (!caseDetail) return null;

    const complainant = caseDetail.complainant || {};
    const respondent = caseDetail.respondent || {};

    // แปลงวันที่
    let incidentDate = caseDetail.date_received || "";
    if (incidentDate) {
      try {
        // แปลง format "2569/01/15 09:30:00" เป็น ISO
        const parts = incidentDate.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (parts) {
          const year = parseInt(parts[1]) - 543; // แปลง พ.ศ. → ค.ศ.
          incidentDate = new Date(year, parseInt(parts[2]) - 1, parseInt(parts[3]), parseInt(parts[4]), parseInt(parts[5]), parseInt(parts[6])).toISOString();
        }
      } catch (e) {
        incidentDate = new Date().toISOString();
      }
    } else {
      incidentDate = new Date().toISOString();
    }

    const step1 = {
      general: {
        general: {
          idCard: complainant.citizen_id || "",
          name: `${complainant.title || ""} ${complainant.first_name || ""} ${complainant.last_name || ""}`.trim(),
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

    // step2: ผู้ถูกร้อง (ถ้ามี)
    let step2 = undefined;
    if (respondent.name && respondent.name !== "-") {
      step2 = {
        general: {
          individual: {
            idCard: "",
            name: respondent.name || "",
            email: "",
            address: "",
            phone: respondent.phone || "",
          },
          activeType: "individual",
        },
      };
    }

    // step3: รายละเอียดเรื่อง
    const step3 = {
      general: {
        complaintType: caseDetail.type_name || "",
        subject: caseDetail.case_id || caseDetail.subject || "",
        incidentDate: incidentDate,
        description: caseDetail.description || caseDetail.subject || "",
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

    // step4: metadata
    const step4 = {
      general: {
        accepted: true,
        reference_number5: caseDetail.case_id || "", // เก็บ case_id ของ EOffice
        _eoffice_meta: {
          case_id: caseDetail.case_id,
          status: caseDetail.status,
          channel: caseDetail.channel_name,
          synced_at: new Date().toISOString(),
        },
      },
    };

    return {
      step1,
      ...(step2 ? { step2 } : {}),
      step3,
      step4,
    };
  };

  // ── ตรวจสอบว่าเรื่องนี้มีในระบบแล้วหรือยัง ──
  const checkDuplicate = async () => {
    if (!caseDetail?.case_id) return false;
    try {
      const existingRes = await GetComplaintsSubjectOPM({
        skip: 0,
        limit: 10,
        subject: caseDetail.case_id,
      });
      const existingItems = existingRes?.res_data?.items || [];
      return existingItems.length > 0;
    } catch (checkError) {
      console.warn("[EOffice] ไม่สามารถเช็คเรื่องซ้ำได้:", checkError.message);
      return false;
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

      // เช็คก่อนว่าเรื่องนี้มีอยู่แล้วหรือยัง
      const isDuplicate = await checkDuplicate();
      if (isDuplicate) {
        console.log(`[EOffice] เรื่อง ${caseDetail.case_id} มีอยู่แล้วในระบบ ข้ามการสร้าง`);
        return null;
      }

      const apiData = getFormattedDataForCreateAPI();
      if (!apiData) {
        console.warn("[EOffice] ไม่มีข้อมูลสำหรับสร้าง complaint");
        return null;
      }

      const result = await createComplaintAPI(apiData);
      console.log(`[EOffice] สร้าง complaint เรื่อง ${caseDetail.case_id} สำเร็จ`);
      return result;
    } catch (error) {
      console.error("[EOffice] Error auto-creating complaint:", error);
      throw error;
    }
  };

  // ── Auto-create หลังจากดูข้อมูล 18 วินาที (เหมือน OPM1111) ──
  useEffect(() => {
    let timeoutId;
    if (
      isDataReady &&
      eofficeChannelId &&
      !autoCreateAttempted &&
      !isCreating
    ) {
      timeoutId = setTimeout(() => {
        autoCreateComplaint();
      }, 18000); // 18 วินาที
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isDataReady, eofficeChannelId, autoCreateAttempted, isCreating]);

  // ── ดึง Channel ID เมื่อข้อมูลพร้อม ──
  useEffect(() => {
    if (isDataReady && !eofficeChannelId) {
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
