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

      // หา channel ชื่อ "ระบบสารบรรณอิเล็กทรอนิกส์" หรือชื่อที่เกี่ยวข้องกับ EOffice
      const eofficeChannel = items.find(
        (item) =>
          item.name?.includes("สารบรรณ") ||
          item.name?.includes("สารบัญ") ||
          item.name?.includes("EOffice") ||
          item.name?.includes("eoffice") ||
          item.name?.includes("Mof_EOffice")
      );
      if (eofficeChannel) {
        console.log("[EOffice] ✅ พบ สารบรรณ/EOffice channel:", eofficeChannel.name, "id:", eofficeChannel.id);
        setEofficeChannelId(eofficeChannel.id);
        return eofficeChannel.id;
      } else {
        console.error("[EOffice] ❌ ไม่พบช่องทาง สารบรรณ/EOffice ในระบบ  channels ที่มี:", items.map(i => i.name));
        throw new Error("EOffice Channel not found — ไม่พบช่องทาง สารบรรณอิเล็กทรอนิกส์");
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
    const complainantName = complainant.org || caseDetail.from_org || "";
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

    // ── Helper: แปลงวันที่ EOffice → ISO string สำหรับ API ──
    const parseEOfficeDate = (dateStr) => {
      if (!dateStr) return null;
      try {
        if (dateStr.includes("T")) {
          // ISO format: "2026-06-04T00:00:00"
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) return d.toISOString();
        }
        // อาจเป็น short date: "2026-06-30"
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d.toISOString();
      } catch (e) {
        console.warn("[EOffice] ⚠️ parseEOfficeDate failed:", dateStr, e);
      }
      return null;
    };

    // ── เลขที่หนังสือ + วันที่ (จาก book_no / book_date) ──
    const documentNumber = caseDetail.book_no || "";
    const documentDate = parseEOfficeDate(caseDetail.book_date) || parseEOfficeDate(caseDetail.date_received);

    // ── เลข สป.กค. + วันที่ (จาก opsDocNo / opsReceivedDate) ──
    const referenceNumber1 = caseDetail.opsDocNo || "";
    const referenceDate1 = parseEOfficeDate(caseDetail.opsReceivedDate);

    // ── เลข สป.สร. + วันที่ (จาก ministerDocNo / ministerDocDate) ──
    const referenceNumber2 = caseDetail.ministerDocNo || "";
    const referenceDate2 = parseEOfficeDate(caseDetail.ministerDocDate);

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
        // เลขที่หนังสือ + วันที่
        document_number: documentNumber,
        document_date: documentDate,
        // เลข สป.กค. + วันที่
        reference_number: referenceNumber1,
        reference_date: referenceDate1,
        // เลข สป.สร. + วันที่
        reference_number2: referenceNumber2,
        reference_date2: referenceDate2,
      },
    };

    // assignment_form: ส่ง reference fields เหมือน WebsiteComplaints (เพื่อให้ backend เก็บได้ตรง)
    const assignment_form = {
      document_number: documentNumber,
      document_date: documentDate,
      // เลข สป.กค. + วันที่
      reference_number: referenceNumber1,
      reference_date: referenceDate1,
      reference_number1: referenceNumber1,
      reference_date1: referenceDate1,
      // เลข สป.สร. + วันที่
      reference_number2: referenceNumber2,
      reference_date2: referenceDate2,
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
      assignment_form,
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

  // ── ตรวจสอบว่าเรื่องนี้มีในระบบแล้วหรือยัง (เทียบ reference_number5 = EOffice case_id) ──
  // คืนค่า { found, item } — found=true พบซ้ำ, found=false ไม่พบ (ตรวจสอบสำเร็จ), found=null ตรวจล้มเหลว
  const checkDuplicate = async () => {
    if (!caseDetail?.case_id) return { found: false, item: null };
    try {
      const caseIdStr = String(caseDetail.case_id);

      // ค้นจาก backend โดยตรงด้วย reference_number5 filter (= additional_reference_number1)
      const existingRes = await GetComplaintByReferenceNumber5({
        reference_number5: caseIdStr,
        limit: 10,
      });

      const existingItems = existingRes?.res_data?.items || [];
      const existingItem = existingItems.find(
        (item) => String(item.reference_number5) === caseIdStr
      );

      if (existingItem) {
        console.log(`[EOffice] ✅ พบเรื่องซ้ำ case_id=${caseIdStr} → complaint id=${existingItem.id}`);
        return { found: true, item: existingItem };
      }

      console.log(`[EOffice] 🔍 ไม่พบเรื่องซ้ำ case_id=${caseIdStr}`);
      return { found: false, item: null };
    } catch (checkError) {
      console.error("[EOffice] ❌ เช็คเรื่องซ้ำล้มเหลว:", checkError.message);
      return { found: null, item: null }; // null = ตรวจไม่สำเร็จ
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

      // ── พบซ้ำ → ข้าม (หรืออัปเดต subject + reference fields) ──
      if (found) {
        console.log(`[EOffice] ⏭️ เรื่อง ${caseDetail.case_id} มีอยู่แล้ว ตรวจสอบข้อมูล...`);

        const currentSubject = existingItem.subject || existingItem.issue || "";
        const correctSubject = caseDetail.subject || caseDetail.title || caseDetail.content_title || caseDetail.description || "";

        // ── ตรวจสอบว่า reference fields ขาดหรือไม่ ──
        const needsRefUpdate = (
          caseDetail.opsDocNo ||
          caseDetail.book_no ||
          caseDetail.ministerDocNo
        ) && (
          !existingItem.reference_number && !existingItem.reference_number1 ||
          !existingItem.document_number ||
          !existingItem.reference_number2
        );

        const needsSubjectUpdate = (
          (currentSubject === "" || currentSubject === "-" || /^\d+$/.test(String(currentSubject))) &&
          correctSubject !== "" && correctSubject !== "-"
        );

        if (needsSubjectUpdate || needsRefUpdate) {
          try {
            const updatePayload = {};
            const step3General = {};
            const updateAssignmentForm = {};

            // อัปเดต subject
            if (needsSubjectUpdate) {
              step3General.subject = correctSubject;
              console.log(`[EOffice] 🔄 กำลัง update subject: "${currentSubject}" → "${correctSubject}"`);
            }

            // อัปเดต reference fields (สป.กค., สป.สร., เลขที่หนังสือ)
            if (needsRefUpdate) {
              const docNo = caseDetail.book_no || "";
              const docDate = caseDetail.book_date || caseDetail.date_received || null;
              const refNo1 = caseDetail.opsDocNo || "";
              const refDate1 = caseDetail.opsReceivedDate || null;
              const refNo2 = caseDetail.ministerDocNo || "";
              const refDate2 = caseDetail.ministerDocDate || null;

              // step3.general
              step3General.document_number = docNo;
              step3General.document_date = docDate;
              step3General.reference_number = refNo1;
              step3General.reference_date = refDate1;
              step3General.reference_number2 = refNo2;
              step3General.reference_date2 = refDate2;

              // assignment_form
              updateAssignmentForm.document_number = docNo;
              updateAssignmentForm.document_date = docDate;
              updateAssignmentForm.reference_number = refNo1;
              updateAssignmentForm.reference_date = refDate1;
              updateAssignmentForm.reference_number1 = refNo1;
              updateAssignmentForm.reference_date1 = refDate1;
              updateAssignmentForm.reference_number2 = refNo2;
              updateAssignmentForm.reference_date2 = refDate2;

              console.log(`[EOffice] 🔄 กำลัง update reference fields:`, { docNo, refNo1, refNo2 });
            }

            if (Object.keys(step3General).length > 0) updatePayload.step3 = { general: step3General };
            if (Object.keys(updateAssignmentForm).length > 0) updatePayload.assignment_form = updateAssignmentForm;

            await UpdateComplaint(existingItem.id, updatePayload);
            console.log(`[EOffice] ✅ อัปเดตข้อมูลสำเร็จสำหรับเรื่อง ${caseDetail.case_id}`);
          } catch (updateErr) {
            console.warn("[EOffice] ⚠️ อัปเดตข้อมูลล้มเหลว:", updateErr.message);
          }
        } else {
          console.log(`[EOffice] ℹ️ ข้อมูลถูกต้องอยู่แล้ว ข้าม`);
        }
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
