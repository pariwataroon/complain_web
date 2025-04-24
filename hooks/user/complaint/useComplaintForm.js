import { useState } from "react";
import axios from "axios";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
  showConfirm,
} from "@utils/Alerts";

export default function useComplaintForm() {
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
    const complainant = step1?.[step1.tab] || {};
    const respondent = step2?.[step2.tab] || {};
    const details = step3 || {};
    const confirmation = step4 || {};

    const payload = {
      complainant,
      respondent,
      details,
      confirmation,
    };

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
      const res = await axios.post("/complaints", payload);
      closeAlert();
      alertSuccess("ส่งเรื่องสำเร็จ", "ระบบได้รับข้อมูลของคุณแล้ว");
      console.log("ส่งข้อมูลสำเร็จ:", res.data);
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
