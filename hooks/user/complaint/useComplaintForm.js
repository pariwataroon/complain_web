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
} from "@pages/api/complaint/complaint";

export default function useComplaintForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    step1: {},
    step2: {},
    step3: {},
    step4: {},
  });

  const updateStepData = useCallback((stepKey, tabKey, data) => {
    setFormData((prev) => {
      const currentTabState = prev[stepKey]?.[tabKey] || {};
      
      // Execute the update function if data is a function, otherwise use data directly
      const newData = typeof data === 'function' ? data(currentTabState) : data;

      // Prevent update if the data hasn't actually changed
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

  const handleSubmitForm = useCallback(async () => {
    const { step1, step2, step3, step4 } = formData;

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


      const res = await Addcomplaints(restructuredBody);
      const { res_code, res_message, res_data } = res;

      

      if (res_code === "0001") {
        const task_id = res_data?.task_id;

        if (!task_id) {
          throw new Error("ไม่ได้รับ task_id จาก API");
        }


        // **แก้ไข: ใช้ Promise-based polling แทน loop**
        const waitForTaskCompletion = async (taskId, maxWaitTime = 30000) => {
          const startTime = Date.now();
          const pollInterval = 2000; // เช็คทุก 2 วินาที

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

                 

                  if (
                    statusData?.status === "completed" &&
                    statusData?.complaint_id
                  ) {
                    resolve(statusData.complaint_id);
                    return;
                  } else if (statusData?.status === "failed") {
                    reject(
                      new Error(
                        `Task failed: ${statusData.message || "Unknown error"}`
                      )
                    );
                    return;
                  }
                  // ถ้ายัง queued หรือ processing ให้รอต่อ
                }

                // รอแล้วเช็คใหม่
                setTimeout(poll, pollInterval);
              } catch (error) {
                console.error("=== Task polling error ===", error);
                // รอแล้วลองใหม่
                setTimeout(poll, pollInterval);
              }
            };

            // เริ่ม polling
            poll();
          });
        };

        // **รอให้ task เสร็จ**
        const complaint_id = await waitForTaskCompletion(task_id);


        // **STEP 3: อัปโหลดไฟล์**
        if (originalAttachments.length > 0) {
          try {
            

            const formDataUpload = new FormData();
            let validFileCount = 0;

            originalAttachments.forEach((file, index) => {
              if (
                file instanceof File ||
                (file && typeof file === "object" && file.name)
              ) {
                formDataUpload.append("file", file);
                validFileCount++;
              } else {
                console.warn(`=== File ${index + 1} skipped ===`, file);
              }
            });

            if (validFileCount > 0) {
              // **เปลี่ยน loading message**
              showLoading("กำลังอัปโหลดไฟล์...");

              const uploadResult = await UploadAttachments(
                complaint_id,
                formDataUpload
              );
            }
          } catch (uploadError) {
            console.error("=== File upload failed ===", uploadError);
            // ไม่ให้ upload error หยุดกระบวนการ
          }
        }

        closeAlert();
        await alertSuccess("ส่งเรื่องสำเร็จ", "ระบบได้รับข้อมูลของคุณแล้ว");

        // **นำไปหน้า followup**
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
      console.error("=== Submit Form Error ===", error);
    }
  }, [formData, router]);

  useEffect(() => {}, [formData]);

  return {
    formData,
    updateStepData,
    getStepTabData,
    getFormData,
    handleSubmitForm,
  };
}
