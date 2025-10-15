import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
  showConfirm,
} from "@utils/Alerts";
import {
  Addcomplaints,
  UploadAttachments,
  GetComplaintTaskStatus,
  UpdateAssignmentCompleteByAdmin,
} from "@pages/api/complaint/complaint";

const WEBSITE_CHANNEL_LABEL = "เว็บไซต์ (https://complain.mof.go.th/)";

export default function useComplaintForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    step1: {},
    step2: {},
    step3: {},
    step4: {},
    step31: {},
  });

  const updateStepData = useCallback((stepKey, tabKey, data) => {
    setFormData((prev) => {
      const currentTabState = prev[stepKey]?.[tabKey] || {};
      
      const newData = typeof data === 'function' ? data(currentTabState) : data;

      if (JSON.stringify(currentTabState) === JSON.stringify(newData)) {
        return prev;
      }

      return {
        ...prev,
        [stepKey]: {
          ...prev[stepKey],
          [tabKey]: newData,
        },
      };
    });
  }, []);

  const getStepTabData = useCallback(
    (stepKey, tabKey) => {
      return formData[stepKey]?.[tabKey] || {};
    },
    [formData]
  );

  const getFormData = useCallback(() => {
    return formData;
  }, [formData]);

  // ฟังก์ชันสำหรับ normalize และ format วันที่
  const normalizeDate = (value) => {
    if (!value) return null;
    // dayjs/moment-like
    if (value && typeof value === "object" && typeof value.toDate === "function") {
      const d = value.toDate();
      return isNaN(d?.getTime?.()) ? null : d;
    }
    if (value && typeof value === "object" && value.$d instanceof Date) {
      const d = value.$d;
      return isNaN(d?.getTime?.()) ? null : d;
    }
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === "number") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === "string") {
      const d1 = new Date(value);
      if (!isNaN(d1.getTime())) return d1;
      const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
      if (m) {
        let [, DD, MM, YYYY, hh = "00", mm = "00"] = m;
        let y = parseInt(YYYY, 10);
        if (y > 2400) y -= 543; // พ.ศ. → ค.ศ.
        const d2 = new Date(y, parseInt(MM,10)-1, parseInt(DD,10), parseInt(hh,10), parseInt(mm,10), 0);
        return isNaN(d2.getTime()) ? null : d2;
      }
    }
    const fallback = new Date(value);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const formatDateForAPI = (value) => {
    const d = normalizeDate(value);
    if (!d) return null;
    const pad = (n) => String(n).padStart(2, "0");
    const Y = d.getFullYear();
    const M = pad(d.getMonth() + 1);
    const D = pad(d.getDate());
    const h = pad(d.getHours());
    const m = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    return `${Y}-${M}-${D}T${h}:${m}:${s}`;
  };

  // ฟังก์ชันสำหรับจัดการข้อมูล Tab3-1
  const handleTab31Submit = useCallback(async (complaint_id, tab31Data) => {
    try {
      console.log('=== handleTab31Submit CALLED ===');
      console.log('complaint_id:', complaint_id);
      console.log('tab31Data:', tab31Data);
      
      // Debug: ตรวจสอบวันที่ก่อน format
      console.log('Raw dates before formatting:');
      console.log('officerReceivedDate:', tab31Data.officerReceivedDate);
      console.log('directorSubmittedDate:', tab31Data.directorSubmittedDate);
      console.log('incidentDateTime:', tab31Data.incidentDateTime);
      
      showLoading("กำลังอัพเดทข้อมูลเพิ่มเติม...");

      // Format วันที่ก่อน
      const formattedOfficerDate = formatDateForAPI(tab31Data.officerReceivedDate);
      const formattedDirectorDate = formatDateForAPI(tab31Data.directorSubmittedDate);
      const formattedIncidentDate = formatDateForAPI(tab31Data.incidentDateTime);
      
      const payload = {
        // ข้อมูลประเภทและช่องทาง
        complaint_type_id: tab31Data.complaintTypeId || null,
        complaint_subtype_id: tab31Data.complaintSubType || null,
        complaint_channel_id: tab31Data.complaintChannel || null,
        
        // ข้อมูลหลัก
        subject: tab31Data.subject || "",
        
        // Reference numbers และวันที่
        reference_number1: tab31Data.referenceNumber1 || "",
        reference_date1: formatDateForAPI(tab31Data.referenceDate1),
        reference_number2: tab31Data.referenceNumber2 || "",
        reference_date2: formatDateForAPI(tab31Data.referenceDate2),
        reference_number3: tab31Data.referenceNumber3 || "",
        reference_date3: formatDateForAPI(tab31Data.referenceDate3),
        reference_number4: tab31Data.referenceNumber4 || "",
        reference_date4: formatDateForAPI(tab31Data.referenceDate4),
        
        // เอกสาร
        document_number: tab31Data.documentNumber || "",
        document_date: formatDateForAPI(tab31Data.documentDate),
        
        // ความลับและความเร่งด่วน
        confidentiality_level: tab31Data.securityLevel || "normal",
        urgency_level: tab31Data.urgencyLevel || "low",
        
        // หน่วยงานที่ส่งเรื่อง
        agency_sender: tab31Data.senderAgency || "",
        
        // ประเภทการรับเรื่อง
        complaint_filing_type: tab31Data.complaint_filing_type || "new",
        new_complaint: (tab31Data.complaint_filing_type || "new") === "new",
        add_more_complaint_to_ref: (tab31Data.complaint_filing_type || "new") === "additional",
        group_work: (tab31Data.complaint_filing_type || "new") === "committee",
        
        // อ้างอิงเพิ่มเติม (สำหรับเรื่องเพิ่มเติมและคณะทำงาน)
        additional_reference_number1: tab31Data.additionalReference1 || "",
        additional_reference_date1: formatDateForAPI(tab31Data.additionalReferenceDate1),
        additional_reference_number2: tab31Data.additionalReference2 || "",
        additional_reference_date2: formatDateForAPI(tab31Data.additionalReferenceDate2),
        
        registration_date: formattedOfficerDate,
        director_submission_date: formattedDirectorDate,
        incident_datetime: formattedIncidentDate,
      };

      // ลบค่า undefined และ null สำหรับวันที่ที่ไม่ได้กรอก
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined || payload[k] === null) delete payload[k];
      });

      console.log('=== PAYLOAD FOR UpdateAssignmentCompleteByAdmin ===');
      console.log('payload:', JSON.stringify(payload, null, 2));

      const res = await UpdateAssignmentCompleteByAdmin(complaint_id, payload);
      
      console.log('=== UpdateAssignmentCompleteByAdmin RESPONSE ===');
      console.log('res:', res);
      
      if (!["0000", "0002"].includes(res?.res_code)) {
        const backendErr = res?.res_data?.error || res?.res_desc || res?.res_message || "ไม่สามารถอัพเดทข้อมูลได้";
        console.error('UpdateAssignmentCompleteByAdmin failed:', backendErr);
        throw new Error(backendErr);
      }

      console.log("Tab3-1 data updated successfully");
      
    } catch (error) {
      console.error("Tab3-1 update error:", error);
      throw error;
    }
  }, []);

  const handleSubmitForm = useCallback(async () => {
  const { step1, step2, step3, step4, step31 } = formData;

  console.log('=== ALL FORM DATA ===');
  console.log('formData:', formData);
  console.log('step31:', step31);

  const isConfirmed = await showConfirm(
    "แจ้งเรื่องร้องทุกข์",
    `
      <div style="text-align: center; line-height: 1.8;">
        ข้อเท็จจริงที่ได้ยื่นเรื่องราวร้องทุกข์ต่อกระทรวงการคลังต้องเป็นเรื่องที่เกิดขึ้นจริงทั้งหมด<br />
        โดยผู้ร้องต้องรับผิดชอบต่อข้อเท็จจริงดังกล่าวข้างต้นทุกประการผู้ใดนำความเท็จมาร้องเรียน<br />
        ซึ่งทำให้ผู้อื่นได้รับความเสียหายผู้นั้นอาจต้องรับผิดตามประมวลกฎหมายอาญา<br />
        <strong style="color:#0B73E5;">ยืนยันการแจ้งเรื่องร้องทุกข์หรือไม่?</strong>
      </div>
    `,
    "ยืนยัน",
    "ยกเลิก",
    800
  );
  if (!isConfirmed) return;

  try {
    showLoading("กำลังส่งข้อมูล...");

    // รวมไฟล์จาก step3 และ step31 (ถ้ามี)
    const step3Attachments = step3?.general?.attachment || [];
    const step31Attachments = step31?.general?.attachment || [];
    const originalAttachments = [...step3Attachments, ...step31Attachments].filter(file => file instanceof File || (file && typeof file === "object" && file.name));

    // เตรียมข้อมูล step3 สำหรับการสร้างเรื่องร้องเรียน
    // ถ้ามีข้อมูลจาก Tab3-1 ให้ใช้ค่าจาก Tab3-1 แทน
    let step3Data = {
      complaintType: step3?.general?.complaintType || "",
      attachment: [],
    };

    // ตัวแปรเก็บข้อมูลวันที่เพิ่มเติม
    let additionalDateFields = {};

    // ถ้ามีข้อมูลจาก Tab3-1 ให้ override ข้อมูล step3
    if (step31?.general && Object.keys(step31.general).length > 0) {
      // ใช้ subject จาก Tab3-1 ถ้ามี ไม่งั้นใช้จาก step3
      step3Data.subject = step31.general.subject || step3?.general?.subject || "";
      
      // ใช้ description จาก Tab3-1 ถ้ามี ไม่งั้นใช้จาก step3
      step3Data.description = step31.general.description || step3?.general?.description || "";
      step3Data.complaintChannel = step31.general.complaintChannel || step3?.general?.complaintChannel || "";
      if (step31.general.complaintChannelName) {
        step3Data.complaintChannelName = step31.general.complaintChannelName;
      } else if (step3?.general?.complaintChannelName) {
        step3Data.complaintChannelName = step3.general.complaintChannelName;
      }
      
      // ใช้ incidentDate จาก Tab3-1 (incidentDateTime) ถ้ามี ไม่งั้นใช้จาก step3
      if (step31.general.incidentDateTime) {
        const formattedIncidentDate = formatDateForAPI(step31.general.incidentDateTime);
        step3Data.incidentDate = formattedIncidentDate;
        // เพิ่ม field เพิ่มเติมเผื่อ backend ต้องการ
        additionalDateFields.incidentDate = formattedIncidentDate; // เพิ่มตรงนี้ (i ใหญ่)
        step3Data.incident_datetime = formattedIncidentDate;
        step3Data.incident_date = formattedIncidentDate;
      } else {
        step3Data.incidentDate = step3?.general?.incidentDate || "";
      }
      
      // เตรียมข้อมูลวันที่เพิ่มเติมสำหรับเก็บไว้ใน step3 (ลองส่งไปด้วยเผื่อ backend รับ)
      const offD = formatDateForAPI(step31.general.officerReceivedDate);
      const dirD = formatDateForAPI(step31.general.directorSubmittedDate);
      const incD = formatDateForAPI(step31.general.incidentDateTime);
      if (offD) additionalDateFields.registration_date = offD;
      if (dirD) additionalDateFields.director_submission_date = dirD;
      if (incD) additionalDateFields.incidentDate = incD; // ชื่อเดิมคุณใช้ i ใหญ่
      step3Data = {
        ...step3Data,
        ...additionalDateFields
      };
      
      console.log('=== DATES IN STEP3 DATA ===');
      console.log('incidentDate:', step3Data.incidentDate);
      console.log('registration_date:', additionalDateFields.registration_date);
      console.log('director_submission_date:', additionalDateFields.director_submission_date);
      
    } else {
      // ไม่มีข้อมูล Tab3-1 ใช้ข้อมูลจาก step3 ตามปกติ
      step3Data.subject = step3?.general?.subject || "";
      step3Data.description = step3?.general?.description || "";
      step3Data.incidentDate = step3?.general?.incidentDate || "";
      step3Data.complaintChannel = step3?.general?.complaintChannel || "";
      step3Data.complaintChannelName = step3?.general?.complaintChannelName || "";
    }

    if (!step3Data.complaintChannel) {
      step3Data.complaintChannel = WEBSITE_CHANNEL_LABEL;
    }
    if (!step3Data.complaintChannelName) {
      step3Data.complaintChannelName = step3Data.complaintChannel;
    }

    // ตรวจสอบว่ามีข้อมูลส่วนไหนที่ถูกกรอก (ไม่ใช่แค่ auto-populate)
    const hasGeneralData = (data) => {
      if (!data || typeof data !== 'object') return false;
      // เช็คว่ามีฟิลด์สำคัญที่ไม่ใช่แค่ auto-populate
      const importantFields = ['address', 'province', 'districts', 'subdistricts', 'zipcode'];
      return importantFields.some(field => data[field] && data[field].trim && data[field].trim() !== '');
    };

    const hasCorporateData = (data) => {
      if (!data || typeof data !== 'object') return false;
      // นิติบุคคลต้องมีชื่อบริษัทหรือผู้มีอำนาจลงนาม
      return (data.companyName && data.companyName.trim && data.companyName.trim() !== '') ||
             (data.signatoryName && data.signatoryName.trim && data.signatoryName.trim() !== '');
    };

    const hasGovernmentData = (data) => {
      if (!data || typeof data !== 'object') return false;
      // หนังสือร้องเรียนถึง กค. ต้องมีชื่อหน่วยงานหรือชื่อผู้ติดต่อ
      return (data.agencyName && data.agencyName.trim && data.agencyName.trim() !== '') ||
             (data.fullName && data.fullName.trim && data.fullName.trim() !== '');
    };

    // กำหนด step1 ตามลำดับความสำคัญ
    let step1Structure = {
      general: {
        general: {},
        delegate: {},
      },
    };

    // ตรวจสอบข้อมูลแต่ละประเภทและเลือกที่ถูกต้อง
    const generalData = step1?.general?.general || {};
    const corporateData = step1?.general?.corporate || {};
    const governmentData = step1?.general?.government || {};
    const signerData = step1?.general?.signer || {};
    const delegateData = step1?.general?.delegate || {};

    // เลือกประเภทที่ถูกต้อง (ตามลำดับความสำคัญ)
    console.log('=== STEP1 DATA DETECTION ===');
    console.log('hasGovernmentData:', hasGovernmentData(governmentData));
    console.log('hasCorporateData:', hasCorporateData(corporateData));
    console.log('hasGeneralData:', hasGeneralData(generalData));
    console.log('governmentData:', governmentData);
    console.log('corporateData:', corporateData);
    console.log('generalData:', generalData);

    if (hasGovernmentData(governmentData)) {
      // หนังสือร้องเรียนถึง กค. (มีข้อมูลหน่วยงาน)
      console.log('✅ เลือก: หนังสือร้องเรียนถึง กค.');
      step1Structure.general = {
        government: governmentData,
      };
    } else if (hasCorporateData(corporateData)) {
      // นิติบุคคล (มีข้อมูลบริษัท)
      console.log('✅ เลือก: นิติบุคคล');
      step1Structure.general = {
        corporate: corporateData,
        signer: signerData,
      };
    } else if (hasGeneralData(generalData)) {
      // บุคคลทั่วไป (มีข้อมูลที่อยู่)
      console.log('✅ เลือก: บุคคลทั่วไป');
      step1Structure.general = {
        general: generalData,
        delegate: delegateData,
      };
    } else {
      // fallback: ใช้ข้อมูลที่มีอยู่ (กรณีที่ไม่มีข้อมูลเลย หรือมีแค่ auto-populate)
      console.log('⚠️ Fallback: ใช้บุคคลทั่วไป (ไม่มีข้อมูลเพียงพอ)');
      step1Structure.general = {
        general: generalData,
        delegate: delegateData,
      };
    }

    const restructuredBody = {
      step1: step1Structure,
      step2: {
        general: {
          ...(step2?.general?.individual && {
            individual: {
              idCard: step2.general.individual.idCard,
              name: step2.general.individual.name,
              address: step2.general.individual.address,
              phone: step2.general.individual.phone,
              province: step2.general.individual.province,
              districts: step2.general.individual.districts,
              subdistricts: step2.general.individual.subdistricts,
              zipcode: step2.general.individual.zipcode,
              email: step2.general.individual.email,
            },
          }),
          ...(step2?.general?.corporate && {
            corporate: {
              idCard: step2.general.corporate.idCard,
              companyName: step2.general.corporate.companyName,
              signatoryName: step2.general.corporate.signatoryName,
              address: step2.general.corporate.address,
              phone: step2.general.corporate.phone,
              province: step2.general.corporate.province,
              districts: step2.general.corporate.districts,
              subdistricts: step2.general.corporate.subdistricts,
              zipcode: step2.general.corporate.zipcode,
            },
          }),
          ...(step2?.general?.government && {
            government: {
              idCard: step2.general.government.idCard,
              agencyName: step2.general.government.agencyName,
              fullName: step2.general.government.fullName,
              address: step2.general.government.address,
              phone: step2.general.government.phone,
              province: step2.general.government.province,
              districts: step2.general.government.districts,
              subdistricts: step2.general.government.subdistricts,
              zipcode: step2.general.government.zipcode,
            },
          }),
          activeType: step2?.general?.activeType || "individual",
          email:
            step2?.general?.email ||
            step2?.general?.individual?.email ||
            step2?.general?.corporate?.email ||
            step2?.general?.government?.email ||
            "",
        },
      },
      step3: {
        general: step3Data,
      },
      step4: {
        general: {
          accepted: step4?.general?.accepted || false,
        },
      },
    };

    console.log('=== FINAL PAYLOAD FOR Addcomplaints ===');
    console.log('restructuredBody:', JSON.stringify(restructuredBody, null, 2));

    // STEP 1: สร้างเรื่องร้องทุกข์
    const res = await Addcomplaints(restructuredBody);
    const { res_code, res_message, res_data } = res;

    if (res_code === "0001") {
      const task_id = res_data?.task_id;

      if (!task_id) {
        throw new Error("ไม่ได้รับ task_id จาก API");
      }

      // STEP 2: รอให้ task เสร็จและได้ complaint_id
      const waitForTaskCompletion = async (taskId, maxWaitTime = 30000) => {
        const startTime = Date.now();
        const pollInterval = 2000;

        return new Promise(async (resolve, reject) => {
          const poll = async () => {
            try {
              const elapsed = Date.now() - startTime;

              if (elapsed > maxWaitTime) {
                reject(new Error("Timeout: Task completion took too long"));
                return;
              }

              const taskStatusRes = await GetComplaintTaskStatus(taskId);

              if (taskStatusRes?.res_code === "0000") {
                const statusData = taskStatusRes.res_data;

                if (statusData?.status === "completed" && statusData?.complaint_id) {
                  resolve(statusData.complaint_id);
                  return;
                } else if (statusData?.status === "failed") {
                  reject(new Error(`Task failed: ${statusData.message || "Unknown error"}`));
                  return;
                }
              }

              setTimeout(poll, pollInterval);
            } catch (error) {
              console.error("Task polling error", error);
              setTimeout(poll, pollInterval);
            }
          };

          poll();
        });
      };

      const complaint_id = await waitForTaskCompletion(task_id);
      
      console.log('=== COMPLAINT ID RECEIVED ===');
      console.log('complaint_id:', complaint_id);
      
      // STEP 3: อัพเดทข้อมูลเพิ่มเติมจาก Tab3-1 ผ่าน UpdateAssignmentCompleteByAdmin
      if (step31?.general && Object.keys(step31.general).length > 0) {
        console.log('=== CALLING handleTab31Submit for additional updates ===');
        try {
          await handleTab31Submit(complaint_id, step31.general);
        } catch (updateError) {
          console.error('Failed to update additional data:', updateError);
          // ไม่ throw error เพราะข้อมูลหลักถูกสร้างแล้ว
          // แต่แจ้งเตือนผู้ใช้
          console.warn('บางข้อมูลอาจไม่ถูกบันทึกครบถ้วน แต่เรื่องร้องเรียนถูกสร้างแล้ว');
        }
      }

      // STEP 4: อัปโหลดไฟล์ (ถ้ามี)
      if (originalAttachments.length > 0) {
        try {
          showLoading("กำลังอัปโหลดไฟล์...");

          const formDataUpload = new FormData();
          let validFileCount = 0;

          originalAttachments.forEach((file, index) => {
            if (file instanceof File || (file && typeof file === "object" && file.name)) {
              formDataUpload.append("file", file);
              validFileCount++;
            }
          });

          if (validFileCount > 0) {
            await UploadAttachments(complaint_id, formDataUpload);
          }
        } catch (uploadError) {
          console.error("File upload failed", uploadError);
        }
      }

      closeAlert();
      await alertSuccess("ส่งเรื่องสำเร็จ", "ระบบได้รับข้อมูลของคุณแล้ว");

      router.push(`/followup/${complaint_id}`);
      
    } else if (res_code === "5000" && res_data?.error) {
      closeAlert();
      alertError("ข้อมูลไม่ครบ", res_data.error);
    } else {
      closeAlert();
      alertError("เกิดข้อผิดพลาด", res_message || "ไม่สามารถส่งเรื่องได้");
    }
  } catch (error) {
    closeAlert();
    alertError("เกิดข้อผิดพลาด", error?.message || "ไม่สามารถส่งเรื่องได้");
    console.error("Submit Form Error", error);
  }
}, [formData, router, handleTab31Submit]);

  useEffect(() => {}, [formData]);

  return {
    formData,
    updateStepData,
    getStepTabData,
    getFormData,
    handleSubmitForm,
    handleTab31Submit,
  };
}
