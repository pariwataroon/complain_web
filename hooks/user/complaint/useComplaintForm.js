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

  // ฟังก์ชันสำหรับจัดการข้อมูล Tab3-1
  const handleTab31Submit = useCallback(async (complaint_id, tab31Data) => {
    try {
      console.log('=== handleTab31Submit CALLED ===');
      console.log('complaint_id:', complaint_id);
      console.log('tab31Data:', tab31Data);
      
      showLoading("กำลังอัพเดทข้อมูลเพิ่มเติม...");

     const normalizeDate = (value) => {
       if (!value) return null;
       if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
       if (typeof value === "string") {
         // ISO/สากล
         const d1 = new Date(value);
         if (!isNaN(d1.getTime())) return d1;
         const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
         if (m) {
            let [, DD, MM, YYYY, hh = "00", mm = "00"] = m;
            let y = parseInt(YYYY, 10);
            if (y > 2400) y -= 543;
            const d2 = new Date(y, parseInt(MM,10)-1, parseInt(DD,10), parseInt(hh,10), parseInt(mm,10), 0);
            return isNaN(d2.getTime()) ? null : d2;
          }
        }
        return null;
      };

      const formatDateForAPI = (value) => {
        const d = normalizeDate(value);
        if (!d) return null;
        const pad = (n) => String(n).padStart(2, "0");
        const Y = d.getFullYear();
        const M = pad(d.getMonth(),  1);
        const D = pad(d.getDate());
        const h = pad(d.getHours());
        const m = pad(d.getMinutes());
        const s = pad(d.getSeconds());
        return `${Y}-${M}-${D}T${h}:${m}:${s}`;
      };

      const payload = {
        complaint_type_id: tab31Data.complaintTypeId || null,
        complaint_subtype_id: tab31Data.complaintSubType || "",
        complaint_channel_id: tab31Data.complaintChannel || null,
        subject: tab31Data.subject || "",
        confidentiality_level: tab31Data.securityLevel || "normal",
        urgency_level: tab31Data.urgencyLevel || "low",
        agency_sender: tab31Data.senderAgency || "",
        reference_number1: tab31Data.referenceNumber1 || "",
        reference_date1: formatDateForAPI(tab31Data.referenceDate1),
        reference_number2: tab31Data.referenceNumber2 || "",
        reference_date2: formatDateForAPI(tab31Data.referenceDate2),
        reference_number3: tab31Data.referenceNumber3 || "",
        reference_date3: formatDateForAPI(tab31Data.referenceDate3),
        reference_number4: tab31Data.referenceNumber4 || "",
        reference_date4: formatDateForAPI(tab31Data.referenceDate4),
        document_number: tab31Data.documentNumber || "",
        document_date: formatDateForAPI(tab31Data.documentDate),
        additional_reference_number1: tab31Data.additionalReference1 || "",
        additional_reference_date1: formatDateForAPI(tab31Data.additionalReferenceDate1),
        additional_reference_number2: tab31Data.additionalReference2 || "",
        additional_reference_date2: formatDateForAPI(tab31Data.additionalReferenceDate2),
        complaint_filing_type: tab31Data.complaint_filing_type || "new",
        new_complaint: (tab31Data.complaint_filing_type || "new") === "new",
        add_more_complaint_to_ref: (tab31Data.complaint_filing_type || "new") === "additional",
        group_work: (tab31Data.complaint_filing_type || "new") === "committee",
        confirm_assigned_date: formatDateForAPI(tab31Data.officerReceivedDate),
       director_submission_date: formatDateForAPI(tab31Data.directorSubmittedDate),
       incident_datetime: formatDateForAPI(tab31Data.incidentDateTime),
       incidentDate: formatDateForAPI(tab31Data.incidentDateTime),
       assigned_remark: tab31Data.description || "",
       description: tab31Data.description || "",
      };

      // ลบค่า undefined ออก
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      console.log('=== PAYLOAD FOR UpdateAssignmentCompleteByAdmin ===');
      console.log('payload:', payload);

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
      throw error; // ส่งต่อ error เพื่อให้ handleSubmitForm จัดการ
    }
  }, []);

  const handleSubmitForm = useCallback(async () => {
    const { step1, step2, step3, step4, step31 } = formData;

    console.log('=== ALL FORM DATA ===');
    console.log('formData:', formData);
    console.log('step31:', step31);
    console.log('step31?.general:', step31?.general);
    console.log('step31.general keys:', Object.keys(step31?.general || {}));

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

      const originalAttachments = step3?.general?.attachment || [];

      const restructuredBody = {
        step1: {
          general: {
            general: step1?.general?.general || step1?.general || {},
            delegate: step1?.general?.delegate || {},
          },
        },
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
          general: {
            complaintType: step3?.general?.complaintType || "",
            subject: step3?.general?.subject || "",
            incidentDate: step3?.general?.incidentDate || "",
            description: step3?.general?.description || "",
            attachment: [],
          },
        },
        step4: {
          general: {
            accepted: step4?.general?.accepted || false,
          },
        },
      };

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
        
        // STEP 3: อัพเดทข้อมูล Tab3-1 (ถ้ามี)
        console.log('=== CHECKING STEP31 CONDITION ===');
        console.log('step31?.general:', step31?.general);
        console.log('Object.keys(step31?.general || {}).length:', Object.keys(step31?.general || {}).length);
        
        if (step31?.general && Object.keys(step31.general).length > 0) {
          console.log('=== CALLING handleTab31Submit ===');
          await handleTab31Submit(complaint_id, step31.general);
        } else {
          console.log('=== SKIP Tab3-1 UPDATE: no data saved ===');
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
    handleTab31Submit, // เผยแพร่ฟังก์ชันนี้ด้วยเผื่อต้องใช้แยก
  };
}