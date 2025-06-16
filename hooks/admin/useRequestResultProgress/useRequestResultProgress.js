import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";

export const useRequestResultProgress = () => {
  const router = useRouter();
  const { id } = router.query;

  // Form state
  const [form, setForm] = useState({
    salutation: "",
    refNo: "",
    date: null,
    subject: "",
    department: "",
    signer: "",
    confidentiality: "",
    urgency: "",
    attachment: "",
    note: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ฟิลด์ที่จำเป็นต้องกรอก
  const requiredFields = [
    "salutation",
    "refNo",
    "date",
    "subject",
    "department",
    "signer",
    "confidentiality",
    "urgency",
    "attachment",
  ];

  // ฟังก์ชันตรวจสอบว่าฟิลด์จำเป็นหรือไม่
  const isRequired = useCallback(
    (fieldName) => {
      return requiredFields.includes(fieldName);
    },
    [requiredFields]
  );

  // ฟังก์ชันสร้าง label พร้อม * สีแดง
  const createLabel = useCallback(
    (text, fieldName) => {
     

      return (
        <span>
          {text}
          {isRequired(fieldName) && (
            <span style={{ color: "red", marginLeft: 4 }}>*</span>
          )}
        </span>
      );
    },
    [isRequired]
  );

  // ฟังก์ชันรับ error ของฟิลด์
  const getFieldError = useCallback(
    (fieldName) => {
      return errors[fieldName] || null;
    },
    [errors]
  );

  // Handler สำหรับการเปลี่ยนแปลงฟิลด์ทั่วไป
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const finalValue =
        typeof value === "object" && value !== null ? value.value || "" : value;

     

      setForm((prev) => ({ ...prev, [name]: finalValue }));

      // ล้าง error ของฟิลด์ที่กำลังแก้ไข
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    },
    [errors]
  );

  // Handler สำหรับ DateThaiPickerService
  const handleDateChange = useCallback(
    (thaiDate) => {
      

      setForm((prev) => ({ ...prev, date: thaiDate }));

      // ล้าง error ของวันที่
      if (errors.date) {
        setErrors((prev) => ({ ...prev, date: null }));
      }
    },
    [errors.date]
  );

  // Handler สำหรับ file upload (InputFile component)
  const handleFileUpload = useCallback(
    (files) => {
      

      if (files && files.length > 0) {
        const fileNames = files.map((file) => file.name).join(", ");
        setForm((prev) => ({
          ...prev,
          attachment: fileNames,
        }));

        // ล้าง error ของไฟล์
        if (errors.attachment) {
          setErrors((prev) => ({ ...prev, attachment: null }));
        }
      }
    },
    [errors.attachment]
  );

  // Handler สำหรับ legacy file change (รองรับ input file ธรรมดา)
  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];


      if (file) {
        setForm((prev) => ({
          ...prev,
          attachment: file.name,
        }));

        // ล้าง error ของไฟล์
        if (errors.attachment) {
          setErrors((prev) => ({ ...prev, attachment: null }));
        }
      }
    },
    [errors.attachment]
  );

  // ฟังก์ชันล้างฟอร์ม
  const handleClear = useCallback(() => {
    

    setForm({
      salutation: "",
      refNo: "",
      date: null,
      subject: "",
      department: "",
      signer: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
    });
    setErrors({});
  }, []);

  // ฟังก์ชันตรวจสอบข้อมูลที่จำเป็น
  const validateRequiredFields = useCallback(() => {
    const fieldsConfig = [
      { field: "salutation", label: "เรียน" },
      { field: "refNo", label: "เลขที่หนังสือ" },
      { field: "date", label: "วันที่" },
      { field: "subject", label: "เรื่อง" },
      { field: "department", label: "หน่วยงาน / ผู้ร้อง" },
      { field: "signer", label: "ผู้ลงนาม" },
      { field: "confidentiality", label: "ชั้นความลับ" },
      { field: "urgency", label: "ชั้นความเร่งด่วน" },
      { field: "attachment", label: "เอกสารแนบ" },
    ];

    const newErrors = {};
    const missingFields = [];

    fieldsConfig.forEach(({ field, label }) => {
      const value = form[field];
      if (!value || value === "" || value === null) {
        newErrors[field] = `กรุณากรอก${label}`;
        missingFields.push({ field, label });
      }
    });

    setErrors(newErrors);
    return missingFields;
  }, [form]);

  // ฟังก์ชันบันทึกข้อมูล
  const handleSave = useCallback(async () => {

    const missingFields = validateRequiredFields();

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields
        .map(({ label }) => label)
        .join(", ");

     

      alertError(
        "ข้อมูลไม่ครบถ้วน",
        `กรุณากรอกข้อมูลในฟิลด์: ${missingFieldNames}`
      );
      return;
    }

    try {
      setIsLoading(true);
      showLoading("กำลังบันทึกข้อมูล...");

     

      // TODO: Replace with actual API call
      // const response = await saveRequestResultProgressAPI(form);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      closeAlert();
      setIsLoading(false);

      

      await alertSuccess(
        "บันทึกสำเร็จ",
        "บันทึกแบบรายงานขอทราบผลการพิจารณา / ผลความคืบหน้าเรียบร้อยแล้ว"
      );

      // TODO: Navigate to success page or refresh data
      // router.push('/admin/requests/success');
      // or
      // router.reload();
    } catch (error) {
      closeAlert();
      setIsLoading(false);

      console.error("❌ Save error:", {
        user: "vampirebeam",
        timestamp: "2025-06-16 15:05:43",
        error: error.message,
        stack: error.stack,
      });

      alertError(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  }, [form, validateRequiredFields, router]);

  // ฟังก์ชันสำหรับรีเซ็ตข้อมูลเฉพาะฟิลด์
  const resetField = useCallback((fieldName) => {
   

    setForm((prev) => ({ ...prev, [fieldName]: "" }));
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
  }, []);

  // ฟังก์ชันสำหรับอัพเดทฟิลด์เฉพาะ
  const updateField = useCallback(
    (fieldName, value) => {
      setForm((prev) => ({ ...prev, [fieldName]: value }));

      // ล้าง error ของฟิลด์ที่อัพเดท
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
    },
    [errors]
  );

  // ฟังก์ชันตรวจสอบว่าฟอร์มมีการเปลี่ยนแปลงหรือไม่
  const hasFormChanges = useCallback(() => {
    const initialForm = {
      salutation: "",
      refNo: "",
      date: null,
      subject: "",
      department: "",
      signer: "",
      confidentiality: "",
      urgency: "",
      attachment: "",
      note: "",
    };

    return Object.keys(initialForm).some(
      (key) => form[key] !== initialForm[key]
    );
  }, [form]);

  // ฟังก์ชันตรวจสอบว่าฟอร์มพร้อมส่งหรือไม่
  const isFormValid = useCallback(() => {
    return requiredFields.every((field) => {
      const value = form[field];
      return value && value !== "" && value !== null;
    });
  }, [form, requiredFields]);

  return {
    // State
    form,
    errors,
    isLoading,
    id,

    // Validation helpers
    isRequired,
    createLabel,
    getFieldError,
    isFormValid,
    hasFormChanges,

    // Form handlers
    handleChange,
    handleDateChange,
    handleFileUpload,
    handleFileChange,
    handleClear,
    handleSave,

    // Utility functions
    validateRequiredFields,
    resetField,
    updateField,
  };
};

export default useRequestResultProgress;
