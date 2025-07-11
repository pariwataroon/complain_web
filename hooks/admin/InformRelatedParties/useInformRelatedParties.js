import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";

export const useInformRelatedParties = () => {
  const router = useRouter();
  const { id } = router.query;

  // Initial form state
  const initialFormState = useMemo(
    () => ({
      refNo: "",
      date: null,
      subject: "",
      signer: "",
      department: "",
      confidentiality: null,
      urgency: null,
      proposeFor: "",
      decision: "",
      attachment: "",
      details: "",
    }),
    []
  );

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ฟิลด์ที่จำเป็นต้องกรอก
  const requiredFields = [
    "refNo",
    "date",
    "subject",
    "signer",
    "department",
    "confidentiality",
    "urgency",
    "proposeFor",
    "decision",
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
        typeof value === "object" && value !== null ? value.value : value;

      console.log("🔥 handleChange:", name, "=", finalValue); // << ตรวจตรงนี้

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
  

    setForm(initialFormState);
    setErrors({});
  }, [initialFormState]);

  // ฟังก์ชันตรวจสอบข้อมูลที่จำเป็น
  const validateRequiredFields = useCallback(() => {
    const fieldsConfig = [
      { field: "refNo", label: "เลขที่ สป.กค." },
      { field: "date", label: "วันที่" },
      { field: "subject", label: "เรื่อง" },
      { field: "signer", label: "ผู้ลงนาม" },
      { field: "department", label: "หน่วยงาน / ผู้ร้อง / อื่นๆ" },
      { field: "confidentiality", label: "ชั้นความลับ" },
      { field: "urgency", label: "ชั้นความเร่งด่วน" },
      { field: "proposeFor", label: "เสนอเพื่อ" },
      { field: "decision", label: "ผลการพิจารณา" },
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
      // const response = await saveInformRelatedPartiesAPI(form);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      closeAlert();
      setIsLoading(false);

     

      await alertSuccess(
        "บันทึกสำเร็จ",
        "บันทึกแบบรายงานแจ้งผลการให้ผู้เกี่ยวข้องทราบเรียบร้อยแล้ว"
      );

      // TODO: Navigate to success page or refresh data
      // router.push('/admin/inform-parties/success');
      // or
      // router.reload();
    } catch (error) {
      closeAlert();
      setIsLoading(false);


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
    return Object.keys(initialFormState).some(
      (key) => form[key] !== initialFormState[key]
    );
  }, [form, initialFormState]);

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

export default useInformRelatedParties;
