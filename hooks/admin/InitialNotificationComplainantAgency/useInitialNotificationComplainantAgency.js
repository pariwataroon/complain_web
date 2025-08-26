import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";
import {
  CreateOutgoingReport2,
  UploadOutgoingReportAttachments,
} from "@pages/api/outgoinreports/outgoinreports";

export const useInitialNotificationComplainantAgency = () => {
  const router = useRouter();
  const { id } = router.query;

  // -------- Form state --------
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
    position_id: "",  
    complaint_id: "", 
  });

  // เก็บไฟล์จริง (รองรับหลายไฟล์)
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // -------- Required fields (ตามที่ให้ไว้) --------
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

  // -------- helpers --------
  const isRequired = useCallback(
    (fieldName) => requiredFields.includes(fieldName),
    [requiredFields]
  );

  const createLabel = useCallback(
    (text, fieldName) => (
      <span>
        {text}
        {isRequired(fieldName) && (
          <span style={{ color: "red", marginLeft: 4 }}>*</span>
        )}
      </span>
    ),
    [isRequired]
  );

  const getFieldError = useCallback(
    (fieldName) => errors[fieldName] || null,
    [errors]
  );

  // -------- change handlers --------
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const finalValue =
        typeof value === "object" && value !== null ? value.value || "" : value;

      setForm((prev) => ({ ...prev, [name]: finalValue }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    },
    [errors]
  );

  const handleDateChange = useCallback(
    (thaiDate) => {
      setForm((prev) => ({ ...prev, date: thaiDate }));
      if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
    },
    [errors.date]
  );

  // ---------- รูป: รองรับหลายไฟล์ ----------
  const handleFileUpload = useCallback(
    (input) => {
      let files = [];

      if (!input) {
        setAttachmentFiles([]);
        setForm((prev) => ({ ...prev, attachment: "" }));
        return;
      }

      if (input instanceof File) {
        files = [input];
      } else if (Array.isArray(input) && input[0] instanceof File) {
        files = input;
      } else if (input?.target?.files) {
        files = Array.from(input.target.files);
      } else if (input?.length && input[0] instanceof File) {
        files = Array.from(input);
      } else if (input?.file && input.file instanceof File) {
        files = [input.file];
      } else {
        console.warn("Unsupported file input:", input);
        return;
      }

      setAttachmentFiles(files);
      const names = files.map((f) => f.name).join(", ");
      setForm((prev) => ({ ...prev, attachment: names }));
      if (errors.attachment) setErrors((prev) => ({ ...prev, attachment: null }));
    },
    [errors.attachment]
  );

  // legacy: input[type=file]
  const handleFileChange = useCallback(
    (e) => {
      const files = e?.target?.files ? Array.from(e.target.files) : [];
      setAttachmentFiles(files);
      const names = files.map((f) => f.name).join(", ");
      setForm((prev) => ({ ...prev, attachment: names }));
      if (errors.attachment) setErrors((prev) => ({ ...prev, attachment: null }));
    },
    [errors.attachment]
  );

  // ---------- validate ----------
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
    const missing = [];

    fieldsConfig.forEach(({ field, label }) => {
      const value = form[field];
      if (!value && value !== 0) {
        newErrors[field] = `กรุณากรอก${label}`;
        missing.push({ field, label });
      }
    });

    setErrors(newErrors);
    return missing;
  }, [form]);

  // ---------- helpers ----------
  const toNullString = (v) =>
    v === undefined || v === null || v === "" ? "null" : String(v);

  const toDateISOOrNullString = (value) => {
    if (!value) return "null";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "null" : d.toISOString();
  };

  // แปลง UUID ให้เป็น simple (ตัดขีด) กันเหนียวตาม error ของ API
  const toISOorNull = (v) => (v ? new Date(v).toISOString() : null);
  const nullIfEmpty = (v) => (v === undefined || v === null || v === "" ? null : v);

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
      position_id: "",
      complaint_id: "",
    });
    setAttachmentFiles([]);
    setErrors({});
  }, []);

  // ---------- SAVE ----------
  const handleSave = useCallback(async () => {
    const missing = validateRequiredFields();
    if (missing.length > 0) {
      const names = missing.map((m) => m.label).join(", ");
      alertError("ข้อมูลไม่ครบถ้วน", `กรุณากรอกข้อมูลในฟิลด์: ${names}`);
      return;
    }

    const payload = {
      position_id: form.position_id || "7e18e4fe-d416-4580-b4d4-2a4032f67770",
      complaint_number: form.refNo || "",
      complaint_number_date: toISOorNull(form.date),
      subject: form.subject || "",
      signature_authority_user_id: nullIfEmpty(form.signer),
      department_id: nullIfEmpty(form.department),
      user_id: null,
      confidentiality_level: nullIfEmpty(form.confidentiality),
      urgency_level: nullIfEmpty(form.urgency),
      complaint_id: nullIfEmpty(form.complaint_id),
      remarks: form.note || "",
    };

    try {
      setIsLoading(true);
      showLoading("กำลังบันทึกข้อมูล...");

      // 1) สร้างรายการออกหนังสือ
      const createRes = await CreateOutgoingReport2(payload);

      const resCode = createRes?.res_code ?? createRes?.data?.res_code;
      const resMsg  = createRes?.res_message ?? createRes?.data?.res_message;
      const resErr  = createRes?.res_data?.error ?? createRes?.data?.res_data?.error;
      const isConflict =
          resCode === "4090" || resMsg === "CONFLICT" || String(resErr || "").includes("มีอยู่แล้ว");
      if (isConflict) {
        closeAlert();
        setIsLoading(false);
        await alertError("เลขที่หนังสือซ้ำ", resErr || `เลขที่หนังสือ ${form.refNo || "-"} มีอยู่แล้ว`);
        return; 
      }

      // ไอดีที่สร้าง (รองรับหลายรูปแบบ)
      const createdId =
        createRes?.res_data?.id ??
        createRes?.data?.id ??
        createRes?.id ??
        null;

      // 2) อัปโหลดไฟล์แนบ (ถ้ามีไฟล์และสร้างสำเร็จ)
      if (createdId && attachmentFiles.length > 0) {
        const fd = new FormData();
        // backend ต้องการ key = "files"
+       attachmentFiles.forEach((f) => fd.append("files", f, f.name));
        await UploadOutgoingReportAttachments(fd, createdId);
      }

      closeAlert();
      setIsLoading(false);

      const fileNames =
      attachmentFiles.length > 0
       ? attachmentFiles.map((f) => f.name).join(", ")
        : null;
      const successHtml = `
        <div style="text-align:center;line-height:1.7">
          <p style="margin:6px 0 14px 0;">บันทึกแบบรายงานส่งหน่วยงานที่เกี่ยวข้องเรียบร้อยแล้ว</p>
          <p style="margin:4px 0;color:#666">รหัสรายงาน: <strong>${createdId}</strong></p>
          <p style="margin:4px 0;color:#666">เรื่อง: <strong>${form.subject || "-"}</strong></p>
          ${fileNames ? `<p style="margin:4px 0;color:#666">ไฟล์แนบ: <strong>${fileNames}</strong></p>` : ""}
                </div>
      `;
      await alertSuccess("บันทึกสำเร็จ!", successHtml, true);
    } catch (err) {
      console.error("Save error:", err);
      closeAlert();
      setIsLoading(false);

      const httpStatus = err?.response?.status;
      const data = err?.response?.data;
      const backendMsg = data?.res_data?.error || data?.res_message || data?.message || "";
      if (httpStatus === 409 || data?.res_code === "4090" || String(backendMsg).includes("มีอยู่แล้ว")) {
          await alertError("เลขที่หนังสือซ้ำ", backendMsg || `เลขที่หนังสือ ${form.refNo || "-"} มีอยู่แล้ว`);
        return;
      }
      alertError("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  }, [form, attachmentFiles, validateRequiredFields]);

  // ---------- utilities ----------
  const resetField = useCallback((fieldName) => {
    setForm((prev) => ({ ...prev, [fieldName]: "" }));
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
    if (fieldName === "attachment") setAttachmentFiles([]);
  }, []);

  const updateField = useCallback(
    (fieldName, value) => {
      setForm((prev) => ({ ...prev, [fieldName]: value }));
      if (errors[fieldName]) setErrors((prev) => ({ ...prev, [fieldName]: null }));
    },
    [errors]
  );

  const hasFormChanges = useCallback(() => {
    const initial = {
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
      position_id: "",
      complaint_id: "",
    };
    return Object.keys(initial).some((k) => form[k] !== initial[k]);
  }, [form]);

  const isFormValid = useCallback(
    () =>
      requiredFields.every((f) => {
        const v = form[f];
        return v !== undefined && v !== null && v !== "";
      }),
    [form, requiredFields]
  );

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

    // Utility
    validateRequiredFields,
    resetField,
    updateField,
  };
};

export default useInitialNotificationComplainantAgency;
