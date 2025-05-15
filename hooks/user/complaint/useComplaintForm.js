import { useState } from "react";
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
} from "@pages/api/complaint/complaint";

export default function useComplaintForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    step1: {},
    step2: {},
    step3: {},
    step4: {},
  });


  const updateStepData = (stepKey, tabKey, data) => {
    setFormData((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [tabKey]: data,
      },
    }));
  };

  const getStepTabData = (stepKey, tabKey) => formData[stepKey]?.[tabKey] || {};
  const getFormData = () => formData;

  const handleSubmitForm = async () => {
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

      const res = await Addcomplaints(formData);
      const { res_code, res_message, res_data } = res;

      if (res_code === "0001") {
        const complaint_id = res_data?.complaint_id;
        const attachments = formData.step3?.general?.attachment || [];

        if (complaint_id && attachments.length > 0) {
          const formDataUpload = new FormData();
          attachments.forEach((file) => {
            formDataUpload.append("file", file);
          });

          await UploadAttachments(complaint_id, formDataUpload);
        }

        closeAlert();
        await alertSuccess("ส่งเรื่องสำเร็จ", "ระบบได้รับข้อมูลของคุณแล้ว");
        router.push("/");
      } else if (res_code === "5000" && res_data?.error) {
        closeAlert();
        alertError("ข้อมูลไม่ครบ", res_data.error);
      } else {
        closeAlert();
        alertError("เกิดข้อผิดพลาด", res_message || "ไม่สามารถส่งเรื่องได้");
      }
    } catch (error) {
      closeAlert();
      alertError(
        "เกิดข้อผิดพลาด",
        error?.response?.data?.message || "ไม่สามารถส่งเรื่องได้"
      );
      console.error("ส่งข้อมูลไม่สำเร็จ:", error);
    }
  };
  


  return {
    formData,
    updateStepData,
    getStepTabData,
    getFormData,
    handleSubmitForm,
  };
}
