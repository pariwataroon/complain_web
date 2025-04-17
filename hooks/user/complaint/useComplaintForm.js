import { useState } from "react";
import axios from "axios";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";

export default function useComplaintForm() {
  const [formData, setFormData] = useState({
    step1: { tab: "general", general: {}, individual: {} },
    step2: { tab: "individual", individual: {}, corporate: {}, government: {} },
    step3: {},
    step4: {},
  });


  const updateStepData = (stepKey, tabKey, data) => {
    setFormData((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [tabKey]: data,
        tab: tabKey,
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

    try {
      showLoading("กำลังส่งข้อมูล...");
      const res = await axios.post("/complaints", payload);
      closeAlert();
      alertSuccess("ส่งเรื่องสำเร็จ", "ระบบได้รับข้อมูลของคุณแล้ว");
      console.log("✅ ส่งข้อมูลสำเร็จ:", res.data);
    } catch (error) {
      closeAlert();
      alertError(
        "เกิดข้อผิดพลาด",
        error?.response?.data?.message || "ไม่สามารถส่งเรื่องได้"
      );
      console.error("❌ ส่งข้อมูลไม่สำเร็จ:", error);
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
