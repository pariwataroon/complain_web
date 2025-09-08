import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";
import {
  CreateOutgoingReport4,
  UploadOutgoingReportAttachments,
} from "@pages/api/outgoinreports/outgoinreports";
import axiosInstance from "@pages/api/axiosInstance";

const POSITION_FALLBACK = "7e18e4fe-d416-4580-b4d4-2a4032f67770";

const isUUID = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Helper function to convert Thai date to YMD format
const toYMD = (thaiDate) => {
  if (!thaiDate) return null;

  // If it's already in YYYY-MM-DD format, return as is
  if (typeof thaiDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(thaiDate)) {
    return thaiDate;
  }

  // If it's a Date object, convert to YYYY-MM-DD
  if (thaiDate instanceof Date) {
    return thaiDate.toISOString().split('T')[0];
  }

  // Handle Thai date format conversion logic here
  // This is a placeholder - implement based on your DateThaiPickerService format
  return thaiDate;
};

export const useInformRelatedParties = () => {
  const router = useRouter();
  const { id, complaint_id, complaint_number } = router.query;
  const complaintId =
    (Array.isArray(id) ? id[0] : id) ||
    (Array.isArray(complaint_id) ? complaint_id[0] : complaint_id) ||
    null;
  const complaintNumberFromQuery = Array.isArray(complaint_number)
    ? complaint_number[0]
    : complaint_number || "";

  // Initial form state
  const initialFormState = useMemo(
    () => ({
      salutation: "", // position_id
      refNo: complaintNumberFromQuery || "", // reference_number
      date: null, // reference_date (will be converted with toYMD)
      subject: "", // subject
      bookNo: "", // complaint_number และ document_number (ใช้ค่าเดียวกัน)
      date2: null, // complaint_number_date และ document_date (ใช้ค่าเดียวกัน)
      signer: "", // signature_authority_user_id
      department: "", // department_id
      confidentiality: null, // confidentiality_level
      urgency: null, // urgency_level
      proposeFor: "",
      decision: "",
      attachment: "",
      details: "", // remarks
      note: "", // remarks (alias for details)
    }),
    []
  );

  useEffect(() => {
    if (complaintNumberFromQuery && !form.refNo) {
      setForm(prev => ({ ...prev, refNo: complaintNumberFromQuery }));
    }
  }, [complaintNumberFromQuery]);

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // เพิ่ม state สำหรับเก็บไฟล์จริง
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);

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
    (nameOrEvent, value, options = {}) => {
      let name, finalValue;

      // Handle different input formats
      if (typeof nameOrEvent === 'string') {
        // Direct call: handleChange("refNo", "value")
        name = nameOrEvent;
        finalValue = typeof value === "object" && value !== null && value.value !== undefined ? value.value : value;
      } else if (nameOrEvent && nameOrEvent.target) {
        // Event object: handleChange(event)
        const { name: eventName, value: eventValue } = nameOrEvent.target;
        name = eventName;
        finalValue = typeof eventValue === "object" && eventValue !== null && eventValue.value !== undefined ? eventValue.value : eventValue;
      } else {
        console.error("Invalid handleChange arguments:", nameOrEvent, value);
        return;
      }

      console.log("🔥 handleChange:", name, "=", finalValue);

      setForm((prev) => ({
        ...prev,
        [name]: finalValue,
        // Sync details and note fields
        ...(name === 'details' && { note: finalValue }),
        ...(name === 'note' && { details: finalValue }),
      }));

      // ล้าง error ของฟิลด์ที่กำลังแก้ไข
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    },
    [errors]
  );

  // Handler สำหรับ DateThaiPickerService
  const handleDateChange = useCallback(
    (thaiDate, fieldName = 'date') => {
      console.log("📅 handleDateChange:", fieldName, "=", thaiDate);

      setForm((prev) => ({ ...prev, [fieldName]: thaiDate }));

      // ล้าง error ของวันที่
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }
    },
    [errors]
  );

  // Handler สำหรับ file upload (รองรับ InputFile: File | File[] | null)
  const handleFileUpload = useCallback(
    (input) => {
      console.log("📎 handleFileUpload:", input);

      if (!input) {
        setUploadedFiles([]);
        setForm((prev) => ({ ...prev, attachment: "" }));
        setFileInputKey((k) => k + 1);
        return;
      }

      let files = [];
      if (input instanceof File) {
        files = [input];
      } else if (Array.isArray(input) && input.length > 0 && input[0] instanceof File) {
        files = input;
      } else {
        // Unknown input, ignore
        return;
      }

      setUploadedFiles(files);
      const fileNames = files.map((f) => f.name).join(", ");
      setForm((prev) => ({ ...prev, attachment: fileNames }));
      if (errors.attachment) {
        setErrors((prev) => ({ ...prev, attachment: null }));
      }
    },
    [errors.attachment]
  );

  // Handler สำหรับ legacy file change (รองรับ input file ธรรมดา)
  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      console.log("📁 handleFileChange:", file?.name);

      if (file) {
        // เก็บไฟล์จริง
        setUploadedFiles([file]);

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

  // ฟังก์ชันล้างฟอร์ม - แก้ไขให้ล้างไฟล์ด้วย
  const handleClear = useCallback(() => {
    console.log("🧹 handleClear: Clearing form");
    setForm(initialFormState);
    setErrors({});
    setUploadedFiles([]); // ล้างไฟล์ที่อัปโหลด
    setFileInputKey((k) => k + 1);
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

    console.log("🔍 validateRequiredFields:", { missingFields, newErrors });
    setErrors(newErrors);
    return missingFields;
  }, [form]);

  // ฟังก์ชันอัปโหลดไฟล์ - Multi-strategy fallback
  const uploadFiles = useCallback(async (reportId) => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.log("ℹ️ No files to upload");
      return [];
    }

    console.log("📤 Uploading files:", uploadedFiles.map(f => f.name));

    const buildFormData = (useSingleKey = false) => {
      const formData = new FormData();
      uploadedFiles.forEach((f) => formData.append(useSingleKey ? 'file' : 'files', f, f.name));
      return formData;
    };

    let uploadOk = false;
    let lastErrorMsg = '';

    // Attempt 1: /outgoing-reports4/{id}/attachments (specific for CreateOutgoingReport4)
    try {
      const up1 = await axiosInstance.post(`/outgoing-reports4/${reportId}/attachments`, buildFormData(false));
      uploadOk = !!up1?.data;
      console.log("✅ Upload attempt #1 (type4) succeeded");
    } catch (err1) {
      const data = err1?.response?.data;
      lastErrorMsg = data?.res_data?.error || data?.res_message || err1.message || '';
      console.error('Upload attempt #1 (type4) failed', data || err1);
    }

    // Attempt 2: generic endpoint /outgoing-reports/{id}/attachments
    if (!uploadOk) {
      try {
        const up2 = await UploadOutgoingReportAttachments(buildFormData(false), reportId);
        uploadOk = !!(up2 && (up2.success === true || up2.res_code === '0001'));
        if (uploadOk) {
          console.log("✅ Upload attempt #2 (generic) succeeded");
        } else {
          lastErrorMsg = up2?.res_data?.error || up2?.res_message || up2?.message || lastErrorMsg;
        }
      } catch (err2) {
        const data = err2?.response?.data;
        lastErrorMsg = data?.res_data?.error || data?.res_message || err2.message || lastErrorMsg;
        console.error('Upload attempt #2 (generic) failed', data || err2);
      }
    }

    // Attempt 3: single file key (if only one file)
    if (!uploadOk && uploadedFiles.length === 1) {
      try {
        const up3 = await axiosInstance.post(`/outgoing-reports4/${reportId}/attachments`, buildFormData(true));
        uploadOk = !!up3?.data;
        if (uploadOk) {
          console.log("✅ Upload attempt #3 (single file key) succeeded");
        }
      } catch (err3) {
        const data = err3?.response?.data;
        lastErrorMsg = data?.res_data?.error || data?.res_message || err3.message || lastErrorMsg;
        console.error('Upload attempt #3 (single file key) failed', data || err3);
      }
    }

    if (!uploadOk) {
      console.warn('⚠️ บันทึกรายงานสำเร็จแต่แนบไฟล์ไม่สำเร็จ', lastErrorMsg);
      throw new Error(lastErrorMsg || 'ระบบไม่สามารถแนบไฟล์ได้');
    }

    return uploadedFiles.map(f => ({ name: f.name, success: true }));
  }, [uploadedFiles]);

  // ฟังก์ชันสร้าง request body ตาม format ที่กำหนด - แก้ไข position_id
  const createRequestBody = useCallback(() => {
    const body = {
      position_id: POSITION_FALLBACK,
      reference_number: (form.refNo || "").trim(),
      reference_date: toYMD(form.date),
      subject: (form.subject || "").trim(),
      complaint_number: (form.refNo || "").trim(),
      complaint_number_date: toYMD(form.date2),
      document_number: (form.bookNo || "").trim(),
      document_date: toYMD(form.date2),
      signature_authority_user_id: form.signer,
      department_id: form.department,
      confidentiality_level: form.confidentiality,
      urgency_level: form.urgency,
      remarks: form.note || form.details || "",
      propose_for: form.proposeFor,
      decision: form.decision,
      attachment: form.attachment,
      proposal_purpose: form.proposeFor,
      consideration_result: form.decision,
      complaint_id: complaintId,
    };

    console.log("📦 createRequestBody:", body);
    return body;
  }, [form, complaintId]);

  // ฟังก์ชันบันทึกข้อมูล - แก้ไขให้อัปโหลดไฟล์ด้วย
  const handleSave = useCallback(async () => {
    console.log("💾 handleSave: Starting save process");

    const missingFields = validateRequiredFields();

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields
        .map(({ label }) => label)
        .join(", ");

      console.log("❌ Missing fields:", missingFieldNames);

      alertError(
        "ข้อมูลไม่ครบถ้วน",
        `กรุณากรอกข้อมูลในฟิลด์: ${missingFieldNames}`
      );
      return;
    }

    try {
      setIsLoading(true);
      showLoading("กำลังบันทึกข้อมูล...");

      const requestBody = createRequestBody();
      console.log("🚀 Sending request with body:", requestBody);

      // Step 1: บันทึกข้อมูลหลัก
      const response = await CreateOutgoingReport4(requestBody);
      console.log("✅ Main data saved:", response);

      // Step 2: อัปโหลดไฟล์ (ถ้ามี) 
      if (response && response.id && uploadedFiles.length > 0) {
        console.log("📤 Starting file upload for report ID:", response.id);

        showLoading("กำลังอัปโหลดไฟล์...");
        await uploadFiles(response.id);
        console.log("✅ Files uploaded successfully");
      }

      closeAlert();
      const reportId = response.id;

      const successMessage = `
          <div style="text-align: center; line-height: 1.6;">
            <p style="margin-bottom: 15px; font-size: 16px;">บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว</p>
            <p style="margin-bottom: 10px; color: #666;">รหัสรายงาน: <strong>${reportId}</strong></p>
            <p style="margin-bottom: 10px; color: #666;">เรื่อง: <strong>${form.subject}</strong></p>
            ${uploadedFiles.length > 0
          ? `<p style="color: #666;">ไฟล์แนบ: <strong>${uploadedFiles.map(f => f.name).join(", ")}</strong></p>`
          : ""
        }
          </div>
        `;

      await alertSuccess("บันทึกสำเร็จ!", successMessage, true);
      router.push(`/admin/box/list`);

      // Reset form after successful save
      handleClear();

    } catch (error) {
      closeAlert();
      setIsLoading(false);

      console.error("❌ Save error:", error);

      alertError(
        "เกิดข้อผิดพลาด",
        error?.message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
      );
    }
  }, [form, validateRequiredFields, createRequestBody, uploadFiles, uploadedFiles, handleClear]);

  // ฟังก์ชันสำหรับรีเซ็ตข้อมูลเฉพาะฟิลด์
  const resetField = useCallback((fieldName) => {
    console.log("🔄 resetField:", fieldName);
    setForm((prev) => ({ ...prev, [fieldName]: "" }));
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
  }, []);

  // ฟังก์ชันสำหรับอัพเดทฟิลด์เฉพาะ
  const updateField = useCallback(
    (fieldName, value) => {
      console.log("📝 updateField:", fieldName, "=", value);
      setForm((prev) => ({
        ...prev,
        [fieldName]: value,
        // Sync details and note fields
        ...(fieldName === 'details' && { note: value }),
        ...(fieldName === 'note' && { details: value }),
      }));

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
    ) || uploadedFiles.length > 0;
  }, [form, initialFormState, uploadedFiles]);

  // ฟังก์ชันตรวจสอบว่าฟอร์มพร้อมส่งหรือไม่
  const isFormValid = useCallback(() => {
    return requiredFields.every((field) => {
      const value = form[field];
      return value && value !== "" && value !== null;
    });
  }, [form, requiredFields]);

  // canSave focuses on required-only validation like other forms
  const canSave = useCallback(() => {
    return requiredFields.every((f) => {
      const v = form[f];
      return !(v === undefined || v === null || v === "");
    });
  }, [form, requiredFields]);

  return {
    // State
    form,
    errors,
    isLoading,
    id,
    uploadedFiles, // เพิ่มไฟล์ที่อัปโหลด
    fileInputKey,

    // Validation helpers
    isRequired,
    createLabel,
    getFieldError,
    isFormValid,
    canSave,
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
    createRequestBody,
    uploadFiles, // เพิ่มฟังก์ชันอัปโหลดไฟล์
  };
};

export default useInformRelatedParties;