import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import {
  alertSuccess,
  alertError,
  showLoading,
  closeAlert,
} from "@utils/Alerts";
import {
  CreateOutgoingReport3,
  UploadOutgoingReportAttachments,
} from "@pages/api/outgoinreports/outgoinreports";
import axiosInstance from "@pages/api/axiosInstance";

// Required fields for validation
const requiredFields = [
  "salutation",
  "refNo",
  "docNo",
  "date",
  "subject",
  "signer",
  "confidentiality",
  "urgency",
  "attachment",
];

// Helper: UUID format checker
const POSITION_FALLBACK = "7e18e4fe-d416-4580-b4d4-2a4032f67770";
const isUUID = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Helper: Parse refNo to Thai date object
const parseRefNoToThaiDate = (val) => {
  if (!val || typeof val !== "string") return null;
  const cleaned = val.trim();
  const m = cleaned.match(/MOF-(\d{8})(?:-\w+)?/i);
  if (!m) return null;
  const raw = m[1];
  if (raw.length !== 8) return null;
  let year = parseInt(raw.slice(0, 4), 10);
  const month = parseInt(raw.slice(4, 6), 10);
  const day = parseInt(raw.slice(6, 8), 10);
  if (!year || !month || !day) return null;
  if (year > 2400) year -= 543;
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return null;
  return {
    day: d.getDate(),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
    buddhistYear: d.getFullYear() + 543,
  };
};

// Helper: Format date to ISO string or null
const toISOorNull = (v) => {
  if (!v) return null;
  try {
    if (typeof v === "object" && v.day && v.month && v.year) {
      return new Date(v.year, v.month - 1, v.day).toISOString();
    }
    return new Date(v).toISOString();
  } catch {
    return null;
  }
};
const nullIfEmpty = (v) =>
  v === undefined || v === null || v === "" ? null : v;

