import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { alertSuccess, alertError, showLoading, closeAlert } from "@utils/Alerts";
import { CreateOutgoingReport3, UploadOutgoingReportAttachments } from "@pages/api/outgoinreports/outgoinreports";

  const POSITION_FALLBACK = "7e18e4fe-d416-4580-b4d4-2a4032f67770";
  const isUUID = (s) =>
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  export const useRequestResultProgress = () => {
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
    department_meta: null,  
    signer_meta: null,       
    refNoDisplay: "",
  });

  // เก็บไฟล์จริง (รองรับหลายไฟล์)
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // -------- Required fields --------
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
  const isRequired = useCallback((fieldName) => requiredFields.includes(fieldName), [requiredFields]);

  const createLabel = useCallback(
    (text, fieldName) => (
      <span>
        {text}
        {isRequired(fieldName) && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
      </span>
    ),
    [isRequired]
  );

  const getFieldError = useCallback((fieldName) => errors[fieldName] || null, [errors]);

  // -------- change handlers --------
  const handleChange = useCallback((e) => {
    const { name, value } = e.target ?? {};
    const v = value ?? e?.value ?? e; // กันเคสที่ lib ส่ง value ตรง ๆ
    const finalValue =
      typeof v === "object" && v !== null
        ? (v.id ?? v.value ?? "")
        : v;

    setForm((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }, [errors]);

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
  const validateRequiredFields = useCallback((state = form) => {
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
      const value = state[field];
      if (!value && value !== 0) {
        newErrors[field] = `กรุณากรอก${label}`;
        missing.push({ field, label });
      }
    });

    setErrors(newErrors);
    return missing;
  }, [form]);

  // ---------- helpers ----------
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
      department_meta: null,
      signer_meta: null,
      refNoDisplay: "",
    });
    setAttachmentFiles([]);
    setErrors({});
  }, []);

  const tryResolvePid = (state) => state.position_id || null;

  // ---------- SAVE ----------
  const handleSave = useCallback(async (overrides = {}) => {
    const state = { ...form, ...overrides };  
    const candidatePid = tryResolvePid(state);
    const finalPid = isUUID(candidatePid) ? candidatePid : POSITION_FALLBACK;
    state.position_id = finalPid;
    const missing = validateRequiredFields(state);
    if (missing.length > 0) {
      const names = missing.map((m) => m.label).join(", ");
      alertError("ข้อมูลไม่ครบถ้วน", `กรุณากรอกข้อมูลในฟิลด์: ${names}`);
      return;
    }

    if (!state.position_id) {
     state.position_id = POSITION_FALLBACK;
    }

    const payload = {
      position_id: state.position_id || POSITION_FALLBACK,
      complaint_number: state.refNo || "",         
      complaint_number_date: toISOorNull(state.date),
      document_number: "",
      document_date: toISOorNull(form.date), 
      subject: state.subject || "เรื่อง ขอทราบผลการพิจารณาเรื่องร้องเรียน",
      signature_authority_user_id: nullIfEmpty(state.signer),
      department_id: nullIfEmpty(state.department),
      user_id: null,
      confidentiality_level: nullIfEmpty(state.confidentiality),
      urgency_level: nullIfEmpty(state.urgency),
      complaint_id: nullIfEmpty(state.complaint_id),
      remarks: state.note || "",
    };
    console.log("DEBUG payload", payload);
    
    try {
      setIsLoading(true);
      showLoading("กำลังบันทึกข้อมูล...");

      // 1) สร้างรายการ (หน้า 3)
      const createRes = await CreateOutgoingReport3(payload);

      // กันเลขซ้ำ (backend ส่ง 4090)
      if (createRes?.res_code === "4090") {
        closeAlert();
        setIsLoading(false);
        return alertError("เลขหนังสือซ้ำ", createRes?.res_data?.error || "เลขหนังสือซ้ำ");
      }

      const createdId =
        createRes?.res_data?.id ??
        createRes?.data?.id ??
        createRes?.id ??
        null;

      // 2) อัปโหลดไฟล์แนบ (ถ้ามีไฟล์และสร้างสำเร็จ)
      if (createdId && attachmentFiles.length > 0) {
        const fd = new FormData();
        // ต้องใช้ key = "files" (ซ้ำ key ได้หลายครั้ง)
        attachmentFiles.forEach((f) => fd.append("files", f, f.name));
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
          router.push(`/admin/box/list`);
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

export default useRequestResultProgress;