export const useRequestResultProgress = () => {
  const router = useRouter();
  const { id, complaint_id, complaint_number } = router.query;
  const complaintId =
    (Array.isArray(id) ? id[0] : id) ||
    (Array.isArray(complaint_id) ? complaint_id[0] : complaint_id) ||
    null;
  const complaintNumberFromQuery = Array.isArray(complaint_number)
    ? complaint_number[0]
    : complaint_number || "";

  // -------- Form state --------
  const [form, setForm] = useState({
    salutation: "",
    salutation_is_other: false,
    position_other_text: "",
    refNo: complaintNumberFromQuery || "",
    docNo: "",
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
  });

  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0); // For file input reset
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Prefill from query
  useEffect(() => {
    if (complaintNumberFromQuery && !form.refNo) {
      const parsed = parseRefNoToThaiDate(complaintNumberFromQuery);
      setForm((prev) => ({
        ...prev,
        refNo: complaintNumberFromQuery,
        ...(parsed ? { date: parsed } : {}),
      }));
    }
  }, [complaintNumberFromQuery]); // eslint-disable-line

  useEffect(() => {
    if (complaintId && !form.complaint_id) {
      setForm((prev) => ({ ...prev, complaint_id: complaintId }));
    }
  }, [complaintId]);

  // ---- File Input ----
  const resetFileInput = useCallback(() => {
    setAttachmentFiles([]);
    setForm((prev) => ({ ...prev, attachment: "" }));
    setFileInputKey((prevKey) => prevKey + 1);
  }, []);

  // ---- File Change ----
  const handleFileChange = useCallback(
    (fileInput) => {
      if (!fileInput) {
        resetFileInput();
        return;
      }
      let files = [];
      if (fileInput instanceof File) {
        files = [fileInput];
      } else if (fileInput.target && fileInput.target.files) {
        files = Array.from(fileInput.target.files);
      } else if (Array.isArray(fileInput)) {
        files = fileInput.filter((f) => f instanceof File);
      } else if (fileInput.length && fileInput[0] instanceof File) {
        files = Array.from(fileInput);
      } else if (fileInput.file && fileInput.file instanceof File) {
        files = [fileInput.file];
      } else {
        alertError(
          "รูปแบบไฟล์ไม่ถูกต้อง",
          "ไม่สามารถอ่านข้อมูลไฟล์ได้ กรุณาลองใหม่อีกครั้ง"
        );
        return;
      }
      // Validate files
      if (!files.length) {
        alertError("ไม่พบไฟล์", "กรุณาเลือกไฟล์ที่ต้องการอัพโหลด");
        return;
      }
      const maxSize = 10 * 1024 * 1024;
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
      ];
      for (const file of files) {
        if (file.size > maxSize) {
          alertError("ไฟล์ขนาดใหญ่เกินไป", `ไฟล์ ${file.name} มีขนาดเกิน 10MB`);
          return;
        }
        if (!allowedTypes.includes(file.type)) {
          alertError("ประเภทไฟล์ไม่ถูกต้อง", `ไฟล์ ${file.name} ไม่ใช่ประเภทที่รองรับ`);
          return;
        }
      }
      setAttachmentFiles(files);
      const fileNames = files.map((f) => f.name).join(", ");
      setForm((prev) => ({ ...prev, attachment: fileNames }));
    },
    [resetFileInput]
  );

  // ---- Date Change ----
  const handleDateChange = useCallback(
    (date) => {
      setForm((prev) => ({ ...prev, date }));
    },
    []
  );

  // ---- Clear Form ----
  const handleClear = useCallback(() => {
    setForm({
      salutation: "",
      salutation_is_other: false,
      position_other_text: "",
      refNo: "",
      docNo: "",
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
    });
    resetFileInput();
    setErrors({});
  }, [resetFileInput]);

  // ---- Manual Field Error ----
  const getFieldError = useCallback(
    (fieldName) => errors[fieldName] || null,
    [errors]
  );

  // ---- Required ----
  const isRequired = useCallback(
    (fieldName) => requiredFields.includes(fieldName),
    []
  );

  // ---- Label ----
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

  // ---- Change Handler ----
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target ?? {};
      const v = value ?? e?.value ?? e;
      // Special case for refNo
      if (name === "refNo") {
        const parsed = parseRefNoToThaiDate(v);
        setForm((prev) => ({
          ...prev,
          refNo: v,
          ...(parsed ? { date: parsed } : {}),
        }));
        if (errors.refNo) setErrors((prev) => ({ ...prev, refNo: null }));
        if (parsed && errors.date) setErrors((prev) => ({ ...prev, date: null }));
        return;
      }
      // Toggle off 'other' clears text
      if (name === 'salutation_is_other' && !v) {
        setForm((prev) => ({ ...prev, position_other_text: "", salutation_is_other: false }));
        if (errors.position_other_text) setErrors((prev) => ({ ...prev, position_other_text: null }));
        return;
      }
      setForm((prev) => ({ ...prev, [name]: v }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    },
    [errors]
  );

  // ---- Update Field ----
  const updateField = useCallback(
    (fieldName, value) => {
      if (fieldName === "refNo") {
        const parsed = parseRefNoToThaiDate(value);
        setForm((prev) => ({
          ...prev,
          refNo: value,
          ...(parsed ? { date: parsed } : {}),
        }));
        if (errors.refNo) setErrors((prev) => ({ ...prev, refNo: null }));
        if (parsed && errors.date) setErrors((prev) => ({ ...prev, date: null }));
        return;
      }
      setForm((prev) => ({ ...prev, [fieldName]: value }));
      if (errors[fieldName]) setErrors((prev) => ({ ...prev, [fieldName]: null }));
    },
    [errors]
  );

  // ---- Validate ----
  const validateRequiredFields = useCallback((state = form) => {
    const fieldsConfig = [
      { field: "salutation", label: "เรียน" },
      ...(state.salutation_is_other ? [{ field: 'position_other_text', label: 'ตำแหน่ง (อื่นๆ)' }] : []),
      { field: "refNo", label: "เลข สป.กค." },
      { field: "docNo", label: "เลขที่หนังสือ" },
      { field: "date", label: "วันที่" },
      { field: "subject", label: "เรื่อง" },
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

  // ---- Form Valid ----
  const isFormValid = useCallback(
    () => requiredFields.every((f) => form[f] !== undefined && form[f] !== null && form[f] !== "") && (!form.salutation_is_other || !!form.position_other_text),
    [form]
  );

  // canSave similar to Forward page: focus only on required fields and 'อื่นๆ' rule
  const canSave = useCallback(() => {
    const baseOk = requiredFields.every((f) => form[f] !== undefined && form[f] !== null && form[f] !== "");
    const otherOk = !form.salutation_is_other || !!form.position_other_text;
    return baseOk && otherOk;
  }, [form]);

  // ---- SAVE ----
  const handleSave = useCallback(
    async (overrides = {}) => {
      const state = { ...form, ...overrides };
      const candidatePid = state.position_id;
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
      // Build payload
      const deptId = state.department && isUUID(state.department) ? state.department : null;
      const payload = {
        position_id: state.position_id || POSITION_FALLBACK,
        position_other_text: (state.salutation_is_other || state.position_other_text) ? (state.position_other_text || "").trim() : "",
        salutation: state.salutation || "",
        complaint_number: state.refNo || "",
        complaint_number_date: toISOorNull(state.date),
        document_number: state.docNo || "",
        document_date: toISOorNull(state.date),
        subject: state.subject || "เรื่อง ขอทราบผลการพิจารณาเรื่องร้องเรียน",
        signature_authority_user_id: nullIfEmpty(state.signer),
        user_id: null,
        confidentiality_level: nullIfEmpty(state.confidentiality),
        urgency_level: nullIfEmpty(state.urgency),
        complaint_id: nullIfEmpty(state.complaint_id),
        remarks: state.note || "",
      };
      if (deptId) payload.department_id = deptId;

      try {
        setIsLoading(true);
        showLoading("กำลังบันทึกข้อมูล...");

        // 1) Create record
        const createRes = await CreateOutgoingReport3(payload);

        // Error: duplicate
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

        // 2) Upload attachments
        if (createdId && attachmentFiles.length > 0) {
          let uploadOk = false;
          let lastErrorMsg = "";
          // Use UploadOutgoingReportAttachments (generic for all report types)
          const buildFormData = (useSingleKey = false) => {
            const formData = new FormData();
            if (attachmentFiles.length > 1) {
              attachmentFiles.forEach((f) =>
                formData.append(useSingleKey ? "file" : "files", f, f.name)
              );
            } else if (attachmentFiles.length === 1) {
              formData.append(useSingleKey ? "file" : "files", attachmentFiles[0], attachmentFiles[0].name);
            }
            return formData;
          };
          // Attempt 1: multi-files
          try {
            const up1 = await UploadOutgoingReportAttachments(buildFormData(false), createdId);
            uploadOk = !!(up1 && (up1.success === true || up1.res_code === "0001"));
            if (!uploadOk) {
              lastErrorMsg = up1?.res_data?.error || up1?.res_message || up1?.message || "";
            }
          } catch (err1) {
            const data = err1?.response?.data;
            lastErrorMsg = data?.res_data?.error || data?.res_message || err1.message || "";
            console.error("Upload attempt #1 (multi-files) failed", data || err1);
          }
          // Attempt 2: single file key
          if (!uploadOk && attachmentFiles.length === 1) {
            try {
              const up2 = await UploadOutgoingReportAttachments(buildFormData(true), createdId);
              uploadOk = !!(up2 && (up2.success === true || up2.res_code === "0001"));
              if (!uploadOk) {
                lastErrorMsg = up2?.res_data?.error || up2?.res_message || up2?.message || lastErrorMsg;
              }
            } catch (err2) {
              const data = err2?.response?.data;
              lastErrorMsg = data?.res_data?.error || data?.res_message || err2.message || lastErrorMsg;
              console.error("Upload attempt #2 (single key) failed", data || err2);
            }
          }
          // Attempt 3: direct API call if all above fail
          if (!uploadOk) {
            try {
              const up3 = await axiosInstance.post(
                `/outgoing-reports3/${createdId}/attachments`,
                buildFormData(false)
              );
              uploadOk = !!up3?.data;
            } catch (err3) {
              const data = err3?.response?.data;
              lastErrorMsg = data?.res_data?.error || data?.res_message || err3.message || lastErrorMsg;
              console.error("Upload attempt #3 (direct API) failed", data || err3);
            }
          }
          if (!uploadOk) {
            console.warn("⚠️ บันทึกรายงานสำเร็จแต่แนบไฟล์ไม่สำเร็จ", lastErrorMsg);
            await alertError("แนบไฟล์ไม่สำเร็จ", lastErrorMsg || "ระบบไม่สามารถแนบไฟล์ได้ กรุณาลองใหม่");
            // ไม่ throw error, แจ้งเตือนเฉยๆ
          }
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
        handleClear();
      } catch (err) {
        console.error("Save error:", err);
        if (err?.response) {
          console.error("Response status:", err.response.status);
          console.error("Response data:", err.response.data);
        }
        closeAlert();
        setIsLoading(false);

        const httpStatus = err?.response?.status;
        const data = err?.response?.data;
        if (httpStatus === 422) {
          const serverMsg =
            data?.res_data?.error ||
            data?.res_message ||
            data?.message ||
            "Validation error (422)";
          const detail =
            typeof data === "object"
              ? JSON.stringify(data, null, 2)
              : String(data);
          await alertError("ข้อมูลไม่ถูกต้อง (422)", serverMsg + "\n" + detail);
          return;
        }
        const backendMsg =
          data?.res_data?.error ||
          data?.res_message ||
          data?.message ||
          "";
        if (
          httpStatus === 409 ||
          data?.res_code === "4090" ||
          String(backendMsg).includes("มีอยู่แล้ว")
        ) {
          await alertError(
            "เลขที่หนังสือซ้ำ",
            backendMsg || `เลขที่หนังสือ ${form.refNo || "-"} มีอยู่แล้ว`
          );
          return;
        }
        alertError(
          "เกิดข้อผิดพลาด",
          "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
        );
      }
    },
    [form, attachmentFiles, validateRequiredFields, handleClear, router]
  );

  // ---- Form Change ----
  const hasFormChanges = useCallback(() => {
    const initial = {
      salutation: "",
      refNo: "",
      docNo: "",
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
    };
    return Object.keys(initial).some((k) => form[k] !== initial[k]);
  }, [form]);

  return {
    form,
    errors,
    isLoading,
    fileInputKey,
    attachmentFiles,

    isRequired,
    createLabel,
    getFieldError,
    isFormValid,
    canSave,
    hasFormChanges,

    handleChange,
    handleDateChange,
    handleFileChange,
    handleClear,
    handleSave,
    updateField,
    validateRequiredFields,
    resetFileInput,
  };
};

export default useRequestResultProgress;